import test from 'node:test';
import assert from 'node:assert/strict';
import {mariadbServiceScope} from '../lib/mariadb-service-scope.ts';
const root='/etc/mysql/mariadb.cnf',canonical=value=>value==='/etc/mysql/my.cnf'?root:value;
test('MariaDB service scope distinguishes explicit main from the default main assumption without exposing argv',()=>{
 const explicit=mariadbServiceScope(root,['/usr/sbin/mariadbd','--defaults-file=/etc/mysql/my.cnf','--user=mysql'],canonical);assert.equal(explicit.mode,'explicit-main');assert.equal(explicit.main,root);assert(!Object.hasOwn(explicit,'argv'));
 const assumed=mariadbServiceScope(root,['/usr/sbin/mariadbd','--wsrep_start_position=1234-abcd:-1'],canonical);assert.equal(assumed.mode,'default-main-assumed');assert.match(assumed.notice,/별도 확인/);
});
test('MariaDB service scope rejects differing mains, extra defaults, overrides and secret-bearing unknown flags',()=>{
 for(const args of [['--defaults-file=/etc/mysql/my.cnf'],['--defaults-extra-file=/etc/mysql/private.cnf'],['--port=3308'],['--no-defaults'],['--defaults-group-suffix=private'],['--password=private-secret'],['--defaults-file'],['--user=root']])assert.throws(()=>mariadbServiceScope(root,['/usr/sbin/mariadbd',...args],value=>value),error=>error.status===409&&!error.message.includes('private-secret'));
 for(const invalid of [null,{},false])assert.throws(()=>mariadbServiceScope(root,['/usr/sbin/mariadbd'],()=>invalid),{status:409});
 assert.throws(()=>mariadbServiceScope(root,['/tmp/mariadbd'],canonical));assert.throws(()=>mariadbServiceScope(root,['/usr/sbin/mariadbd','--defaults-file='+root,'--defaults-file='+root],canonical));
});
