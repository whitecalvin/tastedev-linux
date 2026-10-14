import test from 'node:test';import assert from 'node:assert/strict';import {writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';import {readRuntimeModule} from '../scripts/runtime-source.ts';
test('Node22 isolated nginx TS worker emits JavaScript and refuses ordinary host before launching nginx or helper',async()=>{
 const root=await verificationWorkDirectory('nginx-isolated-worker-runtime-');const source='scripts/fixtures/nginx-isolated-worker.mjs',file=join(root,'worker.mjs');
 try{await writeFile(file,await readRuntimeModule(source,[source]));const syntax=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--check',file],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);const refused=spawnSync('/usr/bin/node',['--no-experimental-strip-types',file],{encoding:'utf8',timeout:10000});assert.equal(refused.status,1);assert(refused.stderr.includes('AssertionError'));assert(!refused.stderr.includes('ENOENT'));assert(!refused.stdout.includes('PASS'));}
 finally{await rm(root,{recursive:true,force:true});}
});
