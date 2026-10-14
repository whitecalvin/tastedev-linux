import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
test('status reads platform once per request while retaining live install gates and manual inventory refresh',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../lib/packages.ts',import.meta.url),'utf8'),{filename:'packages.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let reads=0,platform='ID=debian',ready=true;const refreshes=[];
 const mocks={
  'node:fs/promises':{readFile:async file=>{assert.equal(file,'/etc/os-release');reads++;if(platform===null)throw Error('unavailable');return platform;}},
  './privilege.ts':{helperStatus:()=>({ready})},
  './runtime-paths.ts':{stateRoot:()=>'/fixture'},
  './install-job-monitor.ts':{observeInstallJob:async job=>job},
  './install-job-record.ts':{readInstallJob:async()=>null},
  './inventory-snapshot.ts':{inventorySnapshot:()=>async options=>{refreshes.push(options.refresh);return [];}}
 };
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>mocks[name]??(name.startsWith('./')?{}:native(name)),module,module.exports);
 const before=process.env.LINUX_ENABLE_INSTALL;
 try{
  process.env.LINUX_ENABLE_INSTALL='true';
  let result=await module.exports.getStatus({reuseInventory:true});assert.equal(result.canInstall,true);assert.equal(result.supported,true);assert.equal(reads,1);
  ready=false;result=await module.exports.getStatus();assert.equal(result.canInstall,false);assert.equal(reads,2);
  ready=true;platform='ID=fedora';result=await module.exports.getStatus();assert.equal(result.canInstall,false);assert.equal(result.supported,false);assert.equal(reads,3);
  platform='ID=ubuntu';process.env.LINUX_ENABLE_INSTALL='false';result=await module.exports.getStatus();assert.equal(result.canInstall,false);assert.equal(result.supported,true);assert.equal(reads,4);
  platform=null;result=await module.exports.getStatus();assert.equal(result.supported,false);assert.equal(reads,5);
  assert.deepEqual(refreshes,[false,true,true,true,true]);
 }finally{if(before===undefined)delete process.env.LINUX_ENABLE_INSTALL;else process.env.LINUX_ENABLE_INSTALL=before;}
});
