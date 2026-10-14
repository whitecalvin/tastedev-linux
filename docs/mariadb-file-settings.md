# MariaDB 파일 설정 GUI

`/ide/packages/mariadb`에서 파일 또는 전체 설정 노드를 선택하면 파일 순서대로 옵션을 표시합니다. 코드 보기와 같은 초안을 사용하며 원문 편집 후 설정 화면을 다시 선택하면 그 순서로 갱신됩니다.

- 왼쪽 파일 아래 실제 그룹 노드를 표시합니다. 그룹 이름만 SSR metadata로 전달하며 옵션 값은 노드 선택 후 읽습니다. 코드 편집의 그룹 순서 변경·추가·삭제는 트리에 반영됩니다.
- 그룹 노드 선택은 현재 코드 기록을 재사용하고 해당 그룹의 행만 표시합니다. 항목 추가도 선택 그룹 안에서 수행합니다. 같은 이름의 반복 그룹은 한 노드에 모아 원문 행을 각각 표시합니다.
- 그룹 필터는 `[client]`, `[mysqld]` 등 선택 그룹의 행만 표시합니다. 반복 그룹과 같은 이름의 옵션도 각각 편집합니다.
- 값 비우기는 행을 유지하면서 주석 처리합니다. 값 없는 옵션은 값 입력 없이 활성화할 수 있습니다.
- 항목 추가는 지정 그룹의 마지막 구간에 넣습니다. 그룹이 없으면 새 그룹을 파일 끝에 추가합니다.
- include 지시어, 주석 처리된 할당, 따옴표와 CRLF를 보존합니다. 값 안의 세미콜론은 주석으로 제거하지 않습니다.
- password/secret 옵션 입력을 가립니다. 코드 보기 원문에는 값이 있으므로 사용자 권한을 확인해야 합니다.
- 주요 연결/메모리/문자셋/로그 폼은 기존 지원 필드 범위를 유지하며 하이픈·밑줄 이름의 같은 옵션을 수정합니다.

행 편집은 로컬 파일 초안의 구문 검사입니다. 그룹의 버전별 적용 여부, include 파일 확장, 옵션 의미, 유효 설정은 설치된 MariaDB에서 별도 검수해야 합니다. `?includedir` 지원은 MariaDB 버전에 따라 다릅니다. 전체 파일의 임의 옵션을 자동 운영 적용하지 않으며 기존 검수·검토·권한 제한을 유지합니다.

참조: [MariaDB option files](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/configuring-mariadb/configuring-mariadb-with-option-files), [MariaDB 11.4 native option parser](https://github.com/MariaDB/server/blob/11.4/mysys/my_default.c).
