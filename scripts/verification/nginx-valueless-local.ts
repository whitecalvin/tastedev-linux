import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-valueless-');
const evidence=join(verificationWorkRoot,'nginx-valueless-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,serverStarted:false,operationalFilesChanged:false,checks:[]};
try{
 report.version=(await exec(binary,['-V'],{encoding:'utf8',timeout:10000})).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const initial=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; server { listen 127.0.0.1:18080; location /private {} } }`;
 const server=requiredBlock(requiredBlock(parseNginxTree(initial),'http').children,'server'),location=requiredBlock(server.children,'location /private');
 const candidates=[{name:'GUI-generated internal',source:addNginxDirective(initial,location.id,'internal',''),valid:true},{name:'internal argument rejected',source:addNginxDirective(initial,location.id,'internal','on'),valid:false},{name:'server internal rejected',source:addNginxDirective(initial,server.id,'internal',''),valid:false}];
 for(const candidate of candidates){await writeFile(join(fixture,'nginx.conf'),candidate.source,{mode:0o600});let output='',accepted=false;try{output=(await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000})).stderr;accepted=true;}catch(error){output=commandStderr(error);}
 assert.equal(accepted,candidate.valid,candidate.name);assert.match(output,candidate.valid?/test is successful/:/invalid number of arguments|directive is not allowed here/);report.checks.push({name:candidate.name,status:'PASS',output});}
 report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,evidence,error:report.error}));}
