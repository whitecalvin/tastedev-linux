import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';
import {verificationWorkDirectory} from '../scripts/verification/work-directory.ts';
test('Node22 verification JSON helpers reject malformed responses and validate object, list and string fields',async()=>{
 const root=await verificationWorkDirectory('http-json-runtime-');
 try{
  const name='scripts/verification/http-json.mjs';await writeFile(join(root,'http-json.mjs'),await readRuntimeModule(name,[name]),{mode:0o600});
  await writeFile(join(root,'worker.mjs'),`import assert from 'node:assert/strict';import {jsonRecord,recordField,listField,textField,successfulJson} from './http-json.mjs';const response=Response.json({version:'fixture',values:{port:3100},backups:[{id:'backup'}]});const data=await successfulJson(response);assert.equal(textField(data,'version'),'fixture');assert.equal(recordField(data,'values').port,3100);assert.deepEqual(listField(data,'backups'),[{id:'backup'}]);for(const value of [null,[],42,'text'])assert.throws(()=>jsonRecord(value));assert.throws(()=>recordField(data,'missing'));assert.throws(()=>textField({version:42},'version'));assert.throws(()=>listField({events:[null]},'events'));assert.throws(()=>listField({events:{}},'events'));await assert.rejects(successfulJson(Response.json([])));await assert.rejects(successfulJson(Response.json({},{status:401})));await assert.rejects(successfulJson(new Response('{',{headers:{'content-type':'application/json'}})));console.log('HTTP_JSON_RUNTIME_PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types','worker.mjs'],{cwd:root,env:process.env,encoding:'utf8',timeout:10000});assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('HTTP_JSON_RUNTIME_PASS'));
 }finally{await rm(root,{recursive:true,force:true});}
});
