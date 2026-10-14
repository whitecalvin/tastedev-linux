import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {themeInitScript} from '../lib/theme-init.ts';
import {readFile} from 'node:fs/promises';
import config from '../next.config.mjs';
test('Initial theme honors explicit choices and system preference even when storage is denied',()=>{
 for(const [saved,systemDark,expected] of [['light',true,'light'],['dark',false,'dark'],[null,true,'dark'],['invalid',false,'light'],['denied',true,'dark']]){
  const document={documentElement:{dataset:{}}};vm.runInNewContext(themeInitScript,{document,localStorage:{getItem(){if(saved==='denied')throw Error('fixture denied');return saved;}},matchMedia:()=>({matches:systemDark})});assert.equal(document.documentElement.dataset.theme,expected);
 }
 const document={documentElement:{dataset:{}}};vm.runInNewContext(themeInitScript,{document});assert.equal(document.documentElement.dataset.theme,'light');
});
test('served theme resource matches tested initialization and dev-only CSP does not reach production',async()=>{
 const served=await readFile(new URL('../public/theme-init.js',import.meta.url),'utf8');
 // Verify the delivered resource's behavior without requiring identical formatting.
 for(const saved of ['light','dark',null,'invalid','denied'])for(const systemDark of [false,true]){
  const results=[];
  for(const script of [themeInitScript,served]){
   const document={documentElement:{dataset:{}}},keys=[];
   vm.runInNewContext(script,{document,localStorage:{getItem(key){keys.push(key);if(saved==='denied')throw Error('fixture denied');return saved;}},matchMedia:()=>({matches:systemDark})});
   results.push({theme:document.documentElement.dataset.theme,keys});
  }
  assert.deepEqual(results[1],results[0]);
 }
 const document={documentElement:{dataset:{}}};vm.runInNewContext(served,{document});assert.equal(document.documentElement.dataset.theme,'light');
 const previous=process.env.NODE_ENV;
 try{for(const mode of ['development','production']){process.env.NODE_ENV=mode;const csp=(await config.headers())[0].headers.find(header=>header.key==='Content-Security-Policy').value;
  assert.equal(csp.includes("'unsafe-eval'"),mode==='development');assert.equal(csp.includes('ws://127.0.0.1:*'),mode==='development');assert(csp.includes("frame-ancestors 'none'"));
 }}finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}
});
