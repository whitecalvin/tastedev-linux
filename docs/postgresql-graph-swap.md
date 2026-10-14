# PostgreSQL 여러 파일 교체 primitive (source)

`swapPostgresqlGraphRestore`는 등록된 intent와 ready stage에서 여러 설정 파일의 변경/생성/제거를 수행하는 내부 primitive입니다. GUI/API/root helper/native coordinator에는 연결하지 않았습니다. 콜백 `validate`, `activate`, `verify`, `reactivate`가 모두 필요하며 원격 입력으로 콜백을 받는 경로는 없습니다. source 검사는 /tmp 파일과 가짜 서비스 콜백을 사용합니다.

먼저 stage 및 원본 전체 상태를 확인하고 trusted coordinator의 validate가 true인지 확인합니다. 준비 기록의 내용 hash와 파일 identity를 잠금 획득 전후 및 validate 전후에 고정하며, 교체가 시작된 뒤에는 원본 파일 상태를 가정하지 않는 private ledger reader로 같은 기록인지 재검사합니다. 모든 progress 게시 전후와 서비스 콜백 경계·복구 행 진입에서도 intent와 stage binding을 다시 확인합니다. 동일 내용의 다른 inode·재계산 checksum을 가진 변조·삭제·알 수 없는 hardlink도 기존 검토를 승계하지 않습니다. 변경 행을 정렬된 경로 순서로 처리하고 원본은 미리 private progress에 기록한 UUID dot undo 이름으로 rename합니다. rename 뒤 inode/hash/권한을 재확인하며 생성/교체 후보는 hardlink의 no-overwrite 게시로 target에 연결합니다. 검증된 두 이름/동일 inode 이외의 link는 거부하고 원래 stage 이름을 제거합니다. 추가 conf 및 선택적 원래 부재 파일은 원본을 undo로 보관하고 target을 부재로 만듭니다. 원본·후보·부모 inode가 바뀌면 거부합니다.

private700 `<journal UUID>.swap`에 bounded600 progress와 digest를 fsync/atomic 게시합니다. 파일별 원본 이동/후보 link/게시/복구 진행 상태를 기록합니다. 교체 뒤 및 activate/verify 뒤 모든 파일 bytes/hash/attrs/후보 inode와 include_dir membership을 확인합니다. 콜백 verify가 false면 성공으로 반환하지 않습니다.

실패 시 복구에 들어가기 전에 변경 대상·변경하지 않은 원본 참조 파일·보관된 원본·아직 게시하지 않은 후보·include_dir 목록을 모두 검사합니다. 후보의 두 hardlink는 target+stage의 정확한 두 이름이 같은 inode일 때만 허용합니다. 검사 실패 시 후보 이동·원본 복원을 시작하지 않으며 마지막 progress 단계를 보존합니다. 검사를 통과하면 역순으로 원본을 복구합니다. 동일 후보는 private custody에 먼저 이동해 다시 검증하고 보관하며, 원본 undo는 target 부재에만 hardlink로 복구합니다. 외부 target을 덮어쓰지 않습니다. 파일·membership 복구를 검사한 뒤 reactivate/verify를 호출하고 다시 전체 파일·membership을 확인해, 모두 통과한 경우만 rollbackComplete=true 오류를 반환합니다. 변조된 target/undo/부모가 있으면 보존하고 rollbackComplete=false로 중단합니다. custody가 다른 파일시스템이면 rename이 실패하며 copy/delete로 우회하지 않습니다.

성공 또는 복구 후에도 intent, stage ledger, progress 및 남은 undo/retired 후보를 유지합니다. swap 기록이 있으면 intent 삭제를 거부합니다. 성공에 intentPreserved=true가 표시되는 것은 정리 완료가 아니라 후속 종료/복구 coordinator가 필요한 상태라는 뜻입니다.

private v2 progress reader와 실제 새 프로세스 readback은 `docs/postgresql-graph-swap-progress.md`에 추가했습니다. 중단 복구와 일부 실제 writer SIGKILL/checkpoint fixture는 `docs/postgresql-graph-swap-recovery.md`에 기록했습니다. 남은 작업은 원본 이동/후보 게시 crash window 전체 복구, 성공/실패 후 안전한 보관 정리, 고정 native 검수·서비스 coordinator/GUI/API/helper 연결·패키징입니다. 실제 PostgreSQL16 바이너리, root/PG UID가 다른 환경, 전원 중단/설치 GUI는 검증하지 않았습니다. 새 production build/deb를 만들지 않았으며 source proof `postgresql-graph-swap-source-20261005.json`을 참조합니다.

복구 전 검사는 운영 파일 전체를 원자적으로 잠그는 기능은 아닙니다. 검사 후 외부 변경도 각 파일의 후속 검사와 전체 검수에서 거부하며, 중간 진행/원본 보관은 유지합니다. stage ledger binding은 교체·복구 실행에 추가했습니다. native coordinator의 원래 service/resource scope는 별도 완성해야 합니다.
