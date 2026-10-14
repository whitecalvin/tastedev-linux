import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
for(const view of ['overview','daemon','logs','recovery','security','audit','packages','terminal']){
 test(view+' authenticates before reading server snapshots and seeds the first render',async()=>{
  await loadBindings();
  const file=`../app/(console)/${view}/page.tsx`;
  const compiled=await transform(await readFile(new URL(file,import.meta.url),'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const calls=[],seed={status:{hostname:'fixture-host',packages:[]},security:{settings:{readOnly:true}}};let authorized=true;
  const mocks={
   '../../../components/console-workspace':{__esModule:true,default:'ConsoleWorkspace'},
   '../../../lib/page-session.ts':{requirePageSession:async route=>{calls.push(route);if(!authorized)throw Error('login redirect');}},
   '../../../lib/console-initial-data.ts':{consoleInitialData:async options=>{assert.deepEqual(options,['daemon','logs'].includes(view)?{operations:true}:undefined);calls.push('snapshot');return seed;}}
  };
  const module={exports:{}};
  new Function('require','module','exports',compiled.code)(name=>Object.hasOwn(mocks,name)?mocks[name]:native(name),module,module.exports);
  const page=module.exports.default;
  const rendered=await page({});assert.deepEqual(calls,['/'+view,'snapshot']);assert.equal(rendered.props.initialData,seed);assert.equal(rendered.props.view,view);
  calls.length=0;authorized=false;await assert.rejects(page({}),/login redirect/);assert.deepEqual(calls,['/'+view],'unauthenticated routes must not read host metadata');
 });
}
