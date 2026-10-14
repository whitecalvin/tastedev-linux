# PostgreSQL 여러 파일 복원 검토 snapshot

`lib/postgresql-graph-restore-snapshot.mjs`는 검증·등록한 archive를 기준으로 운영 파일의 현재 상태를 읽는 내부 서버 모듈입니다. 현재 API/GUI/helper에는 연결하지 않았으며 파일을 교체하지 않습니다.

archive의 모든 원본 파일, include_dir 안의 현재 추가 `.conf` 파일, 원래 없던 선택적 include 파일을 검토 대상으로 모읍니다. 공개 결과에는 경로·생성/변경/제거/동일 action·전후 hash와 directory membership만 들어갑니다. 내부 등록 snapshot에는 현재 파일의 정확한 원문·소유 계정·권한·FD identity와 archive의 복원 원문/권한을 보관합니다. 미래 transaction의 undo 입력으로 사용하며 원문은 API나 터미널에 전달하지 않습니다.

필수 include 원본이 현재 없어졌거나 include_dir가 삭제된 경우도 읽기 전용 검토를 구성합니다. 부모 디렉터리 부재, 기존 디렉터리 inode/소유 계정/권한, 파일 inode/내용/권한, `.conf` membership 및 선택적 파일 부재를 기록합니다. 생성 중 모든 대상과 membership을 다시 확인하고, `assertPostgresqlGraphRestoreSnapshot()`는 검토 후 같은 전체 상태를 재확인합니다. unrelated hidden/non-conf 파일은 건드리지 않으며 해당 추가만으로 검토를 무효화하지 않습니다. archive에 명시적으로 포함된 hidden 파일은 일반 원본 파일처럼 검사합니다.

base/ownerUid는 trusted 서버 설정/fixture입니다. 클라이언트 입력으로 파일 목록·원문·명령을 지정하는 기능은 없습니다. symlink·hardlink·부적절한 UID/쓰기 권한·NUL/잘못된 UTF-8·파일당256KiB 초과를 거부합니다. 최대300개 검토 파일/현재 원문 합계2MiB로 제한합니다. 일반 include graph의 원문/방문 한도보다 큰 현재 상태는 별도 수동 검토가 필요하며 이 모듈로 자동 교체하지 않습니다.

공개 snapshot은 내부 등록과 digest에 묶입니다. 복사/변조한 snapshot은 거부하며 내부 원문 accessor는 deep copy를 반환합니다. 직접 accessor를 썼다는 사실은 운영 교체 권한 또는 검토 후 상태 일치를 증명하지 않습니다. 미래 transaction은 직전 재확인과 각 교체의 identity 확인을 함께 수행해야 합니다.

여러 파일의 persistent journal·undo 백업·교체·실패 복원·중단 복구, 서비스/namespace 검수와 UI/API 연결은 남아 있습니다. 삭제된 디렉터리의 실제 생성 정책과 소유 계정/권한 복원도 transaction에서 명시적으로 처리해야 합니다. 현재 주 설정 복원 흐름은 포함 graph drift를 계속 거부합니다. 임시 fixture 검사는 실제 root/PG 소유권·클러스터/설치 GUI 검증이 아닙니다.
