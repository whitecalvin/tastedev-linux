import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
const shared=['lingering_close','lingering_time','lingering_timeout','log_subrequest','max_ranges','msie_padding','msie_refresh','open_file_cache','open_file_cache_errors','open_file_cache_min_uses','open_file_cache_valid','output_buffers','port_in_redirect','postpone_output','read_ahead','recursive_error_pages','reset_timedout_connection','satisfy','send_lowat','sendfile_max_chunk','server_name_in_redirect','subrequest_output_buffer_size'];
test('HTTP cache and connection controls are offered only in their allowed blocks with Korean help',()=>{
 for(const context of ['http','server','location']){
  const list=nginxPresets(null,null,context);
  for(const name of shared){assert.equal(list.filter(item=>item.name===name).length,1,context+':'+name);const info=nginxSettingInfo(name,context);assert.notEqual(info.unknown,true);assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_core_module.html#'+name);}
  for(const name of ['merge_slashes','request_pool_size'])assert.equal(list.some(item=>item.name===name),context!=='location');
  assert.equal(list.some(item=>item.name==='server_names_hash_max_size'),context==='http');
 }
 for(const context of ['main','events','upstream','map','types','stream:server'])for(const name of shared)assert(!nginxPresets(null,null,context).some(item=>item.name===name),name);
 assert(nginxSettingMatches('open_file_cache_valid','60s','재확인',text=>text,'http'));
 assert.match(nginxSettingInfo('read_ahead','location').description,/Linux.*무시/);
});
test('HTTP typed controls accept supported choices and zero, preserving compound cache settings and map keys',()=>{
 for(const name of ['log_subrequest','merge_slashes','msie_padding','msie_refresh','open_file_cache_errors','port_in_redirect','recursive_error_pages','reset_timedout_connection','server_name_in_redirect']){
  const field=nginxDirectiveField(name,'on','server');assert.equal(field.type,'switch');assert.equal(validateNginxField(field,'off'),'off');assert.throws(()=>validateNginxField(field,'maybe'));
  assert.equal(nginxDirectiveField(name,'on','map').type,'text');assert.equal(nginxDirectiveField(name,'custom','server').type,'text');
 }
 for(const [name,value] of [['lingering_close','always'],['satisfy','any']]){const field=nginxDirectiveField(name,value,'location');assert.equal(field.type,'select');assert.equal(validateNginxField(field,value),value);assert.throws(()=>validateNginxField(field,'invalid'));}
 for(const name of ['max_ranges','open_file_cache_min_uses']){const field=nginxDirectiveField(name,'0','http');assert.equal(validateNginxField(field,'0'),'0');assert.throws(()=>validateNginxField(field,'-1'));assert.throws(()=>validateNginxField(field,'2.5'));assert.equal(nginxDirectiveField(name,'0','types').type,'text');}
 assert.equal(nginxDirectiveField('open_file_cache','max=1000 inactive=20s','location').type,'text');
});
test('HTTP cache GUI insertion keeps multiple parameters and adjacent error settings in code order',()=>{
 let source='events {}\nhttp { server { location / { error_page 404 /404.html; } } }';
 for(const [name,value] of [['open_file_cache','max=1000 inactive=20s'],['open_file_cache_errors','on'],['recursive_error_pages','off']]){const location=parseNginxTree(source)[1].children[0].children[0];source=addNginxDirective(source,location.id,name,value);}
 assert.deepEqual(parseNginxTree(source)[1].children[0].children[0].children.map(node=>node.label),['error_page 404 /404.html','open_file_cache max=1000 inactive=20s','open_file_cache_errors on','recursive_error_pages off']);
});
