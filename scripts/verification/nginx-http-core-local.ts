import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nginxHttpCorePresets} from '../../lib/nginx-http-core-settings.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx';
const fixture=await verificationWorkDirectory('tastedev-nginx-http-core-'),evidence=join(verificationWorkRoot,'nginx-http-core-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,serverStarted:false,operationalFilesChanged:false,checks:[]};
try{
 report.version=(await exec(binary,['-V'],{encoding:'utf8',timeout:10000})).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const config=(context:string,directive:string)=>`pid ${fixture}/nginx.pid;\nerror_log stderr;\nevents { worker_connections 32; }\nhttp { access_log off; ${context==='http'?directive:''}\nserver { listen 127.0.0.1:18080; ${context==='server'?directive:''}\nlocation / { ${context==='location'?directive:''} } } }\n`;
 for(const context of ['http','server','location'])for(const preset of nginxHttpCorePresets(context)){
  const value=preset.name==='client_body_temp_path'?fixture+'/body 1 2':preset.value;
  await writeFile(join(fixture,'nginx.conf'),config(context,preset.name+' '+value+';'),{mode:0o600});
  const result=await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000});assert.match(result.stderr,/test is successful/);
  report.checks.push({name:preset.name,context,status:'PASS',output:result.stderr.trim()});
 }
 for(const name of ['connection_pool_size','ignore_invalid_headers']){
  const preset=nginxHttpCorePresets('http').find(item=>item.name===name);
  assert(preset,'Missing HTTP preset: '+name);
  await writeFile(join(fixture,'nginx.conf'),config('location',name+' '+preset.value+';'),{mode:0o600});
  let rejection:string|undefined;try{await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000});}catch(error){rejection=commandStderr(error);}
  assert.match(rejection||'',/directive is not allowed here/);report.checks.push({name,context:'location',status:'PASS',rejected:true});
 }
 assert.equal(report.checks.length,117);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));}
