import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
import {nginxUpstreamNames,nginxUpstreamPresets} from '../lib/nginx-upstream-settings.ts';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('open upstream inventory provides context-bound Korean settings and valid controls',()=>{
 const reference='server zone hash ip_hash keepalive keepalive_requests keepalive_time keepalive_timeout least_conn random resolver resolver_timeout'.split(' ');
 assert.deepEqual([...nginxUpstreamNames].sort(),reference.sort());
 const names=nginxPresets(null,null,'upstream').map(item=>item.name);assert.equal(new Set(names).size,names.length);
 for(const name of reference){assert(names.includes(name));const info=nginxSettingInfo(name,'upstream');assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_upstream_module.html#'+name);}
 for(const context of ['main','events','http','server','location','stream:upstream','map'])assert.deepEqual(nginxUpstreamPresets(context),[]);
 for(const name of ['state','ntlm','least_time','queue','sticky'])assert(!names.includes(name));
 for(const name of ['ip_hash','least_conn']){assert.equal(nginxDirectiveField(name,'','upstream').type,'flag');assert.equal(validateNginxField(nginxDirectiveField(name,'','upstream'),''),'');assert.throws(()=>validateNginxField(nginxDirectiveField(name,'','upstream'),'on'));assert.equal(nginxDirectiveField(name,'','map').type,'text');assert.equal(nginxDirectiveField(name,'future','upstream').type,'text');}
 assert.equal(validateNginxField(nginxDirectiveField('keepalive','32','upstream'),'1'),'1');assert.throws(()=>validateNginxField(nginxDirectiveField('keepalive','32','upstream'),'0'));
 assert.equal(nginxDirectiveField('keepalive','32 local','upstream').type,'text','future compound arguments stay editable');
 assert(nginxSettingMatches('server','127.0.0.1:3000','예비 서버',x=>x,'upstream'));
 assert.match(nginxSettingInfo('keepalive','upstream').description,/Connection/);assert.match(nginxSettingInfo('server','upstream').description,/1\.27\.3/);
});
test('balancer addition precedes keepalive without losing comments or following directives',()=>{
 for(const [name,value] of [['hash','$request_uri consistent'],['ip_hash',''],['least_conn',''],['random','two least_conn']]){
  for(const body of ['server 127.0.0.1:3000; keepalive 32; keepalive_timeout 60s;','\n    server 127.0.0.1:3000;\n    # keep connection settings\n    keepalive 32;\n    keepalive_timeout 60s;\n']){
   let source='http { upstream backend {'+body+'} }';const group=parseNginxTree(source)[0].children[0];source=addNginxDirective(source,group.id,name,value);const children=parseNginxTree(source)[0].children[0].children;
   assert(children.findIndex(row=>row.label.split(' ')[0]===name)<children.findIndex(row=>row.label==='keepalive 32'));assert(children.some(row=>row.label==='keepalive_timeout 60s'));assert.match(source,/;\n[ \t]+keepalive 32;/,'inline insertion leaves the existing keepalive aligned');if(body.includes('#'))assert.match(source,/# keep connection settings/);
  }
 }
 let source='http { upstream backend {server 127.0.0.1:3000;} }';source=addNginxDirective(source,parseNginxTree(source)[0].children[0].id,'least_conn','');assert.match(source,/least_conn;/);assert.doesNotMatch(source,/least_conn (?:on|off)/);
});
test('compiled settings GUI adds a valueless balancing method ahead of existing keepalive',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/nginx-block-settings.tsx',import.meta.url),'utf8'),{filename:'nginx-block-settings.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const native=createRequire(import.meta.url),module={exports:{}},hooks={...React,useEffect:()=>{},useState:initial=>[initial,()=>{}]};
 const require=name=>name==='react'?hooks:name==='./nginx-icon'?{__esModule:true,default:'svg'}:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:'button',TextInput:'input',Dropdown:'select',Switch:'switch'}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,predicate);if(result)return result;}};
 for(const name of ['least_conn','ip_hash']){
  let source='http { upstream backend { server 127.0.0.1:3000; keepalive 32; } }';const group=()=>parseNginxTree(source)[0].children[0];
  const props={context:'upstream',nodes:group().children,available:nginxPresets(null,null,'upstream'),onAdd:(key,value)=>{validateNginxField(nginxDirectiveField(key,value,'upstream'),value);source=addNginxDirective(source,group().id,key,value);return true;}};
  const suggested=find(module.exports.default(props),node=>typeof node.type==='function'&&node.props.available&&node.props.node?.id===name);assert(suggested);const row=suggested.type(suggested.props);assert(!find(row,node=>node.type==='input'));const add=find(row,node=>node.props?.['aria-label']==='초안에 항목 추가');assert.equal(add.props.disabled,false);add.props.onClick();assert(source.indexOf(name+';')<source.indexOf('keepalive 32;'));
  props.nodes=group().children;assert(!find(module.exports.default(props),node=>typeof node.type==='function'&&node.props.available&&node.props.node?.id===name));
 }
});
test('adding a second upstream method refuses silent replacement while keeping ordinary repeated servers',()=>{
 for(const existing of ['hash $request_uri consistent','ip_hash','least_conn','least_time header','random two least_conn','sticky cookie session']){
  const source='http { upstream first {'+existing+'; server 127.0.0.1:3000; } upstream second {server 127.0.0.1:3001;} }';const groups=parseNginxTree(source)[0].children;
  for(const [name,value] of [['hash','$request_uri'],['ip_hash',''],['least_conn',''],['random','two least_conn']])assert.throws(()=>addNginxDirective(source,groups[0].id,name,value),/부하 분산 방식이 이미/);
  assert.match(addNginxDirective(source,groups[0].id,'server','127.0.0.1:3002'),/127\.0\.0\.1:3002/);
  assert.match(addNginxDirective(source,groups[1].id,'least_conn',''),/least_conn;/,'another group remains independent');
 }
 assert.throws(()=>addNginxDirective('ip_hash; server 127.0.0.1:3000;',null,'least_conn','','directive','upstream'),/부하 분산 방식이 이미/);
 assert.doesNotThrow(()=>addNginxDirective('map $host $pool { least_conn backend; }',parseNginxTree('map $host $pool { least_conn backend; }')[0].id,'ip_hash','backend'),'mapping keys are independent');
});
