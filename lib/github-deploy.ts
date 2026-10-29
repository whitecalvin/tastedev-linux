import {mkdir,lstat,open,rename,readdir,writeFile,realpath,readFile,chmod} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {nodeAppServiceStatus} from './node-app-service-status.ts';
import {stateRoot} from './runtime-paths.ts';
import {githubBuildAccess} from './github.ts';
import {githubBuildInput,githubDeploymentAppId,type GitHubBuildInput} from './github-deploy-input.ts';
import {assertFeature} from './security.ts';
import {nodeApps,saveNodeApp} from './node-apps.ts';
import {nodeAppServicePlan} from './node-app-service-plan.ts';
import {prepareNodeServiceInstall,prepareNodeServiceControl,prepareNodeServiceInspection} from './node-app-service-request.ts';
import {runHelper} from './privilege.ts';
export type GitHubBuildJob={id:string;repository:string;branch:string;directory:string;port:number;appId:string;createdAt:string;state:'building'|'ready'|'failed'|'deploying'|'deployed'|'interrupted';stage:string;log:string;commit:string;notice:string};
type StoredJob=GitHubBuildJob&{owner:string};
const root=()=>join(stateRoot(),'github-deployments');
const fail=(message:string,status=400)=>Object.assign(Error(message),{status});
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
const runtimeKey=Symbol.for('tastedev.github-build-runtime');
const globalRuntime=globalThis as typeof globalThis&{[runtimeKey]?:{owner:string;busy:Set<string>;jobs:Map<string,StoredJob>}};
const runtime=globalRuntime[runtimeKey]??= {owner:randomUUID(),busy:new Set(),jobs:new Map()};
export async function deploymentDirectory(){await mkdir(root(),{recursive:true,mode:0o700});const s=await lstat(root());if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid?.()||(s.mode&0o077))throw fail('배포 저장 경로 권한을 확인하세요.',403);return root();}
export async function readDeploymentJson<T>(file:string):Promise<T>{const f=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const s=await f.stat();if(!s.isFile()||s.nlink!==1||s.uid!==process.getuid?.()||(s.mode&0o077)||s.size>2*1024*1024)throw fail('배포 기록 권한을 확인하세요.',403);return JSON.parse(await f.readFile('utf8')) as T;}finally{await f.close();}}
export async function writeDeploymentJson(file:string,data:unknown){const tmp=file+'.'+randomUUID();await writeFile(tmp,JSON.stringify(data),{flag:'wx',mode:0o600});await rename(tmp,file);}
const jobPath=(id:string)=>join(root(),'jobs',id);
async function save(job:StoredJob){await writeDeploymentJson(join(jobPath(job.id),'job.json'),job);}
function publicJob(job:StoredJob):GitHubBuildJob{const {owner,...safe}=job;return safe;}
export async function deploymentJobs(repository?:string){await deploymentDirectory();await mkdir(join(root(),'jobs'),{mode:0o700,recursive:true});const names=(await readdir(join(root(),'jobs'))).filter(uuid);const results:GitHubBuildJob[]=[];for(const name of names){const job=runtime.jobs.get(name)??await readDeploymentJson<StoredJob>(join(jobPath(name),'job.json'));if(repository&&job.repository!==repository)continue;if(['building','deploying'].includes(job.state)&&job.owner!==runtime.owner){job.state='interrupted';job.notice='관리 앱이 재시작되어 작업이 중단되었습니다. 실행 상태를 확인하고 다시 시도하세요.';await save(job);}results.push(publicJob(job));}return results.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,30);}
export async function deploymentJob(id:unknown){if(!uuid(id))throw fail('빌드 기록을 선택하세요.');await deploymentDirectory();return runtime.jobs.get(id)??readDeploymentJson<StoredJob>(join(jobPath(id),'job.json'));}
export async function assertBuildPermission(){if(process.getuid?.()===0)throw fail('빌드는 일반 서버 계정으로 실행해야 합니다.',403);await assertFeature('terminal');await assertFeature('fileEditing');}
function scrub(text:string,secrets:string[]){for(const secret of secrets.filter(v=>v.length>=4))text=text.split(secret).join('[숨김]');return text.replace(/github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+/g,'[숨김]');}
async function build(job:StoredJob,input:GitHubBuildInput,token:string){
 const release=join(jobPath(job.id),'source'),home=join(jobPath(job.id),'home');
 const secrets=[token,Buffer.from('x-access-token:'+token).toString('base64'),...input.environment.split(/\r?\n/).filter(line=>line.includes('=')).map(line=>line.slice(line.indexOf('=')+1).replace(/^['"]|['"]$/g,''))];
 let tail='';const append=(chunk:string)=>{const cleaned=scrub(tail+chunk,secrets);const reserve=Math.max(4096,...secrets.map(v=>v.length));if(cleaned.length>reserve){job.log=(job.log+cleaned.slice(0,-reserve)).slice(-120000);tail=cleaned.slice(-reserve);}else tail=cleaned;};
 const env:NodeJS.ProcessEnv={NODE_ENV:'development',PATH:'/usr/local/bin:/usr/bin:/bin',HOME:home,LANG:'C.UTF-8',CI:'1',NEXT_TELEMETRY_DISABLED:'1',npm_config_cache:join(home,'npm-cache'),TMPDIR:join(home,'tmp'),TMP:join(home,'tmp'),TEMP:join(home,'tmp')};
 async function command(bin:string,args:string[],cwd:string,extra:Record<string,string>={},limit=600000){
  await assertBuildPermission();job.stage=bin==='git'?'저장소 가져오기':args[0]==='ci'?'의존성 설치':'Next.js 빌드';job.log+='\n$ '+bin+' '+args.join(' ')+'\n';await save(job);
  await new Promise<void>((ok,no)=>{const runner=`const {spawn}=require('node:child_process');const [bin,args,limit]=JSON.parse(process.argv[1]);const child=spawn(bin,args,{stdio:['ignore','pipe','pipe'],detached:true});const stop=()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}};process.stdin.resume();process.stdin.on('end',stop);process.on('SIGTERM',stop);const timer=setTimeout(stop,limit);child.stdout.pipe(process.stdout);child.stderr.pipe(process.stderr);child.on('error',()=>process.exit(1));child.on('close',code=>{clearTimeout(timer);process.exit(code??1)});`;const child=spawn(process.execPath,['-e',runner,JSON.stringify([bin,args,limit])],{cwd,env:{...env,...extra},stdio:['pipe','pipe','pipe']});let done=false;const stop=()=>{child.stdin.end();};const timer=setTimeout(()=>{stop();},limit);const onError=(e:Error)=>{if(done)return;done=true;clearTimeout(timer);no(e);};child.stdout.on('data',data=>append(data.toString()));child.stderr.on('data',data=>append(data.toString()));child.once('error',onError);child.once('close',code=>{if(done)return;done=true;clearTimeout(timer);job.log=(job.log+scrub(tail,secrets)).slice(-120000);tail='';code===0?ok():no(fail('명령이 실패했거나 제한 시간을 초과했습니다. 로그를 확인하세요.'));});});
 }
 try{
  await mkdir(join(home,'tmp'),{recursive:true,mode:0o700});
  await command('git',['-c','core.hooksPath=/dev/null','-c','protocol.file.allow=never','clone','--depth','1','--single-branch','--branch',input.branch,'--','https://github.com/'+input.repository+'.git',release],jobPath(job.id),{GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64')},120000);
  const project=resolve(release,input.directory),actual=await realpath(project);if(actual!==project||relative(release,actual).startsWith('..'))throw fail('프로젝트 폴더가 저장소 밖을 가리킵니다.');
  // No symlinked build/config entry or environment destination is accepted.
  for(const file of ['package.json','package-lock.json']){const s=await lstat(join(project,file));if(!s.isFile()||s.isSymbolicLink()||s.size>20*1024*1024)throw fail('npm package.json과 package-lock.json 파일이 필요합니다.');}
  const pkg=JSON.parse(await readFile(join(project,'package.json'),'utf8'));
  if(!pkg.dependencies?.next&&!pkg.devDependencies?.next||typeof pkg.scripts?.build!=='string')throw fail('Next.js 의존성과 build 스크립트가 있는 npm 프로젝트를 선택하세요.');
  const envFile=join(project,'.env.production');try{const s=await lstat(envFile);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1)throw fail('환경 파일은 일반 파일이어야 합니다.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  await writeFile(envFile,input.environment+'\n',{mode:0o600});await chmod(envFile,0o600);
  await command('npm',['ci','--include=dev','--no-audit','--no-fund'],project);
  await command('npm',['run','build'],project,{NODE_ENV:'production'},1200000);
  const built=await lstat(join(project,'.next','BUILD_ID'));if(!built.isFile()||built.isSymbolicLink())throw fail('Next.js 서버 빌드 결과가 없습니다. 정적 export는 현재 지원하지 않습니다.');
  const nextCli=await realpath(join(project,'node_modules','next','dist','bin','next'));if(relative(release,nextCli).startsWith('..'))throw fail('Next.js 실행 파일 경로를 확인하세요.');
  const git=await readFile(join(release,'.git','packed-refs'),'utf8').catch(()=> '');job.commit=git.match(/^[a-f0-9]{40}(?= refs\/remotes\/origin\/)/m)?.[0]||'';
  const entry=join(project,'tastedev-next-server.mjs');try{await lstat(entry);throw fail('예약 실행 파일 tastedev-next-server.mjs가 이미 있습니다.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  await writeFile(entry,`import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {nodeAppServiceStatus} from './node-app-service-status.ts';\nconst child=spawn(process.execPath,[${JSON.stringify(nextCli)},'start','--hostname','127.0.0.1','--port',${JSON.stringify(String(input.port))}],{cwd:${JSON.stringify(project)},stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});\nfor(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));\nchild.once('error',()=>process.exit(1));child.once('exit',code=>process.exit(code??1));\n`,{flag:'wx',mode:0o600});
  await writeDeploymentJson(join(jobPath(job.id),'input.json'),input);
  job.state='ready';job.stage='빌드 완료';job.notice='배포 버튼으로 서비스를 설치·재시작할 수 있습니다. 외부 공개는 nginx에서 별도로 연결하세요.';
 }catch(e){job.state='failed';job.stage='빌드 실패';job.notice=scrub(e instanceof Error?e.message:'빌드에 실패했습니다.',secrets);}
 finally{job.log=(job.log+scrub(tail,secrets)).slice(-120000);try{await save(job);}finally{runtime.busy.delete(job.appId);runtime.jobs.delete(job.id);}}
}
export async function startGitHubBuild(value:unknown){
 await assertBuildPermission();const input=githubBuildInput(value),appId=githubDeploymentAppId(input.repository);
 if(runtime.busy.has(appId)||runtime.busy.size>=2)throw fail('이 저장소의 작업 또는 다른 두 빌드가 진행 중입니다.',409);
 runtime.busy.add(appId);
 try{
  const access=await githubBuildAccess(input.repository,input.version);await deploymentDirectory();await mkdir(join(root(),'jobs'),{recursive:true,mode:0o700});
  if((await readdir(join(root(),'jobs'))).length>=100)throw fail('빌드 기록이 100개입니다. 서버 관리자가 보존 정책을 확인해야 합니다.',409);
  const id=randomUUID();await mkdir(jobPath(id),{mode:0o700});const job:StoredJob={id,repository:input.repository,branch:input.branch,directory:input.directory,port:input.port,appId,createdAt:new Date().toISOString(),state:'building',stage:'빌드 준비',log:'',commit:'',notice:'',owner:runtime.owner};await save(job);runtime.jobs.set(id,job);
  void build(job,input,access.token).catch(()=>{runtime.busy.delete(appId);runtime.jobs.delete(id);});return publicJob(job);
 }catch(e){runtime.busy.delete(appId);throw e;}
}
export async function deployGitHubBuild(id:unknown){
 await assertFeature('serviceChanges',{sudo:true});await assertFeature('fileEditing');const job=await deploymentJob(id);
 if(!['ready','deployed'].includes(job.state)||runtime.busy.has(job.appId))throw fail('완료된 빌드를 선택하고 진행 중인 작업을 기다리세요.',409);
 const previous=(await nodeApps()).apps.find(v=>v.id===job.appId);if(runtime.busy.has(job.appId))throw fail('다른 배포가 진행 중입니다.',409);
 runtime.busy.add(job.appId);job.state='deploying';job.owner=runtime.owner;runtime.jobs.set(job.id,job);let registryChanged=false;
 try{await save(job);
  const input=await readDeploymentJson<GitHubBuildInput>(join(jobPath(job.id),'input.json'));
  const portFree=await new Promise<boolean>(resolve=>{const server=createServer();server.once('error',()=>resolve(false));server.listen(input.port,'127.0.0.1',()=>server.close(()=>resolve(true)));});
  if(!portFree){const status=previous?await nodeAppServiceStatus(job.appId):null;if(!status||!('ActiveState' in status)||status.ActiveState!=='active')throw fail('선택한 포트를 다른 프로세스가 사용 중입니다. 다른 포트를 선택하세요.',409);}
  const registry=await nodeApps(),project=resolve(jobPath(job.id),'source',input.directory),managed=join(root(),'apps',job.appId);
  if(previous&&previous.directory!==managed)throw fail('이 앱 ID에 다른 경로가 등록돼 있습니다. Node.js 서비스 등록을 확인하세요.',409);
  for(const directory of [join(root(),'apps'),managed]){await mkdir(directory,{recursive:true,mode:0o700});const s=await lstat(directory);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid?.()||(s.mode&0o077))throw fail('앱 실행 경로 권한을 확인하세요.',403);}
  for(const [source,target] of [['tastedev-next-server.mjs','server.mjs'],['.env.production','.env.production']]){
   const handle=await open(join(project,source),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);let bytes:Buffer;
   try{const s=await handle.stat();if(!s.isFile()||s.nlink!==1||s.uid!==process.getuid?.()||(s.mode&0o077)||s.size>1048576)throw fail('빌드 실행 파일 권한을 확인하세요.',403);bytes=await handle.readFile();}finally{await handle.close();}
   const temp=join(managed,'.'+randomUUID());await writeFile(temp,bytes,{flag:'wx',mode:0o600});await rename(temp,join(managed,target));
  }
  await saveNodeApp({version:registry.version,profile:{id:job.appId,label:job.repository,directory:managed,entry:'server.mjs',environmentFile:'.env.production'}});registryChanged=true;
  const inspection=await runHelper('node-service-inspect',await prepareNodeServiceInspection(job.appId));
  const plan=await nodeAppServicePlan(job.appId,inspection.registered===true?inspection.serviceOptions:{}),review={id:plan.id,registryVersion:plan.registryVersion,files:plan.files,options:plan.serviceOptions,confirm:true};
  const payload=await prepareNodeServiceInstall(review);
  const result=inspection.registered===true?await runHelper('node-service-update',{...payload,unitVersion:inspection.unitVersion}):await runHelper('node-service-install',payload);
  if(result.failed)throw fail('서비스 설치·변경에 실패했습니다. Node.js 서비스 복구 화면을 확인하세요.',409);
  await runHelper('node-service-control',await prepareNodeServiceControl({...review,operation:'restart'}));
  let healthy=false;for(let n=0;n<10;n++){try{const response=await fetch('http://127.0.0.1:'+input.port+'/',{redirect:'manual',signal:AbortSignal.timeout(2000)});await response.body?.cancel();if(response.status<500){await new Promise(r=>setTimeout(r,1000));const status=await nodeAppServiceStatus(job.appId);if('ActiveState' in status&&status.ActiveState==='active'){healthy=true;break;}}}catch{}await new Promise(r=>setTimeout(r,500));}
  if(!healthy)throw fail('배포 후 HTTP 응답을 확인하지 못했습니다. 이전 빌드를 선택해 다시 배포하거나 Node.js 서비스 로그를 확인하세요.',409);
  job.state='deployed';job.stage='배포 완료';job.notice='127.0.0.1:'+input.port+'에서 응답을 확인했습니다. 자동 시작은 Node.js 서비스 화면에서 설정하세요.';
 }catch(e){job.state='ready';job.stage='배포 확인 필요';job.notice=e instanceof Error?e.message:'배포에 실패했습니다.';
  // Keep the registry aligned with the candidate unit after an attempted update.
  if(registryChanged&&previous)job.notice+=' 이전 서비스 경로: '+previous.directory;
  throw e;
 }finally{try{await save(job);}finally{runtime.busy.delete(job.appId);runtime.jobs.delete(job.id);}}
 return publicJob(job);
}
