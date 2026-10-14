import test from 'node:test';import assert from 'node:assert/strict';import {nginxSettingMatches} from '../lib/nginx-setting-info.ts';import {translate} from '../lib/i18n.ts';
test('settings search matches directive names, values and localized help without rewriting source',()=>{assert.equal(nginxSettingMatches('client_header_timeout','60s','헤더'),true);assert.equal(nginxSettingMatches('client_header_timeout','60s','complete request',text=>translate('en',text)),true);assert.equal(nginxSettingMatches('client_header_timeout','60s','  HEADER_TIMEOUT  '),true);assert.equal(nginxSettingMatches('server_name','demo.test','demo.test'),true);assert.equal(nginxSettingMatches('unknown_module_option','original value','original'),true);assert.equal(nginxSettingMatches('root','/srv','headers'),false);assert.equal(nginxSettingMatches('root','/srv',''),true);});

import {nginxSettingInfo} from '../lib/nginx-setting-info.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
test('MIME entries take precedence over matching directive names while include remains a file reference',()=>{
 const tree=parseNginxTree('http { types { charset txt; proxy_cache cached; gzip compressed; include custom.types; } }');
 for(const node of tree[0].children[0].children){const selection=nginxSettingsSelection(tree,node.id),name=node.label.split(/\s/)[0],info=nginxSettingInfo(name,selection.context);assert.equal(selection.context,'types');assert.notEqual(info.unknown,true);
  if(name==='include'){assert.match(info.description,/types 블록 없이/);assert.match(info.url,/#include$/);}else {assert.match(info.description,/MIME 유형/);assert.match(info.url,/#types$/);assert.equal(info.defaultValue,undefined);}
 }
 assert.equal(nginxSettingMatches('charset','txt','MIME',text=>text,'types'),true);
 assert.equal(nginxSettingMatches('include','custom.types','확장자 항목',text=>text,'types'),true);
 assert.match(nginxSettingInfo('charset','server').url,/charset_module/);
 assert.match(nginxSettingInfo('proxy_cache','location').url,/proxy_module/);
});
test('HTTP balancing and authentication directives show specific help in their selected block',()=>{
 const tree=parseNginxTree('http { upstream app { zone app 64k; hash $request_uri consistent; ip_hash; least_conn; random two least_conn; resolver 127.0.0.1; } server { auth_basic "Private"; auth_basic_user_file /etc/nginx/htpasswd; } }');
 for(const block of tree[0].children)for(const node of block.children){
  const selected=nginxSettingsSelection(tree,node.id),name=node.label.split(/\s/)[0],info=nginxSettingInfo(name,selected.context);
  assert.notEqual(info.unknown,true,name);assert(info.description.trim());
  assert.match(info.url,new RegExp('/ngx_http_'+(selected.context==='upstream'?'upstream':'auth_basic')+'_module.html#'+name+'$'));
  for(const locale of ['en','ja','pt'])assert(!/[가-힣]/.test(translate(locale,info.description)),locale+': '+name);
 }
 assert.match(nginxSettingInfo('resolver','upstream').description,/1\.27\.3/);
 assert.notEqual(nginxSettingInfo('resolver','upstream').description,nginxSettingInfo('resolver','http').description);
 assert.equal(nginxSettingMatches('random','two least_conn','후보',x=>x,'upstream'),true);
 assert.equal(nginxSettingMatches('auth_basic','off','inherited',x=>translate('en',x),'server'),true);
 assert.equal(nginxSettingInfo('auth_basic','server').defaultValue,'off');
 assert.equal(nginxSettingInfo('auth_basic_user_file','server').defaultValue,undefined);
 assert.equal(nginxSettingInfo('ip_hash','stream:upstream').unknown,true);
});
test('every built-in editable directive has specific help and an official directive link',()=>{
 const cases=nginxPresets(null,{name:'nginx.conf'},'main').filter(item=>item.kind==='directive').map(item=>({...item,context:'main'}));
 for(const context of ['events','http','server','location','upstream'])for(const item of nginxPresets({kind:'block',label:context},{name:'nginx.conf'},context))if(item.kind==='directive')cases.push({...item,context});
 assert.ok(new Set(cases.map(item=>item.name)).size>60);
 for(const {name,context} of cases){const info=nginxSettingInfo(name,context);assert.ok(info?.description,name+': '+context);assert.notEqual(info.unknown,true,name+': '+context);assert.match(info.url,new RegExp('^https://nginx\\.org/en/docs/.*#'+name+'$'));}
});
test('external directives receive an honest explanation rather than a blank row or invented defaults',()=>{
 for(const name of ['custom_vendor_option','constructor','toString']){const info=nginxSettingInfo(name);assert.equal(info.unknown,true);assert.match(info.description,/외부 모듈/);assert.equal(info.defaultValue,undefined);assert.equal(info.url,'https://nginx.org/en/docs/dirindex.html');}
 assert.equal(nginxSettingMatches('worker_connections','768','파일 디스크립터'),true);
 assert.match(nginxSettingInfo('fastcgi_param').url,/fastcgi_module/);
 assert.match(nginxSettingInfo('worker_connections').url,/ngx_core_module/);
 assert.match(nginxSettingInfo('proxy_pass').url,/proxy_module/);
});

test('help follows the selected block context and covers standard installed-file directives',()=>{
 for(const name of ['worker_cpu_affinity','proxy_ssl_name','allow','deny'])assert.notEqual(nginxSettingInfo(name).unknown,true,name);
 for(const name of ['keepalive_requests','keepalive_time','keepalive_timeout','resolver_timeout']){
  const upstream=nginxSettingInfo(name,'upstream'),http=nginxSettingInfo(name,'http');
  assert.match(upstream.url,/upstream_module/);assert.match(http.url,/core_module/);
  assert.notEqual(upstream.description,http.description);
 }
 assert.equal(nginxSettingMatches('keepalive_timeout','60s','유휴',x=>x,'upstream'),true);
 assert.equal(nginxSettingMatches('keepalive_timeout','60s','유휴',x=>x,'http'),false);
 const mime=nginxSettingInfo('text/html','types');assert.notEqual(mime.unknown,true);assert.match(mime.description,/파일 확장자/);assert.match(mime.url,/#types$/);
 assert.equal(nginxSettingInfo('custom_vendor_option','location').unknown,true);
});

import {nginxBlockInfo,nginxSettingsSelection} from '../lib/nginx-setting-info.ts';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
test('map and geo rule help follows ancestry without mistaking rule keys for directives',()=>{
 const source='http { map $host $target { hostnames; default local; include /etc/nginx/maps.conf; volatile; example.com app; ~^api api; root literal; \\default escaped; } geo $region { default unknown; include /etc/nginx/geo.conf; delete 192.0.2.0/24; proxy 127.0.0.1; proxy_recursive; ranges; volatile; 192.0.2.0-192.0.2.255 region; 2001:db8::/32 ipv6; } }';
 const tree=parseNginxTree(source);
 for(const block of tree[0].children)for(const node of block.children){
  const selection=nginxSettingsSelection(tree,node.id),name=node.label.split(/\s/)[0],info=nginxSettingInfo(name,selection.context);
  assert.equal(selection.context,block.label.split(/\s/)[0]);assert.notEqual(info.unknown,true,node.label);
  assert.match(info.url,new RegExp('ngx_http_'+selection.context+'_module.html#'+selection.context+'$'));
  assert.equal(info.defaultValue,undefined,'rule values have no invented nginx directive defaults');
  for(const locale of ['en','ja','pt']){const translated=translate(locale,info.description);assert(!/[가-힣]/.test(translated));for(const version of info.description.match(/\d+\.\d+\.\d+/g)||[])assert(translated.includes(version));}
 }
 assert.match(nginxSettingInfo('root','map').description,/원본 값/);
 assert.match(nginxSettingInfo('\\default','map').description,/원본 값/);
 assert.match(nginxSettingInfo('default','map').description,/일치하지/);
 assert.match(nginxSettingInfo('delete','geo').description,/파일 삭제 명령이 아닙니다/);
 assert.match(nginxSettingInfo('proxy_recursive','geo').description,/신뢰하지 않는 주소/);
 assert.equal(nginxSettingMatches('example.com','app','정규식',x=>x,'map'),true);
 assert.equal(nginxSettingMatches('192.0.2.0/24','region','most specific',x=>translate('en',x),'geo'),true);
 assert.equal(nginxSettingInfo('ranges','http').unknown,true);
 assert.equal(nginxSettingInfo('default','unknown:root').unknown,true);
 assert.equal(parseNginxTree(source)[0].children[0].children.length,8,'help leaves source and order untouched');
});
test('direct selection retains parent module semantics and the selected directive',()=>{
 const nodes=parseNginxTree('http { upstream backend { keepalive_timeout 10s; } server { keepalive_timeout 20s; types { text/html html; } } }');
 const upstream=nodes[0].children[0].children[0],server=nodes[0].children[1];
 const selected=nginxSettingsSelection(nodes,upstream.id);
 assert.equal(selected.addTargetId,nodes[0].children[0].id);
 assert.equal(selected.context,'upstream');assert.deepEqual(selected.nodes,[upstream]);assert.match(nginxSettingInfo('keepalive_timeout',selected.context).url,/upstream_module/);
 assert.equal(nginxSettingsSelection(nodes,server.children[0].id).context,'server');
 assert.equal(nginxSettingsSelection(nodes,server.children[1].children[0].id).context,'types');
 assert.deepEqual(nginxSettingsSelection(nodes,server.id).nodes,server.children);
 assert.equal(nginxSettingsSelection(nodes,server.id).addTargetId,server.id);
 assert.equal(nginxSettingsSelection(nodes,null).addTargetId,null);
 const root=parseNginxTree('default fallback;');assert.equal(nginxSettingsSelection(root,root[0].id,'map').addTargetId,null);
 assert.deepEqual(nginxSettingsSelection(nodes,null).nodes,nodes);
 assert.deepEqual(nginxSettingsSelection(nodes,'missing').nodes,[]);
});
test('block descriptions distinguish virtual servers from upstream addresses',()=>{
 for(const name of ['events','http','server','location','upstream','types','map','geo','limit_except']){const info=nginxBlockInfo(name);assert.ok(info.description);assert.notEqual(info.unknown,true,name);assert.match(info.url,/^https:\/\/nginx\.org\/en\/docs\//);}
 assert.match(nginxBlockInfo('server').description,/가상 HTTP 서버/);
 assert.match(nginxSettingInfo('server','upstream').description,/주소/);
 assert.match(nginxBlockInfo('location').description,/정규식/);
 assert.equal(nginxBlockInfo('constructor').unknown,true);
});

test('protocol ancestry survives server and upstream blocks without HTTP help leaking',()=>{
 const nodes=parseNginxTree('stream { server { listen 53 udp; proxy_pass dns; } } mail { server { protocol smtp; server_name mail.test; } } http { server { listen 80; } }');
 const streamServer=nodes[0].children[0],mailServer=nodes[1].children[0];
 assert.equal(nginxSettingsSelection(nodes,streamServer.id).context,'stream:server');
 assert.equal(nginxSettingsSelection(nodes,streamServer.children[1].id).context,'stream:server');
 assert.match(nginxSettingInfo('proxy_pass','stream:server').url,/stream\/ngx_stream_proxy/);
 assert.match(nginxSettingInfo('server_name','mail:server').description,/메일/);
 assert.match(nginxBlockInfo('server','mail:server').description,/메일/);
 assert.match(nginxBlockInfo('server','stream:server').description,/TCP/);
 assert.equal(nginxSettingInfo('root','stream:server').unknown,true,'never assign HTTP semantics in another protocol family');
 assert.equal(nginxSettingsSelection(nodes,nodes[2].children[0].id).context,'server');
 const streamPresets=nginxPresets(streamServer,{name:'nginx.conf'},'stream:server');
 assert(!streamPresets.some(item=>['root','location','server_name'].includes(item.name)));
 assert(streamPresets.some(item=>item.name==='proxy_pass'&&!item.value.startsWith('http')));
 for(const [node,context] of [[streamServer,'stream:server'],[mailServer,'mail:server']])for(const item of nginxPresets(node,{name:'nginx.conf'},context))assert.notEqual(nginxSettingInfo(item.name,context).unknown,true,item.name);
 for(const name of ['stream','mail','if'])assert.notEqual(nginxBlockInfo(name).unknown,true,name);
});

test('stream upstream has protocol-specific block, directive help and backend presets',()=>{
 const nodes=parseNginxTree('stream { upstream backend { server 127.0.0.1:9000; zone backend 64k; hash $remote_addr consistent; } }');
 const upstream=nodes[0].children[0],selected=nginxSettingsSelection(nodes,upstream.id);
 assert.equal(selected.context,'stream:upstream');assert.match(nginxBlockInfo('upstream',selected.context).url,/stream\/ngx_stream_upstream_module.html#upstream$/);
 for(const name of ['server','zone','hash','least_conn','random','resolver','resolver_timeout']){
  const help=nginxSettingInfo(name,selected.context);assert.notEqual(help.unknown,true);assert.match(help.url,new RegExp('stream/ngx_stream_upstream_module.html#'+name+'$'));
 }
 assert.match(nginxSettingInfo('resolver','stream:upstream').description,/1\.27\.3/);
 assert.notEqual(nginxSettingInfo('server','stream:upstream').description,nginxBlockInfo('server','stream:server').description);
 const presets=nginxPresets(upstream,{name:'nginx.conf'},selected.context);assert(presets.some(item=>item.name==='server'&&item.kind==='directive'));assert(!presets.some(item=>['keepalive','location','root'].includes(item.name)));
 assert(nginxPresets(nodes[0],{name:'nginx.conf'},'stream:stream').some(item=>item.name==='upstream'&&item.kind==='block'));
});

test('TLS, trusted proxy and rewrite directives in an installed-style file retain specific searchable help',()=>{
 const source='http { server { ssl_stapling_verify on; ssl_client_certificate /etc/nginx/ca.pem; ssl_verify_depth 2; ssl_buffer_size 4k; set_real_ip_from 192.0.2.0/24; real_ip_header X-Forwarded-For; real_ip_recursive on; rewrite_log on; uninitialized_variable_warn on; if ($request_method = POST) { return 405; } } }';
 const tree=parseNginxTree(source),directives=tree[0].children[0].children.filter(node=>node.kind==='directive');
 for(const node of directives){const selected=nginxSettingsSelection(tree,node.id),name=node.label.split(/\s/)[0],info=nginxSettingInfo(name,selected.context);assert.notEqual(info.unknown,true,name);assert.match(info.url,new RegExp('#'+name+'$'));assert.notEqual(translate('en',info.description),info.description,name);assert.notEqual(translate('pt',info.description),info.description,name);}
 assert.equal(nginxSettingMatches('ssl_stapling_verify','on','OCSP',x=>x,'server'),true);
 assert.equal(nginxSettingMatches('set_real_ip_from','192.0.2.0/24','trusted proxies',text=>translate('en',text),'server'),true);
 assert.match(nginxSettingInfo('real_ip_header','server').description,/listen/);
 assert.equal(nginxSettingInfo('set_real_ip_from','server').defaultValue,undefined);
 assert.equal(nginxSettingInfo('ssl_verify_depth','server').defaultValue,'1');
 assert.notEqual(nginxBlockInfo('if','server').unknown,true);assert.match(nginxBlockInfo('if','server').url,/#if$/);
 assert.deepEqual(parseNginxTree(source),tree);
});
