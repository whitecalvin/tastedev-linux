import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const typedSource=await readFile(new URL('../lib/node-app-service-plan.ts',import.meta.url),'utf8');
await loadBindings();const source=(await transform(typedSource,{filename:'fixture.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}})).code;
function fixture(change){
 let probes=0;const app={id:'fixture',unit:'tastedev-node-fixture.service'};
 const registry={version:'registry',apps:[app]},files={registryVersion:'registry',directory:'/fixture',ready:true,files:[{name:'server.js',version:'original',mode:'600'}]};
 const nodeApps=async()=>probes&&change==='registry'?{...registry,version:'changed'}:registry;
 const nodeAppFiles=async()=>probes?change==='file'?{...files,files:[{...files.files[0],version:'changed'}]}:change==='mode'?{...files,files:[{...files.files[0],mode:'644'}]}:change==='missing'?{...files,ready:false}:files:files;
 const code=source.replace(/^import .*;\n/gm,'').replace('export async function','async function');
 return new Function('nodeApps','nodeAppFiles','nodeAppRuntime','nodeAppUnit','nodeAppServiceOptions',code+'\nreturn nodeAppServicePlan;')(nodeApps,nodeAppFiles,async()=>{probes++;return {status:'ready'};},()=> 'fixture unit',()=>({restart:'on-failure',restartSeconds:5}));
}
test('Node service plan rejects registration, content, mode and readiness changes during runtime probe',async()=>{
 for(const change of ['registry','file','mode','missing'])await assert.rejects(fixture(change)('fixture'),{status:409});
 const plan=await fixture('unchanged')('fixture');assert.equal(plan.text,'fixture unit');assert.equal(plan.files[0].version,'original');
});
