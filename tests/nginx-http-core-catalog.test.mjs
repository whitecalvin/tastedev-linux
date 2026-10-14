import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {nginxSettingInfo,nginxBlockInfo} from '../lib/nginx-setting-info.ts';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
// Reference inventory excludes directives newer than the installed 1.28 series.
const names=`absolute_redirect aio aio_write alias auth_delay chunked_transfer_encoding client_body_buffer_size client_body_in_file_only client_body_in_single_buffer client_body_temp_path client_body_timeout client_header_buffer_size client_header_timeout client_max_body_size connection_pool_size default_type directio directio_alignment disable_symlinks error_page etag http if_modified_since ignore_invalid_headers internal keepalive_disable keepalive_min_timeout keepalive_requests keepalive_time keepalive_timeout large_client_header_buffers limit_except limit_rate limit_rate_after lingering_close lingering_time lingering_timeout listen location log_not_found log_subrequest max_ranges merge_slashes msie_padding msie_refresh open_file_cache open_file_cache_errors open_file_cache_min_uses open_file_cache_valid output_buffers port_in_redirect postpone_output read_ahead recursive_error_pages request_pool_size reset_timedout_connection resolver resolver_timeout root satisfy send_lowat send_timeout sendfile sendfile_max_chunk server server_name server_name_in_redirect server_names_hash_bucket_size server_names_hash_max_size server_tokens subrequest_output_buffer_size tcp_nodelay tcp_nopush try_files types types_hash_bucket_size types_hash_max_size underscores_in_headers variables_hash_bucket_size variables_hash_max_size`.split(' ');
test('HTTP core reference inventory is represented in GUI with Korean directive or block explanations',()=>{
 const list=['main','http','server','location'].flatMap(context=>nginxPresets(null,{name:'nginx.conf'},context).map(item=>({...item,context})));
 for(const name of names){const item=list.find(item=>item.name===name);assert(item,'Missing core GUI item: '+name);const info=item.kind==='block'?nginxBlockInfo(name,item.context):nginxSettingInfo(name,item.context);assert.notEqual(info.unknown,true,name);assert.match(info.description,/[가-힣]/,name);assert.equal(info.url,'https://nginx.org/en/docs/http/ngx_http_core_module.html#'+name);}
 assert.equal(new Set(names).size,names.length);
});
test('AIO typed choices keep named pools editable, while MIME and DNS values stay raw',()=>{
 const aio=nginxDirectiveField('aio','off','http');assert.equal(aio.type,'select');assert.equal(validateNginxField(aio,'threads'),'threads');assert.throws(()=>validateNginxField(aio,'always'));
 assert.equal(nginxDirectiveField('aio','threads=default','location').type,'text');assert.equal(nginxDirectiveField('aio','on','map').type,'text');assert.equal(nginxDirectiveField('aio_write','on','server').type,'switch');
 for(const [name,value] of [['default_type','application/json'],['resolver','127.0.0.1 valid=30s ipv6=off'],['try_files','$uri @fallback']])assert.equal(nginxDirectiveField(name,value,'server').type,'text');
 for(const context of ['http','server','location'])assert(nginxPresets(null,null,context).some(item=>item.name==='types'&&item.kind==='block'));
 assert(nginxPresets(null,null,'location').some(item=>item.name==='limit_except'&&item.value==='GET'&&item.kind==='block'));
 for(const context of ['http','server','upstream'])assert(!nginxPresets(null,null,context).some(item=>item.name==='limit_except'));
 assert(!nginxPresets(null,null,'http').some(item=>item.name==='try_files'));
});
test('types and method restriction blocks generate reparsable code in their selected parent',()=>{
 let source='events {}\nhttp { server { location / {} } }';
 const http=()=>parseNginxTree(source)[1],location=()=>http().children.find(node=>node.label==='server').children.find(node=>node.label==='location /');
 source=addNginxDirective(source,http().id,'types','','block');
 const types=http().children.find(node=>node.label==='types');source=addNginxDirective(source,types.id,'application/json','json');
 source=addNginxDirective(source,location().id,'limit_except','GET','block');
 assert.equal(http().children.find(node=>node.label==='types').children[0].label,'application/json json');
 assert.equal(location().children[0].label,'limit_except GET');
});
