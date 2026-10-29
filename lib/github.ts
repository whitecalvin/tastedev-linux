import {constants,openSync,closeSync,fstatSync,lstatSync,readFileSync} from 'node:fs';
import {writeFile,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {stateRoot} from './runtime-paths.ts';
import {hasErrorCode} from './error-code.ts';
import {withNetworkSettingsLock} from './network-settings.ts';

export type GitHubAccount={login:string;name:string};
type Connection={token:string;account:GitHubAccount};
export type GitHubSnapshot={connected:boolean;account:GitHubAccount|null;version:string};
export type GitHubRepository={id:number;fullName:string;url:string;description:string;private:boolean;archived:boolean;language:string;defaultBranch:string;updatedAt:string};
export type GitHubVerification={account:GitHubAccount;repositoryCount:number;hasMore:boolean;sample:string[]};
export type GitHubRepositoryPage={repositories:GitHubRepository[];nextPage:number|null;version:string};
const fail=(message:string,status=400)=>Object.assign(Error(message),{status});
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const loginPattern=/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/;
const root=()=>join(process.env.LINUX_AUTH_ROOT||stateRoot(),'github');
const version=(value:Connection|null)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function privateDirectory(){const s=lstatSync(root());if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid?.()||(s.mode&0o077))throw fail('GitHub 연결 저장 경로 권한을 확인하세요.',503);}
function stored():Connection|null{
 let fd:number|undefined;
 try{
  privateDirectory();fd=openSync(join(root(),'connection.json'),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  const s=fstatSync(fd);if(!s.isFile()||s.nlink!==1||s.uid!==process.getuid?.()||(s.mode&0o077)||s.size>10000)throw Error();
  const data:unknown=JSON.parse(readFileSync(fd,'utf8'));
  if(!object(data)||typeof data.token!=='string'||!validToken(data.token)||!object(data.account)||typeof data.account.login!=='string'||!loginPattern.test(data.account.login)||typeof data.account.name!=='string')throw Error();
  return {token:data.token,account:{login:data.account.login,name:data.account.name.slice(0,120)}};
 }catch(error){if(hasErrorCode(error,'ENOENT'))return null;throw fail('GitHub 연결 정보를 읽을 수 없습니다. 저장 경로와 권한을 확인하세요.',503);}
 finally{if(fd!==undefined)closeSync(fd);}
}
function validToken(token:string){return /^[a-zA-Z0-9_]{20,4096}$/.test(token);}
export function githubSnapshot():GitHubSnapshot{const value=stored();return {connected:Boolean(value),account:value?.account||null,version:version(value)};}

async function githubRequest(path:string,token:string,body?:unknown,allowMissing=false):Promise<{data:unknown;more:boolean}>{
 let response:Response;
 try{response=await fetch('https://api.github.com'+path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Tastedev-Linux'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});}
 catch{throw fail('GitHub에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도하세요.',502);}
 if(allowMissing&&response.status===404){await response.body?.cancel();return {data:null,more:false};}
 if(!response.ok){
  await response.body?.cancel();
  if(response.status===401)throw fail('GitHub 토큰이 유효하지 않거나 만료되었습니다. 계정을 다시 연결하세요.',422);
  if(response.status===403||response.status===429)throw fail('GitHub 접근 권한 또는 API 요청 제한을 확인하세요. 잠시 후 다시 시도하세요.',429);
  throw fail('GitHub 저장소 정보를 조회하지 못했습니다.',502);
 }
 const reader=response.body?.getReader();if(!reader)throw fail('GitHub 응답을 확인할 수 없습니다.',502);
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw Error();}chunks.push(value);}}
 catch{throw fail('GitHub 응답이 너무 크거나 연결이 중단되었습니다.',502);}
 try{return {data:JSON.parse(Buffer.concat(chunks).toString('utf8')),more:/;\s*rel="next"/.test(response.headers.get('link')||'')};}
 catch{throw fail('GitHub 응답 형식을 확인할 수 없습니다.',502);}
}
export async function verifyGitHub(input:unknown):Promise<GitHubVerification>{
 if(!object(input)||typeof input.token!=='string'||!validToken(input.token)||typeof input.version!=='string')throw fail('GitHub 토큰을 입력하고 연결 정보를 다시 확인하세요.');
 if(version(stored())!==input.version)throw fail('GitHub 연결이 변경되었습니다. 화면을 새로 불러오세요.',409);
 const {data}=await githubRequest('/user',input.token);
 if(!object(data)||typeof data.login!=='string'||!loginPattern.test(data.login))throw fail('GitHub 계정 정보를 확인할 수 없습니다.',502);
 const repos=await githubRequest('/user/repos?per_page=50&sort=updated&direction=desc&page=1',input.token);
 if(!Array.isArray(repos.data)||repos.data.length>50||!repos.data.every(item=>object(item)&&typeof item.full_name==='string'&&item.full_name.length<=140))throw fail('GitHub 저장소 목록 형식을 확인할 수 없습니다.',502);
 if(version(stored())!==input.version)throw fail('확인 중 GitHub 연결이 변경되었습니다. 다시 확인하세요.',409);
 return {account:{login:data.login,name:typeof data.name==='string'?data.name.slice(0,120):''},repositoryCount:repos.data.length,hasMore:repos.more,sample:repos.data.slice(0,3).map(item=>String(item.full_name))};
}
export async function connectGitHub(input:unknown):Promise<GitHubSnapshot>{
 if(!object(input)||typeof input.token!=='string'||!validToken(input.token)||typeof input.version!=='string')throw fail('GitHub 토큰을 입력하고 연결 정보를 다시 확인하세요.');
 if(version(stored())!==input.version)throw fail('GitHub 연결이 변경되었습니다. 화면을 새로 불러오세요.',409);
 const {data}=await githubRequest('/user',input.token);
 if(!object(data)||typeof data.login!=='string'||!loginPattern.test(data.login))throw fail('GitHub 계정 정보를 확인할 수 없습니다.',502);
 if(input.expectedAccount!==undefined&&input.expectedAccount!==data.login)throw fail('확인한 GitHub 계정과 다릅니다. 토큰을 다시 확인하세요.',409);
 const next:Connection={token:input.token,account:{login:data.login,name:typeof data.name==='string'?data.name.slice(0,120):''}};
 return withNetworkSettingsLock(root(),async()=>{
  privateDirectory();if(version(stored())!==input.version)throw fail('GitHub 연결이 변경되었습니다. 화면을 새로 불러오세요.',409);
  const temp=join(root(),'.connection-'+randomUUID());
  try{await writeFile(temp,JSON.stringify(next)+'\n',{flag:'wx',mode:0o600});await rename(temp,join(root(),'connection.json'));}
  finally{await unlink(temp).catch(()=>{});}
  return githubSnapshot();
 });
}
export async function disconnectGitHub(input:unknown):Promise<GitHubSnapshot>{
 if(!object(input)||typeof input.version!=='string')throw fail('GitHub 연결 정보를 다시 확인하세요.');
 return withNetworkSettingsLock(root(),async()=>{privateDirectory();if(version(stored())!==input.version)throw fail('GitHub 연결이 변경되었습니다. 화면을 새로 불러오세요.',409);await unlink(join(root(),'connection.json')).catch(error=>{if(!hasErrorCode(error,'ENOENT'))throw error;});return githubSnapshot();});
}
export async function githubRepositories(page:number,expectedVersion:string):Promise<GitHubRepositoryPage>{
 if(!Number.isInteger(page)||page<1||page>1000)throw fail('저장소 목록 페이지를 확인하세요.');
 const connection=stored();if(!connection)throw fail('먼저 GitHub 계정을 연결하세요.',409);
 if(version(connection)!==expectedVersion)throw fail('GitHub 연결이 변경되었습니다. 화면을 새로 불러오세요.',409);
 const {data,more}=await githubRequest('/user/repos?per_page=50&sort=updated&direction=desc&page='+page,connection.token);
 if(!Array.isArray(data)||data.length>50)throw fail('GitHub 저장소 목록 형식을 확인할 수 없습니다.',502);
 const repositories:GitHubRepository[]=data.map(value=>{
  if(!object(value)||!Number.isSafeInteger(value.id)||Number(value.id)<=0||typeof value.full_name!=='string'||typeof value.private!=='boolean')throw fail('GitHub 저장소 정보를 확인할 수 없습니다.',502);
  const parts=value.full_name.split('/');
  if(parts.length!==2||!loginPattern.test(parts[0])||!/^[a-zA-Z0-9_.-]{1,100}$/.test(parts[1])||['.','..'].includes(parts[1]))throw fail('GitHub 저장소 이름을 확인할 수 없습니다.',502);
  return {id:Number(value.id),fullName:value.full_name,url:'https://github.com/'+value.full_name,description:typeof value.description==='string'?value.description.slice(0,500):'',private:value.private,archived:value.archived===true,language:typeof value.language==='string'?value.language.slice(0,64):'',defaultBranch:typeof value.default_branch==='string'?value.default_branch.slice(0,200):'',updatedAt:typeof value.updated_at==='string'&&Number.isFinite(Date.parse(value.updated_at))?new Date(value.updated_at).toISOString():''};
 });
 if(version(stored())!==expectedVersion)throw fail('조회 중 GitHub 연결이 변경되었습니다. 다시 불러오세요.',409);
 return {repositories,nextPage:more?page+1:null,version:expectedVersion};
}

// Server-only access for an explicitly confirmed build; never returned by an HTTP route.
export async function githubBuildAccess(repository:string,expectedVersion:string){
 const connection=stored();if(!connection||version(connection)!==expectedVersion)throw fail('GitHub 연결이 변경되었습니다. 다시 확인하세요.',409);
 const {data}=await githubRequest('/repos/'+repository,connection.token);
 if(!object(data)||data.full_name!==repository||data.archived===true)throw fail('빌드할 저장소의 접근 권한과 보관 상태를 확인하세요.',403);
 if(version(stored())!==expectedVersion)throw fail('GitHub 연결이 변경되었습니다.',409);
 return {token:connection.token};
}

export async function registerGitHubWebhook(repository:string,expectedVersion:string,url:string,secret:string){
 const access=await githubBuildAccess(repository,expectedVersion);
 const {data}=await githubRequest('/repos/'+repository+'/hooks',access.token,{name:'web',active:true,events:['push'],config:{url,content_type:'json',secret,insecure_ssl:'0'}});
 if(!object(data)||!Number.isSafeInteger(data.id))throw fail('Webhook 등록 결과를 확인할 수 없습니다.',502);
 return Number(data.id);
}

export type GitHubProject={types:string[];status:'detected'|'unknown'|'unavailable';detail:string};
const projectCache=new Map<string,{expires:number;value:GitHubProject}>();
export function classifyGitHubProject(files:string[],manifest:unknown):string[]{
 const names=new Set(files),result:string[]=[];
 const pkg=object(manifest)?manifest:{};
 const dependencies={...(object(pkg.dependencies)?pkg.dependencies:{}),...(object(pkg.devDependencies)?pkg.devDependencies:{})};
 const has=(name:string)=>Object.hasOwn(dependencies,name);
 if(has('next'))result.push('Next.js');
 else if(has('nuxt'))result.push('Nuxt');
 else if(has('@sveltejs/kit'))result.push('SvelteKit');
 else if(has('@angular/core'))result.push('Angular');
 else if(has('astro'))result.push('Astro');
 else if(has('react-native')||has('expo'))result.push(has('expo')?'Expo':'React Native');
 else if(has('react'))result.push('React');
 else if(has('vue'))result.push('Vue');
 else if(has('svelte'))result.push('Svelte');
 else if(names.has('package.json')&&object(manifest))result.push('Node.js');
 if(has('@tauri-apps/api')||has('@tauri-apps/cli'))result.push('Tauri');
 if(has('electron'))result.push('Electron');
 if(pkg.workspaces||names.has('pnpm-workspace.yaml')||names.has('lerna.json'))result.push('모노레포');
 if(names.has('Cargo.toml'))result.push('Rust');
 if(names.has('go.mod'))result.push('Go');
 if(['pyproject.toml','requirements.txt','setup.py','Pipfile'].some(name=>names.has(name)))result.push('Python');
 if(names.has('pom.xml')||names.has('build.gradle')||names.has('build.gradle.kts'))result.push('JVM');
 if(files.some(name=>/\.(csproj|fsproj|sln|slnx)$/.test(name)))result.push('.NET');
 if(names.has('composer.json'))result.push('PHP');
 if(names.has('Gemfile'))result.push('Ruby');
 if(names.has('pubspec.yaml'))result.push('Dart / Flutter');
 if(!result.length&&names.has('index.html'))result.push('정적 웹');
 return result;
}
export async function githubProject(repository:string,expectedVersion:string,revision=''):Promise<GitHubProject>{
 if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(repository)||['.','..'].includes(repository.split('/')[1])||revision.length>100)throw fail('저장소 이름을 확인하세요.');
 const connection=stored();if(!connection||version(connection)!==expectedVersion)throw fail('GitHub 연결이 변경되었습니다. 다시 확인하세요.',409);
 const key=expectedVersion+':'+repository+':'+revision,cached=projectCache.get(key);
 if(cached&&cached.expires>Date.now())return cached.value;
 let result:GitHubProject;
 try{
  const {data}=await githubRequest('/repos/'+repository+'/contents/',connection.token,undefined,true);
  if(data===null)result={types:[],status:'unavailable',detail:'빈 저장소이거나 파일 조회 권한이 없습니다. 비공개 저장소는 Contents 읽기 권한을 확인하세요.'};
  else{
   if(!Array.isArray(data)||data.length>1000)throw fail('프로젝트 파일 목록을 확인할 수 없습니다.',502);
   const files=data.filter(item=>object(item)&&item.type==='file'&&typeof item.name==='string').map(item=>String(item.name));
   let manifest:unknown=null;
   if(files.includes('package.json')){
    const response=await githubRequest('/repos/'+repository+'/contents/package.json',connection.token);
    const item=response.data;
    if(!object(item)||item.type!=='file'||item.encoding!=='base64'||typeof item.content!=='string'||Number(item.size)>256*1024)throw fail('package.json 형식을 확인할 수 없습니다.',502);
    try{manifest=JSON.parse(Buffer.from(item.content,'base64').toString('utf8'));}catch{throw fail('package.json 형식을 확인할 수 없습니다.',502);}
   }
   const types=classifyGitHubProject(files,manifest);
   result={types,status:types.length?'detected':'unknown',detail:types.length?'기본 브랜치의 루트 프로젝트 파일 기준':'루트에서 지원하는 프로젝트 파일을 찾지 못했습니다. 하위 폴더의 프로젝트는 포함하지 않습니다.'};
  }
 }catch(error){
  const status=(error as {status?:number}).status;
  if(status===429||status===422)throw error;
  result={types:[],status:'unavailable',detail:error instanceof Error?error.message:'프로젝트 종류를 확인하지 못했습니다.'};
 }
 if(version(stored())!==expectedVersion)throw fail('조회 중 GitHub 연결이 변경되었습니다. 다시 불러오세요.',409);
 if(projectCache.size>=1000)projectCache.delete(projectCache.keys().next().value!);
 projectCache.set(key,{expires:Date.now()+5*60*1000,value:result});return result;
}
