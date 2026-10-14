// Standalone embedded helper code; these bindings are provided by the root helper.
declare const createHash:typeof import('node:crypto').createHash;
declare const MARK:string;
declare function fail(message:string,status?:number):never;

export function hash(text:string|Buffer):string{
 return createHash('sha256').update(text).digest('hex');
}
export function domain(value:unknown):string{
 if(typeof value!=='string'||value.length>253||!value.includes('.')||!value.split('.').every(p=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(p)))fail('Invalid domain');
 return value.toLowerCase();
}
export function port(value:unknown):number{
 const n=Number(value);
 if(!(typeof value==='number'||(typeof value==='string'&&/^\d+$/.test(value)))||!Number.isInteger(n)||n<1||n>65535)fail('Invalid port');
 return n;
}
type SiteInput=Readonly<Record<string,unknown>>;
export function config(input:SiteInput):string{
 const name=domain(input.domain);let content:string;
 if(input.mode==='proxy')content=`        proxy_pass http://127.0.0.1:${port(input.upstreamPort)};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;`;
 else if(input.mode==='static'&&typeof input.root==='string'&&/^\/[a-zA-Z0-9_./-]+$/.test(input.root)&&!input.root.split('/').includes('..'))content=`        root ${input.root};\n        index index.html;\n        try_files $uri $uri/ =404;`;
 else fail('Invalid site mode/root');
 if(input.bodySize!==undefined){
  const size=typeof input.bodySize==='number'||(typeof input.bodySize==='string'&&/^\d+$/.test(input.bodySize))?Number(input.bodySize):NaN;
  if(!Number.isInteger(size)||size<0||size>65536)fail('Invalid upload limit');
  content+=`\n        client_max_body_size ${size}m;`;
 }
 for(const [key,directive] of [['connectTimeout','proxy_connect_timeout'],['readTimeout','proxy_read_timeout']] as const){
  const value=input[key];
  if(value!==undefined){
   const seconds=typeof value==='number'||(typeof value==='string'&&/^\d+$/.test(value))?Number(value):NaN;
   if(input.mode!=='proxy'||!Number.isInteger(seconds)||seconds<1||seconds>3600)fail('Invalid proxy timeout');
   content+=`\n        ${directive} ${seconds}s;`;
  }
 }
 return `${MARK}server {\n    listen ${port(input.port)};\n    server_name ${name};\n\n    location / {\n${content}\n    }\n}\n`;
}
export function updateConfig(input:SiteInput,previous:string|null):string{
 const next=config(input);
 if(previous===null){if(input.version)fail('Current config missing; reload the live site');return next;}
 if(input.version!==hash(previous))fail('Current config changed; load the live site before editing');
 const bodies=[...previous.matchAll(/^\s*location\s+\/\s*\{([\s\S]*?)^\s*\}/gm)];
 if(bodies.length===1)for(const line of bodies[0][1].split('\n')){
  const value=line.trim();if(!value||value.startsWith('#'))continue;
  if(!/^(?:proxy_pass http:\/\/127\.0\.0\.1:\d+;|proxy_set_header (?:Host \$host|X-Real-IP \$remote_addr|X-Forwarded-For \$proxy_add_x_forwarded_for|X-Forwarded-Proto \$scheme);|root \/[a-zA-Z0-9_./-]+;|index index\.html;|try_files \$uri \$uri\/ =404;|client_max_body_size \d+m;|proxy_(?:connect|read)_timeout \d+s;)$/.test(value))fail('Existing location contains settings the GUI cannot preserve');
 }
 if(!/^\s*(?:ssl_certificate\s|listen\s+[^;]*\bssl\b)/m.test(previous))return next;
 const listen=/^\s*listen (\d+)(?:\s|;)/m.exec(previous);
 if(!listen||port(input.port)!==Number(listen[1]))fail('HTTPS listen port must be preserved');
 const expression=/^\s*location\s+\/\s*\{[\s\S]*?^\s*\}/gm;
 const oldLocations=[...previous.matchAll(expression)],newLocations=[...next.matchAll(expression)];
 if(oldLocations.length!==1||newLocations.length!==1)fail('HTTPS location cannot be edited safely; inspect the existing configuration');
 const original=oldLocations[0][0];
 if(original.slice(original.indexOf('{')+1).includes('{'))fail('Nested locations require manual review');
 return previous.slice(0,oldLocations[0].index)+newLocations[0][0]+previous.slice(oldLocations[0].index+original.length);
}
