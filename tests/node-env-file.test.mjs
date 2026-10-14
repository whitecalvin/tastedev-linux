import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import React from 'react';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {nodeEnvFiles,nodeEnvDraftFiles} from '../lib/node-env-files.ts';

test('Node environment catalog lists editable environment paths without file contents',()=>{
 const result=nodeEnvFiles({root:'/fixture/workspace',files:['app.env','nested/worker.env.production','app.env','notes.txt','.env','../app.env','/abs/app.env','nested/.secret.env','nested//app.env','bad\\app.env','bad\napp.env',{name:'app.env',text:'private-fixture'}]});
 assert.deepEqual(result,{root:'/fixture/workspace',files:['app.env','nested/worker.env.production']});assert(!JSON.stringify(result).includes('private-fixture'));assert.deepEqual(nodeEnvFiles({files:'invalid'}),{root:'',files:[]});
});

test('selected environment file reuses Strict Mode reads and rejects late, disconnected or mismatched source responses',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/node-env-file.tsx',import.meta.url),'utf8'),{filename:'node-env-file.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((v,k)=>v!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={fn,deps,cleanup:fn()};});}};
 const drafts={};const native=createRequire(import.meta.url),module={exports:{}};const mocks={react:hooks,'./console-types':consoleTypes,'./language-provider':{useLanguage:()=>({t:value=>value})},'./package-tool':{__esModule:true,default:'PackageTool'},'./draft-provider':{useDraftState:()=>[drafts,()=>{}]},'./ui/controls':{Button:'Button'}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:mocks[name]||native(name),module,module.exports);
 const requests=[];const api=action=>new Promise((resolve,reject)=>requests.push({action,resolve,reject}));let props={name:'one.env',api,connected:true,security:null,requestedProfile:{kind:'nodejs'},view:'settings'};
 const render=()=>{si=ri=ei=0;return module.exports.default(props);};const flush=()=>{while(pending.length)pending.shift()();};const settle=()=>new Promise(resolve=>setImmediate(resolve));
 assert(JSON.stringify(render()).includes('불러오는 중'));flush();for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}await settle();assert.equal(requests.length,1,'Strict Mode must not duplicate the file read');assert.equal(requests[0].action,'file?name=one.env');requests[0].resolve({name:'one.env',text:'PORT=8000\n',version:'one'});await settle();let output=render();assert.equal(output.type,'PackageTool');assert.equal(output.props.recordKey,'nodejs:one.env');assert.equal(output.props.requestedCode.version,'one');
 props={...props,name:'two.env'};assert.notEqual(render().type,'PackageTool','a newly selected file cannot flash the previous file');flush();await settle();assert.equal(requests.length,2);
 props={...props,name:'three.env'};render();flush();await settle();requests[1].resolve({name:'two.env',text:'PORT=9000',version:'two'});await settle();assert.notEqual(render().type,'PackageTool','a late file read cannot replace the current selection');requests[2].resolve({name:'three.env',text:'LOG_LEVEL=info',version:'three'});await settle();assert.equal(render().props.requestedCode.name,'three.env');
 props={...props,connected:false};assert.notEqual(render().type,'PackageTool');flush();await settle();assert.equal(requests.length,3,'disconnected selection cannot issue a read');
 props={...props,connected:true};render();flush();await settle();requests[3].resolve({name:'wrong.env',text:'PORT=3000',version:'wrong'});await settle();assert(JSON.stringify(render()).includes('파일 경로를 확인하세요.'));assert.notEqual(render().type,'PackageTool');
 props={...props,name:'missing.env'};assert(!JSON.stringify(render()).includes('파일 경로를 확인하세요.'),'errors from an old selection must not flash');flush();await settle();requests[4].reject(Error('fixture missing file'));await settle();assert(JSON.stringify(render()).includes('fixture missing file'));
 const retryButton=React.Children.toArray(render().props.children).find(child=>child.type==='Button');retryButton.props.onClick();assert(!JSON.stringify(render()).includes('fixture missing file'),'retry clears the prior error before a fresh read');flush();await settle();assert.equal(requests.length,6);requests[5].resolve({name:'missing.env',text:'PORT=4000',version:'recovered'});await settle();assert.equal(render().props.requestedCode.version,'recovered');

 drafts['nodejs:removed.env']={kind:'nodejs',name:'removed.env',text:'PORT=4567',baseline:'PORT=3000',version:'original'};props={...props,name:'removed.env'};output=render();assert.equal(output.type,'PackageTool');assert.equal(output.props.requestedCode.version,'original');flush();await settle();assert.equal(requests.length,6,'a recoverable buffer opens without requiring the missing disk file');
});


test('only dirty Node environment buffers appear as recoverable file nodes',()=>{
 assert.deepEqual(nodeEnvDraftFiles({'nodejs:one.env':{name:'one.env',kind:'nodejs',text:'edited',baseline:'original'},'nodejs:two.env':{name:'two.env',kind:'nodejs',text:'same',baseline:'same',guiValues:{port:''}},'nodejs:clean.env':{name:'clean.env',kind:'nodejs',text:'same',baseline:'same'},'redis':{name:'redis.env',kind:'redis',text:'edited',baseline:'original'},'nodejs:wrong.env':{name:'different.env',kind:'nodejs',text:'edited',baseline:'original'}}),['one.env','two.env']);
});
