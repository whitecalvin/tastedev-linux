import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nginxUpstreamPresets} from '../../lib/nginx-upstream-settings.ts';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-upstream-');
const evidence=join(verificationWorkRoot,'nginx-upstream-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,operatingServicesChanged:false,checks:[]};
try{
 report.version=(await exec(binary,['-V'])).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const start=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; upstream backend { server 127.0.0.1:3000; server 127.0.0.1:3001; } server { listen 127.0.0.1:19999; location / {proxy_pass http://backend;} } }`;
 async function check(name:string,source:string){const config=join(fixture,'nginx.conf');await writeFile(config,source);const output=(await exec(binary,['-t','-p',fixture+'/', '-c',config],{timeout:10000})).stderr;assert.match(output,/test is successful/);assert.doesNotMatch(output,/load balancing method redefined|no load balancing method/);report.checks.push({name,status:'PASS',output});}
 for(const row of nginxUpstreamPresets('upstream')){const parent=requiredBlock(requiredBlock(parseNginxTree(start),'http').children,'upstream backend');await check(row.name,addNginxDirective(start,parent.id,row.name,row.value));}
 for(const [name,value] of [['hash','$request_uri consistent'],['ip_hash',''],['least_conn',''],['random','two least_conn']]){let source=start;let parent=()=>requiredBlock(requiredBlock(parseNginxTree(source),'http').children,'upstream backend');source=addNginxDirective(source,parent().id,'keepalive','32');source=addNginxDirective(source,parent().id,name,value);await check(name+' inserted before keepalive',source);}
 const conflicting=start.replace('upstream backend {','upstream backend { ip_hash; least_conn;');const config=join(fixture,'nginx.conf');await writeFile(config,conflicting);const output=(await exec(binary,['-t','-p',fixture+'/', '-c',config],{timeout:10000})).stderr;
 assert.match(output,/test is successful/);assert.match(output,/load balancing method redefined/);report.checks.push({name:'native syntax succeeds with conflicting balancer warning; GUI must reject this addition',status:'PASS',output});
 assert.equal(report.checks.length,17);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));}
