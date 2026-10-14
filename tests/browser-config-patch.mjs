// Executes the actual pure module closure without Node globals, not a GUI patch stub.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
export async function browserConfigPatch(entry=new URL('../lib/config-patch.ts',import.meta.url)){
 await loadBindings();
 const context=vm.createContext({TextEncoder,TextDecoder}),modules=new Map();
 async function load(url){
  const key=url.href;if(modules.has(key))return modules.get(key);
  const source=await readFile(url,'utf8'),dependencies=new Map();
  for(const [,specifier] of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)){
   if(!/^\.\/[a-z-]+\.(?:mjs|ts)$/.test(specifier))throw Error('Unexpected browser module dependency: '+specifier);
   dependencies.set(specifier,await load(new URL(specifier,url)));
  }
  const compiled=await transform(source,{filename:url.pathname,jsc:{parser:{syntax:url.pathname.endsWith('.ts')?'typescript':'ecmascript'}},module:{type:'commonjs'}}),module={exports:{}};
  const execute=vm.runInContext('(function(require,module,exports){'+compiled.code+'\n})',context);
  execute(name=>{if(!dependencies.has(name))throw Error('Unexpected browser import: '+name);return dependencies.get(name);},module,module.exports);
  modules.set(key,module.exports);return module.exports;
 }
 return (await load(entry)).patchConfig;
}
