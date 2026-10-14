import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {backupCertificateNginx} from '../lib/certificate-nginx-backup.ts';
import {certificateExecution} from '../lib/certificate-execution.ts';
import {createNginxConfigBackup} from '../lib/nginx-config-backups.ts';
import {certificateJobLog} from '../lib/certificate-job-log.ts';
async function fixture(run){const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-cert-nginx-'));const base=path.join(root,'nginx'),backupRoot=path.join(root,'backups');await mkdir(path.join(base,'conf.d'),{recursive:true,mode:0o700});await mkdir(path.join(base,'sites-available'),{mode:0o700});await mkdir(path.join(base,'sites-enabled'),{mode:0o700});await writeFile(path.join(base,'nginx.conf'),'events {}\nhttp { include /etc/nginx/conf.d/*.conf; include /etc/nginx/sites-enabled/*; }\n',{mode:0o600});await writeFile(path.join(base,'conf.d/existing.conf'),'server { listen 80; server_name "example.com" www.example.com; }\n',{mode:0o600});await writeFile(path.join(base,'sites-available/other'),'server { listen 80; server_name other.example.com; }\n',{mode:0o600});await symlink('../sites-available/other',path.join(base,'sites-enabled/other'));try{await run({base,backupRoot,ownerUid:process.getuid()},root);}finally{await rm(root,{recursive:true,force:true});}}
test('Certbot nginx backup discovers arbitrary active server files and backs up canonical include files once',async()=>fixture(async opts=>{
 const result=await backupCertificateNginx('EXAMPLE.com',opts);assert.equal(result.backups.length,3);assert.deepEqual(result.backups.map(x=>x.path).sort(),['/etc/nginx/nginx.conf','/etc/nginx/conf.d/existing.conf','/etc/nginx/sites-available/other'].sort());
 for(const entry of result.backups){const saved=JSON.parse(await readFile(path.join(opts.backupRoot,entry.id+'.json'),'utf8'));assert.equal(saved.target,entry.path);assert.equal(saved.text,await readFile(path.join(opts.base,entry.path.slice('/etc/nginx/'.length)),'utf8'));}
}));
test('missing or inactive domain and incomplete include graph prevent Certbot execution',async()=>fixture(async opts=>{
 await writeFile(path.join(opts.base,'sites-available/inactive'),'server { server_name inactive.example.com; }',{mode:0o600});
 for(const domain of ['missing.example.com','inactive.example.com'])await assert.rejects(()=>backupCertificateNginx(domain,opts),/server_name/);
 await symlink('/etc/passwd',path.join(opts.base,'conf.d/unsafe.conf'));await assert.rejects(()=>backupCertificateNginx('example.com',opts),/include/);
}));
test('backup failure or graph change stops the certificate command before ACME execution',async()=>fixture(async opts=>{
 for(const phase of ['backup','graph']){let called=0,assertions=0;
  await assert.rejects(()=>certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{backupNginx:domain=>backupCertificateNginx(domain,{...opts,...(phase==='backup'?{backup:async()=>{throw Error('backup failed');}}:{assertGraph:async()=>{if(++assertions===2)throw Error('graph changed');}})}),run:()=>called++}),/failed|changed/);assert.equal(called,0);
 }
}));


test('successful certificate result includes recoverable nginx backup IDs without configuration text', async()=>fixture(async opts=>{
 const result=await certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{backupNginx:domain=>backupCertificateNginx(domain,opts),run:()=> 'certificate issued'});
 assert.equal(result.logs.split('nginx 설정 백업 · ').length-1,3);assert(result.logs.endsWith('certificate issued'));assert(!result.logs.includes('server_name'));assert(result.logs.includes('/etc/nginx/sites-available/other'));
}));


test('standard MIME and CGI includes participate in Certbot backups and remain graph bound',async()=>fixture(async opts=>{
 const main=path.join(opts.base,'nginx.conf');await writeFile(main,'events {} http { include mime.types; include conf.d/*.conf; }',{mode:0o600});
 await writeFile(path.join(opts.base,'mime.types'),'types { text/html html; }',{mode:0o600});
 const result=await backupCertificateNginx('example.com',opts);assert(result.backups.some(item=>item.path==='/etc/nginx/mime.types'));
}));

test('nested server includes inherit context through symlinks and back up canonical files once',async()=>fixture(async opts=>{
 await writeFile(path.join(opts.base,'nginx.conf'),'events {} http { include sites-enabled/*; }',{mode:0o600});
 await writeFile(path.join(opts.base,'sites-available/other'),'server { include conf.d/fragment.conf; }',{mode:0o600});
 await writeFile(path.join(opts.base,'conf.d/fragment.conf'),'include names.conf;',{mode:0o600});
 await writeFile(path.join(opts.base,'names.conf'),'server_name "EXAMPLE.com";',{mode:0o600});
 const result=await backupCertificateNginx('example.com',opts);
 assert.deepEqual(result.backups.map(item=>item.path).sort(),['/etc/nginx/nginx.conf','/etc/nginx/sites-available/other','/etc/nginx/conf.d/fragment.conf','/etc/nginx/names.conf'].sort());
}));

test('a reused include is checked in each enclosing context',async()=>fixture(async opts=>{
 await writeFile(path.join(opts.base,'nginx.conf'),'events {} http { include names.conf; server { include names.conf; } }',{mode:0o600});
 await writeFile(path.join(opts.base,'names.conf'),'server_name example.com;',{mode:0o600});
 const result=await backupCertificateNginx('example.com',opts);assert.equal(result.backups.length,2);
}));

test('non-server includes cannot satisfy the domain check even when another include shares the line',async()=>fixture(async opts=>{
 await writeFile(path.join(opts.base,'names.conf'),'server_name example.com;',{mode:0o600});
 await writeFile(path.join(opts.base,'other.conf'),'server_name other.example.com;',{mode:0o600});
 for(const text of ['events {} http { include names.conf; }','events {} http { include names.conf; server { include other.conf; } }']){
  await writeFile(path.join(opts.base,'nginx.conf'),text,{mode:0o600});let called=0,backups=0;
  await assert.rejects(()=>certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{backupNginx:domain=>backupCertificateNginx(domain,{...opts,backup:()=>backups++}),run:()=>called++}),/server_name/);
  assert.equal(called,0);assert.equal(backups,0);
 }
}));

test('completed backup metadata is reported before ACME failure and remains recoverable',async()=>fixture(async opts=>{
 const rows=[];let calls=0;
 await assert.rejects(()=>certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{
  backupNginx:(domain,onBackup)=>backupCertificateNginx(domain,{...opts,onBackup}),
  reportBackup:item=>rows.push(JSON.stringify({logs:'nginx 설정 백업 · '+item.path+' · '+item.id+'\n'})+'\n'),
  run:()=>{calls++;assert.equal(rows.length,3);throw Error('urn:ietf:params:acme:error:dns private-fixture-token');}
 }),error=>error.status===422&&!error.message.includes('private-fixture-token'));
 assert.equal(calls,1);assert.equal(rows.length,3);const displayed=certificateJobLog(rows);assert.equal(displayed.split('nginx 설정 백업 · ').length-1,3);
 for(const row of rows){const id=JSON.parse(row).logs.trim().split(' · ').at(-1);const saved=JSON.parse(await readFile(path.join(opts.backupRoot,id+'.json'),'utf8'));assert.equal(saved.id,id);assert.equal(saved.text,await readFile(path.join(opts.base,saved.target.slice('/etc/nginx/'.length)),'utf8'));}
 assert(!displayed.includes('server_name'));assert(!displayed.includes('private-fixture-token'));
}));

test('partial backup or final graph failure reports only backups actually created and never dispatches ACME',async()=>fixture(async opts=>{
 for(const phase of ['backup','graph']){const reported=[];let calls=0,backups=0,assertions=0;
  await assert.rejects(()=>certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{
   backupNginx:(domain,onBackup)=>backupCertificateNginx(domain,{...opts,onBackup,
    ...(phase==='backup'?{backup:async(...args)=>{if(++backups===2)throw Error('backup failed');return createNginxConfigBackup(...args);}}:{assertGraph:async()=>{if(++assertions===2)throw Error('graph changed');}})}),
   reportBackup:item=>reported.push(item),run:()=>calls++
  }),/failed|changed/);
  assert.equal(calls,0);assert.equal(reported.length,phase==='backup'?1:3);
  for(const item of reported){assert.deepEqual(Object.keys(item).sort(),['id','path']);const saved=JSON.parse(await readFile(path.join(opts.backupRoot,item.id+'.json'),'utf8'));assert.equal(saved.target,item.path);}
 }
}));

test('streamed success logs do not repeat backup IDs in the final result',async()=>fixture(async opts=>{
 const reported=[];const result=await certificateExecution({domain:'example.com',email:'admin@example.com',agree:true,confirm:true},{backupNginx:(domain,onBackup)=>backupCertificateNginx(domain,{...opts,onBackup}),reportBackup:item=>reported.push(item),run:()=> 'certificate issued'});
 assert.equal(reported.length,3);assert.equal(result.logs,'certificate issued');
}));
