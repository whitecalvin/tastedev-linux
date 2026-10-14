import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNodeEnv,readNodeEnvFile} from '../lib/node-env.ts';
import {configProfile} from '../lib/config-profiles.ts';
test('Node environment import roundtrips supported values without retaining secrets',()=>{
 const input={environment:'development',host:'::1',port:3010,memory:1024,logLevel:'debug'};
 assert.deepEqual(parseNodeEnv(configProfile('nodejs',input)).values,input);
 const result=parseNodeEnv('\uFEFFexport PORT="3010" # comment\r\nHOST=127.0.0.1\nTOKEN=fixture-secret\nDATABASE_URL=secret\n# comment');assert.deepEqual(result,{values:{port:3010,host:'127.0.0.1'},skipped:2});assert(!JSON.stringify(result).includes('secret'));
});
test('Node environment import rejects ambiguous or executable supported values without exposing them',()=>{
 for(const text of ['PORT=3000\nPORT=3001','PORT=$(fixture-secret)','NODE_OPTIONS=--max-old-space-size=512 --inspect','PORT=0','HOST=evil','NODE_ENV="production" trailing','LOG_LEVEL=${fixture-secret}','PORT=3\0'])assert.throws(()=>parseNodeEnv(text),error=>!error.message.includes('fixture-secret'));
});

test('Generated Node environment file is accepted by the actual Node runtime',async()=>{
 const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-node-env-'));
 try{
  const file=join(root,'app.env');await writeFile(file,configProfile('nodejs',{port:3145,host:'::1',memory:128,logLevel:'warn'}),{mode:0o600});
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!['NODE_ENV','PORT','HOST','NODE_OPTIONS','LOG_LEVEL','NODE_PATH'].includes(key)&&!/(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY)/i.test(key)));
  const code="const v8=require('node:v8'); require('node:fs').writeFileSync('result.json',JSON.stringify({environment:process.env.NODE_ENV,port:process.env.PORT,host:process.env.HOST,options:process.env.NODE_OPTIONS,logLevel:process.env.LOG_LEVEL,heapLimit:v8.getHeapStatistics().heap_size_limit}));";
  const {stderr}=await promisify(execFile)(process.execPath,['--env-file='+file,'-e',code],{env,cwd:root,timeout:10000,maxBuffer:4096});
  assert.equal(stderr,'');const result=JSON.parse(await readFile(join(root,'result.json'),'utf8'));assert.deepEqual({...result,heapLimit:undefined},{environment:'production',port:'3145',host:'::1',options:'--max-old-space-size=128',logLevel:'warn',heapLimit:undefined});await promisify(execFile)(process.execPath,['--max-old-space-size=128','-e',"require('node:fs').writeFileSync('explicit.json',JSON.stringify({heapLimit:require('node:v8').getHeapStatistics().heap_size_limit}));"],{env,cwd:root,timeout:10000,maxBuffer:4096});assert.equal(result.heapLimit,JSON.parse(await readFile(join(root,'explicit.json'),'utf8')).heapLimit);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Environment file reader bounds bytes and rejects non-UTF8 or binary content',async()=>{assert.equal(await readNodeEnvFile(new Blob(['PORT=3000'])),'PORT=3000');await assert.rejects(readNodeEnvFile(new Blob([new Uint8Array([255])])));await assert.rejects(readNodeEnvFile(new Blob(['PORT=3\0'])));let read=false;await assert.rejects(readNodeEnvFile({size:262145,arrayBuffer(){read=true;}}));assert.equal(read,false);});
