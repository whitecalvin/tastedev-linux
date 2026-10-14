import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper native wrapper and work directories run Node22 without TS loading',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-admin-native-runtime-'));
 try{
  for(const file of ['admin-native-exec.mjs','nginx-work-directory.mjs','redis-work-directory.mjs','postgresql-work-directory.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {promisify} from 'node:util';import {rm,lstat} from 'node:fs/promises';import {execFile,execFileSync} from './admin-native-exec.mjs';import {nginxWorkDirectory} from './nginx-work-directory.mjs';import {redisWorkDirectory} from './redis-work-directory.mjs';import {postgresqlWorkDirectory} from './postgresql-work-directory.mjs';const run=promisify(execFile),pending=run(process.execPath,['-e',"process.stdout.write('한글 😀')"]);assert(pending.child.pid);assert.equal((await pending).stdout,'한글 😀');const output=await run(process.execPath,['-e',"process.stdout.write('buffer')"],{encoding:'buffer'});assert(Buffer.isBuffer(output.stdout));assert.equal(execFileSync(process.execPath,['-e',"process.stdout.write('sync')"],{encoding:'utf8'}),'sync');await new Promise((resolve,reject)=>execFile('/usr/bin/true',{encoding:'utf8'},(error,stdout)=>error?reject(error):resolve(stdout)));for(const folder of [await nginxWorkDirectory('tastedev-nginx-check-'),await redisWorkDirectory('tastedev-redis-candidate-'),await postgresqlWorkDirectory('tastedev-pg-config-')]){assert(folder.startsWith(process.env.TMPDIR+'/'));assert.equal((await lstat(folder)).mode&511,448);await rm(folder,{recursive:true});}console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:{...process.env,TMPDIR:root,TMP:root,TEMP:root},input:'',timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
