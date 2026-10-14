import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';

const names=['daemon','debug_points','env','error_log','include','load_module','lock_file','master_process','pcre_jit','pid','ssl_engine','ssl_object_cache_inheritable','thread_pool','timer_resolution','user','worker_cpu_affinity','worker_priority','worker_processes','worker_rlimit_core','worker_rlimit_nofile','worker_shutdown_timeout','working_directory'];
test('main GUI offers every upstream main core directive without adding them to child blocks',()=>{
 const presets=nginxPresets(null,{name:'nginx.conf'}).filter(item=>item.kind==='directive');
 assert.deepEqual(presets.map(item=>item.name).sort(),names.toSorted());
 for(const context of ['events','http','server','location','upstream','stream:server']){
  const list=nginxPresets({kind:'block',label:context},null,context);
  for(const name of names.filter(name=>!['error_log','include'].includes(name)))assert(!list.some(item=>item.name===name),name+': '+context);
 }
 for(const name of names){const info=nginxSettingInfo(name,'main');assert.notEqual(info.unknown,true,name);assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/ngx_core_module.html#'+name);}
});
test('main drafts keep existing blocks and repeat environment variables in edited order',()=>{
 let source='worker_processes auto;\nevents { worker_connections 768; }\nhttp { server { listen 8080; } }\n';
 for(const [name,value] of [['env','TZ'],['env','APP_MODE=production'],['worker_priority','-5'],['worker_shutdown_timeout','30s']])source=addNginxDirective(source,null,name,value);
 const nodes=parseNginxTree(source);
 assert.deepEqual(nodes.filter(node=>node.kind==='directive').map(node=>node.label),['worker_processes auto','env TZ','env APP_MODE=production','worker_priority -5','worker_shutdown_timeout 30s']);
 assert.equal(nodes[1].children[0].label,'worker_connections 768');assert.equal(nodes[2].children[0].children[0].label,'listen 8080');
 assert(nginxSettingMatches('worker_shutdown_timeout','30s','정상 종료',text=>text,'main'));
 assert.match(nginxSettingInfo('thread_pool','main').description,/--with-threads/);
 assert.match(nginxSettingInfo('ssl_engine','main').description,/검수 중/);
 assert.equal(nginxSettingInfo('timer_resolution','main').defaultValue,undefined);
 assert.equal(nginxSettingInfo('thread_pool','main').defaultValue,'default threads=32 max_queue=65536');
});
test('main switches and debug choices keep raw editing for unexpected values and map keys',()=>{
 for(const name of ['daemon','master_process','pcre_jit','ssl_object_cache_inheritable']){
  const field=nginxDirectiveField(name,'on','main');assert.equal(field.type,'switch');assert.equal(validateNginxField(field,'off'),'off');assert.throws(()=>validateNginxField(field,'maybe'));
  assert.equal(nginxDirectiveField(name,'unexpected','main').type,'text');assert.equal(nginxDirectiveField(name,'on','map').type,'text');
 }
 const debug=nginxDirectiveField('debug_points','stop','main');assert.equal(validateNginxField(debug,'abort'),'abort');assert.throws(()=>validateNginxField(debug,'continue'));
 assert.equal(nginxDirectiveField('worker_priority','-5','main').type,'text');
});
test('compiled main settings render Korean help with switches and debug selector',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const controls={Button:({children,...props})=>React.createElement('button',props,children),TextInput:({label,...props})=>React.createElement('input',{'aria-label':label,...props}),Switch:props=>React.createElement('input',{...props,type:'checkbox'}),Dropdown:({options,...props})=>React.createElement('select',props,options.map(option=>React.createElement('option',{key:option.value,value:option.value},option.label)))};
 const require=name=>name==='./nginx-icon'?{__esModule:true,default:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?controls:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const html=renderToStaticMarkup(React.createElement(module.exports.default,{context:'main',nodes:[],available:nginxPresets(null,{name:'nginx.conf'}).filter(item=>item.kind==='directive'),onEdit:()=>{},onAdd:()=>{}}));
 for(const name of names)assert(html.includes('<strong>'+name+'</strong>'),name);
 assert.equal((html.match(/type="checkbox"/g)||[]).length,4);
 assert.match(html,/<select[^>]*aria-label="debug_points"/);
 assert.match(html,/--with-threads/);assert.match(html,/환경 변수/);assert.match(html,/정상 종료/);
 assert.doesNotMatch(html,/설정 항목이 없습니다\./,'available settings are real search results');
 for(const props of [{available:[]},{readOnly:true,available:nginxPresets(null,{name:'nginx.conf'})}]){
  const empty=renderToStaticMarkup(React.createElement(module.exports.default,{context:'main',nodes:[],onEdit:()=>{},...props}));
  assert.match(empty,/설정 항목이 없습니다\./,'empty or hidden read-only suggestions still show the empty state');
 }
});
