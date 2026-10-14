const messages = new Set([
  '서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.',
  '서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.',
  '서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.',
  '서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.',
  '서비스 상태를 확인할 수 없습니다.',
  'PostgreSQL 설정 목록을 읽을 수 없습니다.',
  '서비스 상태를 조회할 수 없습니다. systemd 연결과 조회 권한을 확인하세요.',
]);

export function serviceStatusMessage(error:unknown):string {
  if (typeof error==='string'&&messages.has(error)) return error;
  if (typeof error === 'string' && error.includes('spawn /usr/bin/systemctl ENOENT'))
    return '시스템 서비스 관리 도구(systemctl)가 설치되어 있지 않아 상태를 조회할 수 없습니다.';
  return '서비스 상태를 조회할 수 없습니다. 시스템 서비스 관리자와 실행 권한을 확인하세요.';
}
