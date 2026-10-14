import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {sudoPolicyPlan} from '../lib/sudo-policy.ts';
import {helperActions} from '../lib/privilege.ts';
const exec=promisify(execFile),directory=await verificationWorkDirectory('tastedev-sudo-syntax-'),binary='/usr/sbin/visudo';
try{
 const sha256=createHash('sha256').update(await readFile(binary)).digest('hex');
 for(const passwordless of [true,false]){
  const plan=sudoPolicyPlan({passwordless,actions:helperActions},{username:'fixture-admin',uid:1000}),file=path.join(directory,'fixture');await writeFile(file,plan.text,{mode:0o600});
  await exec(binary,['-c','-f',file],{timeout:10000,maxBuffer:1048576});
 }
 const file=path.join(directory,'invalid');await writeFile(file,'fixture-admin ALL=(root) NOPASSWD: (invalid\n',{mode:0o600});
 let rejected=false;try{await exec(binary,['-c','-f',file],{timeout:10000,maxBuffer:1048576});}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||typeof error.code!=='number')throw error;rejected=true;}if(!rejected)throw Error('Native validator accepted invalid fixture');
 const folder=path.join(verificationWorkRoot,'evidence');await mkdir(folder,{recursive:true,mode:0o700});const evidence=path.join(folder,'sudo-policy-'+new Date().toISOString().replaceAll(':','-')+'.json');
 const record={status:'PASS',tool:{path:binary,sha256},checks:['exact allowlisted helper action NOPASSWD fixture syntax','exact allowlisted helper action PASSWD fixture syntax','malformed rule rejected'],effectiveAuthorizationVerified:false,osPolicyChanged:false};
 await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});process.stdout.write(JSON.stringify({...record,evidence})+'\n');
}finally{await rm(directory,{recursive:true,force:true});}
