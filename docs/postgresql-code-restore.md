# PostgreSQL 백업 전체 코드 복원 기반

`lib/postgresql-code-restore.mjs`는 private 백업 원문을 서버 내부에서만 읽고 기존 전체 코드 검수/적용 transaction으로 복원하는 서버 모듈입니다. 복구 페이지와 IDE의 기존 백업 복원 화면, 두 POST API(`postgresql-code-restore-plan`, `postgresql-code-restore`) 및 root helper에 연결했습니다. private context가 있는 백업은 새 경로를 사용하고 옛 백업의 기존 일반 복원 경로는 유지합니다. 새 경로의 검수 실패를 기존 경로로 우회하지 않습니다.

검토는 main 설정 경로와 백업 ID를 입력받습니다. 백업 파일의 private 권한·종류·대상·원문 hash와 context를 확인한 뒤 현재 main/include graph와 실행 서비스 상태를 검수합니다. 후보 graph가 백업 당시 graph와 같아야 합니다. 새 전체 코드 적용 백업에는 private graph archive 참조와 include 파일 원문을 보관합니다. 하지만 여러 파일 복원 transaction은 아직 없어 변경된 include 파일까지 되돌리는 기능은 없습니다. 이 경우 복원을 거부하고 운영 파일을 보존합니다.

공개 결과에는 백업 원문이나 비밀값을 포함하지 않습니다. 백업 전체 기록 digest, 원문 hash, 현재/후보 graph, 실행 서비스 digest를 검토값에 묶습니다. 적용에는 명시적 확인이 필요하며 클라이언트가 원문·계정 UID·명령·기준 경로를 지정하지 못합니다. 검수와 서비스 재확인 전후에 백업을 다시 읽어 변경을 감지합니다.

적용은 현재 설정을 새 private 백업으로 저장하고 기존 transaction으로 교체·재시작·실행 값 확인을 수행합니다. 기존 실패 복원과 외부 변경 보존 규칙을 재사용합니다. private context가 없는 옛 백업은 이 새 경로에서 거부하며 기존 복원 기능을 대체하지 않습니다.

임시 fixture 테스트는 실제 PostgreSQL native namespace, systemd 재시작, root/PG 소유권 유지, 설치 GUI를 증명하지 않습니다. 보관된 묶음의 여러 파일 복원과 실제 클러스터/설치 GUI 검증은 남아 있습니다. 두 POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt와 요청 schema를 검사합니다. UID와 백업 기준 경로는 root helper가 고정하며 요청에서 지정할 수 없습니다. 터미널에는 구조화한 결과와 백업 ID만 저장합니다. 화면은 대상/정책/연결 변경 때 검토·확인을 지우고 중복 실행 및 늦은 응답을 막습니다.

private graphArchive가 있는 백업의 기본 root 검수는 보관된 전체 원문으로 private 후보를 재구성합니다. 이 후보는 운영 include 파일 상태와 독립적이지만 현재 운영 교체 planner의 include drift 거부 조건은 유지됩니다. 상세 `docs/postgresql-archive-candidate.md`.
