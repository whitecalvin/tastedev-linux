import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('nginx header has a status indicator and five icon actions and check uses a dedicated modal without service changes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-toolbar.tsx',import.meta.url),'utf8'),{filename:'nginx-toolbar.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let cursor=0,ri=0;const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:()=>{}},native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./console-types'?consoleTypes:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',Dropdown:'select',Checkbox:'input'}:name==='./nginx-icon'?{__esModule:true,default:'svg'}:(name==='./nginx-recovery-panel'||name==='./nginx-backups-panel')?{default:'section'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const calls=[];const props={connected:true,security:{settings:{readOnly:false,nginxChanges:true,serviceChanges:true,sudoWithoutPrompt:true},available:{}},api:async(...args)=>{calls.push(args);return{logs:'syntax is ok'};}};
 function render(){cursor=ri=0;return module.exports.default(props);}const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(node.props?.children,child=>found??=find(child,predicate));return found;};
 const header=find(render(),node=>node.props?.className==='nginx-header-actions');const actions=React.Children.toArray(header.props.children);assert.deepEqual(actions.map(node=>node.props['aria-label']),['시작','중지','검수','백업','복원']);assert.ok(find(render(),node=>node.type==='span'&&node.props.role==='status'));actions[2].props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(calls,[['nginx-check',{}]]);assert.equal(states[0],'check');const log=find(render(),node=>node.type==='pre'&&node.props.className==='nginx-shell-log');assert.match(log.props.children,/\$ nginx -t\nsyntax is ok/);assert.ok(find(render(),node=>node.type==='dialog'));actions[3].props.onClick();assert.equal(states[0],'backup');assert.equal(calls.length,1);
 props.files=[{name:'common.conf',path:'/etc/nginx/common.conf',source:'server_tokens off;'}, {name:'uneditable.txt',path:'/etc/nginx/uneditable.txt'}, {name:'options',path:'/etc/letsencrypt/options-ssl-nginx.conf',readOnly:true}, {name:'locked.conf',path:'/etc/nginx/locked.conf',readOnly:true}];
 const choices=find(render(),node=>node.type==='select'&&node.props.label==='설정 파일').props.options;assert.deepEqual(choices.map(item=>item.value),['','/etc/nginx/common.conf']);
 actions[4].props.onClick();await new Promise(resolve=>setImmediate(resolve));const restoreTree=render();assert.equal(states[0],'restore');assert.deepEqual(calls,[['nginx-check',{}]],'restore opening delegates listing to the nginx-specific panel, without legacy backup API');assert.equal(find(restoreTree,node=>node.type==='select'&&node.props.label==='복구할 백업'),null,'no second legacy restore selector');const restorePanel=find(restoreTree,node=>node.props?.expanded===true);assert.ok(restorePanel);assert.equal(restorePanel.props.api,props.api);assert.equal(restorePanel.props.allowed,true);assert.equal(find(restoreTree,node=>node.type==='input'),null,'no duplicate legacy confirmation control');

});

test('a late status poll cannot overwrite a completed nginx start action',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-toolbar.tsx',import.meta.url),'utf8'),{filename:'nginx-toolbar.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[];let cursor=0,ri=0;const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:fn=>effects.push(fn)},native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./console-types'?consoleTypes:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',Dropdown:'select',Checkbox:'input'}:name==='./nginx-icon'?{__esModule:true,default:'svg'}:(name==='./nginx-recovery-panel'||name==='./nginx-backups-panel')?{default:'section'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let deliverPoll;const props={connected:true,security:{settings:{readOnly:false,nginxChanges:true,serviceChanges:true,sudoWithoutPrompt:true},available:{}},api:async action=>{if(action.startsWith('operations')){assert.equal(action,'operations?unit=nginx.service','nginx poll reads only nginx');return new Promise(resolve=>deliverPoll=resolve);}return{services:[{unit:'nginx.service',ActiveState:'active'}]};}};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(node.props?.children,child=>found??=find(child,predicate));return found;};
 function render(){cursor=ri=0;return module.exports.default(props);}const tree=render(),cleanups=effects.map(fn=>fn());
 try{find(tree,node=>node.props?.['aria-label']==='시작').props.onClick();const confirmation=find(render(),node=>node.type==='confirm-dialog');assert.ok(confirmation.props.request);await confirmation.props.onConfirm();assert.equal(states[1].ActiveState,'active');assert.equal(states[0],'start');deliverPoll({services:[{unit:'nginx.service',ActiveState:'inactive'}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(states[1].ActiveState,'active');}finally{for(const cleanup of cleanups)cleanup?.();}

});

test('nginx service dialog requires current approval, rejects changed connection or permission, and sends one fixed service request',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-toolbar.tsx',import.meta.url),'utf8'),{filename:'nginx-toolbar.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let cursor=0,ri=0;const hooks={...React,useEffect:()=>{},useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial})};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./ui/controls'?{Button:'button',Dropdown:'select',Checkbox:'input'}:name==='./nginx-icon'?{__esModule:true,default:'svg'}:(name==='./nginx-recovery-panel'||name==='./nginx-backups-panel')?{default:'section'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const calls=[];let finish;const api=async(...args)=>{calls.push(args);return new Promise(resolve=>finish=resolve);};
 const props={api,connected:true,security:{version:'v1',settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{}}};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(node.props?.children,child=>found??=find(child,predicate));return found;};
 const render=()=>{cursor=ri=0;return module.exports.default(props);};const action=name=>find(render(),node=>node.props?.['aria-label']===name).props.onClick();const confirmation=()=>find(render(),node=>node.type==='confirm-dialog');
 action('시작');assert.equal(calls.length,0);assert.match(confirmation().props.request.message,/시작/);confirmation().props.onCancel();assert.equal(confirmation().props.request,null);assert.equal(calls.length,0);
 for(const mutation of ['connection','permission','version','api']){
  props.api=api;props.connected=true;props.security.version='v1';props.security.settings.readOnly=false;action('시작');
  if(mutation==='connection')props.connected=false;if(mutation==='permission')props.security.settings.readOnly=true;if(mutation==='version')props.security.version='v2';if(mutation==='api')props.api=async()=>{throw Error('wrong target');};
  await confirmation().props.onConfirm();assert.equal(calls.length,0,mutation);assert.equal(confirmation().props.request,null);
 }
 props.api=api;props.connected=true;props.security.version='v1';props.security.settings.readOnly=false;
 action('시작');const old=confirmation();action('중지');await old.props.onConfirm();assert.equal(calls.length,0,'old approval cannot execute a newer stop request');assert.match(confirmation().props.request.message,/중지/);
 const approval=confirmation();const pending=approval.props.onConfirm();await approval.props.onConfirm();assert.deepEqual(calls,[['service',{unit:'nginx.service',action:'stop',confirm:true}]]);assert.equal(states[0],'stop');assert.equal(states[2],true);
 finish({services:[{unit:'nginx.service',ActiveState:'inactive'}],logs:'stopped'});await pending;assert.equal(states[1].ActiveState,'inactive');assert.match(states[3],/systemctl stop nginx.service\nstopped/);assert.equal(states[2],false);
 await approval.props.onConfirm();assert.equal(calls.length,1,'consumed approval cannot be replayed');
});


test('nginx SSR service state survives mount effects and clears on connection changes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-toolbar.tsx',import.meta.url),'utf8'),{filename:'nginx-toolbar.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='./language-provider'?{useLanguage:()=>({t:x=>x})}:name==='./ui/controls'?{Button:'button',Dropdown:'select',Checkbox:'input'}:name==='./nginx-icon'?{__esModule:true,default:'svg'}:(name==='./nginx-recovery-panel'||name==='./nginx-backups-panel')?{default:'section'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const service={unit:'nginx.service',ActiveState:'active'},deliveries=[];
 let props={initialService:service,connected:true,security:{version:'v1',settings:{readOnly:true},available:{}},api:()=>new Promise(resolve=>deliveries.push(resolve))};
 const render=()=>{si=ri=ei=0;return module.exports.default(props);},flush=()=>{while(pending.length)pending.shift()();};
 try{
  render();assert.equal(states[1],service,'server render contains actual service status');flush();render();flush();assert.equal(states[1],service,'hydration keeps SSR status while fresh poll is pending');
  props={...props,connected:false};render();flush();assert.equal(states[1],null);
  deliveries[0]({services:[service]});await new Promise(resolve=>setImmediate(resolve));assert.equal(states[1],null,'response from old connection is ignored');
  props={...props,connected:true};render();flush();assert.equal(states[1],null,'reconnect does not restore stale SSR service');
  deliveries[1]({services:[{...service,ActiveState:'inactive'}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(states[1].ActiveState,'inactive');
  props={...props,security:{...props.security,version:'v2'}};render();flush();assert.equal(states[1],null,'policy change requires fresh status');
 }finally{for(const effect of effects)effect?.cleanup?.();}
});
