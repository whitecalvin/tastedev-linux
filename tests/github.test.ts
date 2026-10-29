import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,chmod,rename,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {githubSnapshot,connectGitHub,disconnectGitHub,githubRepositories,verifyGitHub,githubProject,classifyGitHubProject} from '../lib/github.ts';

test('GitHub connection keeps tokens private, bounds repository pages and rejects stale account responses',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/github-test-'),oldRoot=process.env.LINUX_AUTH_ROOT,oldFetch=globalThis.fetch;process.env.LINUX_AUTH_ROOT=root;
 const token='github_pat_synthetic_fixture_token',otherToken='github_pat_other_synthetic_fixture';const calls:{url:string;init?:RequestInit}[]=[];
 let response:()=>Response|Promise<Response>=()=>Response.json({login:'fixture-user',name:'Fixture User'});
 globalThis.fetch=(async(url,init)=>{calls.push({url:String(url),init});return response();}) as typeof fetch;
 try{
  const before=githubSnapshot();
  response=()=>Response.json({login:'fixture-user',name:'Fixture User'});
  let verifyCalls=0;response=()=>++verifyCalls===1?Response.json({login:'fixture-user',name:'Fixture User'}):Response.json([{full_name:'fixture-user/repo'}]);
  const verified=await verifyGitHub({token,version:before.version});assert.equal(verified.account.login,'fixture-user');assert.equal(verified.repositoryCount,1);assert(!JSON.stringify(verified).includes(token));assert.deepEqual(githubSnapshot(),before,'verification does not save a connection');
  response=()=>Response.json({login:'fixture-user',name:'Fixture User'});
  await assert.rejects(connectGitHub({token,version:before.version,expectedAccount:'different-user'}),{status:409});assert.deepEqual(githubSnapshot(),before);
  calls.length=0;
  const initial=githubSnapshot();assert(!initial.connected);const linked=await connectGitHub({token,version:initial.version});assert.equal(linked.account?.login,'fixture-user');assert(!JSON.stringify(linked).includes(token));
  const directory=join(root,'github'),file=join(directory,'connection.json');assert.equal((await stat(directory)).mode&0o777,0o700);assert.equal((await stat(file)).mode&0o777,0o600);assert.equal(JSON.parse(await readFile(file,'utf8')).token,token);
  assert.equal(calls[0].url,'https://api.github.com/user');assert.equal((calls[0].init?.headers as Record<string,string>).Authorization,'Bearer '+token);assert.equal(calls[0].init?.redirect,'error');
  response=()=>Response.json([{id:1,full_name:'fixture-user/repo',private:true,archived:false,description:'Example',language:'TypeScript',default_branch:'main',updated_at:'2026-10-17T00:00:00Z',html_url:'https://evil.invalid/'}],{headers:{link:'<https://evil.invalid/page2>; rel="next"'}});
  const repos=await githubRepositories(1,linked.version);assert.equal(repos.nextPage,2);assert.equal(repos.repositories[0].url,'https://github.com/fixture-user/repo');assert(!JSON.stringify(repos).includes(token));assert(calls.at(-1)!.url.endsWith('page=1'));
  response=()=>Response.json([{type:'file',name:'package.json'},{type:'file',name:'Cargo.toml'}]);
  let inspections=0;globalThis.fetch=(async(url,init)=>{calls.push({url:String(url),init});inspections++;return String(url).endsWith('/package.json')?Response.json({type:'file',encoding:'base64',size:80,content:Buffer.from(JSON.stringify({dependencies:{next:'16',react:'19','@tauri-apps/api':'2'}})).toString('base64')}):response();}) as typeof fetch;
  const project=await githubProject('fixture-user/repo',linked.version,'revision-1');assert.deepEqual(project.types,['Next.js','Tauri','Rust']);assert.equal(project.status,'detected');assert(!JSON.stringify(project).includes(token));assert.equal(inspections,2);
  await githubProject('fixture-user/repo',linked.version,'revision-1');assert.equal(inspections,2,'unchanged repository uses cached classification');
  response=()=>Response.json([{type:'file',name:'README.md'}]);assert.equal((await githubProject('fixture-user/docs',linked.version)).status,'unknown');
  response=()=>new Response('',{status:404});assert.equal((await githubProject('fixture-user/missing',linked.version)).status,'unavailable');
  await assert.rejects(githubProject('fixture-user/../bad',linked.version),{status:400});await assert.rejects(githubProject('fixture-user/repo',initial.version),{status:409});
  await assert.rejects(githubRepositories(0,linked.version));await assert.rejects(githubRepositories(1,initial.version),{status:409});
  response=()=>new Response('sensitive upstream text '+token,{status:401});await assert.rejects(githubRepositories(1,linked.version),error=>error instanceof Error&&!error.message.includes(token)&&'status' in error&&error.status===422);
  response=()=>new Response('rate-limited',{status:429});await assert.rejects(githubRepositories(1,linked.version),{status:429});
  response=()=>Response.json([{id:1,full_name:'fixture-user/../../bad',private:false}]);await assert.rejects(githubRepositories(1,linked.version),{status:502});
  let release!:(response:Response)=>void;response=()=>new Promise(resolve=>{release=resolve;});const stale=githubRepositories(1,linked.version);await Promise.resolve();
  response=()=>Response.json({login:'other-user'});const replacement=await connectGitHub({token:otherToken,version:linked.version});release(Response.json([]));await assert.rejects(stale,{status:409});
  await assert.rejects(disconnectGitHub({version:linked.version}),{status:409});assert.equal(githubSnapshot().account?.login,'other-user');
  await chmod(file,0o644);assert.throws(githubSnapshot,{status:503});await chmod(file,0o600);
  await rename(file,file+'.original');await symlink(file+'.original',file);assert.throws(githubSnapshot,{status:503});
  const {unlink}=await import('node:fs/promises');await unlink(file);await rename(file+'.original',file);
  const removed=await disconnectGitHub({version:replacement.version});assert(!removed.connected);assert.equal(removed.version,initial.version);assert(!JSON.stringify(removed).includes(otherToken));
 }finally{globalThis.fetch=oldFetch;if(oldRoot===undefined)delete process.env.LINUX_AUTH_ROOT;else process.env.LINUX_AUTH_ROOT=oldRoot;}
});

test('project classification separates framework from language and supports mixed repositories',()=>{
 assert.deepEqual(classifyGitHubProject(['package.json'],{dependencies:{next:'16',react:'19'}}),['Next.js']);
 assert.deepEqual(classifyGitHubProject(['package.json'],{devDependencies:{vue:'3'}}),['Vue']);
 assert.deepEqual(classifyGitHubProject(['package.json','pnpm-workspace.yaml'],{private:true}),['Node.js','모노레포']);
 assert.deepEqual(classifyGitHubProject(['go.mod','pyproject.toml','server.csproj','pom.xml'],null),['Go','Python','JVM','.NET']);
 assert.deepEqual(classifyGitHubProject(['README.md'],null),[]);
 assert.deepEqual(classifyGitHubProject(['package.json'],null),[],'unread manifest is not inferred as Node.js');
 assert.deepEqual(classifyGitHubProject(['index.html'],null),['정적 웹']);
});
