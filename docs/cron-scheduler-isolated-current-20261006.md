# cron 예약 실행 격리 검사

2026-10-06

`npm run verify:cron:scheduler:isolated` 도구를 추가했다. 호스트의 예약 목록·서비스·PAM 설정을 변경하지 않고 격리된 spool/PID/network와 namespace root 계정으로 실제 cron 데몬을 실행한다. 앱에서 생성한 분 단위 두 작업의 환경 범위 및 비활성 작업의 미실행을 검사한다. PAM은 fixture permit 정책이며 설치 PAM 수용 검사에 해당하지 않는다.

현재 결과는 BLOCKED다. daemon 로그에서 실제 분 단위로 두 작업을 선택하는 것까지 확인했으나 `do_command:initgroups(0) failed: Operation not permitted` 때문에 shell 실행에 실패했다. 일반 사용자 user namespace의 그룹 변경 제한이며 예약 실행 성공으로 기록하지 않는다. 호스트 보안 제한을 해제하지 않았다. 실행/로그 수집 프로세스와 임시 fixture는 종료·정리됐다.

증거: `.runtime/verification/cron-scheduler-isolated-2026-10-05T20-50-06.716Z/result.json`

진단 후 도구는 initgroups 오류를 발견하면 빠르게 종료하도록 개선했고 빈 시스템 crontab fixture의 권한도 0600으로 명시했다. 이 변경 후 동일한 권한 제한의 검사는 반복하지 않았다. 그룹 설정이 가능한 승인된 격리 장비에서 예약 실행 수용 검사가 남아 있다. 이전 인증 HTTP/native crontab 21개 검사는 이 실패와 별도다.

## 후속 검사: 103 장비의 임시 컨테이너

2026-10-06 로컬 namespace에 CAP_SETGID를 추가한 후에도 실제 cron의 initgroups가 거부됐다. 실패 증거 `.runtime/verification/cron-scheduler-isolated-2026-10-06T03-57-01.913Z/result.json`를 보존한다. 로컬 Docker daemon도 실행되어 있지 않았다. 이를 예약 실행 성공으로 변경하지 않았다.

사용자가 지정한 192.168.0.103의 기존 Docker 환경에서 공개 node:22-bookworm-slim을 기반으로 cron만 추가한 임시 이미지를 생성했다. 프로젝트 소스·helper·계정 비밀은 전송하지 않았다. 전송한 payload는 로컬 앱의 cronEntry/updateCron이 만든 합성 예약 문자열 및 해당 결과만 검사하는 독립 실행 코드다.

검사 컨테이너는 호스트 마운트와 네트워크 없이 실행하며 no-new-privileges, PID 64개/메모리 256MB 제한 및 SETUID/SETGID/CHOWN/DAC_OVERRIDE/AUDIT_WRITE capability만 사용했다. 호스트 crontab·cron 서비스·sudo 설정은 변경하지 않았다. 실제 Debian cron 3.0pl1-162와 crontab을 사용했다.

실제 두 번의 분 경계에서 97초 동안 확인한 결과:
- 앱 생성 예약을 native crontab이 수용하고 정확히 조회한다.
- 두 작업이 실제로 실행되며 각각 앞서 선언된 MODE 값을 사용한다.
- 처음부터 비활성화한 작업은 실행되지 않는다.
- cron이 편집한 crontab을 다시 읽고 바뀐 명령을 실행한다.
- 기존 첫 작업을 끄면 다음 예약 시각에는 해당 출력 파일이 변경되지 않는다.
- 편집한 두 번째 작업의 환경 범위가 유지된다.

증거 `.runtime/verification/cron-scheduler-container-2026-10-06T04-00-23.524Z/result.json`에 이미지 ID, cron/crontab SHA, 버전, 앱 생성 함수 소스 SHA와 합성 예약 SHA를 기록했다. 별도 기존 cron/UI/환경/잠금 검사 33개도 통과했다. 임시 컨테이너는 --rm 및 종료 정리되었고, 검사용 이미지 태그와 이미지 516f38862e7f 및 중간 이미지 1c16991c0d15도 삭제했다. 기본 Node/PostgreSQL 이미지와 사용자 컨테이너는 보존했다.

검사 도구 `scripts/verification/cron-scheduler-container.mjs`는 호스트/이미지/키 경로를 명시하는 CRON_VERIFY_HOST, CRON_VERIFY_IMAGE, CRON_VERIFY_IDENTITY가 필요하다. 이미지가 없으면 자동 설치하지 않는다. 첫 도구 실행의 템플릿 문자열 오류는 원격 컨테이너 실행 전에 발생했고 수정 후 재실행했다.

이 검사는 실제 daemon 실행 증거다. 이전 GUI/API 검사는 별도 증거이며 이번 컨테이너에서는 앱 GUI/API를 구동하지 않았다. 실제 설치 앱 계정의 spool/setgid/PAM 및 GUI→설치 daemon 전체 연동은 여전히 별도 남아 있다.
