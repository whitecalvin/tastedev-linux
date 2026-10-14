import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {adminLockMainSource,assertAdminLockMainCurrent} from '../scripts/admin/error-output-source.mts';

async function fixture(chunks:readonly unknown[],uid=0,dispatchFailure=false){
 const writes:string[]=[],closed:number[]=[];let directories=0;
 const context=vm.createContext({Buffer,require:createRequire(import.meta.url),BASE:'/fixture',__filename:'/fixture/helper',adminNativeContext:null,
  rootDir(){},fail(message:string){throw Error(message);},dispatch(_action:string,input:unknown){if(dispatchFailure)throw Error('dispatch fixture failure');return input;},
  fs:{mkdirSync(){directories++;},closeSync(fd:number){closed.push(fd);}},
  process:{getuid:()=>uid,argv:['node','helper','service'],stdin:{async *[Symbol.asyncIterator](){for(const chunk of chunks)yield chunk;}},stdout:{write(value:string){writes.push(value);}}}
 });
 vm.runInContext(await adminLockMainSource(),context);
 // Entry-point unit fixture only; native lock ownership is verified separately in a disposable container.
 vm.runInContext('acquireAdminLock=function(){return 7;}',context);
 async function main():Promise<unknown>{const output:unknown=vm.runInContext('main()',context);return await output;}
 return {main,writes,closed,directories:()=>directories};
}
test('kernel lock, supervisor and entrypoint exactly match their TypeScript source',async()=>{
 await assertAdminLockMainCurrent();assert(!/\b(?:export|import)\s/.test(await adminLockMainSource()));
});
test('typed helper entrypoint preserves Korean JSON split across individual UTF-8 bytes',async()=>{
 const input={text:'한글 조합 검수 🐧'},bytes=Buffer.from(JSON.stringify(input)),f=await fixture([...bytes].map(value=>Buffer.from([value])));
 await f.main();assert.deepEqual(JSON.parse(f.writes.join('')),input);assert.deepEqual(f.closed,[7]);assert.equal(f.directories(),2);
});
test('typed helper refuses non-root, invalid payload shapes and oversized wire data before filesystem writes',async()=>{
 for(const chunks of [[Buffer.from('null')],[Buffer.from('[]')],[Buffer.from('"value"')],[{invalid:'chunk'}],[Buffer.from(JSON.stringify({text:'a'.repeat(16385)}))]]){
  const f=await fixture(chunks);await assert.rejects(f.main(),/Invalid action payload|Invalid input stream|Payload too large/);assert.equal(f.directories(),0);assert.equal(f.closed.length,0);
 }
 const unprivileged=await fixture([Buffer.from('{}')],1000);await assert.rejects(unprivileged.main(),/Root required/);assert.equal(unprivileged.directories(),0);
});
test('typed helper always closes its acquired lock descriptor after dispatch failure',async()=>{
 const f=await fixture([Buffer.from('{}')],0,true);await assert.rejects(f.main(),/dispatch fixture failure/);assert.deepEqual(f.closed,[7]);assert.equal(f.writes.length,0);
});
