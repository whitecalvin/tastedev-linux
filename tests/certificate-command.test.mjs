import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateCommand,certificateWebroot} from '../lib/certificate-command.ts';
import {certificateExecution,inspectCertificateWebroot} from '../lib/certificate-execution.ts';
const issue={domain:'Example.com',email:'admin@example.com',staging:true,confirm:true,agree:true};
const directory={uid:0,mode:0o755,isDirectory:()=>true,isSymbolicLink:()=>false};
test('certificate commands select plugins without changing the default nginx command',()=>{
 const tail=['--non-interactive','--agree-tos','--email','admin@example.com','-d','example.com'];
 assert.deepEqual(certificateCommand(issue),['/usr/bin/certbot','--nginx',...tail,'--redirect','--staging']);
 assert.deepEqual(certificateCommand({...issue,authenticator:'webroot',webroot:'/var/www/html'}),['/usr/bin/certbot','certonly','--webroot','--webroot-path','/var/www/html',...tail,'--staging']);
 assert.deepEqual(certificateCommand({...issue,authenticator:'standalone',staging:false}),['/usr/bin/certbot','certonly','--standalone',...tail]);
 for(const authenticator of ['nginx','webroot','standalone'])assert.deepEqual(certificateCommand({...issue,authenticator,operation:'renew-check',certName:'example.com-0001'}),['/usr/bin/certbot','renew','--dry-run','--non-interactive','--no-random-sleep-on-renew','--cert-name','example.com-0001']);
});
test('certificate arguments reject path traversal and unsupported methods',()=>{
 for(const webroot of ['/etc','/var/www/../etc','/srv//web','/opt/web/','/srv/./web','/opt/a;id','/srv/space here','/srv/a\nb',null,123,'/srv-other/web','relative'])assert.throws(()=>certificateCommand({...issue,authenticator:'webroot',webroot}));
 for(const authenticator of ['dns','--nginx;id',{},123,''])assert.throws(()=>certificateCommand({...issue,authenticator}));
 for(const webroot of ['/var/www','/srv/web','/opt/app/public','/usr/share/nginx/html'])assert.equal(certificateWebroot(webroot),webroot);
});
test('webroot checks every ancestor and challenge directory before execution',()=>{
 const visited=[];assert.equal(inspectCertificateWebroot('/var/www/html',name=>{visited.push(name);if(name.includes('.well-known'))throw Object.assign(Error('missing'),{code:'ENOENT'});return directory;}),'/var/www/html');
 assert.deepEqual(visited,['/','/var','/var/www','/var/www/html','/var/www/html/.well-known','/var/www/html/.well-known/acme-challenge']);
 for(const bad of [{uid:1000},{mode:0o777},{isSymbolicLink:()=>true},{isDirectory:()=>false}])for(const rejected of visited)assert.throws(()=>inspectCertificateWebroot('/var/www/html',name=>name===rejected?{...directory,...bad}:directory));
 assert.throws(()=>inspectCertificateWebroot('/var/www/html',()=>{throw Object.assign(Error('missing root'),{code:'ENOENT'});}));
 assert.throws(()=>inspectCertificateWebroot('/var/www/html',name=>{if(name.endsWith('.well-known'))throw Object.assign(Error('denied'),{code:'EACCES'});return directory;}));
});
test('privileged certificate executor matches preview and backs up the nginx include graph',async()=>{
 for(const authenticator of ['nginx','webroot','standalone']){
  const events=[],input={...issue,authenticator,webroot:'/var/www/html'};
  const hooks={backupNginx:async name=>events.push(['backup',name]),inspectDirectory:name=>{events.push(['inspect',name]);return directory;},run:(...args)=>{events.push(['run',...args]);return 'fixture output';}};
  assert.deepEqual(await certificateExecution(input,hooks),{logs:'fixture output'});
  assert.deepEqual(events.at(-1),['run',certificateCommand(input)[0],certificateCommand(input).slice(1)]);
  assert.equal(events.some(e=>e[0]==='backup'),authenticator==='nginx');assert.equal(events.some(e=>e[0]==='inspect'),authenticator==='webroot');
 }
});
test('certificate executor rejects unconfirmed and invalid requests before any command',async()=>{
 const unexpected=()=>assert.fail('execution hook was called'),hooks={backupNginx:unexpected,inspectDirectory:unexpected,run:unexpected};
 for(const input of [{...issue,confirm:false},{...issue,agree:false},{...issue,authenticator:'invalid'},{...issue,authenticator:'webroot',webroot:'/etc'}])await assert.rejects(()=>certificateExecution(input,hooks));
 await assert.rejects(()=>certificateExecution(issue,{...hooks,backupNginx:async()=>{throw Error('missing domain');}}),/missing domain/);
 await assert.rejects(()=>certificateExecution({...issue,authenticator:'webroot',webroot:'/srv/public'},{...hooks,inspectDirectory:()=>({...directory,uid:1000})}));
 let command;assert.deepEqual(await certificateExecution({...issue,operation:'renew-check'},{...hooks,run:(binary,args)=>{command=[binary,...args];return 'renewed';}}),{logs:'renewed'});assert.deepEqual(command,['/usr/bin/certbot','renew','--dry-run','--non-interactive','--no-random-sleep-on-renew']);
});


test('renewal directory hook option is explicit, preview-bound, and does not replace stored certificate hooks',()=>{
 const input={operation:'renew-check',certName:'eztoy.app',directoryHooks:false};assert.deepEqual(certificateCommand(input),['/usr/bin/certbot','renew','--dry-run','--non-interactive','--no-random-sleep-on-renew','--cert-name','eztoy.app','--no-directory-hooks']);
 assert(!certificateCommand({...input,directoryHooks:true}).includes('--no-directory-hooks'));
 for(const directoryHooks of ['false',0,null,{}])assert.throws(()=>certificateCommand({...input,directoryHooks}),/hook/);
});

test('webroot authentication can install nginx HTTPS with a preview-bound fixed installer',()=>{
 const input={...issue,authenticator:'webroot',webroot:'/var/www/html',installNginx:true};
 assert.deepEqual(certificateCommand(input),['/usr/bin/certbot','run','--authenticator','webroot','--installer','nginx','--webroot-path','/var/www/html','--non-interactive','--agree-tos','--email','admin@example.com','-d','example.com','--redirect','--staging']);
 assert(certificateCommand({...input,installNginx:false}).includes('certonly'));
 for(const installNginx of ['true',1,null,{}])assert.throws(()=>certificateCommand({...input,installNginx}));
 for(const authenticator of ['standalone','nginx'])assert.throws(()=>certificateCommand({...input,authenticator}));
});

test('combined webroot and nginx validates root before backup and cannot execute without a backup',async()=>{
 const input={...issue,authenticator:'webroot',webroot:'/var/www/html',installNginx:true},events=[];
 const hooks={inspectDirectory:name=>{events.push('inspect');return directory;},backupNginx:async name=>{assert.equal(name,'example.com');events.push('backup');return {backups:[{path:'/etc/nginx/nginx.conf',id:'saved'}]};},run:(binary,args)=>{events.push('run');assert.deepEqual([binary,...args],certificateCommand(input));return 'installed';}};
 const result=await certificateExecution(input,hooks);assert(result.logs.includes('nginx 설정 백업'));assert(result.logs.endsWith('installed'));assert(events.indexOf('backup')>events.lastIndexOf('inspect'));assert.equal(events.at(-1),'run');
 events.length=0;await assert.rejects(()=>certificateExecution(input,{...hooks,inspectDirectory:()=>({...directory,uid:1000})}));assert.deepEqual(events,[]);
 events.length=0;await assert.rejects(()=>certificateExecution(input,{...hooks,backupNginx:async()=>{throw Error('backup failed');}}),/backup failed/);assert(!events.includes('run'));
});
