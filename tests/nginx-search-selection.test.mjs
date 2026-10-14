import {toastTestModule,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNginxTree} from '../lib/nginx-syntax.ts';

test('selecting a filtered duplicate server keeps its full-file identity, settings and code',async()=>{
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/nginx-config-tree.tsx',import.meta.url),'utf8'),{filename:'nginx-config-tree.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const state=[];let cursor=0,refCursor=0,query='443',drafts={};const effects=[];
 const refs=[];
 const hooks={...React,useRef:initial=>{const index=refCursor++;return refs[index]??(refs[index]={current:initial});},useEffect(fn){effects.push(fn);},useState(initial){const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],next=>state[index]=typeof next==='function'?next(state[index]):next];}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='./ui/toast-provider'?toastTestModule(require):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./draft-provider'?{useDraftGeneration:()=>0,useDraftState:key=>[key==='nginxDrafts'?drafts:key==='nginxCodeBuffers'?{}:query,next=>{if(key==='nginxDrafts')drafts=typeof next==='function'?next(drafts):next;else query=next;}]}:name==='./ui/controls'?{Button:'control',Badge:'badge',TextInput:'input',Switch:'switch',Dropdown:'select'}:name.startsWith('./nginx-')||name==='./ui/confirm-dialog'?{__esModule:true,default:name}:name==='./ui/ide-split-layout'?{__esModule:true,default:'div'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const source='http { server { listen 80; server_name first.example; } server { listen 443 ssl; server_name second.example; location /api { proxy_pass http://backend; } } }';
 const file={name:'nginx.conf',path:'/etc/nginx/nginx.conf',source,nodes:parseNginxTree(source)};
 function all(tree,predicate,result=[]){if(!tree||typeof tree!=='object')return result;if(predicate(tree))result.push(tree);React.Children.forEach(toastTestChildren(tree),child=>all(child,predicate,result));return result;}
 function render(){cursor=0;refCursor=0;effects.length=0;return module.exports.default({data:{root:'/etc/nginx',files:[file]}});}
 const serverButton=()=>all(render(),node=>node.type==='button'&&JSON.stringify(node.props.children).includes('server'))[0];
 serverButton().props.onClick();
 let view=render();
 const settings=all(view,node=>node.type==='./nginx-block-settings')[0];
 assert.equal(settings.props.nodes.find(node=>node.label.startsWith('listen ')).label,'listen 443 ssl');
 assert.equal(settings.props.nodes.find(node=>node.label.startsWith('server_name ')).label,'server_name second.example');
 assert.equal(state[2].file.nodes[0].children.length,2,'search must not narrow the ancestry stored for selection');
 effects[0]();
 query='';state[10]='code';
 const editor=all(render(),node=>node.type==='./nginx-code-editor')[0];
 assert.match(editor.props.source,/listen 443 ssl/);assert.doesNotMatch(editor.props.source,/first\.example|listen 80/);
 query='443';state[10]='settings';
 const previousWindow=globalThis.window;
 try{
  globalThis.window={innerWidth:1000,innerHeight:800};
  serverButton().props.onContextMenu({preventDefault(){},stopPropagation(){},clientX:200,clientY:200,currentTarget:{getBoundingClientRect:()=>({left:200,bottom:200})}});
 }finally{globalThis.window=previousWindow;}
 assert.equal(state[8].file.nodes[0].children.length,2,'context menu must capture unfiltered ancestry too');
 const remove=all(render(),node=>node.props?.role==='menuitem'&&node.props.children==='초안에서 블록 삭제')[0];remove.props.onClick();
 const confirmation=all(render(),node=>node.type==='./ui/confirm-dialog')[0];confirmation.props.onConfirm();
 const remaining=parseNginxTree(drafts[file.path].source)[0].children;
 assert.equal(remaining.length,1);assert.equal(remaining[0].children[1].label,'server_name first.example');
 assert.equal(file.source,source,'all modifications are confined to drafts');
 drafts={};query='';state[2]=null;const alias={...file,path:'/etc/nginx/sites-enabled/example',name:'sites-enabled/example',symbolicLink:true,readOnly:true,linkTarget:file.path};cursor=0;refCursor=0;const aliases=module.exports.default({data:{root:'/etc/nginx',files:[file,alias]}});const link=all(aliases,node=>node.type==='button'&&node.props.title===file.path&&JSON.stringify(node.props.children).includes('example'))[0];assert(link);link.props.onClick();assert.equal(state[2].file.path,file.path);assert.equal(state[2].file.readOnly,undefined);
 cursor=0;refCursor=0;const rootView=module.exports.default({data:{root:'/etc/nginx',files:[file,alias]}});const setting=all(rootView,node=>node.type==='./nginx-block-settings')[0];const insertion=all(rootView,node=>node.type==='details'&&node.props.className==='nginx-draft-comparison')[0];assert(setting&&insertion);assert.notEqual(setting.key,insertion.key,'settings and block insertion require distinct sibling identities');

 // Link nodes must track the original draft even when preceding nodes shift IDs.
 const edited='worker_processes 2; '+source.replace('listen 443 ssl','listen 8443 ssl');
 drafts={[file.path]:{baseline:source,source:edited,past:[source],future:[]}};
 query='8443';state[2]=null;cursor=0;refCursor=0;
 let mirrored=module.exports.default({data:{root:'/etc/nginx',files:[file,alias]}});
 const linkedBranch=all(mirrored,node=>node.type==='button'&&JSON.stringify(node.props.children).includes('server')).at(-1);
 assert(linkedBranch,'search must find draft settings through the alias too');
 linkedBranch.props.onClick();
 assert.equal(state[2].file.path,file.path);
 assert.equal(state[2].file.source,edited);
 assert.equal(state[2].node.children[0].label,'listen 8443 ssl');
 query='';state[10]='code';cursor=0;refCursor=0;
 mirrored=module.exports.default({data:{root:'/etc/nginx',files:[file,alias]}});
 const linkedEditor=all(mirrored,node=>node.type==='./nginx-code-editor')[0];
 assert.equal(Boolean(linkedEditor.props.readOnly),false);
 linkedEditor.props.onCommit(linkedEditor.props.source.replace('8443','9443'));
 assert.match(drafts[file.path].source,/listen 9443 ssl/);
 assert.equal(drafts[alias.path],undefined,'editing a link must never create a separate alias draft');
 assert.equal(alias.source,source,'link snapshots and live files must not be mutated');
 // A removed block must disappear in both views rather than map its old ID to another block.
 drafts={[file.path]:{baseline:source,source:'http { server { listen 80; server_name first.example; } }',past:[],future:[]}};
 query='443';state[2]=null;cursor=0;refCursor=0;
 mirrored=module.exports.default({data:{root:'/etc/nginx',files:[file,alias]}});
 assert.equal(all(mirrored,node=>node.type==='button'&&JSON.stringify(node.props.children).includes('server')).length,0);
 // Unavailable originals remain readable aliases without inheriting draft edits.
 query='';state[2]=null;cursor=0;refCursor=0;
 mirrored=module.exports.default({data:{root:'/etc/nginx',files:[alias]}});
 all(mirrored,node=>node.type==='button'&&node.props.title===file.path)[0].props.onClick();
 assert.equal(state[2].file.path,alias.path);assert.equal(state[2].file.readOnly,true);assert.equal(state[2].file.source,source);
 // A changed live target must not be substituted for the alias snapshot.
 state[2]=null;cursor=0;refCursor=0;
 mirrored=module.exports.default({data:{root:'/etc/nginx',files:[{...file,source:'http {}',nodes:parseNginxTree('http {}')},alias]}});
 all(mirrored,node=>node.type==='button'&&node.props.title===file.path&&JSON.stringify(node.props.children).includes('example'))[0].props.onClick();
 assert.equal(state[2].file.path,alias.path);assert.equal(state[2].file.readOnly,true);
});
