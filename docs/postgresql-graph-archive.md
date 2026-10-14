# PostgreSQL 설정 묶음 보관

`lib/postgresql-graph-archive.mjs`는 등록된 PostgreSQL config graph를 private archive로 보관하는 내부 서버 모듈입니다. API에 파일 경로나 원문을 반환하는 기능은 없습니다.

전체 코드 적용의 현재 설정 백업에 `context.graphArchive` 참조를 넣습니다. 참조에는 UUID, archive SHA-256, 크기, graph 버전만 들어갑니다. 기존 backup context의 크기는 작게 유지하고 실제 파일은 같은 private 백업 폴더 아래 `graphs/<UUID>.json`에 별도로 보관합니다. 디렉터리700, 파일600 및 실행 계정 소유를 요구하며 부모 symlink/부적절한 쓰기 권한을 거부합니다.

주 설정과 모든 include 파일의 정확한 UTF-8 원문, 파일별 UID/GID/권한 비트, 파일 hash, include 순서/관계, include_dir의 이름 순서, 선택적 파일의 부재를 보관합니다. 등록 graph의 읽기 전후 상태를 다시 확인하며 임의로 만든 graph 객체는 거부합니다. graph 원문 한도1MiB/파일당256KiB/최대100파일을 유지하고 JSON escape가 커지는 경우를 포함해 archive를16MB로 제한합니다.

내부 reader는 private 백업에서 가져온 정확한 참조만 허용합니다. FD와 이름의 파일 동일성, private 권한, hardlink 부재, 정확한 byte 수/digest/graph 버전, 원문 hash와 클러스터 내부 경로를 검사합니다. 전체 코드 복원과 중단 복구의 private 백업 reader는 참조가 있으면 묶음 무결성과 main 원문 일치를 확인합니다. 참조 없는 이전 백업과의 호환성은 유지합니다. archive에는 비밀값이 포함될 수 있으며 브라우저/터미널에는 원문을 전달하지 않습니다.

이번 단계는 보관과 참조 검증입니다. 포함 파일을 함께 교체하는 transaction, 삭제/추가된 포함 파일 및 디렉터리의 복원, 여러 파일 작업의 중단 복구는 아직 구현하지 않았습니다. 기존 새 복원 경로는 포함 graph가 백업 당시와 달라진 경우 계속 거부합니다. 적용 전 실패 시 참조되지 않은 private archive가 남을 수 있으며 자동 삭제하지 않습니다. 보관 목록/retention 관리도 별도 작업입니다.

임시 fixture 검사는 실제 root 소유권/PG 계정/클러스터 재시작 또는 설치 GUI 동작을 증명하지 않습니다. 현재 장비에서 PostgreSQL16 native 실행 파일은 확인되지 않았습니다.

검증된 archive snapshot에서 private 전체 후보를 구성하고 기존 native 검수 coordinator로 전달하는 경로는 `docs/postgresql-archive-candidate.md`에 정리했습니다. 새 복원 기본 검수에서 이를 사용하며 여러 운영 파일 복원은 아직 없습니다.
