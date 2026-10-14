# 현재 회귀 및 기존 cron 예약 호환성

현재 소스 회귀 1,264개 중 1,239개 통과·25개 실패·미실행 없음. 키 사용 결정이 필요한 AI 의존 검사 3개는 실행 목록에서 제외해 별도 기록했다. 배포 빌드/검증 명령은 실행하지 않았다. 결과는 `.runtime/verification/current-regression-audit-20261007/result.json`, 로그는 같은 디렉터리의 `test.log`다.

실패 중 관리자 검사는 기대하는 `scripts/admin/linux-admin`이 없고 실제 파일이 `scripts/admin/linex-admin`인 상태다. 사용자 담당 명칭 변경을 대신 수행하지 않았다. 일본어/터키어 설명 누락은 한국어 개발 후 다국어 확장 단계에 남겼다. 전체 성공으로 표시하지 않는다.

cron은 이전 버전 예약 표시에 대한 정규식과 수정/삭제 목록이 현재 표시로 중복되어 있었다. 기존 `# LINEX:`를 읽고 정확히 한 예약만 수정/삭제하며 새 저장은 `# LINUX:`를 사용하도록 복구했다. 같은 이름의 이전/현재 표시가 중복되면 계속 거부한다. 현재 제품명·환경변수·파일명은 변경하지 않았다.

수정 후 관련 검사 35개 통과. 실제 crontab의 `-n` 문법 검사로 기존·편집·삭제된 자체 파일 3개를 확인했다. 운영 crontab은 설치/변경/삭제하지 않았다. 결과 `.runtime/verification/cron-legacy-compatibility-20261007/result.json`과 `native-syntax.json`에 코드/바이너리 hash 및 명령 범위를 보관했다. 이 결과가 수정 전 전체 회귀 결과를 대체하지는 않는다.

개발 포트 8787·8792가 연결 거부 상태임을 확인해 프로젝트의 `npm run dev`를 다시 실행했다. 8787의 한국어 로그인 HTML이 HTTP 200으로 응답하며 이전 인증 저장 경로 오류가 없는 것을 확인했다. 결과 `.runtime/verification/development-server-20261007/result.json`. 실제 개발 서버는 유지한다. 보호 화면 로그인 및 세션 만료 수용은 기존 별도 증거와 구분한다.
