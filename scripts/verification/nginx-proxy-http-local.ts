import type {FixtureNginx,NginxHttpReport} from './nginx-http-report.ts';
import {requiredBlock,diagnostic} from './nginx-native-report.ts';
import {jsonRecord} from './http-json.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import type {Server,IncomingHttpHeaders,OutgoingHttpHeaders} from 'node:http';
import {createServer,request} from 'node:http';
import {createServer as createTlsServer} from 'node:https';
import {createServer as reserve} from 'node:net';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';

const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-proxy-http-');
const evidence=join(verificationWorkRoot,'nginx-proxy-http-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true});
const report:NginxHttpReport={workDirectory:fixture,status:'FAIL',scope:'GUI code-generation functions with own loopback HTTP/HTTPS upstreams',binary,operatingServicesChanged:false,checks:[]};
let nginx:FixtureNginx|undefined,closed:Promise<unknown[]>|undefined,logs='';const servers:Server[]=[],counts=new Map<string,number>();let badRequests=0,goodRequests=0;
const count=(path:string)=>{const value=(counts.get(path)||0)+1;counts.set(path,value);return value;};
async function listen(server:Server){servers.push(server);await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const address=server.address();assert(address&&typeof address==='object');return address.port;}
function query(port:number,path:string,headers:OutgoingHttpHeaders={},body?:string){return new Promise<{status:number|undefined;headers:IncomingHttpHeaders;text:string}>((resolve,reject)=>{
 const req=request({hostname:'127.0.0.1',port,path,headers,method:body===undefined?'GET':'POST',timeout:5000},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));res.on('error',reject);});
 req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Own fixture request timeout')));req.end(body);
});}
async function check(name:string,fn:()=>Promise<Record<string,unknown>>){const detail=await fn();report.checks.push({name,status:'PASS',...detail});}
try{
 report.version=(await exec(binary,['-V'])).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const backend=await listen(createServer(async(req,res)=>{
  const hit=count(req.url||'/');let body='';for await(const data of req)body+=data;
  if(req.url==='/echo'){res.setHeader('X-Powered-By','own-fixture');res.end(JSON.stringify({method:req.method,host:req.headers.host,marker:req.headers['x-fixture'],body}));}
  else if(req.url==='/cookie'){res.setHeader('Set-Cookie','session=fixture; Domain=upstream.invalid; Path=/old/');res.end('cookie');}
  else if(req.url==='/redirect'){res.writeHead(302,{Location:'http://upstream.invalid/old/home'});res.end();}
  else if(req.url==='/failure'){res.writeHead(502);res.end('upstream failure');}
  else{if(req.url?.startsWith('/locked'))await new Promise(resolve=>setTimeout(resolve,150));res.end('한글 cache '+hit);}
 }));
 const bad=await listen(createServer((req,res)=>{badRequests++;res.writeHead(502);res.end('first failed');}));
 const good=await listen(createServer((req,res)=>{goodRequests++;res.end('retry succeeded');}));
 const key=join(fixture,'key.pem'),cert=join(fixture,'cert.pem');
 await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=proxy.fixture.invalid','-addext','subjectAltName=DNS:proxy.fixture.invalid'],{timeout:15000});await chmod(key,0o600);
 const tls=await listen(createTlsServer({key:await readFile(key),cert:await readFile(cert)},(req,res)=>res.end('verified own TLS')));
 const reservation=reserve();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const address=reservation.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>reservation.close(error=>error?reject(error):resolve()));
 let source=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; client_body_temp_path ${fixture}/body; fastcgi_temp_path ${fixture}/fastcgi; uwsgi_temp_path ${fixture}/uwsgi; scgi_temp_path ${fixture}/scgi; upstream retry_fixture { server 127.0.0.1:${bad} max_fails=0; server 127.0.0.1:${good}; } server { listen 127.0.0.1:${port}; location = /health { return 200 ready; } location /echo {} location /cookie {} location /redirect {} location /cache {} location /locked {} location /retry {} location /failure {} location @handled { return 503 "한국어 오류 처리"; } location /tls-good {} location /tls-bad {} } }`;
 const http=()=>requiredBlock(parseNginxTree(source),'http');
 const location=(name:string)=>requiredBlock(requiredBlock(http().children,'server').children,'location '+name);
 const add=(name:string,directive:string,value:string)=>{source=addNginxDirective(source,location(name).id,directive,value);};
 source=addNginxDirective(source,http().id,'proxy_temp_path',fixture+'/temp');
 source=addNginxDirective(source,http().id,'proxy_cache_path',fixture+'/cache levels=1:2 keys_zone=fixture:1m inactive=1m');
 for(const name of ['/echo','/cookie','/redirect','/cache','/locked','/failure'])add(name,'proxy_pass','http://127.0.0.1:'+backend);
 add('/echo','proxy_http_version','1.1');add('/echo','proxy_set_header','Host service.fixture.invalid');add('/echo','proxy_set_header','X-Fixture korean-gui');add('/echo','proxy_hide_header','X-Powered-By');
 add('/cookie','proxy_cookie_domain','upstream.invalid client.fixture.invalid');add('/cookie','proxy_cookie_path','/old/ /new/');add('/cookie','proxy_cookie_flags','session secure httponly samesite=lax');
 add('/redirect','proxy_redirect','http://upstream.invalid/old/ /new/');
 for(const name of ['/cache','/locked']){add(name,'proxy_cache','fixture');add(name,'proxy_cache_key','$request_uri');add(name,'proxy_cache_valid','200 1m');add(name,'add_header','X-Fixture-Cache $upstream_cache_status always');}
 add('/cache','proxy_cache_bypass','$http_authorization');add('/cache','proxy_no_cache','$http_authorization');
 add('/locked','proxy_cache_lock','on');add('/locked','proxy_cache_lock_timeout','3s');
 add('/retry','proxy_pass','http://retry_fixture');add('/retry','proxy_next_upstream','error timeout http_502');add('/retry','proxy_next_upstream_tries','2');
 add('/failure','proxy_intercept_errors','on');add('/failure','error_page','502 = @handled');
 for(const name of ['/tls-good','/tls-bad']){add(name,'proxy_pass','https://127.0.0.1:'+tls);add(name,'proxy_ssl_verify','on');add(name,'proxy_ssl_trusted_certificate',cert);add(name,'proxy_ssl_server_name','on');add(name,'proxy_ssl_name',name==='/tls-good'?'proxy.fixture.invalid':'wrong.fixture.invalid');}
 const config=join(fixture,'nginx.conf');await writeFile(config,source,{mode:0o600});await writeFile(join(evidence,'generated-nginx.conf'),source);
 await check('generated configuration syntax',async()=>({output:(await exec(binary,['-t','-p',fixture+'/', '-c',config],{timeout:10000})).stderr}));
 nginx=spawn(binary,['-p',fixture+'/', '-c',config,'-g','daemon off; master_process off;'],{stdio:['ignore','pipe','pipe']});closed=once(nginx,'close');nginx.stdout.on('data',data=>logs+=data);nginx.stderr.on('data',data=>logs+=data);
 for(let attempt=0;;attempt++){assert(nginx.exitCode===null&&attempt<100,'Own nginx did not start');try{if((await query(port,'/health')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 await check('request body and explicit headers',async()=>{const r=await query(port,'/echo',{'Content-Type':'text/plain'},'한국어 본문');assert.equal(r.status,200);assert.deepEqual(JSON.parse(r.text),{method:'POST',host:'service.fixture.invalid',marker:'korean-gui',body:'한국어 본문'});assert.equal(r.headers['x-powered-by'],undefined);return{response:JSON.parse(r.text),hiddenHeaderAbsent:true};});
 await check('cookie domain path and flags',async()=>{const r=await query(port,'/cookie');assert.equal(r.status,200);const cookies=r.headers['set-cookie'];assert(cookies?.length);const value=cookies[0];for(const pattern of [/Domain=client\.fixture\.invalid/i,/Path=\/new\//i,/secure/i,/httponly/i,/samesite=lax/i])assert.match(value,pattern);return{cookie:value};});
 await check('redirect rewriting',async()=>{const r=await query(port,'/redirect');assert.equal(r.status,302);assert(typeof r.headers.location==='string');assert.match(r.headers.location,/\/new\/home$/);assert.doesNotMatch(r.headers.location,/upstream\.invalid/);return{location:r.headers.location};});
 await check('cache miss then hit',async()=>{const first=await query(port,'/cache?key=normal'),second=await query(port,'/cache?key=normal');assert.equal(first.headers['x-fixture-cache'],'MISS');assert.equal(second.headers['x-fixture-cache'],'HIT');assert.equal(second.text,first.text);assert.equal(counts.get('/cache?key=normal'),1);return{first:'MISS',second:'HIT',upstreamRequests:1};});
 await check('authorization bypass and no cache storage',async()=>{const key='/cache?key=private';const first=await query(port,key,{Authorization:'fixture-only'}),second=await query(port,key,{Authorization:'fixture-only'});assert.equal(first.headers['x-fixture-cache'],'BYPASS');assert.equal(second.headers['x-fixture-cache'],'BYPASS');assert.notEqual(first.text,second.text);const publicFirst=await query(port,key),publicSecond=await query(port,key);assert.equal(publicFirst.headers['x-fixture-cache'],'MISS');assert.equal(publicSecond.headers['x-fixture-cache'],'HIT');assert.equal(counts.get(key),3);return{privateResponses:'BYPASS',publicResponses:['MISS','HIT'],upstreamRequests:3};});
 await check('concurrent cache fill lock',async()=>{const key='/locked?key=shared';const results=await Promise.all(Array.from({length:4},()=>query(port,key)));assert(results.every(r=>r.status===200&&r.text===results[0].text));assert.equal(counts.get(key),1);return{requests:4,upstreamRequests:1,cacheStates:results.map(r=>r.headers['x-fixture-cache'])};});
 await check('retry failed upstream within tries bound',async()=>{const r=await query(port,'/retry');assert.equal(r.status,200);assert.equal(r.text,'retry succeeded');assert.equal(badRequests,1);assert.equal(goodRequests,1);return{badRequests,goodRequests};});
 await check('intercept upstream error',async()=>{const r=await query(port,'/failure');assert.equal(r.status,503);assert.equal(r.text,'한국어 오류 처리');return{status:r.status,text:r.text};});
 await check('TLS trust and name verification accepts matching upstream',async()=>{const r=await query(port,'/tls-good');assert.equal(r.status,200);assert.equal(r.text,'verified own TLS');return{status:r.status};});
 await check('TLS name verification rejects mismatch',async()=>{const r=await query(port,'/tls-bad');assert.equal(r.status,502);assert.notEqual(r.text,'verified own TLS');return{status:r.status};});
 assert.equal(report.checks.length,11);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{
 if(nginx?.exitCode===null){const ownedNginx=nginx;ownedNginx.kill('SIGTERM');const timer=setTimeout(()=>ownedNginx.kill('SIGKILL'),5000);await closed;clearTimeout(timer);}report.temporaryNginxStopped=true;
 await Promise.all(servers.map(server=>new Promise<void>((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();})));report.temporaryUpstreamsStopped=true;
 await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(evidence,'server.log'),logs);
 console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));
}
