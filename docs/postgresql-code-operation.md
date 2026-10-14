# PostgreSQL 전체 코드 적용 기반

PostgreSQL main 파일을 선택한 뒤 헤더의 검수 아이콘에서 전체 코드 검수·적용 검토 팝업을 엽니다. 설정 GUI와 코드 보기의 같은 원문 초안을 사용합니다. 검수 완료 후 클러스터 재시작 영향을 확인해야 적용할 수 있습니다. include 파일의 단독 전체 코드 적용은 아직 지원하지 않으며 main 파일의 include graph를 함께 검수합니다. pg_hba.conf는 기존 접속 규칙 검수·적용 경로를 사용합니다.

`postgresql-code-plan`과 `postgresql-code-apply` API는 로그인, 동일 origin, databaseChanges 및 sudoWithoutPrompt 권한을 검사합니다. API/helper JSON 한도는 1.6MB, 실제 코드 UTF-8 한도는 262144byte입니다. helper는 root 소유·checksum 검증된 모듈을 사용하며 PostgreSQL UID는 서버에서 고정 계정 조회로 구합니다. 웹 요청의 UID·명령·기준 경로는 거부합니다. 검토 요청과 연결·정책이 바뀌면 확인 상태를 버리고 중복 실행과 늦은 응답을 막습니다. 터미널에는 구조화한 검수·적용 상태와 백업 ID만 기록합니다.

검토는 `/etc/postgresql/<major>/<cluster>/postgresql.conf`의 정확한 원문, 원본 버전, 원본/후보 include graph 및 실행 중인 서비스 snapshot에 묶입니다. 적용 요청은 검토 digest와 명시적인 확인을 요구합니다. 요청에서 파일 시스템 기준 경로, 실행 명령 또는 계정 UID를 지정할 수 없습니다. UID와 백업 경로는 신뢰된 호출자가 제공하는 내부 옵션입니다.

서비스 snapshot은 기존 PostgreSQL PID·실행 파일·소켓·클러스터 경로 확인을 재사용합니다. 고정된 읽기 전용 SQL로 다섯 공개 runtime 값과 디스크 설정 오류 수를 확인합니다. `postgresql.auto.conf`는 내용을 반환하지 않고 부재 또는 SHA-256만 기록합니다. 디렉터리는 루트에서 descriptor로 순차 열고 심볼릭 링크를 거부하며, 조회 후 이름과 열린 descriptor의 identity를 다시 검사합니다. 파일 크기·권한·소유권·하드 링크도 검사합니다.

적용 전에 private 후보 검수와 서비스/graph 확인을 반복합니다. 원본 백업에는 기존 PostgreSQL catalog와 호환되는 kind를 기록합니다. 공통 transaction은 신뢰된 PostgreSQL 소유 UID를 허용하되 백업과 journal은 실행 계정의 private 경로에 보존합니다. 원본 파일의 소유권·권한을 유지합니다. 파일 교체 후 고정된 클러스터 unit을 재시작하고 runtime 값·설정 오류·경로·auto configuration을 다시 확인합니다.

재시작 또는 후속 확인 실패 시 원본을 복원하고 원래 runtime 값으로 서비스 복구를 확인합니다. 적용 중 외부 편집이 생기면 덮어쓰지 않고 복구 필요 결과와 journal을 남깁니다. 별도의 전체 코드 중단 작업 복구 adapter와 전체 graph 기반 백업 복원 연결은 남아 있습니다. 기존 PostgreSQL 백업 목록과 복원 기능은 유지합니다.

Fixture 검사는 실제 PostgreSQL 기동을 증명하지 않습니다. 현재 장비에는 PostgreSQL16 실행 파일이 없어 native namespace, root에서 PostgreSQL 계정 소유 파일 교체, 운영 서비스 적용/복원 및 설치 GUI/E2E는 미검증입니다. private `postgres -C` 결과는 운영 데이터·TLS·플러그인 접근성이나 실제 startup override를 증명하지 않습니다. auto configuration이 후보의 공개 값과 충돌하면 후속 검증에서 실패하고 원본 복원을 시도합니다.
