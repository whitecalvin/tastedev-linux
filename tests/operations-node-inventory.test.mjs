import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

test('full daemon inventory includes registry-bound Node rows and warnings while package-scoped reads avoid Node discovery',async()=>{
 await loadBindings();const {code}=await transform(await readFile(new URL('../lib/operations.ts',import.meta.url),'utf8'),{filename:'operations.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};let nodeCalls=0;
 const app={unit:'tastedev-node-demo.service',nodeAppId:'demo',LoadState:'loaded',ActiveState:'active'},warning='앱 목록 조회 안내';
 const require=name=>name==='./node-app-service-status.ts'?{nodeAppServiceInventory:async()=>{nodeCalls++;return {services:[app],warnings:[warning]};}}:name==='./postgresql-cluster-status.ts'?{discoverPostgresqlClusters:async()=>[],postgresqlClusterStatuses:async()=>[]}:name==='./privilege.ts'?{adminConfigured:()=>true,runHelper:async()=>({logs:'전용 서비스 처리 완료'})}:name==='./runtime-paths.ts'?{stateRoot:()=>'/mnt/data/build/tastedev-linux/unused-operation-state'}:name==='node:child_process'?{execFile:async()=>({stdout:'ActiveState=active\nSubState=running\nLoadState=loaded\nUnitFileState=enabled\nDescription=fixture\n'})}:name==='node:util'?{promisify:fn=>fn}:name.startsWith('./')?{}:native(name);
 new Function('require','module','exports',code)(require,module,module.exports);
 const scoped=await module.exports.serviceStatus({unit:'nginx.service'});assert.equal(nodeCalls,0);assert.equal(scoped.length,1);assert.deepEqual(scoped.warnings,[]);
 const full=await module.exports.serviceStatus();assert.equal(nodeCalls,1);assert.equal(full.length,7);assert.equal(full.at(-1),app);assert.deepEqual(full.warnings,[warning]);
 const controlled=await module.exports.controlService({unit:'nginx.service',action:'start',confirm:true});assert.equal(nodeCalls,2);assert.deepEqual(controlled.warnings,[warning]);assert.equal(controlled.services.at(-1),app);assert.equal(controlled.logs,'전용 서비스 처리 완료');
 await assert.rejects(module.exports.serviceStatus({unit:app.unit}));assert.equal(nodeCalls,2,'arbitrary scoped unit cannot bypass the registered inventory');
});
