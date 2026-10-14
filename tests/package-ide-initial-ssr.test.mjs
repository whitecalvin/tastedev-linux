import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import * as packageIdeTypes from '../components/package-ide-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
async function compile(file,mocks){
 await loadBindings();
 const result=await transform(await readFile(new URL(file,import.meta.url),'utf8'),{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const module={exports:{}};
 new Function('require','module','exports',result.code)(name=>name==='./package-ide-types'?packageIdeTypes:name==='./console-types'?consoleTypes:Object.hasOwn(mocks,name)?mocks[name]:name==='./ui/ide-split-layout'?{__esModule:true,default:'div'}:native(name),module,module.exports);
 return module.exports.default;
}
for(const kind of ['certbot','postgresql','redis','mariadb']){
 test(kind+' server page authenticates before passing configuration and service snapshot',async()=>{
  const calls=[],status={packages:[]},security={version:'fixture'},files=kind==='certbot'?[{name:'fixture.example'}]:[{path:kind==='redis'?'/etc/redis/redis.conf':kind==='mariadb'?'/etc/mysql/mariadb.conf.d/50-server.cnf':'/etc/postgresql/16/main/postgresql.conf'}];
  const unit=kind==='certbot'?'certbot.timer':kind==='redis'?'redis-server.service':kind==='mariadb'?'mariadb.service':'postgresql.service',service={unit,ActiveState:'active'};
  let authorized=true;
  const page=await compile('../app/(console)/ide/packages/[package]/page.tsx',{
   '../../../../../components/console-workspace':{__esModule:true,default:'ConsoleWorkspace'},
   '../../../../../lib/console-route.ts':{packageConsoleView:()=> 'ide'},
   '../../../../../lib/page-session.ts':{requirePageSession:async destination=>{calls.push(destination);if(!authorized)throw Error('login redirect');}},
   '../../../../../lib/console-initial-data.ts':{initialStatus:async()=>{calls.push('status');return status;},initialSecurity:async()=>{calls.push('security');return security;},initialServices:async requestedUnit=>{assert.equal(requestedUnit,unit);calls.push('services');return [service];}},
   '../../../../../lib/nginx-tree.ts':{nginxTree:async()=>{throw Error('unexpected nginx read');}},
   '../../../../../lib/site-status.ts':{managedSites:async()=>{throw Error('unexpected sites read');},certificates:async()=>{calls.push('certificates');return {certificates:files,warning:'fixture warning'};}},
   '../../../../../lib/config-live.ts':{liveConfig:async input=>{assert.equal(input,kind);calls.push('config');return {configs:files,warnings:['fixture warning']};}},
   '../../../../../lib/node-workspace-tree.ts':{nodeWorkspaceTree:async()=>{throw Error('unexpected workspace read');}},
  '../../../../../lib/node-apps.ts':{nodeApps:async()=>{throw Error('unexpected node read');}},
  'next/navigation':{notFound:()=>{throw Error('not found');}},
  });
  const rendered=await page({params:Promise.resolve({package:kind})});
  assert.equal(calls[0],'/ide/packages/'+kind);
  assert.deepEqual(rendered.props.initialData,{status,security,packageIde:{kind,files,service,error:'fixture warning'}});
  assert.equal(calls.includes(kind==='certbot'?'config':'certificates'),false,'only the selected package may load its metadata');
  calls.length=0;authorized=false;
  await assert.rejects(page({params:Promise.resolve({package:kind})}),/login redirect/);
  assert.deepEqual(calls,['/ide/packages/'+kind]);
 });
 test(kind+' SSR explorer survives hydration and Strict Mode effect replay; refresh and reconnect use fresh data',async()=>{
  const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
  const hooks={
   useState:initial=>{const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},
   useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},
   useCallback:(fn,deps)=>{const ref=hooks.useRef(null);if(!ref.current||deps.some((value,k)=>value!==ref.current.deps[k]))ref.current={fn,deps};return ref.current.fn;},
   useMemo:(fn,deps)=>{const ref=hooks.useRef(null);if(!ref.current||deps.some((value,k)=>value!==ref.current.deps[k]))ref.current={value:fn(),deps};return ref.current.value;},
   useId:()=> 'fixture-title',
   useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={fn,deps,cleanup:fn()};});},
  };
  const mocks={react:hooks,'./draft-provider':{useDraftState:(_,initial)=>hooks.useState(initial)},'./language-provider':{useLanguage:()=>({t:value=>value})},'./ui/controls':{Button:'Button'}, './ui/toast-provider':toastTestModuleWithReact(hooks)};
  for(const name of ['postgresql-data-backups','redis-backups','mariadb-backups','postgresql-completed-history','postgresql-code-recovery','postgresql-code-operation','mariadb-code-operation','redis-code-operation','package-config','mariadb-settings','redis-settings','postgresql-settings','postgresql-hba-settings','server-manager','config-code-editor','postgresql-restore','postgresql-hba-operation'])mocks['./'+name]={__esModule:true,default:name};
  const ide=await compile('../components/package-config-ide.tsx',mocks);
  const all=(tree,predicate,result=[])=>{if(!tree)return result;if(Array.isArray(tree)){for(const child of tree)all(child,predicate,result);return result;}if(predicate(tree))result.push(tree);all(tree.props?.children,predicate,result);return result;};
  const render=props=>{si=ri=ei=0;return ide(props);};
  const flush=()=>{while(pending.length)pending.shift()();};
  const initialFile=kind==='certbot'?{name:'initial.example',status:'valid'}:{path:'/etc/postgresql/16/main/postgresql.conf',values:{},version:'initial',...(kind==='mariadb'?{groups:['client','mysqld','mariadb-11.4']}: {})};
  const nextFile=kind==='certbot'?{name:'next.example',status:'valid'}:{path:'/etc/postgresql/17/main/postgresql.conf',values:{},version:'next'};
  const unit=kind==='certbot'?'certbot.timer':kind==='redis'?'redis-server.service':kind==='mariadb'?'mariadb.service':'postgresql.service',service={unit,ActiveState:'active'},requests=[];
  const api=async action=>{requests.push(action);return action==='operations?unit='+({certbot:'certbot.timer',postgresql:'postgresql.service',redis:'redis-server.service',mariadb:'mariadb.service'})[kind]?{services:[service]}:kind==='certbot'?{certificates:[nextFile]}:{configs:[nextFile],warnings:[]};};
  let props={kind,connected:true,api,security:null,initialData:{kind,files:[initialFile],service,error:'fixture warning'}};
  let output=render(props);
  assert(all(output,node=>node.type==='button'&&node.props.title===(initialFile.path||initialFile.name)).length,'the first server render includes the discovered file');
  assert(JSON.stringify(output).includes('왼쪽 노드를 선택하세요.'));if(kind==='mariadb')for(const group of initialFile.groups)assert(all(output,node=>node.type==='button'&&node.props.children==='['+group+']').length,'actual groups must exist in the first server render');
  flush();output=render(props);flush();assert.deepEqual(requests,[]);
  for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}
  output=render(props);flush();assert.deepEqual(requests,[],'Strict Mode replay must not reload the seeded tree');
  assert(all(output,node=>node.type==='button'&&node.props.title===(initialFile.path||initialFile.name)).length);
  assert(JSON.stringify(output).includes('fixture warning'),'server read warnings must survive initialization');
  const reload=all(output,node=>node.props?.['aria-label']==='새로고침')[0];assert(reload);
  await reload.props.onClick();output=render(props);flush();
  assert(all(output,node=>node.type==='button'&&node.props.title===(nextFile.path||nextFile.name)).length);
  assert.equal(requests.length,2,'manual refresh must still work after effect cleanup and replay');
  props={...props,connected:false};render(props);flush();output=render(props);flush();
  assert.equal(all(output,node=>node.type==='button'&&node.props.title===(nextFile.path||nextFile.name)).length,0);
  props={...props,connected:true};render(props);flush();await new Promise(resolve=>setImmediate(resolve));output=render(props);flush();
  assert(all(output,node=>node.type==='button'&&node.props.title===(nextFile.path||nextFile.name)).length);
  assert.equal(requests.length,4);assert.equal(requests.filter(action=>action==='operations?unit='+encodeURIComponent(unit)).length,2,'refresh and reconnect read only this package service');assert(!requests.includes('operations'),'package refresh must not read all unrelated services');
 });
}

test('remaining package pages authenticate and seed status without loading unrelated package configs',async()=>{
 const calls=[],status={packages:[]},security={version:'fixture'},apps={apps:[{id:'fixture',label:'Fixture'}],version:'fixture'};let authorized=true,registryError=false,workspaceError=false;
 const page=await compile('../app/(console)/ide/packages/[package]/page.tsx',{
  '../../../../../components/console-workspace':{__esModule:true,default:'ConsoleWorkspace'},
  '../../../../../lib/console-route.ts':{packageConsoleView:()=> 'ide'},
  '../../../../../lib/page-session.ts':{requirePageSession:async destination=>{calls.push(destination);if(!authorized)throw Error('login redirect');}},
  '../../../../../lib/console-initial-data.ts':{initialStatus:async()=>{calls.push('status');return status;},initialSecurity:async()=>{calls.push('security');return security;},initialServices:async()=>{throw Error('unexpected service read');}},
  '../../../../../lib/nginx-tree.ts':{nginxTree:async()=>{throw Error('unexpected nginx read');}},
  '../../../../../lib/site-status.ts':{managedSites:async()=>{throw Error('unexpected sites read');},certificates:async()=>{throw Error('unexpected certificate read');}},
  '../../../../../lib/config-live.ts':{liveConfig:async()=>{throw Error('unexpected config read');}},
  '../../../../../lib/node-workspace-tree.ts':{nodeWorkspaceTree:async()=>{calls.push('workspace');if(workspaceError)throw Error('fixture workspace unavailable');return {root:'/fixture/workspace',files:['app.env']};}},
  '../../../../../lib/node-apps.ts':{nodeApps:async()=>{calls.push('apps');if(registryError)throw Error('fixture registry unavailable');return apps;}},
  'next/navigation':{notFound:()=>{throw Error('not found');}},
 });
 for(const kind of ['nodejs']){
  calls.length=0;authorized=true;
  const rendered=await page({params:Promise.resolve({package:kind})});
  assert.equal(calls[0],'/ide/packages/'+kind);
  assert.deepEqual(rendered.props.initialData,{status,security,nodeIde:{...apps,workspace:{root:'/fixture/workspace',files:['app.env']}}});
  calls.length=0;authorized=false;
  await assert.rejects(page({params:Promise.resolve({package:kind})}),/login redirect/);
  assert.deepEqual(calls,['/ide/packages/'+kind]);
  authorized=true;registryError=true;const unavailable=await page({params:Promise.resolve({package:kind})});assert.deepEqual(unavailable.props.initialData.nodeIde,{apps:[],error:'fixture registry unavailable',workspace:{root:'/fixture/workspace',files:['app.env']}});workspaceError=true;const missingWorkspace=await page({params:Promise.resolve({package:kind})});assert.deepEqual(missingWorkspace.props.initialData.nodeIde.workspace,{root:'',files:[],error:'fixture workspace unavailable'});
 }
});
