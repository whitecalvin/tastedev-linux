# Redis·MariaDB 수동 설정 백업 — 2026-10-06

공통 IDE의 백업 조회 팝업에 테두리 없는 현재 파일 백업 아이콘을 연결했다. Redis는 복원 기능이 지원하는 `/etc/redis/redis.conf`를, MariaDB는 기존 helper 복원 allowlist의 main 또는 conf.d/mariadb.conf.d 설정을 대상으로 한다. 선택 파일이 없으면 수동 백업 버튼은 표시하지 않는다. MariaDB main/include 전체 그래프 및 DB 데이터의 백업은 아니다.

새 API/helper actions는 `redis-config-backup`, `mariadb-config-backup`이다. 로그인·Origin·databaseChanges·sudo 정책을 적용하고 requested/completed/failed/blocked를 기록한다. request는 path/version/confirm만 허용하며 초안 text, root, backupRoot, ownerUid 등 클라이언트 지정은 거부한다. helper 내부에서는 권한과 경로를 다시 검증한다. 운영 파일 또는 서비스는 수정·시작하지 않는다.

`database-config-backup.ts`는 일반 파일·소유자·쓰기 권한·UTF-8·조회 버전 및 읽기 중 파일 identity를 확인한다. 기존 변경/중단 기록과의 충돌을 차단하고 private 0700 저장소 안에 0600 임시 기록을 작성·fsync한 뒤 파일 버전/identity를 재검사한다. 배타적 link 공개·임시 이름 제거·디렉터리 fsync 뒤 목록에 나타난다. 내용은 기존 복원-compatible JSON에만 보관하며 API 응답은 메타데이터와 selected-operating-file 범위를 반환한다. Redis 기존 backup reader로 실제 생성 기록 조회도 확인했다.

등록된 helper action의 브라우저 권한 라벨에 누락돼 있던 PostgreSQL 수동 백업도 추가했다. 기존 10개 전체 번역 카탈로그와 터키어 부분 카탈로그에 6개 라벨/오류 문구를 추가했다. 기존 운영 sudo 규칙이나 설치 helper는 변경하지 않았다. 배포 후 새 action은 사용자 권한 정책에서 허용돼야 한다.

검사 46개 통과:
- 실제 임시 파일 백업·private mode·원본 보존·동시 파일 교체·stale version·symlink/hardlink·쓰기 가능한 source·unsafe backup directory·invalid UTF-8 거부 및 helper/sudo metadata 검사 17개.
- 실제 JSX/SWC GUI 진입·중복 클릭 잠금·목록 갱신·복원 갱신 실패 결과 보존·API 인증/Origin/정책 및 payload·helper module closure·언어 회귀 29개.

처음 기본 샌드박스에서는 `/tmp` 소유자가 nobody로 표시되어 파일 권한 검사가 차단됐다. 보안 검사를 완화하지 않고, 자동 승인된 외부 실행 환경에서 임시 fixture만 사용하는 검사 17개를 수행했다. fixture는 제거했으며 운영 파일·서비스·sudo 설정을 변경하지 않았다.

359개 소스 Next.js 빌드 성공: `.runtime/verification/source-build-2026-10-05T23-56-17.591Z/result.json`. 빌드 중 소스 변경 없음. 실제 설치된 root helper, 브라우저 수용 흐름, DB 재시작/복구 또는 최종 배포 완료의 증거는 아니다. DEB 검증은 실행하지 않았다.
