import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {startupRuntimeFiles,readStartupRuntimeModule} from '../scripts/startup-runtime-source.ts';

test('standalone startup closure runs emitted network JavaScript without TypeScript loading',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-startup-runtime-'));
 try{
  for(const file of startupRuntimeFiles){const bytes=await readStartupRuntimeModule(file);assert.deepEqual(bytes,await readStartupRuntimeModule(file));await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),bytes,{mode:0o600});const checked=spawnSync(process.execPath,['--no-experimental-strip-types','--check',join(root,file)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);}
  const startup=(await readStartupRuntimeModule('scripts/start-server.mjs')).toString('utf8');assert(startup.includes('../lib/network-settings.mjs'));assert(!startup.includes('../lib/network-settings.ts'));
  await symlink(join(process.cwd(),'node_modules'),join(root,'node_modules'),'dir');
  const authWorker=join(root,'auth-worker.mjs');await writeFile(authWorker,`import {passwordHash,login,cookieSession,logoutSession} from './lib/auth.mjs';import {storeCredentials} from './lib/auth-store.mjs';storeCredentials('runtime-admin',await passwordHash('runtime-fixture-password'));const token=await login('runtime-admin','runtime-fixture-password');const request=new Request('http://localhost/',{headers:{cookie:'linux_session='+token}});if((await cookieSession(request))?.username!=='runtime-admin')throw Error('Login failed');await logoutSession(request);if(await cookieSession(request))throw Error('Logout failed');console.log('PASS');`,{mode:0o600});
  const authResult=spawnSync('/usr/bin/node',['--no-experimental-strip-types',authWorker],{encoding:'utf8',env:{...process.env,LINUX_AUTH_ROOT:join(root,'auth'),LINUX_STATE_ROOT:join(root,'state')}});assert.equal(authResult.status,0,authResult.stderr);assert.equal(authResult.stdout.trim(),'PASS');
  const cliResult=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,'scripts/setup-admin.mjs')],{encoding:'utf8',env:{...process.env,LINUX_PACKAGED:'true',LINUX_AUTH_ROOT:join(root,'auth')}});assert.equal(cliResult.status,1);assert.match(cliResult.stderr,/대화형 터미널에서 sudo tastedev-linux account setup/);assert(!cliResult.stderr.includes('ERR_MODULE'));
  const worker=join(root,'worker.mjs');await writeFile(worker,"import {networkConfiguration,networkOrigins} from './lib/network-settings.mjs';console.log(JSON.stringify({settings:networkConfiguration(),origins:networkOrigins('127.0.0.1',9876)}));",{mode:0o600});
  const result=spawnSync(process.execPath,['--no-experimental-strip-types',worker],{encoding:'utf8',env:{...process.env,LINUX_STATE_ROOT:join(root,'state'),LINUX_HOST:'127.0.0.1',PORT:'9876'}});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),{settings:{externalEnabled:false,host:'127.0.0.1',port:9876},origins:['http://127.0.0.1:9876','http://localhost:9876']});
  await assert.rejects(readStartupRuntimeModule('lib/security.mjs'),/Unapproved/);await assert.rejects(readStartupRuntimeModule('../lib/network-settings.mjs'),/Unapproved/);
 }finally{await rm(root,{recursive:true,force:true});}
});
