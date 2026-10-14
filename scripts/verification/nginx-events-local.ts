import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {nginxPresets} from '../../lib/nginx-presets.ts';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';

const exec=promisify(execFile),binary='/usr/sbin/nginx';
const fixture=await verificationWorkDirectory('tastedev-nginx-events-');
const evidence=join(verificationWorkRoot,'nginx-events-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,serverStarted:false,operationalFilesChanged:false,checks:[]};
try{
 const version=await exec(binary,['-V'],{encoding:'utf8',timeout:10000});
 report.version=version.stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 let source=`pid ${fixture}/nginx.pid;\nerror_log stderr;\nevents { worker_connections 768; }\n`;
 for(const name of ['accept_mutex_delay','debug_connection','use','worker_aio_requests']){
  if(name==='debug_connection'&&!report.version.includes('--with-debug')){report.checks.push({name,status:'SKIP',reason:'Installed nginx was not built with --with-debug'});continue;}
  const block=requiredBlock(parseNginxTree(source),'events');
  const preset=nginxPresets(block).find(item=>item.name===name);
  assert(preset,'Missing event preset: '+name);
  source=addNginxDirective(source,block.id,preset.name,preset.value,preset.kind);
  await writeFile(join(fixture,'nginx.conf'),source,{mode:0o600});
  const result=await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000});
  assert.match(result.stderr,/test is successful/);
  report.checks.push({name,status:'PASS',output:result.stderr.trim()});
 }
 assert.equal(report.checks.filter(check=>check.status==='PASS').length,report.version.includes('--with-debug')?4:3);
 await writeFile(join(fixture,'nginx.conf'),source.replace('worker_aio_requests 32;','worker_aio_requests 0;'),{mode:0o600});
 const zero=await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000});
 assert.match(zero.stderr,/test is successful/);
 report.checks.push({name:'worker_aio_requests accepts zero',status:'PASS',output:zero.stderr.trim()});
 report.sourceSHA256=createHash('sha256').update(source).digest('hex');
 await writeFile(join(evidence,'candidate.conf'),source,{mode:0o600});
 report.status=report.checks.some(check=>check.status==='SKIP')?'PARTIAL':'PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{
 await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;
 await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({evidence,...report},null,2));
}
