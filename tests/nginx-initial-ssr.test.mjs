import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const native=createRequire(import.meta.url);
async function compile(file,mocks){
 await loadBindings();
 const source=await readFile(new URL(file,import.meta.url),'utf8');
 const result=await transform(source,{filename:file,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const module={exports:{}};
 new Function('require','module','exports',result.code)(name=>name==='./console-types'?consoleTypes:Object.hasOwn(mocks,name)?mocks[name]:native(name),module,module.exports);
 return module.exports.default;
}
test('nginx server page authenticates before reading its initial snapshot',async()=>{
 const order=[],tree={files:[]},status={packages:[]},security={version:'fixture'},sites=[],service={unit:'nginx.service',ActiveState:'active'};
 let authorized=true;
 const page=await compile('../app/(console)/ide/packages/[package]/page.tsx',{
  '../../../../../components/console-workspace':{__esModule:true,default:'ConsoleWorkspace'},
  '../../../../../lib/console-route.ts':{packageConsoleView:()=> 'server-settings'},
  '../../../../../lib/page-session.ts':{requirePageSession:async destination=>{order.push(destination);if(!authorized)throw Error('login redirect');}},
  '../../../../../lib/console-initial-data.ts':{initialStatus:async()=>{order.push('status');return status;},initialSecurity:async()=>{order.push('security');return security;},initialServices:async unit=>{assert.equal(unit,'nginx.service');order.push('services');return [service];}},
  '../../../../../lib/nginx-tree.ts':{nginxTree:async()=>{order.push('tree');return tree;}},
  '../../../../../lib/config-live.ts':{liveConfig:async()=>{throw Error('not a nginx read');}},
  '../../../../../lib/site-status.ts':{managedSites:async()=>{order.push('sites');return {sites};}},
  '../../../../../lib/node-workspace-tree.ts':{nodeWorkspaceTree:async()=>{throw Error('unexpected workspace read');}},
  '../../../../../lib/node-apps.ts':{nodeApps:async()=>{throw Error('unexpected node read');}},
  'next/navigation':{notFound:()=>{throw Error('not found');}},
 });
 const rendered=await page({params:Promise.resolve({package:'nginx'})});
 assert.equal(order[0],'/ide/packages/nginx');
 assert.deepEqual(rendered.props.initialData,{status,security,nginx:{tree,sites,service}});
 order.length=0;authorized=false;
 await assert.rejects(page({params:Promise.resolve({package:'nginx'})}),/login redirect/);
 assert.deepEqual(order,['/ide/packages/nginx'],'unauthenticated requests must not read nginx configuration');
});
test('SSR nginx tree survives hydration without a duplicate load; refresh and reconnect still work',async()=>{
 const states=[],refs=[],effects=[],pending=[];let si=0,ri=0,ei=0;
 const hooks={
  useState:initial=>{const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},
  useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},
  useCallback:(fn,deps)=>{const ref=hooks.useRef(null);if(!ref.current||deps.some((value,k)=>value!==ref.current.deps[k]))ref.current={fn,deps};return ref.current.fn;},
  useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,k)=>value!==effects[i].deps[k]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});},
 };
 const mocks={react:hooks,'./draft-provider':{useDraftState:(_,initial)=>hooks.useState(initial)},'./language-provider':{useLanguage:()=>({t:value=>value,locale:'ko'})},'./ui/controls':Object.fromEntries(['Button','TextInput','Dropdown','Checkbox','Switch','Progress','Badge'].map(key=>[key,key])), './ui/toast-provider':toastTestModuleWithReact(hooks)};
 for(const name of ['nginx-toolbar','nginx-config-tree','config-code-editor','ai-log-assistant','certificate-job-history'])mocks['./'+name]={__esModule:true,default:name};
 const manager=await compile('../components/server-manager.tsx',mocks);
 const find=(tree,type)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,type)).find(Boolean);return tree.type===type?tree:find(toastTestChildren(tree),type);};
 const render=props=>{si=ri=ei=0;return manager(props);};
 const flush=()=>{while(pending.length)pending.shift()();};
 const initialTree={files:[{path:'/etc/nginx/nginx.conf',source:'http {}',nodes:[]}]},sites=[{domain:'fixture.example',path:'/etc/nginx/conf.d/fixture.conf'}],requests=[];
 const updated={files:[]};
 let props={connected:true,initialData:{tree:initialTree,sites,service:{unit:'nginx.service',ActiveState:'active'}},api:async action=>{requests.push(action);return action==='nginx-live'?{sites:[]}:updated;}};
 let output=render(props);
 assert.equal(find(output,'nginx-config-tree').props.data,initialTree,'initial server render already contains the tree');
 flush();output=render(props);flush();
 assert.equal(find(output,'nginx-config-tree').props.data,initialTree);
 assert.equal(find(output,'nginx-toolbar').props.sites,sites);
 assert.equal(find(output,'nginx-toolbar').props.initialService.ActiveState,'active');
 assert.deepEqual(requests,[],'hydration must not discard or reload the SSR snapshot');
 await find(output,'nginx-toolbar').props.onReload();
 output=render(props);flush();assert.equal(find(output,'nginx-config-tree').props.data,updated);
 assert.deepEqual(requests,['nginx-live','nginx-tree']);
 props={...props,connected:false};render(props);flush();output=render(props);flush();
 assert.equal(find(output,'nginx-config-tree').props.data,null);
 props={...props,connected:true};render(props);flush();await new Promise(resolve=>setImmediate(resolve));output=render(props);flush();
 assert.equal(find(output,'nginx-config-tree').props.data,updated);
 assert.equal(requests.length,4,'a new connection must read fresh data rather than restore stale SSR data');
});
