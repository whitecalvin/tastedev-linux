import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
const shared=['auth_delay','client_body_temp_path','directio','directio_alignment','disable_symlinks','if_modified_since','keepalive_disable','keepalive_min_timeout'];
test('HTTP core drafts respect header and connection settings context',()=>{
 for(const context of ['http','server','location']){
  const presets=nginxPresets({kind:'block',label:context});
  for(const name of shared)assert.equal(presets.filter(item=>item.name===name).length,1,name+':'+context);
  for(const name of ['connection_pool_size','ignore_invalid_headers'])assert.equal(presets.some(item=>item.name===name),context!=='location',name+':'+context);
  for(const name of shared){const info=nginxSettingInfo(name,context);assert.match(info.description,/[가-힣]/);assert.notEqual(info.unknown,true);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_core_module.html#'+name);}
 }
 for(const context of ['main','events','upstream','map','types','stream:server'])for(const name of shared)assert(!nginxPresets(null,null,context).some(item=>item.name===name),context+':'+name);
 assert.match(nginxSettingInfo('keepalive_min_timeout','server').description,/1\.27\.4/);
 assert(nginxSettingMatches('disable_symlinks','off','심볼릭',text=>text,'location'));
});
test('HTTP selections preserve complex raw values and mapping keys',()=>{
 const modified=nginxDirectiveField('if_modified_since','exact','location');assert.equal(modified.type,'select');assert.equal(validateNginxField(modified,'before'),'before');assert.throws(()=>validateNginxField(modified,'sometimes'));
 assert.equal(nginxDirectiveField('ignore_invalid_headers','off','http').type,'switch');
 for(const [name,value] of [['disable_symlinks','on from=$document_root'],['directio','8m'],['keepalive_disable','msie6 safari'],['if_modified_since','$mode'],['ignore_invalid_headers','custom']])assert.equal(nginxDirectiveField(name,value,'location').type,'text');
 assert.equal(nginxDirectiveField('if_modified_since','before','map').type,'text');
});
test('HTTP GUI additions retain variable values and directive order in generated code',()=>{
 let source='events {}\nhttp { server { location / { root /tmp/html; } } }';
 for(const [name,value] of [['disable_symlinks','on from=$document_root'],['if_modified_since','before'],['keepalive_min_timeout','5s']]){
  const location=parseNginxTree(source)[1].children[0].children[0];source=addNginxDirective(source,location.id,name,value);
 }
 assert.deepEqual(parseNginxTree(source)[1].children[0].children[0].children.map(node=>node.label),['root /tmp/html','disable_symlinks on from=$document_root','if_modified_since before','keepalive_min_timeout 5s']);
});
test('compiled HTTP settings show Korean help and supported typed controls in each block',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}};
 const controls={Button:({children,...props})=>React.createElement('button',props,children),TextInput:({label,...props})=>React.createElement('input',{'aria-label':label,...props}),Switch:props=>React.createElement('input',{...props,type:'checkbox'}),Dropdown:({options,...props})=>React.createElement('select',props,options.map(option=>React.createElement('option',{key:option.value,value:option.value},option.label)))};
 const require=name=>name==='./nginx-icon'?{__esModule:true,default:()=>null}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?controls:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 for(const context of ['http','server','location']){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{context,nodes:[],available:nginxPresets({kind:'block',label:context}).filter(item=>item.kind==='directive'),onEdit:()=>{},onAdd:()=>{}}));
  for(const name of shared)assert(html.includes('<strong>'+name+'</strong>'),context+':'+name);
  assert.match(html,/<select[^>]*aria-label="if_modified_since"/);assert.match(html,/심볼릭 링크/);assert.match(html,/1\.27\.4/);
  if(context==='location')assert.doesNotMatch(html,/<strong>(?:ignore_invalid_headers|connection_pool_size)<\/strong>/);
  else assert.match(html,/<input[^>]*aria-label="ignore_invalid_headers"[^>]*type="checkbox"/);
 }
});
