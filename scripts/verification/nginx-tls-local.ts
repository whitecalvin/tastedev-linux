import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rm,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomBytes} from 'node:crypto';
import {nginxTlsPresets} from '../../lib/nginx-tls-settings.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-tls-');
const evidence=join(verificationWorkRoot,'nginx-tls-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',scope:'all public 1.28 GUI TLS proposals with own temporary certificates and files; syntax only',binary,operatingServicesChanged:false,checks:[]};
try{
 report.version=(await exec(binary,['-V'])).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const key=join(fixture,'key.pem'),cert=join(fixture,'cert.pem'),crl=join(fixture,'crl.pem'),dh=join(fixture,'dh.pem'),ocsp=join(fixture,'ocsp.der'),passwords=join(fixture,'passwords'),ticket=join(fixture,'ticket');
 await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=tls.fixture.invalid'],{timeout:15000});await chmod(key,0o600);await writeFile(passwords,'own-fixture-only\n',{mode:0o600});await writeFile(ticket,randomBytes(80),{mode:0o600});
 await writeFile(join(fixture,'index'),'');await writeFile(join(fixture,'serial'),'01\n');await writeFile(join(fixture,'crlnumber'),'01\n');await mkdir(join(fixture,'newcerts'));
 const ca=join(fixture,'ca.conf');await writeFile(ca,`[ca]\ndefault_ca=fixture\n[fixture]\ndatabase=${fixture}/index\nserial=${fixture}/serial\ncrlnumber=${fixture}/crlnumber\nnew_certs_dir=${fixture}/newcerts\ncertificate=${cert}\nprivate_key=${key}\ndefault_md=sha256\ndefault_crl_days=1\npolicy=policy\n[policy]\ncommonName=supplied\n`);
 await exec('/usr/bin/openssl',['ca','-gencrl','-config',ca,'-out',crl,'-batch'],{timeout:15000});await exec('/usr/bin/openssl',['dhparam','-dsaparam','-out',dh,'2048'],{timeout:30000});
 await exec('/usr/bin/openssl',['ocsp','-index',join(fixture,'index'),'-rsigner',cert,'-rkey',key,'-CA',cert,'-issuer',cert,'-cert',cert,'-respout',ocsp],{timeout:15000});
 const substitutions={'/etc/letsencrypt/live/example.com/fullchain.pem':cert,'/etc/letsencrypt/live/example.com/privkey.pem':key,'/etc/nginx/client-ca.pem':cert,'/etc/nginx/trusted-ca.pem':cert,'/etc/nginx/client-crl.pem':crl,'/etc/nginx/dhparam.pem':dh,'/etc/nginx/ocsp-response.der':ocsp,'/etc/nginx/key-passwords':passwords,'/etc/nginx/session-ticket.key':ticket};
 async function check(name:string,value:string,context:string){let own=value;for(const [from,to] of Object.entries(substitutions))own=own.replaceAll(from,to);const directive=name+' '+own+';';
  const base=(context==='http'&&name==='ssl_certificate'?'':'ssl_certificate '+cert+';')+(context==='http'&&name==='ssl_certificate_key'?'':'ssl_certificate_key '+key+';');
  const source=`pid ${fixture}/nginx.pid; error_log stderr; events {} http {access_log off;${base}${context==='http'?directive:''} server {listen 127.0.0.1:19999 ssl;${context==='server'?directive:''} location / {return 200 own;}}}`;
  const config=join(fixture,'nginx.conf');await writeFile(config,source,{mode:0o600});try{const output=(await exec(binary,['-t','-p',fixture+'/', '-c',config,'-e','stderr'],{timeout:10000})).stderr;assert.match(output,/test is successful/);report.checks.push({name,context,example:value,status:'PASS',output});}catch(error){report.checks.push({name,context,status:'FAIL',output:commandStderr(error)});throw error;}
 }
 for(const context of ['http','server']){for(const row of nginxTlsPresets(context))await check(row.name,row.value,context);await check('ssl_verify_depth','0',context);}
 assert.equal(report.checks.length,60);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,evidence,error:report.error}));}
