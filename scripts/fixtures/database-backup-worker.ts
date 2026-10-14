import type {ChildProcess} from 'node:child_process';
import {jsonRecord} from '../verification/http-json.ts';

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex'),helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin',checks:string[]=[];
assert.equal(process.getuid?.(),0);assert.match(fs.readFileSync('/proc/self/uid_map','utf8').trim(),/^0\s+\d+\s+1$/);assert.equal(fs.statSync('/').uid,0);process.umask(0o077);
function invoke(action:string,input:Record<string,unknown>={}){return jsonRecord(JSON.parse(execFileSync('/usr/bin/node',[helper,action],{input:JSON.stringify(input),encoding:'utf8',timeout:10000,env:{NODE_ENV:'test',PATH:'/usr/bin:/usr/sbin',LANG:'C.UTF-8',TMPDIR:'/mnt/data/build/tastedev-linux',TMP:'/mnt/data/build/tastedev-linux',TEMP:'/mnt/data/build/tastedev-linux'}})));}
const origin=process.env.FIXTURE_WEB_ORIGIN??'http://127.0.0.1:18082';assert.match(origin,/^http:\/\/127\.0\.0\.[12]:[1-9][0-9]{0,4}$/);const endpoint=new URL(origin);assert(Number(endpoint.port)<=65535);
const files={redis:'/etc/redis/redis.conf',mariadb:'/etc/mysql/mariadb.conf.d/50-server.cnf'},original:Record<string,string>={};
for(const [kind,file]of Object.entries(files)){
 original[kind]=fs.readFileSync(file,'utf8');const input={path:file,version:hash(original[kind]),confirm:true};
 const result=invoke(kind+'-config-backup',input),backup=jsonRecord(result.backup);assert(typeof backup.id==='string');assert.equal(result.created,true);assert.equal(result.operatingConfigurationChanged,false);assert.equal(result.operatingServiceChanged,false);
 const catalog=invoke(kind+'-backups');assert(backupRecords(catalog).some(record=>record.id===backup.id));
 const recordFile='/var/lib/linux/admin/'+kind+'/'+backup.id+'.json',record=jsonRecord(JSON.parse(fs.readFileSync(recordFile,'utf8')));
 assert.equal(record.target,file);assert.equal(record.text,original[kind]);assert.equal(record.version,input.version);assert.equal(fs.lstatSync(recordFile).mode&0o777,0o600);assert.equal(fs.lstatSync(pathDir(recordFile)).mode&0o777,0o700);
 assert(!JSON.stringify(result).includes('fixture-only-secret'));assert.equal(fs.readFileSync(file,'utf8'),original[kind]);checks.push(kind+' real packaged-path helper creates private operating-file backup and catalog metadata');
 const before=fs.readdirSync(pathDir(recordFile)).sort();
 for(const change of [{version:hash('old')},{confirm:false},{text:'draft'},{backupRoot:'/mnt/data/build/tastedev-linux/injected'},{path:'/etc/passwd'}])assert.throws(()=>invoke(kind+'-config-backup',{...input,...change}));
 assert.deepEqual(fs.readdirSync(pathDir(recordFile)).sort(),before);assert.equal(fs.readFileSync(file,'utf8'),original[kind]);checks.push(kind+' helper independently rejects stale versions, missing confirmation and injected fields without publication');
}
function backupRecords(value:Record<string,unknown>){assert(Array.isArray(value.backups));return value.backups.map(jsonRecord);}
function pathDir(file:string){return file.slice(0,file.lastIndexOf('/'));}
let server:ChildProcess|undefined,serverLog='',cookie='';const guiMode=process.argv.includes('--gui');
if(process.argv.includes('--next')){
 Object.assign(process.env,{LINUX_PACKAGED:'true',LINUX_ENABLE_ADMIN:'true',LINUX_AUTH_ROOT:'/var/lib/api-auth',LINUX_STATE_ROOT:'/var/lib/api-state',BETTER_AUTH_URL:origin});
 const {storeCredentials}=await import('../../lib/auth-store.ts'),{passwordHash}=await import('../../lib/auth-password.ts'),{defaultSecurity}=await import('../../lib/security.ts');
 const password=randomBytes(24).toString('base64url');storeCredentials('backup-fixture',await passwordHash(password));
 fs.mkdirSync('/var/lib/api-state',{recursive:true,mode:0o700});const policy={...defaultSecurity,readOnly:false,sudoWithoutPrompt:true,databaseChanges:true};
 const policyFile='/var/lib/api-state/security.json';fs.writeFileSync(policyFile,JSON.stringify(policy),{mode:0o600});
 server=spawn('/usr/bin/node',['/mnt/source/node_modules/next/dist/bin/next','start','--hostname',endpoint.hostname,'--port',endpoint.port],{cwd:'/mnt/build',env:{...process.env,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
 assert(server.stdout&&server.stderr);server.stdout.on('data',data=>serverLog=(serverLog+data).slice(-4000));server.stderr.on('data',data=>serverLog=(serverLog+data).slice(-4000));
 try{
  let ready=false;for(let attempt=0;attempt<150;attempt++){if(server.exitCode!==null)throw Error('Next.js exited: '+serverLog);try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(1000)})).status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert(ready,'Next.js readiness: '+serverLog);
  const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'backup-fixture',password})});assert.equal(login.status,200);const setCookie=login.headers.get('set-cookie');assert(setCookie);cookie=setCookie.split(';')[0];
  const request=async(kind:string,input:Record<string,unknown>,{authenticated=true,origin=endpoint.origin}={})=>{const response=await fetch(endpoint.origin+'/api/'+kind+'-config-backup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(authenticated?{Cookie:cookie}:{})},body:JSON.stringify(input),signal:AbortSignal.timeout(15000)});return {status:response.status,body:jsonRecord(await response.json())};};
  for(const [kind,file]of Object.entries(files)){
   const input={path:file,version:hash(original[kind]),confirm:true},directory='/var/lib/linux/admin/'+kind;
   assert.equal((await request(kind,input,{authenticated:false})).status,401);assert.equal((await request(kind,input,{origin:'https://foreign.example'})).status,403);
   const before=fs.readdirSync(directory).sort();
   for(const blocked of [{readOnly:true},{databaseChanges:false},{sudoWithoutPrompt:false}]){fs.writeFileSync(policyFile,JSON.stringify({...policy,...blocked}));assert.equal((await request(kind,input)).status,403);}
   assert.deepEqual(fs.readdirSync(directory).sort(),before);fs.writeFileSync(policyFile,JSON.stringify(policy));checks.push(kind+' compiled Next.js enforces session, origin and actual stored policy before helper execution');
   const created=await request(kind,input);assert.equal(created.status,200,JSON.stringify(created.body));assert.equal(created.body.created,true);assert.equal(fs.readFileSync(file,'utf8'),original[kind]);
   const catalog=await fetch(endpoint.origin+'/api/'+kind+'-backups',{headers:{Cookie:cookie}});assert.equal(catalog.status,200);assert(backupRecords(jsonRecord(await catalog.json())).some(record=>record.id===jsonRecord(created.body.backup).id));
   const bad=await request(kind,{...input,text:'edited draft'});assert.equal(bad.status,400);const stale=await request(kind,{...input,version:hash('stale')});assert(stale.status>=400);checks.push(kind+' compiled route reaches real helper backup and catalog; draft injection and stale versions are rejected');
  }
  if(guiMode){
   const counts=Object.fromEntries(Object.keys(files).map(kind=>[kind,fs.readdirSync('/var/lib/linux/admin/'+kind).filter(name=>name.endsWith('.json')).length]));
   fs.writeFileSync('/mnt/gui-login.json',JSON.stringify({username:'backup-fixture',password}),{mode:0o600});
   fs.writeFileSync('/mnt/gui-ready.json',JSON.stringify({url:origin+'/ide/packages/redis',counts}));
   const deadline=Date.now()+300000;while(!fs.existsSync('/mnt/gui-stop')){if(Date.now()>deadline)throw Error('GUI fixture timeout');if(server.exitCode!==null)throw Error('GUI server stopped');await new Promise(resolve=>setTimeout(resolve,200));}
   for(const kind of Object.keys(files))assert.equal(fs.readdirSync('/var/lib/linux/admin/'+kind).filter(name=>name.endsWith('.json')).length,counts[kind]+1,kind+' GUI must create exactly one backup');
   checks.push('GUI verification fixture produced exactly one additional Redis and MariaDB backup');
  }
  const codeInput={path:files.redis,version:hash(original.redis),text:original.redis};
  const codeRequest=async (input:Record<string,unknown>)=>{const response=await fetch(origin+'/api/redis-code-plan',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(input),signal:AbortSignal.timeout(15000)});return {status:response.status,body:jsonRecord(await response.json())};};
  const staleCode=await codeRequest({...codeInput,version:hash('stale-code')});assert.equal(staleCode.status,409,JSON.stringify(staleCode));assert(typeof staleCode.body.error==='string');assert(!staleCode.body.error.includes('NOPASSWD'));assert(!staleCode.body.error.includes('fixture-only-secret'));
  checks.push('real helper code version conflict returns HTTP 409 without sudo-error prefix');
  const inspected=await codeRequest(codeInput);if(inspected.status!==200)assert(typeof inspected.body.error==='string');if(fs.existsSync('/usr/bin/redis-server')){if(inspected.status===503){assert(String(inspected.body.error).includes('Redis 격리 검수 환경을 사용할 수 없습니다.'));assert(!String(inspected.body.error).includes('NOPASSWD'));checks.push('real sandbox environment rejection reaches HTTP 503 without sudo-error prefix');}else{assert.equal(inspected.status,200,JSON.stringify(inspected));assert.equal(jsonRecord(inspected.body.validation).valid,true);assert.equal(jsonRecord(inspected.body.validation).scope,'isolated-startup');checks.push('actual isolated Redis startup validation through compiled Next.js and packaged-path helper');}}else{assert.equal(inspected.status,400,JSON.stringify(inspected));assert(String(inspected.body.error).includes('Redis 실행 파일이 없습니다.'));assert(!String(inspected.body.error).includes('NOPASSWD'));checks.push('missing Redis executable reaches public HTTP 400');}
  assert.equal(fs.readFileSync(files.redis,'utf8'),original.redis);assert(!fs.readdirSync('/mnt/data/build/tastedev-linux').some(name=>name.startsWith('tastedev-redis-validation-')));checks.push('Redis inspection preserves original and cleans temporary runtime');
  const auditNames=fs.readdirSync('/var/lib/api-state').filter(name=>name.includes('audit'));assert(auditNames.length,'actual audit file must exist');
  const audit= auditNames.map(name=>fs.readFileSync('/var/lib/api-state/'+name,'utf8')).join('\n');assert(!audit.includes('fixture-only-secret'));
  for(const kind of Object.keys(files))for(const outcome of ['requested','completed','failed','blocked'])assert(audit.split('\n').some(line=>line.includes(kind+'-config-backup')&&line.includes(outcome)),kind+' '+outcome);
  checks.push('actual API audit records request, completion, failure and blocked policy without configuration contents');
 }finally{
  if(server.exitCode===null){const owned=server;owned.kill('SIGTERM');await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>{owned.kill('SIGKILL');reject(Error('Next.js cleanup timeout'));},10000);owned.once('exit',()=>{clearTimeout(timeout);resolve();});});}
 }
}
for(const [kind,file]of Object.entries(files))assert.equal(fs.readFileSync(file,'utf8'),original[kind]);
assert(!fs.existsSync('/mnt/data/build/tastedev-linux/service-control-called'));checks.push('fixture operating files preserved and no service control command invoked');
fs.writeFileSync('/mnt/result.json',JSON.stringify({status:'PASS',checks,scope:'isolated manual configuration backup',helperSha256:hash(fs.readFileSync(helper)),databaseBackupSha256:hash(fs.readFileSync('/mnt/source/lib/database-config-backup.ts')),redisBinarySha256:fs.existsSync('/usr/bin/redis-server')?hash(fs.readFileSync('/usr/bin/redis-server')):null,redisStartupVerified:checks.some(item=>item.startsWith('actual isolated Redis startup')),sandboxEnvironmentRejectionVerified:checks.some(item=>item.startsWith('real sandbox environment rejection')),installedHelperPathVerified:true,nextCompiledRouteVerified:Boolean(server),realSudoVerified:false,sudoAdapter:Boolean(server),operatingDatabaseVerified:false,serviceControlVerified:false,hostOperationalChanges:false,networkIsolated:!guiMode,loopbackOnly:guiMode,guiInventoryAdapter:guiMode,guiVerified:guiMode},null,2)+'\n');
