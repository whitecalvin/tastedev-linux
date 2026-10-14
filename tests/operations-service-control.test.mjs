import {toastTestModule,toastTestChildren,toastTestModuleWithReact} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('service control rejects unconfirmed and duplicate requests and ignores result after target changes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/operations-panel.tsx',import.meta.url),'utf8'),{filename:'operations-panel.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[];let si=0,ri=0;const hooks={useState:initial=>{const index=si++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];},useRef:initial=>{const index=ri++;return refs[index]??(refs[index]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
 const native=createRequire(import.meta.url),module={exports:{}};const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text,locale:'ko'})}:name==='./ui/controls'?Object.fromEntries(['Button','Dropdown','TextInput','Checkbox','Switch','Badge'].map(key=>[key,key])):name==='./postgresql-code-recovery'?{__esModule:true,default:'PostgreSQLCodeRecovery'}:name==='./nginx-backups-panel'?{__esModule:true,default:'NginxBackupsPanel'}:name==='./ai-log-assistant'?{default:'div'}:name==='./node-apps'?{__esModule:true,default:'NodeApps'}:native(name);new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const requests=[];const props={connected:true,initialTab:'services',initialData:{services:[{unit:'nginx.service',LoadState:'loaded'},{unit:'redis-server.service',LoadState:'loaded'}],permissions:{}},security:{version:'fixture',settings:{readOnly:false,serviceChanges:true,sudoWithoutPrompt:true},available:{serviceChanges:true},privilege:{ready:true}},api:(action,body)=>new Promise(resolve=>requests.push({action,body,resolve}))};
 const render=()=>{si=ri=0;return module.exports.default(props);};const find=(tree,predicate)=>{if(!tree)return null;if(Array.isArray(tree))return tree.map(child=>find(child,predicate)).find(Boolean);if(predicate(tree))return tree;return find(toastTestChildren(tree),predicate);};
 let tree=render();await find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick();assert.equal(requests.length,0);
 find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});tree=render();const click=find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick;const first=click();await click();assert.equal(requests.length,1);assert.deepEqual(requests[0].body,{unit:'nginx.service',action:'reload',confirm:true});
 find(tree,node=>node.props?.label==='대상 서비스').props.onChange({target:{value:'redis-server.service'}});render();requests[0].resolve({services:[{unit:'stale.service'}],logs:'stale operation result',warnings:['이전 연결의 안내']});await first;tree=render();assert(!find(tree,node=>node.props?.children==='stale operation result'));assert(!find(tree,node=>node.props?.children==='이전 연결의 안내'));assert(!find(tree,node=>node.type==='strong'&&node.props.children==='stale.service'));assert.equal(find(tree,node=>node.props?.label==='대상 서비스').props.value,'redis-server.service');
 find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});tree=render();const second=find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick();assert.equal(requests.length,2);requests[1].resolve({services:[{unit:'redis-server.service'}],logs:'current operation result',warnings:['등록 앱 조회 안내']});await second;tree=render();assert(find(tree,node=>node.props?.children==='current operation result'));assert(find(tree,node=>node.props?.children==='등록 앱 조회 안내'));
 const cluster={unit:'postgresql@18-team-one.service',configPath:'/etc/postgresql/18/team-one/postgresql.conf',ActiveState:'active',LoadState:'loaded'};
 states[1]=[cluster];tree=render();find(tree,node=>node.props?.label==='대상 서비스').props.onChange({target:{value:cluster.unit}});tree=render();
 assert.deepEqual(find(tree,node=>node.props?.label==='서비스 작업').props.options.map(option=>option.value),['start','stop','restart','reload']);
 find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});tree=render();
 const clusterAction=find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick();assert.deepEqual(requests[2].body,{unit:cluster.unit,action:'restart',confirm:true,path:cluster.configPath});requests[2].resolve({services:[cluster],logs:'cluster restart',warnings:[]});await clusterAction;tree=render();assert(!find(tree,node=>node.props?.children==='등록 앱 조회 안내'));
 tree=render();const logAction=find(tree,node=>node.props?.['aria-label']==='로그 열기').props.onClick();assert.equal(requests[3].action,'logs?source=postgresql%4018-team-one.service&filter=&path=%2Fetc%2Fpostgresql%2F18%2Fteam-one%2Fpostgresql.conf');requests[3].resolve({text:'cluster logs'});await logAction;

 // A selected unit disappearing after inspection must not accept a retained
 // handler, even when the old screen had already recorded confirmation.
 states[0]='services';states[1]=[{unit:cluster.unit,configPath:cluster.configPath,LoadState:'loaded'}];tree=render();
 find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});tree=render();
 const retained=find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick;
 const beforeCancel=requests.length;find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:false}});render();await retained();assert.equal(requests.length,beforeCancel,'withdrawn confirmation blocks its retained handler');
 tree=render();find(tree,node=>node.props?.label==='선택한 서비스 작업의 운영 영향을 확인했습니다.').props.onChange({target:{checked:true}});tree=render();const reviewed=find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick;const refresh=find(tree,node=>node.props?.['aria-label']==='서비스 상태 조회').props.onClick();assert.equal(requests.at(-1).action,'operations');requests.at(-1).resolve({services:[cluster],permissions:{}});await refresh;render();const afterRefresh=requests.length;await reviewed();assert.equal(requests.length,afterRefresh,'new status lookup invalidates its previous confirmation');
 states[1]=[{unit:cluster.unit,configPath:cluster.configPath,LoadState:'not-found'}];tree=render();
 assert.equal(find(tree,node=>node.props?.children==='서비스 작업 실행').props.disabled,true);
 const count=requests.length;await retained();assert.equal(requests.length,count);
 await find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick();assert.equal(requests.length,count);
 assert(find(tree,node=>node.props?.children==='선택한 서비스가 설치되지 않았습니다. 패키지를 설치한 뒤 서비스 상태를 다시 조회하세요.'));
 states[1]=[{unit:cluster.unit,configPath:cluster.configPath,LoadState:'loaded',error:'query denied'}];tree=render();
 assert.equal(find(tree,node=>node.props?.children==='서비스 작업 실행').props.disabled,true);
 await find(tree,node=>node.props?.children==='서비스 작업 실행').props.onClick();assert.equal(requests.length,count);
 const app={id:'demo',label:'검수 앱',directory:'/srv/demo',entry:'server.js',environmentFile:'.env',unit:'tastedev-node-demo.service'};
 const registered={unit:app.unit,LoadState:'loaded',nodeAppId:app.id,nodeRegistry:{apps:[app],version:'a'.repeat(64)}};
 states[1]=[registered];tree=render();find(tree,node=>node.props?.className==='service-select').props.onClick();tree=render();
 const editor=find(tree,node=>node.type==='NodeApps');assert(editor);assert.equal(editor.props.selectedId,'demo');assert.equal(editor.props.initialTab,'service');assert.equal(editor.props.initialData,registered.nodeRegistry);
 assert(!find(tree,node=>node.props?.children==='서비스 작업 실행'),'registered app never uses generic daemon control');
 const beforeNodeLog=requests.length;find(tree,node=>node.props?.['aria-label']==='로그 열기').props.onClick();tree=render();assert.equal(find(tree,node=>node.type==='NodeApps').props.initialTab,'logs');assert.equal(requests.length,beforeNodeLog,'app log opens the registry-bound Node panel rather than an arbitrary journal source');
});
