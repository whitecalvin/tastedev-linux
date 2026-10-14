import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verifyPassword} from '../lib/auth-password.ts';

test('Node22 emitted language gate preserves missing-key checks and hash CLI accepts Korean without exposing input',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','language-cli-runtime-'));
 try{
  const allowed=['scripts/check-translations.mjs','scripts/verification/audit-runtime-copy.mjs','scripts/login-hash.mjs','lib/auth-password.mjs'];
  for(const file of allowed){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  await symlink(join(process.cwd(),'node_modules'),join(root,'node_modules'),'dir');await mkdir(join(root,'tests'));
  const original=await readFile(new URL('./translation-checker.test.mjs',import.meta.url),'utf8');await writeFile(join(root,'tests/gate.test.mjs'),original.replace('../scripts/check-translations.ts','../scripts/check-translations.mjs'),{mode:0o600});
  const environment:NodeJS.ProcessEnv={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap',join(root,'tests/gate.test.mjs')],{cwd:root,env:environment,encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/# pass 1\b/);
  const password='한글-CLI-password';const bytes=Buffer.from(password+'\r\n');
  const child=spawn('/usr/bin/node',['--no-experimental-strip-types',join(root,'scripts/login-hash.mjs')],{cwd:root,env:environment,stdio:['pipe','pipe','pipe']});let output='',errors='';child.stdout.on('data',(data:Buffer)=>output+=data.toString());child.stderr.on('data',(data:Buffer)=>errors+=data.toString());
  const exited=new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code));});
  child.stdin.write(bytes.subarray(0,1));await new Promise(resolve=>setTimeout(resolve,100));child.stdin.end(bytes.subarray(1));
  assert.equal(await exited,0,errors);assert.match(output.trim(),/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);assert(!output.includes(password));assert(await verifyPassword({password,hash:output.trim()}));
  const invalid=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,'scripts/login-hash.mjs')],{cwd:root,env:environment,input:'x'.repeat(258),encoding:'utf8',timeout:5000});assert.equal(invalid.status,1);assert.equal(invalid.stdout,'');assert.match(invalid.stderr,/입력 길이/);
 }finally{await rm(root,{recursive:true,force:true});}
});
