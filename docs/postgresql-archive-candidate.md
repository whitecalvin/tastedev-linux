# PostgreSQL 백업 묶음 검수 후보

`lib/postgresql-archive-candidate.mjs`는 private archive reader가 검증·등록한 snapshot에서 전체 복원 후보를 구성합니다. 복제/임의 구성/변조한 record는 거부합니다. archive 원문은 내부에서만 사용하며 browser/API 입력으로 받지 않습니다.

새 private `/tmp/tastedev-pg-restore-*` 경로에 주 설정과 모든 포함 원문을600, 중간 경로와 빈 include_dir 디렉터리를700으로 재구성합니다. 운영 include 파일이 사라지거나 변경되거나 새 파일이 추가되어도 archive의 원문·directory membership·선택적 파일 부재를 사용합니다. 재구성한 등록 graph 버전은 archive와 정확히 같아야 합니다. 사본은 실행 계정 소유이며 운영 파일의 소유 계정/권한을 변경하지 않습니다.

`inspectPostgresqlGraphArchive()`는 재구성한 후보에 기존 private candidate/namespace native 검수 coordinator를 적용합니다. 검수 뒤 후보 graph와 등록 archive snapshot의 동일성을 다시 검사합니다. 결과에는 고정5개 공개 값과 검수 범위만 반환하고 원문/비밀값은 제외합니다. 성공·검수 실패에 임시 경로를 정리하며, 할당한 경로가 교체되었다면 다른 경로를 삭제하지 않고 거부합니다.

private context에 graphArchive가 있는 일반 전체 코드 백업 복원은 기본 root 경로에서 이 archive 검수기를 사용합니다. context가 없는 이전 백업은 기존 검수기를 유지합니다. executor/UID/기준 경로는 요청에서 지정할 수 없습니다. trusted source fixtures는 별도 validator dependency를 사용합니다.

이 후보 재구성은 운영 파일 복원이 아닙니다. 현재 복원 planner는 운영 include graph가 백업 당시와 달라졌다면 여전히 거부합니다. 여러 파일의 검토/동시 교체/실패 원본 복원/중단 복구 transaction을 이어서 구현해야 합니다. native PostgreSQL/namespace 실제 실행과 root 소유권 및 설치 GUI 검증도 아직 없습니다.
