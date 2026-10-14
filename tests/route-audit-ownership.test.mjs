import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';

const source=await readFile(new URL('../app/api/[action]/route.ts',import.meta.url),'utf8');
const typedBody=source.slice(source.indexOf('export async function POST')).replace('export async function POST','async function POST');
await loadBindings();const {code:body}=await transform(typedBody,{filename:'route-ownership.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'es6'}});
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function invoke(action,response,authenticated=true){
 const events=[],calls=[];
 const run=new AsyncFunction('handle','authorized','auditEvent','isAuthStorageError','authStorageMessage','request','context',body+'; return POST(request,context);');
 const result=await run(async(request,name)=>{calls.push(name);return response;},async()=>authenticated,async(...event)=>events.push(event),()=>false,'storage unavailable',new Request('http://localhost/api/'+action,{method:'POST'}),{params:Promise.resolve({action})});
 assert.equal(result,response);assert.deepEqual(calls,[action]);return events;
}
test('operational route preserves API or worker outcome ownership for success and failure',async()=>{
 for(const action of ['nginx-toggle','service','nginx-apply','certbot-issue','cron-delete','cron-apply','install','terminal','restore','nginx-config-apply','nginx-config-restore'])for(const status of [200,400,403,500])assert.deepEqual(await invoke(action,Response.json({id:'pending-job'},{status})),[],action+' '+status);
});
test('workspace route retains its own outcomes without auditing unauthenticated requests',async()=>{
 for(const action of ['node-apps','node-app-remove','node-app-env','node-app-env-restore','node-env-restore','node-env','terminal-input','config-save','folder','ai-analyze','file','nginx'])for(const [status,outcome]of [[200,'completed'],[403,'blocked'],[500,'failed']])assert.deepEqual(await invoke(action,Response.json({},{status})),[[action,outcome]]);
 assert.deepEqual(await invoke('file',Response.json({},{status:401}),false),[]);
});
