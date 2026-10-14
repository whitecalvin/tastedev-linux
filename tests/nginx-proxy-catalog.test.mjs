import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxProxyNames,nginxProxyPresets} from '../lib/nginx-proxy-settings.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
const reference=`proxy_bind proxy_buffer_size proxy_buffering proxy_buffers proxy_busy_buffers_size proxy_cache proxy_cache_background_update proxy_cache_bypass proxy_cache_convert_head proxy_cache_key proxy_cache_lock proxy_cache_lock_age proxy_cache_lock_timeout proxy_cache_max_range_offset proxy_cache_methods proxy_cache_min_uses proxy_cache_path proxy_cache_revalidate proxy_cache_use_stale proxy_cache_valid proxy_connect_timeout proxy_cookie_domain proxy_cookie_flags proxy_cookie_path proxy_force_ranges proxy_headers_hash_bucket_size proxy_headers_hash_max_size proxy_hide_header proxy_http_version proxy_ignore_client_abort proxy_ignore_headers proxy_intercept_errors proxy_limit_rate proxy_max_temp_file_size proxy_method proxy_next_upstream proxy_next_upstream_timeout proxy_next_upstream_tries proxy_no_cache proxy_pass proxy_pass_header proxy_pass_request_body proxy_pass_request_headers proxy_pass_trailers proxy_read_timeout proxy_redirect proxy_request_buffering proxy_send_lowat proxy_send_timeout proxy_set_body proxy_set_header proxy_socket_keepalive proxy_ssl_certificate proxy_ssl_certificate_cache proxy_ssl_certificate_key proxy_ssl_ciphers proxy_ssl_conf_command proxy_ssl_crl proxy_ssl_name proxy_ssl_password_file proxy_ssl_protocols proxy_ssl_server_name proxy_ssl_session_reuse proxy_ssl_trusted_certificate proxy_ssl_verify proxy_ssl_verify_depth proxy_store proxy_store_access proxy_temp_file_write_size proxy_temp_path`.split(' ');
test('open source proxy inventory has GUI proposals and Korean explanations with context bounds',()=>{
 assert.deepEqual([...nginxProxyNames].sort(),reference.sort());
 for(const context of ['http','server','location']){
  const items=nginxPresets(null,null,context).filter(item=>item.name.startsWith('proxy_'));assert.equal(new Set(items.map(item=>item.name)).size,items.length);
  for(const item of nginxProxyPresets(context)){assert(items.some(candidate=>candidate.name===item.name));const info=nginxSettingInfo(item.name,context);assert.notEqual(info.unknown,true,item.name);assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_proxy_module.html#'+item.name);}
 }
 for(const context of ['main','events','map','geo','types','split_clients','upstream','stream:server'])assert.equal(nginxProxyPresets(context).length,0);
 for(const context of ['server','location'])assert(!nginxPresets(null,null,context).some(item=>item.name==='proxy_cache_path'));
 for(const context of ['http','server'])assert(!nginxPresets(null,null,context).some(item=>item.name==='proxy_pass'));
 for(const name of ['proxy_allow_upstream','proxy_bind_dynamic','proxy_cache_purge','proxy_request_dynamic','proxy_socket_rcvbuf','proxy_socket_sndbuf','proxy_ssl_key_log'])assert(!reference.includes(name));
});
test('proxy controls preserve compound values and mapping keys while search reaches Korean help',()=>{
 for(const name of ['proxy_cache_convert_head','proxy_cache_revalidate','proxy_socket_keepalive','proxy_ssl_session_reuse','proxy_pass_trailers']){assert.equal(nginxDirectiveField(name,'on','location').type,'switch');assert.equal(nginxDirectiveField(name,'','location').type,'text');assert.equal(nginxDirectiveField(name,'on','map').type,'text');}
 assert.equal(nginxDirectiveField('proxy_http_version','1.1','location').type,'select');assert.equal(nginxDirectiveField('proxy_http_version','2','location').type,'text');
 assert.equal(validateNginxField(nginxDirectiveField('proxy_next_upstream_tries','0','location'),'0'),'0');
 for(const name of ['proxy_cache_min_uses','proxy_ssl_verify_depth']){assert.equal(validateNginxField(nginxDirectiveField(name,'1','http'),'0'),'0');assert.throws(()=>validateNginxField(nginxDirectiveField(name,'1','http'),'-1'));}
 for(const [name,value] of [['proxy_cookie_flags','session secure httponly samesite=strict'],['proxy_cache_path','/tmp/cache levels=1:2 keys_zone=zone:10m'],['proxy_ssl_certificate_cache','max=100 inactive=20s valid=1m'],['proxy_next_upstream','error timeout http_502']]){assert.equal(nginxDirectiveField(name,value,'http').type,'text');assert.equal(validateNginxField({type:'text'},value),value);}
 assert(nginxSettingMatches('proxy_socket_keepalive','off','HTTP 연결 재사용',x=>x,'server'));
 assert.match(nginxSettingInfo('proxy_pass_trailers','location').description,/1\.27\.2/);assert.match(nginxSettingInfo('proxy_ssl_certificate_cache','location').description,/1\.27\.4/);
 let source='events {} http { server { location / {} } }';let parent=parseNginxTree(source)[1].children[0].children[0];source=addNginxDirective(source,parent.id,'proxy_cookie_flags','session secure httponly samesite=strict');parent=parseNginxTree(source)[1].children[0].children[0];assert.equal(parent.children[0].label,'proxy_cookie_flags session secure httponly samesite=strict');
});
