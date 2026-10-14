# PostgreSQL 여러 파일 복원 임시 파일 준비

`lib/postgresql-graph-restore-stages.mjs`는 등록된 persistent intent에서 복원 후보의 인접 임시 파일을 준비하는 내부 source 모듈입니다. 아직 GUI/API/root helper/production 패키지에는 연결하지 않았습니다. 운영 target 파일을 rename하거나 삭제하지 않습니다.

private700 `graph-stages` 디렉터리에 journal ID/version·대상·준비 단계·예정 temp UUID 이름·후보 hash/권한을600 파일로 기록합니다. 각 temp 생성 직후 inode/device를 기록하고 원문 기록·chown/chmod·fsync 뒤 정확한 내용 hash/권한/FD와 이름 동일성을 확인해 ready를 기록합니다. 단계 갱신은 현재 private 기록의 identity/version을 확인한 뒤 atomic rename 및 디렉터리 fsync로 수행합니다. 기본 준비 호출은 기존 stage 기록을 거부합니다. 명시적인 내부 `resumePostgresqlGraphRestoreStages` 호출은 preparing 기록만 재개하며 ready 또는 기록 부재를 거부합니다.

없어진 부모 디렉터리는 intent의 기존 부재 기록과 trusted PG UID/GID에 따라700으로 생성하고 생성 inode를 기록합니다. UID가 실행 계정과 다른 경우 GID를 trusted account lookup으로 제공해야 합니다. config target은 계속 absent이며 candidate는 dot 임시 이름으로만 존재합니다. 반환의 operatingConfigurationChanged=false는 target 파일을 교체하지 않았다는 뜻이며, createdDirectories가 나타내는 새 부모 생성까지 부정하는 표시가 아닙니다.

준비 전/각 단계/마지막에 base/부모 identity, 기존 파일 bytes/identity와 include_dir membership을 다시 확인합니다. inspect는 ready 임시 파일의 hash/identity/권한을 재확인합니다. 변조된 temp/진행 기록과 기존 intent는 삭제하지 않고 보존합니다. 진행 기록이 존재하면 intent 삭제를 거부하도록 journal 모듈을 보완했습니다. operation lease를 사용하며 실제 root helper의 kernel-lock context와의 검증은 아직 없습니다.

preparing 기록의 완료된 temp는 전체 identity/hash/권한이 같을 때 유지합니다. 미완료 temp는 기록된 dev/inode, 단일 regular file, 실행 계정 또는 예정 소유자/권한, 후보 원문의 정확한 바이트 prefix가 모두 일치할 때만 동일 FD로 완성합니다. inode가 기록되지 않은 이름에 파일이 이미 있거나 내용/소유자가 다르면 보존하고 거부합니다. 원래 대상 파일과 부모/membership, private intent를 다시 확인하며 준비 완료를 기록합니다. 실제 새 Node 프로세스의 journal read 및 재개를 검사했습니다. 중단 checkpoint fixture이며 실제 writer SIGKILL 증거는 아닙니다.

초기 stage 기록 게시의 두-link crash 구간, 생성 직후 inode 기록 전 중단, 생성 디렉터리의 chown 중간 상태, pending/ready 안전한 정리, unknown legacy lock/임시 기록 처리는 아직 구현하지 않았습니다. 현재 inspect가 preparing이라고 반환하거나 거부할 수 있으며 이를 복구 완료로 취급하지 않습니다. 준비 완료된 후보의 실제 여러 파일 교체·실패 undo·서비스 재검증·interrupted recovery와 완료 후 안전한 기록/임시 파일 정리가 남아 있습니다.

인접 파일/디렉터리 생성과 ready 파일 검사는 `/`부터 부모까지 O_DIRECTORY/O_NOFOLLOW로 연 디렉터리 FD를 유지하고 `/proc/self/fd/<fd>/<basename>`을 사용합니다. 기존 부모는 snapshot identity, 새 부모는 기록된 inode·UID/GID/700을 확인합니다. 쓰기 전후 열린 FD와 현재 이름 경로를 비교하며 부모 fsync도 동일 FD로 수행합니다. 부모가 다른 디렉터리 또는 symlink로 교체되면 열린 원래 디렉터리에만 접근하고 변경을 거부합니다. 새 디렉터리는 chown 전에 실행 계정 소유의700인지 확인합니다. 실제 root/PG 계정이 다른 환경과 writer SIGKILL 검증은 여전히 필요합니다.

증거는 /tmp에 생성한 source fixture에서 실제 temp/디렉터리 준비, root 대신 실행 계정의 ownership/permission, target unchanged, 외부 변경 보존 및 intent 삭제 보호 검사입니다. 실제 root chown/native PG/service/writer SIGKILL/설치 GUI 증거는 아닙니다. 이번 단계에서는 production build/deb를 생성하지 않았습니다.

## 준비 취소와 정리

`cancelPostgresqlGraphRestoreStages`는 ready 기록을 cleaning으로 전환하고 준비된 후보를 정리합니다. 모든 후보를 먼저 검증한 뒤 executor 소유의 private700 `<journal UUID>.custody`에 열린 부모 FD 기준으로 atomic rename합니다. 이동 후 내용/소유자/권한/inode/mtime/크기를 다시 비교합니다. rename이 바꾸는 ctime은 이동 전후 비교에서 제외합니다. 후보가 바뀌었다면 custody에서 삭제하지 않고 보존하며 intent와 진행 기록도 유지합니다.

custody 이동과 삭제를 각 fsync 및 private 진행 기록으로 구분합니다. rename 뒤 checkpoint 전, unlink 뒤 checkpoint 전 구간을 디스크 상태와 일치시켜 재개할 수 있습니다. 직접 만든 디렉터리는 하위 파일 정리가 끝난 뒤 역순으로 처리하고, 이동 전후 기록된 inode/권한/소유자와 빈 상태를 확인한 경우만 rmdir합니다. 새 unrelated 파일이 있으면 그 디렉터리와 파일은 보존합니다. 재귀 삭제는 사용하지 않습니다.

완료하면 stage 기록과 빈 custody를 제거하며 intent는 유지합니다. 호출자는 이후 별도로 검증된 journal 삭제를 수행할 수 있습니다. 운영 설정 원문은 바꾸지 않습니다. preparing 취소는 먼저 안전하게 ready로 재개한 뒤 취소해야 하며 기록 없는 생성/디렉터리 chown 중간 상태는 여전히 자동 정리하지 않습니다.

source와 private custody가 다른 파일시스템이면 rename은 EXDEV로 실패하고 원본 이름을 보존합니다. copy/delete 우회는 없습니다. stage 기록 삭제 후 빈 custody 정리 전 종료할 때 생기는 orphan directory의 자동 정리는 아직 없습니다. 실제 SIGKILL/전원 중단, root와 PG UID가 다른 환경, native/service/설치 GUI 및 GUI/API/helper 연결 증거는 아닙니다. checkpoint fixture의 회귀 검사는 `postgresql-stage-cancel-source-20261005.json`에 기록합니다.
