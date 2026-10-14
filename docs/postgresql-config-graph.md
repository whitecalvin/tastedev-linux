# PostgreSQL 전체 설정 snapshot과 검수 후보

전체 코드 운영 적용에 사용할 기반 모듈입니다. 아직 PostgreSQL GUI/API 적용 경로에 연결하지 않았습니다. 기존 운영 적용과 기본 deb는 그대로이며 다음 단계에서 native 검수·서비스 identity·transaction에 연결해야 합니다.

`postgresqlConfigGraph`는 클러스터의 postgresql.conf부터 include, include_if_exists, include_dir를 추적합니다. 상대 경로는 참조 파일의 디렉터리에서 해석합니다. 디렉터리는 숨김 파일과 하위 디렉터리를 제외한 .conf 파일을 UTF-8 C 순서로 처리합니다. 없는 선택 참조 파일도 snapshot에 기록해 이후 생성되면 검토가 무효화됩니다. 규칙은 [PostgreSQL 공식 문서](https://www.postgresql.org/docs/current/config-setting.html)의 설정 파일 분할 설명에 근거합니다.

현재 허용 범위는 같은 `/etc/postgresql/<version>/<cluster>` 내부의 정규 파일과 디렉터리입니다. 심볼릭 링크·외부 경로·제어 문자·쓰기 가능한 파일·잘못된 소유권·UTF-8 오류·순환 참조를 거부합니다. include 경로는 단일 인용부호와 doubled quote를 지원하며 backslash escape와 한 줄을 넘는 구문은 추정하지 않고 거부합니다. native include_if_exists의 읽기 실패 무시 동작과 달리 권한/안전성 위반은 검토를 중단합니다. 데이터 디렉터리의 postgresql.auto.conf나 실행 인수의 override는 이 graph의 범위가 아니며 별도 확인해야 합니다.

파일별 256KiB, 전체 원문1MiB, 파일100개, 방문/edge300개, 중첩16단계로 제한합니다. 공개 graph는 경로·크기·hash·참조 목록만 포함하고 옵션 값을 포함하지 않습니다. 원문은 등록된 내부 snapshot에서만 얻을 수 있습니다. 적용 초안 override가 있어도 운영 원본의 파일 identity와 hash를 별도로 고정하므로 운영 원본 변경을 숨기지 않습니다.

`postgresqlConfigCandidate`는 등록된 최신 snapshot만 받아 private 임시 복사본을 생성합니다. 모든 include와 include_dir 안의 복사본도 private 경로로 다시 연결하고 선택 참조의 부재를 유지합니다. 원문과 주석은 보존합니다. 복사 전후 운영 snapshot을 검사하고, 후보를 검사할 때는 private 파일의 hash·권한·소유권·identity를 확인합니다. 후보 cleanup은 최초 임시 디렉터리 identity가 같을 때만 수행합니다.

fixture 검사는 참조 순서와 누락 참조 생성, 수정/신규 파일, 권한/링크/외부 경로/순환 거부, UTF-8와 크기 제한, 초안 override의 원본 고정, 후보 rewrite·변조 거부·원본 보존을 확인합니다. PostgreSQL 실행 파일이 없는 현재 장비에서 native parse·기동·운영 적용을 증명하지 않습니다. source 구현 단계이며 native 옵션 검수기와 coordinator는 이후 source에 추가했습니다(postgresql-config-validation.md). helper/적용·복원/GUI 연결 및 실제 설치 검증은 남아 있습니다.
