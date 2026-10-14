
import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
function record(value:unknown):Record<string,unknown>{assert(value!==null&&typeof value==='object'&&!Array.isArray(value));return Object.fromEntries(Object.entries(value));}
function rows(value:Record<string,unknown>,key:string){const list=value[key];assert(Array.isArray(list));return list.map(record);}
const hash=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex'),file='/etc/nginx/conf.d/linux-fixture.example.invalid.conf';
const site={domain:'fixture.example.invalid',port:18080,mode:'proxy',upstreamPort:3000,confirm:true};
const checks:string[]=[],uidMap=fs.readFileSync('/proc/self/uid_map','utf8').trim();
assert.equal(process.getuid?.(),0);assert.match(uidMap,/^0\s+\d+\s+1$/);
const master=spawn('/usr/sbin/nginx',['-g','daemon off;'],{stdio:['ignore','ignore','pipe']});let daemonLog='';master.stderr.on('data',data=>{daemonLog+=data.toString();});
async function waitFor(predicate:()=>boolean){for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,25));}throw new Error('Isolated nginx wait timeout: '+daemonLog);}
const helper=(action:string,input:unknown={})=>record(JSON.parse(execFileSync('/mnt/node',['/mnt/helper',action],{input:JSON.stringify(input),encoding:'utf8',timeout:15000,maxBuffer:1048576})));
const read=()=>fs.readFileSync(file,'utf8');
try{
 await waitFor(()=>fs.existsSync('/mnt/data/build/tastedev-linux/nginx-fixture.pid'));assert.equal(master.exitCode,null);
 helper('nginx-apply',site);assert(read().includes('proxy_pass http://127.0.0.1:3000;'));checks.push('real nginx apply/check/reload');
 const first=read();helper('nginx-apply',{...site,upstreamPort:4000,version:hash(first)});assert(read().includes('127.0.0.1:4000'));checks.push('versioned app edit');
 const snapshot=rows(helper('nginx-backups'),'backups').find(record=>record.sha256===hash(first));assert(snapshot);
 const plan=helper('nginx-restore-plan',{id:snapshot.id});helper('nginx-restore',{id:snapshot.id,version:plan.version,confirm:true});assert.equal(read(),first);checks.push('real snapshot restore/check/reload');
 const beforeBackups=rows(helper('nginx-backups'),'backups').length;assert.throws(()=>helper('nginx-toggle',{domain:site.domain,enabled:false,confirm:true,version:'0'.repeat(64)}));assert.equal(read(),first);assert.equal(rows(helper('nginx-backups'),'backups').length,beforeBackups);checks.push('stale toggle rejected before backup or filename change');
 helper('nginx-toggle',{domain:site.domain,enabled:false,confirm:true,version:hash(first)});assert(!fs.existsSync(file));assert(fs.existsSync(file+'.disabled'));helper('nginx-toggle',{domain:site.domain,enabled:true,confirm:true,version:hash(first)});assert.equal(read(),first);checks.push('disable and enable/reload');
 fs.writeFileSync('/etc/nginx/conf.d/broken-fixture.conf','server {\n');assert.throws(()=>helper('nginx-apply',{...site,upstreamPort:5000,version:hash(read())}));assert.equal(read(),first);fs.unlinkSync('/etc/nginx/conf.d/broken-fixture.conf');checks.push('actual nginx syntax failure restores previous file');
 const tls='# Managed by LINUX\nserver {\n    listen 18443 ssl;\n    server_name fixture.example.invalid;\n    ssl_certificate /etc/letsencrypt/live/fixture.example.invalid/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/fixture.example.invalid/privkey.pem;\n\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n    }\n}\nserver {\n    listen 18080;\n    return 301 https://$host$request_uri;\n}\n';
 fs.writeFileSync(file,tls,{mode:0o644});execFileSync('/usr/sbin/nginx',['-t'],{stdio:'pipe'});execFileSync('/usr/sbin/nginx',['-s','reload'],{stdio:'pipe'});
 helper('nginx-apply',{...site,port:18443,upstreamPort:4000,version:hash(tls)});const updated=read();assert(updated.includes('127.0.0.1:4000'));assert(updated.includes('ssl_certificate /etc/letsencrypt/live/fixture.example.invalid/fullchain.pem;'));assert(updated.includes('ssl_certificate_key /etc/letsencrypt/live/fixture.example.invalid/privkey.pem;'));assert(updated.endsWith('server {\n    listen 18080;\n    return 301 https://$host$request_uri;\n}\n'));checks.push('real TLS config validation and app edit preserves SSL/redirect');
 assert.throws(()=>helper('nginx-apply',{...site,port:18443,version:hash(tls)}));assert.equal(read(),updated);checks.push('stale HTTPS edit rejected');
 master.kill('SIGTERM');await waitFor(()=>master.exitCode!==null);await waitFor(()=>!fs.existsSync('/mnt/data/build/tastedev-linux/nginx-fixture.pid'));
 assert.throws(()=>helper('nginx-apply',{...site,port:18443,upstreamPort:5000,version:hash(updated)}));assert.equal(read(),updated);checks.push('actual reload failure restores previous file');
 let version='';try{execFileSync('/usr/sbin/nginx',['-v'],{encoding:'utf8'});}catch{}
 const result={status:'PASS',uidMap,checks,helperSha256:hash(fs.readFileSync('/mnt/helper')),nginxSha256:hash(fs.readFileSync('/usr/sbin/nginx')),backups:rows(helper('nginx-backups'),'backups').length,hostOperationalChanges:false,networkIsolated:true};
 fs.writeFileSync('/mnt/result.json',JSON.stringify(result,null,2)+'\n');
}finally{if(master.exitCode===null)master.kill('SIGTERM');}

