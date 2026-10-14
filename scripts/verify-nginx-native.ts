import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {nginxConfig} from '../lib/nginx-config.ts';
import {nginxPresets} from '../lib/nginx-presets.ts';
import {parseNginxTree,addNginxDirective} from '../lib/nginx-syntax.ts';
import {nginxDraftForm} from '../lib/nginx-form-import.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',pathSettings=process.argv.includes('--path-settings');
const options={timeout:10000,maxBuffer:65536,encoding:'utf8' as const,env:{NODE_ENV:'test' as const,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot}};
const root=await verificationWorkDirectory('tastedev-nginx-native-');
try{
 const {stderr:version}=await exec(binary,['-v'],options);assert(/^nginx version: nginx\/[\d.]+/.test(version));
 const binarySha256=createHash('sha256').update(await readFile(binary)).digest('hex');
 await mkdir(path.join(root,'logs'),{mode:0o700});await mkdir(path.join(root,'www'),{mode:0o700});
 const global=`error_log stderr;\npid ${root}/nginx.pid;\nevents { worker_connections 32; }\nhttp {\naccess_log off;\nclient_body_temp_path ${root}/client-body;\nproxy_temp_path ${root}/proxy;\nfastcgi_temp_path ${root}/fastcgi;\nuwsgi_temp_path ${root}/uwsgi;\nscgi_temp_path ${root}/scgi;\n`;
 async function check(text:string){const config=path.join(root,'nginx.conf');await writeFile(config,global+text+'\n}\n',{mode:0o600});await exec(binary,['-t','-p',root+'/','-c',config,'-e','stderr'],options);}
 const checks:string[]=[];
 if(pathSettings){
  const rootPreset=nginxPresets({id:'fixture',kind:'block',label:'http'}).find(item=>item.name==='root'),aliasPreset=nginxPresets({id:'fixture',kind:'block',label:'location /assets/'}).find(item=>item.name==='alias');
  assert(rootPreset&&aliasPreset,'Required nginx presets are missing');
  const site='server { listen 8080; server_name fixture.example.com; location /assets/ { } }';
  await check(rootPreset.name+' '+path.join(root,'www')+';\n'+site);
  const location=parseNginxTree(site)[0].children.find(node=>node.kind==='block');
  assert(location,'Required location node is missing');
  const draft=addNginxDirective(site,location.id,aliasPreset.name,path.join(root,'www')+'/',aliasPreset.kind);
  await check(draft);assert(draft.includes('listen 8080;'));
  await assert.rejects(check('alias '+path.join(root,'www')+'/;\n'+site));
  checks.push('HTTP root GUI entry accepted by native parser','location alias GUI code edit accepted and existing listen preserved','alias in HTTP context rejected');
 }else{
 const site={domain:'fixture.example.com',port:8080,mode:'proxy',upstreamPort:3145,root:path.join(root,'www')};
 await check(nginxConfig({...site,connectTimeout:10,readTimeout:120}));await check(nginxConfig({...site,mode:'static',bodySize:64}));await check(nginxConfig({...site,bodySize:0}));
 const certificate=path.join(root,'fixture.pem'),key=path.join(root,'fixture.key');await exec('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-subj','/CN=fixture.example.com','-days','1','-keyout',key,'-out',certificate],options);
 const tls=nginxConfig({...site,port:8443}).replace('listen 8443;','listen 8443 ssl;').replace('    server_name fixture.example.com;',`    server_name fixture.example.com;\n    ssl_certificate ${certificate};\n    ssl_certificate_key ${key};`)+`server {\n listen 8080;\n server_name fixture.example.com;\n return 301 https://$host$request_uri;\n}\n`;
 await check(tls);const draft=tls.replace('127.0.0.1:3145','127.0.0.1:3200');assert.equal(nginxDraftForm(draft,tls,site.domain).upstreamPort,3200);await check(draft);
 await assert.rejects(check(nginxConfig(site)+'\ntastedev_invalid_directive on;\n'));
  checks.push('generated proxy configuration','generated static configuration','temporary TLS certificate and redirect configuration','HTTPS upstream tree edit accepted by native parser','invalid directive rejected');
 }
 const record={status:'PASS',version:version.trim(),binary,binarySha256,checks,serviceStarted:false,serviceReloaded:false,operatingConfigurationChanged:false,temporaryCertificateOnly:!pathSettings,reference:'https://nginx.org/en/docs/switches.html'};
 const evidence=path.join(verificationWorkRoot,'evidence/nginx-native-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...record,evidence}));
}finally{await rm(root,{recursive:true,force:true});}
