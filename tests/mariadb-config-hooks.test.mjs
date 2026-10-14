import test from 'node:test';
import assert from 'node:assert/strict';
import {mariadbConfigHooks} from '../lib/mariadb-config-hooks.ts';
const target='/etc/mysql/mariadb.conf.d/50-server.cnf',candidate='/etc/mysql/mariadb.conf.d/.tastedev-config-12345678-1234-1234-1234-123456789abc';
test('MariaDB hooks detect native validation and filter defaults without exposing secrets',async()=>{
 const calls=[];const hooks=mariadbConfigHooks(target,{port:3307,bufferPool:256,slowLog:false},async(binary,args)=>{calls.push([binary,args]);if(args[0]==='--no-defaults')return '  --validate-config  Validate settings\n';if(binary==='/usr/bin/my_print_defaults')return '--password=private\n--port=3307\n--innodb-buffer-pool-size=256M\n--skip-slow-query-log\n';return '';});
 assert.equal((await hooks.preflight()).validationMode,'configuration');await hooks.validate(candidate);
 assert.deepEqual(calls[2],['/usr/sbin/mariadbd',['--defaults-file='+candidate,'--validate-config']]);await hooks.activate();await hooks.recover();assert(calls.filter(([,args])=>args.includes('restart')).every(([,args])=>args.at(-1)==='mariadb.service'));
});
test('older MariaDB help validation has a distinct mode and requested values are still checked',async()=>{
 const calls=[];const hooks=mariadbConfigHooks(target,{port:3307},async(binary,args)=>{calls.push([binary,args]);return binary==='/usr/bin/my_print_defaults'?'--port=3307\n':'';});
 assert.equal((await hooks.preflight()).validationMode,'options-help');await hooks.validate(candidate);assert.deepEqual(calls[2][1],['--defaults-file='+candidate,'--verbose','--help']);
 const mismatch=mariadbConfigHooks(target,{port:3307},async binary=>binary==='/usr/bin/my_print_defaults'?'--port=3306\n':'');await mismatch.preflight();await assert.rejects(mismatch.validate(candidate),/실제 값이 요청한 값과 다릅니다/);
});
test('MariaDB hooks reject arbitrary paths, injected values and validation without preflight',async()=>{
 assert.throws(()=>mariadbConfigHooks('/tmp/config.cnf',{port:3307},async()=>''));assert.throws(()=>mariadbConfigHooks(target,{charset:'utf8mb4\n!include /tmp/x'},async()=>''));
 const hooks=mariadbConfigHooks(target,{port:3307},async()=> '');await assert.rejects(hooks.validate(candidate),/지원 옵션을 먼저 확인/);await hooks.preflight();await assert.rejects(hooks.validate('/tmp/config.cnf'),/후보 설정 파일의 경로/);
});
