import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {prepareNginxBackupLookup} from '../lib/nginx-config-backups.ts';
test('canonical helper forwards only validated job backup IDs to trusted catalog dependencies',async()=>{
 const source=readFileSync(new URL('../scripts/admin/linux-admin',import.meta.url),'utf8').replace(/^#!.*\n/,'').split('main().catch')[0],calls=[];
 const context=vm.createContext({require:createRequire(import.meta.url),Buffer,process,runtimeFixture:{prepareNginxBackupLookup,nginxConfigBackups:async input=>{calls.push(input);return{backups:[]};}}});
 vm.runInContext(source,context);vm.runInContext('mariaRuntime=async()=>runtimeFixture;',context);
 const invoke=input=>vm.runInContext('dispatch("nginx-config-backups",'+JSON.stringify(input)+')',context),id='12345678-1234-1234-1234-123456789abc';
 await invoke({ids:[id,id]});assert.deepEqual(calls,[{ids:[id]}]);await invoke({});assert.deepEqual(calls[1],{});
 for(const input of [{root:'/tmp'},{base:'/etc'},{ownerUid:0},{ids:['../escape']}])await assert.rejects(invoke(input),{status:400});assert.equal(calls.length,2);
});
