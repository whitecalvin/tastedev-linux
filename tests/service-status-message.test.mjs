import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceStatusMessage} from '../lib/service-status-message.ts';

test('service lookup explains timeout, interruption and permission failures directly',()=>{
  for(const message of [
    '서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.',
    '서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.',
    '서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.',
    'PostgreSQL 설정 목록을 읽을 수 없습니다.',
  ]) assert.equal(serviceStatusMessage(message),message);
});

test('unknown process diagnostics are kept out of the primary user message',()=>{
  const fallback='서비스 상태를 조회할 수 없습니다. 시스템 서비스 관리자와 실행 권한을 확인하세요.';
  for(const error of ['Command failed: systemctl\nTOKEN=private-value',undefined,null,{}])
    assert.equal(serviceStatusMessage(error),fallback);
  assert.equal(serviceStatusMessage('spawn /usr/bin/systemctl ENOENT'),
    '시스템 서비스 관리 도구(systemctl)가 설치되어 있지 않아 상태를 조회할 수 없습니다.');
});
