# 관리자 작업 오류 전달

2026-10-06. 전용 helper가 실패 시 protocol/action/status/message 구조를 stderr에 출력하고, 앱의 runHelper가 검증 후 원래 HTTP 오류 상태를 보존한다. 기존에는 helper의 모든 nonzero 종료를 NOPASSWD 권한 실패(403)로 포장했다. 이제 선언된 입력 오류 400·권한 403·대상 없음 404·충돌 409·422·복구/내부 오류 500·환경 오류 503을 구분한다. helper의 기본 입력 거부는 400, root 계정 요구는 403이다.

일반 native 프로세스 exit status나 선언되지 않은 오류는 원시 명령·출력을 반환하지 않고 공통 500 안내로 처리한다. 메시지는 최대 2000 UTF-8 bytes이며 줄바꿈·NUL은 공통 안내로 대체한다. transport는 등록된 작업과 정확히 일치하는 action/protocol/schema만 허용하며 stderr는 4096 bytes로 제한한다. StringDecoder로 조각난 한글을 보존한다. 구형 plaintext helper/sudo 오류 처리 경로는 유지한다.

지난 Redis 오류 구분 변경의 새 redis-validation-error.ts가 설치용 mariaModules 목록에서 빠져 있었다. 목록에 추가하고, 등록된 전체 runtime module의 정적 local import/export 의존성이 빠짐없이 목록에 있는지 검사했다. 소스 의존성 검사이며 배포 패키지 검사를 실행하지 않았다.

실제 일반 사용자 helper 프로세스가 시스템 디렉터리 생성 전에 Root required/403을 반환했다. 실제 runHelper 코드의 파일 무결성 검사와 sudo 실행은 fixture adapter로 바꾸고, 실제 일반 사용자 자식 프로세스로 409/503 및 한글 byte 분할 stderr 전달을 확인했다. 관련 고유 검사 27개 성공. 증거: `.runtime/verification/helper-error-protocol-20261006/result.json`.

설치된 root helper, sudo, 운영 서비스는 변경하지 않았다. 실제 설치 helper/HTTP 전체 수용과 최종 배포 확인은 남아 있다. 새 공통 안내는 기존 11개 외국어 카탈로그 모두에 추가했다(현재 각 1454개 문구).

후속 실제 API 연동에서 설치 소스 복사 목록의 별도 누락도 발견해 수정했다. 두 목록의 일치 검사와 실제 manifest/HTTP 전달 확인은 `docs/helper-error-api-isolated-current-20261006.md`에 기록했다.
