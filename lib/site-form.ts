import type {NginxConfigInput} from './nginx-config.ts';
export type ManagedSiteForm = {domain: string; port: number; mode: 'proxy' | 'static'; upstreamPort: number; root: string; https: boolean; bodySize?: number; connectTimeout?: number; readTimeout?: number};
export function managedSiteForm(config: string,domain: string): ManagedSiteForm | null{
 const locations=[...config.matchAll(/^\s*location\s+\/\s*\{([\s\S]*?)^\s*\}/gm)];
 if(locations.length!==1||locations[0][1].includes('{'))return null;
 const body=locations[0][1],proxy=/^\s*proxy_pass http:\/\/127\.0\.0\.1:(\d+);/m.exec(body),root=/^\s*root (\/[a-zA-Z0-9_./-]+);/m.exec(body),listen=/^\s*listen (\d+)(?:\s|;)/m.exec(config);
 if(!listen||Boolean(proxy)===Boolean(root))return null;
 const upload=/^\s*client_max_body_size (\d+)m;/m.exec(body);
 const timeouts: Pick<ManagedSiteForm,'connectTimeout'|'readTimeout'>={};for(const [key,directive] of [['connectTimeout','proxy_connect_timeout'],['readTimeout','proxy_read_timeout']] as const){const match=new RegExp('^\\s*'+directive+' (\\d+)s;','m').exec(body);if(match)timeouts[key]=Number(match[1]);}
 return {...timeouts,...(upload?{bodySize:Number(upload[1])}:{}),domain,port:Number(listen[1]),mode:proxy?'proxy':'static',upstreamPort:proxy?Number(proxy[1]):3000,root:root?.[1]||'/var/www/html',https:/^\s*(?:ssl_certificate\s|listen\s+[^;]*\bssl\b)/m.test(config)};
}
export function mergeHttpsLocation(next: string,previous: string,input: NginxConfigInput){
 const form=managedSiteForm(previous,typeof input.domain==='string'?input.domain:'');
 if(!form?.https||Number(input.port)!==form.port)throw Object.assign(new Error('HTTPS 수신 포트와 기존 설정 구조는 보존해야 합니다.'),{status:409});
 const expression=/^\s*location\s+\/\s*\{[\s\S]*?^\s*\}/gm,old=[...previous.matchAll(expression)],replacement=[...next.matchAll(expression)];
 if(old.length!==1||replacement.length!==1||old[0][0].slice(old[0][0].indexOf('{')+1).includes('{'))throw Object.assign(new Error('기존 HTTPS location을 GUI로 안전하게 편집할 수 없습니다.'),{status:409});
 return previous.slice(0,old[0].index)+replacement[0][0]+previous.slice(old[0].index+old[0][0].length);
}
