import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNodeEnv,readNodeEnvFile} from '../lib/node-env.ts';
import {configSchemas} from '../lib/config-schema.ts';
test('Node import review removes raw input, rejects duplicates and reflects only reviewed values',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-env-import.tsx',import.meta.url),'utf8'),{filename:'node-env-import.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[];let index=0;const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?{useId:()=> 'env-input',useEffect:()=>{},useRef:initial=>{const key=index++;if(!(key in state))state[key]={current:initial};return state[key];},useState:initial=>{const key=index++;if(!(key in state))state[key]=initial;return [state[key],value=>state[key]=value];}}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:'button'}:name==='../lib/node-env.ts'?{parseNodeEnv,readNodeEnvFile}:name==='../lib/config-schema.ts'?{configSchemas}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let imported,rejection='';const render=()=>{index=0;return module.exports.default({onImport:values=>{if(rejection)return rejection;imported=values;}});};
 function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(toastTestChildren(tree))];}
 const find=(tree,type,label)=>nodes(tree).find(node=>node.type===type&&(!label||node.props.children===label));
 let tree=render();find(tree,'textarea').props.onChange({target:{value:'PORT=3200\nAPI_KEY=fixture-secret'}});tree=render();find(tree,'button','지원 항목 검토').props.onClick();tree=render();assert.equal(find(tree,'textarea').props.value,'');assert(!JSON.stringify(tree).includes('fixture-secret'));assert.equal(imported,undefined);find(tree,'button','폼에 반영').props.onClick();assert.deepEqual(imported,{port:3200});
 tree=render();find(tree,'textarea').props.onChange({target:{value:'PORT=1\nPORT=2'}});tree=render();find(tree,'button','지원 항목 검토').props.onClick();tree=render();assert(nodes(tree).some(node=>node.props?.role==='alert'));assert.equal(find(tree,'button','폼에 반영'),undefined);
 let resolve;const pending=new Promise(done=>resolve=done);const request=find(tree,'input').props.onChange({target:{files:[{size:9,arrayBuffer:()=>pending}],value:'file'}});tree=render();find(tree,'textarea').props.onChange({target:{value:'PORT=3456'}});resolve(new TextEncoder().encode('PORT=9999').buffer);await request;tree=render();assert.equal(find(tree,'textarea').props.value,'PORT=3456');
 await find(tree,'input').props.onChange({target:{files:[new Blob(['PORT=4567'])],value:'file'}});tree=render();assert.equal(find(tree,'textarea').props.value,'PORT=4567');
 find(tree,'button','지원 항목 검토').props.onClick();rejection='지원 환경 변수에 중복 항목이 있습니다.';tree=render();find(tree,'button','폼에 반영').props.onClick();tree=render();assert.equal(imported.port,3200);assert(find(tree,'button','폼에 반영'),'a rejected import keeps reviewed values available for retry');assert(nodes(tree).some(node=>node.props?.role==='alert'&&node.props.children===rejection));assert(!JSON.stringify(tree).includes('fixture-secret'));rejection='';find(tree,'button','폼에 반영').props.onClick();tree=render();assert.deepEqual(imported,{port:4567});assert(!find(tree,'button','폼에 반영'));assert(!nodes(tree).some(node=>node.props?.role==='alert'));
});
