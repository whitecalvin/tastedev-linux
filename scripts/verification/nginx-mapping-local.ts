import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import type {ChildProcessByStdio} from 'node:child_process';
import type {Readable} from 'node:stream';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:net';
import {request} from 'node:http';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective,updateNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-mapping-');
const evidence=join(verificationWorkRoot,'nginx-mapping-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,operationalFilesChanged:false,checks:[]};let child:ChildProcessByStdio<null,Readable,Readable>|undefined,closed:Promise<unknown[]>|undefined,serverLog='';
try{
 report.version=(await exec(binary,['-V'],{encoding:'utf8',timeout:10000})).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const reservation=createServer();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const address=reservation.address();assert(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>reservation.close(error=>error?reject(error):resolve()));
 let source=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; client_body_temp_path ${fixture}/body; proxy_temp_path ${fixture}/proxy; fastcgi_temp_path ${fixture}/fastcgi; uwsgi_temp_path ${fixture}/uwsgi; scgi_temp_path ${fixture}/scgi; map $http_user_agent $device { default desktop; } map $host $domain { default unknown; } geo $region { default other; } geo $range_region { default other; } split_clients $remote_addr $variant { * B; } server { listen 127.0.0.1:${port}; location / { return 200 "$device|$domain|$region|$range_region|$variant"; } } }`;
 const block=(label:string)=>requiredBlock(requiredBlock(parseNginxTree(source),'http').children,label);
 const check=async(name:string)=>{await writeFile(join(fixture,'nginx.conf'),source,{mode:0o600});const output=(await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000})).stderr;assert.match(output,/test is successful/);report.checks.push({name,status:'PASS',output});};
 source=addNginxDirective(source,block('map $http_user_agent $device').id,'"~^Opera Mini[0-9]{1,3}$"','mobile');await check('quoted regex key generated');
 const regex=block('map $http_user_agent $device').children.find(node=>node.label.startsWith('"~^Opera'));assert(regex);source=updateNginxDirective(source,regex.id,'mobile_v2');await check('quoted regex key preserved during value edit');
 source=addNginxDirective(source,block('map $host $domain').id,'*.example.test','domain');source=addNginxDirective(source,block('map $host $domain').id,'hostnames','');await check('hostnames inserted before wildcard rules');
 source=addNginxDirective(source,block('geo $region').id,'127.0.0.1/32','local');source=addNginxDirective(source,block('geo $region').id,'2001:db8::/32','ipv6');await check('IPv4 and IPv6 CIDR keys generated');
 source=addNginxDirective(source,block('geo $range_region').id,'127.0.0.1-127.0.0.1','range');source=addNginxDirective(source,block('geo $range_region').id,'ranges','');await check('ranges inserted first');
 source=addNginxDirective(source,block('split_clients $remote_addr $variant').id,'50%','A');await check('percentage inserted before remainder');
 child=spawn(binary,['-p',fixture+'/', '-c',join(fixture,'nginx.conf'),'-g','daemon off; master_process off;'],{stdio:['ignore','pipe','pipe']});report.serverStarted=true;closed=once(child,'close');child.stdout.on('data',bytes=>serverLog+=bytes);child.stderr.on('data',bytes=>serverLog+=bytes);
 for(let attempt=0;;attempt++){assert(attempt<100&&child.exitCode===null,'Temporary nginx failed');try{if((await fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(1000)})).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 for(const [userAgent,host,expected] of [['Opera Mini12','service.example.test',['mobile_v2','domain','local','range']],['Firefox','other.test',['desktop','unknown','local','range']]] as const){
  const response=await new Promise<{status:number|undefined;text:string}>((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path:'/',headers:{'user-agent':userAgent,host},timeout:3000},res=>{let text='';res.setEncoding('utf8');res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,text}));res.on('error',reject);});req.on('timeout',()=>req.destroy(Error('Fixture request timeout')));req.on('error',reject);req.end();});assert.equal(response.status,200);const values=response.text.split('|');assert.deepEqual(values.slice(0,4),expected);assert(['A','B'].includes(values[4]));report.checks.push({name:'actual HTTP '+userAgent,status:'PASS',values});
 }
 report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{
 if(child?.exitCode===null){child.kill('SIGTERM');const ownedChild=child;const deadline=setTimeout(()=>ownedChild.kill('SIGKILL'),5000);await closed;clearTimeout(deadline);}report.temporaryServerStopped=true;
 await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');await writeFile(join(evidence,'server.log'),serverLog);console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));
}
