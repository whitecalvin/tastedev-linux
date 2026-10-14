import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 stage directory custody and editor hints run emitted JavaScript without a TypeScript loader',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','pg-stage-runtime-'));
 try{
  const files=['lib/postgresql-stage-directory.mjs','lib/postgresql-setting-type.mjs'];
  await mkdir(join(root,'lib/locales'),{recursive:true,mode:0o700});
  for(const file of files)await writeFile(join(root,file),await readRuntimeModule(file,files),{mode:0o600});
  await copyFile(new URL('../lib/locales/postgresql-setting-types.json',import.meta.url),join(root,'lib/locales/postgresql-setting-types.json'));
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {mkdir,lstat,writeFile,readFile,rename} from 'node:fs/promises';import {pinPostgresqlStageDirectory} from './lib/postgresql-stage-directory.mjs';import {postgresqlSettingType,postgresqlSettingChoices} from './lib/postgresql-setting-type.mjs';const base=new URL('./fixture',import.meta.url).pathname;await mkdir(base,{mode:448});await mkdir(base+'/conf.d',{mode:448});const identity=s=>({dev:s.dev,ino:s.ino,uid:s.uid,gid:s.gid,mode:s.mode&511});const body={base,baseIdentity:identity(await lstat(base)),directories:[['/etc/conf.d',identity(await lstat(base+'/conf.d'))]]};const pinned=await pinPostgresqlStageDirectory(body,[],'/etc/conf.d');try{assert.throws(()=>pinned.child('../bad'));assert.throws(()=>pinned.child(''));await writeFile(pinned.child('candidate'),'private',{mode:384});assert.equal(await readFile(base+'/conf.d/candidate','utf8'),'private');await pinned.sync();await pinned.verify();await rename(base+'/conf.d',base+'/old');await mkdir(base+'/conf.d',{mode:448});await assert.rejects(pinned.verify(),{status:409});}finally{await pinned.close();}assert.equal(postgresqlSettingType('LOGGING_COLLECTOR'),'BOOLEAN');assert.deepEqual(postgresqlSettingChoices('logging_collector'),['on','off']);for(const name of [null,{},'unknown_extension']){assert.equal(postgresqlSettingType(name),null);assert.deepEqual(postgresqlSettingChoices(name),[]);}console.log('PASS');`,{mode:0o600});
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:environment,timeout:15000});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
