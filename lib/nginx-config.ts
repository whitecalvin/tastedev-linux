export type NginxConfigInput = {domain?: unknown; port?: unknown; mode?: unknown; upstreamPort?: unknown; root?: unknown; bodySize?: unknown; connectTimeout?: unknown; readTimeout?: unknown; version?: unknown};
const error=(message: string,status=400)=>Object.assign(new Error(message),{status});
export function domainName(value: unknown): string{if(typeof value!=='string'||value.length>253||!value.includes('.')||!value.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part)))throw error('유효한 도메인 이름을 입력하세요.');return value.toLowerCase();}
export function nginxConfig(input: NginxConfigInput): string{
  const domain=domainName(input.domain);
  const port=(typeof input.port==='number'||(typeof input.port==='string'&&/^\d+$/.test(input.port)))?Number(input.port):NaN;if(!Number.isInteger(port)||port<1||port>65535)throw error('포트는 1~65535 범위입니다.');
  if(input.mode!=='proxy'&&input.mode!=='static')throw error('서비스 유형을 선택하세요.');
  let location;
  if(input.mode==='proxy') {const upstream=(typeof input.upstreamPort==='number'||(typeof input.upstreamPort==='string'&&/^\d+$/.test(input.upstreamPort)))?Number(input.upstreamPort):NaN;if(!Number.isInteger(upstream)||upstream<1||upstream>65535)throw error('앱 포트는 1~65535 범위입니다.');location=`        proxy_pass http://127.0.0.1:${upstream};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;`;}
  else{if(typeof input.root!=='string'||!/^\/[a-zA-Z0-9_./-]+$/.test(input.root)||input.root.split('/').includes('..'))throw error('웹 루트는 공백 없는 절대 경로로 입력하세요.');location=`        root ${input.root};\n        index index.html;\n        try_files $uri $uri/ =404;`;}
  if(input.bodySize!==undefined){const size=(typeof input.bodySize==='number'||typeof input.bodySize==='string'&&/^\d+$/.test(input.bodySize))?Number(input.bodySize):NaN;if(!Number.isInteger(size)||size<0||size>65536)throw error('업로드 제한은 0~65536 MB 범위입니다.');location+=`\n        client_max_body_size ${size}m;`;}
for(const [key,directive] of [['connectTimeout','proxy_connect_timeout'],['readTimeout','proxy_read_timeout']] as const){if(input[key]!==undefined){const seconds=(typeof input[key]==='number'||typeof input[key]==='string'&&/^\d+$/.test(input[key]))?Number(input[key]):NaN;if(input.mode!=='proxy'||!Number.isInteger(seconds)||seconds<1||seconds>3600)throw error('프록시 제한 시간은 1~3600초 범위입니다.');location+=`\n        ${directive} ${seconds}s;`;}}
  return `# Managed by LINUX\nserver {\n    listen ${port};\n    server_name ${domain};\n\n    location / {\n${location}\n    }\n}\n`;
}
