import type {FixtureNginx,NginxHttpReport} from './nginx-http-report.ts';
import {requiredBlock,diagnostic} from './nginx-native-report.ts';
import {jsonRecord} from './http-json.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import type {Server,IncomingHttpHeaders,OutgoingHttpHeaders} from 'node:http';
import {createServer,request} from 'node:http';
import {createServer as reserve} from 'node:net';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-upstream-http-');
const evidence=join(verificationWorkRoot,'nginx-upstream-http-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NginxHttpReport={workDirectory:fixture,status:'FAIL',scope:'GUI generated upstream balancing and actual keepalive connections on own loopback servers',binary,operatingServicesChanged:false,checks:[]};
const servers:Server[]=[],socketIds=new WeakMap<import('node:net').Socket,number>();let sequence=0,nginx:FixtureNginx|undefined,closed:Promise<unknown[]>|undefined,logs='',releaseHeld:(()=>void)|undefined,heldStarted:(label:string)=>void=()=>{throw Error('Held signal not initialized');};const held=new Promise<string>(resolve=>heldStarted=resolve);
async function listen(server:Server){servers.push(server);await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const address=server.address();assert(address&&typeof address==='object');return address.port;}
function query(port:number,path:string){return new Promise<{status:number|undefined;text:string}>((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path,timeout:5000},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({status:res.statusCode,text}));res.on('error',reject);});req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Own fixture request timed out')));req.end();});}
async function check(name:string,fn:()=>Promise<Record<string,unknown>>){report.checks.push({name,status:'PASS',...await fn()});}
try{
 report.version=(await exec(binary,['-V'])).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 async function backend(label:string){return listen(createServer(async(req,res)=>{
  if(!socketIds.has(req.socket))socketIds.set(req.socket,++sequence);
  if(req.url==='/least?held=1'){heldStarted(label);await new Promise<void>(resolve=>releaseHeld=resolve);}
  res.end(JSON.stringify({server:label,connection:socketIds.get(req.socket)}));
 }));}
 const a=await backend('A'),b=await backend('B');
 const reservation=reserve();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const address=reservation.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>reservation.close(error=>error?reject(error):resolve()));
 const groups=['reuse','weighted','hashed','ip','least','random','down','backup'];
 let source=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; proxy_temp_path ${fixture}/proxy; client_body_temp_path ${fixture}/body; fastcgi_temp_path ${fixture}/fastcgi; uwsgi_temp_path ${fixture}/uwsgi; scgi_temp_path ${fixture}/scgi; ${groups.map(name=>'upstream '+name+' {}').join(' ')} server { listen 127.0.0.1:${port}; location = /health { return 200 ready; } ${groups.map(name=>'location /'+name+' {}').join(' ')} } }`;
 const http=()=>requiredBlock(parseNginxTree(source),'http');const group=(name:string)=>requiredBlock(http().children,'upstream '+name);const location=(name:string)=>requiredBlock(requiredBlock(http().children,'server').children,'location /'+name);
 const add=(name:string,key:string,value:string)=>source=addNginxDirective(source,group(name).id,key,value);
 for(const name of groups){
  add(name,'server','127.0.0.1:'+a+(name==='weighted'?' weight=2':name==='down'||name==='backup'?' down':''));
  add(name,'server','127.0.0.1:'+b+(name==='backup'?' backup':''));
  for(const [key,value] of [['proxy_pass','http://'+name],['proxy_http_version','1.1'],['proxy_set_header','Connection ""']])source=addNginxDirective(source,location(name).id,key,value);
 }
 add('reuse','keepalive','4');add('reuse','keepalive_requests','100');add('reuse','keepalive_timeout','60s');
 add('hashed','hash','$request_uri consistent');add('ip','ip_hash','');add('least','least_conn','');add('random','random','two least_conn');
 const config=join(fixture,'nginx.conf');await writeFile(config,source,{mode:0o600});await writeFile(join(evidence,'generated-nginx.conf'),source);
 await check('generated upstream configuration syntax',async()=>({output:(await exec(binary,['-t','-p',fixture+'/', '-c',config],{timeout:10000})).stderr}));
 nginx=spawn(binary,['-p',fixture+'/', '-c',config,'-g','daemon off; master_process off;'],{stdio:['ignore','pipe','pipe']});closed=once(nginx,'close');nginx.stdout.on('data',data=>logs+=data);nginx.stderr.on('data',data=>logs+=data);
 for(let attempt=0;;attempt++){assert(nginx.exitCode===null&&attempt<100,'Own nginx did not start');try{if((await query(port,'/health')).status===200)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 async function response(path:string){const r=await query(port,path);assert.equal(r.status,200);const row=jsonRecord(JSON.parse(r.text));assert(typeof row.server==='string'&&typeof row.connection==='number');return {server:row.server,connection:row.connection};}
 async function repeated(path:string,count:number){const values=[];for(let index=0;index<count;index++)values.push(await response(path));return values;}
 await check('idle upstream connections reused',async()=>{const values=await repeated('/reuse',8);for(const name of ['A','B']){const matched=values.filter(row=>row.server===name);assert.equal(matched.length,4);assert.equal(new Set(matched.map(row=>row.connection)).size,1);}return{responses:values,upstreamConnections:2};});
 await check('weighted round robin 2 to 1',async()=>{const values=await repeated('/weighted',6);assert.equal(values.filter(row=>row.server==='A').length,4);assert.equal(values.filter(row=>row.server==='B').length,2);return{serverA:4,serverB:2};});
 await check('consistent hash keeps identical key on one server',async()=>{const values=await repeated('/hashed?key='+encodeURIComponent('한글'),6);assert.equal(new Set(values.map(row=>row.server)).size,1);return{selected:values[0].server,requests:6};});
 await check('IP hash keeps same client on one server',async()=>{const values=await repeated('/ip',6);assert.equal(new Set(values.map(row=>row.server)).size,1);return{selected:values[0].server,requests:6};});
 await check('least connections selects idle peer while first request held',async()=>{const first=response('/least?held=1');const selected=await Promise.race([held,new Promise<never>((resolve,reject)=>setTimeout(()=>reject(Error('Held request not reached')),3000))]);try{const next=await response('/least?next=1');assert.notEqual(next.server,selected);return{held:selected,next:next.server};}finally{releaseHeld?.();await first;}});
 await check('random two yields valid upstream replies',async()=>{const values=await repeated('/random',8);assert(values.every(row=>['A','B'].includes(row.server)));return{selected:values.map(row=>row.server)};});
 await check('down peer excluded',async()=>{const values=await repeated('/down',4);assert(values.every(row=>row.server==='B'));return{selected:'B',requests:4};});
 await check('backup used when primary is down',async()=>{const values=await repeated('/backup',4);assert(values.every(row=>row.server==='B'));return{selected:'B',requests:4};});
 assert.equal(report.checks.length,9);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{
 releaseHeld?.();if(nginx?.exitCode===null){const ownedNginx=nginx;ownedNginx.kill('SIGTERM');const timer=setTimeout(()=>ownedNginx.kill('SIGKILL'),5000);await closed;clearTimeout(timer);}report.temporaryNginxStopped=true;
 await Promise.all(servers.map(server=>new Promise<void>((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();})));report.temporaryUpstreamsStopped=true;
 await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(evidence,'server.log'),logs);console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));
}
