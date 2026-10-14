import test from 'node:test';
import assert from 'node:assert/strict';
import {postgresqlHbaExecutionMessage} from '../lib/postgresql-hba-sandbox.ts';
test('observed bwrap namespace denial is explained separately from timeout',()=>{
 const actual='bwrap: No permissions to create a new namespace, likely because the kernel does not allow non-privileged user namespaces. See <https://deb.li/bubblewrap>.';
 assert.match(postgresqlHbaExecutionMessage({stderr:actual}),/실행할 권한이 없습니다/);
 assert.match(postgresqlHbaExecutionMessage({stderr:'bwrap: setting up uid map: Operation not permitted'}),/컨테이너 보안 정책/);
 assert.match(postgresqlHbaExecutionMessage({stderr:actual,timedOut:true}),/시간이 초과/);
});
test('native diagnostics and configuration secrets never become user error messages',()=>{
 for(const stderr of ['private-password=secret', 'postgres: configuration private-detail failed',null]){
   const message=postgresqlHbaExecutionMessage({stderr});
   assert.match(message,/설정 구문/);assert.doesNotMatch(message,/private|secret/);
 }
 assert.match(postgresqlHbaExecutionMessage({spawnFailed:true}),/설치와 실행 권한/);
});
