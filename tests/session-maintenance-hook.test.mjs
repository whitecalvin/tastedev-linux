import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadBindings,transform} from 'next/dist/build/swc/index.js';
test('compiled common-shell hook renews the same-origin status route and disposes its monitor',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/use-session-maintenance.tsx',import.meta.url),'utf8'),{filename:'use-session-maintenance.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 let effect,dependencies,options,disposed=false,request;const module={exports:{}};
 const mocks={react:{useEffect:(fn,deps)=>{effect=fn;dependencies=deps;}},'../lib/browser-session-maintenance.ts':{maintainBrowserSession:value=>{options=value;return()=>disposed=true;}}};
 new Function('require','module','exports',compiled.code)(name=>mocks[name],module,module.exports);
 const oldWindow=globalThis.window,oldDocument=globalThis.document,oldFetch=globalThis.fetch;
 try{
  globalThis.window=new EventTarget();globalThis.document=new EventTarget();globalThis.fetch=(url,settings)=>{request={url,settings};return Promise.resolve(Response.json({authenticated:true}));};
  const expired=()=>{};module.exports.useSessionMaintenance(expired);assert.deepEqual(dependencies,[expired]);
  const dispose=effect();assert.equal(options.target,globalThis.window);assert.equal(options.document,globalThis.document);assert.equal(options.onExpired,expired);
  const signal=new AbortController().signal;await options.fetchStatus({signal});assert.equal(request.url,'/api/auth/status');assert.equal(request.settings.cache,'no-store');assert.equal(request.settings.credentials,'same-origin');assert.equal(request.settings.signal,signal);
  dispose();assert(disposed);
 }finally{
  if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  globalThis.fetch=oldFetch;
 }
});
