# PostgreSQL 초기 트리와 파일 권한 안내

2026-10-08 개발 서버 8787의 실제 한국어 GUI에서 확인했다.

## 수정

`lib/config-live.ts`의 PostgreSQL HBA 목록 조회는 EACCES 파일을 트리에 유지하고 해당 파일 메타데이터에 권한 경고를 보존한다. 파일을 선택하기 전에는 이를 전체 설정의 안전성 오류로 표시하지 않는다. 심볼릭 링크, 잘못된 인코딩, 변경된 파일 등 다른 조회 실패의 경고는 유지한다. 파일 읽기·helper·sudo 허용 조건은 변경하지 않았다.

## 확인

- 실제 읽을 수 없는 자체 임시 HBA fixture가 트리에 남고 원문은 응답에 포함되지 않는다. 파일 원문 요청은 여전히 403으로 거부된다.
- config-live, config-source, postgresql-hba-source, package-config-ide-render 관련 12개 검사 통과, 실패/skip 0개. Node 24.21.0의 `--test --test-isolation=none`으로 개별 검사 결과를 확인했다.
- 실제 `/ide/packages/postgresql` 초기 화면은 트리와 `왼쪽 노드를 선택하세요.`만 표시하며 이전의 HBA 전체 경고가 사라졌다.
- HBA 노드 선택 후에는 현재 개발 서버의 관리자 실행 비활성 안내가 표시된다. 현재 계정의 OS 읽기 권한이나 관리자 기능을 자동으로 확대하지 않는다.
- 초기 화면 증거: `/tmp/tastedev-postgresql-initial-20261008.jpg`.

상단 `작업 허용`은 전역 조회 전용 옵션 해제를 나타낸다. 관리자 작업은 LINUX_ENABLE_ADMIN, 기능별 보안 옵션, helper 설치 및 OS sudo 권한이 별도로 필요하다. 현재 개발 장비의 HBA 파일 소유자는 nobody이며 640 권한이다. 운영 파일의 소유권이나 권한은 변경하지 않았다.

이번 변경은 개발 서버 GUI와 관련 회귀 범위의 증거다. 기존 103번의 HBA helper/임시 클러스터 검사 결과는 당시 소스 해시에 대한 증거로 보존한다. systemd 및 GUI 실제 적용·복원 전체 수용, 전체 제품 완료 또는 배포 검증을 뜻하지 않는다.
