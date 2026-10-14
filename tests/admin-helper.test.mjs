import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const source = fs
  .readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0];
const context = vm.createContext({ require: createRequire(import.meta.url), process, Buffer });
vm.runInContext(source, context);
test('privileged helper independently rejects injected configurations', () => {
  for (const domain of ['app.example.com;include /etc/shadow', '../evil', '--nginx', 'a..com'])
    assert.throws(() =>
      vm.runInContext(`config(${JSON.stringify({ domain, port: 80, mode: 'proxy', upstreamPort: 3000 })})`, context),
    );
  assert.throws(() =>
    vm.runInContext(
      `config(${JSON.stringify({ domain: 'app.example.com', port: 80, mode: 'static', root: '/var/www; include /etc/shadow' })})`,
      context,
    ),
  );
  assert.throws(() => vm.runInContext('dispatch("bash",{})', context));
  assert.throws(() => vm.runInContext('dispatch("service",{unit:"ssh.service",action:"stop",confirm:true})', context));
  assert.throws(() =>
    vm.runInContext('dispatch("install",{packages:["--allow-unauthenticated"],confirm:true})', context),
  );
});

test('nginx toggle rejects invalid flags before accessing system files', () => {
  assert.throws(() =>
    vm.runInContext('dispatch("nginx-toggle",{domain:"app.example.com",enabled:"yes",confirm:true})', context),
  );
  assert.throws(() =>
    vm.runInContext('dispatch("nginx-toggle",{domain:"app.example.com",enabled:true,confirm:false})', context),
  );
});

test('app restart uses a fixed delayed service command and rejects other operations', () => {
  for (const input of [{unit:'tastedev-linux.service',action:'stop',confirm:true},{unit:'tastedev-linux.service',action:'restart',confirm:false},{unit:'tastedev-linux.service',action:'restart',confirm:true,command:'reboot'}])
    assert.throws(()=>vm.runInContext(`dispatch("service",${JSON.stringify(input)})`,context));
  vm.runInContext('var savedRestartRun=run; var restartCall; run=(...args)=>{restartCall=args;return "";}',context);
  try {
    const result=vm.runInContext('dispatch("service",{unit:"tastedev-linux.service",action:"restart",confirm:true})',context);
    assert.equal(result.scheduled,true);
    assert.deepEqual(JSON.parse(JSON.stringify(context.restartCall)),['/usr/bin/systemd-run',['--quiet','--collect','--unit=tastedev-linux-app-restart','--on-active=3s','--timer-property=AccuracySec=1s','/usr/bin/systemctl','--no-ask-password','restart','tastedev-linux.service'],10000]);
  } finally { vm.runInContext('run=savedRestartRun;',context); }
});

test('standard daemon control checks real load state before any service mutation',()=>{
 vm.runInContext('var savedDaemonRun=run;var daemonCalls=[];var daemonLoad="not-found";run=(binary,args,timeout)=>{daemonCalls.push([binary,args,timeout]);if(args[0]==="show")return daemonLoad+"\\n";return "";};',context);
 try{
  for(const unit of ['nginx.service','cron.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service']){
   for(const state of ['not-found','error','masked','unknown','']){
    context.daemonLoad=state;context.daemonCalls=[];
    assert.throws(()=>vm.runInContext(`dispatch('service',${JSON.stringify({unit,action:'restart',confirm:true})})`,context),/로드되지 않았습니다/);
    assert.equal(context.daemonCalls.length,1);assert.equal(context.daemonCalls[0][1][0],'show');
   }
   context.daemonLoad='loaded';context.daemonCalls=[];
   assert.equal(vm.runInContext(`dispatch('service',${JSON.stringify({unit,action:'restart',confirm:true})})`,context).changed,true);
   assert.deepEqual(JSON.parse(JSON.stringify(context.daemonCalls[0])),['/usr/bin/systemctl',['show',unit,'--property=LoadState','--value','--no-pager','--no-ask-password'],5000]);
   assert.equal(context.daemonCalls.at(-1)[1][1],'restart');assert.equal(context.daemonCalls.at(-1)[1][2],unit);
   if(unit==='nginx.service')assert.deepEqual(JSON.parse(JSON.stringify(context.daemonCalls[1][1])),['-t']);
  }
 }finally{vm.runInContext('run=savedDaemonRun;',context);}
});
