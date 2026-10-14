# PostgreSQL 수동 설정 백업 — 2026-10-06

GUI IDE에서 선택한 `postgresql.conf`의 백업 팝업에 테두리 없는 현재 파일 백업 아이콘을 연결했다. 요청은 선택 경로와 운영 원본 SHA-256만 전달하며 편집 초안을 전달하지 않는다. 생성 후 해당 클러스터 백업 목록만 다시 조회한다.

`postgresql-config-backup` API는 로그인, 동일 출처, databaseChanges 및 sudo 사용 정책을 검사한다. 권한 helper는 운영 설정 include 그래프를 읽고 기존 그래프 복원과 호환되는 비공개 보관 파일과 메타데이터를 생성한다. 원본과 include 파일, 실행 클러스터 식별자가 변경되면 메타데이터 발행을 거부한다. 서비스 제어와 후보 설정 검수는 호출하지 않는다. 실패도 감사 이벤트에 기록한다.

현재 백업은 식별 검증된 실행 중인 PostgreSQL 클러스터가 필요하다. 정지된 클러스터 지원과 설치된 최신 helper를 통한 운영 GUI 실행은 아직 확인하지 않았다. 개발 소스 구현을 운영 배포 완료로 판단하지 않는다.

검증: 29개 관련 검사 통과. 실제 임시 설정 파일·include·비공개 파일 권한·그래프 아카이브를 검사했고 서비스 식별 조회만 fixture로 대체했다. API 인증/출처/권한, 초안 비전송, stale 원본 거부, include 변경 거부, 기존 코드 적용·롤백·아카이브 회귀 및 helper 런타임 모듈 목록을 포함한다. 실제 서버 설정·서비스와 배포 패키지는 변경하지 않았다.

실행:

```sh
node --test --test-isolation=none tests/postgresql-config-backup.test.mjs tests/package-config-ide-render.test.mjs tests/postgresql-backup-scope.test.mjs tests/admin-runtime.test.mjs tests/postgresql-code-operation.test.mjs tests/postgresql-graph-archive.test.mjs tests/postgresql-code-api.test.mjs tests/admin-helper.test.mjs
```
