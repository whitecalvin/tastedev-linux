# 최신 Next.js → 실제 helper 오류 전달

2026-10-06. 현재 365개 소스 운영 빌드 `/tmp/tastedev-current-build-ZE6WvE`에서 확인했다. 복사 전후 SHA-256 동일, 빌드 성공. 증거: `.runtime/verification/source-build-2026-10-06T01-47-24.435Z/result.json`.

격리 user/PID/network namespace의 tmpfs rootfs에 실제 전용 helper 경로 `/usr/lib/tastedev-linux/scripts/admin/linux-admin`과 검토한 runtime manifest를 배치했다. sudo 호출만 동일 helper로 전달하는 fixture adapter이며 실제 호스트 sudo·운영 서비스는 변경하지 않았다. 인증된 Next.js HTTP 요청으로 다음을 확인했다.

- Redis 코드 원본 버전 충돌: 409와 공개 충돌 메시지. NOPASSWD 오류 접두어 없음.
- Redis 실행 파일 없는 rootfs: 400과 패키지 설치 상태 안내.
- 검토된 공식 Redis 8.0.5 binary를 rootfs에만 넣은 경우: 실제 중첩 namespace 프로브 실패가 503과 공개 격리 환경 안내로 전달됨. Redis 기동 성공을 뜻하지 않음.
- 기존 Redis/MariaDB 파일 백업·목록·정책 차단·세션/외부 Origin 차단·오류 감사 기록 및 비밀 설정 내용 미포함.
- 원본 설정 보존, 임시 검수 runtime 정리, 서비스 제어 명령 미실행.

binary 없는 실행 12개 검사 그룹: `.runtime/verification/database-backup-isolated-2026-10-06T01-49-24.893Z/result.json`. binary 있는 실행 13개 검사 그룹: `.runtime/verification/database-backup-isolated-2026-10-06T01-50-11.405Z/result.json`. 확인 후 Next.js·namespace·임시 계정·설정·백업 저장소를 정리했다.

## 수정 및 검증 중 발견한 사항

설치용 파일 목록은 helper의 mariaModules와 scripts/admin/runtime-files.mts 두 곳이었다. 앞선 변경은 helper 목록만 추가해 설치 소스 복사 목록이 빠져 있었다. 두 목록을 일치시켰으며 실제 helper manifest 통과와 오류 반환으로 연동을 확인했다. 검사도 두 목록의 일치 및 모든 정적 local module 의존성을 함께 확인하도록 보완했다(관련 6개 검사 성공).

첫 연동 실행은 rootfs의 루트가 호스트 root 소유 inode를 공유해 namespace 안에서 소유권 검사를 통과하지 못했다. 실패 기록 `.runtime/verification/database-backup-isolated-2026-10-06T01-48-14.739Z/result.json`을 보존했다. 이후 tmpfs 루트로 올바른 namespace 소유권을 구성했다. systemctl fixture sentinel도 조회와 start/stop/restart/reload/enable/disable 제어를 구분하도록 고쳤다. 실제 제어 호출 여부 검사 강도를 낮추지 않았다.

배포 패키지 검사, 호스트 Redis 설치, 실제 운영 서비스 제어는 수행하지 않았다. Redis 실제 기동 검수는 중첩 namespace 제약으로 계속 남아 있다.
