import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper live config reader runs Node22 with exact paths and public values only',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-config-live-runtime-'));
 try{
  for(const file of ['config-live.mjs','mariadb-setting-groups.mjs','postgresql-cluster-status.mjs','config-value-parser.mjs','database-config-profile.mjs','config-schema.mjs','error-code.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,writeFile,symlink,unlink} from 'node:fs/promises';import {liveConfig,readRedisConfigSource} from './config-live.mjs';const root=new URL('.',import.meta.url).pathname.slice(0,-1),base=root+'/etc',file=base+'/redis/redis.conf',text='port 6379\\nmaxmemory 128mb\\nrequirepass synthetic-secret\\n';await mkdir(base+'/redis',{recursive:true,mode:0o700});await writeFile(file,text,{mode:0o600});const inventory=await liveConfig('redis',base);assert.equal(inventory.configs[0].values.port,6379);assert.equal(inventory.configs[0].values.maxMemory,128);assert(!JSON.stringify(inventory).includes('synthetic-secret'));const source=await readRedisConfigSource({},base);assert.equal(source.text,text);assert.match(source.version,/^[a-f0-9]{64}$/);await assert.rejects(readRedisConfigSource({path:'/etc/passwd'},base));await assert.rejects(liveConfig('unknown',base));await unlink(file);await writeFile(root+'/outside',text);await symlink(root+'/outside',file);await assert.rejects(readRedisConfigSource({},base));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
