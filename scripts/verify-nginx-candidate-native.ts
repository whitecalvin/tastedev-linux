import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import type {NginxCandidate} from '../lib/nginx-candidate.ts';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {nginxTopology} from '../lib/nginx-topology.ts';
import {nginxCandidate} from '../lib/nginx-candidate.ts';
import {validateNginxCandidate} from '../lib/nginx-candidate-validation.ts';
const base=await verificationWorkDirectory('nginx-candidate-native-fixture-');let candidate:NginxCandidate|null=null;
try{
 await mkdir(path.join(base,'conf.d'),{mode:0o700});const original='pid /run/nginx.pid; error_log /var/log/nginx/error.log warn; events { worker_connections 32; } http { access_log /var/log/nginx/access.log combined; include /etc/nginx/conf.d/*.conf; }';
 await writeFile(path.join(base,'nginx.conf'),original,{mode:0o600});await writeFile(path.join(base,'conf.d','example.conf'),'server { listen 8080; server_name fixture.example.com; location / { proxy_pass http://127.0.0.1:3145; } }',{mode:0o600});const graph=await nginxTopology(base);assert.equal(graph.complete,true);
 candidate=await nginxCandidate({version:graph.version,target:'/etc/nginx/conf.d/example.conf',text:'server { listen 8080; server_name fixture.example.com; location / { proxy_pass http://127.0.0.1:3200; } }'},base);assert.equal((await validateNginxCandidate(candidate)).valid,true);await candidate.cleanup();candidate=null;
 candidate=await nginxCandidate({version:graph.version,target:'/etc/nginx/conf.d/example.conf',text:'server { tastedev_invalid_directive on; }'},base);await assert.rejects(validateNginxCandidate(candidate),(error:unknown)=>error!==null&&typeof error==='object'&&'status' in error&&error.status===400);assert.equal(await readFile(path.join(base,'nginx.conf'),'utf8'),original);
 const record={status:'PASS',binary:'/usr/sbin/nginx',binarySha256:createHash('sha256').update(await readFile('/usr/sbin/nginx')).digest('hex'),checks:['private whole include graph accepted','isolated log and pid paths','invalid included directive rejected','original fixture preserved'],serviceStarted:false,serviceReloaded:false,operatingConfigurationChanged:false,operationalResourcesVerified:false};
 const evidence=path.resolve(verificationWorkRoot+'/evidence/nginx-candidate-native-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...record,evidence}));
}finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
