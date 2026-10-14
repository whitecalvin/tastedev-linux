# PostgreSQL 여러 파일 복원 progress reader (source)

`readPostgresqlGraphSwapProgress`는 검증·등록된 private intent와 ready stage ledger에서 swap 기록을 다시 읽는 내부 함수입니다. 현재 target이 before 상태라고 가정하지 않고 원래 private stage 메타데이터를 읽습니다. 실제 파일 rollback이나 서비스 작업은 하지 않습니다.

producer와 reader는 `postgresql-graph-swap-v2`의 동일 closed schema를 사용합니다. intent UUID/version·target·정확한 stage ledger bytes hash를 결합하고 변경 행의 수/경로/순서를 body와 비교합니다. UUID undo basename과 booleans, applying/activating/committed/rolling-back/rolled-back 상태별 불변 조건을 확인합니다. candidatePlaced 전에 candidateLinked, 원본이 있었던 후보의 originalMoved, originalRestored 전에 candidateRetired 등 잘못된 단계 조합을 거부합니다. checksum을 다시 만든 foreign path/추가 field/불가능한 committed 상태도 거부합니다.

executor private700 stage/custody 디렉터리와600 regular 단일-link progress 파일을 NOFOLLOW/FD로 읽습니다. bounded256KiB/fatal UTF-8/FD와 현재 이름 identity/원문 digest를 확인하고 intent 및 stage ledger를 다시 검사한 뒤 FD/현재 경로를 마지막에 확인합니다. 결과는 WeakMap 등록과 직렬화 proof에 묶이며 복사/변조 객체를 거부합니다. assert는 디스크 progress/custody 및 stage 버전/identity를 재확인합니다. 내부 context는 deep copy로 반환합니다.

공개 summary는 ID/path/phase/version/fileCount/recordVerified와 filesystemRecoveryVerified=false만 반환합니다. private 원문/undo basename을 포함하지 않습니다. 기록 검증은 실제 복구 완료가 아닙니다. 실제 새 Node 프로세스에서 private intent를 읽고 summary를 반환하는 source 검사를 수행했습니다.

이전 source primitive의 v1 progress는 stage 버전 binding이 없으므로 자동 승격하거나 삭제하지 않고 거부합니다. 초기 progress 게시 중 두-link crash와 unknown alias, unsafe permission/symlink/등록 후 변경은 보존하고 거부합니다. 실제 writer SIGKILL/전원 중단/root·PG UID가 다른 환경/native DB/설치 GUI 증거는 아닙니다.

새 프로세스 filesystem reconciliation·rollback primitive와 실제 writer SIGKILL fixture는 `docs/postgresql-graph-swap-recovery.md`에 추가했습니다. 아직 native/root/전체 전원 중단 구간 검증, native/service snapshot coordinator 및 GUI/API/helper 연결·보관 정리·패키징은 남아 있습니다. source proof `postgresql-swap-progress-source-20261005.json`에 결과를 기록합니다.
