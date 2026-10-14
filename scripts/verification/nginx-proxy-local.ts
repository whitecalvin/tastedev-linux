import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {readFile,mkdir,writeFile,rm,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nginxProxyPresets} from '../../lib/nginx-proxy-settings.ts';
const exec=promisify(execFile),fixture=await verificationWorkDirectory('nginx-proxy-');
const evidence=join(verificationWorkRoot,'nginx-proxy-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={binary:'/usr/sbin/nginx',workDirectory:fixture,status:'FAIL',scope:'own temporary nginx proxy syntax and accepted numeric bounds',checks:[],operatingServicesChanged:false};
try{
 report.binarySHA256=createHash('sha256').update(await readFile('/usr/sbin/nginx')).digest('hex');
 report.version=(await exec('/usr/sbin/nginx',['-v'])).stderr.trim();
 const key=join(fixture,'key.pem'),cert=join(fixture,'ca.pem'),crl=join(fixture,'crl.pem'),passwords=join(fixture,'passwords');
 await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=proxy-fixture'],{timeout:15000});await chmod(key,0o600);await writeFile(passwords,'fixture-only\n',{mode:0o600});
 await writeFile(join(fixture,'index'),'');await writeFile(join(fixture,'serial'),'01\n');await writeFile(join(fixture,'crlnumber'),'01\n');await mkdir(join(fixture,'newcerts'));
 const caConfig=join(fixture,'ca.conf');await writeFile(caConfig,`[ca]\ndefault_ca=fixture\n[fixture]\ndatabase=${fixture}/index\nserial=${fixture}/serial\ncrlnumber=${fixture}/crlnumber\nnew_certs_dir=${fixture}/newcerts\ncertificate=${cert}\nprivate_key=${key}\ndefault_md=sha256\ndefault_crl_days=1\npolicy=policy\n[policy]\ncommonName=supplied\n`);await exec('/usr/bin/openssl',['ca','-gencrl','-config',caConfig,'-out',crl,'-batch'],{timeout:15000});
 async function check(name:string,value:string,context:string){
  let ownValue=value.replace('/etc/nginx/upstream-client.pem',cert).replace('/etc/nginx/upstream-client.key',key).replace('/etc/nginx/upstream-ca.pem',cert).replace('/etc/nginx/upstream-crl.pem',crl).replace('/etc/nginx/upstream-key-passwords',passwords).replaceAll('/var/cache/nginx/proxy_temp',fixture+'/proxy-temp').replaceAll('/var/cache/nginx/proxy',fixture+'/proxy-cache');
  const directive=name+' '+ownValue+';',support=name==='proxy_ssl_certificate'?'proxy_ssl_certificate_key '+key+';':'';
  const location=context==='location'?support+directive+(name==='proxy_pass'?'':'proxy_pass http://127.0.0.1:9;'):'proxy_pass http://127.0.0.1:9;';
  const text=`daemon off;master_process off;pid ${fixture}/nginx.pid;error_log stderr;events {} http {access_log off;proxy_temp_path ${fixture}/base-temp;${context==='http'?support+directive:''} server {listen 127.0.0.1:19999;${context==='server'?support+directive:''} location / {${location}}}}`;
  // Avoid duplicate path directive at the same level while preserving every GUI proposal verbatim otherwise.
  const file=join(fixture,'nginx.conf');await writeFile(file,context==='http'&&name==='proxy_temp_path'?text.replace('proxy_temp_path '+fixture+'/base-temp;',''):text);
  try{await exec('/usr/sbin/nginx',['-t','-p',fixture+'/','-c',file,'-e','stderr'],{timeout:10000,maxBuffer:65536});report.checks.push({name,context,value,status:'PASS'});}catch(error){report.checks.push({name,context,value,status:'FAIL',error:commandStderr(error)});throw error;}
 }
 for(const context of ['http','server','location'])for(const row of nginxProxyPresets(context))await check(row.name,row.value,context);
 for(const name of ['proxy_cache_min_uses','proxy_ssl_verify_depth','proxy_next_upstream_tries'])await check(name,'0','location');
 assert.equal(report.checks.length,209);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));}
