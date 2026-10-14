# PostgreSQL 여러 파일 중단 복구 primitive (source)

`recoverPostgresqlGraphSwap`는 등록된 v2 progress에서 applying/activating/rolling-back 상태를 파일 원본으로 되돌리는 내부 함수입니다. committed 상태는 임의로 되돌리지 않습니다. rolled-back 상태는 파일·runtime 재검수만 수행하고 reactivate를 반복하지 않습니다. GUI/API/helper/fixed native coordinator에는 연결하지 않았습니다.

모든 target/undo/stage/retired 이름을 열린 부모와 private custody FD로 읽고, 원래 파일 또는 검토된 후보 inode/hash/UID/GID/권한인지 먼저 확인합니다. 두-link는 원본 target+undo 또는 후보 target+stage라는 정확한 두 이름이 모두 같은 inode일 때만 허용합니다. 다른 alias/외부 편집/원본 상실/변조된 private 기록은 변경하지 않고 거부합니다. 파일마다 before/after/부재 상태로 include_dir membership을 대조하며 untouched 파일도 확인합니다.

private progress와 실제 파일 상태를 reconcile해 rolling-back으로 기록합니다. 역순으로 후보를 private retired custody에 보존하고 원본 undo를 target 부재에만 hardlink로 복구합니다. hardlink window의 정확한 alias만 정리하며 target을 덮어쓰지 않습니다. 각 동작 뒤 부모/custody fsync와 검증된 private progress의 version/FD identity를 확인해 atomic 갱신합니다. intent/stage 버전 binding은 계속 재검사합니다. 원본 bytes/attrs/inode·membership 검사 뒤 trusted reactivate/verify를 호출하고 다시 파일 상태가 같아야 rolled-back 및 filesystemRecoveryVerified=true를 반환합니다.

서비스 검수 실패는 rolling-back을 유지하며 재호출에서 원본 상태를 다시 검사할 수 있습니다. 원본 이동 후 기록 전, 후보 link/unlink 후 기록 전, 후보 retirement 후 기록 전, 원본 복구 link/unlink 후 기록 전의 checkpoint fixture를 검사했습니다. 실제 writer subprocess를 activating callback에서 SIGKILL한 뒤 새 Node 프로세스로 원본 파일 복구를 검사했습니다.

SIGKILL fixture는 종료가 확인된 그 writer가 생성한 inode의 빈 fixture lock만 명시적으로 확인/제거했습니다. production의 unknown legacy lock은 함수가 제거하지 않습니다. 설치 helper의 inherited kernel lock·root/PG UID가 다른 환경·전원 중단·native PostgreSQL/service/설치 GUI 증거는 아닙니다. 서비스 함수는 source fixture 콜백입니다.

before include graph의 전체 capture/binding은 v2 intent에 추가했습니다. 고정 native validation, durable 원래 service/runtime/resource scope, 초기 progress 게시 alias 및 더 많은 전원 중단 구간, 완료/실패 후 stage/undo/retired 보관 정리와 GUI/API/helper 연결·패키징이 남아 있습니다. intent/progress/undo는 삭제하지 않고 보존합니다. 최초 복구 source proof는 `postgresql-swap-recovery-source-20261005.json`, before graph 추가 증거는 `terminal-echo-and-pg-before-graph-source-20261005.json`입니다.
