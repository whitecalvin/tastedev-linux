# 수동 DB 설정 백업: 실제 helper/Next.js 연동 — 2026-10-06

검증 명령: `node scripts/verification/database-backup-isolated.mjs --next-build /tmp/tastedev-current-build-sqaVje`.

현재 증거: `.runtime/verification/database-backup-isolated-2026-10-06T00-00-11.755Z/result.json`. 10개 검사 그룹 통과. 입력 소스와 빌드 snapshot hash가 같은지 검사한 뒤 실행했다.

user/PID/network namespace의 임시 `/usr/lib/tastedev-linux/scripts/admin`에 현재 helper, 명시적 runtime module closure 및 manifest를 복사했다. 실제 root ownership·manifest·kernel flock·본문 allowlist·새 백업 구현을 그대로 실행했다. 호스트에 helper를 설치하거나 sudo 규칙을 바꾸지 않았다. JSON의 installedHelperPathVerified는 이 임시 namespace 안의 패키지 경로에 한정한다.

Redis/MariaDB 각각 실제 helper의 정상 백업 생성, 0600 기록/0700 저장소, 기존 catalog 조회, 한글 원본 bytes 보존을 확인했다. stale version·확인 누락·draft text·임의 저장소/파일 요청을 helper가 별도로 거부하며 실패 때 백업 목록이 늘어나지 않음을 확인했다.

동일 namespace에서 현재 컴파일된 Next.js 서버와 실제 Better Auth 임시 계정을 사용했다. HTTP 로그인 뒤 실제 보안 파일의 readOnly/databaseChanges/sudoWithoutPrompt 차단, 미인증·다른 Origin 차단, API→helper 백업 생성과 catalog GET, draft 주입 및 stale 거부를 확인했다. 실제 audit 파일의 requested/completed/failed/blocked 기록이 존재하고 설정 내용/fixture 비밀번호가 들어가지 않음도 확인했다.

sudo transport만 명시적 fixture adapter다. helper 코드는 변경하지 않았다. 운영 설정 변경/서비스 제어는 없었고 실제 시스템 sudo 허용 및 DB 기동·재시작, browser GUI 수용 흐름을 검증한 것은 아니다. host 서비스를 대신 실행하는 adapter도 없으며 service command 실행이 없음을 sentinel로 확인했다.

최초 시도는 read-only host `/etc`에 존재하지 않는 `/etc/redis` mount point를 만들 수 없어 실행 전에 실패했다. `/etc`를 namespace 전용 tmpfs로 만들어 재개했다. 첫 실패 증거는 보존했다. 정상 종료 시 임시 Next.js를 종료하고 fixture 디렉터리를 삭제했다. DEB 검증은 수행하지 않았다.
