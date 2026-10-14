import type {NginxHelpNode} from './nginx-setting-info.ts';
export type NginxPreset = {name: string; value: string; kind: 'directive' | 'block'};
type PresetTuple = [string,string,('directive' | 'block')?];
import {nginxProxyPresets} from './nginx-proxy-settings.ts';
import {nginxUpstreamPresets} from './nginx-upstream-settings.ts';
import {nginxTlsPresets} from './nginx-tls-settings.ts';
import {nginxProtocolPresets} from './nginx-protocol-help.ts';
import {nginxModulePresets} from './nginx-module-settings.ts';
import {nginxMainPresets} from './nginx-main-settings.ts';
import {nginxHttpCorePresets} from './nginx-http-core-settings.ts';
import {nginxMappingPresets} from './nginx-mapping-help.ts';
// Common draft entries; values remain editable and require native validation.
const additional: Record<string,PresetTuple[]>={main:[['user','www-data'],['pid','/run/nginx.pid'],['error_log','/var/log/nginx/error.log warn'],['include','/etc/nginx/modules-enabled/*.conf']],events:[['multi_accept','off'],['accept_mutex','off']],http:[['include','/etc/nginx/mime.types'],['default_type','application/octet-stream'],['access_log','/var/log/nginx/access.log'],['gzip','on'],['gzip_types','text/plain application/json'],['ssl_protocols','TLSv1.2 TLSv1.3'],['ssl_session_cache','none'],['ssl_session_timeout','5m'],['ssl_prefer_server_ciphers','off']],server:[['index','index.html'],['access_log','/var/log/nginx/access.log'],['error_log','/var/log/nginx/error.log'],['ssl_certificate','/etc/letsencrypt/live/example.com/fullchain.pem'],['ssl_certificate_key','/etc/letsencrypt/live/example.com/privkey.pem'],['return','301 https://$host$request_uri']],location:[['proxy_pass','http://127.0.0.1:3000'],['proxy_set_header','Host $host'],['proxy_connect_timeout','60s'],['proxy_read_timeout','60s'],['proxy_buffering','on'],['proxy_request_buffering','on'],['proxy_send_timeout','60s'],['proxy_http_version','1.1'],['proxy_redirect','default'],['proxy_ssl_server_name','off'],['proxy_ssl_verify','off'],['add_header','X-Content-Type-Options nosniff'],['expires','1h']],upstream:[['server','127.0.0.1:3000'],['keepalive','32']]};
const shared: PresetTuple[]=[['absolute_redirect','on'],['client_body_buffer_size','16k'],['client_body_timeout','60s'],['send_timeout','60s'],['tcp_nodelay','on'],['tcp_nopush','off'],['etag','on'],['limit_rate','0'],['limit_rate_after','0'],['log_not_found','on'],['error_page','404 /404.html'],['resolver_timeout','30s'],['keepalive_requests','1000'],['keepalive_time','1h'],['sendfile','on'],['server_tokens','off'],['client_max_body_size','1m'],['keepalive_timeout','65s']];
const entries: Record<string,PresetTuple[]>={main:[['events','','block'],['http','','block'],['worker_processes','auto']],events:[['worker_connections','1024']],http:[['server','','block'],...shared],server:[['listen','80'],['server_name','example.com'],['location','/','block'],['root','/var/www/html'],...shared],location:[['root','/var/www/html'],['try_files','$uri $uri/ =404'],...shared]};
// Context restrictions follow the nginx HTTP core reference.
const coreSettings: [string,string,string[]][]=[
 ['root','/var/www/html',['http','server','location']],
 ['alias','/var/www/assets/',['location']],
 ['client_header_buffer_size','1k',['http','server']],
 ['client_header_timeout','60s',['http','server']],
 ['large_client_header_buffers','4 8k',['http','server']],
 ['underscores_in_headers','off',['http','server']],
 ['client_body_in_file_only','off',['http','server','location']],
 ['client_body_in_single_buffer','off',['http','server','location']],
 ['chunked_transfer_encoding','on',['http','server','location']],
 ['variables_hash_bucket_size','64',['http']],
 ['variables_hash_max_size','1024',['http']],
 ['types_hash_bucket_size','64',['http','server','location']],
 ['types_hash_max_size','1024',['http','server','location']]
];
function presetEntry(item: unknown): item is NginxPreset {return item!==null&&typeof item==='object'&&'name' in item&&typeof item.name==='string'&&'value' in item&&typeof item.value==='string'&&'kind' in item&&(item.kind==='directive'||item.kind==='block');}
export function nginxPresets(node?: NginxHelpNode | null,file?: {name?: string} | null,selectionContext?: string | null): NginxPreset[]{
 if(selectionContext?.includes(':'))return nginxProtocolPresets(selectionContext).filter(presetEntry);
 const context=selectionContext|| (node?.kind==='block'?node.label.split(/\s/)[0]:!node?(file?.name?.split('/').at(-1)==='nginx.conf'?'main':null):null)||'';
 const items: NginxPreset[]=[...(Object.hasOwn(entries,context)?entries[context]:[]),...(Object.hasOwn(additional,context)?additional[context]:[]),...coreSettings.filter(([, ,contexts])=>contexts.includes(context)).map<PresetTuple>(([name,value])=>[name,value])].map<NginxPreset>(([name,value,kind='directive'])=>({name,value,kind}));
 if(context==='events')items.push(...[['accept_mutex_delay','500ms'],['debug_connection','127.0.0.1'],['use','epoll'],['worker_aio_requests','32']].map<NginxPreset>(([name,value])=>({name,value,kind:'directive'})));
 if(context==='http')items.push({name:'upstream',value:'backend',kind:'block'});
 if(['http','server','location'].includes(context))items.push({name:'types',value:'',kind:'block'});
 if(context==='location')items.push({name:'limit_except',value:'GET',kind:'block'});
 if(context==='types')items.push({name:'include',value:'/etc/nginx/mime-entries.conf',kind:'directive'});
 return [...new Map([...items,...nginxModulePresets(context),...nginxMainPresets(context),...nginxHttpCorePresets(context),...nginxMappingPresets(context),...nginxProxyPresets(context),...nginxUpstreamPresets(context),...nginxTlsPresets(context)].filter(presetEntry).map(item=>[item.kind+':'+item.name,item])).values()];
}
