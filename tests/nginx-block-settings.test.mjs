import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
test('block settings expose repeated directives separately and offer absent context settings',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const controls={Button:({children,...props})=>React.createElement('button',props,children),TextInput:({label,...props})=>React.createElement('input',{'aria-label':label,...props}),Switch:({label,checked,onChange})=>React.createElement('input',{type:'checkbox','aria-label':label,checked,onChange}),Dropdown:({label,value,options,onChange})=>React.createElement('select',{'aria-label':label,value,onChange},options.map(option=>React.createElement('option',{key:option.value,value:option.value},option.label)))};
 const require=name=>name==='./nginx-icon'?{__esModule:true,default:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?controls:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const block=parseNginxTree('server { include /etc/nginx/snippets/*.conf; listen 80; listen 443 ssl; server_name demo.test; location / { proxy_pass http://localhost:3000; } }')[0];
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{nodes:block.children,files:[{name:'snippets/headers.conf',path:'/etc/nginx/snippets/headers.conf'}],onOpenFile:()=>{},available:nginxPresets(block),onEdit:()=>{},onAdd:()=>{},onSelect:()=>{}}));
 assert.equal((html.match(/<strong>listen<\/strong>/g)||[]).length,2);assert.match(html,/value="443 ssl"/);assert.match(html,/<strong>ssl_certificate<\/strong>/);assert.doesNotMatch(html,/<strong>proxy_pass<\/strong>/);assert.match(html,/초안에 항목 추가/);assert.match(html,/snippets\/headers.conf/);assert.match(html,/title="\/etc\/nginx\/snippets\/headers.conf"/);
 const upstream=renderToStaticMarkup(React.createElement(module.exports.default,{context:'upstream',nodes:parseNginxTree('keepalive_timeout 60s;'),onEdit:()=>{}}));assert.match(upstream,/유휴 업스트림 연결/);assert.match(upstream,/ngx_http_upstream_module.html#keepalive_timeout/);
 const mime=renderToStaticMarkup(React.createElement(module.exports.default,{context:'types',nodes:parseNginxTree('text/html html htm;'),onEdit:()=>{}}));assert.match(mime,/파일 확장자 목록/);assert.doesNotMatch(mime,/외부 모듈/);
 const mapping=renderToStaticMarkup(React.createElement(module.exports.default,{context:'map',nodes:parseNginxTree('default local; root literal; hostnames;'),onEdit:()=>{}}));assert.match(mapping,/일치하지 않을 때/);assert.match(mapping,/원본 값에 대응할 결과 값/);assert.match(mapping,/접두·접미 와일드카드/);assert.doesNotMatch(mapping,/외부 모듈|파일을 찾을 기본 디렉터리/);
 const geo=renderToStaticMarkup(React.createElement(module.exports.default,{context:'geo',nodes:parseNginxTree('delete 192.0.2.0\/24; 2001:db8::\/32 region;'),onEdit:()=>{}}));assert.match(geo,/파일 삭제 명령이 아닙니다/);assert.match(geo,/가장 구체적인 네트워크/);assert.doesNotMatch(geo,/외부 모듈/);
 const literalKeys=renderToStaticMarkup(React.createElement(module.exports.default,{context:'map',nodes:parseNginxTree('gzip on; worker_connections 2; server_tokens off;'),onEdit:()=>{}}));assert.doesNotMatch(literalKeys,/type="checkbox"|type="number"|<select/);assert.equal((literalKeys.match(/type="text"/g)||[]).length,3);
 const mimeNames=renderToStaticMarkup(React.createElement(module.exports.default,{context:'types',nodes:parseNginxTree('charset txt; proxy_cache cached; include custom.types;'),onEdit:()=>{}}));assert.equal((mimeNames.match(/선택된 MIME 유형에 연결할 파일 확장자 목록/g)||[]).length,2);assert.match(mimeNames,/ngx_core_module.html#include/);assert.doesNotMatch(mimeNames,/charset_module|proxy_cache_path/);
});

test('clearing a setting retains its row and waits for a replacement value before editing the draft',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const values=[];let cursor=0;const hooks={...React,useEffect:()=>{},useState:initial=>{const i=cursor++;if(!(i in values))values[i]=initial;return[values[i],value=>values[i]=value];}};
 const native=createRequire(import.meta.url),module={exports:{}};const controls={Button:'button',TextInput:'input',Switch:'switch',Dropdown:'select'};
 const require=name=>name==='react'?hooks:name==='./nginx-icon'?{__esModule:true,default:'svg'}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?controls:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let pendingChanges=0;const edits=[],removals=[];const props={onPendingChange:()=>pendingChanges++,inputDrafts:new Map(),nodes:[{id:'setting',kind:'directive',label:'server_name demo.test',line:2}],onEdit:(...args)=>edits.push(args),onRemove:(...args)=>removals.push(args)};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;let found;React.Children.forEach(node.props?.children,child=>found??=find(child,predicate));return found;};
 function render(){cursor=0;const parent=module.exports.default(props);const setting=find(parent,node=>typeof node.type==='function'&&node.props.node);return setting.type(setting.props);}
 let row=render();find(row,node=>node.props?.['aria-label']==='내용 비우기').props.onClick();row=render();assert.equal(find(row,node=>node.type==='input').props.value,'');assert.equal(find(row,node=>node.props?.['aria-label']==='초안에 반영').props.disabled,true);assert.equal(find(row,node=>node.type==='strong').props.children,'server_name');assert.deepEqual(edits,[]);assert.deepEqual(removals,[]);assert.equal(pendingChanges,1,'clearing notifies apply guard without changing source');
 values.length=0;row=render();assert.equal(find(row,node=>node.type==='input').props.value,'','cleared pending input survives settings unmount');
 find(row,node=>node.type==='input').props.onChange({target:{value:'new.test'}});row=render();const save=find(row,node=>node.props?.['aria-label']==='초안에 반영');assert.equal(save.props.disabled,false);save.props.onClick();assert.equal(edits[0][1],'new.test');assert.deepEqual(removals,[]);
 values.length=0;props.inputScope='another-block';row=render();assert.equal(find(row,node=>node.type==='input').props.value,'demo.test','another block never receives the first block input');
 values.length=0;props.inputScope='root';row=render();assert.equal(find(row,node=>node.type==='input').props.value,'new.test','returning to its own block restores unapplied input');
});

test('cleared switches stay unset across remounts and require an explicit on/off choice',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const values=[];let cursor=0;const hooks={...React,useEffect:()=>{},useState:initial=>{const index=cursor++;if(!(index in values))values[index]=initial;return[values[index],next=>values[index]=next];}};
 const native=createRequire(import.meta.url),module={exports:{}};
 const require=name=>name==='react'?hooks:name==='./nginx-icon'?{__esModule:true,default:'svg'}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',TextInput:'input',Switch:'switch',Dropdown:'select'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child,predicate);if(found)return found;}};
 for(const original of ['on','off']){
  values.length=0;const edits=[],props={context:'http',inputDrafts:new Map(),nodes:[{id:'sendfile',kind:'directive',label:'sendfile '+original,line:3}],onEdit:(_node,value)=>{edits.push(value);return true;}};
  const render=()=>{cursor=0;const setting=find(module.exports.default(props),node=>typeof node.type==='function'&&node.props.node);return setting.type(setting.props);};
  const action=(label)=>find(render(),node=>node.props?.['aria-label']===label);
  assert.equal(find(render(),node=>node.type==='switch').props.checked,original==='on');
  action('내용 비우기').props.onClick();
  for(let index=0;index<2;index++){
   const row=render(),choice=find(row,node=>node.type==='select');assert(choice);assert.equal(choice.props.value,'');assert.deepEqual(choice.props.options.map(option=>option.value),['','on','off']);
   assert(!find(row,node=>node.type==='switch'));assert.equal(action('초안에 반영').props.disabled,true);assert.equal(props.inputDrafts.size,1);assert.deepEqual(edits,[]);
   values.length=0;
  }
  action('sendfile').props.onChange({target:{value:original}});assert.equal(props.inputDrafts.size,0);assert.equal(action('초안에 반영').props.disabled,true);
  action('내용 비우기').props.onClick();const replacement=original==='on'?'off':'on';
  action('sendfile').props.onChange({target:{value:replacement}});assert.equal(find(render(),node=>node.type==='switch').props.checked,replacement==='on');
  assert.equal(action('초안에 반영').props.disabled,false);action('초안에 반영').props.onClick();assert.deepEqual(edits,[replacement]);assert.equal(props.inputDrafts.size,0);
 }
});

test('HTTP header and hash settings stay within their supported block contexts',()=>{
 const names=context=>nginxPresets({kind:'block',label:context}).map(item=>item.name);
 for(const context of ['http','server']){assert.ok(names(context).includes('client_header_timeout'));assert.ok(names(context).includes('underscores_in_headers'));}
 assert.ok(!names('location').includes('client_header_timeout'));assert.ok(names('location').includes('client_body_in_file_only'));assert.ok(names('http').includes('variables_hash_max_size'));assert.ok(!names('server').includes('variables_hash_max_size'));assert.ok(!names('events').includes('chunked_transfer_encoding'));
});

test('module settings offer inheritance contexts without invalid proxy_pass or TLS locations',()=>{
 const entries=context=>nginxPresets({kind:'block',label:context});
 for(const context of ['http','server','location']){
  const list=entries(context);assert(list.some(item=>item.name==='proxy_set_header'));assert(list.some(item=>item.name==='gzip_comp_level'));
  assert.equal(new Set(list.map(item=>item.kind+':'+item.name)).size,list.length);
 }
 for(const context of ['http','server'])assert(entries(context).some(item=>item.name==='ssl_certificate'));
 assert(!entries('location').some(item=>item.name==='ssl_certificate'));
 assert(!entries('http').some(item=>item.name==='proxy_pass'));
 assert(!entries('events').some(item=>item.name==='gzip'));
 assert(entries('http').some(item=>item.name==='upstream'&&item.kind==='block'));
});

test('custom directive GUI adds repeated values and retains rejected input',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const values=[],syncEffects=[];let cursor=0,source='location / { proxy_set_header Host $host; }';
 const native=createRequire(import.meta.url),module={exports:{}},hooks={...React,useEffect:fn=>syncEffects.push(fn),useState:initial=>{const index=cursor++;values[index]??=initial;return[values[index],value=>values[index]=value];}};
 const require=name=>name==='react'?hooks:name==='./nginx-icon'?{__esModule:true,default:'svg'}:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button:'button',TextInput:'input'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let pendingChanges=0;const props={inputDrafts:new Map(),inputScope:'location',onPendingChange:()=>pendingChanges++,nodes:[],onAdd:(name,value)=>{try{source=addNginxDirective(source,parseNginxTree(source)[0].id,name,value);return true;}catch{return false;}}};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child,predicate);if(found)return found;}};
 const render=()=>{cursor=0;return module.exports.default(props);};
 const input=(label,value)=>find(render(),node=>node.type==='input'&&node.props.label===label).props.onChange({target:{value}});
 const submit=()=>find(render(),node=>node.type==='form').props.onSubmit({preventDefault(){}});
 input('설정 이름','proxy_set_header');input('설정 값','X-Real-IP $remote_addr');submit();
 assert.deepEqual(parseNginxTree(source)[0].children.map(node=>node.label),['proxy_set_header Host $host','proxy_set_header X-Real-IP $remote_addr']);assert.equal(values[1],'');assert.equal(values[2],'');
 input('설정 이름','custom_module_option');input('설정 값','off; injected on');const before=source;submit();assert.equal(source,before);assert.equal(values[2],'off; injected on');
 assert.ok(pendingChanges>0);values.length=0;render();assert.equal(values[1],'custom_module_option');assert.equal(values[2],'off; injected on','rejected custom input survives remount');props.inputScope='other-location';values.length=0;render();assert.equal(values[1],'');assert.equal(values[2],'','custom input is scoped to its block');props.inputScope='location';values.length=0;render();assert.equal(values[2],'off; injected on');
 input('설정 값','fixture');submit();assert.equal(parseNginxTree(source)[0].children.at(-1).label,'custom_module_option fixture');assert.equal(props.inputDrafts.size,0,'successful custom commit clears only its auxiliary input');
 input('설정 이름','other_option');input('설정 값','stale');props.inputDrafts=new Map();render();syncEffects.at(-1)();assert.equal(values[1],'');assert.equal(values[2],'','an invalidated source-version cache also clears the visible custom fields');
});
