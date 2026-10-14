import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nginxMainPresets} from '../../lib/nginx-main-settings.ts';
import {addNginxDirective} from '../../lib/nginx-syntax.ts';

const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-main-');
const evidence=join(verificationWorkRoot,'nginx-main-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,serverStarted:false,operationalFilesChanged:false,checks:[]};
try{
 const version=await exec(binary,['-V'],{encoding:'utf8',timeout:10000});report.version=version.stderr.trim();
 report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const base=`pid ${fixture}/nginx.pid;\nerror_log stderr;\nevents { worker_connections 768; }\n`;
 for(const preset of nginxMainPresets('main')){
  if(['load_module','ssl_engine'].includes(preset.name)){report.checks.push({name:preset.name,status:'NOT_RUN',reason:'Needs an installed module or OpenSSL engine; examples must not be loaded'});continue;}
  if(preset.name==='thread_pool'&&!report.version.includes('--with-threads')||preset.name==='pcre_jit'&&!report.version.includes('--with-pcre-jit')){report.checks.push({name:preset.name,status:'NOT_RUN',reason:'Installed binary lacks the build capability'});continue;}
  const value=preset.name==='working_directory'?fixture:preset.name==='lock_file'?fixture+'/nginx.lock':preset.value;
  const source=addNginxDirective(base,null,preset.name,value);
  await writeFile(join(fixture,'nginx.conf'),source,{mode:0o600});
  const result=await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000});
  assert.match(result.stderr,/test is successful/);
  report.checks.push({name:preset.name,status:'PASS',value,sourceSHA256:createHash('sha256').update(source).digest('hex'),output:result.stderr.trim()});
 }
 assert.equal(report.checks.length,17);
 report.status=report.checks.some(check=>check.status!=='PASS')?'PARTIAL':'PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{
 await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;
 await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({evidence,status:report.status,passed:report.checks.filter(check=>check.status==='PASS').length,notRun:report.checks.filter(check=>check.status!=='PASS'),error:report.error,fixtureRemoved:report.fixtureRemoved},null,2));
}
