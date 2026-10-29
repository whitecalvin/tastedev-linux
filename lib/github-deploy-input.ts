import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export type GitHubBuildInput={repository:string;branch:string;directory:string;port:number;environment:string;version:string};
const fail=(message:string)=>{throw Object.assign(Error(message),{status:400});};
export function githubRepositoryName(value:unknown):string{
 if(typeof value!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/).test(value)||['.','..'].includes(value.split('/')[1]))fail('GitHub 저장소를 선택하세요.');return value as string;
}
export function githubBuildInput(value:unknown):GitHubBuildInput{
 const v=value as Record<string,unknown>;
 if(!v||typeof v!=='object'||Array.isArray(v))fail('빌드 설정을 확인하세요.');
 const repository=githubRepositoryName(v.repository);
 if(typeof v.branch!=='string'||!(/^[A-Za-z0-9][A-Za-z0-9_./-]{0,199}$/).test(v.branch)||v.branch.includes('..')||v.branch.includes('//')||v.branch.endsWith('/')||v.branch.endsWith('.lock'))fail('브랜치 이름을 확인하세요.');
 const directory=v.directory??'';
 if(typeof directory!=='string'||directory.length>200||directory!==''&&(!(/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/).test(directory)||directory.split('/').some(p=>p==='.'||p==='..')))fail('프로젝트 하위 폴더를 확인하세요.');
 if(typeof v.port!=='number'||!Number.isInteger(v.port)||v.port<1024||v.port>65535||[8787,8791,8792].includes(v.port))fail('앱 포트는 관리 앱 포트를 제외한 1024~65535로 입력하세요.');
 const environment=v.environment??'';
 if(typeof environment!=='string'||Buffer.byteLength(environment)>32768||environment.includes('\0'))fail('환경 변수는 32KiB 이하로 입력하세요.');
 for(const line of (environment as string).split(/\r?\n/)){if(!line.trim()||line.trim().startsWith('#'))continue;if(!/^[A-Za-z_][A-Za-z0-9_]*=/.test(line))fail('환경 변수는 KEY=value 형식으로 한 줄씩 입력하세요.');const key=line.split('=')[0];if(['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH','PATH','HOME','PORT','HOSTNAME','NODE_ENV'].includes(key)||key.startsWith('LINUX_')||key.startsWith('GIT_')||key.startsWith('npm_'))fail('런타임·관리 앱 환경 변수는 지정할 수 없습니다.');}
 if(typeof v.version!=='string'||!(/^[a-f0-9]{64}$/).test(v.version))fail('GitHub 연결을 다시 확인하세요.');
 return {repository,branch:v.branch as string,directory:directory as string,port:v.port as number,environment:environment as string,version:v.version as string};
}
export function githubDeploymentAppId(repository:string){return 'gh-'+createHash('sha256').update(githubRepositoryName(repository)).digest('hex').slice(0,24);}
export function verifyGitHubSignature(secret:string,body:Buffer,signature:string|null){if(!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;return timingSafeEqual(Buffer.from(signature.slice(7),'hex'),createHmac('sha256',secret).update(body).digest());}
export function githubPushMatches(payload:unknown,repository:string,branch:string){const v=payload as {repository?:{full_name?:unknown};ref?:unknown;deleted?:unknown};return Boolean(v&&v.repository?.full_name===repository&&v.ref==='refs/heads/'+branch&&v.deleted!==true);}
