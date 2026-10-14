export type NginxDirectiveField = {type: 'flag'; min?: never; max?: never} | {type: 'switch'} | {type: 'select'; options: string[]} | {type: 'text'; min?: never; max?: never} | {type: 'number'; min: number; max: number};
const booleans=new Set(['underscores_in_headers','client_body_in_single_buffer','chunked_transfer_encoding','absolute_redirect','etag','log_not_found','multi_accept','accept_mutex','sendfile','tcp_nopush','tcp_nodelay','gzip','gzip_vary','ssl_prefer_server_ciphers','proxy_buffering','proxy_request_buffering','proxy_ssl_server_name','proxy_ssl_verify']);
export function nginxDirectiveField(name: string,value: string,context = ''): NginxDirectiveField{
 if(value===''&&(context==='map'&&['hostnames','volatile'].includes(name)||context==='geo'&&['ranges','proxy_recursive'].includes(name)))return {type:'flag'};
 // A mapping key or MIME type can coincide with a directive name.
 if(['map','geo','types','split_clients'].includes(context))return {type:'text'};
 if(['ssl_stapling','ssl_stapling_verify','ssl_early_data','ssl_reject_handshake'].includes(name)&&['on','off'].includes(value))return {type:'switch'};
 if(name==='ssl_ocsp'&&['off','on','leaf'].includes(value))return {type:'select',options:['off','on','leaf']};
 if(name==='ssl_verify_depth')return {type:'number',min:0,max:2147483647};
 if(context==='upstream'&&['ip_hash','least_conn'].includes(name)&&value==='')return {type:'flag'};
 if(context==='upstream'&&name==='keepalive'&&/^\d+$/.test(value))return {type:'number',min:1,max:2147483647};
 if(['proxy_cache_background_update','proxy_cache_convert_head','proxy_cache_lock','proxy_cache_revalidate','proxy_force_ranges','proxy_ignore_client_abort','proxy_pass_trailers','proxy_socket_keepalive','proxy_ssl_session_reuse'].includes(name)&&['on','off'].includes(value))return {type:'switch'};
 if(['proxy_cache_min_uses','proxy_ssl_verify_depth'].includes(name))return {type:'number',min:0,max:2147483647};
 if(name==='proxy_next_upstream_tries')return {type:'number',min:0,max:2147483647};
 if(name==='proxy_http_version'&&['1.0','1.1'].includes(value))return {type:'select',options:['1.0','1.1']};
 if(name==='aio'&&['off','on','threads'].includes(value))return {type:'select',options:['off','on','threads']};
 if(name==='aio_write'&&['on','off'].includes(value))return {type:'switch'};
 if(['log_subrequest','merge_slashes','msie_padding','msie_refresh','open_file_cache_errors','port_in_redirect','recursive_error_pages','reset_timedout_connection','server_name_in_redirect'].includes(name)&&['on','off'].includes(value))return {type:'switch'};
 if(name==='lingering_close'&&['on','off','always'].includes(value))return {type:'select',options:['on','off','always']};
 if(name==='satisfy'&&['all','any'].includes(value))return {type:'select',options:['all','any']};
 if(name==='max_ranges')return {type:'number',min:0,max:2147483647};
 if(name==='open_file_cache_min_uses')return {type:'number',min:0,max:2147483647};
 if(name==='internal'&&context==='location'&&value==='')return {type:'flag'};
 if(name==='ignore_invalid_headers'&&['on','off'].includes(value))return {type:'switch'};
 if(name==='if_modified_since'&&['off','exact','before'].includes(value))return {type:'select',options:['off','exact','before']};
 if(['daemon','master_process','pcre_jit','ssl_object_cache_inheritable'].includes(name)&&['on','off'].includes(value))return {type:'switch'};
 if(name==='debug_points'&&['abort','stop'].includes(value))return {type:'select',options:['abort','stop']};
 // Directives with special off/path forms retain text input.
 if(booleans.has(name)&&['on','off'].includes(value))return {type:'switch'};
 if(['proxy_intercept_errors','proxy_pass_request_headers','proxy_pass_request_body','ssl_session_tickets'].includes(name)&&['on','off'].includes(value))return {type:'switch'};
 if(name==='ssl_verify_client'&&['on','off','optional','optional_no_ca'].includes(value))return {type:'select',options:['on','off','optional','optional_no_ca']};
 if(name==='client_body_in_file_only')return {type:'select',options:['off','on','clean']};
 if(name==='server_tokens')return {type:'select',options:['on','off','build']};
 if(name==='worker_connections')return {type:'number',min:1,max:1048576};
 if(name==='worker_aio_requests')return {type:'number',min:0,max:2147483647};
 if(name==='gzip_comp_level')return {type:'number',min:1,max:9};
 if(name==='keepalive_requests')return {type:'number',min:1,max:2147483647};
 if(name==='gzip_http_version'&&['1.0','1.1'].includes(value))return {type:'select',options:['1.0','1.1']};
 return {type:'text'};
}

export function validateNginxField(control: NginxDirectiveField,value: unknown): string{
 if(typeof value!=='string')throw new Error('설정 값을 확인하세요.');
 if(control.type==='flag'&&value!=='')throw new Error('이 설정은 인수 없이 작성합니다.');
 if(control.type==='number'&&(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<control.min||Number(value)>control.max))throw new Error('숫자 설정 값의 허용 범위를 확인하세요.');
 if(control.type==='switch'&&!['on','off'].includes(value)||control.type==='select'&&!control.options.includes(value))throw new Error('설정 값을 확인하세요.');
 return value;
}
