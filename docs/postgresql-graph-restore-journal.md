# PostgreSQL 여러 파일 복원 intent 기록

`lib/postgresql-graph-restore-journal.mjs`는 등록된 다중 파일 snapshot의 원본/복원 상태를 private 디스크 기록으로 저장하는 내부 모듈입니다. 현재 파일 교체·서비스 재시작·중단 복구 executor에는 연결하지 않았습니다.

snapshot의 공개 digest에 맞는 정확한 현재/후보 원문, UID/GID/권한, 현재 FD identity, 부모 디렉터리 존재/identity, include_dir의 현재 membership, archive ID/graph 버전 및 trusted base/PG UID를 저장합니다. main 파일의 후보는 반드시 존재해야 합니다. 클러스터 밖 경로, 잘못된 원문 hash/파일 identity/권한/UID, snapshot digest 불일치를 거부합니다. 현재 파일 원문2MiB·후보1MiB 및 파일당256KiB 한도, 최대300파일/1000부모 디렉터리/100개 membership과32MB encoded 기록 한도를 둡니다.

private 백업 폴더의700 `graph-transactions` 안에 클러스터 target hash로 파일명을 정합니다. 임시600 파일을 fsync한 뒤 최종 파일에 atomic link로 게시하고 임시 link를 해제한 후 디렉터리를 fsync합니다. 기존 기록이 있으면 덮어쓰지 않습니다. 게시 전 snapshot을 다시 확인합니다. final 파일이 partial write로 노출되지 않으며, 게시 전 종료로 남은 임시 파일은 운영 변경을 시작할 수 있는 최종 기록으로 취급하지 않습니다.

reader는 정확한 byte 수/UTF-8/schema/digest/FD와 이름의 동일성 및 private 소유권을 확인합니다. 게시 후 임시 link 해제 전 종료를 모사한 fixture에서, 검증된 기록의 정확한 UUID alias 하나만 정리해 nlink1로 회복합니다. 알 수 없는 hardlink나 추가 link는 그대로 보존하고 거부합니다. 이것은 publication 단계 정리이며 운영 설정 복원이 아닙니다.

새 프로세스는 디스크에서 intent를 읽고 등록할 수 있습니다. 내부 read 객체에는 원문이 있으며 API/터미널에 그대로 반환하면 안 됩니다. 공개 summary는 기록 ID/대상/hash/파일 수만 내보냅니다. 삭제는 같은 target/private root/trusted 옵션의 수정되지 않은 등록 read와 디스크 identity/version이 일치할 때만 수행합니다. 외부 변경이 있으면 원본 기록을 유지합니다. 기록 존재 표시만으로 서비스 복구 성공 또는 실제 중단 여부를 판정하지 않습니다.

이 초기 intent에는 아직 native 검수/실행 서비스 snapshot, staged 파일 identity와 단계별 진행 상태가 없습니다. 다음 transaction coordinator에서 승인 검토/서비스 상태·단계별 원자적 교체·undo·중단 복구를 연결해야 합니다. root helper의 전체 operation lock과 함께 사용할 예정이며 현재 모듈의 atomic 게시만으로 운영 여러 파일 교체를 승인하지 않습니다. stale 임시 기록/retention 관리도 남아 있습니다.

검사는 임시 fixture 및 실제 새 Node 프로세스의 readback입니다. publication alias 종료 구간은 fixture로 모사했으며 실제 writer SIGKILL/native/root/클러스터/설치 GUI 검증은 아닙니다. 이번 단계에서는 production build/deb를 새로 생성하지 않았습니다.
