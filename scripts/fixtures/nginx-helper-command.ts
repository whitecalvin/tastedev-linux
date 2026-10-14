import assert from 'node:assert/strict';
import {readFileSync,existsSync,unlinkSync} from 'node:fs';
import {basename} from 'node:path';
import {execFileSync} from 'node:child_process';

assert.equal(process.getuid?.(),0);
assert.match(readFileSync('/proc/self/uid_map','utf8').trim(),/^0\s+\d+\s+1$/);
const name=basename(process.argv[1]??''),args=process.argv.slice(2),root='/mnt/data/build/tastedev-linux';
if(name==='sudo'){
 const helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin';
 const allowed=['nginx-site-plan','nginx-site-apply','nginx-site-recovery','nginx-site-recover','nginx-config-apply','nginx-config-restore','nginx-context-inspect','nginx-config-backups','nginx-config-restore-plan','nginx-check','nginx-config-backup','nginx-recovery-plan'];
 if(args.length!==4||args[0]!=='-n'||args[1]!=='--'||args[2]!==helper||!allowed.includes(args[3]))process.exit(2);
 try{execFileSync('/usr/bin/node',[helper,args[3]],{stdio:'inherit'});}
 catch(error){process.exit(error!==null&&typeof error==='object'&&'status' in error&&typeof error.status==='number'&&error.status>0?error.status:1);}
}else if(name==='systemctl'){
 const equal=(expected:string[])=>JSON.stringify(args)===JSON.stringify(expected);
 if(equal(['--no-ask-password','show','nginx.service','--property=LoadState,ActiveState,MainPID','--no-pager']))process.stdout.write('LoadState=loaded\nActiveState=active\nMainPID='+readFileSync(root+'/nginx-fixture.pid','utf8').trim()+'\n');
 else if(equal(['show','nginx.service','--property=ActiveState,SubState,LoadState,UnitFileState,Description','--no-pager'])){
  const active=existsSync(root+'/nginx-fixture.pid');process.stdout.write('ActiveState='+(active?'active':'inactive')+'\nSubState='+(active?'running':'dead')+'\nLoadState=loaded\nUnitFileState=static\nDescription=isolated nginx fixture\n');
 }else if(equal(['--no-ask-password','reload','nginx.service'])){
  if(existsSync(root+'/inject-reload-failure')){unlinkSync(root+'/inject-reload-failure');process.exit(1);}
  execFileSync('/usr/sbin/nginx',['-s','reload'],{stdio:'inherit'});
 }else{process.stderr.write('unsupported isolated systemctl request');process.exit(2);}
}else throw Error('지원하지 않는 검수 명령입니다.');
