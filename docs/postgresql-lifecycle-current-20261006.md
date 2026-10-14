# PostgreSQL 실제 기동·설정 복구 준비 (2026-10-06)

`scripts/verification/postgresql-lifecycle.mjs`를 추가했다. 기존 로컬 Docker Desktop의 PostgreSQL 16 이미지 ID를 고정해, 호스트 마운트·포트 공개 없이 네트워크 none 및 read-only 컨테이너와 임시 tmpfs에서만 실행하도록 작성했다. 컨테이너 PostgreSQL 계정과 Unix 소켓을 사용한다.

예정 검사 흐름은 원본 설정 기동→fixture 데이터 생성→앱 `patchConfig` 후보 설정 적용 후 재기동→잘못된 설정의 기동 거부→원본 설정 복구 후 재기동·데이터 확인→정상 종료다. 운영 systemctl·root helper·설치 GUI 검증은 이 도구 범위가 아니다. 실행 파일 버전·SHA-256과 이미지 ID는 성공 실행 시 실제 출력으로 기록한다.

현재 실행 결과는 BLOCKED다. 로컬 Desktop 소켓 `/home/whitecalvin/.docker/desktop/docker.sock`가 없어 기존 이미지를 확인할 수 없다. 별도 읽기 전용 Docker 확인도 같은 소켓 부재를 보고했다. DB 기동 및 컨테이너 실행 시도까지 도달하지 않았으며 데몬이나 운영 서비스를 시작하지 않았다. 도구 문법 검사는 성공했지만 실제 기동 로직이 검증됐다는 의미는 아니다.

증거: `.runtime/verification/postgresql-lifecycle-2026-10-05T22-40-50.205Z.json`.
재개 명령: `node scripts/verification/postgresql-lifecycle.mjs` (프로젝트 디렉터리에서, 기존 로컬 Docker Desktop 실행 후).

## 현재 로컬 PostgreSQL 18 경로

Docker 경로와 별도로 현재 장비의 PostgreSQL 18.6 바이너리를 사용하는 `npm run verify:postgresql:local`을 추가했다. 일반 UID 1000으로 새 `/tmp/tastedev-pg-local-*` 클러스터를 만들며 TCP listen을 비우고 전용 Unix 소켓만 사용한다. 운영 DB·패키지·systemd는 변경하지 않는다.

앱의 실제 `patchConfig`와 `configTransaction`으로 후보 적용·자동 백업·잘못된 설정의 교체 전 차단·활성화 실패 주입 후 원본 복구 및 실제 DB 재기동·백업 내용 복원을 확인했다. 각 기동 후 실제 SQL로 설정값과 한글 데이터 보존을 확인했다. 최종 정상 종료와 임시 파일 제거도 완료했다. 최초 sandbox 실행은 기동 단계에서 실패했다. 격리 해제 실행의 첫 실패는 검증 어댑터가 이미 중지된 DB에 다시 stop을 호출한 문제였으며, 상태를 조회하고 실행 중일 때만 중지하도록 수정한 뒤 통과했다.

최종 증거: `.runtime/verification/postgresql-local-lifecycle-2026-10-05T23-23-12.690Z.json`. 실행 파일 SHA-256: `30a38e0516ec1bde4b8ca710cf28ba51ee78bd004cabbf3107e7a52d5414a64a`.

이 증거는 설정 교체 primitive와 실제 DB의 연결을 증명한다. 패키지 권한 helper·전체 PostgreSQL 코드 검토/적용 API·GUI·systemd 및 그래프 복원 수용 검사는 아직 증명하지 않는다. 기존 Docker 경로의 BLOCKED 기록은 그대로 보존한다.

## 검토 coordinator와 실제 namespace 검수 연결

이후 `npm run verify:postgresql:local -- --reviewed` 경로를 추가하고 확인했다. 실제 `postgresqlCodeOperationPlan` → `applyPostgresqlCodeOperation` 및 `postgresqlCodeRestorePlan` → `restorePostgresqlCode`를 사용한다. 후보와 백업 그래프는 실제 `inspectPostgresqlConfiguration` / `inspectPostgresqlGraphArchive` 및 bwrap namespace의 PostgreSQL `-C` 명령으로 검수한다. 검수 계정은 임시 파일 소유자인 UID/GID 1000이며 설치 helper의 별도 검수 계정 경로를 증명하지 않는다.

실행 중인 설정은 전용 Unix 소켓의 SQL로 조회한다. 실제 config/data/HBA 경로와 postmaster PID/start, auto.conf의 실제 버전을 확인한 뒤 검증 어댑터에서 패키지의 논리 경로 `/etc/postgresql/18/fixture/postgresql.conf` 및 unit으로 매핑한다. systemd 제어 대신 오직 이 임시 클러스터의 pg_ctl을 사용한다. 서버/설정 값을 가짜 성공 값으로 대체하지 않는다.

검토 중 설정과 DB 값이 그대로 유지되는지, 명시적 확인 누락·검토 후 코드 변경·DB 재기동 이후 오래된 service proof가 차단되는지 확인했다. 실제 설정 적용·원본/그래프 백업·잘못된 항목 거부·서비스 활성화 실패 주입 후 원본 및 DB 복구·원본 그래프 복원·각 단계 한글 데이터 보존까지 통과했다. 정상 종료와 fixture 제거도 확인했다.

최신 증거: `.runtime/verification/postgresql-local-lifecycle-2026-10-05T23-26-01.910Z.json` (7개 그룹). 이전 primitive 검사 증거는 이전 범위로 보존한다. 실제 privileged helper, systemd, Next.js/API 및 브라우저 GUI 연동 검사는 여전히 남아 있다.
