import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {nodeAppUnit} from '../lib/node-app-unit.ts';

test('emitted Node unit generator runs without a TypeScript loader and preserves literal argv and account restrictions',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-node-unit-runtime-'));
 try{
  await mkdir(join(root,'lib'));
  for(const file of ['node-app-profile.mjs','node-app-unit.mjs']){const bytes=await readAdminRuntimeModule(file);assert.deepEqual(bytes,await readAdminRuntimeModule(file));await writeFile(join(root,'lib',file),bytes,{mode:0o600});}
  const app={id:'fixture',label:'한글 앱',directory:'/srv/my app/%i',entry:'server.mjs',environmentFile:'.env'},options={restart:'always',restartSeconds:7,stopSeconds:20};
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {nodeAppUnit} from './lib/node-app-unit.mjs';const app=${JSON.stringify(app)},options=${JSON.stringify(options)};for(const uid of [0,-1,'1000',null,2147483648])assert.throws(()=>nodeAppUnit(app,uid,options));assert.throws(()=>nodeAppUnit(app,1000,{restart:'always\\nUser=root'}));assert.throws(()=>nodeAppUnit({...app,entry:'../server.mjs'},1000));console.log(JSON.stringify(nodeAppUnit(app,1000,options)));`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout),nodeAppUnit(app,1000,options));
 }finally{await rm(root,{recursive:true,force:true});}
});
