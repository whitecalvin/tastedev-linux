# PostgreSQL 데이터 백업·복원 실행기 — 2026-10-08

기존 PostgreSQL 백업은 설정 파일 대상이었다. 신규 내부 실행기는 데이터베이스별 pg_dump custom archive를 private 저장소에 생성하고, 검토한 동일 cluster system identifier/DB OID·이름·내용 해시로 pg_restore를 실행한다. 복원 전 현재 DB의 undo 백업을 별도로 보존한다. pg_restore --single-transaction --exit-on-error --clean --if-exists로 백업에 포함된 객체를 복원한다. 백업에 없던 추가 객체까지 삭제하는 전체 DB 재생성이나 역할/클러스터 전체 백업은 이 실행기의 동작이 아니다.

OS postgres 계정으로 기존 native 실행 파일을 직접 실행하며 shell·ambient PG/LD 환경·비밀번호를 상속하지 않는다. 백업 디렉터리/파일의 소유자·비공개 권한·심볼릭 링크·hardlink·내용 해시를 검사한다. 경로/접속 정보/UID는 브라우저 입력이 아니라 검증된 helper scope에서 제공해야 한다. 서비스와 DB identity 재검사는 필수 callback이다. raw stderr에 데이터가 포함될 수 있으므로 화면에 출력하지 않는다. 작업 timeout/출력 과다는 자식 그룹 종료로 처리한다.

103번에 현재 모듈을 전송하여 새 로컬 Unix socket 전용 PostgreSQL 16 클러스터에서 native 실행을 확인했다. 운영 클러스터에는 접속하지 않았다.

- 정상 게이트 5개: 한글 원본 custom dump, 잘못된 DB 확인의 변경 전 거부, 실제 데이터 2행→백업 원본 1행 복원, 자동 undo 백업으로 수정된 2행 재복원, archive 변조 차단.
- 별도 실패 게이트 2개: 실제 pg_restore 의존성 오류 때 원래 테이블/뷰/한글 데이터 보존, 복원 전 백업 보존/후속 검토.
- 파일/identity/동의/변조/링크/권한 회귀 3개 성공. Node test isolation에서는 파일 단위 보고만 나와 --test-isolation=none으로 개별 검사 결과를 확인했다.

증거 `.runtime/verification/postgresql-data-backup-20261008T111442Z/result.json`, `postgresql-data-backup-20261008T111609Z/result.json`. 두 검수 모두 현재 모듈 SHA-256 bb426d22d792e94d1c72be422d319b18120a7126b2b393ef875948a57752e76e. 전용 클러스터 종료 및 private stage 제거 확인. 실패 검수 준비의 Python 문자열 구문 오류는 원격 실행 전 발생했으며 수정 후 해당 게이트만 재개했다.

실행 오류의 트랜잭션 최종 상태는 unknown으로 반환한다. 연결이 COMMIT 시점에 끊겼을 때 원복을 추정하지 않으며 재조회가 필요하다. actual dependency failure에서는 독립 SQL 조회로 원본 데이터 보존을 확인했다.

아직 공개 helper action/runtime 등록·허용 schema/정책/잠금·감사 기록·작업 진행/GUI·GUI 오류 수용 검수에 연결하지 않았다. 현재 사용자가 실행하는 DB 백업 버튼이 추가된 상태는 아니다. 다음 작업은 이 내부 실행기를 검증된 서비스 scope와 API/GUI에 연결하는 것이다. MariaDB/Redis 데이터 백업과 다국어·전체 목표 완료를 의미하지 않는다. 최종 배포 패키지 검수는 수행하지 않았다.

설계 근거: https://www.postgresql.org/docs/current/app-pgdump.html 및 https://www.postgresql.org/docs/current/app-pgrestore.html.

## helper/API/GUI 연결 및 실제 수용 검수

현재 helper action 5개, 고정 서비스/DB 검토, 정책·전역 잠금·감사, 한국어 데이터 백업·복원 팝업을 연결했다. 스트리밍 native 작업도 root supervisor가 잠금을 유지하는 runuser 실행으로 변경했다. 이 실행기의 정상 native 5개는 `postgresql-data-backup-20261008T112430Z/result.json`에 기록했다. 이전 실행기 SHA의 실패 수용 결과를 현재 코드의 검수 결과로 취급하지 않는다.

첫 GUI 조회는 postmaster.pid의 MyStartTime과 pg_postmaster_start_time의 PgStartTime이 1초 달라 실패했다. 공식 PostgreSQL 18 소스에서 전자는 초기 프로세스 생성, 후자는 이후 postmaster 초기화에서 각각 기록한다. 임의 시간 허용 범위를 추가하지 않고 고정 읽기 전용 SQL로 서버의 postmaster.pid를 읽어 PID·data_directory·시작 기록·port를 실제 프로세스 metadata와 정확히 비교한다. 기존 executable/UID/socket 및 전후 동일 PID/start 확인은 유지한다. 서비스/DB context 회귀 8개 성공.

103 전용 PostgreSQL 18 클러스터에서 원래 GUI→Better Auth API→private 현재 helper→실제 pg_dump/pg_restore를 실행했다. GUI 백업 생성, 테스트 데이터 2행 변경, GUI 원본 1행 복원, 자동 복원 전 백업을 통한 2행 되돌리기를 독립 SQL 조회로 확인했다. 경고/콘솔 오류 없음, 로그아웃 후 로그인 페이지 이동, 전용 서버·클러스터·private stage 정리 확인. 설치된 helper는 교체하지 않았다. 증거: `.runtime/verification/postgresql-data-gui-20261008/result.json`, `restored.png`.

공식 근거: https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/postmaster/postmaster.c 및 https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/utils/init/miscinit.c .

현재 supervisor 실행기의 실패/중단 GUI 수용, MariaDB/Redis 데이터 백업 및 전체 제품 완료는 남아 있다. 최종 배포 검수는 수행하지 않았다.

## 현재 실행기의 실패 경로 및 GUI 오류 처리

현재 실행기 SHA `f5e350e90c61ce5c56c7835b737a53b278264bf520e9986aedfc25fbabd13559`로 103번 별도 전용 PostgreSQL16 클러스터에서 실제 pg_restore 의존성 실패를 재검수했다. 실패 반환/unknown 상태, 기존 테이블·뷰·한글 데이터 유지, 복원 전 백업 재검토 가능을 확인했고 전용 클러스터·private stage를 정리했다. 증거: `.runtime/verification/postgresql-data-backup-20261008T114132Z/result.json`. 이 검수는 내부 native 실행 경로이며 실제 root supervisor 중단/GUI 실패 전체 흐름을 증명하지 않는다.

GUI 갱신 시 이전 서비스/DB 검토를 즉시 무효화하도록 수정했다. 조회 실패 후 이전 context로 백업을 승인할 수 없다. GUI/API 관련 4개 검사 성공: 실패 안내/undo ID 표시, typed 확인 소모 및 남은 callback 재실행 차단, 재검토 필요, 갱신 실패 시 이전 DB 선택 숨김. 원본 브라우저 실패 팝업 수용은 별도 남는다.
