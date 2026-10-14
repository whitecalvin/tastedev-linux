import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxSettingInfo,nginxBlockInfo,nginxSettingsSelection,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField} from '../lib/nginx-fields.ts';
import {parseNginxTree} from '../lib/nginx-syntax.ts';
import {translate} from '../lib/i18n.ts';
const names=['server_names_hash_bucket_size','proxy_headers_hash_max_size','proxy_headers_hash_bucket_size','proxy_cache_path','charset','http2','proxy_cookie_path','proxy_cache_bypass','internal','ignore_invalid_headers','break','proxy_max_temp_file_size','proxy_cache','proxy_buffers','proxy_buffer_size','proxy_cache_key','proxy_cache_valid','proxy_cache_use_stale','proxy_cache_background_update','proxy_cache_lock','autoindex','limit_req_zone','limit_req','limit_req_status'];
test('observed HTTP cache, rate limit, header and protocol directives have specific translated documentation',()=>{
 for(const name of names){const info=nginxSettingInfo(name,'location');assert.notEqual(info.unknown,true,name);assert(info.description.trim());assert.match(info.url,new RegExp('^https://nginx\\.org/en/docs/http/.*#'+name+'$'));
  for(const locale of ['en','ja','pt']){const text=translate(locale,info.description);assert(!/[가-힣]/.test(text),name+': '+locale);for(const number of info.description.match(/\d+(?:\.\d+)*/g)||[])assert(text.includes(number));}
 }
 assert.match(nginxSettingInfo('http2').description,/1\.25\.1/);
 assert.match(nginxSettingInfo('proxy_cache_bypass').description,/proxy_no_cache/);
 assert.equal(nginxSettingMatches('proxy_cache_background_update','on','갱신',x=>x,'location'),true);
 assert.match(nginxSettingInfo('proxy_cache_valid').description,/200·301·302/);
 assert.equal(nginxSettingInfo('proxy_cache','stream:server').unknown,true);
});
test('split_clients block and percentage rules keep deterministic hash semantics and unrestricted result values',()=>{
 const source='http { split_clients "${remote_addr}" $variant { 20% first; 30% second; * remaining; } }',tree=parseNginxTree(source),block=tree[0].children[0];
 const blockHelp=nginxBlockInfo('split_clients','split_clients');assert.notEqual(blockHelp.unknown,true);assert.match(blockHelp.description,/해시/);
 for(const node of block.children){const selection=nginxSettingsSelection(tree,node.id),name=node.label.split(/\s/)[0],info=nginxSettingInfo(name,selection.context);assert.equal(selection.context,'split_clients');assert.match(info.url,/ngx_http_split_clients_module.html#split_clients$/);assert.notEqual(info.unknown,true);assert.equal(nginxDirectiveField(name,'first',selection.context).type,'text');for(const locale of ['en','ja','pt'])assert(!/[가-힣]/.test(translate(locale,info.description)));}
 assert.match(nginxSettingInfo('20%','split_clients').description,/파일 순서/);assert.match(nginxSettingInfo('*','split_clients').description,/나머지/);
 assert.equal(nginxBlockInfo('split_clients','stream:server').unknown,true);
 assert.equal(nginxSettingInfo('20%','unknown:root').unknown,true);
 assert.equal(parseNginxTree(source)[0].children[0].children[1].label,'30% second');
});
