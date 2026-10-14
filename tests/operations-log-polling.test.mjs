import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('stale polling failure does not disable live logs after a newer manual request',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;const hooks={useState:initial=>{const index=si++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];},useRef:initial=>{const index=ri++;return refs[index]??(refs[index]={current:initial});},useCallback:fn=>fn,useEffect:(fn,deps)=>{const index=ei++;if(!effects[index]||deps.some((value,k)=>value!==effects[index].deps[k]))pending.push(()=>{effects[index]?.cleanup?.();effects[index]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:'div'}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const requests=[];const props={connected:true,initialTab:'logs',api:action=>action==='operations'?Promise.resolve({services:[],permissions:{}}):new Promise((resolve,reject)=>requests.push({resolve,reject}))};
 const render=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return tree;};const find=(tree,predicate)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,predicate)).find(Boolean);if(predicate(tree))return tree;return find(toastTestChildren(tree),predicate);};
 try{
  let tree=render();find(tree,node=>node.props?.label==='3초마다 새로고침').props.onChange({target:{checked:true}});tree=render();assert.equal(requests.length,1);
  const manual=find(tree,node=>node.props?.['aria-label']==='로그 조회').props.onClick();assert.equal(requests.length,2);requests[1].resolve({text:'newest output'});await manual;requests[0].reject(Error('stale poll failure'));await Promise.resolve();await Promise.resolve();tree=render();
  assert.equal(find(tree,node=>node.props?.label==='3초마다 새로고침').props.checked,true);assert(find(tree,node=>node.props?.children==='newest output'));assert(!find(tree,node=>node.props?.children==='stale poll failure'));
 }finally{for(const effect of effects)effect?.cleanup?.();}
});
