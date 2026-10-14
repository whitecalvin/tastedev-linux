import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {adminNativeExecSource,assertAdminNativeExecCurrent} from '../scripts/admin/error-output-source.mts';

test('native helper embeds its exact standalone TypeScript source',async()=>{
 await assertAdminNativeExecCurrent();assert(!/\b(?:export|import)\s/.test(await adminNativeExecSource()));
});
test('typed native wrapper preserves lock supervisor arguments, stdio and bounded Unicode output',async()=>{
 const calls:unknown[][]=[];
 const context=vm.createContext({Buffer,__filename:'/fixture/linux-admin',adminNativeContext:{fd:9},rawExecFileSync(...args:unknown[]){calls.push(args);return Buffer.from('한글');},childProcess:{spawnSync(...args:unknown[]){calls.push(args);return {status:0,stdout:'한글 ',stderr:'검수'};}}});
 vm.runInContext(await adminNativeExecSource(),context);
 const output:unknown=vm.runInContext("run('/fixture/tool',['check'],1234)",context);assert.equal(output,'한글 검수');
 const call=JSON.parse(JSON.stringify(calls[0]));assert.equal(call[0],'/usr/bin/node');assert.deepEqual(call[1],['/fixture/linux-admin','--native-lock-supervisor','1234','/fixture/tool','check']);assert.equal(call[2].maxBuffer,2*1024*1024);assert.equal(call[2].timeout,1234);assert.deepEqual(call[2].stdio,['pipe','pipe','pipe',9]);assert.equal(call[2].env.LANG,'C.UTF-8');
 const bytes:unknown=vm.runInContext("execFileSync('/fixture/tool',['arg'],{timeout:2000,stdio:['ignore']})",context);assert(Buffer.isBuffer(bytes));assert.equal(bytes.toString(),'한글');
 const sync=JSON.parse(JSON.stringify(calls[1]));assert.deepEqual(sync[1],['/fixture/linux-admin','--native-lock-supervisor','2000','/fixture/tool','arg']);assert.deepEqual(sync[2].stdio,['ignore','pipe','pipe',9]);
 context.adminNativeContext=null;assert.equal(vm.runInContext("run('/fixture/tool',[])",context),'한글 검수');assert.equal(calls[2][0],'/fixture/tool');
});
test('typed native execution propagates spawn errors and unsuccessful exit statuses',async()=>{
 const context=vm.createContext({__filename:'/fixture/linux-admin',adminNativeContext:null,childProcess:{spawnSync(){return {status:1,signal:null,stdout:'failure',stderr:' output'};}}});
 vm.runInContext(await adminNativeExecSource(),context);assert.throws(()=>vm.runInContext("run('/fixture/tool',[])",context),/Native command failed\nfailure output/);
 context.childProcess={spawnSync(){throw Error('spawn fixture');}};assert.throws(()=>vm.runInContext("run('/fixture/tool',[])",context),/spawn fixture/);
});
