import type {FixtureNginx,NginxHttpReport} from './nginx-http-report.ts';
import {requiredBlock,diagnostic} from './nginx-native-report.ts';
import {jsonRecord} from './http-json.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import type {RequestOptions} from 'node:https';
import {TLSSocket} from 'node:tls';
import {hasErrorCode} from '../../lib/error-code.ts';
import {request} from 'node:https';
import {createServer} from 'node:net';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-tls-http-');
const evidence=join(verificationWorkRoot,'nginx-tls-http-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NginxHttpReport={workDirectory:fixture,status:'FAIL',scope:'GUI generated TLS configuration with own CA and client/server certificates on loopback',binary,operatingServicesChanged:false,checks:[]};let nginx:FixtureNginx|undefined,closed:Promise<unknown[]>|undefined,logs='';
async function port(){const server=createServer();await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert(address&&typeof address==='object');const value=address.port;await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));return value;}
function query(port:number,options:RequestOptions&{session?:Buffer}){return new Promise<{status:number|undefined;text:string;protocol:string|null;reused:boolean;session:Buffer|undefined}>((resolve,reject)=>{
 const req=request({hostname:'127.0.0.1',port,path:'/',servername:'tls.fixture.invalid',agent:false,rejectUnauthorized:true,timeout:5000,...options},res=>{
  assert(res.socket instanceof TLSSocket);const protocol=res.socket.getProtocol(),reused=res.socket.isSessionReused(),session=res.socket.getSession();let text='';res.setEncoding('utf8');res.on('data',data=>text+=data);res.on('end',()=>resolve({status:res.statusCode,text,protocol,reused,session}));res.on('error',reject);
 });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Own TLS request timed out')));req.end();
});}
async function check(name:string,fn:()=>Promise<Record<string,unknown>>){report.checks.push({name,status:'PASS',...await fn()});}
try{
 report.version=(await exec(binary,['-V'])).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const caKey=join(fixture,'ca.key'),caCert=join(fixture,'ca.pem');await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',caKey,'-out',caCert,'-days','1','-subj','/CN=Own TLS fixture CA'],{timeout:15000});await chmod(caKey,0o600);
 async function certificate(name:string,extension:string){const key=join(fixture,name+'.key'),csr=join(fixture,name+'.csr'),cert=join(fixture,name+'.pem');await exec('/usr/bin/openssl',['req','-new','-newkey','rsa:2048','-nodes','-keyout',key,'-out',csr,'-subj','/CN='+name,'-addext',extension],{timeout:15000});await chmod(key,0o600);await exec('/usr/bin/openssl',['x509','-req','-in',csr,'-CA',caCert,'-CAkey',caKey,'-CAcreateserial','-out',cert,'-days','1','-copy_extensions','copy'],{timeout:15000});return{key,cert};}
 const server=await certificate('tls.fixture.invalid','subjectAltName=DNS:tls.fixture.invalid'),client=await certificate('Own client','extendedKeyUsage=clientAuth');
 const unknownKey=join(fixture,'unknown.key'),unknownCert=join(fixture,'unknown.pem');await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',unknownKey,'-out',unknownCert,'-days','1','-subj','/CN=Untrusted client'],{timeout:15000});await chmod(unknownKey,0o600);
 const ports={normal:await port(),tls13:await port(),client:await port(),reject:await port()};
 let source=`pid ${fixture}/nginx.pid; error_log stderr; events {} http {access_log off; client_body_temp_path ${fixture}/body; proxy_temp_path ${fixture}/proxy; fastcgi_temp_path ${fixture}/fastcgi; uwsgi_temp_path ${fixture}/uwsgi; scgi_temp_path ${fixture}/scgi;${Object.values(ports).map(value=>'server {listen 127.0.0.1:'+value+' ssl;location / {return 200 "한국어 TLS|$ssl_protocol|$ssl_client_verify";}}').join(' ')}}`;
 function group(port:number){const node=requiredBlock(parseNginxTree(source),'http').children.find(node=>node.kind==='block'&&node.children.some(child=>child.label==='listen 127.0.0.1:'+port+' ssl'));assert(node);return node;}
 const add=(port:number,name:string,value:string)=>source=addNginxDirective(source,group(port).id,name,value);
 for(const p of Object.values(ports)){add(p,'ssl_certificate',server.cert);add(p,'ssl_certificate_key',server.key);add(p,'ssl_protocols','TLSv1.2 TLSv1.3');}
 add(ports.normal,'ssl_session_cache','shared:fixture_tls:1m');add(ports.normal,'ssl_session_timeout','5m');add(ports.normal,'ssl_session_tickets','on');
 add(ports.tls13,'ssl_conf_command','MinProtocol TLSv1.3');
 add(ports.client,'ssl_client_certificate',caCert);add(ports.client,'ssl_verify_client','on');add(ports.client,'ssl_verify_depth','1');add(ports.reject,'ssl_reject_handshake','on');
 const config=join(fixture,'nginx.conf');await writeFile(config,source,{mode:0o600});await writeFile(join(evidence,'generated-nginx.conf'),source);
 await check('generated TLS configuration syntax',async()=>({output:(await exec(binary,['-t','-p',fixture+'/', '-c',config],{timeout:10000})).stderr}));
 const trust={ca:await readFile(caCert)};nginx=spawn(binary,['-p',fixture+'/', '-c',config,'-g','daemon off; master_process off;'],{stdio:['ignore','pipe','pipe']});closed=once(nginx,'close');nginx.stdout.on('data',data=>logs+=data);nginx.stderr.on('data',data=>logs+=data);
 for(let attempt=0;;attempt++){assert(nginx.exitCode===null&&attempt<100,'Own TLS nginx did not start');try{if((await query(ports.normal,trust)).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 await check('trusted TLS 1.2 connection and Korean response',async()=>{const r=await query(ports.normal,{...trust,minVersion:'TLSv1.2',maxVersion:'TLSv1.2'});assert.equal(r.status,200);assert.equal(r.protocol,'TLSv1.2');assert.match(r.text,/한국어 TLS/);return{status:r.status,protocol:r.protocol};});
 await check('TLS 1.3 connection with configured minimum',async()=>{const r=await query(ports.tls13,{...trust,minVersion:'TLSv1.3',maxVersion:'TLSv1.3'});assert.equal(r.status,200);assert.equal(r.protocol,'TLSv1.3');return{status:r.status,protocol:r.protocol};});
 await check('TLS 1.2 rejected by TLS 1.3 minimum',async()=>{await assert.rejects(query(ports.tls13,{...trust,minVersion:'TLSv1.2',maxVersion:'TLSv1.2'}),error=>error instanceof Error&&/alert protocol version/i.test(error.message));return{lowerProtocolRejected:true};});
 await check('wrong certificate name rejected by client verification',async()=>{await assert.rejects(query(ports.normal,{...trust,servername:'wrong.fixture.invalid'}),error=>hasErrorCode(error,'ERR_TLS_CERT_ALTNAME_INVALID'));return{certificateNameMismatchRejected:true};});
 const clientOptions={...trust,cert:await readFile(client.cert),key:await readFile(client.key)};
 await check('trusted client certificate accepted',async()=>{const r=await query(ports.client,clientOptions);assert.equal(r.status,200);assert.match(r.text,/\|SUCCESS$/);return{status:r.status,clientVerified:true};});
 await check('missing required client certificate rejected',async()=>{const r=await query(ports.client,trust);assert.equal(r.status,400);assert.doesNotMatch(r.text,/한국어 TLS/);return{status:r.status};});
 await check('untrusted client certificate rejected',async()=>{const r=await query(ports.client,{...trust,cert:await readFile(unknownCert),key:await readFile(unknownKey)});assert.equal(r.status,400);assert.doesNotMatch(r.text,/한국어 TLS/);return{status:r.status};});
 await check('explicit handshake rejection applied',async()=>{await assert.rejects(query(ports.reject,trust),error=>hasErrorCode(error,'EPROTO')&&error instanceof Error&&/unrecognized name/i.test(error.message));return{handshakeRejected:true};});
 await check('TLS 1.2 session resumption',async()=>{const options:RequestOptions={...trust,minVersion:'TLSv1.2',maxVersion:'TLSv1.2'},first=await query(ports.normal,options);assert(first.session&&first.session.length>0);const next=await query(ports.normal,{...options,session:first.session});assert.equal(next.status,200);assert.equal(next.reused,true);return{sessionReused:true};});
 assert.equal(report.checks.length,10);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{if(nginx?.exitCode===null){const ownedNginx=nginx;ownedNginx.kill('SIGTERM');const timer=setTimeout(()=>ownedNginx.kill('SIGKILL'),5000);await closed;clearTimeout(timer);}report.temporaryNginxStopped=true;await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(evidence,'server.log'),logs);console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));}
