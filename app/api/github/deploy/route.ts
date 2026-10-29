import {githubDeploymentAppId} from '../../../../lib/github-deploy-input.ts';
import {cookieSession} from '../../../../lib/auth.ts';
import {deploymentJobs,startGitHubBuild,deployGitHubBuild} from '../../../../lib/github-deploy.ts';
import {webhookSettings,configureGitHubWebhook} from '../../../../lib/github-webhooks.ts';
import {auditEvent} from '../../../../lib/security.ts';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function failure(e:unknown){const error=e as {status?:number;code?:string;message?:string};return reply({error:typeof error.status==='number'?error.message:error.code==='ENOENT'?'빌드 기록 또는 파일을 찾을 수 없습니다.':'요청을 처리하지 못했습니다. 서버 기록을 확인하세요.'},error.status??500);}
export async function GET(request:Request){try{if(!await cookieSession(request))return reply({error:'로그인이 필요합니다.'},401);const p=new URL(request.url).searchParams,repository=p.get('repository')||undefined;return reply({webhookId:repository?githubDeploymentAppId(repository):null,jobs:await deploymentJobs(repository),webhook:repository?await webhookSettings(repository):null});}catch(e){return failure(e);}}
export async function POST(request:Request){
 try{if(!await cookieSession(request))return reply({error:'로그인이 필요합니다.'},401);
 const url=new URL(request.url),origin=request.headers.get('origin');if(request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==url.protocol+'//'+(request.headers.get('host')||url.host))return reply({error:'다른 사이트의 요청은 허용하지 않습니다.'},403);
 const reader=request.body?.getReader();if(!reader)return reply({error:'요청 내용이 필요합니다.'},400);const chunks:Uint8Array[]=[];let size=0;while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>65536){await reader.cancel();return reply({error:'요청이 너무 큽니다.'},413);}chunks.push(v.value);}let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply({error:'JSON 형식을 확인하세요.'},400);}
 if(!data||typeof data!=='object'||Array.isArray(data)||data.confirm!==true)return reply({error:'서버에서 저장소 코드 실행을 확인하세요.'},400);
 const result=data.action==='build'?await startGitHubBuild(data):data.action==='deploy'?await deployGitHubBuild(data.id):data.action==='webhook'?await configureGitHubWebhook(data):null;
 if(!result)return reply({error:'지원하지 않는 배포 작업입니다.'},400);
 try{await auditEvent('github-'+data.action,'requested',true);}catch{console.error('[LINUX] Deployment audit write failed');}return reply(result,data.action==='build'?202:200);
 }catch(e){return failure(e);}
}
