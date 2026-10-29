import {randomBytes} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {deploymentDirectory,readDeploymentJson,writeDeploymentJson,startGitHubBuild,deployGitHubBuild,assertBuildPermission} from './github-deploy.ts';
import {githubBuildInput,githubDeploymentAppId,githubPushMatches,verifyGitHubSignature,type GitHubBuildInput} from './github-deploy-input.ts';
import {registerGitHubWebhook,githubSnapshot} from './github.ts';
import {withNetworkSettingsLock} from './network-settings.ts';
import {assertFeature} from './security.ts';
type WebhookRecord={input:GitHubBuildInput;secret:string;enabled:boolean;autoDeploy:boolean;remoteId:number|null;url:string;events:WebhookEvent[]};
export type WebhookEvent={delivery:string;at:string;result:string;jobId?:string};
const fail=(message:string,status=400)=>Object.assign(Error(message),{status});
async function hookLock<T>(base:string,work:()=>Promise<T>):Promise<T>{for(let n=0;;n++){try{return await withNetworkSettingsLock(base,work);}catch(e){if((e as {status?:number}).status!==409||n>=9)throw e;await new Promise(r=>setTimeout(r,25));}}}
const validId=(id:string)=>/^gh-[a-f0-9]{24}$/.test(id);
async function directory(){const root=join(await deploymentDirectory(),'hooks');await mkdir(root,{mode:0o700,recursive:true});return root;}
async function record(id:string){if(!validId(id))throw fail('Webhook을 찾을 수 없습니다.',404);return readDeploymentJson<WebhookRecord>(join(await directory(),id+'.json'));}
function view(id:string,data:WebhookRecord){return {id,repository:data.input.repository,branch:data.input.branch,directory:data.input.directory,port:data.input.port,enabled:data.enabled,autoDeploy:data.autoDeploy,remoteId:data.remoteId,url:data.url,events:data.events};}
export async function webhookSettings(repository:string){const id=githubDeploymentAppId(repository);try{return view(id,await record(id));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
export async function configureGitHubWebhook(value:unknown){
 const v=value as Record<string,unknown>;if(v?.confirm!==true||typeof v.enabled!=='boolean'||typeof v.autoDeploy!=='boolean')throw fail('Webhook 실행 설정을 확인하세요.');
 if(v.enabled)await assertBuildPermission();else await assertFeature('fileEditing');
 if(v.enabled&&v.autoDeploy)await assertFeature('serviceChanges',{sudo:true});
 const input=githubBuildInput(v),id=githubDeploymentAppId(input.repository),base=await directory();let url:URL;try{url=new URL(String(v.url));}catch{throw fail('외부에서 접근할 Webhook URL을 입력하세요.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/api/github/webhooks/'+id)throw fail('Webhook 주소의 경로·인증 정보·쿼리를 확인하세요.');
 return hookLock(base,async()=>{let previous:WebhookRecord|null=null;try{previous=await record(id);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const secret=previous?.secret??randomBytes(32).toString('hex');
  const next:WebhookRecord={input,secret,enabled:v.enabled as boolean,autoDeploy:v.enabled===true&&v.autoDeploy===true,remoteId:previous?.remoteId??null,url:url.href,events:previous?.events??[]};
  if(v.register===true){if(previous?.remoteId)throw fail('이미 GitHub에 등록됐습니다. GitHub 저장소 Webhooks에서 주소를 수정하거나 별도 Webhook을 관리하세요.',409);next.remoteId=await registerGitHubWebhook(input.repository,input.version,url.href,secret);}
  await writeDeploymentJson(join(base,id+'.json'),next);return {...view(id,next),...(!previous?{secret}: {})};
 });
}
export async function receiveGitHubWebhook(id:string,body:Buffer,headers:Headers){
 const data=await record(id);
 if(!verifyGitHubSignature(data.secret,body,headers.get('x-hub-signature-256')))throw fail('Webhook 서명이 올바르지 않습니다.',401);
 const delivery=headers.get('x-github-delivery');if(!delivery||!(/^[a-zA-Z0-9-]{8,100}$/).test(delivery))throw fail('Webhook 전송 ID가 필요합니다.');
 const event=headers.get('x-github-event');if(event==='ping')return {accepted:true,ping:true};
 if(event!=='push')return {accepted:false,ignored:'지원하는 이벤트는 push입니다.'};
 let payload:unknown;try{payload=JSON.parse(body.toString('utf8'));}catch{throw fail('Webhook JSON 형식이 올바르지 않습니다.');}
 if(!data.enabled||!githubPushMatches(payload,data.input.repository,data.input.branch))return {accepted:false,ignored:'비활성 상태이거나 선택한 저장소·브랜치의 push가 아닙니다.'};
 await assertBuildPermission();if(data.autoDeploy)await assertFeature('serviceChanges',{sudo:true});
 const base=await directory();let duplicate=false;
 await hookLock(base,async()=>{const current=await record(id);if(!current.enabled||!githubPushMatches(payload,current.input.repository,current.input.branch))throw fail('Webhook 설정이 변경되었습니다.',409);if(current.events.some(e=>e.delivery===delivery)){duplicate=true;return;}current.events=[{delivery,at:new Date().toISOString(),result:'접수'},...current.events].slice(0,256);await writeDeploymentJson(join(base,id+'.json'),current);});
 if(duplicate)return {accepted:true,duplicate:true};
 // Return immediately; build execution and result recording continue in the app process.
 void (async()=>{let result='실패',jobId:string|undefined;try{const latest=await record(id);if(!latest.enabled||!githubPushMatches(payload,latest.input.repository,latest.input.branch)||latest.input.version!==githubSnapshot().version)throw Error('Webhook 또는 GitHub 연결이 변경되었습니다. 설정을 저장하세요.');const job=await startGitHubBuild(latest.input);jobId=job.id;result='빌드 시작';
   {const {deploymentJob}=await import('./github-deploy.ts');while(true){await new Promise(r=>setTimeout(r,1000));const built=await deploymentJob(job.id);if(built.state==='building')continue;if(built.state!=='ready')throw Error('자동 빌드에 실패했습니다. 빌드 로그를 확인하세요.');if(!latest.autoDeploy){result='빌드 완료';break;}const current=await record(id);if(!current.enabled||!current.autoDeploy)throw Error('자동 배포가 꺼져 배포를 중단했습니다.');await deployGitHubBuild(job.id);result='배포 완료';break;}}
  }catch(e){result=e instanceof Error?e.message:'Webhook 실행 실패';}
  try{await hookLock(base,async()=>{const current=await record(id);current.events=current.events.map(e=>e.delivery===delivery?{...e,result,jobId}:e);await writeDeploymentJson(join(base,id+'.json'),current);});}catch{console.error('[LINUX] Webhook result record unavailable');}
 })();
 return {accepted:true};
}
