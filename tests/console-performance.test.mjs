import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
test('layout and page coalesce snapshot reads only inside the current render request',async()=>{
 await loadBindings();
 const source=await readFile(new URL('../lib/console-initial-data.ts',import.meta.url),'utf8');
 const compiled=await transform(source,{filename:'console-initial-data.mjs',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
 let request=new Map(),statusReads=0,policyReads=0,serviceReads=0;
 const mocks={react:{cache:fn=>(...args)=>{if(!request.has(fn))request.set(fn,new Map());const entries=request.get(fn),key=JSON.stringify(args);if(!entries.has(key))entries.set(key,fn(...args));return entries.get(key);}},
 './packages.ts':{getStatus:async options=>{assert.equal(options.reuseInventory,true);statusReads++;return {packages:[]};}},
 './security.ts':{securitySettings:async()=>({revision:++policyReads})},
 './operations.ts':{serviceStatus:async options=>{serviceReads++;return options?[{unit:options.unit}]:[];},permissions:()=>({admin:false})}};
 const module={exports:{}};new Function('require','module','exports',compiled.code)(name=>mocks[name]??native(name),module,module.exports);
 const initial=module.exports.consoleInitialData;
 const [shell,page,other,ideStatus,ideSecurity,ideServices]=await Promise.all([initial(),initial({operations:true}),initial({operations:true}),module.exports.initialStatus(),module.exports.initialSecurity(),module.exports.initialServices()]);
 assert.equal(ideStatus,shell.status);assert.equal(ideSecurity,shell.security);assert.equal(ideServices,page.operations.services);
 assert.equal(statusReads,1);assert.equal(policyReads,1);assert.equal(serviceReads,1);
 assert.equal(shell.status,page.status);assert.equal(page.operations.services,other.operations.services);
 const [nginx,nginxAgain,postgresql]=await Promise.all([module.exports.initialServices('nginx.service'),module.exports.initialServices('nginx.service'),module.exports.initialServices('postgresql.service')]);
 assert.equal(nginx,nginxAgain);assert.deepEqual(nginx,[{unit:'nginx.service'}]);assert.deepEqual(postgresql,[{unit:'postgresql.service'}]);assert.equal(serviceReads,3,'different unit scopes must not share the wrong snapshot');
 request=new Map();const next=await initial({operations:true});assert.equal(policyReads,2);assert.equal(statusReads,2);assert.equal(serviceReads,4);assert.equal(next.security.revision,2,'a new request must reread security policy');
});
