import {toastTestModule,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
test('nginx tree renders site folders and include selection opens its discovered file',async()=>{
 const source=await readFile(new URL('../components/nginx-config-tree.tsx',import.meta.url),'utf8');await loadBindings();const compiled=await transform(source,{filename:'nginx-config-tree.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const main={name:'nginx.conf',path:'/etc/nginx/nginx.conf',source:'include /etc/nginx/sites-enabled/*;\nhttp { server { listen 80; } }',error:null};main.nodes=parseNginxTree(main.source);const site={name:'sites-enabled/example',path:'/etc/nginx/sites-enabled/example',source:'server { listen 80; }',error:null};site.nodes=parseNginxTree(site.source);
 const state=[false,0,{file:main,node:main.nodes[0]},'block','','','','',null,'settings'];let cursor=0,selectedPath,draftState={};const effects=[];
 const refs=[];let refCursor=0;
 const hooks={...React,useRef:initial=>{const index=refCursor++;return refs[index]||(refs[index]={current:initial});},useEffect:(fn,dependencies)=>{fn.dependencies=dependencies;effects.push(fn);},useState:()=>{const index=cursor++;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];}};
 const Button=()=>null,native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='./ui/ide-split-layout'?{__esModule:true,default:'ide-split-layout'}:name==='./nginx-site-dialog'?{__esModule:true,default:'site-dialog'}:name==='./ui/confirm-dialog'?{__esModule:true,default:'confirm-dialog'}:name==='./nginx-code-recovery'?{__esModule:true,default:()=>null}:name==='./nginx-code-editor'?{__esModule:true,default:'code-editor'}:name==='./nginx-block-settings'?{__esModule:true,default:'block-settings'}:name==='./nginx-apply-panel'?{default:()=>null}:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:key=>[key==='nginxDrafts'?draftState:'',next=>{if(key==='nginxDrafts')draftState=typeof next==='function'?next(draftState):next;}]}:name==='./ui/controls'?{Button,Badge:()=>null,TextInput:()=>null,Switch:()=>null,Dropdown:()=>null}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const component=module.exports.default;module.exports={...module.exports,default:props=>{refCursor=0;return component(props);}};
 const tree=module.exports.default({data:{root:'/etc/nginx',files:[main,site]},onSelectSite:value=>selectedPath=value,onNewSite:()=>{}}),buttons=[],summaries=[],nativeButtons=[];
 function visit(node){if(!node||typeof node!=='object')return;if(node.type===Button)buttons.push(node);if(node.type==='button')nativeButtons.push(node);if(node.type==='summary')summaries.push(node.props.children);React.Children.forEach(toastTestChildren(node),visit);}visit(tree);
 for(const folder of ['sites-available','sites-enabled','snippets'])assert.ok(summaries.some(value=>JSON.stringify(value).includes(folder)));
 assert.ok(nativeButtons.some(button=>JSON.stringify(button.props.children).includes('server')));assert.ok(!nativeButtons.some(button=>JSON.stringify(button.props.children).includes('listen 80')));
 const target=buttons.find(button=>button.props.children==='sites-enabled/example');assert.ok(target);target.props.onClick();assert.equal(selectedPath,site.path);assert.equal(state[2].file.path,site.path);assert.equal(state[2].node,null);
 const add=buttons.find(button=>button.props['aria-label']==='새 server 블록');assert.ok(add);add.props.onClick({preventDefault(){},stopPropagation(){}});const http=parseNginxTree(draftState[main.path].source).find(node=>node.label==='http');assert.equal(http.children.filter(node=>node.label==='server').length,2);assert.equal(state[2].node.label,'server');assert.deepEqual(state[2].node.children.map(node=>node.label),['listen 80','server_name example.com','root /var/www/html']);assert.equal(state[10],'settings');assert.equal(main.source,'include /etc/nginx/sites-enabled/*;\nhttp { server { listen 80; } }');
 const httpButton=nativeButtons.find(button=>JSON.stringify(button.props.children).includes('http'));const priorWindow=globalThis.window;try{globalThis.window={innerWidth:1000,innerHeight:800};httpButton.props.onContextMenu({preventDefault(){},stopPropagation(){},clientX:900,clientY:700,currentTarget:{getBoundingClientRect:()=>({left:0,bottom:20})}});assert.equal(state[8].node.label,'http');assert.equal(state[8].x,770);assert.equal(state[8].y,540);}finally{globalThis.window=priorWindow;}
 state[8]={file:main,node:http.children[0],x:8,y:8};cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[main,site]},onSelectSite:()=>{},onNewSite:()=>{}}));const location=buttons.find(button=>button.props.role==='menuitem'&&JSON.stringify(button.props.children).includes('location'));assert.ok(location);location.props.onClick();assert.equal(state[2].node.label,'location /');assert.ok(parseNginxTree(draftState[main.path].source).find(node=>node.label==='http').children[0].children.some(node=>node.label==='location /'));
 state[10]='code';cursor=0;const codeTree=module.exports.default({data:{root:'/etc/nginx',files:[main,site]}});let displayed;function findCode(node){if(!node||typeof node!=='object')return;if(node.type==='code-editor')displayed=node.props.source;React.Children.forEach(toastTestChildren(node),findCode);}findCode(codeTree);assert.equal(displayed,'location / {\n    }');assert.ok(!displayed.includes('include'));state[2]={file:main,node:null};cursor=0;findCode(module.exports.default({data:{root:'/etc/nginx',files:[main,site]}}));assert.equal(displayed,draftState[main.path].source);let editor;function findEditor(node){if(!node||typeof node!=='object')return;if(node.type==='code-editor')editor=node;React.Children.forEach(toastTestChildren(node),findEditor);}cursor=0;findEditor(module.exports.default({data:{root:'/etc/nginx',files:[main,site]}}));editor.props.onCommit('events {} http { server { server_name edited.test; listen 8080; } }');assert.deepEqual(parseNginxTree(draftState[main.path].source)[1].children[0].children.map(node=>node.label),['server_name edited.test','listen 8080']);assert.throws(()=>editor.props.onCommit('http {'));assert.equal(main.source,'include /etc/nginx/sites-enabled/*;\nhttp { server { listen 80; } }');
 state[8]={file:main,node:null,x:8,y:8};cursor=0;buttons.length=0;let externalOpen=false;visit(module.exports.default({data:{root:'/etc/nginx',files:[main,site]},onOpenCode:()=>externalOpen=true}));const codeAction=buttons.find(button=>button.props.role==='menuitem'&&button.props.children==='코드 편집');assert.ok(codeAction);codeAction.props.onClick();assert.equal(state[10],'code');assert.equal(externalOpen,false);assert.equal(state[2].file.path,main.path);const tabs=[];function findTabs(node){if(!node||typeof node!=='object')return;if(node.props?.role==='tablist')tabs.push(node);React.Children.forEach(toastTestChildren(node),findTabs);}cursor=0;findTabs(module.exports.default({data:{root:'/etc/nginx',files:[main,site]}}));let focused;tabs[0].props.onKeyDown({key:'Home',preventDefault(){},currentTarget:{querySelector:selector=>({focus:()=>focused=selector})}});assert.equal(state[10],'settings');assert.match(focused,/settings/);
 effects.find(effect=>effect.dependencies?.length===1&&effect.dependencies[0]?.root)();assert.equal(state[2].file.path,main.path,'refresh preserves an existing file selection');state[2]=null;effects.find(effect=>effect.dependencies?.length===1&&effect.dependencies[0]?.root)();assert.equal(state[2],null,'initial data must not automatically select nginx.conf');cursor=0;const emptyTree=module.exports.default({data:{root:'/etc/nginx',files:[main,site]}});assert(JSON.stringify(emptyTree).includes('왼쪽 노드를 선택하세요.'));assert(!JSON.stringify(emptyTree).includes('nginx-settings-panel'));

 const certbot={name:'letsencrypt/options-ssl-nginx.conf',path:'/etc/letsencrypt/options-ssl-nginx.conf',source:'ssl_protocols TLSv1.2 TLSv1.3;',readOnly:true,error:null};certbot.nodes=parseNginxTree(certbot.source);
 draftState[certbot.path]={source:'ssl_protocols injected;',baseline:certbot.source};state[2]={file:certbot,node:null};state[8]={file:certbot,node:null,x:8,y:8};state[10]='code';cursor=0;buttons.length=0;
 const protectedTree=module.exports.default({data:{root:'/etc/nginx',files:[main,certbot]}});visit(protectedTree);findEditor(protectedTree);assert.equal(editor.props.source,certbot.source);assert.equal(editor.props.readOnly,true);
 const rootFile={name:'common.conf',path:'/etc/nginx/common.conf',source:'server_tokens off;',error:null,nodes:parseNginxTree('server_tokens off;')};cursor=0;buttons.length=0;nativeButtons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[main,rootFile,certbot]}}));assert(nativeButtons.some(button=>JSON.stringify(button.props.children).includes('common.conf')));assert(nativeButtons.some(button=>JSON.stringify(button.props.children).includes('options-ssl-nginx.conf')));
 const oldDraft=JSON.stringify(draftState);editor.props.onCommit('ssl_protocols changed;');assert.equal(JSON.stringify(draftState),oldDraft);
 assert.deepEqual(buttons.filter(button=>button.props.role==='menuitem').map(button=>button.props.children),['코드 보기']);
 let cronOpened=false;cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[main,certbot]},onOpenCron:()=>{cronOpened=true;}}));const cronMenu=buttons.find(button=>button.props.role==='menuitem'&&button.props.children==='예약 작업');assert(cronMenu);cronMenu.props.onClick();assert(cronOpened);assert.equal(state[8],null,'cron action closes the context menu');

 const selectedSource='http { server { location /api {} } }';const beforeFile={...main,source:selectedSource,nodes:parseNginxTree(selectedSource)};const beforeNode=beforeFile.nodes[0].children[0].children[0];state[2]={file:beforeFile,node:beforeNode};state[8]=null;state[10]='code';
 const afterSource='events {} http { server { listen 8080; location /api {} } }';const afterFile={...main,source:afterSource,nodes:parseNginxTree(afterSource)};delete draftState[main.path];cursor=0;effects.length=0;module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}});effects.find(effect=>effect.dependencies?.length===1&&effect.dependencies[0]?.root)();assert.equal(state[2].node.label,'location /api');assert.notEqual(state[2].node.id,beforeNode.id);assert.equal(state[10],'code');
 draftState[main.path]={source:'events {} http { server { listen 9090; } }',baseline:beforeFile.source};state[2]={file:beforeFile,node:null};cursor=0;effects.length=0;const refreshedDraftTree=module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}});findEditor(refreshedDraftTree);assert.equal(editor.props.source,draftState[main.path].source);effects.find(effect=>effect.dependencies?.length===1&&effect.dependencies[0]?.root)();assert.equal(state[2].file.source,draftState[main.path].source);assert.equal(draftState[main.path].baseline,beforeFile.source,'external refresh must not acknowledge or overwrite unsaved drafts');delete draftState[main.path];
 state[2]={file:beforeFile,node:beforeNode};cursor=0;effects.length=0;module.exports.default({data:{root:'/etc/nginx',files:[]}});effects.find(effect=>effect.dependencies?.length===1&&effect.dependencies[0]?.root)();assert.equal(state[2],null,'a removed file cannot retain an editable selection');
 state[2]=null;cursor=0;const loadingTree=module.exports.default({data:null});assert(JSON.stringify(loadingTree).includes('불러오는 중'));assert(!JSON.stringify(loadingTree).includes('▱ conf.d/'),'do not paint empty folders before the first response');

 state[2]={file:afterFile,node:afterFile.nodes[1].children[0]};state[8]=null;state[10]='settings';state[3]='block';state[4]='';state[5]='';
 function forms(node){if(!node||typeof node!=='object')return 0;let count=node.props?.className==='nginx-node-edit'?1:0;React.Children.forEach(toastTestChildren(node),child=>count+=forms(child));return count;}
 cursor=0;const serverSettings=module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}});assert.equal(forms(serverSettings),1,'argumentless server has only the block-add form');
 state[2]={file:afterFile,node:afterFile.nodes[1].children[0].children[0]};cursor=0;
 const directiveTree=module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}});let directSettings;
 function findSettings(node){if(!node||typeof node!=='object')return;if(node.type==='block-settings')directSettings=node;React.Children.forEach(toastTestChildren(node),findSettings);}findSettings(directiveTree);
 assert.equal(directSettings.props.context,'server');assert.deepEqual(directSettings.props.nodes.map(node=>node.label),['listen 8080']);assert.equal(forms(directiveTree),0,'directive selection uses the described setting row, without a duplicate argument form');
 state[2]={file:afterFile,node:afterFile.nodes[0]};cursor=0;assert.equal(forms(module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}})),0,'events has no block arguments or child-block add form');
 state[2]={file:afterFile,node:afterFile.nodes[1].children[0].children[1]};cursor=0;assert.equal(forms(module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}})),2,'location retains its argument editor and block-add form');
 state[2]={file:afterFile,node:afterFile.nodes[1].children[0]};state[4]='location';state[5]='/health';cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}}));
 buttons.find(button=>button.props.children==='초안에 항목 추가').props.onClick();const addedServer=parseNginxTree(draftState[main.path].source)[1].children[0];assert.equal(addedServer.children.at(-1).kind,'block');assert.equal(addedServer.children.at(-1).label,'location /health');assert.equal(afterFile.source,afterSource);

 delete draftState[main.path];state[2]={file:afterFile,node:afterFile.nodes[1].children[0]};state[10]='settings';state[10]=null;
 function findConfirm(node){if(!node||typeof node!=='object')return;if(node.type==='confirm-dialog')return node;for(const child of React.Children.toArray(toastTestChildren(node))){const found=findConfirm(child);if(found)return found;}}
 function askDelete(file=afterFile){state[8]={file,node:file.nodes[1].children[0],x:8,y:8};cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[file]}}));buttons.find(button=>button.props.role==='menuitem'&&button.props.children==='초안에서 블록 삭제').props.onClick();}
 function confirmView(file=afterFile){cursor=0;return findConfirm(module.exports.default({data:{root:'/etc/nginx',files:[file]}}));}
 askDelete();assert.equal(draftState[main.path],undefined,'request alone must not delete');let confirm=confirmView();assert.match(confirm.props.request.detail,/server/);confirm.props.onCancel();assert.equal(state[10],null);assert.equal(draftState[main.path],undefined);
 askDelete();const changedFile={...afterFile,source:afterFile.source.replace('8080','8081')};changedFile.nodes=parseNginxTree(changedFile.source);confirmView(changedFile).props.onConfirm();assert.equal(draftState[main.path],undefined);assert.match(state[7],/설정이 변경/);
 askDelete();confirmView({...afterFile,readOnly:true}).props.onConfirm();assert.equal(draftState[main.path],undefined,'permission revoked while dialog open must prevent deletion');
 askDelete();confirmView().props.onConfirm();assert.equal(parseNginxTree(draftState[main.path].source)[1].children.length,0);assert.equal(afterFile.source,afterSource);
 state[2]={file:afterFile,node:null};cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}}));buttons.find(button=>button.props.children==='초안 초기화').props.onClick();const savedDraft=JSON.stringify(draftState);confirmView().props.onCancel();assert.equal(JSON.stringify(draftState),savedDraft);
 cursor=0;buttons.length=0;visit(module.exports.default({data:{root:'/etc/nginx',files:[afterFile]}}));buttons.find(button=>button.props.children==='초안 초기화').props.onClick();confirmView().props.onConfirm();assert.equal(draftState[main.path],undefined);assert.equal(state[2],null);

 const streamFile={...main,source:'stream { server { listen 53 udp; proxy_pass dns; } }'};streamFile.nodes=parseNginxTree(streamFile.source);
 state[2]={file:streamFile,node:streamFile.nodes[0].children[0]};state[8]={file:streamFile,node:streamFile.nodes[0].children[0],x:8,y:8};state[10]='settings';cursor=0;buttons.length=0;
 const streamTree=module.exports.default({data:{root:'/etc/nginx',files:[streamFile]}});visit(streamTree);
 assert(!buttons.some(button=>button.props.role==='menuitem'&&String(button.props.children).includes('location')),'stream server context menu must not offer HTTP location blocks');
 assert(JSON.stringify(streamTree).includes('TCP·UDP 연결을 받을 서버'));
 state[2]={file:streamFile,node:streamFile.nodes[0]};state[8]={file:streamFile,node:streamFile.nodes[0],x:8,y:8};cursor=0;buttons.length=0;
 visit(module.exports.default({data:{root:'/etc/nginx',files:[streamFile]}}));
 const streamAdd=buttons.find(button=>button.props.role==='menuitem'&&JSON.stringify(button.props.children).includes('server'));
 assert.ok(streamAdd);streamAdd.props.onClick();
 assert.equal(parseNginxTree(draftState[streamFile.path].source)[0].children.filter(node=>node.label==='server').length,2,'stream block menu must create the advertised server block');
 assert.equal(streamFile.source,'stream { server { listen 53 udp; proxy_pass dns; } }');


 delete draftState[streamFile.path];state[2]={file:streamFile,node:streamFile.nodes[0]};state[8]={file:streamFile,node:streamFile.nodes[0],x:8,y:8};cursor=0;buttons.length=0;
 visit(module.exports.default({data:{root:'/etc/nginx',files:[streamFile]}}));const upstreamAdd=buttons.find(button=>button.props.role==='menuitem'&&JSON.stringify(button.props.children).includes('upstream'));assert.ok(upstreamAdd);upstreamAdd.props.onClick();
 assert.equal(state[2].node.label,'upstream backend');state[8]=null;cursor=0;findSettings(module.exports.default({data:{root:'/etc/nginx',files:[streamFile]}}));assert.equal(directSettings.props.context,'stream:upstream');assert(directSettings.props.available.some(item=>item.name==='server'));assert(!directSettings.props.available.some(item=>item.name==='keepalive'));
 const includeMain={...main,source:'stream { include conf.d/included.conf; }'};includeMain.nodes=parseNginxTree(includeMain.source);
 const included={name:'conf.d/included.conf',path:'/etc/nginx/conf.d/included.conf',source:'server { proxy_pass backend:9000; }'};included.nodes=parseNginxTree(included.source);
 delete draftState[main.path];state[2]={file:included,node:included.nodes[0]};state[8]=null;state[11]=null;cursor=0;
 findSettings(module.exports.default({data:{root:'/etc/nginx',files:[includeMain,included]}}));assert.equal(directSettings.props.context,'stream:server');
 assert(!directSettings.props.available.some(item=>item.name==='server_name'));
 includeMain.source='http { include conf.d/included.conf; } stream { include conf.d/included.conf; }';includeMain.nodes=parseNginxTree(includeMain.source);
 cursor=0;const ambiguousTree=module.exports.default({data:{root:'/etc/nginx',files:[includeMain,included]}});findSettings(ambiguousTree);assert.equal(directSettings.props.context,'unknown:server');
 let picker;function findPicker(node){if(!node||typeof node!=='object')return;if(node.props?.label==='설명 문맥')picker=node;React.Children.forEach(toastTestChildren(node),findPicker);}findPicker(ambiguousTree);assert.ok(picker);
 const untouched=JSON.stringify(draftState);picker.props.onChange({target:{value:'stream:stream'}});cursor=0;
 findSettings(module.exports.default({data:{root:'/etc/nginx',files:[includeMain,included]}}));assert.equal(directSettings.props.context,'stream:server');assert.equal(JSON.stringify(draftState),untouched,'help selection must not generate a configuration draft');

 // Applying edited code must make the settings rows follow its actual directive order.
 delete draftState[main.path];state[2]={file:main,node:null};state[8]=null;state[10]='code';state[11]=null;cursor=0;
 findEditor(module.exports.default({data:{root:'/etc/nginx',files:[main]}}));
 editor.props.onCommit('http { server { server_name reordered.test; listen 8088; } } events {}');
 const reorderedFile=state[2].file;assert.equal(reorderedFile.nodes[0].label,'http');assert.equal(reorderedFile.nodes[1].label,'events');
 state[2]={file:reorderedFile,node:reorderedFile.nodes[0].children[0]};state[10]='settings';cursor=0;
 findSettings(module.exports.default({data:{root:'/etc/nginx',files:[main]}}));
 assert.deepEqual(directSettings.props.nodes.map(node=>node.label),['server_name reordered.test','listen 8088']);
 assert.equal(main.source,'include /etc/nginx/sites-enabled/*;\nhttp { server { listen 80; } }','code commits edit the draft, preserving the operating snapshot');

 const conf={name:'conf.d/vhost_tastedev.conf',path:'/etc/nginx/conf.d/vhost_tastedev.conf',source:'server { listen 8080; }'};conf.nodes=parseNginxTree(conf.source);
 const confMain={...main,source:'http { include conf.d/*.conf; }'};confMain.nodes=parseNginxTree(confMain.source);
 state[2]=null;state[8]=null;state[10]='code';cursor=0;buttons.length=0;
 visit(module.exports.default({data:{root:'/etc/nginx',files:[confMain,conf]}}));
 const fileAdd=buttons.find(button=>button.props['aria-label']==='새 server 블록 · conf.d/vhost_tastedev.conf');assert.ok(fileAdd);
 fileAdd.props.onClick({preventDefault(){},stopPropagation(){}});
 assert.equal(state[2].file.path,conf.path);assert.equal(state[2].node.label,'server');assert.equal(state[10],'settings');
 assert.deepEqual(state[2].node.children.map(node=>node.label),['listen 80','server_name example.com','root /var/www/html']);
 cursor=0;const addedTree=module.exports.default({data:{root:'/etc/nginx',files:[confMain,conf]}});findSettings(addedTree);
 assert.deepEqual(directSettings.props.nodes.map(node=>node.label),['listen 80','server_name example.com','root /var/www/html']);
 let treeNav;function findNav(node){if(!node||typeof node!=='object')return;if(node.type==='nav')treeNav=node;React.Children.forEach(toastTestChildren(node),findNav);}findNav(addedTree);
 let serverFocused=false,serverScrolled=false;treeNav.props.ref.current={querySelector:selector=>{assert.equal(selector,'button[aria-pressed="true"]');return {focus:()=>serverFocused=true,scrollIntoView:()=>serverScrolled=true};}};
 effects.find(effect=>effect.toString().includes('button[aria-pressed')).call(null);
 assert.ok(serverFocused);assert.ok(serverScrolled);assert.equal(conf.source,'server { listen 8080; }');
 state[8]={file:state[2].file,node:null,x:8,y:8};state[10]='code';cursor=0;buttons.length=0;
 visit(module.exports.default({data:{root:'/etc/nginx',files:[confMain,conf]}}));
 const proxyPreset=buttons.find(button=>button.props.role==='menuitem'&&button.props.children==='리버스 프록시 프리셋');assert.ok(proxyPreset);proxyPreset.props.onClick();
 assert.equal(state[10],'settings');const proxy=state[2].node;
 assert.equal(proxy.children[2].label,'location /');assert.equal(proxy.children[2].children[0].label,'proxy_pass http://127.0.0.1:3000');
 state[8]={file:state[2].file,node:proxy,x:8,y:8};cursor=0;buttons.length=0;
 visit(module.exports.default({data:{root:'/etc/nginx',files:[confMain,conf]}}));
 const duplicate=buttons.find(button=>button.props.role==='menuitem'&&button.props.children==='초안에서 노드 복제');assert.ok(duplicate);duplicate.props.onClick();
 assert.notEqual(state[2].node.id,proxy.id);assert.deepEqual(state[2].node.children.map(node=>node.label),proxy.children.map(node=>node.label));
 assert.equal(parseNginxTree(draftState[conf.path].source).filter(node=>node.label==='server').length,4);
 assert.equal(state[2].node.children[2].children[0].label,'proxy_pass http://127.0.0.1:3000');
 assert.equal(conf.source,'server { listen 8080; }');

});
