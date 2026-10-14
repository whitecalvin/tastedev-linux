import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import {certificateCommand} from '../lib/certificate-command.ts';

test('emitted certificate command and executor run without a TypeScript loader and never issue real ACME requests',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-certificate-runtime-'));
 try{
  await mkdir(join(root,'lib'));
  for(const file of ['certificate-command.mjs','certificate-failure.mjs','certificate-execution.mjs','nginx-config.mjs']){const bytes=await readAdminRuntimeModule(file);assert.deepEqual(bytes,await readAdminRuntimeModule(file));await writeFile(join(root,'lib',file),bytes,{mode:0o600});}
  const input={domain:'example.com',email:'admin@example.com',authenticator:'webroot',webroot:'/var/www/html',installNginx:true,staging:true,confirm:true,agree:true};
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {certificateCommand} from './lib/certificate-command.mjs';import {certificateExecution} from './lib/certificate-execution.mjs';const input=${JSON.stringify(input)},events=[];const hooks={inspectDirectory:()=>({uid:0,mode:0o755,isDirectory:()=>true,isSymbolicLink:()=>false}),backupNginx:async domain=>{events.push('backup:'+domain);return {backups:[{path:'/etc/nginx/nginx.conf',id:'fixture-backup'}]};},run:async(binary,args)=>{events.push([binary,...args]);return 'fixture output';}};const result=await certificateExecution(input,hooks);assert.equal(events[0],'backup:example.com');assert.deepEqual(events[1],certificateCommand(input));assert(result.logs.endsWith('fixture output'));const before=events.length;await assert.rejects(certificateExecution({...input,confirm:false},hooks));assert.equal(events.length,before);let calls=0;await assert.rejects(certificateExecution({operation:'renew-check',confirm:true,agree:true},{run:async()=>{calls++;throw Error('urn:ietf:params:acme:error:rateLimited private-token');}}),error=>error.status===422&&!error.message.includes('private-token'));assert.equal(calls,1);console.log(JSON.stringify(certificateCommand(input)));`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),certificateCommand(input));
 }finally{await rm(root,{recursive:true,force:true});}
});
