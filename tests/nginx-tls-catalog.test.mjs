import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxTlsNames,nginxTlsPresets} from '../lib/nginx-tls-settings.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxSettingMatches} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
const reference='ssl_buffer_size ssl_certificate ssl_certificate_cache ssl_certificate_key ssl_ciphers ssl_client_certificate ssl_conf_command ssl_crl ssl_dhparam ssl_early_data ssl_ecdh_curve ssl_ocsp ssl_ocsp_cache ssl_ocsp_responder ssl_password_file ssl_prefer_server_ciphers ssl_protocols ssl_reject_handshake ssl_session_cache ssl_session_ticket_key ssl_session_tickets ssl_session_timeout ssl_stapling ssl_stapling_file ssl_stapling_responder ssl_stapling_verify ssl_trusted_certificate ssl_verify_client ssl_verify_depth'.split(' ');
test('public nginx 1.28 TLS inventory has context bounded GUI proposals and Korean help',()=>{
 assert.equal(reference.length,29);assert.deepEqual([...nginxTlsNames].sort(),reference.sort());
 for(const context of ['http','server']){const items=nginxPresets(null,null,context);assert.equal(new Set(items.map(row=>row.kind+':'+row.name)).size,items.length);for(const name of reference){assert(items.some(row=>row.name===name));const info=nginxSettingInfo(name,context);assert(!info.unknown,name);assert.match(info.description,/[가-힣]/);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_ssl_module.html#'+name);}}
 for(const context of ['main','events','location','upstream','types','map','stream:server'])assert.deepEqual(nginxTlsPresets(context),[]);
 for(const name of ['ssl','ssl_certificate_compression','ssl_ech_file','ssl_key_log'])assert(!reference.includes(name));
 assert.match(nginxSettingInfo('ssl_certificate_cache','server').description,/1\.27\.4/);assert.match(nginxSettingInfo('ssl_ocsp','http').description,/1\.19\.0/);
 assert(nginxSettingMatches('ssl_stapling_file','/etc/nginx/ocsp-response.der','DER 파일',x=>x,'server'));
});
test('TLS controls preserve path and compound arguments and add code without reading keys',()=>{
 for(const name of ['ssl_stapling','ssl_stapling_verify','ssl_early_data','ssl_reject_handshake']){assert.equal(nginxDirectiveField(name,'on','server').type,'switch');assert.equal(nginxDirectiveField(name,'','server').type,'text');assert.equal(nginxDirectiveField(name,'on','map').type,'text');}
 assert.deepEqual(nginxDirectiveField('ssl_ocsp','leaf','http').options,['off','on','leaf']);assert.equal(nginxDirectiveField('ssl_ocsp','future','http').type,'text');assert.equal(validateNginxField(nginxDirectiveField('ssl_verify_depth','1','server'),'0'),'0');assert.throws(()=>validateNginxField(nginxDirectiveField('ssl_verify_depth','1','server'),'-1'));
 for(const name of ['ssl_certificate_cache','ssl_ocsp_cache','ssl_session_cache','ssl_session_ticket_key','ssl_password_file','ssl_protocols','ssl_conf_command'])assert.equal(nginxDirectiveField(name,'original value','server').type,'text');
 let source='http { server {} }';for(const [name,value] of [['ssl_session_cache','shared:TLS:10m'],['ssl_conf_command','Ciphersuites TLS_AES_256_GCM_SHA384']]){source=addNginxDirective(source,parseNginxTree(source)[0].children[0].id,name,value);assert(parseNginxTree(source)[0].children[0].children.some(row=>row.label===name+' '+value));}
});
