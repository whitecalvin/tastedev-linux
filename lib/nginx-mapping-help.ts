import type {NginxPreset} from './nginx-presets.ts';
import type {NginxSettingInfo} from './nginx-setting-info.ts';
// Entries inside these blocks are mapping rules, not top-level directive names.
const mapUrl='https://nginx.org/en/docs/http/ngx_http_map_module.html#map';
const geoUrl='https://nginx.org/en/docs/http/ngx_http_geo_module.html#geo';
const map: Record<string,string>={
 default:'어떤 매핑 규칙에도 일치하지 않을 때 사용할 결과 값입니다. 생략하면 빈 문자열을 사용합니다.',
 hostnames:'매핑 키에 호스트 이름의 접두·접미 와일드카드를 허용합니다. 매핑 규칙보다 앞에 인수 없이 작성합니다.',
 include:'원본 값과 결과 값의 매핑 규칙이 담긴 파일을 이 map 블록에 포함합니다.',
 volatile:'map 결과 변수를 캐시하지 않습니다. 인수 없이 작성하며 nginx 1.11.7 이상이 필요합니다.'
};
const geo: Record<string,string>={
 default:'어떤 주소 규칙에도 일치하지 않을 때 사용할 결과 값입니다. 생략하면 빈 문자열을 사용합니다.',
 include:'IP 주소 또는 주소 범위와 결과 값의 규칙이 담긴 파일을 이 geo 블록에 포함합니다.',
 delete:'앞에서 정의하거나 포함한 주소 규칙에서 지정한 네트워크를 제거합니다. 파일 삭제 명령이 아닙니다.',
 proxy:'X-Forwarded-For의 주소를 신뢰할 프록시 IP 또는 CIDR입니다. 요청이 신뢰 주소에서 왔을 때만 전달된 주소를 사용합니다.',
 proxy_recursive:'신뢰 프록시 요청에서 X-Forwarded-For의 마지막 신뢰하지 않는 주소를 찾습니다. 인수 없이 작성하며 없으면 전달된 마지막 주소를 사용합니다.',
 ranges:'CIDR 대신 시작 주소-끝 주소 범위로 규칙을 작성합니다. geo 블록의 첫 항목에 인수 없이 작성합니다.',
 volatile:'geo 결과 변수를 캐시하지 않습니다. 인수 없이 작성하며 nginx 1.29.3 이상이 필요합니다.'
};
export function nginxMappingSettingInfo(name: string,context?: string | null): NginxSettingInfo | null{
 if(context==='map')return {description:Object.hasOwn(map,name)?map[name]:'원본 값에 대응할 결과 값입니다. 문자열은 대소문자를 구분하지 않으며 ~는 정규식, ~*는 대소문자 무시 정규식입니다. 정규식은 파일 순서대로 검사합니다.',url:mapUrl};
 if(context==='geo')return {description:Object.hasOwn(geo,name)?geo[name]:'이 IP·CIDR 또는 주소 범위에 대응할 결과 값입니다. CIDR 규칙은 일치하는 가장 구체적인 네트워크를 사용하며 주소 범위는 ranges 설정이 필요합니다.',url:geoUrl};
 return null;
}
export function nginxMappingPresets(context: string): NginxPreset[]{
 const rows: [string,string,('directive' | 'block')?][]=context==='map'?[['default','fallback'],['hostnames',''],['volatile',''],['include','/etc/nginx/map-entries.conf']]:context==='geo'?[['default','unknown'],['include','/etc/nginx/geo-entries.conf'],['proxy','127.0.0.1'],['proxy_recursive',''],['ranges',''],['delete','192.0.2.0/24']]:context==='split_clients'?[['50%','A'],['*','B']]:context==='http'?[['map','$host $route','block'],['geo','$region','block'],['split_clients','$request_id $variant','block']]:[];
 return rows.map<NginxPreset>(([name,value,kind='directive'])=>({name,value,kind}));
}
