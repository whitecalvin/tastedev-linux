# 패키지 운영 설정 적용

현재 PostgreSQL·MariaDB·Redis GUI는 조회, 지원 항목 가져오기, 비교 및 작업 폴더 초안 저장까지 제공한다. 파일 버전을 검사하는 변경 계획 검토도 제공한다. 실제 운영 적용은 미완료다.

`lib/config-patch.ts`는 서버가 읽은 원본 파일에 검증된 지원 항목만 반영한다. 인증과 다른 설정을 보존하기 위해 전체 초안으로 운영 파일을 대체하지 않는다. 전체 원본/결과를 HTTP 응답이나 감사 로그로 반환하면 비밀이 노출될 수 있으므로 응답은 변경한 지원 항목의 전후 값으로 제한해야 한다.

다음 연결의 필수 조건:

- 서버에서 정한 설정 파일 대상과 원본 버전 검사. 클라이언트의 임의 경로를 사용하지 않는다.
- 지정 파일과 include 파일의 우선순위를 구분하고 실제 적용 대상·미해결 include를 표시한다.
- 보안 옵션, 관리자 helper, 명시적 변경 확인, 감사 기록.
- 원본 권한을 유지하는 백업과 원자적 파일 교체, 원본 버전 재검사.
- 각 DB에서 지원하는 설정 검증 및 재시작/재로드 구분. 인증 정보는 출력하지 않는다.
- 검사/서비스 실패 시 원본 복원 및 복구 결과 기록. 데이터 파일을 삭제하지 않는다.
- 격리된 설치 환경에서 설정 적용·실패·복구 검증 후 운영 적용 완료 판정.

Redis 설정/재작성 기준은 [Redis configuration](https://redis.io/docs/latest/operate/oss_and_stack/management/config/), [CONFIG REWRITE](https://redis.io/docs/latest/commands/config-rewrite/)를 참고했다. 현재 파일 변경 함수는 Redis에 접속하거나 CONFIG 명령을 실행하지 않는다.

`lib/config-transaction.ts`에 공통 파일 트랜잭션을 구현했다. 호출자는 별도로 운영 경로와 권한을 검사해야 한다. 파일 잠금, 원본 버전·inode 검사, 후보 파일 검증, 0600 백업, 소유권·권한 유지, 원자적 교체, 서비스 반영 실패 시 복원 및 복구를 수행한다. 복구 중 외부 변경은 보존하며 자동 복구하지 못한 상태를 반환한다. 프로세스가 강제 종료되면 잠금 디렉터리가 남을 수 있으므로 자동 제거하지 않고 운영자가 상태와 백업을 점검해야 한다. POSIX 파일 검사와 rename 사이에 잠금을 따르지 않는 외부 편집자가 수정하는 경합까지 완전히 배제하지는 못한다.

이 공통 함수는 아직 관리자 helper·HTTP 적용 API와 연결하지 않았다. 패키지별 전체 설정 검사와 서비스 활성화·복구 명령을 확정하고 격리 환경에서 검증해야 한다. 단위 fixture의 콜백 성공은 실제 DB의 검사/재시작 성공을 의미하지 않는다.

PostgreSQL용 `lib/postgresql-config-hooks.mjs`는 Debian 기본 클러스터 경로에서 버전/이름을 식별한다. 검사 명령은 postgres 계정으로 버전별 `postgres -C`를 실행해 후보 파일의 선택 항목 값을 확인한다. 서버를 새로 시작하지 않으며 include나 auto.conf가 요청 값을 덮어쓰면 값 불일치로 거부한다. 사전 상태 검사, 선택 클러스터 restart, 재시작 뒤 상태 확인, 원본 복원 뒤 restart용 콜백을 제공한다. 실행기는 서버 내부에서 주입해야 하며 클라이언트 입력의 명령을 실행하지 않는다.

현재 기본 postgres 계정 이외의 클러스터 소유자, 운영 파일 소유권·그룹 읽기 권한, 서비스 관리자 연결은 실제 Debian 설치에서 추가 검증이 필요하다. `-C` 검사 성공은 연결·인증·리소스 확보와 전체 재시작 성공을 보장하지 않는다. 재시작은 기존 연결에 영향을 주므로 실제 적용 GUI에서 별도 영향 확인을 표시해야 한다. 아직 API/helper 연결 및 실제 클러스터 적용은 미완료다.

PostgreSQL은 이제 `postgresql-apply` API와 단일 파일 관리자 helper, GUI 확인 화면에 연결했다. `databaseChanges`·관리자 환경 허용·sudo 옵션이 모두 필요하다. 이전 보안 설정에 새 항목이 없으면 false로 읽는다. GUI는 재시작 영향을 표시하며 helper는 파일과 명령을 다시 검증한다. 배포용 helper는 외부 모듈을 root 권한으로 불러오지 않고 필요한 검사를 자체 수행한다.

현재 적용 대상은 root 소유 설정 파일과 root 소유 설정 경로로 제한된다. PostgreSQL 계정 소유 설정 파일이나 읽기 권한이 없는 후보는 적용하지 않으며 권한을 자동 수정하지 않는다. 실제 Debian 설치의 기본 소유권, 계정, 설정 우선순위 및 재시작 검증이 남아 있다. PostgreSQL 백업은 `/var/lib/linux/admin/postgresql`의 private 파일이며 GUI 백업 목록/수동 복원 연결은 아직 없다. MariaDB·Redis에는 이 적용 API를 제공하지 않는다.

PostgreSQL GUI와 `postgresql-backups` API에 설정 백업 메타데이터 조회를 연결했다. helper는 private root 백업 기록의 크기·ID·해시·대상·형식을 검사하고 손상 기록/심볼릭 링크를 제외한다. 응답에는 원문이 없으며 제한된 목록임을 표시한다. 조회 전용 모드에서도 관리자 환경/helper·sudo 옵션이 갖춰지면 조회할 수 있다. 사용자 선택 복원은 아직 연결하지 않았다.

PostgreSQL 백업 목록의 선택 복원을 GUI/API/helper에 연결했다. 복원 계획은 지원 항목만 비교하지만 실제 복원은 선택 백업의 전체 설정을 사용하며 이를 화면에 명시한다. 원문은 화면으로 보내지 않는다. 현재/백업 버전 재검사, 후보 검사, 복원 직전 설정의 추가 백업 및 정확한 클러스터 재시작을 수행한다. 실패하면 복원 직전 설정으로 되돌리고 복구 결과를 구분한다. 운영 파일 소유권 제한은 적용과 동일하다. 실제 설치 DB와 브라우저 조작 E2E는 아직 필요하다.

MariaDB용 `lib/mariadb-config-hooks.mjs`에 버전별 검사 기반을 추가했다. 바이너리의 no-defaults 도움말에서 전용 validate-config 지원 여부를 확인한다. 지원 시 전용 검사를 사용하고, 미지원 시 verbose/help 옵션 파싱을 별도 options-help 모드로 제공한다. 후자는 전용 전체 설정 검사와 같은 보장을 제공하지 않는다. my_print_defaults의 서버 옵션 출력에서 지원 값만 내부 비교하며 비밀번호 등 원본 출력은 반환하지 않는다. 실행 중 서비스 확인, 고정 mariadb.service 재시작/상태 검사·복구 콜백을 제공한다.

이 모듈은 아직 root helper/API/GUI 적용과 연결하지 않았다. 후보 단일 파일에 대한 검사이므로 운영 main/include 전체 우선순위·서비스 시작 옵션과의 일치, 파일 소유권 및 실제 MariaDB 설치에서 검증해야 한다. 기존 버전 옵션 파싱 성공으로 운영 재시작 성공을 판단하지 않는다. 전용 검사 도입 근거: [MariaDB 13.1 validate-config 공식 안내](https://mariadb.org/mariadb-13-1-feature-in-focus-validate-your-configuration-before-starting-the-server/), [my_print_defaults 공식 문서](https://mariadb.com/docs/server/clients-and-utilities/administrative-tools/my_print_defaults).

MariaDB GUI/API에 지정 main의 include 연결 조회를 추가했다. 파일·디렉터리 연결, 각 파일과 디렉터리 목록을 포함한 전체 버전, 읽기 실패/순환/미지원 경고를 제공한다. 응답에 원문과 옵션 값은 없으며 검사 범위를 제한한다. optional includedir은 연결 유형만 표시하며 설치 바이너리의 지원 여부와 의미를 확정하지 않는다. main의 심볼릭 링크, /etc/mysql 외부 경로, 실행 인수/그룹 최종값 검사는 아직 지원하지 않는다. 이 구조를 이용해 운영 include 전체 후보 검증과 버전 재검사를 연결하는 작업이 남아 있다.

`lib/mariadb-candidate.mjs`에 include 전체 후보 묶음 생성 기반을 추가했다. 완전한 연결 조회 결과와 버전을 요구하고 선택 파일이 main에 포함된 경우에만 지원 항목을 변경한다. 파일별 버전 재검사 후 별도 0700 임시 폴더의 0600 파일로 복제하며 include 경로를 후보 폴더 안으로 연결한다. 원본/지원 외 설정은 유지하고 생성 후 전체 연결 버전도 재검사한다. 오류 시 후보 폴더를 정리하고 정상 결과는 명시적 cleanup을 제공한다. 후보 파일에는 인증 값이 있을 수 있으므로 HTTP 응답/다운로드 대상으로 사용하면 안 된다.

현재 UTF-8 설정만 지원하며 원본 줄바꿈을 유지한다. 실제 검사 실행 계정이 private 후보 파일을 읽는 조건, 기존 검사 콜백의 후보 경로 제약과 묶음 연결, root helper의 후보 생성 및 운영 적용 직전 전체 버전 검사·백업·롤백 연결은 아직 남아 있다. 임시 파일 fixture는 DB 설정 검사나 서비스 반영 성공을 증명하지 않는다.

MariaDB 검사 콜백의 validatePrepared를 후보 묶음 생성기와 연결했다. 생성기가 만든 동결 객체만 받아들이며 원본 대상과 요청한 변경 항목이 검사 콜백과 일치해야 한다. 임의 객체 복제/수정이나 정리된 후보는 거부한다. private 묶음의 main을 --defaults-file로 사용해 검사하고 my_print_defaults의 include 전체 옵션 결과를 지원 항목별로 비교한다. 뒤쪽 include가 요청 값을 덮어쓰면 불일치로 거부한다. 검사 명령 실패의 원문 진단은 공개 오류에 포함하지 않는다.

프로세스 내 후보 객체는 HTTP 또는 별도 root 프로세스로 직렬화해 전달할 수 없다. 권한 helper가 내부에서 후보를 생성·검사하도록 연결해야 한다. 실행 대체 fixture의 include 값 불일치 검사만 완료했으며 실제 MariaDB 옵션 해석·검사, 서비스 반영과 백업/복구는 미검증/미완료다.
