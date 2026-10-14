import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('real persisted job observation reaches authenticated no-store API without rewriting evidence',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','install-status-api-'));const folder=join(root,'install-jobs'),file=join(folder,'job.json');
 try{
  await mkdir(folder,{mode:0o700});
  const job={id:'12345678-1234-1234-1234-123456789012',status:'running',startedAt:'2026-10-10T00:00:00Z',command:['/usr/bin/apt-get','install','--yes','--no-remove','--no-upgrade','nginx'],logs:['기존 설치 기록'],exitCode:null};
  const text=JSON.stringify(job);await writeFile(file,text,{mode:0o600});
  const script="const {getJob}=await import(process.argv[1]);console.log(JSON.stringify(await getJob()));";
  const result=await promisify(execFile)(process.execPath,['--input-type=module','-e',script,new URL('../lib/packages.ts',import.meta.url).href],{env:{...process.env,LINUX_AUTH_ROOT:root,LINUX_STATE_ROOT:root}});
  const observed=JSON.parse(result.stdout);assert.equal(observed.monitoringUnavailable,true);assert.equal(observed.status,'running');assert.deepEqual(observed.logs,job.logs);assert.equal(await readFile(file,'utf8'),text);
  await loadBindings();const compiled=await transform(await readFile(new URL('../lib/api.ts',import.meta.url),'utf8'),{filename:'api.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
  let authenticated=true,calls=0;const module={exports:{}};
  new Function('require','module','exports',compiled.code)(name=>name==='./auth.ts'?{cookieSession:async()=>authenticated?{username:'fixture'}:null}:name==='./packages.ts'?{getJob:async()=>{calls++;return observed;}}:{},module,module.exports);
  const request=()=>module.exports.handle(new Request('http://localhost/api/job'),'job');
  const response=await request();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual((await response.json()).job,observed);
  authenticated=false;assert.equal((await request()).status,401);assert.equal(calls,1);assert.equal(await readFile(file,'utf8'),text);
 }finally{await rm(root,{recursive:true,force:true});}
});
