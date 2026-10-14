import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
const descriptions: Record<string,string>={
  "stream": "TCP·UDP 연결을 처리하는 공통 설정 블록입니다. 인수 없이 최상위에 작성하며 stream 모듈이 필요합니다.",
  "mail": "POP3·IMAP·SMTP 프록시 공통 설정 블록입니다. 인수 없이 최상위에 작성하며 mail 모듈이 필요합니다.",
  "if": "조건이 참일 때 내부 rewrite 설정을 처리합니다. 괄호 안에 변수·문자열 비교 또는 파일 검사 조건을 지정합니다.",
  "stream-server": "TCP·UDP 연결을 받을 서버입니다. stream 안에 인수 없이 작성하고 listen으로 수신 주소와 포트를 지정합니다.",
  "mail-server": "메일 연결을 받을 서버입니다. mail 안에 인수 없이 작성하고 listen과 protocol로 수신 포트와 메일 프로토콜을 지정합니다.",
  "stream-listen": "TCP·UDP 연결을 받을 주소와 포트입니다. udp를 지정하면 UDP 소켓을 사용합니다.",
  "stream-proxy_pass": "TCP·UDP 연결을 전달할 백엔드 주소·포트, Unix 소켓 또는 upstream 그룹입니다. HTTP URL을 사용하지 않습니다.",
  "stream-proxy_timeout": "클라이언트 또는 백엔드와 연속해서 읽거나 쓰는 사이의 제한 시간입니다.",
  "mail-listen": "메일 연결을 받을 주소와 포트입니다. ssl을 지정하면 해당 포트에서 TLS 연결을 받습니다.",
  "mail-protocol": "이 서버가 프록시할 메일 프로토콜입니다. imap·pop3·smtp 중에서 지정합니다.",
  "mail-server_name": "메일 서버 인사말과 인증 등에 사용할 서버 이름입니다. HTTP 호스트 라우팅 설정이 아닙니다.",
  "mail-resolver": "인증 서버에 전달할 클라이언트 호스트 이름을 조회하는 DNS 서버입니다. off는 조회를 끕니다.",
  "mail-timeout": "백엔드로 프록시를 시작하기 전 메일 연결 처리에 허용하는 시간입니다.",
  "mail-max_errors": "연결을 닫기 전 허용하는 메일 프로토콜 오류 수입니다."
};

const streamUpstream: Record<string,string>={
 upstream:'TCP·UDP 백엔드 서버 그룹입니다. stream 안에 이름을 지정하고 proxy_pass에서 참조합니다.',
 server:'백엔드 주소와 포트 또는 Unix 소켓입니다. weight·max_conns·max_fails·fail_timeout·backup·down 등의 서버 인수를 지정할 수 있습니다.',
 zone:'이 그룹의 설정과 실행 상태를 worker 사이에 공유할 메모리 영역의 이름과 크기입니다.',
 hash:'지정한 키의 해시로 백엔드를 선택합니다. consistent를 붙이면 서버 구성 변경 시 키 재배치를 줄입니다.',
 least_conn:'가중치를 고려하여 활성 연결이 가장 적은 백엔드로 연결을 전달합니다.',
 random:'가중치를 고려하여 무작위 백엔드를 선택합니다. two는 후보 두 개를 뽑아 지정한 방식으로 비교합니다.',
 resolver:'백엔드 이름 확인에 사용할 DNS 서버입니다. stream upstream 범위에서는 nginx 1.27.3 이상이 필요합니다.',
 resolver_timeout:'백엔드 DNS 이름 확인을 기다릴 시간입니다. stream upstream 범위에서는 nginx 1.27.3 이상이 필요합니다.'
};
const streamUpstreamUrl='https://nginx.org/en/docs/stream/ngx_stream_upstream_module.html';
const stream='https://nginx.org/en/docs/stream/ngx_stream_core_module.html';
const mail='https://nginx.org/en/docs/mail/ngx_mail_core_module.html';
export function nginxProtocolBlockInfo(name: string,context?: string | null): NginxSettingInfo | null{
 if(name==='upstream'&&context==='stream:upstream')return {description:streamUpstream.upstream,url:streamUpstreamUrl+'#upstream'};
 const key=name==='server'&&context?.includes(':')?context.split(':')[0]+'-server':name;
 if(!Object.hasOwn(descriptions,key)||!['stream','mail','if','stream-server','mail-server'].includes(key))return null;
 return {description:descriptions[key],url:(key.startsWith('stream')?stream:key.startsWith('mail')?mail:'https://nginx.org/en/docs/http/ngx_http_rewrite_module.html')+'#'+name};
}
export function nginxProtocolSettingInfo(name: string,context?: string | null): NginxSettingInfo | null{
 if(context==='stream:upstream'&&Object.hasOwn(streamUpstream,name))return {description:streamUpstream[name],url:streamUpstreamUrl+'#'+name};
 const family=context?.split(':')[0],key=family+'-'+name;
 if(!['stream','mail'].includes(family||'')||!Object.hasOwn(descriptions,key))return null;
 const url=family==='mail'?mail:name.startsWith('proxy_')?'https://nginx.org/en/docs/stream/ngx_stream_proxy_module.html':stream;
 return {description:descriptions[key],url:url+'#'+name};
}
export function nginxProtocolPresets(context: string): NginxPreset[]{
 if(context==='stream:stream')return [{name:'server',value:'',kind:'block'},{name:'upstream',value:'backend',kind:'block'}];
 if(context==='stream:upstream')return [['server','127.0.0.1:12346'],['zone','backend 64k'],['hash','$remote_addr consistent'],['least_conn',''],['random','two least_conn']].map<NginxPreset>(([name,value])=>({name,value,kind:'directive'}));
 if(context==='mail:mail')return [{name:'server',value:'',kind:'block'}];
 const rows=context==='stream:server'?[['listen','12345'],['proxy_pass','127.0.0.1:12346'],['proxy_timeout','10m']]:context==='mail:server'?[['listen','143'],['protocol','imap'],['server_name','mail.example.com'],['timeout','60s'],['max_errors','5'],['resolver','off']]:[];
 return rows.map<NginxPreset>(([name,value])=>({name,value,kind:'directive'}));
}
