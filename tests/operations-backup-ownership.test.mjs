import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
async function fixture(api,initialTab='backups'){
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useCallback:fn=>fn,useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const native=createRequire(import.meta.url),module={exports:{}};new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):['./nginx-backups-panel','./postgresql-code-recovery','./ai-log-assistant'].includes(name)?{__esModule:true,default:'FixturePanel'}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name),module,module.exports);
 const props={api,connected:true,initialTab,security:{version:'fixture',settings:{readOnly:false,cronChanges:true},available:{cronChanges:true}}};
 function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.children===label||node.props?.label===label||node.props?.['aria-label']===label)return node;const children=node.props?.children;for(const child of Array.isArray(children)?children:[children]){if(Array.isArray(child)){for(const item of child){const found=find(item,label);if(found)return found;}}else{const found=find(child,label);if(found)return found;}}}
 const flush=()=>{while(pending.length)pending.shift()();},render=(runEffects=true)=>{si=ri=ei=0;const tree=module.exports.default(props);if(runEffects)flush();return tree;};
 render();states[12]='cron';
 return {states,props,render,flush,find,button:label=>find(render(),label),dispose:()=>effects.forEach(effect=>effect?.cleanup?.())};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const record=id=>({id,kind:'cron',createdAt:'2026-10-06T00:00:00Z',target:'fixture',sha256:'b'.repeat(64),text:'backup '+id});
const preview=id=>({current:'current '+id,version:'c'.repeat(64),record:record(id)});
test('manual backup is single-flight and an old catalog cannot populate a replaced connection',async()=>{
 const backup=deferred(),catalog=deferred(),calls=[];const f=await fixture((action,input)=>{calls.push({action,input});return action==='backup'?backup.promise:catalog.promise;});try{
 const button=f.button('지금 백업'),request=button.props.onClick();await button.props.onClick();assert.equal(calls.length,1);backup.resolve({});await Promise.resolve();await Promise.resolve();assert.equal(calls[1].action,'backups');
 f.props.api=async()=>({backups:[record('new')]});f.render(false);catalog.resolve({backups:[record('old')]});await request;assert.deepEqual(f.states[14],[]);assert.equal(f.states[7],'');await button.props.onClick();assert.equal(calls.length,2,'retained old handler cannot start another backup');f.flush();assert.equal(f.states[6],false);
 }finally{f.dispose();}
});
test('restore comparison and late failures belong to the initiating connection',async()=>{
 const pending=deferred(),calls=[];const f=await fixture(action=>{calls.push(action);return pending.promise;});try{
 f.states[14]=[record('a')];f.states[15]='a';const button=f.button('복구 내용 비교'),request=button.props.onClick();f.props.api=async()=>({});f.render(false);pending.resolve(preview('a'));await request;assert.equal(f.states[16],null);await button.props.onClick();assert.equal(calls.length,1);f.flush();
 const failure=deferred();f.props.api=()=>failure.promise;f.render();const failed=f.button('복구 내용 비교').props.onClick();f.props.connected=false;f.render(false);failure.reject(Error('old connection failed'));await failed;assert.equal(f.states[7],'');f.flush();assert.equal(f.states[6],false);
 }finally{f.dispose();}
});
test('restore mutation is single-flight and changing the selection preserves the next selection',async()=>{
 const mutation=deferred(),calls=[];const f=await fixture((action,input)=>{calls.push({action,input});return action==='restore'?mutation.promise:Promise.resolve(preview('a'));});try{
 f.states[14]=[record('a'),record('b')];f.states[15]='a';await f.button('복구 내용 비교').props.onClick();f.button('비교한 설정으로 복구하는 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});const button=f.button('이 백업으로 복구'),request=button.props.onClick();await button.props.onClick();assert.equal(calls.filter(item=>item.action==='restore').length,1);assert.deepEqual(calls[1].input,{id:'a',version:'c'.repeat(64),confirm:true,privileged:false,backupVersion:'b'.repeat(64)});
 f.button('복구할 백업').props.onChange({target:{value:'b'}});f.render();mutation.resolve({});await request;assert.equal(f.states[15],'b');assert.equal(f.states[16],null);assert.equal(f.states[7],'');assert.equal(calls.length,2,'old completion must not refresh the next selection catalog');
 }finally{f.dispose();}
});
test('changing connection hides a reviewed restore immediately and rejects its retained submit handler',async()=>{
 const calls=[];const f=await fixture(async(action,input)=>{calls.push({action,input});return preview('a');});try{
 f.states[14]=[record('a')];f.states[15]='a';await f.button('복구 내용 비교').props.onClick();f.button('비교한 설정으로 복구하는 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});const old=f.button('이 백업으로 복구');f.props.api=async()=>({});const tree=f.render(false);assert.equal(f.find(tree,'이 백업으로 복구'),undefined);await old.props.onClick();assert.equal(calls.length,1);f.flush();assert.equal(f.states[5],false);assert.equal(f.states[16],null);
 }finally{f.dispose();}
});

test('catalog removal or replacement hides an obsolete review and rejects its retained submit',async()=>{
 for(const replacement of [[],[{...record('a'),sha256:'d'.repeat(64)}]]){
  const calls=[];const f=await fixture(async(action,input)=>{calls.push({action,input});return preview('a');});try{
   f.states[14]=[record('a')];f.states[15]='a';await f.button('복구 내용 비교').props.onClick();
   f.button('비교한 설정으로 복구하는 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});
   const old=f.button('이 백업으로 복구');f.states[14]=replacement;
   const tree=f.render(false);assert.equal(f.find(tree,'이 백업으로 복구'),undefined);
   await old.props.onClick();assert.equal(calls.length,1,'catalog changes require a new comparison');
   if(!replacement.length)assert.equal(f.find(tree,'복구 내용 비교').props.disabled,true);
   else{await f.button('복구 내용 비교').props.onClick();assert(f.button('이 백업으로 복구'));}
  }finally{f.dispose();}
 }
});
test('a comparison arriving after catalog removal cannot recreate the obsolete review',async()=>{
 const pending=deferred();const f=await fixture(()=>pending.promise);try{
  f.states[14]=[record('a')];f.states[15]='a';const request=f.button('복구 내용 비교').props.onClick();
  f.states[14]=[];f.render(false);pending.resolve(preview('a'));await request;
  assert.equal(f.states[16],null);assert.equal(f.button('복구 내용 비교').props.disabled,true);
 }finally{f.dispose();}
});

test('manual logs from a previous API connection are discarded before effects run',async()=>{
 const pending=deferred();const f=await fixture(action=>action==='operations'?Promise.resolve({services:[],permissions:{}}):pending.promise,'logs');try{
  const request=f.button('로그 조회').props.onClick();f.props.api=async()=>({services:[],permissions:{},text:'new connection'});f.render(false);
  pending.resolve({text:'previous connection'});await request;assert.equal(f.states[10],null);
  assert.equal(f.button('AI 오류 해결 도우미').props.disabled,true);
  await f.button('로그 조회').props.onClick();assert.equal(f.states[10].text,'new connection');
 }finally{f.dispose();}
});
test('connection replacement immediately hides displayed logs and the captured AI dialog',async()=>{
 const f=await fixture(async action=>action==='operations'?{services:[],permissions:{}}:{text:'private old log'},'logs');try{
  await f.button('로그 조회').props.onClick();const old=f.button('AI 오류 해결 도우미');old.props.onClick();
  assert(f.button('AI 오류 해결 도우미'));
  f.props.api=async()=>({services:[],permissions:{}});const tree=f.render(false);
  assert.equal(f.find(tree,'private old log'),undefined);assert.equal(f.find(tree,'서버 로그').props.children,'표시할 로그가 없습니다.');
  assert.equal(f.find(tree,'로그 다운로드').props.disabled,true);assert.equal(f.find(tree,'AI 오류 해결 도우미').props.disabled,true);
  const prior=f.states[19];old.props.onClick();assert.equal(f.states[19],prior,'retained AI action must not recapture old logs');
  const dialogs=[];function visit(node){if(!node||typeof node!=='object')return;if(node.type==='dialog')dialogs.push(node);for(const child of [node.props?.children].flat(Infinity))visit(child);}visit(tree);assert.equal(dialogs.length,0);
 }finally{f.dispose();}
});

test('a pending live poll cannot populate a replacement connection before cleanup effects',async()=>{
 const pending=deferred();let queries=0;const f=await fixture(action=>action==='operations'?Promise.resolve({services:[],permissions:{}}):(queries++,pending.promise),'logs');try{
  f.button('3초마다 새로고침').props.onChange({target:{checked:true}});f.render();assert.equal(queries,1);
  f.props.api=async()=>({services:[],permissions:{}});f.render(false);pending.resolve({text:'obsolete poll'});
  await Promise.resolve();await Promise.resolve();assert.equal(f.states[10],null);assert.equal(f.states[7],'');
 }finally{f.dispose();}
});

// Package recovery entry points must follow the current installed inventory.
test('recovery routes include installed Redis and Node and disappear when disconnected',async()=>{
 const f=await fixture(async()=>({services:[],permissions:{}}));
 const routes=tree=>{const found=[];function visit(node){if(Array.isArray(node)){node.forEach(visit);return;}if(!node||typeof node!=='object')return;if(node.props?.className==='package-config-link')found.push(node.props.href);visit(toastTestChildren(node));}visit(tree);return found;};
 try{
  f.props.installedPackages=[{id:'postgresql',installed:true},{id:'mariadb',installed:false},{id:'redis',installed:true},{id:'nodejs',installed:true}];
  assert.deepEqual(routes(f.render()),['/ide/packages/postgresql','/ide/packages/redis','/ide/packages/nodejs']);
  f.props.installedPackages=[{id:'mariadb',installed:true},{id:'redis',installed:false},{id:'nodejs',installed:false}];
  assert.deepEqual(routes(f.render()),['/ide/packages/mariadb']);
  f.props.connected=false;assert.deepEqual(routes(f.render()),[]);
 }finally{f.dispose();}
});
