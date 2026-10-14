## 2026-10-09 AI API 연동 사용자 완료 승인

사용자가 “AI API 는 완료된거로 처리한다”라고 승인했습니다. AI API 연동 항목은 사용자 수용 완료로 기록하며 추가 API 호출·한도 해소 검사는 진행하지 않습니다. 실제 OpenAI gpt-6-luna 테스트에서 응답 제한 오류가 반환된 사실은 유지합니다. 업체의 정상 분석 응답을 확인했다는 의미가 아닙니다. 현재 작업은 전체 페이지 디자인이며 이 항목 때문에 전체 목표를 차단하지 않습니다.

## 2026-10-05 PostgreSQL 실행 중 준비 기록 binding (source)

교체 실행은 ready stage의 hash·전체 file identity를 잠금/검수 전후에 고정하고 progress 게시 및 서비스 콜백·복구 경계마다 같은 intent/stage인지 재검사합니다. 같은 내용의 다른 inode·재계산 digest의 변조·삭제·unknown hardlink를 기존 검토로 승인하지 않습니다. 문제가 있으면 committed/rolled-back 성공 단계로 게시하지 않고 기존 progress·원본·후보를 보존합니다.

집중75 및 전체907 tests PASS. 검수/활성화/검증/복구의 16개 metadata obstruction fixture를 포함합니다. proof: `.runtime/verification/postgresql-stage-binding-source-20261005.json`. native/service/GUI/helper 연결, 원래 service/resource scope, 전체 crash window·보관 정리 및 패키징은 미완료입니다. 신규 deb/설치 없음, 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 유지. 전체 목표 PARTIAL.

## 2026-10-05 PostgreSQL in-process rollback 전체 원본 검사 (source)

실패 후 원본 복원을 시작하기 전에 unchanged 참조 파일·target·undo·남은 stage와 include_dir membership을 모두 검토합니다. 외부 수정·unknown hardlink·원본 손상은 후보를 이동하거나 다른 행을 되돌리기 전에 거부하며 마지막 progress와 보관 원본을 유지합니다. 정상 복구는 기존 경로로 진행합니다.

집중59 및 전체891 tests PASS. 실제 /tmp 파일 fixture의 before-only 참조/목록 변경, 먼저 처리된 후보/undo 변경, unknown alias 보존을 검사했습니다. proof: `.runtime/verification/postgresql-rollback-preflight-source-20261005.json`. native/service/GUI/helper 연결과 in-process stage ledger binding·원래 service/resource scope·보관 정리·패키징은 남았습니다. 신규 deb/설치는 없으며 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 유지, 전체 목표 PARTIAL입니다.

## 2026-10-05 터미널 대화형 입력 표시 / PostgreSQL 원본 include graph (source)

대화형 account-shell·Bash·Codex·Claude PTY에 echo always를 적용했습니다. 실제 Bash·sh에서 Enter 이전 영문·한글 표시 및 단일 실행, 프로그램의 비밀번호 에코 해제를 확인했습니다. 기존 세션은 보존하며 새 터미널 탭부터 적용됩니다. 명령/출력 작업의 echo never는 유지합니다. 브라우저 한영 전환/IME 검증은 별도입니다.

PostgreSQL 복원 snapshot은 백업 graph와 현재 원본 include graph의 합집합을 캡처하며 원본에서만 참조하는 파일은 보존합니다. 필수 include 누락/범위 외 참조/순환은 incomplete로 기록합니다. v2 intent는 같은 탐색기로 원본 graph를 재검증하고 legacy v1은 complete=false로 구분합니다. 운영 resource/service scope와 fixed native coordinator 연결은 미완료입니다.

터미널 집중16, PostgreSQL 집중73, 전체886 tests와 literal 번역 검사 PASS. proof: `.runtime/verification/terminal-echo-and-pg-before-graph-source-20261005.json`. 신규 build/deb·설치 GUI 검증은 수행하지 않았습니다. 배포 SHA-256은 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca` 그대로입니다. 전체 제품 목표 PARTIAL.

## 2026-10-05 PostgreSQL 새 프로세스 filesystem rollback primitive (source)

등록 v2 progress와 실제 target/undo/stage/retired의 inode/hash/권한·정확한 hardlink alias를 대조해 중단된 원본 복구를 수행합니다. 변경 전 모든 파일/membership을 검토하고 역순으로 no-overwrite 복구하며 private 진행을 fsync/atomic 갱신합니다. 외부 수정/unknown alias는 보존하고 거부합니다. 검수 실패는 rolling-back을 유지하며 committed를 자동 되돌리지 않습니다.

집중58 tests 및 literal 번역 검사 PASS. 실제 writer subprocess SIGKILL at activating 및 새 프로세스 파일 복구, 여섯 개 rename/link/unlink checkpoint fixture, runtime 실패 재시도와 외부 파일 보존을 확인했습니다. 최종 전체873 tests PASS. source proof `postgresql-swap-recovery-source-20261005.json`. 종료가 확인된 정확한 fixture inode의 빈 lock만 테스트에서 명시적으로 정리했으며 production unknown lock 자동 삭제는 없습니다. root/helper kernel lock/PG 다른 UID/native service/전원 중단/설치 GUI 증거는 아닙니다.

durable 원래 service/runtime scope·before include graph 전체 capture와 fixed native coordinator, 초기 게시 alias/더 많은 전원 중단 구간, 보관 정리·GUI/API/helper 연결·패키징이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL private swap progress reader (source)

ready private stage에서 원래 target 상태를 가정하지 않는 recovery context와 closed-schema v2 progress reader를 추가했습니다. producer도 같은 validator와 정확한 stage ledger 버전을 기록합니다. 기록의 intent/target/행 순서/UUID undo basename/진행 flags·단계 불변 조건, bounded private FD/bytes/hash를 검사하고 stage/intent를 다시 확인합니다. WeakMap 등록 proof와 디스크 재확인으로 복사/변조·후속 변경을 거부합니다. 공개 summary는 실제 복구 검증이 false임을 표시하며 원문을 포함하지 않습니다.

집중44 tests 및 literal 번역 검사 PASS. 실제 새 Node 프로세스 readback과 재계산 checksum의 foreign path/잘못된 flags/추가 field, 권한/hardlink/후속 stage 변경 보존을 확인했습니다. 최종 전체859 tests PASS. source proof `postgresql-swap-progress-source-20261005.json`. filesystem rollback 재개/SIGKILL/native/root/설치 GUI 증거는 아닙니다.

새 프로세스 filesystem reconciliation/rollback, 전체 crash window·보관 정리, native/service snapshot coordinator 및 GUI/API/helper 연결·패키징이 남았습니다. source v1 progress는 자동 삭제/승격 없이 거부합니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 교체·실패 원상 복구 primitive (source)

ready stage를 변경/생성/제거하는 내부 실행 primitive를 추가했습니다. 원본을 UUID undo로 보관하고 후보는 no-overwrite hardlink로 게시합니다. private progress에 단계별 상태를 보관하고 전체 파일/membership 검수 뒤 trusted 서비스 콜백을 호출합니다. 실패 시 원본을 역순 복구·재검수하며 외부 수정 target은 덮어쓰지 않습니다. 성공/실패 뒤 intent/progress/undo는 보존하며 swap 기록이 있으면 intent 삭제를 막습니다.

집중33 tests 및 literal 번역 검사 PASS. /tmp에서 실제 여러 파일 교체/추가 conf 제거/누락 파일 생성/활성화·검수 실패 복구/외부 수정 보존을 확인했습니다. 최종 전체848 tests PASS. source proof `postgresql-graph-swap-source-20261005.json`. 서비스 콜백 fixture이며 실제 native/root/운영 DB/SIGKILL/설치 GUI 증거는 아닙니다.

progress reader·새 프로세스 interrupted 복구/전체 crash window, 성공·복구 뒤 보관 정리 및 고정 native/service coordinator·GUI/API/helper 연결·패키징이 남아 있습니다. 새 build/deb는 만들지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 준비 완료 후보 취소·정리 (source)

ready 후보를 private700 custody로 FD 기준 이동한 뒤 기록된 inode/내용/권한을 재확인해 정리하는 내부 함수를 추가했습니다. 직접 생성한 빈 디렉터리만 역순으로 제거합니다. 변조된 후보나 unrelated 파일은 보존하고 private 진행/intent도 유지합니다. rename/unlink 후 checkpoint 전 중단 상태를 재개하며 운영 target 원문은 교체하지 않습니다.

집중25 tests 및 literal 번역 검사 PASS. 정상 취소·생성 디렉터리 정리·변조/외부 파일 보존·중단 checkpoint fixture를 포함합니다. 최종 전체840 tests PASS. source proof `postgresql-stage-cancel-source-20261005.json`. 실제 writer SIGKILL/전원 중단/root와 PG 계정이 다른 환경/native/service/설치 GUI 검증은 아닙니다.

준비 중 기록 없는 생성/디렉터리 chown 중단, 게시 hardlink crash, 기록 삭제 후 빈 custody orphan 정리, 서로 다른 파일시스템 정책, 실제 여러 파일 교체/실패 복구/GUI/API/helper 연결이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 중단된 임시 파일 준비 재개 (source)

preparing 기록을 명시적으로 재개하는 내부 함수를 추가했습니다. 완료 temp는 전체 내용·identity·권한이 같아야 하고 pending temp는 기록된 inode와 후보 바이트 prefix·허용 소유자/권한이 일치해야만 같은 FD에 원문을 완성합니다. 기록이 없는 기존 이름, 내용/inode 변조는 보존하고 거부합니다. 원래 설정 파일은 교체하지 않습니다.

집중19 tests와 literal 번역 검사 PASS. 실제 새 Node 프로세스가 private journal을 검증해 재개하는 검사 및 변조 보존을 포함합니다. 최종 전체834 tests PASS. source proof `postgresql-stage-resume-source-20261005.json`. 실제 writer SIGKILL, root/PG 계정이 다른 환경, native/service 및 설치 GUI 검증은 아닙니다.

임시 파일/생성 디렉터리 안전한 정리, inode 기록 전 중단과 chown 중간 상태 재개, 여러 파일 교체/실패 복구 및 GUI/API/helper 연결이 남았습니다. 새 build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 임시 복원 부모 디렉터리 FD 고정 (source)

인접 후보 파일/새 부모 생성과 ready 파일 검증을 열린 부모 디렉터리 FD 기준으로 변경했습니다. 모든 조상을 O_DIRECTORY/O_NOFOLLOW로 유지하고 snapshot/생성 기록 및 현재 이름 경로와 비교합니다. 부모가 심볼릭 링크나 다른 디렉터리로 교체돼도 교체된 경로로 쓰지 않고 변경을 거부합니다. 새 부모의 chown 전 실행 계정 소유와700 권한도 확인합니다.

집중13 tests와 literal 번역 검사 PASS. 실제 /tmp 부모 교체 fixture 두 가지를 포함합니다. 최종 전체828 tests PASS. source proof `postgresql-stage-pinned-source-20261005.json`. 실제 root/PG 계정이 다른 환경·native/service·writer SIGKILL·설치 GUI 증거는 아닙니다.

여러 파일 교체/실패 복구/중단 재개·정리 및 GUI/API/helper 연결이 남았습니다. 새 production build/deb는 생성하지 않았고 기존 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 target 파일/서비스/장비 설치 변경은 없습니다. 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 복원 인접 임시 파일 준비 기반 (source)

persistent intent에서 private stage ledger를 게시하고, 후보의 인접 temp 이름·생성 inode·내용 hash·소유 계정/권한·ready 상태를 fsync와 atomic ledger 갱신으로 보관하는 모듈을 추가했습니다. 없어진 부모는 trusted UID/GID의700 디렉터리로 준비하고 target 파일은 absent/원본 상태를 유지합니다. 준비 전/각 단계/완료 때 원본 파일·부모·membership·intent를 재확인합니다. ready inspect는 temp 내용/identity/권한을 확인하며 변조 파일/기록은 보존합니다. stage 기록이 있으면 intent를 지우지 못하게 했습니다.

집중11·전체826 tests 및 literal 번역 검사 PASS. /tmp에서 실제 temp 및 missing parent를 만들고 target unchanged/변조 보존/intent 삭제 보호를 확인한 source fixture 증거입니다. 실제 root/PG 계정이 다른 환경, parent named-path race, writer SIGKILL/native/service/설치 GUI 증거는 아닙니다. source proof `postgresql-graph-stages-source-20261005.json`, 상세 `docs/postgresql-graph-restore-stages.md`.

root 연결 전 descriptor 기반 부모 고정/race 검증이 필요합니다. stage 게시 중단/pending 재개·정리, 실제 여러 파일 교체/실패 undo·서비스 재검증/interrupted recovery 및 완료 cleanup·GUI/API/helper 연결이 남아 있습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았고 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 host 파일/서비스/서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 복원 persistent intent 기반 (source)

등록된 snapshot의 원본/후보 원문·UID/GID/권한·FD identity, 부모 디렉터리 상태, include_dir membership 및 대상 버전을 private intent 파일로 보관하는 내부 모듈을 추가했습니다. 파일/디렉터리 fsync와 atomic link 게시를 사용하고 기존 기록을 덮어쓰지 않습니다. 게시 전 snapshot을 재확인합니다. 새 프로세스에서 디스크 기록을 검증·등록할 수 있으며 공개 summary에는 원문이 없습니다. 등록 read/정확한 private root·trusted 옵션·현재 identity/version 일치 때만 지웁니다. 수정된 기록과 알 수 없는 hardlink는 보존하고 거부합니다. 게시 후 UUID 임시 link 정리 전 종료 구간을 fixture로 모사해 안전한 alias 정리를 확인했습니다.

집중12·전체821 tests 및 literal 번역 검사 PASS. 실제 새 Node 프로세스의 readback을 검사했지만 실제 writer SIGKILL/native/root/클러스터/설치 GUI 검사와는 다릅니다. source proof `postgresql-graph-restore-journal-source-20261005.json`, 상세 `docs/postgresql-graph-restore-journal.md`.

아직 native/service snapshot·staged inode·단계별 진행 및 여러 파일 교체/실패 복원/중단 복구 executor, GUI/API/helper에 연결하지 않았습니다. 이번 단계에서는 production build/deb를 새로 생성하지 않았고 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 전체 목표 PARTIAL이며 나머지 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 여러 파일 복원 snapshot 기반 (source)

검증·등록 archive에서 여러 파일 복원 대상을 읽는 내부 모듈을 추가했습니다. 원래 파일의 생성/변경/동일, 현재 include_dir의 추가 conf 파일 및 원래 없던 선택적 파일의 제거를 검토합니다. 현재 필수 원본/디렉터리가 없어도 검토를 구성하고 정확한 현재 원문/소유 계정/권한/FD identity를 내부 undo 입력으로 보관합니다. 공개 snapshot은 경로/action/hash/membership만 포함합니다. 생성 중 전체 재확인과 검토 후 재확인으로 파일·권한·부모 inode·membership·선택적 부재 변경을 감지합니다. unrelated hidden/non-conf 파일은 보존합니다. 복사/변조 snapshot을 거부하고 내부 원문 accessor는 deep copy를 반환합니다.

집중19·전체815 tests 및 literal 번역 검사 PASS. 상세 `docs/postgresql-graph-restore-snapshot.md`, source proof `postgresql-graph-restore-snapshot-source-20261005.json`. 아직 GUI/API/helper에 연결하지 않았고 운영 여러 파일을 교체하지 않습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았으며 기존 검증 배포 SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`을 유지합니다.

persistent 여러 파일 journal/undo/교체/실패 복원/중단 복구와 삭제 디렉터리 생성 정책, 서비스 검수·GUI/API/helper 연결이 남아 있습니다. 현재 주 설정 복원은 include drift를 계속 거부합니다. native/root/클러스터/설치 GUI/E2E 및 나머지 전체 목표 PARTIAL입니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 묶음 보관·복원 후보 검수 연결 및 deb 반영

private archive reader가 검증·등록한 snapshot에서 주 설정/모든 include 원문·include_dir 순서/빈 디렉터리·선택적 파일 부재를 private 임시 경로에 재구성합니다. 운영 include 파일이 변경/삭제되거나 새 파일이 생겨도 후보는 보관 당시 graph와 정확히 같아야 합니다. 복사/변조 record를 거부하고 기존 namespace 검수 coordinator와 연결해 고정5개 공개 값만 반환합니다. 후보와 archive snapshot을 재확인하고 성공/실패에 정리하며 교체된 임시 경로는 삭제하지 않습니다.

graphArchive가 있는 일반 전체 코드 복원의 기본 root 검수에 이 경로를 연결했습니다. trusted source fixture validator와 이전 백업의 검수 경로는 유지합니다. 앞서 source에서 추가한 archive capture/파일 UID/GID/권한 보관/적용 백업 참조/복원·중단 복구 reader 검증도 이번 deb에 포함했습니다.

집중27·전체809 tests, production build, literal 번역 검사 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP의 복원 인증/정책 차단 및 module closure를 확인했으나 root/native 복원 실행은 하지 않았습니다. evidence `package-2026-10-05T06-40-42.235Z.json`, source proof `postgresql-archive-candidate-integration-source-20261005.json`.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-archive-candidate.deb` 및 기본 이름, SHA-256 `8ed8f0971bf4ab5655f9ab5425b8251cebc520290c5775125e6b45e041434fca`. 장비에 설치하지 않았고 운영 파일/서비스/서버 설치 변경은 없습니다. 후보 재구성은 운영 파일 복원이 아니며 현재 복원 planner는 변경된 include graph를 계속 거부합니다. 여러 파일 transaction/실패 복원/중단 복구, archive 목록/retention, 실제 native/root/설치 GUI/E2E 및 나머지 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 설정 묶음 보관 및 적용 백업 연결 (source)

등록 config graph의 주 설정과 모든 include 원문·파일 UID/GID/권한·hash, include 순서/관계, include_dir 이름 순서와 선택적 파일 부재를 private graph archive에 보관하는 내부 모듈을 추가했습니다. 전체 코드 적용 백업에 UUID/digest/크기/graphVersion만 든 참조를 연결했습니다. 큰 원문을 기존 작은 context에 넣지 않고 private700/600 `graphs/<UUID>.json`으로 분리합니다. capture 전후 registered graph를 재확인하고 private reader에서 digest/FD/파일 동일성·권한·경로·원문 hash를 검사합니다. 복원/중단 복구 백업 reader는 참조가 있으면 묶음과 main 원문 일치도 확인합니다. 참조 없는 이전 백업은 유지합니다. 브라우저·터미널에 묶음 원문을 반환하지 않습니다.

집중34·전체803 tests 및 literal 번역 키 검사 PASS. graph source1MiB 한도 내 JSON escape가 일반 백업보다 커지는 경우도 exact bytes 보존을 확인했습니다. 이번 단계에서는 production build/deb를 새로 만들지 않았으며 기존 검증 배포 SHA-256 `99ba606cf2a3aab843f257c37b9f8be02f0756946a0f6ebc32943c2d50798d86`을 유지합니다. source evidence `postgresql-graph-archive-source-20261005.json`, 상세 `docs/postgresql-graph-archive.md`.

보관된 여러 파일을 함께 교체하는 복원 transaction 및 중단 복구는 아직 없습니다. 기존 복원은 변경된 include graph를 계속 거부합니다. 실패 후 참조되지 않은 private archive의 목록/retention도 남았습니다. 실제 native/root/클러스터 적용·복원·설치 GUI/E2E, archive 변경 패키지 반영 및 나머지 전체 목표는 PARTIAL입니다. 운영 파일/서비스/서버 설치 변경은 없습니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 백업 전체 코드 복원 GUI/API/helper 연결

복구 페이지 및 PostgreSQL IDE의 기존 백업 복원 화면에 새 서버 검토/복원 모듈을 연결했습니다. private context가 있는 백업은 main/include graph·실행 서비스·백업 전체 기록 digest를 확인하고 명시적 확인 후 복원합니다. 공개 표에는5개 runtime/candidate 값만 표시하며 백업 원문을 보내지 않습니다. 새 검토 실패는 기존 복원 경로로 우회하지 않습니다. context 없는 옛 백업의 일반 복원 경로는 유지합니다. 대상/정책/연결 변경 때 검토/확인을 무효화하고 중복 실행 및 늦은 응답을 막습니다.

새 두 POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt와 schema를 검사합니다. root helper의 고정 UID lookup/백업 경로와 checksum module closure를 사용합니다. 적용은 현재 설정의 새 private 백업·기존 transaction·클러스터 재시작/실패 원본 복원 및 외부 변경 보존 규칙을 재사용합니다. 터미널은 구조화한 상태/백업 ID만 기록합니다. 신규 문구 en/ja/pt 및 literal 번역 검사 PASS.

집중22·전체796 tests, production build, 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 새 복원 API의401/cross-origin403/비활성 DB 권한403을 확인했습니다. 이 HTTP 검사는 root/native 복원 실행을 하지 않았습니다. source evidence `postgresql-code-restore-integration-source-20261005.json`, package evidence `package-2026-10-05T06-19-40.301Z.json`.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-restore.deb` 및 기본 이름, SHA-256 `99ba606cf2a3aab843f257c37b9f8be02f0756946a0f6ebc32943c2d50798d86`. 장비에 설치하지 않았으며 운영 파일/서비스/서버 설치 변경은 없습니다. 포함 파일의 내용까지 백업/복원하는 묶음 기능은 아직 없어 포함 파일이 백업 당시와 달라졌다면 새 경로는 거부합니다. 실제 PostgreSQL native/root 소유권/클러스터 복원·설치 GUI/E2E, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증을 포함한 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 백업 전체 코드 복원 서버 모듈 기반

새 `lib/postgresql-code-restore.mjs`는 private 백업 원문을 클라이언트에 노출하지 않고 기존 main/include graph 검수·실행 서비스 확인·원본 백업·재시작/실패 복원 transaction을 재사용합니다. 백업 기록 전체 digest와 현재/후보 graph·서비스·원문 버전에 묶인 검토값 및 명시적 확인을 요구합니다. 검수와 서비스 확인 전후 백업을 다시 읽어 교체를 거부합니다. 후보 graph가 백업 당시 graph와 같아야 하므로 포함 파일 변경은 거부합니다. include 원문을 함께 보관하고 되돌리는 백업 묶음 기능은 아직 없습니다.

집중10 및 전체790 tests PASS. 임시 파일과 서비스/검수 fixture로 검사했으며 실제 native 클러스터/root 소유권/설치 GUI는 미검증입니다. GUI/API/helper에는 아직 연결하지 않았고 이번 단계에서는 production build 및 새 deb를 만들지 않았습니다. 기존 검증 배포 SHA-256 `0170007c2515ba626eb8b022bcd7ac8ae2614be7e13c641ba9834100d86659c4`을 유지합니다. source evidence `postgresql-code-restore-source-20261005.json`; 상세 `docs/postgresql-code-restore.md`. 운영 파일/서비스/서버 설치는 변경하지 않았으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 중단 복구 GUI/API/helper 연결

복구 페이지와 PostgreSQL IDE의 복원 팝업에 중단 복구 검토·확인·실행을 연결했습니다. 복구 페이지에서는 실제 클러스터 main 파일 목록을 명시적으로 조회하고 선택하며 IDE에서는 선택된 main 파일을 기본 대상으로 사용합니다. 연결 변경은 기존 목록/선택을 지우고 대상/정책/연결 변경은 검토/확인을 무효화합니다. 중복 실행 및 늦은 응답을 막고 복구 후 목록을 갱신합니다. 기존 일반 백업 복원과 HBA 경로를 유지합니다.

두 POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt와 path/확인 digest만 허용하는 schema를 검사합니다. root helper는 서버 계정 lookup과 checksum module closure를 사용하며 UID/명령/기준 경로를 요청으로 지정하지 못합니다. 종료/실패 상태를 포함한 backend 복구와 private 원래 graph/runtime context를 배포에 포함했습니다. 터미널은 구조화한 복구 상태와 백업 ID만 기록합니다. 새 문구는 en/ja/pt에 추가했습니다.

관련33 tests, 수정 후 화면 연결2 tests, 최종 전체785 tests, production build, literal 번역 키 검사 및 격리 package:verify --terminal PASS. 첫 전체784/1은 신규 IDE 복원 팝업 fixture의 postgresql-backups 응답 누락이었으며 수정 후 전체를 다시 검사했고 실패 로그도 보존했습니다. 실제 패키지 HTTP에서 중단 복구 두 API의401·cross-origin/비활성 DB 권한403을 확인했습니다. 이 작은 복구 요청 검사와 전체 코드 API의8KiB 초과 요청 검사를 최종 evidence에서 별도 항목으로 기록했습니다. root/native 복구 실행은 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-recovery.deb` 및 기본 이름, SHA-256 `0170007c2515ba626eb8b022bcd7ac8ae2614be7e13c641ba9834100d86659c4`, evidence `package-2026-10-05T06-00-51.653Z.json`, source hash `postgresql-code-recovery-integration-source-20261005.json`. 현재 PostgreSQL16 binary 존재 확인은 false이며 native namespace·실제 클러스터 적용/복구·root 소유권 유지 교체·설치 브라우저 GUI/E2E는 미검증입니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았고 전체 목표 PARTIAL입니다. whole graph 백업 복원/include 파일 단독 적용, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 중단 복구 backend 기반

새 private 백업 context에 원래 graph 버전·클러스터 경로/unit/major·auto configuration 부재/hash와5개 공개 runtime 값을 보존합니다. 원문 없는 공통 journal 형식은 유지하며 context는 private 백업에만 넣습니다. 이 context를 사용해 정확한 backup/journal/current-original graph/service 상태에 묶인 중단 복구 검토와 원본 재검수·재시작·확인을 구현했습니다. 종료/실패한 loaded cluster unit의 MainPID/ControlPID0을 확인한 경우에도 복구를 준비하며 active 서비스의 조회 실패를 종료 상태로 대체하지 않습니다.

이미 원본이 복원된 경우 inode를 유지하고 서비스만 재시도합니다. 백업·참조 파일·서비스·auto configuration 변경, 확인 없는 복구 및 외부 편집을 거부합니다. 실패 시 원본과 journal을 보존하며 검증된 원래 경로/runtime 값과 graph를 확인한 경우만 기록을 정리합니다. 원문 교체로 바뀌는 디스크 설정 오류 수는 재시작 전 service identity에서 제외하고 재시작 후 오류0을 확인합니다. context 없는 구버전 백업은 보존하되 자동 중단 복구에 사용하지 않습니다.

관련22 tests와 최종 전체780 tests PASS. 첫 관련 검사에서 비밀값 assertion이 공개 private-config-options scope 문구를 오인했습니다. 실제 비밀값 기준으로 수정한 후 관련·전체를 재검사했고 실패 로그도 보존했습니다. 증거/source hash는 postgresql-code-recovery-source-20261005.json, 설명은 postgresql-code-recovery.md입니다.

현재 source-only backend 단계입니다. 관리자 helper/API/GUI 복구 연결 및 배포는 남아 있으며 이번 단계에서는 새 production build/deb를 생성하지 않았습니다. 기존 검증 deb는 PostgreSQL 전체 코드 적용 버전664afb2646a17c8550270d47f1e995c834de0b04457969a05f019198c0ab6cc6을 유지합니다. 실제 PostgreSQL native namespace·클러스터 적용/복원·root에서 소유권 유지 교체·설치 GUI/E2E는 미검증입니다. 운영 파일·서비스·대상 서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. whole graph 백업 복원/include 파일 단독 적용, 전체 번역·공개 APT/desktop·AI 실연동 및 나머지 실환경 검증 범위도 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 GUI/API/helper 적용 연결

PostgreSQL main 파일의 GUI/코드 초안을 헤더 검수 팝업에서 검수하고 클러스터 재시작 영향 확인 후 적용하도록 연결했습니다. 원문·원본/후보 include graph·실행 서비스 snapshot의 검토 digest와 정확한 confirm을 전달합니다. 연결/정책/입력 변경 때 검토를 무효화하고 중복 실행·늦은 응답을 막습니다. pg_hba.conf는 기존 별도 경로를 유지합니다. include 파일 단독 전체 코드 적용은 지원하지 않으며 main 후보에 참조된 graph를 함께 검수합니다.

API/helper에서 로그인·동일 origin·databaseChanges·sudoWithoutPrompt, 1.6MB JSON/262144byte UTF-8 원문 한도를 검사합니다. 계정 UID는 고정 서버 lookup으로 구하고 요청의 기준 경로/UID/실행 명령을 거부합니다. 관리자 checksum module closure/작업 allowlist/보안 라벨과 실행 timeout을 연결했습니다. native 후보 검수·서비스/auto configuration 확인·private 원본 백업·클러스터 재시작·실패 시 복원을 재사용합니다. 터미널은 구조화한 검수/적용 상태와 백업 ID만 기록하며 원문·비밀값·native 상세 로그를 기록하지 않습니다. 새 문구는 en/ja/pt에 추가했습니다.

관련30 tests, 최종 전체773 tests, production build, literal 번역 키 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 PostgreSQL 코드 두 API의401·cross-origin/비활성 권한403과8KiB 초과 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/native 실행을 하지 않았습니다. verifier 증거의 범위 이름에 PostgreSQL을 명시해 최종 검증 기록을 갱신했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-postgresql-code-operation.deb` 및 기본 이름, SHA-256 `664afb2646a17c8550270d47f1e995c834de0b04457969a05f019198c0ab6cc6`, evidence `package-2026-10-05T05-30-41.605Z.json`, source hash `postgresql-code-integration-source-20261005.json`. 현재 장비에는 PostgreSQL16 실행 파일이 없어 native namespace·실제 클러스터 적용/복원·root에서 PostgreSQL 소유 파일 교체·설치 브라우저 GUI/E2E는 미검증입니다. 전체 코드 중단 복구 adapter/whole graph 백업 복원 연결, 전체 번역·공개 APT/desktop·AI 실연동 및 다른 실환경 검증은 남아 있습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 코드 검토·적용 backend 기반

전체 원문·원본/후보 graph·실행 서비스 snapshot에 묶인 검토 digest와 적용 transaction을 구현했습니다. 고정 읽기 전용 SQL로 공개 runtime 값과 디스크 설정 오류 수를 조회하고 postgresql.auto.conf의 부재/hash를 확인합니다. 상위 디렉터리는 descriptor를 순차 열어 심볼릭 링크와 경로 교체를 검사하며 원문을 결과에 노출하지 않습니다. 신뢰된 PostgreSQL 소유 UID를 파일 검수·교체·복원에 허용하고 백업/journal은 실행 계정의 private 소유를 유지합니다. 기존 PostgreSQL backup kind를 기록합니다.

적용 전 재검수·graph/service 재확인, 적용 후 고정 unit 재시작 및 실제 공개 값 확인을 추가했습니다. 실패 시 원본/서비스 복구를 시도하며 외부 편집은 덮어쓰지 않습니다. 검토 후 source/auto configuration 변경, 실패 후 복원, 외부 편집 보존, 고정 readonly SQL, unsafe 경로/링크/하드링크 거부를 fixture로 검사했습니다. 공통 중단 복구 검수에서 PostgreSQL 소유 UID를 놓친 부분도 수정했습니다.

관련19 tests와 최종 전체768 tests PASS. 증거·소스 hash는 postgresql-code-operation-source-20261005.json, 로그는 tastedev-pg-code-focused.log와 tastedev-pg-code-full.log이며 사용법/제한은 postgresql-code-operation.md입니다. 현재 단계는 source-only입니다. helper/API/GUI 및 별도 중단 작업 복구·백업 복원 연결, PostgreSQL native namespace/실제 운영 기동·root 소유 전환·설치 GUI/E2E는 남아 있습니다. 이번 단계에서는 새 deb 또는 production build를 수행하지 않았습니다. 기존 검증 deb를 유지하고 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL native 옵션 격리 검수기·coordinator 기반

PostgreSQL 설정 graph→private 후보→고정 native 옵션 조회→후보/운영 graph 재확인→cleanup coordinator를 추가했습니다. native 실행은 고정 postgres -C의 공개5개 항목과 id -u/-g만 허용하며 binary/argv를 요청으로 지정하지 않습니다. namespace 전체 분리·추가 userns 금지·비-root UID/GID·capabilities 제거·환경 초기화·리소스 제한, private 후보 읽기 전용 바인드, 명령당30초/출력4096byte 제한을 설정합니다. 실행 파일과 후보 변경, 계정 불일치, namespace 실패, 허용 외 출력은 거부하고 호스트 검수로 대체하지 않습니다.

root helper용 기본 후보 계정은 UID/GID65534입니다. 호스트 상위 private 디렉터리는 실행 계정 소유0700을 유지하고 payload만 검수 계정 소유0700/0600으로 구성해 비-root 프로세스의 읽기와 호스트 비밀 원문의 보호를 함께 준비했습니다. namespace에서는 payload만 마운트하며 상위 보호 경로를 새로 생성합니다. 원본 파일 소유권은 변경하지 않습니다. 고정 passwd/group을 제공합니다. fixture는 현재 계정으로 배치·검수 계정을 확인하며 실제 root65534 chown 및 namespace 실행 증거와 구분합니다.

관련12 tests, 최종 전체759 tests PASS. 첫 fixture/전체 실행에서 secret assertion이 public scope 문자열 private-config-options까지 오인했습니다. 실제4개 비밀값을 확인하도록 수정한 후 관련·전체 검사를 다시 실행했고 실패 로그도 보존했습니다. 소스 hash와 fixture/native 범위는 postgresql-config-validation-source-20261005.json, 설명과 공식 근거는 postgresql-config-validation.md입니다.

현재 PostgreSQL16 binary가 없어 native parse/namespace·실제 서비스 적용·root65534 ownership 전환은 미검증입니다. postgres -C는 실제 startup override와 postgresql.auto.conf, 운영 data/TLS/플러그인 접근성을 증명하지 않으며 고정 data_directory는 private /tmp입니다. source-only 단계로 GUI/API/helper·전체 코드 적용/복원 연결은 남아 있습니다. 이번 단계에서는 deb를 생성하거나 설치하지 않았고 기본 검증 deb는 이전 MariaDB 전체 코드 적용 버전을 유지합니다. 운영 파일·서비스·대상 서버 설치 변경은 없으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 PostgreSQL 전체 설정 graph·private 후보 기반

기존 PostgreSQL 적용 경로는 선택 파일만 native 검사하며 include graph 전체를 고정하지 않았습니다. 전체 코드 적용을 위한 별도 graph와 private 후보 기반을 추가했습니다. 같은 클러스터 내부 include/include_if_exists/include_dir, 상대/절대 경로, C 순서 디렉터리 참조, 선택 참조 부재를 추적합니다. 파일 identity/hash와 디렉터리 목록을 고정하며 초안 override가 있어도 운영 원본 변경을 검사합니다. 외부 경로·심볼릭 링크·권한 위반·순환·UTF-8/크기 한도를 거부합니다. 옵션 값은 공개 graph에 포함하지 않습니다.

후보는 등록된 최신 snapshot만 받아 모든 참조와 디렉터리 내 복사본을 private 경로로 재작성합니다. 원본을 변경하지 않으며 후보 hash/권한/identity를 확인합니다. cleanup은 최초 임시 디렉터리 identity를 확인하고 교체된 경로의 파일은 삭제하지 않습니다. 현재 구현은 source 기반이며 GUI/API·native 옵션 검수·서비스 identity·transaction 적용/복원에 연결하는 단계가 남아 있습니다. postgresql.auto.conf 및 실제 서비스 인수의 override도 별도 검사해야 합니다. 설명과 공식 근거는 postgresql-config-graph.md입니다.

관련6 tests, 전체753 tests PASS. 이후 cleanup 경로 교체 거부 assertion을 추가한 최종 관련6 tests도 PASS. 증거 및 소스 hash는 postgresql-config-graph-source-20261005.json과 tastedev-pg-config-graph-\*.log입니다. PostgreSQL16 실행 파일이 없어 native 실행 검증은 미완료입니다. 새 모듈은 아직 배포 helper에 연결하지 않아 이번 단계에서 새 deb를 생성하지 않았습니다. 검증된 기본 deb는 이전 MariaDB 전체 코드 적용 버전(1e0e66052c7143fbb64fd8f05497223dc9a485d719d2e6009c2e328ed82435ce)을 유지합니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았고 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 전체 코드 검수·검토·운영 적용 연결

MariaDB 파일/그룹 설정과 코드 초안 전체를 헤더 검수 팝업에서 검수하고 재시작 영향 확인 후 적용할 수 있도록 연결했습니다. main 설정 선택을 지원하며 선택 파일·기준 버전·운영/후보 include graph·정확한 원문의 hash에 검토를 묶습니다. 지원 폼 밖 옵션도 원문 전체 교체로 반영합니다. 검토 후 신규 include 파일 변경이나 재검수 중 graph 변경을 거부하고 기존 namespace 옵션 검수·서비스 main 검사·private 원본 백업·재시작 실패 원문 복원/복구 transaction을 사용합니다.

API와 root helper에서 schema/허용 경로/원문 UTF-8 262144 byte/확인을 검사합니다. JSON 한도1.6MB, 로그인·동일 origin·databaseChanges·sudoWithoutPrompt 권한을 요구하며 filesystem root·runner 지정은 거부합니다. helper closure/작업 allowlist/보안 작업 라벨을 포함했습니다. GUI main·초안·연결·정책 변경은 검토를 무효화하고 중복 실행과 늦은 응답을 막습니다. 터미널은 옵션 검수 범위를 구분하고 구조화한 결과·백업 ID만 저장합니다. 사용법은 mariadb-code-operation.md입니다.

관련32 tests, 최종 전체747 tests, 최종 production build, 번역 literal 키 검사, 격리 package:verify --terminal PASS. 첫 전체 실행은 신규 popup import의 SSR 테스트 mock 누락으로5개가 실패했으며 mock을 추가한 뒤 전체를 재검사했습니다. 실패 로그도 보존했습니다. 새 MariaDB API의 실제 패키지 HTTP401·cross-origin/권한 비활성403과8KiB 초과 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/native 실행을 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-code-operation.deb` 및 기본 이름, SHA-256 `1e0e66052c7143fbb64fd8f05497223dc9a485d719d2e6009c2e328ed82435ce`, evidence `package-2026-10-05T04-46-08.048Z.json`, 소스 hash mariadb-code-operation-source-20261005.json입니다. 실제 MariaDB 실행 파일 부재로 native namespace 검수·DB 재시작·운영 적용/복구는 미검증이며 설치 환경 GUI/E2E도 별도입니다. candidate 옵션 검수는 데이터/TLS/플러그인 접근성이나 전체 기동 성공을 증명하지 않습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL이며 PostgreSQL 전체 코드 적용, 전체 번역, 공개 APT/desktop, AI 실연동 및 실환경 검증 등의 남은 범위를 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 후보 설정 격리 검수

설치 패키지의 MariaDB 지원 항목 적용과 백업 복원에 private namespace 후보 검수를 연결했습니다. 운영 설정·데이터·소켓·네트워크를 제공하지 않고 후보와 검증 실행 파일을 읽기 전용으로 사용합니다. 실행 전후 후보 hash와 실행 파일 identity를 확인하며 native 옵션 검수·defaults 조회가 실패하면 호스트 실행으로 대체하지 않습니다. capability에 따라 configuration/options-help를 구분하고 지원 필드의 실제 후보 값을 확인합니다. 검수 거부 시 백업·파일 교체·서비스 재시작 전에 중단합니다. 기존 graph/service 검사와 transaction 복구는 유지합니다.

새 모듈은 helper checksum allowlist와 배포 closure에 포함되며 Depends에 bubblewrap을 추가했습니다. 관련23 tests, 전체736 tests, production build, 번역 literal 키 검사 및 격리 package:verify --terminal PASS. 패키지 검사는 새 모듈 import와 의존성도 확인합니다. 실패한 fixture 기대 오류는 transaction의 일반 오류 마스킹 동작에 맞춰 수정했고 실패 기록을 보존했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-isolated-validation.deb` 및 기본 이름, SHA-256 `41fe5d1aec5eb22a0996a6d848c8bdff3e236719fd3ff56a5120b5eac94a238d`, evidence `package-2026-10-05T04-32-51.630Z.json`. 소스 hash는 mariadb-isolated-validation-source-20261005.json, 설명은 mariadb-sandbox-validation.md입니다. 현재 장비에 mariadbd/my_print_defaults가 없고 bwrap/prlimit은 root 소유가 아니므로 실제 native namespace/운영 적용 검증은 미완료입니다. fixture runner 검사는 native 기동 성공을 증명하지 않습니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. MariaDB 전체 코드 적용 API/GUI, 설치 환경 GUI/E2E 및 나머지 제품 범위는 남아 있으며 전체 목표 PARTIAL입니다. 아래는 이전 이력입니다.

## 2026-10-05 Redis 전체 코드 검수·검토·운영 적용 연결

Redis main 파일의 설정 GUI/코드 초안 전체를 헤더 검수 팝업에서 검수하고 확인 후 적용하도록 연결했습니다. 지원 항목만 변경하는 기존 경로와 별도로 전체 코드 지시어를 후보에 반영합니다. 운영 main 및 기존 include graph, 새로 포함되는 후보 graph, 정확한 코드의 해시에 검토를 묶으며 apply에서도 재검수합니다. 기존 namespace/리소스 제한 후보 검수와 서비스 identity 검사, private 원본 백업, 파일 교체, 재시작 실패 시 원문 복원/복구 transaction을 재사용합니다. root helper의 새 모듈과 작업은 checksum allowlist에 포함했습니다.

API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt·helper 권한을 검사하고 전체 코드 JSON을 1.6MB, 원문을 UTF-8 262144 byte로 제한합니다. 경로·runner·filesystem root 지정과 검토 후 코드/참조 파일 변경을 거부합니다. GUI는 입력/연결/정책 변경 때 검토를 해제하고 중복 실행·늦은 응답을 막습니다. 감사는 기존 completed/failed/rolled-back/recovery-required 상태를 사용합니다. 터미널에는 구조화한 검수·적용 결과와 백업 ID만 기록하며 암호·원문·native 상세 출력을 넣지 않습니다. 사용법은 redis-code-operation.md입니다.

관련 27 tests와 전체 730 tests PASS, 감사 상태 통일 후 최종 API 1 test PASS. 최종 production build, 번역 literal 키 및 격리 package:verify --terminal PASS. 실제 패키지 HTTP에서 새 두 API의 401·cross-origin/권한 비활성 403 및 8KiB를 넘는 코드 요청의 권한 검사 도달을 확인했습니다. 이 HTTP 검사는 root/helper 실행이나 Redis 기동을 수행하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-code-operation.deb` 및 기본 이름, SHA-256 `4b3334216b7b07fbcf227e664d99a13374117267395ab1cb1e169f53a1ed05db`, evidence `package-2026-10-05T04-15-58.619Z.json`. 소스 hash·검사 범위는 redis-code-operation-source-20261005.json입니다. 현재 장비의 `/usr/bin/redis-server` 부재로 실제 Redis native 기동 검수·운영 적용 E2E는 미검증이며 설치 브라우저 GUI/E2E도 별도입니다. 운영 서비스·파일·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL. MariaDB/PostgreSQL 전체 코드 적용·전체 번역·공개 APT/desktop·AI 실연동 등 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 실제 그룹 트리와 초기 SSR

파일 아래 `[client]`, `[mysqld]`, 버전 그룹과 빈 그룹을 원문 첫 등장 순서로 표시합니다. 서버 설정 조회는 그룹 이름만 metadata에 포함하며 옵션 비밀번호 값을 노출하지 않습니다. 초기 SSR 및 Strict Mode 효과 재실행은 같은 metadata를 유지합니다. 실제 React 서버 렌더러의 최초 HTML에서 파일·그룹·빈 inspector를 확인했습니다. 이 HTML 검사는 실제 설치 브라우저의 첫 페인트/E2E 검증과 구분합니다.

그룹 선택은 현재 코드 기록을 재사용하며 해당 그룹의 행만 오른쪽에 표시합니다. 새 옵션은 선택 그룹에 추가합니다. 코드 편집에서 그룹을 추가·삭제·재정렬하면 트리도 갱신합니다. 그룹 이름으로 트리 검색이 가능하며 주요 연결/메모리/로그 폼도 유지합니다. 같은 이름으로 반복된 그룹은 한 노드에 모아 원문 행을 각각 편집합니다. 공통 root helper metadata 모듈을 checksum allowlist에 포함했습니다.

관련 19 tests, 전체 719 tests PASS, 추가 실제 React SSR HTML 1 test PASS. 최종 production build와 격리 package:verify --terminal PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-group-tree.deb` 및 기본 이름, SHA-256 `3f147fcc3d61cf6ea2861599d4e7b066b44e129795b984d1f6cb59b66e30399d`, evidence `package-2026-10-05T03-58-34.902Z.json`. 소스 hash·검사 범위는 mariadb-group-tree-source-20261005.json입니다.

설치 브라우저 GUI/E2E 및 MariaDB native 검수·운영 적용은 별도 미검증입니다. 운영 파일·서비스·대상 서버 설치는 변경하지 않았습니다. 전체 목표 PARTIAL이며 나머지 패키지 설정·운영 적용/복원·전체 번역·공개 APT/desktop·AI 실연동 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 MariaDB 파일 전체 항목 설정 GUI

MariaDB 파일/전체 설정 노드는 그룹과 원문 순서의 옵션을 표시하며 코드 보기와 같은 초안을 편집합니다. 그룹 필터·검색·반복 행 편집·항목 추가·값 없는 옵션의 활성화·비밀번호 가림을 지원합니다. 값을 비우면 행을 유지하고 주석 처리합니다. 추가 항목은 마지막 지정 그룹 구간에 들어가며 이후 client 그룹을 변경하지 않습니다. include·따옴표·CRLF·세미콜론 값을 보존합니다. 주요 설정 폼도 하이픈/밑줄 별칭을 수정해 같은 옵션을 중복 추가하지 않습니다. 사용법과 native 의미 범위는 mariadb-file-settings.md입니다.

전체 717 tests PASS. 이후 주석 처리된 밑줄 옵션 표시 보완에 대해 최종 관련 15 tests PASS. 최종 production build와 격리 package:verify --terminal PASS, 번역 literal 키 검사 PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-mariadb-file-settings.deb` 및 기본 이름, SHA-256 `99c78ddb78a13e4926597b1fe533298d0c94b70eb9f3b6daae7a3a0941609ecc`, evidence `package-2026-10-05T03-51-30.863Z.json`. 소스 hash 및 검사 범위는 mariadb-file-settings-source-20261005.json에 기록했습니다.

설치 환경 브라우저 GUI/E2E 및 MariaDB native 검수·운영 적용은 별도 미검증입니다. 임의 옵션은 파일 초안 편집이며 기존 운영 적용 지원 필드·검수·검토·권한 제한을 유지합니다. 대상 서버 설치·운영 파일·서비스 변경은 하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 이력입니다.

## 2026-10-05 Redis 파일 전체 항목 설정 GUI

Redis main 파일/설정 노드는 원문 순서의 지시어 전체 편집 화면을 표시합니다. PostgreSQL과 공통 FileSettings를 재사용하며 연결/메모리/AOF의 주요 항목 폼과 코드 초안은 같은 기록을 사용합니다. 반복 항목은 선택한 행만 변경하고 비우기는 행을 유지하면서 주석 처리합니다. 원문 따옴표·다중 인수·CRLF·관계 없는 줄을 보존하고 활성화·검색·항목 추가를 지원합니다. requirepass/masterauth 입력은 비밀번호 형식으로 표시합니다. 오래된 행·줄바꿈 주입·닫히지 않은 따옴표·UTF-8 크기 초과는 거부합니다.

공식 Redis7.0 레지스트리의 이름/별칭203개를 주석 예시 분류에 사용했습니다. 활성 지시어는 미등록 이름도 표시합니다. 이후 버전/모듈의 알 수 없는 주석 항목은 코드 보기에서 확인합니다. 공식 sample의71개 활성 행과 주석 예시를 포함한209행을 확인했고, 동일 값 편집 시 원문 byte 보존을 검증했습니다. sample에서 발견한 설명 문장 분류·공백 보존 문제는 회귀 검사에 반영했습니다. Redis 지원 값 가져오기에서도 줄 끝 #/세미콜론을 주석처럼 제거하지 않습니다. 사용법과 의미 범위는 redis-file-settings.md를 참조하세요.

관련 최종15 tests, 전체710 tests, 최종 production build 및 격리 package:verify --terminal PASS. 신규 literal 번역 키 검사 PASS. 검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-file-settings.deb` 및 기본 이름, SHA-256 `6f457d6449d405072365609e40289d9c994a73f2c2446115eb56db833a9e885f`, evidence `package-2026-10-05T03-36-04.204Z.json`. 공식 참조 hash와 sample 범위는 redis-file-reference-20261005.json입니다.

파일 행 편집은 구문/초안 검사입니다. 실제 Redis 버전별 의미·native 운영 적용 및 설치 환경 브라우저 E2E는 완료하지 않았습니다. 기존 지원 항목의 검수/검토/권한 제한을 유지하며 임의 지시어를 자동 운영 적용하지 않습니다. 대상 서버 설치·운영 파일·서비스 변경은 하지 않았습니다. 전체 목표 PARTIAL. 나머지 패키지 전체 항목 GUI·운영 적용/복원 E2E·번역·공개 APT/desktop·AI 실연동 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 DB 설정 GUI 브라우저 편집 오류 수정

PostgreSQL·MariaDB·Redis 공통 폼의 patchConfig가 브라우저에서 제공되지 않는 Node Buffer.byteLength에 의존했습니다. 이전 검증 소스를 Node 전역이 없는 모듈 환경에 넣어 PostgreSQL 포트 편집의 `Buffer is not defined` 오류를 재현했습니다. UTF-8 크기 검사는 공통 TextEncoder로 변경했으며 필드 교체/추가 후 결과도 262144 byte 한도를 검사합니다. 크기 초과는 코드 교체 전에 거부합니다. 기존 코드·주석·CRLF·관련 없는 설정의 보존 동작은 유지합니다.

실제 순수 모듈 의존성을 Node 전역 없이 실행하고 세 DB의 실제 PackageConfigIde 편집 핸들러에 연결해 폼 수정·코드 역반영·기본값 복원을 검사했습니다. UTF-8 정확한 한도와 편집 결과 증가에 따른 거부도 검증했습니다. 관련 19 tests 및 전체704 tests PASS, 최종 production build와 격리 package:verify --terminal PASS. 이 모듈 검증은 실제 설치된 앱의 브라우저 GUI E2E 완료를 의미하지 않습니다. 운영 파일/서비스 변경과 대상 서버 설치는 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-db-browser-edit.deb` 및 기본 이름, SHA-256 `d5cbbc77c71d55a6f9c01d850a0756a2124f861cf3fc3e3fc01ff52f3d4bdc74`, evidence `package-2026-10-05T03-22-16.584Z.json`, 원인 재현 `tastedev-db-browser-reproduction.log`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E·운영 적용/복원·패키지 전체 설정 범위·번역·공개 APT/desktop·AI 실연동의 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 Certbot 인증 방식 선택·실행 연계

Certbot 발급 GUI와 명령 초안에 nginx·webroot·standalone 선택을 추가했습니다. 방식/웹 루트 변경은 이전 미리보기와 확인·동의를 해제하며 실행 요청에도 같은 값을 전달합니다. 기본 nginx 명령은 유지하고 webroot/standalone은 certonly로 발급합니다. 갱신 테스트는 기존 갱신 설정을 사용합니다. 관리자 helper는 root 소유·checksum 검증을 통과한 동일한 순수 명령 생성기를 사용합니다. nginx는 기존 관리 사이트 백업을 유지하고 webroot는 제한된 절대 경로·상위/검증 디렉터리 소유권·쓰기 권한·링크를 검사합니다.

관련 61 tests, 전체 702 tests PASS, 마지막 발급 메뉴 문구 변경 후 컴포넌트 재검사 PASS. 최종 production build 및 격리 package:verify --terminal PASS. HTTP 검증은 세 발급 방식·갱신 대상 미리보기, 잘못된 경로·이름 거부와 권한이 꺼진 발급 요청 403을 포함합니다. 번역 키 검사 PASS, 새 설정 항목은 기존 6개 주요 catalog 및 Portuguese에 반영했습니다. 사용법은 certbot-authenticators.md에 기록했습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-certbot-methods.deb` 및 기본 이름, SHA-256 `f0d3f03dfb496b0871705cc99fcd32fc1eef89185f351c58ba17c87ad728070d`, evidence `package-2026-10-05T03-15-10.967Z.json`. 실제 ACME 발급·갱신/운영 서버 설치·서비스 변경과 설치 환경 브라우저 E2E는 이번 검증에 포함하지 않았습니다. 새로운 인증서 helper 실행 경로는 검토된 패키지의 root 소유 runtime을 사용합니다. 전체 목표 PARTIAL이며 완전한 패키지 설정 범위·운영 적용/복원 E2E·번역·공개 APT/desktop·AI 실연동은 별도 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 작업 폴더 환경 파일 트리·코드 편집 구현

Node.js canonical 페이지는 인증 후 등록 앱과 작업 폴더의 편집 가능한 환경 파일 이름을 SSR로 전달합니다. 초기 트리에는 파일 노드를 표시하고 파일 내용은 선택 후 기존 인증된 file API로 읽습니다. 숨김 파일·상위 경로·링크는 기존 작업 폴더 제한을 유지합니다. 파일 선택 시 지원 환경 값·코드 순서·주석 및 다른 변수를 기존 공통 설정/코드 탭에서 편집하며 저장은 기존 파일 버전 검사를 사용합니다. 일반 Node 설정 초안과 파일별 코드 버퍼는 별도 키로 보존합니다.

서로 다른 파일의 누락 값이 섞이지 않으며 파일 전환·늦은 응답·연결 변경 때 이전 파일을 표시하지 않습니다. Strict Mode는 같은 파일의 대기 중 조회를 재사용합니다. 조회 실패는 새로고침으로 재시도합니다. 디스크에서 사라져도 미저장 코드/미완성 GUI 값이 있는 파일 노드는 유지하고 버퍼를 다시 엽니다. 실제 삭제된 파일을 자동 재생성하거나 저장 기준을 자동 바꾸지는 않습니다. 가져오기·기본값 복원 실패는 GUI를 부분 변경하지 않으며, 숫자를 입력하는 도중의 빈 값만 GUI에 유지합니다. 미완성 GUI 값도 이탈 경고 대상입니다.

관련 실제 컴포넌트/SSR·버퍼·늦은 응답·복구·오류 처리31 tests 및 전체696 tests PASS. 별도 production build와 격리 package:verify --terminal PASS. 설치된 Node.js 실제 브라우저 E2E는 별도 미검증이며 운영 서버 설치·서비스/환경 파일 변경은 하지 않았습니다. 이 트리는 관리 작업 폴더의 환경 파일을 대상으로 하며 등록 앱의 실제 .env 관리는 기존 앱 환경 관리 흐름을 유지합니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-env-files.deb` 및 기본 이름, SHA-256 `de22053b6fc14d20fa17af1653c0417bcb4fe967bb5405ffd23d300f32853d89`, evidence `package-2026-10-05T02-47-04.675Z.json`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E, 모든 패키지 설정 GUI·운영 적용/복원, 완전 번역·공개 APT/desktop·AI 실연동 범위는 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 환경 값 가져오기 실패·재시도 처리

공통 설정 폼은 환경 값 적용 거부 이유를 가져오기 컴포넌트로 반환합니다. 로컬 파일 가져오기는 적용 실패 시 지원 값 검토를 유지하고 오류를 표시하며, 성공한 때만 검토 목록을 비웁니다. 작업 폴더 환경 파일은 실패 시 조회 결과와 반영 버튼을 유지하고 오류를 표시하며, 다음 반영 성공 시 오류를 지웁니다. 지원 변수 외의 원문 값은 기존 방식대로 검토 단계에서 제외합니다. Node 코드·GUI 양방향 연동의 중복 변수 거부 처리와 연결해, 실패를 성공처럼 소비하던 동작을 수정했습니다.

실제 가져오기·작업 폴더 조회·공통 폼·탭 컴포넌트 관련9 tests, 전체692 tests, 별도 production build, 격리 package:verify --terminal PASS. 실제 브라우저 가져오기 E2E는 별도 미검증이며 운영 서버 설치·환경 파일 변경은 하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-import.deb` 및 기본 이름, SHA-256 `5bcf2dcec26757f075d6d4ef21fb34f26c70f8caadfca276df3f7451a8e44ee8`, evidence `package-2026-10-05T02-27-58.325Z.json`. 전체 목표 PARTIAL. 설치 환경 GUI/E2E, 패키지 전체 설정 GUI·운영 적용/복원, 완전 번역·공개 APT/desktop·AI 실연동 범위는 계속 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 코드·GUI 환경 값 양방향 연동

Node PackageTool에서 코드의 지원 환경 값과 작성 순서를 GUI에 반영합니다. GUI 수정·환경 값 가져오기·기본값 복원은 전체 환경 코드를 변경하면서 주석, export 구문, CRLF와 다른 변수를 보존합니다. 빈 숫자 입력은 GUI에서 유지하며 유효해진 시점에 코드에 반영합니다. 잘못된 코드나 중복 지원 변수는 마지막 정상 GUI 값을 보존하고 자동 코드 변경을 거부합니다. 삭제된 변수의 기존 GUI 값도 유지합니다. 폼 초기화·노드 재선택은 코드 변경 경고를 발생시키지 않으며 실제 변경만 반영합니다. Node 환경 생성/패치 모듈은 브라우저에서 사용할 수 있도록 서버 의존성을 분리했습니다.

실제 컴포넌트 핸들러 관련13 tests, 전체691 tests, 별도 production build, 격리 package:verify --terminal PASS. 패키지 검사는 인증된 nginx 최초 HTTP HTML의 트리·빈 inspector SSR도 확인했습니다. 브라우저 첫 페인트/수화 시각 변화와 설치된 Node.js 실제 화면 E2E는 별도 미검증입니다. 운영 nginx/DB/Certbot 설정 및 대상 서버 설치는 변경하지 않았습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-sync.deb` 및 기본 이름, SHA-256 `11e9d8e99474fc0eea561acb3e8c9412dbf8251275140f26c7717eb1f8bfae65`, evidence `package-2026-10-04T22-29-40.506Z.json`. 전체 목표 PARTIAL. 모든 패키지 지시어 GUI·설치 환경 E2E·운영 적용/복원·완전 번역·공개 APT/desktop·AI 실연동 등 남은 범위는 유지합니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 설정/코드 전체 높이 탭 구현

Node PackageTool에 공통 설정/코드 탭과 접근성 tablist/tabpanel·키보드 이동을 추가했습니다. NodeConfigIde는 코드 탭에서 inspector를 전체 높이 편집 모드로 전환하며, 탭 여백 없이 구분선만 표시합니다. 코드 숨김·재열기·환경 노드 전환 때 초안 기록을 보존합니다. 기존 편집 코드가 있으면 새 GUI 초안 교체 확인 후에만 코드 탭으로 전환합니다. 기존 비탭 모드도 보존합니다.

실제 공통 컴포넌트와 임시 mock config-plan API를 사용한 격리 브라우저에서 환경 노드 선택 → 코드 생성 → PORT4000 편집 → 설정/코드 전환 유지 → 교체 확인 흐름을 검증했습니다. 최종 문서 높이720px=viewport720px, 트리/inspector566px, 탭38px, 코드 panel528px, textarea 약324px; 브라우저 오류0개. mock 초안만 편집했으며 저장·실행은 하지 않았습니다. 설치 패키지의 실제 운영 API E2E 증거를 대체하지 않습니다. fixture 라우트와 별도8795 서버는 제거했고 production manifest에 라우트 없음 확인. 증거 tastedev-node-tabs-browser-20261005.json 및 tastedev-node-tabs-full-height-20261005.png.

전체690 tests, 별도 production build와 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-node-tabs.deb` 및 기본 이름, SHA-256 `d5bae9fe9c0659548b78ef3d542782f411c2dd503b1d9433e0634ab1307e1976`, evidence `package-2026-10-04T20-34-03.828Z.json`. 운영 서버 설치는 하지 않았습니다. 전체 목표 PARTIAL. Node 코드의 GUI 역반영, 폼 재마운트 때 GUI 변경 경고 조건, 전체 패키지 지시어 GUI·설치 환경 E2E·운영 적용/복원, 완전 번역/APT/desktop/AI 실연동 범위는 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 Node.js 앱/환경 설정 트리 IDE 구현

Node.js canonical 페이지는 인증 후 등록 앱 메타데이터를 SSR로 전달합니다. 공통 IDE 레이아웃의 왼쪽에 등록 앱, 앱 등록, 환경 설정, 작업 폴더 환경 파일 관리 노드를 표시하고 오른쪽은 선택 안내로 시작합니다. 등록 앱 선택은 앱 ID/폴더 등 폼을 즉시 열며 기존 파일 확인·환경 변수·서비스 관리 구성요소를 재사용합니다. 환경 노드는 중복 앱 등록 패널을 숨기고 기존 초안/코드 기록을 유지합니다. 등록 목록 조회 오류는 페이지 전체 오류 대신 빈 목록과 조회 오류로 표시합니다. Node.js 런타임 자체를 daemon으로 표시하지 않습니다.

관련19 tests 및 전체689 tests, 별도 production build, 격리 package:verify --terminal PASS. SSR registry·StrictMode·앱 노드 초기 폼 선택·환경 노드 분기·중복 새로고침 방지·삭제된 앱 선택 해제·끊어진 연결의 늦은 조회/자식 응답 차단·재연결 조회를 실제 컴포넌트 핸들러로 검증했습니다. 현재 Node 런타임으로 앱 개발은 진행하지만 dpkg nodejs 패키지는 없으므로 설치 패키지 메뉴에서 이 화면을 사용하는 실제 브라우저 E2E는 미완료입니다. 설정/코드 화면은 기존 PackageTool을 재사용하며 nginx처럼 전체 높이 탭으로 정리하는 단계는 남아 있습니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-node-ide.deb` 및 기본 이름, SHA-256 `7bb9a38ac74c4e0d70d18884fa4b921826edca0d72e991d87f18a72cc67334b6`, evidence `package-2026-10-04T20-22-50.034Z.json`. 운영 서버 설치/서비스·환경 파일 변경은 하지 않았습니다. 전체 목표 PARTIAL. 패키지별 전체 지시어 GUI·설치 환경 E2E·운영 적용/복원, 완전 번역·공개 서명 APT/desktop·AI 실연동 등 미완료 범위는 유지합니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 MariaDB 공통 파일 트리 IDE 구현

MariaDB를 공통 IDE로 연결하고 인증 후 서버에서 설정 파일 메타데이터·서비스 상태를 내려줍니다. 파일 선택 전에는 빈 설정 화면과 노드 선택 안내를 표시하며, 선택 후 연결·버퍼 풀·문자셋·로그 그룹 및 설정/코드 탭으로 편집합니다. 파일 조회 중에는 기본값 폼을 노출하지 않습니다. 기존 MariaDB include 구조 조회·검수·백업·복원 구성요소는 패키지 폼에서 유지합니다. 코드 초안은 .cnf 이름을 사용합니다.

관련15 tests PASS. 실제 컴포넌트 핸들러로 서버 포트 변경 시 client 그룹 포트·include·주석 보존, 코드 포트/버퍼 풀 변경의 GUI 반영, 그룹 전환 시 소스 재조회와 초안 덮어쓰기 방지, 다른 패키지 초안 보존을 확인했습니다. 전체687 tests, 별도 production build, 격리 package:verify --terminal PASS. 현재 장비에는 mariadb-server가 없어 설치된 MariaDB 실제 브라우저 E2E·운영 적용/복원은 미완료이며 GUI는 지원 항목 범위입니다.

deb `dist/tastedev-linux_0.1.0_amd64-mariadb-ide.deb` 및 기본 이름에 동일 패키지 보존. SHA-256 `5c26f01abe55e40b194c0ee72e7fb2d6ba414b9770f442d87450060732283325`, evidence `package-2026-10-04T20-14-33.157Z.json`. 운영 서버 설치/설정 변경은 수행하지 않았습니다. 전체 목표 PARTIAL. Node.js IDE 전환, 전체 지시어 GUI, 설치 환경 E2E와 운영 적용/복원 검증, 다국어/APT/desktop/AI 미완료 범위는 남아 있습니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 Redis 공통 파일 트리 IDE 구현

Redis를 기존 패키지 폼에서 공통 IDE로 연결했습니다. 서버에서 파일 메타데이터·서비스 상태를 내려 초기 트리와 노드 선택 안내를 표시합니다. redis.conf 선택 후 연결·메모리·AOF 그룹과 설정/코드 보기 탭을 사용하며, 지원 GUI 항목은 전체 원본 코드를 수정해 주석과 다른 설정을 보존합니다. 코드의 지원 값과 순서는 GUI로 반영합니다. 파일 조회 중에는 다른 초안/기본값 폼을 노출하지 않습니다. PostgreSQL과 Redis 초안은 분리하며 PostgreSQL 전용 운영 버튼은 Redis에 표시하지 않습니다. 기존 Redis 검수·백업·복원 기능은 패키지 설정 폼에서 유지합니다.

관련13 tests PASS: Redis 최초 SSR·StrictMode·갱신/재연결, 실제 컴포넌트 파일 선택/조회 대기, GUI 포트 변경·코드 포트/메모리 반영·주석 보존·PostgreSQL 초안 보존 포함. 전체685 tests, 별도 production build 및 격리 package:verify --terminal PASS. 현재 개발 장비 dpkg에는 redis-server가 없어 실제 설치된 Redis 화면 브라우저 E2E와 운영 적용/복원은 미완료입니다. GUI는 지원 항목 범위이며 모든 Redis 지시어를 구조화한 설정 편집기는 아직 아닙니다.

검증 deb `dist/tastedev-linux_0.1.0_amd64-redis-ide.deb` 및 기본 이름, SHA-256 `6fdb87f82fad41980c60c78f8f65b4b7e33706257e1ef93a79f2787f8789a286`; evidence `package-2026-10-04T20-09-56.052Z.json`. 운영 서버 설치/설정 변경은 하지 않았습니다. 전체 목표 PARTIAL. MariaDB·Node.js 공통 IDE 전환, Redis 전체 지시어 GUI 및 설치 환경 E2E 등은 남아 있습니다. 아래는 이전 이력입니다.

## 2026-10-05 나머지 패키지 최초 폼 SSR 수정

Node.js·MariaDB·Redis canonical 페이지도 인증 후 서버에서 상태·보안 정보를 읽어 초기 ConsoleWorkspace에 전달합니다. PackageConfig는 요청 패키지를 렌더링 시 바로 사용하므로 이전 PostgreSQL 초안 또는 nginx 기본 폼이 먼저 표시되지 않습니다. 패키지별 초안 저장과 기존 수동 운영 파일 조회는 유지합니다. 세 패키지에 nginx 형태의 파일 트리 IDE를 구현한 것은 아니며 기존 GUI의 최초 렌더링을 바로잡은 범위입니다.

실제 컴포넌트의 effect 실행 전 HTML에서 이전 PostgreSQL 초안이 있어도 Node.js·MariaDB·Redis 제목·설정 폼이 표시되는 회귀 검사 PASS. 서버 인증 전에는 상태/설정 조회가 없으며 다른 패키지 설정은 읽지 않습니다. 관련12 tests, 전체683 tests, 별도 production build 및 격리 package:verify --terminal PASS. 이번 범위의 실제 브라우저 편집 E2E는 추가 확인이 필요합니다.

deb SHA-256 `d141af2c46b6e56a3e75c3763ef1a7cf0565deeb8eaa3a548e26fa90e9c657ed`, evidence `package-2026-10-04T20-03-31.286Z.json`. dist/tastedev-linux_0.1.0_amd64-package-first-form.deb 및 기본 이름에 같은 검증 패키지를 보존했습니다. 운영 서버 설치·서비스/DB 설정 변경은 수행하지 않았습니다. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 Certbot·PostgreSQL 초기 SSR 및 GUI 검증

인증 후 서버에서 선택 패키지의 파일 목록·서비스 상태를 내려 첫 HTML에 트리와 선택 안내를 표시합니다. hydration 및 개발 StrictMode effect 재실행 때 목록을 비우거나 재조회하지 않으며, 수동 갱신과 재연결 조회는 유지합니다. Certbot 도메인 입력의 미정의 field 핸들러도 복구했으며 도메인이 바뀌면 기존 명령 검토와 확인을 초기화합니다.

실제 브라우저에서 Certbot 도메인·이메일 입력 → nginx staging 명령 검토 → 코드 보기, PostgreSQL 최초 트리·빈 설정 화면 → GUI 포트6543 → 코드 포트6544 → GUI6544를 확인했습니다. PostgreSQL 운영 파일 포트는5435 유지, 브라우저 오류0개. 인증서 발급·운영 설정 적용은 실행하지 않았습니다. 현재 장비에는 Certbot 인증서 파일이 없어 인증서 파일이 있는 초기 트리는 단위 fixture로 검사했습니다.

전체681 tests, 별도 production build 및 격리 package:verify --terminal PASS. 패키지 HTTP 검증은 JavaScript 실행 없이 nginx·Certbot·PostgreSQL 초기 HTML을 검사했습니다. deb SHA-256 `bb7a7a2c8347862db6bcd862980f61714a8c891ff0bcf0cafbeafa6de63a340b`; `dist/tastedev-linux_0.1.0_amd64-package-ide-ssr.deb`와 기본 이름에 보존. evidence `package-2026-10-04T19-58-40.920Z.json`, GUI 기록 `package-ide-ssr-gui-20261005.json` 및 같은 디렉터리 스크린샷. 이번 단계에서103 설치는 하지 않았습니다. 전체 목표 PARTIAL; 운영 적용/복원 실검증, 모든 로케일 완전 번역, 공개 서명 APT 설치·업데이트/desktop 최종 검증, AI 실연동 검증은 남아 있습니다.

## 2026-10-05 실제 nginx GUI 흐름 검증 및 오류 수정

새 임시 브라우저 탭에서 events 선택 → 블록 코드 편집 → 초안 반영 → 설정 화면 순서와 값 갱신 PASS. 내용 비우기는 행을 유지했고, sites-available 원본의 포트 초안을 sites-enabled 링크로 열어도 같은 편집 가능한 코드가 표시됨을 확인했습니다. 실제 원본 사이트 블록 hash 및 worker_connections 값 비교 PASS. 운영 적용은 실행하지 않았고 임시 탭만 닫았습니다. 이전 자동 클릭 검증 실패 기록은 이력이지만, 이번 범위는 접근성 API를 통한 실제 조작으로 확인했습니다. 브라우저 증거 nginx-gui-flow-20261005.json 및 nginx-{code-order,clear-setting,alias-code}-flow-20261005.png.

실제 파일 선택 시 발생하던 settings/add-block 형제 React 키 중복을 고쳤고 새 탭에서 오류 로그 0개 확인. 검증된 링크의 include 문맥을 원본 파일에도 전달합니다. 누락/오류/내용 불일치 대상 및 여러 포함 문맥은 보수적으로 미확정 상태를 유지합니다. 전체 include 그래프가 불완전하면 설명 문맥 선택은 유지합니다.

관련9 tests, 전체677 tests, 별도 production build, 격리 package:verify --terminal PASS. deb SHA-256 `7ae833c4f1cb7c99fa3afb50318486019446bfd1dc52dc8471610650f221f21e`, package evidence `package-2026-10-04T19-41-02.458Z.json`. dist/tastedev-linux_0.1.0_amd64-nginx-gui-context.deb 및 기본 이름에 동일 검증 패키지 보존. 103 설치는 이번 단계에서 하지 않았습니다. Certbot/PostgreSQL의 공통 초기 파일 목록이 현재 클라이언트 조회 방식임을 확인했으며 초기 SSR 개선은 남아 있습니다. 전체 목표 PARTIAL; 이번 GUI 증거는 nginx 초안 편집 범위이며 운영 적용/복원 및 모든 페이지 E2E 합격을 뜻하지 않습니다.

## 2026-10-05 nginx SSR 및 링크 초안 패키지 검증

sites-enabled의 검증된 링크는 sites-available 등 원본의 편집 초안과 같은 트리를 표시합니다. 추가·삭제로 노드 번호가 바뀌어도 링크에서 검색·선택·코드 편집하면 원본 초안에 반영하고 별도 링크 초안은 만들지 않습니다. 원본이 누락되거나 오류/조회 내용 불일치이면 조회 전용 링크 사본을 유지합니다. 실제 파일과 심볼릭 링크는 변경하지 않습니다.

관련7 tests, 전체676 tests, 별도 production build, 격리 package:verify --terminal PASS. 패키지 HTTP 검증은 클라이언트 script를 제거한 첫 응답에서 실제 조회된 nginx 파일 title과 선택 안내, 로딩 안내 부재를 검사했습니다. 검증 장비 nginx 설치 상태 install ok installed / 1.28.3-2ubuntu1.11. deb SHA-256 `72b2b7e07126a49c5209acc72c24ee618907cfb4156f0d9ca6c087285d967e17`, package evidence `package-2026-10-04T19-30-59.036Z.json`. 배포 파일 dist/tastedev-linux_0.1.0_amd64-nginx-ssr-alias.deb 및 기본 파일에 동일 검증 패키지를 보존했습니다. 103 설치 및 운영 설정 변경은 이번 단계에서 하지 않았습니다. 전체 목표 PARTIAL.

## 2026-10-05 nginx 첫 화면 SSR

인증 확인 후 서버 페이지에서 상태·보안·nginx 트리·관리 사이트를 읽어 ConsoleWorkspace와 ServerManager에 초기 데이터로 전달합니다. 첫 HTML부터 트리 노드와 선택 안내를 렌더링하며 hydration 때 초기 트리를 비우거나 nginx-tree/nginx-live를 다시 요청하지 않습니다. 수동 갱신과 연결 변경 시 새 조회는 유지합니다. 설치된 패키지 목록의 클라이언트 캐시 정책은 유지합니다.

SSR 인증 순서·초기 상태·중복 요청 방지·갱신·재연결 포함 관련6 tests, 전체676 tests 및 production build PASS. 개발8787 브라우저에서 펼쳐진 nginx.conf/events/http와 sites-available/sites-enabled 링크 노드, 오른쪽 선택 안내 확인. 화면 증거 .runtime/verification/nginx-initial-ssr-20261005.png. 이 변경은 개발 소스에 적용했으며 103 설치 패키지는 이전 nginx-session-links 버전입니다. 전체 목표 PARTIAL.

## 2026-10-05 세션 만료 로그인 이동 및 nginx 트리 정리

401은 본문 JSON 파싱 전에 처리하며 만료 안내 문구 대신 로그인 페이지로 전체 이동합니다. 기존 canonical IDE 경로는 next에 보존하고 중복 이동/추가 요청과 로그아웃 후 늦은401을 억제합니다. 인증 상태 조회의 authenticated=false/401에도 동일하게 적용합니다. 저장소503은 로그인 만료로 취급하지 않습니다. 세션 정리 직후 React 재렌더 전에 이전 미저장 페이지 이탈 경고가 로그인 이동을 막지 않도록 generation을 검사합니다. 일반 미저장 이탈 경고는 유지합니다.

초기 설정 응답 전에는 빈 폴더 트리 대신 로딩 안내만 표시합니다. 왼쪽 트리 검색은 파일명/지시어/값 외에 한국어와 선택 언어 설명도 검색하며 include의 map/geo 및 stream/mail 문맥을 따릅니다. sites-enabled 등 링크는 연결 아이콘과 nginx 루트 안의 실제 대상 경로를 표시합니다. 조회된 대상 내용이 일치할 때 대상 원본으로 선택을 연결하고, 대상이 조회되지 않았거나 초안 내용이 달라 일치하지 않으면 링크 사본은 조회 전용으로 유지합니다. 끊어진/외부/디렉터리 링크 보호는 유지하며 파일이나 링크 자체를 변경하지 않았습니다.

관련9 tests 및 초안 경고/세션 관련7 tests, 전체673 tests, 별도 production build와 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료. SHA-256 `dd2c22604b006d7e1154a03268209e1329311e0b51b60904072f9d2a14968b38`, evidence `package-2026-10-04T19-11-43.563Z.json`. 기존 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치/HTTP 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-session-links-{delivery,installed,bundles}-20261005.json`.

실제 GUI 조작은 이전 독립 HTML 입력 대조에서도 자동 클릭이 전달되지 않았으므로 미완료로 유지합니다. 초기 트리 시각 변화의 실제 발생 원인은 확정하지 않으며, 확인된 코드상 빈 트리 중간 표시를 제거했습니다. 전체 목표 PARTIAL. 남은 큰 범위는 GUI/PTY 실제 사용자 흐름, 운영 패키지 적용·복구 실검증, 모든 지원 로케일 완전 번역, 공개 서명 APT 설치·업데이트/desktop 최종 검증, AI 실연동 검증입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 검색 후 서버 선택 수정

검색 결과에서 동일한 `server` 블록 중 일부만 남으면 선택 키의 occurrence가 변경되어 다른 서버의 설정·코드가 표시되는 결함을 실제 컴포넌트 핸들러 검사로 재현했습니다. 443 검색 후 두 번째 서버를 선택했는데 수정 전에는 `listen 80`이 표시됐습니다. 이제 선택 및 컨텍스트 메뉴에는 원본 소스의 전체 트리를 보존합니다. 수정 후 설정·코드·새로 조회·컨텍스트 메뉴 삭제 대상이 두 번째 서버로 유지되며 원본 파일은 변경하지 않습니다.

관련7 tests, 전체671 tests, 별도 production build 및 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료, 기존 설정4개 hash 보존. SHA-256 `0dc64f09356f8cd6928f19a88e651ebb9ff68d68f6d7a3190bfadd28b3d322d6`, package evidence `package-2026-10-04T18-58-12.970Z.json`. 설치 코드/root 소유권/helper91/BUILD_ID·manifest와 login200/미인증9 API401 및 설치·HTTP 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-search-selection-{delivery,installed,bundles,browser}-20261005.json`.

개발 화면 자동 클릭 검사는 미완료입니다. 앱과 독립된 로컬 단일 HTML 버튼에서도 onclick이 존재하고 활성 상태인데 자동 클릭 후 결과가 바뀌지 않았습니다. 브라우저 입력 전달 문제가 있는 증거이며, 앱의 초기 선택 불능 원인을 확정한 것은 아닙니다. 임시 검사 서버/탭은 종료했고 사용자 탭은 유지했습니다. 전체 목표는 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx MIME 설명 문맥 수정 및 include 검사

`types` 블록의 MIME 키가 charset/proxy_cache/gzip 같은 일반 지시어 이름과 겹쳐도 MIME 확장자 설명을 제공합니다. `types` 안의 include는 파일 포함 설명과 공식 문서 링크를 제공합니다. 이전 캐시·요청 제한 등 설명27개 보완도 포함합니다. 103의 nginx.conf에서 시작한 include 그래프28개 파일·125개 이름/문맥 조합을 읽기 전용으로 대조한 결과 구체 설명 누락0, include 경고0입니다. Certbot 공개 nginx 옵션6개도 포함하며 실행 중 nginx의 실제 유효 설정 전체를 증명하지는 않습니다.

관련37 tests, 전체670 tests, 번역 검사, 별도 production build, 격리 package:verify --terminal PASS. 승인된103 앱 업데이트 완료. 패키지 SHA-256 `3617d0c6614556e51cad913a1fb0c62aed32ee9c2e8dc571f7eeed100fc15ef4`, evidence `package-2026-10-04T18-48-11.435Z.json`. 기존 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치5/HTTP3 자산 해시 일치 PASS. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다.

개발 브라우저의 초기 트리 및 검색 동작은 관찰했습니다. 자동 조작으로 노드를 클릭하거나 키보드로 선택해도 설정 패널 변경을 확인하지 못했고 접기 버튼에서도 동일했습니다. 원인은 확정하지 않았으며 GUI 설명 표시 PASS를 주장하지 않습니다. 전체 목표 PARTIAL. 증거 `.runtime/verification/nginx-types-help-{delivery,include-audit,installed,bundles,browser}-20261005.json`. 아래는 이전 단계 이력입니다.

## 2026-10-05 실제 nginx 항목 설명27개103 반영

103의 읽기 전용 설정 이름·문맥 대조에서 확인한 캐시·프록시 버퍼/헤더·요청 제한·HTTP/2·문자셋·internal/break/autoindex 지시어24개와 split_clients 블록/규칙2종의 설명27개를 보완했습니다. 수집된124개 이름·문맥 조합의 구체 설명 누락은0개입니다. 읽기 오류8개와 미해결 include46개가 있어 전체 설정 검사 완료로 해석하지 않습니다. 설정 소스/값은 수집 결과에서 제외하고 map/geo/MIME 키는 익명 처리했습니다. 브라우저 ID2 탭1 바인딩은2회 timeout/kernel reset으로 실패했으며 앱의 동작 실패로 단정하지 않습니다.

관련36 tests, 전체669 tests, 번역 검사, production build, 격리 package:verify --terminal PASS. 승인된103 앱에 deb `dist/tastedev-linux_0.1.0_amd64-nginx-observed-help.deb`를 반영했습니다. SHA-256 `d2a5718d3e1006a2cbc19a9b7c30f9811ce1817b04e15db0658b001c2f0e5a9d`, package evidence `package-2026-10-04T18-32-54.405Z.json`. 설정4개 hash 보존, active/whitecalvin/helper91·manifest·BUILD_ID·root 소유권, login200/미인증9 API401 및 설치5·HTTP3 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-observed-help-delivery-20261005.json`, 같은 prefix inventory/installed/bundles 및 `nginx-gui-tab-timeout-20261005.json`. 브라우저 및 미해결 include 검증과 전체 목표는 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 매핑 규칙 설명·입력103 반영

map·geo·types 내부 키가 gzip/worker_connections/server_tokens 등과 겹쳐도 일반 결과 값 입력과 검증을 사용합니다. 일반 지시어의 숫자·스위치 검증은 유지합니다. 포함된 map/geo 파일의 문맥을 따라가고, 불확실한 파일에도 map/geo 설명 문맥을 선택할 수 있습니다. map/geo 규칙 설명과 이전 HTTP upstream·Basic 인증 설명 보완을 포함합니다. 관련13 tests, 전체667 tests, 번역 검사, production build 및 격리 package:verify --terminal PASS.

승인된103 앱 업데이트 완료. deb `dist/tastedev-linux_0.1.0_amd64-nginx-mapping-controls.deb`, SHA-256 `4a6ec55d09fe3a087db26d63f54b67739ca6bf5648c2bce535077c00480c9a95`, package evidence `package-2026-10-04T18-19-13.137Z.json`. 설정4개 hash 보존, active/whitecalvin, helper91·manifest·BUILD_ID·root 소유권, login200와 미인증9 API401, 설치5·HTTP3 자산 해시 일치 PASS. 증거 `.runtime/verification/nginx-mapping-controls-delivery-20261005.json` 및 같은 prefix 설치/자산 기록. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다. 실제 브라우저 GUI와 전체 시스템 완료 증거는 남아 있으므로 전체 목표 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 일본어 기준 UI 카탈로그1300개103 반영

일본어의 남은143개(지난 단계 nginx 설명142개와 합쳐 이전 배포 대비285개)를 번역했습니다. 영어 기준1300개와 키가 정확히 일치하며 누락·빈 값·잔여 Hangul·placeholder 불일치0개입니다. ja/ja-JP는 완성된 기준 catalog를 공유합니다. 기존 공백 alias가 canonical trimmed 번역을 사용하는 계약에 맞춰 최초 검사 예상만 정정했습니다. 전체 화면의 시각적/언어 품질 검증이나 기준 catalog 밖 동적 문구, 모든 Linux 언어 번역 완료를 뜻하지 않습니다.

관련28 tests/i18n/production build, 전체662 tests 및 격리 package:verify --terminal PASS. 실제 패키지가 제공하는 로그인 클라이언트 파일에서 일본어 HBA·감사 문구도 확인합니다. deb `dist/tastedev-linux_0.1.0_amd64-japanese-complete.deb` SHA-256 `48187b1668d0ce5d5ebb6dccbb6c2a779658b9f0501276c9daea68c27948c594`, package evidence `package-2026-10-04T17-57-45.835Z.json`.

승인된103 앱 업데이트를 적용하고 설정4개 hash 보존·active whitecalvin·helper91 runtime/manifest/BUILD_ID/root 소유권·login200·미인증 감사/복구9건401을 확인했습니다. 설치 자산5개·HTTP 자산3개 hash 일치 PASS. 운영 nginx/DB/Certbot/cron 파일과 sudo 정책은 변경하지 않았습니다. 증거 `.runtime/verification/japanese-complete-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles. 브라우저 GUI 검증과 다른 언어 전체 지원은 미완료이며 전체 목표 PARTIAL입니다. 아래는 이전 단계 이력입니다.

## 2026-10-05 최신 nginx 설명·감사 페이지·HBA 확인창103 반영

최신 소스를 별도 빌드 복사본에서 검증하고 `dist/tastedev-linux_0.1.0_amd64-nginx-help-audit-hba.deb`를 승인된103 설치 앱에 업데이트했습니다. SHA-256 `187e537df12db60a0dc17b378b42e323d7e5192b33f029843a080d1d1eb6ee49`, package evidence `package-2026-10-04T17-42-10.167Z.json`. nginx TLS/realip/rewrite/if 설명, 감사 기록100건 페이지와 append snapshot, HBA 앱 내부 삭제 확인 및 stale/중복 승인 보호를 포함합니다. 전체 컴포넌트 회귀660 PASS, 최종 번역을 포함한 관련14/i18n/production build PASS, 실제 패키지의 인증된 감사 HTTP 페이지/PTY 검사 포함 `package:verify --terminal` PASS입니다.

설치 직전 진행 중인 작업 없음과 기존 보안·계정·systemd user override·환경 파일4개 hash를 확인했고 설치 후 동일함을 확인했습니다. 서비스 active/whitecalvin, helper91 runtime·manifest·BUILD_ID·root 소유권 일치, login200 및 미인증 감사·복구9개 요청401 PASS. 설치된 자산5개·HTTP 제공 자산3개 해시가 검증 빌드와 일치합니다. 운영 nginx/DB/Certbot/cron 설정과 sudo 정책은 변경하지 않았습니다. 로컬 개발 서버의 빌드 파일도 교체하지 않았습니다. 브라우저 GUI 조작과 실제 운영 적용은 검증되지 않았으며 전체 목표는 PARTIAL입니다. 증거 `.runtime/verification/nginx-help-audit-hba-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles. 아래는 이전 단계 이력입니다.

## 2026-10-05 일반 파일 IDE 탭 닫기·격리 GUI 입력 진단103 반영

일반 IdeEditor의 미저장 탭 닫기를 native confirm에서 앱 확인창으로 통일했습니다. text/baseline/version을 캡처하고 승인 및 함수형 상태 갱신 시 확인하여 최신 편집을 닫지 않습니다. 다른 활성 탭을 유지하고 닫힌 활성 탭은 오른쪽/왼쪽 인접 탭으로 이동합니다. 취소·오래된 승인·queued 편집 보존을 검사했으며 탭 닫기는 파일 API/디스크 저장을 실행하지 않습니다.

관련5 tests, 전체653 tests/i18n/production build/격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-workspace-tab-close.deb` SHA `9b1a16e4d5ad0613759b034c6d63c535f2bea62b138ac793a01f059cb1d6b3a6`, package evidence `package-2026-10-04T16-45-21.781Z.json`. 승인된103 앱 업데이트 후 설정4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치 PASS.

실제 GUI 검증을 위해 /tmp 계정/state/workspace와 기존127.0.0.1 쿠키와 분리된127.0.0.2 루프백 IP에 조회 전용 서버를 실행했습니다. 최초8793 포트 충돌(EADDRINUSE)로 terminal 실패 후 비어 있는 포트를 배정해 정상 Ready를 확인했습니다. 로그인 화면과 입력값 표시를 확인했으나 semantic click/문서화된 native AX click/비밀번호 Enter 제출이 URL·focus·AX 변경으로 이어지지 않았습니다. JS dialog 없음/console error 없음. 앱 문제와 자동화 입력 문제의 원인은 확정하지 않으며 GUI PASS를 주장하지 않습니다. 임시 탭·서버 종료 및 포트 닫힘 확인. 기존 계정·쿠키·운영 설정은 변경하지 않았습니다. 진단 screenshot `/tmp/tastedev-gui-input-diagnostic-20261005.png`, 증거 `gui-input-diagnostic-20261005.json`.

설치 증거 `.runtime/verification/workspace-tab-close-delivery-20261005.json` 및 동일 prefix source/preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 서비스 확인창·결과 로그103 반영

nginx 시작/종료의 native confirm을 앱 ConfirmDialog로 바꿨습니다. 확인 전 API 요청은 발생하지 않습니다. 승인 시 현재 연결/API/policy version/capability/epoch를 다시 확인하고, 소비한 요청과 이전 확인 이벤트를 재사용하지 않습니다. 연속 클릭은 고정 nginx.service 요청 하나로 제한합니다. 시작/종료 결과는 별도 operation dialog shell log에 표시하며 이전 연결의 늦은 응답이 새 상태나 busy lock을 바꾸지 않습니다. dialog의 지연 close가 재개한 창을 닫지 않도록 open 상태를 확인합니다. 실제 운영 nginx 서비스를 시작/종료하지 않았습니다.

관련8 tests 및 전체650 tests, i18n/production build/격리 package:verify --terminal PASS. 최초 전체 검사에서 기존 연결 lifetime fixture2곳이 새 ConfirmDialog import stub을 누락해 실패했으며 보완 후 전체 재검사 통과. 서비스 연결 전환 중 취소/늦은 응답 보호 검사도 추가했습니다. deb `dist/tastedev-linux_0.1.0_amd64-nginx-service-dialog.deb` SHA `752f9786d651426fc5c11b55d3840752eb3b5774762b34cf38846b1c77729d3e`, package evidence `package-2026-10-04T16-27-25.283Z.json`.

승인된103 앱에 설치했습니다. 진행 작업 없음 확인, 설정4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치 PASS. 로그인된 실제 브라우저 GUI·운영 서비스 제어 검증은 남아 있습니다. 운영 설정 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-service-dialog-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 코드 초기화 확인창·최신 편집 보호103 반영

NginxCodeEditor의 편집 초기화 native window.confirm을 앱 내부 ConfirmDialog로 통일했습니다. 초기화 요청이 캡처한 편집 identity/source/buffer를 승인 시점과 함수형 상태 갱신 시점에 다시 확인합니다. 확인 중 바뀐 코드·원본·선택·읽기 전용 상태는 삭제를 거부하고 다른 노드의 버퍼를 보존합니다. 취소 시 버퍼를 유지하며 identity/source/readOnly 변경 시 요청을 닫습니다. 운영 파일 또는 초안 반영 콜백을 실행하지 않습니다. 다른 화면의 native confirm은 남아 있으므로 앱 전체 통일 완료를 주장하지 않습니다.

관련7 tests(컴포넌트 초기화·취소·확인 중 변경·다른 버퍼 보존 및 순수 함수 재검사), 전체648 tests, i18n, production build 및 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-editor-reset.deb` SHA `610f2529af2fdb97defa9c3e87f703d3778e4d7e2ab4f3f1e49c9a5bb00b9ccb`, package evidence `package-2026-10-04T16-19-32.730Z.json`.

승인된103 설치 앱에 업데이트했습니다. 진행 작업 없음과 기존 보안·계정·systemd override·환경4개 hash 보존, active whitecalvin/helper91·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치6개·HTTP4개 자산 일치를 확인했습니다. 로그인된 실제 브라우저 조작 검증은 남아 있습니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-editor-reset-delivery-20261005.json` 및 동일 prefix source/preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 stream upstream 설명·추천 메뉴103 반영

stream upstream 블록이 HTTP upstream 도움말을 사용하던 부분을 전용 설명으로 바꿨습니다. server·zone·hash·least_conn·random·resolver·resolver_timeout 7종에 stream upstream 공식 지시어 링크와 설명을 추가했습니다. upstream DNS 설정의 1.27.3 최소 버전 안내를 포함합니다. stream 트리 메뉴에서 이름 있는 upstream 블록을 생성하고 TCP·UDP 백엔드 지시어를 추가할 수 있습니다. HTTP keepalive/location/root 추천은 표시하지 않습니다. 영어·포르투갈어 번역을 추가했습니다. 이 범위가 모든 stream 외부 모듈 지시어 설명을 증명하지는 않습니다.

관련15 tests(실제 컴포넌트 메뉴 핸들러/초안 원본 보존 포함), 전체647 tests/i18n/production build 및 격리 package:verify --terminal PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-stream-upstream.deb` SHA `53dfca34ea20b72ef2cde4b4cf8dbe9249d858efe7b63849dae5d291d1308c14`, package evidence `package-2026-10-04T16-12-27.301Z.json`.

승인된103 앱에 업데이트했습니다. 기존 설정4개 hash 보존, active whitecalvin, helper91/manifest/BUILD_ID/root ownership/login200/미인증 복구8건401 및 설치 자산6개·HTTP 제공4개 hash 일치를 확인했습니다. 현재 브라우저 URL은8792 관리자 로그인이며 정확한 로그인 heading 1개를 확인했습니다. 로그인된 GUI 조작/운영 nginx 적용은 검증하지 않았습니다. 증거 `.runtime/verification/nginx-stream-upstream-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx include 문맥별 설정 설명103 반영

조회된 include 연결을 따라 HTTP·stream·mail·upstream 설정 설명과 추천 항목을 구분합니다. 파일이 여러 문맥에서 포함되거나 include 조회가 불완전하면 설명 문맥을 선택하게 하며, 선택은 설정 초안이나 운영 파일을 변경하지 않습니다. 그래프 갱신 후 유효하지 않은 이전 선택은 무시합니다. 외부·미확인 지시어는 기본값을 추정하지 않고 공식 문서 확인 안내를 유지합니다.

관련14 tests, 전체646 tests, i18n 및 production build PASS. 초기 선택 없음에서 발생한 null 접근을 수정하고 회귀 검사했습니다. 패키지 생성 완료 전에 시작한 최초 검증은 불완전 archive로 실패했으며 생성 완료 후 재검증 PASS. deb `dist/tastedev-linux_0.1.0_amd64-nginx-include-help.deb` SHA `a731d581596ec0473debe68df4ab60ab00baf272ec666dfdaf6b1a1b211fa056`, 격리 package:verify --terminal PASS, package evidence `package-2026-10-04T16-06-08.174Z.json`.

승인된103 설치 앱에 반영했습니다. 진행 작업 없음과 기존 보안·계정·systemd override·환경4개 hash 보존을 확인했으며 active whitecalvin/helper91 runtime·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401 및 설치·HTTP 자산 일치 PASS. 로그인된 GUI 검증은 이전 사용자 로그인 요청 대기 상태입니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-include-help-delivery-20261005.json` 및 동일 prefix preflight/install-result/installed/bundles 기록. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-05 nginx 단일 편집 경로·코드 복구 확인창103 반영

ServerManager가 NginxConfigTree에 전달하던 미사용 legacy 서버 폼 JSX와 미사용 props/상태/import를 정리했습니다. 기존 트리 컴포넌트가 children을 표시하지 않았으므로 이 폼은 실제 화면에서 사용할 수 없었습니다. 기존 검사도 stub children을 순회해 폼이 표시된 것으로 오인하던 부분을 실제 전달 구조에 맞춰 수정했습니다. 새 외부 코드 편집창을 만드는 미사용 opener/native confirm은 제거했으나 nginxTreeCode에 이미 보존된 이전 편집 기록의 보기/수정/트리 반영 경로는 유지했습니다. Certbot 도메인 연계를 위한 선택 콜백은 유지합니다. 코드 복구의 앱 확인창과 변경/readonly 대상 거부도 함께 포함합니다.

기존 코드 복구/Certbot·cron/중복 요청·이전 연결 응답 거부 관련3 tests 및 전체643 tests/i18n/production build PASS. 최초 복구 fixture에서 liveSource 메타데이터 누락으로 검사 실패 후 실제 record 형식에 맞춰 보완해 통과했습니다. deb `dist/tastedev-linux_0.1.0_amd64-nginx-editor-consolidated.deb` SHA `8ec4101e1c6a82a1af6baae9200a7abbd5d0f7f860b0588a57f55dcfc3d57f79`, package evidence `package-2026-10-04T15-52-43.872Z.json`, 격리 package:verify --terminal PASS.

승인된103 앱에 설치했습니다. 진행 작업 없음 확인 후 보안·계정·systemd user override·환경 파일4개 hash 보존/active whitecalvin/helper91 runtime·manifest·BUILD_ID·root ownership/login200/미인증 복구8건401을 확인했습니다. 설치 자산6개와 HTTP 제공4개가 빌드와 일치합니다. 원격 GUI 상호작용은 이전 관리자 로그인 요청 대기 중이며 실제 선택/확인창 동작을 검증했다고 주장하지 않습니다. 운영 nginx 파일은 변경하지 않았습니다. 증거 `nginx-editor-consolidated-delivery-20261005.json`, `nginx-editor-consolidated-preflight-20261005.json`, `nginx-editor-consolidated-install-result-20261005.json`, `nginx-editor-consolidated-installed-20261005.json`, `nginx-editor-consolidated-bundles-20261005.json`. 전체 목표 PARTIAL. 아래 기록은 이전 단계 이력입니다.

## 2026-10-05 nginx 코드 복구 확인창·최신 편집 보호

NginxCodeRecovery의 대상 코드 덮어쓰기/보존 코드 버리기 native confirm2곳을 앱 내부 ConfirmDialog로 바꿨습니다. 취소는 버퍼를 유지하며 승인할 때 캡처한 원본/대상 버퍼 및 대상 노드 identity/source/존재/읽기 전용 상태를 다시 검사합니다. 변경되었으면 작업을 거부하고 코드를 보존합니다. 버리기는 확인한 버퍼만 제거하고 다른 편집을 유지합니다. readonly 파일도 nginxEditorTarget에 표시하며 recoverNginxCodeBuffer가 거부합니다. 복구 dialog의 지연 close event가 재개한 dialog를 닫지 않도록 open 상태를 확인합니다.

관련6 tests와 전체643 tests/i18n/production build PASS. 컴포넌트 실제 핸들러에 대한 request/cancel/approve/stale destination/readonly 검사이며 로그인된 실제 브라우저 UI 증거가 아닙니다. 원격8792 탭은 관리자 로그인 화면으로 확인됐고 이전 사용자 로그인 요청은 대기 중입니다. 개발 소스 변경이며103 설치본은 직전 nginx-descriptions deb입니다. ServerManager의 legacy openTreeCode native confirm은 아직 남으며 앱 전체 제거를 주장하지 않습니다. 운영 파일은 변경하지 않았습니다. 증거 `.runtime/verification/nginx-code-recovery-dialog-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-05 nginx 설명·메뉴 패키지103 반영

검증한 deb `dist/tastedev-linux_0.1.0_amd64-nginx-descriptions.deb` SHA `7ee4ad31ff4cf626a74178a45d2bb4d72186f896a895564f032432641839c7fc`를 승인된103 설치 앱에 반영했습니다. 설치 직전 active/whitecalvin/진행 중 child·helper 작업 없음과 보안·service-user·user override·환경 파일4개 hash를 확인했으며 설치 후4개 hash가 동일합니다. 서비스 active, helper/91 runtime/manifest/BUILD_ID/root ownership 일치, login200 및 미인증 복구8건401 PASS. 설치된6개 및 HTTP 제공4개 JS/CSS hash가 현재 검증 빌드와 일치합니다.

원격 브라우저의 nginx IDE 이동은 관리자 로그인 페이지로 리다이렉트됐습니다. 기존 계정으로 사용자 로그인을 요청했으며 로그인 세션을 우회하거나 비밀번호를 변경하지 않았습니다. 따라서 원격 노드 선택·설명 화면·확인창 조작은 로그인 후 검증이 남습니다. 로그인 화면 screenshot `/tmp/tastedev-nginx-update-login.jpg`. 증거 `nginx-descriptions-delivery-20261005.json`, `nginx-descriptions-preflight-20261005.json`, `nginx-descriptions-install-result-20261005.json`, `nginx-descriptions-installed-20261005.json`, `nginx-descriptions-bundles-20261005.json`. 전체 목표 PARTIAL. 아래 미설치 표시는 이전 단계 이력입니다.

## 2026-10-05 nginx 설명 패키지·컨텍스트 메뉴 실행 경로 수정

stream/mail 추천 메뉴를 표시하는 단계뿐 아니라 실제 nodeAction에서 조회하는 프리셋에도 프로토콜 문맥을 전달했습니다. stream의 server + 메뉴가 광고한 서버 블록을 실제 초안에 추가하는 검사와 원본 보존 검사를 추가했습니다. 관련11 tests와 최종 production build PASS. 이전 전체640 PASS 이후 이 메뉴 실행 경로를 보완했으며 전체검사를 반복했다고 주장하지 않습니다.

배포 deb `dist/tastedev-linux_0.1.0_amd64-nginx-descriptions.deb` SHA `7ee4ad31ff4cf626a74178a45d2bb4d72186f896a895564f032432641839c7fc`를 생성하고 격리 package:verify --terminal PASS를 확인했습니다. 인증·터미널 PTY HTTP·권한 거부·패키지 파일/BUILD_ID/closure 검증을 포함하며 실제 사용자의 GUI 동작이나 운영 nginx 적용 증거가 아닙니다. 서버103에는 아직 설치하지 않았습니다. package evidence `package-2026-10-04T15-36-28.695Z.json`.

새 개발 브라우저 탭에서 인증 화면/트리를 확인하고 검색 입력 events→필터링→검색 초기화는 반영됐습니다. 파일/노드 클릭과 Enter/컨텍스트 키, 모두 접기 클릭은 화면 변경을 확인하지 못했습니다. 검색 동작은 React가 실행 중임을 보이며 버튼 전반의 원인은 확정하지 않았습니다. 기존 탭의 JS 확인창 조회는 false였으나 DOM 조회는 focus timeout입니다. 새 탭의 DOM에서 버튼이 실제 클릭 대상이며 overlay가 없음을 확인했습니다. 진단 screenshot `/tmp/tastedev-nginx-selection-diagnostic.jpg`. 임시 탭을 닫았고 운영 설정 변경은 없습니다. 증거 `.runtime/verification/nginx-descriptions-package-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-05 nginx HTTP·stream·mail 문맥 구분

stream/mail/if 블록 설명을 추가하고 server 블록의 의미와 설정 설명·공식 링크·추천 항목을 프로토콜별로 구분했습니다. TCP/UDP proxy_pass 예시에 HTTP URL을 사용하지 않으며 stream server의 컨텍스트 메뉴에 HTTP location을 추천하지 않습니다. 알 수 없는 프로토콜 항목에는 HTTP 설명을 잘못 대입하지 않고 문서 확인 안내를 유지합니다. 다른 파일에서 include된 블록의 외부 문맥 추론은 아직 구현하지 않았습니다.

전체640 tests PASS 이후 컨텍스트 메뉴의 프로토콜 구분을 추가했으며 최종 관련11 tests와 production build PASS. i18n PASS. 별도 개발 브라우저 탭에서 인증 화면·nginx 트리 로드는 확인했으나 클릭/Enter 이후 inspector가 선택 화면으로 전환되지 않아 실제 선택 동작은 미검증입니다. 콘솔 오류는 없었으며 임시 검증 탭을 닫았습니다. 원격 패키지 설치나 운영 파일 변경은 하지 않았습니다. 증거 `.runtime/verification/nginx-protocol-help-20261005.json`. 전체 목표 PARTIAL.

## 2026-10-04 nginx 중복 입력·블록 추가 UI 정리 및103 반영

지시어 추가는 NginxBlockSettings의 설정 목록/사용자 지정 폼으로 통일하고 기존 중복 추가 폼은 블록 추가만 처리합니다. http/events/server/types/stream/mail처럼 인수가 없는 블록의 빈 값 편집기를 제거하며 location 등 인수 있는 블록의 편집기를 유지합니다. events/types/upstream의 자식 블록 추가 폼은 표시하지 않으며 다른 노드로 이동할 때 추가 폼의 접힘 상태를 분리합니다. location 인수 편집 유지/새 location 블록 구조/원본 파일 보존을 포함한 관련16 검사와 i18n/build/deb --terminal 검사 PASS. 직전 전체636 PASS는 이전 소스 기준이며 이번 전체 검사를 반복했다고 주장하지 않습니다.

개발 인증 브라우저에서 http의 추가 폼으로 server 블록을 추가해 트리 server5개를 확인하고, 실행 취소 후 전체 코드가 검증 전 원본과 정확히 동일한 것을 확인했습니다. 최종 events DOM에 빈 인수/자식 블록 추가 폼이 없음을 확인했습니다. QA 기록 정리를 위해 원본 일치 확인 뒤 끝 newline만 초안에 반영하고 초안 초기화를 클릭했으나 확인창에서 CDP mouse/focus 명령이 응답하지 않았습니다. getJsDialog도 실패했고 최종 screenshot timeout으로 CUA kernel이 reset됐습니다. 사용자에게 확인창 직접 처리를 요청했으며 완료했다고 주장하지 않습니다. 운영 /etc/nginx/nginx.conf SHA `d7be180d12cb332090cf4a0e8de780bd30e7f59fd0ffa4ad42be0e70e6bc6348`가 검증 전과 동일합니다. 운영 적용 버튼/API는 실행하지 않았습니다.

최종 deb `dist/tastedev-linux_0.1.0_amd64-nginx-clean-settings.deb` SHA `a6a583a1e81b23aafd4a81564518b8f08c7c25d2da54d8c9144dc38b813b3cc9`, package evidence `package-2026-10-04T14-50-01.926Z.json`를 승인된103 앱에 설치했습니다. 작업 없음/기존 설정4개 checksum 동일/active whitecalvin/login200/미인증 복구8건401/helper와91 runtime·manifest·BUILD_ID·root ownership 일치 검사 PASS. 설치된 GUI assets6개와 HTTP 응답4개가 검증 빌드와 일치합니다. 최초 중간 패키지 ad21e818…는 보존했으며 설치하지 않았습니다. 최종 화면 screenshot과 원격 브라우저 실제 조작은 미검증입니다.

증거 `nginx-clean-settings-delivery-20261004.json`, `nginx-clean-settings-preflight-20261004.json`, `nginx-clean-settings-install-result-20261004.json`, `nginx-clean-settings-installed-20261004.json`, `nginx-clean-settings-bundles-20261004.json`. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 nginx 설정 설명·선택 컴포넌트 103 배포

개발 브라우저에서 검증한 설정 설명/블록 문맥 도움말 및32px 선택 화살표 정렬을 deb에 반영했습니다. 상태가 분리된 전체636 tests와 deb --terminal 검증 PASS. 새 패키지 `dist/tastedev-linux_0.1.0_amd64-nginx-help-ui.deb` SHA `aeb979de5acdad56be032feccabb2be6732dc8b77545758fcf3367b7bf738fa5`, package evidence `package-2026-10-04T14-35-35.594Z.json`.

승인된103 앱에 대해 서비스 active/실행 계정 whitecalvin, 진행 중 child/helper 작업 없음, 보안·service-user·systemd user override·환경 파일4개 checksum을 설치 직전 재확인했습니다. 업데이트 후4개 checksum 동일/서비스 active/login200/미인증 복구8건401/helper 및91 runtime/manifest/BUILD_ID 일치와 root ownership 검사가 통과했습니다. 새 nginx 도움말/선택 컴포넌트 JS·CSS6개 설치 hash와4개 HTTP 응답 hash가 검증 빌드와 동일합니다. 원격 readOnly=false/terminal=true를 유지했고 로컬 fileEditing 변경을 원격에 복제하지 않았습니다. 이전 deb와 증거를 보존합니다.

증거 `nginx-help-ui-delivery-20261004.json`, `nginx-help-ui-preflight-20261004.json`, `nginx-help-ui-install-result-20261004.json`, `nginx-help-ui-installed-20261004.json`, `nginx-help-ui-bundles-20261004.json`. 전체 목표 PARTIAL. 원격의 실제 로그인 브라우저 조작/운영 nginx 적용·복원/다른 패키지 운영 E2E는 이 배포 검사의 증거로 대체하지 않습니다. 아래는 이전 단계 이력입니다.

## 2026-10-04 개발 nginx 설정 설명·블록 문맥·브라우저 동기화 검증

개발8787의 기본 제공79개 지시어에 설명/공식 링크를 제공하고 FastCGI·TLS 도움말을 보완했습니다. 이후 실제 개발 /etc/nginx 파일7개를 읽어 이름만 점검하니 worker_cpu_affinity/proxy_ssl_name/allow/deny가 일반 fallback 상태여서 전용 설명을 추가했습니다. 재검사에서 활성 지시어36종의 설명 누락0/읽기 오류0을 확인했습니다. 설치된 모든 외부 모듈·다른 서버의 모든 설정을 포괄하는 증거는 아닙니다. 외부/사용자 지정 지시어는 알 수 없는 의미/기본값을 만들지 않고 모듈 문서 확인 안내를 표시합니다.

선택 블록 문맥을 도움말과 검색에 전달합니다. upstream의 keepalive_requests/time/timeout 및 resolver_timeout은 해당 모듈의 설명/링크를 사용하며 types 블록의 MIME 행에는 확장자 매핑 설명을 제공합니다. 관련20 tests, i18n check, production build PASS. 실제 로그인된 개발 브라우저에서 nginx.conf 코드에 multi_accept off를 worker_connections 앞에 추가하고768→769를 편집해 초안에 반영한 뒤 events 설정 화면의 순서/값/설명 갱신을 확인했습니다. 실행 취소 후 코드 전체가 검증 전과 정확히 동일함을 확인했습니다. 운영 적용은 실행하지 않았습니다. 증거 `.runtime/verification/nginx-help-installed-files-20261004.json`, 화면 `/tmp/tastedev-nginx-context-help.jpg`.

직전 개발 보안 변경은 readOnly=false 유지/fileEditing=true이며 다른 권한 옵션을 유지했습니다. 선택 컴포넌트는 실제32px 높이/16px 화살표/중앙 오차0 및 펼침·접힘 확인: `nginx-help-select-dev-20261004.json`. 이번 변경은 개발 소스/8787에 반영됐으며103 설치 앱은 이전 pg-all-settings deb를 유지합니다. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 PostgreSQL 선택 파일 전체 항목 GUI·103 반영

PostgreSQL 파일 노드는 이제 5개 미리 정한 폼 대신 선택 파일의 설정과 문법상 유효한 주석 처리 항목을 파일 순서대로 표시합니다. 별도 설정 노드에서도 같은 화면을 열며 기존 연결/메모리/로그 그룹 전용 폼은 유지합니다. 설정 이름/값/설명 검색, 항목 활성·주석 처리, 값 비우기(행 유지/주석 전환), 사용자 지정 항목 추가를 지원합니다. 변경은 같은 전체 코드 초안에 반영되며 코드 편집도 행/순서를 갱신합니다. 값 입력 중에는 row key를 보존하여 매 입력마다 입력칸이 재생성되지 않습니다. 잘못된 중간 입력은 코드에 반영하지 않고 표시하며, GUI로 읽을 수 없는 문법은 오류와 코드 보기로 안내합니다. 파일 밖 include/실행 중 pg_settings 값, enum/범위/재시작 메타데이터 전체 지원 또는 운영 자동 적용 기능으로 확대하지 않습니다.

새 파서는 optional equals, 인용 문자열 내부 #, doubled quote/backslash quote, CRLF, 중복 항목을 보존하며 선택한 줄만 바꿉니다. 오래된 줄·다중 행 주입·잘못된 값은 거부합니다. 첫 공식 sample 검사에서 단위 설명 주석4줄을 항목으로 오인했으며 유효하지 않은 주석 문장을 제외하도록 수정했습니다. 설치 PostgreSQL18.6 공개 sample353개 항목을 읽고 임시 파일의 port/shared_buffers/log_line_prefix를 실제 postgres -C로 확인했습니다. binary SHA `30a38e0516ec1bde4b8ca710cf28ba51ee78bd004cabbf3107e7a52d5414a64a`. 서버/DB를 시작하거나 운영 설정을 변경하지 않았습니다.

관련7 tests, 최종 전체633 tests, i18n check, production build 및 deb --terminal 검증 PASS. 새 feature 문구 추가 후 포르투갈어 complete-catalog 회귀가 실패해 해당 신규 문구를 번역하고 전체검사를 다시 통과했습니다. 새 deb `dist/tastedev-linux_0.1.0_amd64-pg-all-settings.deb` SHA `fba2ae049b727dced8c9bf165d80b6d84958cc8bc16e835f03ff6e2adc5338d0`를 승인된103 앱에 설치했습니다. 진행 작업 없음/설정4개 checksum 보존, active/whitecalvin, login200, 미인증 복구8건401, helper/91runtime/manifest/BUILD_ID 일치 확인. 새 PostgreSQL GUI의 server/client2개 및 login JS9개 SHA가 검증 빌드와 일치합니다. 로그인 브라우저의 실제 키 입력/화면 시각 검증은 아닙니다.

증거 `.runtime/verification/pg-all-settings-delivery-20261004.json`, `postgresql-all-settings-native-20261004.json`, `pg-all-settings-preflight-20261004.json`, `pg-all-settings-install-result-20261004.json`, `pg-all-settings-installed-20261004.json`, `pg-all-settings-installed-bundles-20261004.json`, `pg-all-settings-served-20261004.json`, `package-2026-10-04T14-03-51.256Z.json`. 전체 목표 PARTIAL. 아래는 이전 단계 이력입니다.

## 2026-10-04 목표 시스템: 실행 계정의 기본 셸 터미널 반영

터미널 신규 기본값을 고정 `bash -i`에서 서버 실행 계정(userInfo)의 기본 셸로 변경했습니다. terminal-context 및 PTY SHELL도 같은 계정 값을 사용합니다. 경로를 shell quoting하여 실행하며 nologin/false 및 잘못된 기본 셸 경로는 거부합니다. 명시적 Bash/Codex/Claude 선택과 기존 저장된 선택은 유지합니다. 출력에는 내부 프리셋 이름 대신 실제 셸 실행 명령을 표시합니다. 웹 로그인 계정과 OS 실행 계정은 서로 다른 역할이며 SSH 접속 정보를 추가로 요구하지 않습니다.

전체628 검사 PASS 후 출력 명령 표시만 보완하여 관련9 검사·최종 production build·deb --terminal 검사 PASS. 실제 로컬 whitecalvin 기본 Bash PTY의 UID 일치/Enter(CR) 입력/출력/100×30 크기 변경/정상 종료 PASS. 최초300ms 시작 대기 검사에서는 실패했고 원인은 분리하지 못했습니다. 1200ms 대기 후 LF 및 CR 검사가 통과했습니다. 최초 실패를 없던 것으로 처리하지 않습니다. 로그인된 브라우저 키 입력 증거는 아닙니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-account-shell.deb`, SHA `46c60d207997fb84013da4565d328bd619dfaaa74126d120aaf759d8414aef11`를 승인된103 앱에 설치했습니다. 작업 없음 조건/설정4개 checksum 보존, active/whitecalvin, login200, 미인증 복구8건401, helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다. 변경된 터미널 서버·클라이언트3개 번들과 login JS9개 SHA가 현재 검증한 빌드와 일치합니다. 개발8787 및 기존103 터널8792의 login200도 확인했습니다. 보류된 일본어90개와 신규 셸 오류 문구도 빌드에 포함되어 ja1010/1190이며180개 미번역입니다.

증거 `.runtime/verification/account-shell-delivery-20261004.json`, `account-shell-native-20261004.json`, `account-shell-preflight-20261004.json`, `account-shell-install-result-20261004.json`, `account-shell-installed-20261004.json`, `account-shell-installed-bundles-20261004.json`, `account-shell-served-20261004.json`, `package-2026-10-04T13-46-34.144Z.json`. 전체 목표 PARTIAL. 앞으로 현재 요청의 우선순위는 목표 시스템의 패키지별 운영 GUI/터미널 실제 동작이며, 추가 번역 항목 수를 기능 구현 진척의 대체 지표로 사용하지 않습니다. 아래는 이전 단계 이력입니다.

## 2026-10-04 일본어 운영·IDE 안내205개 추가·103 반영

일본어 파일/디스크 비교, 패키지 설정 안내, 보안 권한, nginx server·인증서·cron·터미널, 설정 트리 및 PostgreSQL 적용/복구 영향205개 항목을 번역했습니다. 일본어919/전체1189 항목으로270개 미번역이며 영어 fallback/부분 번역 표시는 유지합니다. 관련17 tests, i18n:check, production build 및 package --terminal 검증 PASS입니다. 전체 언어 또는 실제 전체 GUI 완료 증거로 확대하지 않습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-ja-operations.deb` SHA `ba7a51cca309b9d304895431afe5e44e1c5103565104a9789acf94aa4a280de8`를 승인된103 앱에 설치했습니다. 작업 없음 조건 및 기존 설정4개 checksum 보존 확인. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치 확인. 제공 JS9개 SHA가 검증한 로컬 빌드와 전부 일치하며 새 일본어6종의 문자열 포함을 확인했습니다. source catalog SHA `a3815461079b4c38666b8af9397568f3034cf8cbabcf7db2f7e11e98aa939fec`. 브라우저 언어 선택·키보드/마우스 조작과 전체919개 문구 렌더링 검증은 아닙니다.

증거 `.runtime/verification/ja-operations-delivery-20261004.json`, `ja-operations-preflight-20261004.json`, `ja-operations-install-result-20261004.json`, `ja-operations-installed-20261004.json`, `ja-operations-served-20261004.json`, `package-2026-10-04T13-31-52.275Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 기준 catalog1189개 충족·103 반영

남은288개 항목(nginx 지시어 설명·코드/미저장 복구, 환경 파일 복원, 터미널 입력·오류, PostgreSQL HBA 적용/복구와 중단 작업 복구)을 번역했습니다. pt-BR/pt-PT 공통 catalog의 키는 영어 기준1189개와 정확히 일치하며 누락0개, placeholder 불일치/빈 값/잔여 Hangul0개입니다. 기존 부분 catalog 회귀 검사를 전체 키·coverage 일치 검사로 변경했습니다. 문구의 기술 용어/수치/확인 영향은 보존했습니다. 기준 catalog 밖의 미추출·동적 메시지와 실제 전체 UI의 번역 품질까지 완료한 결과는 아닙니다. 다른 Linux 언어 전체 번역도 미완료입니다.

관련17 tests 및 i18n:check PASS. 실제 컴파일된 LanguagePicker를 pt-BR/pt-PT/aa-DJ context로 React 서버 렌더링하여 Portuguese 선택 항목에 부분/영어 UI 안내가 없고 미번역 Afar 선택에는 English UI가 유지됨을 확인했습니다. 각324개 항목을 확인했습니다. 브라우저 선택·저장 상호작용 증거는 아닙니다. production build 및 package --terminal verifier PASS; 해당 verifier의 과거 'Portuguese partial catalog' 체크 이름은 카탈로그 제공 확인의 기존 이름이며 현재 누락 수 판정으로 사용하지 않았습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-pt-catalog.deb` SHA `501e85f8c02cbbc8a36209f7cad2a5be32d2491955ba25e177ce859468a182e2`를 승인된103 앱에 설치했습니다. 진행 작업 없음 및 설정4개 checksum 보존 확인. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치 확인. 실제 제공 JS9개 SHA는 검증한 로컬 빌드 파일과 전부 일치했습니다. 새 번역6종의 문자열 포함도 확인했습니다. source catalog SHA `95bae2d4e26abf6bfa0385940ea4d747bdd1f3d62cb22ea7abc2d0fb13823510`.

증거 `.runtime/verification/portuguese-catalog-render-20261004.json`, `pt-catalog-delivery-20261004.json`, `pt-catalog-preflight-20261004.json`, `pt-catalog-install-result-20261004.json`, `pt-catalog-installed-20261004.json`, `pt-catalog-served-20261004.json`, `package-2026-10-04T13-23-42.346Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 서비스 문구 잔여 한국어 수정·포르투갈어145개 추가·103 반영

영어/일본어/중국어/스페인어/프랑스어/독일어/러시아어/아랍어의 시스템 서비스 제어 값에 남아 있던 한국어 '시스템' 접두사를 각 언어로 수정했습니다. 현재9개 번역 catalog 값의 한국어 잔류는0개입니다. i18n 검사기에 비한국어 번역 값의 Hangul 잔류를 FAIL로 기록하는 검사를 추가했습니다. 기존 오류를 메모리로 주입해 실제 검사기 exit1/FAIL 및 해당 항목 검출을 확인했으며 원본 catalog는 변조하지 않았습니다. 이 검사는 번역 자연스러움이나 다른 언어의 잔류까지 판정하지 않습니다.

포르투갈어 서비스 등록·설정·제어·백업·복구, sudo 규칙·권한 영향, nginx 실행/적용/복구와 Redis 리소스/격리 검사 안내145개도 추가했습니다. 포르투갈어901/전체1189 항목이며288개 미번역입니다. 관련17 tests, clean i18n check, production build 및 package --terminal 검증 PASS입니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-service-language.deb` SHA `71c3001c284b0ae57c5906552693892ae077d40efb4ff4979660f3f49d8b3778`를 승인된103 앱에 설치했습니다. 작업 없음 및 설정4개 checksum 보존을 확인했습니다. 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401, helper/91runtime/manifest/BUILD_ID 일치 확인. 제공되는 JS9개에서 수정된9개 언어 서비스 문구와 새 포르투갈어5종을 확인했고 이전 한국어 접두사 부재를 확인했습니다. 실제 브라우저 언어 선택이나 운영 sudo/서비스 변경 검증은 아닙니다.

증거 `.runtime/verification/translation-residual-check-20261004.json`, `service-language-delivery-20261004.json`, `service-language-preflight-20261004.json`, `service-language-install-result-20261004.json`, `service-language-installed-20261004.json`, `service-language-served-20261004.json`, `package-2026-10-04T13-14-02.859Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 IDE·복구·PTY 안내270개 추가·103 반영

nginx 트리/초안/코드 교체·디스크 비교, PostgreSQL 적용/백업/복구 영향, MariaDB·Redis include 연결과 Redis 제거 정책, Node 앱/환경 파일, Certbot 선택 갱신·cron 시간대, PTY 안내 및 감사 결과의 포르투갈어270개 항목을 추가했습니다. 기존 키·명령·동작은 변경하지 않았습니다. 포르투갈어756/전체1189 항목이며 미번역433개가 남습니다. 다른 Linux 언어 전체 번역도 미완료입니다.

관련 번역17 tests, i18n:check, production build 및 package --terminal verifier PASS. 새 deb `dist/tastedev-linux_0.1.0_amd64-pt-ide-fields.deb` SHA `35019d8f076946ac16636c4cda61b1b2d924960ba1e8686f72b5e52ebc6bc88f`를 승인된103에 설치했습니다. 설치 전 진행 작업과 helper 없음 조건을 확인하고 설정4개 checksum을 보존했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다.

제공되는 JS9개에서 새 nginx 트리·PostgreSQL 복원 검토·설정값 오류·Ctrl+C·앱 등록 해제·감사 결과 번역6종을 확인했습니다. source catalog SHA `2eeaedcc9cc7f6270e77db4357a2c0c15fc30fbd37a9d73edfd002ac5495636f`. 이 HTTP 확인은 실제 브라우저 입력/언어 선택 및 전체756개 문구 렌더링을 증명하지 않습니다.

증거 `.runtime/verification/pt-ide-fields-delivery-20261004.json`, `pt-ide-fields-preflight-20261004.json`, `pt-ide-fields-install-result-20261004.json`, `pt-ide-fields-installed-20261004.json`, `pt-ide-fields-served-20261004.json`, `package-2026-10-04T13-06-41.241Z.json`. 전체 목표 PARTIAL이며 아래는 이전 단계 이력입니다.

## 2026-10-04 언어 선택창 번역 상태 안내 현지화·103 반영

언어 선택창의 하드코딩 English UI/Partial UI를 t('영어 UI')/t('부분 번역')로 교체했습니다. 제공되는9개 번역 catalog에 두 문구를 추가했으며 한국어는 원문을 표시합니다. 지원되지 않는 언어의 영어 fallback과 일부 번역 언어의 부분 번역 표시는 유지합니다. 고정 언어 이름/국기/선택 동작은 변경하지 않았습니다.

실제 컴파일된 LanguagePicker를 React 서버 렌더러와 제어된 언어 context로10개 언어에서 렌더링하여 안내 두 문구,324개 언어 항목, 선택1개, 고정 Afar 이름을 확인했습니다. 언어 데이터는 현재 소스에서324개이며 이전 기록의321개로 추정하지 않습니다. 이는 브라우저 저장/키보드/클릭 검증이 아닙니다. 기존 i18n/config17 tests, catalog 검사, production build 및 package --terminal 검증 PASS입니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-picker-labels.deb` SHA `44d5ee327d6d05cbb0499f5faac75e5a63694b347d0875d9ad33c6e52d5c454a`를 승인된103 앱에 설치했습니다. 설치 직전 진행 작업과 root helper 없음을 확인하고 기존 설정4개 checksum을 보존했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401, helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다. 제공되는 JS9개에서 새 포르투갈어 안내2종을 확인했습니다. 포르투갈어486/전체1189 항목으로 미번역703개가 남으며 전체 Linux 언어 번역과 실제 GUI 검증은 미완료입니다.

증거 `.runtime/verification/language-picker-label-render-20261004.json`, `picker-labels-delivery-20261004.json`, `picker-labels-preflight-20261004.json`, `picker-labels-install-result-20261004.json`, `picker-labels-installed-20261004.json`, `picker-labels-served-20261004.json`, `package-2026-10-04T12-58-47.521Z.json`. 전체 목표 PARTIAL이며 아래 기록은 이전 단계 이력입니다.

## 2026-10-04 포르투갈어 IDE·운영·패키지 설정 번역260개 추가·103 반영

파일 비교/저장, 서비스 상태·제어, 로그, 백업/복구 영향 확인, 보안 및 sudo 안내, 감사 기록, nginx 설정, Certbot 발급/약관/갱신, cron, 터미널 안내와 Node/PostgreSQL/MariaDB/Redis 설정의 누락된 포르투갈어260개 항목을 번역했습니다. pt-BR/pt-PT 공통 catalog는224개에서484개로 늘었습니다. 전체1187개 중703개는 여전히 미번역이며 Partial UI 및 영어 fallback을 유지합니다. 다른 Linux locale 전체 번역도 아직 완료되지 않았습니다. 언어 선택창의 English UI/Partial UI 하드코딩도 확인했으며 후속 개선 항목으로 남습니다.

관련 i18n/config 번역17 tests와 i18n:check PASS, production build 및 package --terminal verifier PASS. 새 deb `dist/tastedev-linux_0.1.0_amd64-pt-settings.deb` SHA `60397037b88a99a10a59ad159533557dc839a7d157428ea996fc8f75bbb6d4c1`를 승인된103 앱에 설치했습니다. 설정4개 checksum 보존 및 진행 중 작업 없음 조건을 설치 전에 확인했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구API8건401 및 helper/91runtime/manifest/BUILD_ID 일치를 확인했습니다.

실제103에서 제공되는 login JS9개를 읽고 minifier 문자 이스케이프를 실행 없이 해석해, 새 서비스·복구 영향·보안 정책·약관·cron 시간식·Node 메모리 번역6종 포함을 확인했습니다. source catalog SHA `dfad7c0a48eeced0bb1bb13d617d91ed23641ef6a15b7f884fc17cd8d6389ffd`. 전체484개 항목의 렌더링/지역별 언어 선택 상호작용이나 운영 작업 실행을 증명하는 검사로 확대 해석하지 않습니다.

증거 `.runtime/verification/pt-settings-delivery-20261004.json`, `pt-settings-preflight-20261004.json`, `pt-settings-install-result-20261004.json`, `pt-settings-installed-20261004.json`, `pt-settings-served-20261004.json`, `package-2026-10-04T12-53-51.261Z.json`. 전체 목표 PARTIAL이며 아래 기록은 이전 버전 이력입니다.

## 2026-10-04 포르투갈어 운영 화면 번역 131개 추가·103 반영

계정/비밀번호 변경, 패키지 정보 및 설치 영향 확인, 작업 로그, AI 전송 동의·비용 안내, 파일 편집 안내131개를 포르투갈어로 번역했습니다. 영어 문자열을 복사해 번역 완료로 계산하지 않았습니다. pt-BR/pt-PT 공통 catalog는93개에서224개로 증가했습니다. 파일 이름이 포함된 전체 확인 문장의 {name} 변수도 유지합니다. English fallback 및 Partial UI 표시는 미번역 항목에 유지됩니다. 전체1187개 중963개가 아직 미번역이며 기타 Linux locale 지원도 전부 번역된 상태는 아닙니다.

i18n 지역 선택/변수/fallback9 tests 및 기존 설정 번역8 tests PASS, i18n:check PASS(영어 literal 누락/placeholder 불일치0), production build 및 deb --terminal 검증 PASS. 전체627 회귀는 이전 helper 수정 단계의 기록이며 이번 번역 수정에 대해 재실행한 것으로 주장하지 않습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-pt-operations.deb` SHA `440d241b031019f7195955f4f8d8dd758c7072b0add20e1ad98e96c8000b7467`를 승인된103의 같은 앱에 설치했습니다. 진행 작업 없음/이전 설정 checksum 일치를 재확인했습니다. 설치 후 서비스 active/whitecalvin, login200, 인증 없는 복구 API8건401, helper/91runtime/manifest/BUILD_ID 일치와 보안 설정 보존을 확인했습니다. 최초 HTTP 검사에서는 설치되지 않는 원본 JSON 경로와 minifier의 \xHH 문자 이스케이프를 고려하지 않아 실패했습니다. 원본 JSON 대신 제공된 JS를 읽고 이스케이프 문자를 실행 없이 복원한 뒤 추가 번역4종이 실제 login client assets에 포함됐음을 HTTP로 확인했습니다. 화면 렌더링·언어 선택 상호작용을 증명하는 검사는 아닙니다.

증거 `.runtime/verification/pt-operations-delivery-20261004.json`, `pt-operations-preflight-20261004.json`, `pt-operations-install-result-20261004.json`, `pt-operations-installed-20261004.json`, `pt-operations-served-20261004.json`, `package-2026-10-04T12-44-36.619Z.json`. 전체 목표 PARTIAL입니다. 아래 설치 기록은 이전 버전 이력입니다.

## 2026-10-04 nginx 검수 stderr 로그 수정 및 103 설치 검증

103의 기존 설치본에서 실제 nginx-check는 valid=true인데 logs가 빈 문자열이었습니다. nginx -t의 성공 진단이 stderr로 출력되지만 고정 명령 실행기가 stdout만 반환하던 문제였습니다. helper의 고정 명령 실행을 spawnSync로 변경하여 stdout와 stderr를 합쳐 반환합니다. 두 스트림의 시간순 병합은 아닙니다. 2MiB 출력 제한, 실행 시간 제한, 고정 환경, root supervisor의 잠금 FD3 전달과 native 자식에 대한 FD 격리를 유지합니다. 실패 명령의 진단도 오류에 보존합니다.

전체627 tests PASS, production build PASS, package --terminal verifier PASS. 실제 UID0 격리 native 검증에서 Unicode stdout/stderr 반환과 native FD3 부재, 기존 SIGKILL 잠금·journal 복구 검사가 통과했고 컨테이너 정리를 확인했습니다. 첫 native 실행은 첫 fixture에서 10초 시간 초과로 실패했습니다. 동일 소스와 제한으로 순차 재실행하여 PASS를 확인했으며 최초 실패 원인은 확정하지 않았습니다.

새 deb `dist/tastedev-linux_0.1.0_amd64-helper-stderr.deb` SHA `272497a19ed4e08927c824c4c7b7bd33f89b8c54ce8a6457890e9bbe78f0e37f`를 승인된 103 서버에 설치했습니다. 실행 작업이 없음을 확인하고 같은 앱만 업데이트했습니다. 설치 전후 보안/계정/environment 설정 checksum이 일치합니다. 앱 active, 계정 whitecalvin, Node22.23.3, loginHTTP200, 인증 없는 복구 GET/POST8건401, root helper/91 runtime 모듈/manifest/BUILD_ID 일치를 확인했습니다.

설치된 helper SHA `d09e9f6fecf00e3a56042f29f6176db9abb56fcb413fa61cac6e29887b32bdf4`로 실제 nginx-check를 실행해 valid=true와 검수 로그132바이트 반환을 확인했습니다. 임의 command/path 입력은 거절됐습니다. nginx1.31.6-1~noble 바이너리 SHA `8a27bd4b1960fafff9fa7a47828f1042fd968e3e682772ac0d5a5254e0cb0e30`, 28파일 설정 graph 및 nginx PID/상태는 검사 전후 동일했습니다. 별도 private candidate 검증에서도 원본 승인/오류 directive 거절과 정리를 확인했습니다. 운영 설정 적용·reload·DB 접속은 수행하지 않았습니다.

증거 `.runtime/verification/helper-stderr-delivery-20261004.json`, `helper-stderr-preflight-20261004.json`, `helper-stderr-install-result-20261004.json`, `helper-stderr-installed-20261004.json`, `nginx-installed-helper-check-20261004.json`, `nginx-installed-candidate-20261004.json`, `admin-lock-native-2026-10-04T12-31-55.030Z.json`, `package-2026-10-04T12-37-24.645Z.json`. 실제 인증된 브라우저 검수 팝업과 전체 운영 복구 E2E는 미검증입니다. 전체 목표 PARTIAL이며 아래 기록은 이전 단계 이력입니다.

## 2026-10-04 패키지 IDE 노드 연결 및 PostgreSQL 양방향 편집 103 설치 완료

Certbot/PostgreSQL 선택 노드-코드 연결과 PostgreSQL 파일 기반 GUI/코드 양방향 편집을 포함한 deb SHA `16950ecf50d208c4eabad965fc7114c447f47a7d1ab4433cc5f4b12115c28142`를 승인된 103 서버의 같은 앱에 설치했습니다. source hash 및 전체625 PASS/build/package PASS 기록과 deb checksum을 설치 전에 대조했습니다. Next 서버 외 app child 작업과 root helper가 없음을 설치 직전까지 확인했습니다.

설치 전후 security.json/service-user/10-user.conf/environment checksum이 일치합니다. 앱 active/version0.1.0/Node22.23.3/OS 계정 whitecalvin, loginHTTP200, 기존 readOnly=false/terminal=true를 확인했습니다. root helper와91개 감사 runtime 모듈/manifest/BUILD_ID, 서버·클라이언트 JS/JSON/CSS125개가 검증한 소스·빌드와 일치하고 root 소유권/권한을 확인했습니다. 업데이트 대상 앱 외 운영 서비스·DB를 변경하지 않았습니다.

8792 SSH 터널의 /login200 및 nginx/Certbot/PostgreSQL IDE와 terminal307 로그인 리다이렉트도 확인했습니다. 설치/라우트 확인은 인증된 브라우저 키보드 입력이나 GUI 렌더 증거가 아닙니다. 실제 GUI 양방향 조작과 운영 서비스 복구 E2E는 아직 미검증이므로 전체 목표 PARTIAL입니다.

증거 `.runtime/verification/package-ide-preflight-20261004.json`, `package-ide-install-result-20261004.json`, `package-ide-installed-20261004.json`, `package-ide-installed-bundles-20261004.json`. 아래 미배포 기록은 소스/패키지 검사 단계의 이력입니다.

## 2026-10-04 PostgreSQL 선택 파일의 GUI/코드 양방향 편집 (소스/deb 검증, 미배포)

선택한 postgresql.conf의 지원 설정을 초기 GUI 값으로 표시합니다. 이전 독립 패키지 초안 값이 선택 파일 값을 덮지 않도록 controlled draft를 연결했습니다. GUI 변경은 같은 전체 파일 초안에 patchConfig로 반영하며 주석/include/지원 밖 설정과 줄 순서를 보존합니다. 코드 변경은 지원 필드 값과 순서를 GUI에 반영합니다. 잘못된 GUI 입력은 입력칸에 남기되 코드에는 반영하지 않고 오류를 표시합니다. 코드에서 삭제/해석할 수 없는 지원 항목은 기존 GUI 값을 유지하는 기존 정책을 따릅니다. include의 최종 runtime effective 값이나 모든 PostgreSQL 설정을 지원한다는 뜻은 아닙니다.

기본값 복원도 최종 확인 뒤 같은 파일 코드에 반영합니다. 최초 회귀 검사에서 확인 팝업이 독립 package draft를 초기화하는 경로를 발견하고 동일 callback으로 고쳤습니다. 선택 파일 GUI에서는 전체 코드를 조각으로 교체할 수 있는 standalone config-save/download 버튼을 제외하고 코드 보기로 이동합니다. 전체 초안의 저장·다운로드는 코드 편집기에서 제공합니다. 독립 패키지 화면의 조각 생성 동작은 유지합니다.

관련5 tests PASS, 최종 전체625 PASS, production build PASS. 앞 단계 Certbot/PostgreSQL 노드-코드 연결도 포함한 새 deb SHA `16950ecf50d208c4eabad965fc7114c447f47a7d1ab4433cc5f4b12115c28142`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-package-ide-sync.deb`. package --terminal verifier PASS (`package-2026-10-04T12-11-59.528Z.json`): 현재 빌드/runtime/manifest closure, 로그인·정규 route·격리 터미널 HTTP 및 auth/기능 비활성 게이트를 확인했습니다. GUI callback/render 구조 검사와 package HTTP 검사이며 실제 로그인 브라우저 양방향 입력 또는 운영 DB 적용 검증이 아닙니다.

증거 `.runtime/verification/postgresql-gui-sync-source-package-20261004.json` 및 관련 tests/build/package 로그. 아직103에 새 deb를 설치하지 않았습니다. 운영 설치본은 이전 terminal-account deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 Certbot/PostgreSQL IDE 노드와 코드 연결 수정 (소스 검증, 미배포)

PostgreSQL에서 다른 파일 선택 후 미저장 코드 교체를 확인하는 동안 이전 파일 코드가 새 노드 아래에 표시되던 경로를 수정했습니다. 코드 편집기는 선택한 sourcePath가 일치할 때만 표시합니다. 편집한 코드 유지 선택은 원래 파일/설정 그룹을 복원하며 초안을 그대로 보존합니다. 원래 파일이 최신 트리에서 제거된 경우 선택을 비우고 초안은 보존합니다. 새 선택은 이전 pending 교체를 취소하며 새 초안 저장에는 임시 이전 선택 metadata를 포함하지 않습니다.

Certbot 명령 초안에도 선택 인증서 key를 연결했습니다. 이전 인증서의 명령을 다른 인증서 아래에서 표시하지 않고, 이전 노드 또는 연결의 늦은 preview 응답을 무시합니다. 편집 유지 시 원래 인증서와 갱신 작업으로 돌아옵니다. 기존 key 없는 명령은 재생성하기 전 선택된 인증서의 코드로 추정하지 않습니다.

최종 전체624 tests PASS 및 production build PASS. 증거 `.runtime/verification/package-node-scope-source-20261004.json` 및 final-tests/final-build 로그. 초기 tests/build 후 원래 파일 삭제 보호를 보완했으므로 최종 소스 전체검사/빌드를 별도로 실행했습니다. 컴포넌트 callback/렌더 구조 검사이며 로그인된 브라우저 상호작용 증거가 아닙니다. 이 수정은 아직 새 deb/103에 반영하지 않았으며 설치본은 이전 terminal-account deb입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 실행 계정 수정 deb 103 설치 완료

검증한 terminal-account deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`를 승인된 103 서버의 같은 tastedev-linux 앱에 설치했습니다. 실행 전 MainPID 하위의 Next 서버 외 작업과 root helper가 없음을 확인했습니다. 첫 단순 child 검사는 정상 Next 서버를 작업으로 판단해 설치하지 않았고, 프로세스 관계를 확인한 뒤 수정된 preflight로 재검사했습니다. root 전용 설정 읽기 권한 오류 뒤 내용 대신 sudo sha256sum으로 고정 설정 체크섬만 기록했습니다.

설치 전후 security.json, service-user, 10-user.conf, environment 체크섬이 일치합니다. 앱 active, 설치 버전0.1.0, OS 실행 계정 whitecalvin, Node22.23.3, loginHTTP200, 기존 readOnly=false/terminal=true를 확인했습니다. 기존 계정·보안 설정을 변경하지 않았습니다. root helper 및91개 감사 runtime 모듈, BUILD_ID와 서버/클라이언트 JS·JSON·CSS125개가 현재 검증한 빌드와 정확히 일치하고 root 소유/권한을 확인했습니다.

증거 `.runtime/verification/terminal-account-preflight-20261004.json`, `terminal-account-install-result-20261004.json`, `terminal-account-installed-20261004.json`, `terminal-account-installed-bundles-20261004.json`. 격리 패키지의 로그인 후 실제 PTY HTTP 동작은 직전 단계 PASS입니다. 이번 운영 설치 확인은 인간 계정의 로그인된 브라우저 키 입력 증거가 아닙니다. 전체 목표 PARTIAL이며 운영 서비스 복구 및 실제 GUI 상호작용 확인이 남아 있습니다. 아래 미배포 표시는 이전 소스/패키지 검증 단계의 이력입니다.

## 2026-10-04 터미널 실행 계정 환경 수정 (소스/deb 검증, 새 deb 미배포)

터미널 프로세스의 HOME/USER/LOGNAME을 앱 시작 환경에서 복사하는 대신 OS 실행 계정의 userInfo로 설정했습니다. 설치 계정 이외의 홈과 사용자명이 환경에 남아 있어도 실제 계정으로 셸 설정/CLI 경로를 사용합니다. 작업 폴더 선택, 일반 사용자 실행, 비밀 환경 값 제거 및 기존 프로세스 환경은 유지합니다.

잘못된 launcher 계정 값을 넣은 non-PTY/PTY 회귀 검사 PASS, 전체624 PASS, production build PASS. 새 deb SHA `51800ad6fd47bd02a564cc0ce2b51acae4e90b3976261d38b481803ffad1578a`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-terminal-account.deb`. package verifier --terminal PASS (`package-2026-10-04T11-49-02.164Z.json`): 격리 관리자 로그인 뒤 실제 HTTP PTY 입력/출력/resize/timeout, 계정 환경 및 logout SSE 취소를 확인했습니다.

패키지 검증의 기존 가짜 HOME override CLI fixture는 실제 실행 계정 홈 선택과 충돌하므로 명시적 격리 Bash rcfile 및 유일한 synthetic executable로 수정했습니다. 실제 사용자 startup 파일/AI CLI를 실행하지 않습니다. 기본 CLI preset의 interactive Bash 매핑 검사는 기존 terminal-launch tests에 남아 있습니다. 설치 계정의 실제 Claude/Codex 인증 성공을 주장하지 않습니다.

증거 `.runtime/verification/terminal-account-source-package-20261004.json` 및 관련 tests/build/package 로그. 103 설치본은 이전 통합 복구 deb SHA `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`입니다. 이번 새 deb는 아직 배포하지 않았습니다. 로그인된 브라우저 상호작용/실제 운영 서비스 복구는 미검증이며 전체 목표 PARTIAL입니다.

## 2026-10-04 현재 배포 및 개발 터미널 확인

통합 설정 복구 deb를 103 서버에 설치했습니다. 설치 버전 0.1.0, deb SHA-256 `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`. 설치된 helper, 91개 runtime 모듈, manifest 및 BUILD_ID가 검증한 소스/빌드와 일치합니다. 앱 active, login HTTP 200, 네 복구 API의 미인증 요청 401을 확인했습니다. 기존 보안 파일 SHA를 보존했으며 확인 당시 readOnly=false/terminal=true입니다. 아래의 미배포 기록은 이전 단계의 이력입니다.

실제 설치 root helper의 Redis/nginx/MariaDB 복구 기록 조회가 성공했으며 pending 기록은 없었습니다. 파일 교체, 서비스 재로드/재시작 또는 DB 연결을 실행한 증거는 아닙니다. 증거: `.runtime/verification/config-recovery-installed-20261004.json`, `.runtime/verification/config-recovery-installed-helper-lookup-20261004.json`.

격리 MariaDB 11.4.13 native options-help 후보 검사 PASS: 전체 후보, include 옵션 덮어쓰기 거부, 알 수 없는 옵션 거부 및 복원 후보 검사를 확인했습니다. DB/서비스를 시작하지 않았습니다. 증거: `mariadb-native-2026-10-04T11-36-48.695Z.json`. 로컬 nginx 1.28.3의 proxy/static/TLS/redirect 구문과 잘못된 directive 거부 PASS. 운영 설정/서비스를 변경하지 않았습니다. 증거: `nginx-native-2026-10-04T11-43-07.044Z.json`.

개발 서버 주소는 `http://127.0.0.1:8787/terminal`입니다. 8792는 103으로 전달되는 SSH 터널 주소입니다. 개발 환경의 terminal gate=true, terminal=true, readOnly=false 및 일반 사용자 whitecalvin을 확인했습니다. 실제 PTY에서 Unicode 입력/출력, Ctrl+C, EOF, 크기 변경, 독립 탭 4개와 종료 격리 검사가 PASS입니다. 증거: `terminal-pty-2026-10-04T11-42-02.470Z.json`. 로그인된 브라우저 화면/키 입력을 직접 검증한 것은 아닙니다.

전체 목표는 PARTIAL입니다. 운영 서비스 복구의 실제 적용 및 로그인된 GUI 상호작용 검증은 여전히 남아 있습니다. 기존 보안 정책을 임의로 추가 활성화하지 않았습니다.

## 2026-10-04 MariaDB 중단 작업 복구 및 통합 deb 검증 (패키지 생성, 103 미배포)

MariaDB 패키지 설정에 main/target 선택, 수동 중단 기록 조회, 현재/복원 후보 include 파일 SHA 비교, 서비스 scope 확인 및 최종 재시작 확인을 연결했습니다. 선택된 파일의 백업 원문을 복원하고 다른 include 파일은 현재 내용으로 검토합니다. private journal/backup, graph, PID/start/UID와 시작 main scope를 검토 SHA에 묶고 변경 시 거부합니다. root helper의 기존 MariaDB process snapshot에 bounded stat/status read와 start/계정 재검사를 추가했습니다. 명시적 --defaults-file은 main을 대조하며 default-main-assumed는 기존 경고를 표시합니다; 실제 모든 기본 검색 파일/환경의 영향까지 증명한 것으로 간주하지 않습니다.

MariaDB private candidate tree는 디렉터리 목록, 파일 SHA/owner/mode/nlink/FD·named identity·timestamps를 snapshot하여 native validator 전후 변조를 거부합니다. capability preflight 후 --validate-config 또는 options-help 검사와 내부 my_print_defaults 검사를 사용하고 원본 복원 뒤 고정 mariadb.service restart 및 최종 graph/main/UID를 확인합니다. 재시작 실패나 변경은 journal을 유지합니다. GUI는 final confirmation, duplicate prevention, stale target response 거부, read-only 복구 비활성화를 적용했습니다. GET 로그인/sudo 조회와 POST 로그인/동일 origin/databaseChanges/조회 전용 해제/confirm/review SHA 게이트를 연결했습니다. HTTP에서는 임의 root/target/runner/계정을 허용하지 않습니다.

전체623 tests PASS, 최종 production build PASS, literal English fallback 검사 PASS. 초기 service snapshot fixture가 새 stat/status read를 반영하지 않은 assertion을 추가 검증과 함께 수정했고, main 설정 번역 누락을 보완했습니다. initial-targeted/initial-i18n 로그를 보존했습니다. `.runtime/verification/mariadb-recovery-source-package-20261004.json`에 source identity를 기록했습니다.

actual UID0/root-owned installed-layout helper/closure에서 MariaDB graph 적용 rename 후 SIGKILL 및 별도 검토 복구 PASS (`admin-lock-native-2026-10-04T11-26-01.531Z.json`). native worker 종료까지 kernel lock 유지, filesystem lease 미생성, 원본 byte 복구와 journal 정리를 확인했습니다. process/capability/validation/restart transport는 fixture hooks입니다. 운영 MariaDB 접속·native mysqld validator·실제 systemd 재시작 검증이 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

통합 deb SHA `644a294a76c65c24677cd9e3eebbef5ed0efdc330c1e0b4bb8eb59c77c5e72e0`를 생성하고 `dist/tastedev-linux_0.1.0_amd64-config-recovery.deb`로 보존했습니다. package verification PASS (`package-2026-10-04T11-28-50.827Z.json`): 현재 build/runtime checksum, root helper manifest/import closure, 비밀파일 제외, 계정/loopback/maintainer script 조건 및 격리 localhost 로그인/세션과 네 복구 API의 unauthenticated/disabled-permission 거부를 확인했습니다. 권한을 끈 격리 서버 검사이며 root operational recovery 실행과 browser GUI E2E의 증거가 아닙니다.

103에는 아직 이 deb를 설치하지 않았습니다. 현재 설치본 common lease deb는 유지합니다. 공통 journal의 Node.js/Redis/nginx/MariaDB 사용자 복구 경로는 현재 소스와 새 deb에 연결됐습니다. 설치 장비 적용 확인 및 실제 package native recovery/browser E2E는 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 중단 작업 복구 팝업/API 및 graph kernel lease (소스 검증, 미배포)

nginx 복원 팝업에 지원되는 설정 파일 선택, 수동 중단 기록 조회, 현재/복원 후보 include 파일 SHA 비교, locale 확인, 최종 복구 확인을 연결했습니다. 선택된 파일의 원본 백업을 복원하며 다른 include 파일은 현재 bytes로 검토합니다. 조회 이후 그래프·백업·master PID/start·prefix·관측 locale 변화는 재검토를 요구합니다. 전체 private candidate 검사 후 파일을 복원하고 운영 nginx -t, 고정 nginx.service reload 및 최종 graph/identity 검사를 수행합니다. 검사/재로드 실패나 외부 변경은 journal을 보존합니다. 서비스가 중지되어 실행 identity를 확인할 수 없으면 자동 복구를 거부합니다.

GET은 로그인·sudo 조회 옵션, POST는 로그인·동일 origin·nginxChanges·조회 전용 해제·명시적 confirm·검토 SHA 및 검증된 locale을 요구합니다. payload는 path/confirm/reviewVersion/locale만 허용하며 지원되는 nginx 파일 path 외 임의 경로·계정·hook은 받지 않습니다. locale은 관리자 확인이며 live libc 상태의 직접 증명이 아닙니다. GUI는 duplicate commit 방지, target 변경 후 이전 응답 무시, locale 수정 후 확인 해제, read-only 변경 비활성화, 복구 완료 후 트리 갱신 및 갱신 실패와 실행 결과 구분을 구현했습니다.

nginx graph lock도 공통 operation lease를 사용합니다. 실제 설치 helper kernel FD 확인 뒤 graph 디렉터리를 새로 만들지 않으며 기존 lock 파일/디렉터리는 삭제하지 않습니다. 직접 호출은 기존 cross-process 디렉터리 잠금을 유지합니다.

전체616 tests PASS, production build PASS, literal English fallback 검사 PASS. 증거 `.runtime/verification/nginx-recovery-source-20261004.json` 및 full/build/i18n 로그. initial targeted의 candidate argv index 오기로 발생한 assertion 실패를 올바른 -c 인덱스 검사로 수정했고 로그를 보존했습니다. 초기 full 2개 실패는 기존 toolbar renderer의 새 child stub 누락으로, 기존 assertion을 유지하고 child fixture를 연결해 해결했습니다.

actual UID0/root-owned installed-layout helper/module closure에서 nginx graph apply rename 뒤 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T11-13-51.103Z.json`). native supervisor가 worker 종료까지 커널 잠금을 유지하고 graph/file lease가 남지 않으며, journal을 별도 확인 복구로 원본 bytes와 함께 정리했습니다. service identity와 nginx/systemd command transport는 fixture hooks이므로 실제 nginx -t/reload 또는 운영 nginx 접속 증거가 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

아직 deb 생성/103 배포하지 않았습니다. 현재 common lease 설치본을 유지합니다. MariaDB 복구 경로 및 각 package 실제 native recovery/browser 검증이 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 Redis 중단 작업 복구 GUI/API 및 graph kernel lease (소스 검증, 미배포)

Redis 패키지 설정에 수동 중단 기록 조회, 현재/원본 include 파일 SHA 비교, 최종 재시작 영향 확인 및 복구 버튼을 연결했습니다. 조회는 로그인과 sudo 조회 옵션, 복구 POST는 로그인·동일 origin·databaseChanges·조회 전용 해제·명시적 confirm·검토 SHA를 요구합니다. payload는 confirm/reviewVersion만 허용하며 경로·계정·실행 hook은 HTTP에서 받지 않습니다. GUI는 중복 요청을 막고 연결/정책 변경 뒤 이전 응답을 무시합니다.

복구 controller는 private journal/backup SHA, 현재 main 원본/후보 SHA, 현재/원본 include graph, 실행 서비스 PID/start/UID/고정 main identity를 재검토합니다. 원본 전체 graph 후보를 기존 isolated Redis validator에 전달하고 candidate 변조 및 validation 이후 graph/process 변경을 검사합니다. 원본 복원 뒤 고정 Redis service restart hook을 호출하고 최종 graph·서비스 identity/UID를 확인합니다. 외부 파일/include/process 변경, 후보 변조, 실패한 restart 또는 post-restart account 변경은 기록을 유지합니다. 이미 원본 bytes인 경우도 검토 후 service recovery를 재시도합니다. 실행 Redis process의 원래 main을 확인할 수 없거나 서비스가 중지돼 있다면 자동 복구를 거부합니다; 임의 process argv를 추정하지 않습니다.

Redis graph lock도 공통 operation lease를 사용합니다. 설치 helper의 실제 kernel FD가 확인되면 filesystem graph lease를 만들지 않고 in-process 중복을 막습니다. 기존 lock directory/symlink는 삭제하거나 죽은 작업이라고 추정하지 않습니다. helper context 없는 직접 호출은 기존 cross-process directory lock을 유지합니다.

전체608 tests PASS, production build PASS, literal English fallback 검사 PASS. `.runtime/verification/redis-recovery-source-20261004.json`과 full/build/i18n 로그에 기록했습니다. 초기 2개 실패는 기존 package-config 부모 renderer의 새 child module stub 누락이며 기존 assertion을 유지하고 fixture를 연결해 해결했습니다. initial-regression 로그를 보존했습니다.

actual UID0/root-owned installed-layout helper 및 검증된 module closure에서 Redis graph apply rename 후 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T11-02-38.873Z.json`). native supervisor가 worker 종료까지 kernel lock을 유지하며 graph/file lease가 남지 않고, 중단 journal이 남아 별도 확인 복구로 원본 bytes와 journal 정리를 검증했습니다. fixture service identity/validation/restart hooks를 사용했으므로 native Redis validator/systemd 재시작 또는 운영 Redis 접속 증거가 아닙니다. 기존 pinned image/no pull/network none/host bind 없음/격리 writable layer/cleanup PASS.

아직 deb 생성/103 배포하지 않았습니다. 현재 설치된 common lease deb를 유지합니다. nginx/MariaDB 사용자 복구 경로 및 package native recovery transport/browser 검증은 남아 있으므로 전체 목표 PARTIAL입니다.

## 2026-10-04 Node.js 서비스 중단 작업 복구 GUI/API (소스 검증, 미배포)

등록된 Node.js 앱의 서비스 설정에 중단 기록 조회, 현재/원본 옵션 비교, 최종 확인 후 원본 복구를 추가했습니다. helper는 등록 앱·sudo caller UID·앱 파일 버전·관리 대상 unit·백업 SHA·journal·systemd FragmentPath/User/DropInPaths를 검토하고, 복원 후보를 systemd-analyze로 검사한 뒤 daemon-reload만 수행합니다. 실행 중인 앱을 재시작하지 않습니다. 검토가 만료되거나 외부 수정/다른 drop-in이 발견되면 기존 기록을 보존하고 거부합니다. 복구 실패 시 기록을 유지하여 재검토할 수 있습니다.

GET 조회는 로그인과 sudo 조회 옵션을 요구하며 POST 복구는 로그인, 동일 origin, serviceChanges 권한, 조회 전용 해제, 명시적 confirm 및 검토 SHA를 요구합니다. GUI는 수동 조회, 최종 확인, 중복 실행 방지, 이동/연결 변경 후 응답 무시를 적용했습니다. 조회 전용에서는 조회만 허용합니다. 임의 경로나 계정을 클라이언트에서 지정할 수 없습니다.

전체 600 tests PASS, production build PASS, literal English fallback 검사 PASS. 증거는 `.runtime/verification/node-service-recovery-source-20261004.json` 및 같은 접두사의 full/build/i18n 로그입니다. 부모 GUI 테스트의 새 child-module fixture 누락으로 발생한 초기 2개 실패는 기존 assertion을 유지하고 child stub을 추가해 해결했으며 initial-regression 로그를 보존했습니다. Node 복구 tests의 manager/validation/reload는 fixture hooks이며 실제 systemd 복구나 로그인 browser E2E를 확인한 증거가 아닙니다.

아직 deb 생성/103 배포를 수행하지 않았습니다. 현재 설치된 common lease deb는 유지합니다. nginx/Redis/MariaDB의 공통 pending journal을 사용자가 복구하는 경로와 실제 package transport 검증이 남아 있으므로 전체 목표는 PARTIAL입니다.

## 2026-10-04 공통 설정 write-ahead journal 및 내부 복구 기반 (소스 검증, 미배포)

현재 소스에 `config-journal.ts`와 내부 `recoverConfigTransaction`을 추가했습니다. 전체591 PASS, production build PASS. 최신 source는 아직 deb로 만들거나103에 설치하지 않았습니다. 설치된 앱은 앞 단계 common lease deb SHA `efaf381c5d9643c1504bc0f471290126cf51d5928eba2629c2ec3e6804ed8db8`를 유지합니다. 패키지별 GUI/helper action/API 보안 게이트와 실제 package recovery transport 연결을 완료한 뒤 별도 배포 검증이 필요합니다. 내부 함수가 있다는 이유로 사용자 GUI에서 공통 중단 복구가 제공된다고 주장하지 않습니다.

공통 configTransaction은 후보/원본 SHA, backup UUID, 원본/교체 inode·소유권·권한, 고정 staging leaf를 private immutable journal에 저장하고 fsync 후 rename합니다. transactions directory 생성 뒤 backupRoot도 sync합니다. 원문·secret·명령은 journal에 저장하지 않습니다. pending이면 새 적용을409로 막고, unknown/corrupt/private permission 위반 record는 보존·거부합니다. 같은 inode의 알려진 initialization alias만 정리하며 unknown hardlink는 보존합니다. 정상 activation 또는 확인된 rollback 뒤 journal 정리를 수행하고 정리 오류만으로 새 rollback을 시작하지 않습니다.

원본 bounded read는 short-read loop, FD/이름 identity·mtime/ctime·size·owner/mode/nlink 안정성 및 UTF8/NUL 검사를 거칩니다. validation 후 후보 SHA/inode가 같은지 검사합니다. beforeCommit 이후 journal publication 뒤 live file을 다시 비교합니다. rename 후 directory sync 오류는 replacementOccurred로 표시해 backup ID와 변경 상태/복구 필요를 보고합니다. activation 중 외부 edit나 복구 뒤 원본 byte 불일치는 journal을 보존합니다. 실제 directory sync EIO/power loss를 이 검사에서 주입한 것은 아니며 SIGKILL/기록 보호 범위의 증거입니다.

`recoverConfigTransaction`은 generic HTTP action으로 공개하지 않았습니다. allowlisted file/private backupRoot, 명시적 confirm, 독립적인 beforeRecovery scope/identity 검사·native validate·recover transport callbacks를 모두 요구합니다. 백업 UUID/target/SHA/원문 크기 및 private regular single-link 안정성을 검증하고, draft SHA+staged inode가 일치할 때만 원본을 교체합니다. 이미 원본 byte/ownership/mode이면 다시 덮어쓰지 않고 recovery를 재시도합니다. native validation 및 activation 전 scope를 다시 확인하고, activation 직전 file 변경과 최종 original SHA도 검사합니다. recovery 실패/불명확한 상태는 journal을 유지합니다. 각 package의 original graph/service context와 적용 검토를 올바르게 연결하는 작업은 아직 남아 있습니다.

actual UID0/private container/root-owned installed-layout helper·manifest/runtime에서 ownership adapter 없이 SIGKILL 검사 PASS (`admin-lock-native-2026-10-04T10-35-32.617Z.json`). parent가 공통 설정 rename 이후 native sleep을 실행한 상태에서 실제 SIGKILL: global kernel descriptor는 native 종료까지 보호되고 filesystem lease는 남지 않았으며, private backup/journal이 남아 새 transaction을 거부했습니다. 별도 confirmed recovery와 고정 public port fixture scope/validation/recovery callbacks로 original byte 복원 및 record 제거를 확인했습니다. callbacks는 fixture이며 nginx/Redis/MariaDB/systemd native recovery 또는 운영 DB 접속의 증거가 아닙니다. network none/host bind 없음/기존 pinned image/no pull/private writable layer/cap-drop ALL/private tmpfs/resource limits 및 cleanup PASS.

private fixture tests는 failed recovery retry와 original inode 보존, confirmation/scope 실패, native validation 오류/후보 변조, external edit와 recovery 중 external edit, substituted backup, private permissions/corrupt records/unknown hardlinks/initialization alias 및 invalid UTF8를 확인했습니다. 초기 전체 regression8 실패는 transactions metadata directory를 백업 파일로 센 기존 fixture count 가정이었습니다. 기존 원문/backup 내용/service/rollback 검사를 유지하고 UUID `.json` 백업만 세도록 바꾸었습니다. 새 private metadata0700/성공 뒤 빈 journal directory 조건을 별도 검사했고 최종591 PASS. 초기 결과 `.runtime/verification/common-journal-initial-regression-20261004.log`를 보존했습니다.

전체 목표 PARTIAL. 다음은 package-specific recovery review/GUI/helper/API gate 연결입니다. 이 기반만으로 운영 GUI 복구, 이전 filesystem lease cleanup, full systemd/runuser/native package transport, 로그인된 browser E2E가 완료됐다고 판단하지 않습니다. 소스의 새 graph guard를 사용자-facing recovery 없이 운영 앱에 배포하지 않았습니다.

## 2026-10-04 공통 설정 및 MariaDB graph의 설치 helper kernel lease 반영

최신 deb SHA-256 `efaf381c5d9643c1504bc0f471290126cf51d5928eba2629c2ec3e6804ed8db8`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-common-kernel-lease.deb`. 전체586 PASS, production build PASS, package verifier PASS (`package-2026-10-04T10-23-32.970Z.json`). 기존 설치 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0/Node22.23.3, installed helper/common lease/config transaction/MariaDB/HBA modules/BUILD_ID SHA 일치, loginHTTP200 및 미인증 HBA apply/recovery-status/recover 모두401. 증거 `.runtime/verification/common-kernel-lease-installed-20261004.json`. 운영 DB나 sudo/readOnly 정책을 변경하지 않았고 로그인된 브라우저 조작 증거가 아닙니다.

`config-operation-lease.ts`를 audited root runtime closure에 포함했습니다. 공통 `configTransaction`과 MariaDB graph는 설치 helper의 immutable nonwritable/nonconfigurable internal context, 실제 UID0, 고정 설치 helper path, root600 single-link marker의 FD/이름/dev/ino/marker bytes가 확인될 때만 기존 global kernel lock을 사용합니다. 같은 프로세스 중복 호출은 Set으로 차단하며 새 filesystem lease를 생성하지 않습니다. invalid context는 direct mode로 fallback하지 않습니다. 정상 marker를 unlink하지 않고 기존 native supervisor의 descriptor 보호를 유지합니다.

context 없는 직접 호출은 기존 private directory lease를 계속 생성하여 별도 프로세스의 동시 호출을 거부합니다. 기존 unknown legacy directory/symlink가 있으면 보존·409 거부하며 죽은 작업이라고 추정해 제거하지 않습니다. 이 변경은 설치 helper 작업의 새 per-file/per-graph directory lock 잔류를 없앤 범위입니다. 직접 호출의 파일 lease crash cleanup 또는 공통 transaction의 파일 교체 중 durable journal/byte rollback을 구현한 증거는 아닙니다.

actual UID0/private container/root-owned installed helper·runtime에서 ownership adapter 없이 검사 PASS (`admin-lock-native-2026-10-04T10-19-57.293Z.json`). root parent가 managed lease를 얻고 native sleep을 실행한 뒤 실제 SIGKILL: 디렉터리 lease는 생성되지 않았고 실제 kernel lock은 native supervisor가 명령 종료까지 유지했습니다. 이후 동일 inode로 다음 작업 진입, 같은 프로세스 중복 거부/idempotent release/legacy directory 보존, actual root common transaction의 후보 검수/private backup/주입 activation failure 후 byte rollback과 회복 callback을 확인했습니다. 단순 public port fixture이며 DB/systemd/app service activation을 실행한 증거가 아닙니다. network none/host bind 없음/기존 pinned image/no pull/private writable image layer/cap-drop ALL/private tmpfs/resource limits 및 cleanup PASS. operatingClusterAccess=false/databaseConnections=false/postmasterStarted=false.

direct fixture 및 별도 child의 directory lease 경쟁 차단, legacy symlink 보존, invalid context의 fallback 차단과 invalid relative path 거부 PASS. HBA journal source는 이번 변경에서 그대로 유지했고 앞 절의 실제 native SIGKILL 복구 증거를 역사로 보존합니다.

전체 목표 PARTIAL. 다른 패키지 설정의 durable journal 및 GUI 중단 복구, 이전 legacy lease의 확인 기반 복구, 운영 전송/로그인 GUI E2E 등 기존 완료 감사 항목은 남아 있습니다. 이번 변경은 관리자 잠금 상태 개선을 증명하며 일반적인 운영 설정 자동 복원을 주장하지 않습니다.

## 2026-10-04 PostgreSQL HBA write-ahead journal 및 명시적 중단 복구 반영

최신 최종 deb SHA-256 `cb35952fb6f5bcd3b615542cda900128224df9d18af59ba37518595499ea6f3c`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-hba-journal-final.deb`. 전체 회귀584 PASS, production build PASS, 최종 package verifier PASS (`package-2026-10-04T10-14-10.377Z.json`). 기존 설치 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0/Node22.23.3, helper·native exec·HBA operation/journal/service·BUILD_ID의 installed SHA 일치, login HTTP200, 미인증 HBA apply/recover POST 및 recovery-status GET 모두401. 설치 증거 `.runtime/verification/postgresql-hba-journal-installed-20261004.json`. 운영 DB 연결·HBA 변경·reload·보안 옵션 변경 및 로그인 GUI 조작을 수행한 결과가 아닙니다.

새 root-private immutable journal은 백업 ID·원본/draft SHA·원본/교체 inode/소유권·권한·원본 참조 graph state·실행 서버 identity를 저장하고 파일/directory fsync 후 rename을 허용합니다. 설정 원문은 journal에 저장하지 않습니다. 기록이 있으면 새 검토와 적용은409로 차단합니다. 동일 private inode의 알려진 초기화 hardlink만 정리하며 unknown link/symlink/private permission 위반은 보존/거부합니다. 성공 또는 확인된 rollback 후 기록 정리를 수행하고, 이미 검증된 완료 상태의 journal 정리 오류만으로 journal 없는 추가 rollback을 시작하지 않습니다. 정리 미확인은 별도 boolean/GUI 경고로 보고합니다.

`postgresql-hba-recovery-status` GET은 인증/sudo 옵션을 거치며 record의 target/backup UUID/pending flag만 반환합니다. `postgresql-hba-recover` POST는 인증/origin/확인/databaseChanges/readOnly/sudo/server 게이트와 global kernel lock 및 감사 로그를 거칩니다. 운영 적용 popup은 status를 먼저 조회해 pending이면 새 draft 계획 대신 중단 작업 복구와 최종 확인을 표시합니다. 순서가 바뀐 status+plan에 맞춰 component fixture를 수정한 뒤 기존 확인/중복 클릭/scope/unmount 검사 및 새 recovery confirmation 검사가 통과했습니다. source/diff/native error는 terminal record에서 제외하고 구조화 boolean/backup UUID만 기록합니다.

복구는 기존 작업의 staged inode와 draft SHA가 일치할 때만 원본 native 검수·파일 교체를 수행합니다. 이미 원본 byte/소유권/권한이 일치하면 파일을 다시 덮어쓰지 않고 필요한 reload를 재시도합니다. 파일 교체 전 중단도 서버 identity/고정 read-only running settings 확인 없이 복구 완료로 보고하지 않습니다. 서버 OS identity 변경/원본 include 변경/외부 파일 편집은 거부하며 기록과 백업을 보존합니다. reload 실패와 복구 중 외부 편집도 기록을 남기고, 최종 원본 SHA/reference graph를 다시 확인합니다. 기존 legacy lease는 삭제하지 않습니다.

실제 separate child SIGKILL/private filesystem journal/명시적 byte 복원, service identity 실패 보존, reload 실패 뒤 원본 inode 유지 재시도, 초기화 alias 및 unknown hardlink 보존, private permission/불명확한 record 거부, 교체 전 중단의 service 확인, 복구 도중 외부 편집 보존, 완료 이후 cleanup 실패로 추가 역변경하지 않는 조건을 fixture로 확인했습니다. 이 fixture service/reload hook은 운영 systemd가 아닙니다.

최종 actual PostgreSQL16.15 native fixture PASS (`postgresql-hba-operation-native-2026-10-04T10-12-21.617Z.json`). 기존 native 검수/실제 적용·인증·backup restore·실패 rollback 외에 실제 reload로 새 fixture role 연결이 허용된 뒤 child를 SIGKILL하고, pending record로 명시적 원본 복원·native 검수·실제 reload 후 새 연결이 다시 거부되는 조건까지 통과했습니다. 같은 postmaster PID/start 유지, 기존 pinned image/network none/host binds 없음/read-only image/non-root uid999/cap-drop ALL/private tmpfs/제한된 자원 및 cleanup PASS. 실제 /proc/native binary/pidfile/socket/고정 SQL 검사는 production code이며 systemd/runuser 전송은 pg_ctl 및 동일 PG 계정 fixture adapter입니다. `reloadAcceptanceVerified=false` 유지. Unix socket 사용, TCP listener 없음. Root supervisor UID0 native 증거는 이전 잠금 단계의 것이며 이번 journal/실제 systemd/runuser E2E 증거로 확장하지 않습니다.

확장 native fixture 첫 실행은 reload 후 자식에 active handle이 없어 SIGKILL 전에 스스로 종료해 signal=null로 실패했습니다. 실제 child를 유지하도록 fixture interval handle을 추가한 뒤 검사한 signal=SIGKILL과 재인증 결과가 통과했습니다. 초기 실패는 `.runtime/verification/hba-journal-crash-native-initial-failure-20261004.log`에 보존했습니다. 중간 journal deb SHA `584c86a5d3cadcaf67f4425b7f05de5873c72c28c38ed17a0f148cbfeff25655`는 보존/업로드했지만 설치하지 않았으며, 최종 배포는 위 cb3595 deb입니다.

전체 목표 PARTIAL. HBA의 확인 기반 중단 복구 경로는 추가됐지만 운영 장비의 실제 강제 종료·root/systemd/runuser 전체 전송·로그인된 GUI E2E, 다른 패키지의 이전 filesystem lease와 중단 복구, 그 밖의 기존 제품 완료 감사 항목은 남아 있습니다. 앱 시작/조회만으로 운영 복원을 자동 실행하지 않습니다. 아래 기록은 이전 단계 역사이며 최신 HBA journal/배포 증거는 이 절입니다.

## 2026-10-04 최종 관리자 잠금 개선 패키지 반영

최종 전체 회귀 574 PASS, production build PASS, deb verifier PASS (`package-2026-10-04T09-51-01.035Z.json`). 최종 deb SHA-256 `aff9d8185e0e22d551982e546dc2fff401533461ab81cf5bfe097e645f6cb825`, 보존 파일 `dist/tastedev-linux_0.1.0_amd64-admin-native-lock.deb`. 기존 설치 승인 대상 103의 동일 앱 업데이트 완료: version0.1.0/app active/Node22.23.3, installed helper·native exec runtime·HBA controller·BUILD_ID SHA가 검증한 source/build와 일치합니다. login HTTP200, 미인증 HBA operation POST401. 증거 `.runtime/verification/admin-native-lock-installed-20261004.json`. 운영 DB 연결·설정 적용·reload·보안 옵션 변경 또는 로그인된 브라우저 조작을 수행한 증거가 아닙니다.

최종 실제 root private fixture 잠금/SIGKILL/native supervisor 검증 PASS (`admin-lock-native-2026-10-04T09-42-21.281Z.json`). 최종 비root disposable PostgreSQL 실제 HBA 적용·새 인증·복원·reload 후 실패 rollback 검증도 PASS (`postgresql-hba-operation-native-2026-10-04T09-45-11.054Z.json`). 병렬 검사 중 한 차례 native command failure가 있었고 원인은 확정하지 못했습니다. 당시 로그 `/tmp/tastedev-admin-native-lock-hba-native.log`를 보존했습니다. 공개 fixture만 사용하는 진단에 실패 phase/제한된 fixture stderr를 추가한 뒤 한 차례 재실행이 통과했으며, 이 결과로 실패 원인을 설명하거나 운영 성공을 주장하지 않습니다. 아래 571 PASS/08:57 evidence 및 이전 deb 기록은 중간 단계의 역사이며 최신 최종 결과는 이 절입니다.

전체 목표 PARTIAL. 이번 반영은 helper 강제 종료 후 실행 중 native 명령과의 잠금 유지 및 종료 후 다음 작업 진입 개선입니다. 파일 교체 중 강제 종료의 durable transaction journal/자동 rollback, 기존 package별 lease 검토와 실제 로그인 GUI 검증은 남아 있습니다.

## 2026-10-04 관리자 작업 강제 종료 후 잠금 해제 및 HBA lease 개선

관리 명령 자체가 남아 있는 경우의 supervisor 보호도 추가했습니다. `admin-native-exec.ts`는 installed helper가 만든 immutable internal context에서만 root FD를 사용합니다. audited runtime의 execFile/execFileSync 및 helper의 sync 명령을 같은 설치 helper의 private supervisor entry로 실행합니다. supervisor는 canonical root600 marker와 FD3의 inode를 확인하고 root FD를 native 프로그램에 넘기지 않습니다. native command가 실제 종료할 때까지 보유하며 SIGTERM/INT·wall deadline은 native process group 종료 후 해제합니다. helper SIGKILL 직후 자식 명령이 실행 중이면 다음 작업이 거부됩니다. 임시 namespace/isolated validation의 직접 spawn PID 의미는 바꾸지 않았고, 이 부분의 SIGKILL cleanup을 이 검사로 증명하지 않습니다.

local actual SIGKILL/supervisor/output/UTF8/maxBuffer/timeout/no-root-FD-to-native 검사 PASS. 런타임 배열에 신규 모듈을 추가하는 초기 편집이 실패해 closure checks가 실패했으며, 정확한 배열 등록 후 통과했습니다. 중간 no-supervisor deb는 `dist/tastedev-linux_0.1.0_amd64-kernel-lock-initial.deb`로 보존했고 배포하지 않았습니다.

actual UID0/private disposable Docker image에서도 ownership adapter 없이 설치 구조의 manifest/helper/source lookup·같은 inode 경쟁·SIGKILL 뒤 native 명령 종료까지 대기·sync/async Unicode·timeout·FD 비노출 PASS. root fixture의 첫 두 실패는 PG-owned 기존 /etc/postgresql parent 접근과 잘못 둔 fixture manifest 위치였습니다. fixture 전용 root-private tmpfs와 실제 runtime/manifest.json 위치로 수정했고 production trust를 완화하지 않았습니다. root fixture는 Node를 컨테이너의 private writable layer에만 복사하며 network none/host binds 없음/cap-drop ALL/no-new-privileges/pids96/memory768MiB/cpu1을 사용했습니다. DB/postmaster/operating service 실행 없음. evidence `admin-lock-native-2026-10-04T09-42-21.281Z.json`, binary/helper/runtime/snapshot SHA와 cleanup PASS를 기록했습니다.

최종 전체574 PASS. 실제 root supervisor 증거는 생성한 HBA fixture를 읽는 동작과 고정 sleep/printf/readlink에 대한 증거이며 운영 서비스 중단이나 실제 DB 복구 증거가 아닙니다. 설정 교체 이후 강제 종료의 자동 journal rollback 및 이전 package lease 검토는 여전히 미완료입니다.

전체 회귀571 PASS, production build PASS, 변경된 HBA controller의 actual disposable PostgreSQL 적용·인증·복원·rollback 검증 PASS (`postgresql-hba-operation-native-2026-10-04T08-57-54.977Z.json`). Unix socket은 fixture에서 사용했으며 운영 DB 연결·systemd/runuser transport E2E 증거는 아닙니다. 103의 flock은 root-owned755 regular file이며 업데이트 전 legacy operation.lock은 존재하지 않았습니다. 이 preflight로 이후의 부재를 보장하지 않습니다.

root helper의 empty `operation.lock` 생성/삭제 방식을 고정 inode의 `flock` 방식으로 교체했습니다. 완전한 marker를 private exclusive 임시 파일에 쓰고 fsync한 뒤 atomic hardlink로 초기화합니다. 정상 종료 시 marker inode를 삭제하지 않으며, fd 3로 전달한 동일 open file description에 `/usr/bin/flock --exclusive --nonblock --conflict-exit-code 75`를 적용합니다. helper가 부모 FD를 보유하는 동안 다른 helper는 거부되고 descriptor close 또는 SIGKILL 때 커널 잠금이 해제됩니다. `/usr`·`/usr/bin` 및 flock executable의 root ownership/regular/no-link/nonwritable/executable 상태를 검사하고 실행 전후 binary inode/metadata와 lock inode를 확인합니다. 기존 deb Depends의 util-linux를 사용합니다.

marker/root600/regular/no-follow/same inode 검사를 유지하고, 초기화 중 죽어 남은 단 하나의 `.operation-lock-init-UUID` hardlink만 root-private directory에서 same-inode로 확인 후 정리합니다. legacy empty lock, 불명확한 marker, 다른 hardlink, symlink나 비신뢰 executable은 거부하고 보존합니다. 이전 empty lock을 죽은 작업이라고 추정해 자동 삭제하지 않습니다. 새 marker가 존재하면 이전 helper의 wx lock 생성도 실패하므로 새 helper와 legacy helper가 서로 다른 inode를 잠그도록 만들지 않습니다. root 운영자가 활성 lock inode를 수동 unlink하면 이 보장은 깨지므로 정상 marker는 삭제하지 않아야 합니다.

HBA controller는 installed helper의 global kernel lock을 사용하고 same-process Set으로 직접 중복 호출도 거부합니다. 새 작업에서 target 디렉터리의 `.tastedev-hba-lock`을 만들지 않아 SIGKILL 뒤 새 directory lease를 남기지 않습니다. 이전 lease가 존재하면 해당 작업의 파일 교체 여부를 추정하지 않고 보존하며 검토 필요409로 거부합니다. 이 변경은 외부에서 helper를 거치지 않는 별도 root 프로그램과의 전역 조정을 보장하지 않습니다.

실제 임시 파일과 `/usr/bin/flock`을 사용한 경쟁 차단·FD close 후 재실행·동일 inode 유지·별도 child SIGKILL 후 재실행 PASS. 테스트 전용 ownership adapter는 DEV 장비의 nobody 소유 flock을 root-owned로 모사하지만 실행 중인 kernel flock은 실제입니다. production ownership 검사 완화 없음. legacy/symlink/unknown hardlink 보존, 초기화 alias 정리, unsafe executable 거부 및 HBA same-process 경쟁/legacy lease 보존 PASS. 관련14 PASS, syntax/i18n key 검사 PASS.

전체 목표 PARTIAL. 이는 잠금 해제와 다음 작업의 진입 개선입니다. 강제 종료 시 교체된 DB 설정의 자동 복원/transaction journal recovery를 구현했다고 주장하지 않습니다. MariaDB/Redis/config transaction/Node service의 기존 per-operation filesystem lease도 별도 recovery 검토가 필요합니다. 운영 DB/서비스·readOnly/sudo policy 변경 없음.

## 2026-10-04 HBA 실제 적용·reload·인증·실패 복원 native 검증 및 터미널 출력 연결

최신 배포 deb SHA `6fe3cddd6c47820e4b871ccdad8e9ca20f54e9fc7354dd29a697519b432c3a77`. package verifier PASS (`package-2026-10-04T08-42-36.204Z.json`), 기존 승인 대상103의 동일 앱 업데이트 완료: app active/version0.1.0, BUILD_ID 및 변경된 client chunk SHA 일치, login·client assetHTTP200, 미인증 applyPOST401. 설치 evidence `.runtime/verification/postgresql-hba-terminal-output-installed-20261004.json`. 운영 DB 작업/보안 옵션 변경 및 로그인된 GUI 조작 증거 없음. 변경은 작업 결과 terminal integration이며 새 native verifier는 개발 전용 도구입니다.

새 개발 명령 `npm run verify:postgresql:hba:operation`은 local Docker Desktop의 기존 pinned PostgreSQL16.15 image `sha256:1a6ab3f5345eb6dbe04a1349529caabdb0ab09293a09590fad07b2246bfa4b54`에서 일회용 클러스터를 실행합니다. network none/host bind 없음/read-only image/non-root uid999/cap-drop ALL/no-new-privileges/private tmpfs/pids96/memory768MiB/cpu1을 사용합니다. Node binary와 reviewed runtime modules는 bounded stdin tar로 전달합니다. PostgreSQL binary SHA `ea528a9f858bce5eef557522820c945a3d3b9fd260a15d6d0313d6350574229d`, image digest·Node SHA 및 cleanup을 evidence에 기록합니다.

production /proc owner/exe/argv/start, postmaster.pid, directory/socket identity, root binary trust, fixed read-only running-server SQL inspection 및 reload 전후 OS identity 검사를 실행했습니다. systemd transport는 fixture가 actual pg_ctl로 연결하고 runuser transport는 같은 postgres 계정의 native 실행으로 대체합니다. 검증 fixture DB 연결이며 운영 DB/서비스에는 접근하지 않습니다. 최초 Docker 기본 DB 상위 폴더의 공개 쓰기 권한 때문에 경로 검사가 거부됐고, private tmpfs로 fixture만 수정한 뒤 통과했습니다. production 검사 완화 없음; 실패 로그를 보존합니다.

실제 native 후보 검수 후 reviewed HBA 교체·reload가 거부되던 fixture role의 새 연결을 허용, backup restore·reload가 다시 거부, 첫 실제 reload 직후 실패 주입 시 원본 byte 복원과 두 번째 실제 reload가 거부 상태를 복구했습니다. postmaster PID/start 유지와 소유권·권한 유지, invalid native draft가 원본을 변경하지 않는 조건을 확인했습니다. 최종 fresh fixture 접속 실패가 실제 pg_hba.conf rejection인 경우만 인정하는 검사도 PASS. evidence `.runtime/verification/postgresql-hba-operation-native-2026-10-04T08-40-44.364Z.json`, container cleanup PASS. 이는 비동기 규칙 적용의 fixture 인증 증거이며 운영 API의 load acceptance proof나 실제 systemd/runuser E2E는 아닙니다. `reloadAcceptanceVerified=false`를 유지합니다.

HBA operation 응답은 공통 operationTerminalReport를 통해 터미널 작업 출력 탭에 연결했습니다. 고정 boolean 결과와 유효 backup UUID만 기록하며 source/diff/비밀번호 옵션/raw native error/reason은 제외합니다. 결과는 입력 가능한 shell로 취급하지 않고 reload/복구/실패를 구분합니다. native runner는 개발 도구이며 웹 API에 노출하거나 운영 앱 DB를 자동 기동하지 않습니다.

전체 회귀 566 PASS 및 production build PASS. 검증 환경의 Unix socket listener는 사용했고 networkListeners=false는 TCP listener를 제공하지 않았다는 범위입니다.

전체 목표 PARTIAL. native 적용·인증·복원 fixture 증거는 확보했으나 운영 DB E2E와 로그인된 GUI interaction, 강제 종료 recovery 등 기존 미완료 범위는 남아 있습니다. 원격 readOnly/sudo 옵션 변경 없음.

## 2026-10-04 PostgreSQL HBA 운영 적용·복원 연결 (fixture 검증)

이번 단계의 deb SHA `548e757bfec07d0b7c84b8c8ac971390d91c91d18e3eaf94fd24b7702be589ff`, deb 인증/PTY/helper closure 검증 PASS. 기존 승인 대상103의 동일 앱 재설치 완료, app service active/실행 계정 whitecalvin, helper와 두 신규 runtime 및 BUILD_ID SHA 일치, loginHTTP200/미인증 plan·applyPOST401. 설치 버전0.1.0. evidence `.runtime/verification/postgresql-hba-operation-installed-20261004.json`. 운영 DB 연결·HBA 변경·DB reload 및 readOnly/sudo policy 변경 없음. 새 기능의 운영 실행 증거로 이 설치 확인을 해석하지 않습니다.

HBA 노드 헤더의 적용 검토와 백업 목록의 운영 복원 검토를 연결했습니다. 검토 popup은 선택 순간의 코드/sourceVersion 또는 backupId를 고정하여 native 후보 검수, live cluster identity 확인, before/after 차이를 조회합니다. 최종 확인과 synchronous execution lock으로 중복 실행을 차단하고, popup/scope 변경·unmount 뒤 응답은 반영하지 않습니다. 운영 적용 성공은 sourceVersion만 갱신하며 workspace 저장 baseline을 임의로 승인하지 않습니다. 백업 복원 이후 최신 source를 읽되 기존 미저장 코드 교체 확인을 유지합니다.

`postgresql-hba-service.mjs`는 root-trusted PostgreSQL/psql binary, systemd unit/MainPID, /proc owner/start/argv/exe, postmaster.pid 및 postgres-owned Unix socket을 확인합니다. 운영 검토는 선택한 실행 클러스터에 fixed read-only metadata SQL만 보내 actual data_directory/config_file/hba_file/port/version/start를 비교합니다. `postgres -C`는 실행 서버 상태 증거로 사용하지 않습니다. password/passfile/service 설정을 받지 않고 TCP endpoint도 받지 않습니다. reload는 원래 OS process identity를 확인한 후 고정 unit에 요청합니다. 이는 이전 HBA가 새 관리 인증을 차단해도 rollback 신호 경로를 유지하기 위한 분리입니다.

`postgresql-hba-operation.mjs`는 source SHA/inode/uid/gid/mode, native 검수 graph, service identity, draft SHA 또는 backupId를 review hash에 결합합니다. commit은 확인과 재검토를 요구하고, private backup 후 같은 디렉터리의 exclusive 임시 파일에서 소유권/권한을 보존해 fsync/rename합니다. reload 또는 후속 확인 실패 시 자기 교체 파일의 SHA와 identity가 일치할 때만 원본을 복원합니다. 외부 변경은 보존하며 참조 파일이 변경되거나 복구 검수가 실패하면 수동 복구 필요 상태를 반환합니다. 프로세스 강제 종료·전원 손실의 자동 transaction recovery는 아직 구현하지 않았고, 검사와 rename 사이 비협조 외부 writer의 경쟁을 원천 차단했다고 주장하지 않습니다.

API/helper whitelist, strict payload, 1.6MB escaped JSON input bound, 4MiB review response bound, manifest closure, login/origin/readOnly/databaseChanges/admin/sudo 게이트와 내용 없는 action 감사 기록을 연결했습니다. 계획 120초/적용 300초 helper timeout입니다. 새 UI literal 영어 fallback과 i18n key 검사 PASS. 모든 언어의 완전 번역 증거는 아닙니다.

전체 회귀 565 PASS 및 IDE parent 관련 2 PASS, production build PASS. 주요 fixture는 파일 소유권/권한·private backup·undo backup, 변경 이후 review 만료, PID 교체, include 변경, reload 실패의 원본 복원 및 서비스 복구 실패 구분, 외부 edit 보존, GUI 최종 확인/중복 클릭/권한 차단/stale 응답입니다. 결과의 reloadAcceptanceVerified=false는 의도적입니다. 새 관리 연결 성공과 reload 요청만으로 PostgreSQL의 비동기 HBA 규칙 load 성공을 보증하지 않습니다.

전체 목표 PARTIAL. 이번 신규 actual live-cluster SQL inspection 및 운영 HBA apply/restore/reload는 fixture로 검증했고 운영 DB에 실행하지 않았습니다. 운영 규칙 load acceptance, 강제 종료 복구, custom/shared include layout 및 이전 미완료 범위는 남아 있습니다. 원격 readOnly 질문은 미응답 상태를 유지합니다. 이후 아래 기록들은 이전 배포 시점의 증거입니다.

## 2026-10-04 PostgreSQL HBA 격리 native 검수와 웹 버튼 연결 완료

HBA 노드를 선택하면 PostgreSQL IDE 헤더에 검수 아이콘이 표시됩니다. 현재 code draft와 조회 sourceVersion을 전송하며 metadata의 이전 version fallback도 유지합니다. 별도 popup에 검수 성공/실패와 original path:line/category를 표시합니다. popup ticket/scope guards를 유지하고 검수 창에서 관련 없는 백업/복원 동작은 제외합니다. root helper action/label/manifest closure/API whitelist와 body bounds, login/origin/databaseChanges/readOnly/admin/sudo 게이트 및 requested/completed/invalid/failed 감사 기록을 연결했습니다. root helper timeout은 이 action에서 120초입니다. API JSON body/helper stdin은 escaped 256KiB draft를 지원하도록 최대1600000 bytes, source text는256KiB로 제한합니다.

`postgresql-hba-validate.mjs`는 path/version/text 외 필드를 거부하고 registered source graph의 live SHA와 draft SHA를 구분합니다. incomplete include/@ graph는 snapshot 진단으로 반환하고 native 실행하지 않습니다. native 검사 종료 후 원본 source/include/membership graph를 다시 조회하여 검사 중 변화를409로 거부합니다. `postgresql-hba-sandbox.mjs`는 root-owned 설치 helper에서만 실행되며 root-owned regular executable/parent 및 binary SHA를 전후 확인합니다. /usr read-only, private /etc(passwd/group)/proc/dev/tmp와 root-owned disposable cluster만 mount하고 uid/gid65534, unshare-all/userns, cap-drop ALL/disable-userns를 사용합니다. initdb와 fixed SQL의 postgres --single backend만 실행하고 TCP/Unix listeners/operating data/config mounts를 제공하지 않습니다. stdout/stderr bounds와 단계별 wall deadline, configured prlimit AS/CPU/file/nofile/nproc/core 제한 및 process termination/cleanup을 적용합니다. resourceLimitsConfigured=true이지만 root host uid의 nproc 효과까지 검증했다고 주장하지 않아 resourceLimitsVerified=false입니다. 운영 인증 시도/SSL/GSS/역할 등의 의미는 검증하지 않습니다.

최초 actual helper 검사는 COPY report file의 mode0644를 private-only mode로 엄격히 검사하면서 실패했습니다. umask0077만으로 해결되지 않았고 native report 단계/uid0/mode644로 실제 원인을 확인했습니다. 최종 reader는 private root-owned700 parent와 no-follow regular/single-link/root-owner/nonwritable/bounded descriptor identity를 먼저 검증한 뒤 그 임시 report FD만600으로 제한해 읽습니다. parent/file identity를 재검사하고 group-writable/public-parent/symlink fixture를 거부합니다. 운영 원본 파일 권한 검사는 완화하지 않았습니다. 중간 deb 검사는 생성 완료 전 실행해 incomplete archive를 읽었던 순서 오류도 있었고, 완료 handle 확인 뒤 최종 재검증은 통과했습니다. 초기 실패 로그/이전 deb는 보존합니다.

PostgreSQL15에서는 pg_hba_file_rules에 file_name/rule_number가 없어 고정 candidate path와 line_number SQL을 사용합니다.16+에서는 native file_name/rule_number를 original source mapping으로 변환합니다. 후보 파일은 include_dir duplicate aliases까지최대256개 매핑합니다. 기준 https://www.postgresql.org/docs/15/view-pg-hba-file-rules.html . 기존 HBA literal 영어 fallback 누락20개와 새 검수 문구9개 catalog를 추가했습니다. i18n literal key check PASS이며 모든 Linux 언어의 전체 번역 PASS를 주장하지 않습니다.

최종 전체554 PASS, 관련 request/namespace/report permission/closure10 PASS 및 GUI popup2 PASS, production build PASS, deb authentication/PTY/helper closure 검사 PASS. 최신 deb `72d9ba3170b429140208472e210ada94b5fc4101df6d636b9b18db833a7f528e`, package evidence `.runtime/verification/package-2026-10-04T07-48-45.329Z.json`. 기존 설치 승인 대상103의 같은 앱만 별도 deb로 재설치했고 installed helper/runtime/BUILD_ID source identity 일치를 확인했습니다. 앱 loginHTTP200, unauthenticated HBA POST401.

실제 설치 helper에서 PostgreSQL15/16/17/18 각각 private generated single-user cluster의 정상2-rule draft와 invalid CIDR line1/original path 진단 PASS. uid/gid65534 검사 PASS. 원본 HBA SHA 전후 일치, operating cluster MainPID/ActiveState/SubState 유지, 임시 cluster directory cleanup PASS. 운영 DB 접속/operating PostgreSQL service restart/HBA 적용/sudo policy/readOnly 변경 없음. evidence `.runtime/verification/postgresql-hba-installed-20261004T075032Z.json`; 실행 후 설치 package0.1.0 및 binaries SHA metadata는 `.runtime/verification/postgresql-hba-installed-metadata-20261004.json`로 별도 기록했습니다. 이 metadata를 실행 순간의 binary snapshot으로 추정하지 않습니다. 실제 실행 중 runner는 binary identity/hash 전후 비교를 수행했습니다. 재현에 사용한 local SSH verifier는 `.runtime/verification/postgresql-hba-installed-check.py`에 보존하며 배포에 포함하지 않습니다.

전체 목표 PARTIAL. 웹 positive operation은 React fixture/API denial와 실제 설치 helper evidence를 결합한 상태이며 로그인된 browser 검수 interaction proof는 없습니다. 원격 readOnly 해제 질문은 미응답이므로 권한을 자율 변경하지 않았습니다. HBA operating apply/restore/reload/rollback과 external shared include 등록, 다른 기존 요구의 미완료 항목은 여전히 남았습니다. 다음은 검수된 HBA 초안을 운영 파일에 적용/복원하는 version-bound review/backup/reload/rollback 경로입니다.

## 2026-10-04 개발 터미널의 서버 재시작 복구

현재 개발 서버는 http://127.0.0.1:8787 에서 실행되고 login HTTP200을 확인했습니다. 8792는 이전 SSH tunnel로 103 서버 앱에 연결된 주소이며 로컬 개발 앱 주소와 다릅니다. 개발 보안 설정의 readOnly=false/terminal=true는 기존 사용자 승인 상태를 유지했습니다. 원격 readOnly 및 sudo 설정은 변경하지 않았습니다.

terminal-context가 정상 응답했을 때만 사라진 저장 셸을 종료 상태로 표시하고, 기존 출력/명령 기록을 유지하면서 빈 새 탭을 생성합니다. 네 탭 제한을 지키며 살아 있는 셸은 재연결하고 중복 실행하지 않습니다. 이전 CLI/명령을 재실행하지 않고 현재 터미널 설정의 새 셸만 실행합니다. 첫 번째 탭이 종료된 경우에도 빈 탭을 찾아 선택하고 시작합니다. 권한/연결이 준비되지 않으면 새 터미널 버튼도 비활성화하며 클릭 handler에서 다시 검사합니다. settings/history 조회만으로 종료된 명령을 다시 열지 않습니다.

관련 Node/React 검사 10 PASS, Next.js production build PASS. 개발 terminal 경로 HTTP307 → /login?next=%2Fterminal로 인증 보호 유지. 실제 로컬 임시 PTY에서 네 탭 독립 입력·출력, 한글/emoji 붙여넣기, 화면 크기, Ctrl+C, EOF, 제한 시간 검사 PASS: `.runtime/verification/terminal-pty-2026-10-04T07-26-41.762Z.json`. 이 증거는 실제 PTY backend 및 React fixture의 증거이며 로그인된 브라우저 조작 증거는 아닙니다. 전체 목표 PARTIAL이며 다른 패키지 native HBA runner/운영 적용 등 미완료 범위는 이전 기록대로 유지합니다. 이번 변경은 개발 소스에 반영됐고 원격 deb 재설치는 수행하지 않았습니다.

## 2026-10-04 HBA include/@ graph 및 검수 snapshot 구현

`postgresql-hba-links.mjs`는 PostgreSQL 소스의 토큰 규칙을 참고하여 physical continuation을 quote/comment보다 먼저 합치고 원본 token offset/line을 유지합니다. quoted @literal과 unquoted @"file", comma field, doubled quote, comment continuation을 구분합니다. `postgresql-hba-graph.mjs`는 현재 cluster 디렉터리 안에서 include/include_if_exists/include_dir 및 모든 field의 @ 목록을 재귀적으로 수집합니다. @ expansion으로 만들어진 include directive/target도 해석합니다. private source Map과 public path/version/edge metadata는 구분하며 DB/user/options 원문은 graph에 포함하지 않습니다.

root/postgres 소유와 nonwritable parent/file, no symlink/hardlink, bounded FD read, UTF8/NUL, file identity/hash before/after를 검사합니다. cluster 밖의 경로는 읽지 않습니다. file128/total1MiB/depth16/visit300/token10000/directory1000 제한을 넘으면 incomplete입니다. include_dir의 UTF8 byte C filename ordering, optional absence와 directory membership, draft version과 live sourceVersion을 graph hash에 반영하며 끝에 전부 재검사하여 mixed snapshot을 거부합니다. inode/content/membership 변경을 조용히 승인하지 않습니다.

`postgresql-hba-candidate.mjs`는 registered complete graph identity와 정확한 source bytes만 받아 private ASCII aliases로 복사합니다. include/@ absolute references와 expanded include lines를 복사본 안으로 바꾸고 continuation/physical newline 개수를 보존합니다. include_dir는 원래 순서대로 번호 파일을 별도 directory에 배치합니다. optional missing target은 실제 파일을 만들지 않습니다. root700/file600/no-follow/exclusive writes와 fsync를 사용합니다. public source mapping은 한글/공백 파일명도 지원하고 raw config는 포함하지 않습니다. rewritten file1MiB/candidate4MiB 상한을 유지합니다.

실제 postgres16.15 pinned Docker Desktop image, network none/host mount none/private tmpfs/non-root postgres uid999에서 snapshot native 검수 PASS: absolute include, continued nested @lists, C include order, original line7 CIDR error, original fixture byte preservation, @file expansion으로 생긴 include, 한글·공백 파일의 original path/line2 error. Native evidence `.runtime/verification/postgresql-hba-native-2026-10-04T07-14-04.465Z.json`. 진단 runner의 private tree 전송 한도는 이번 fixture만 maxFile1MiB/tar8MiB로 명시하고 기존 caller 기본값을 유지했습니다. 첫 unit run은 fixture parent를 default writable mode로 만들었던 문제와 offset assertion 값 오류를 고친 뒤 통과했습니다. unsafe source 정책은 완화하지 않았습니다. 전체 549 PASS, syntax PASS.

103번 서버에서 DB나 파일을 실행/작성하지 않는 fixed `/usr/bin/id -u` namespace probe만 추가했습니다. bwrap unshare-all/unshare-user, disable/assert-userns, cap-drop ALL, /usr readonly, private /proc/dev/tmp와 custom uid/gid65534가 실제 uid65534로 실행됐습니다. evidence `.runtime/verification/postgresql-hba-namespace-20261004.json`. namespace가 가능하다는 proof이며 PostgreSQL root runner/성능·resource limits·operating apply proof는 아닙니다. 원격 sudo 설정/운영 파일/서비스는 변경하지 않았습니다.

전체 목표 PARTIAL. 아직 root helper namespace runner, 웹 검수 버튼과 reviewed 운영 적용/복원·rollback에 연결하지 않았습니다. cluster 외부 shared HBA 경로는 explicit safe registration이 필요하며 현재 검사로 전체 임의 운영 layout을 지원한다고 주장하지 않습니다. 현재 원격 앱은 이전 HBA backup deb SHA `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`를 유지합니다. 이번 source foundation 작업을 앱에 배포됐다고 주장하지 않습니다. 기준 https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/libpq/hba.c . 다음은 private namespace에서 generated passwd/config와 root-owned ephemeral runtime만 사용하는 native runner를 실제검증하고 앱에 연결하는 단계입니다.

## 2026-10-04 PostgreSQL HBA 실제 native single-user 검수 경로 확인

`postgresql-hba-validation.ts`에 private workspace만 사용하는 고정 initdb/postgres --single 계획과 pg_hba_file_rules 결과 parser를 추가했습니다. SQL은 path/line/auth method/error category만 반환하며 database/user 목록과 인증 옵션 원문·native error 원문은 제외합니다. reviewed file mapping/major/line/response size/schema를 검사합니다. 이 모듈은 아직 웹/root helper 실행 경로에 연결하지 않았으며 계획 생성은 실행/격리 증거가 아닙니다.

새 `npm run verify:postgresql:hba:native`는 기존 로컬 Docker Desktop postgres:16 pinned image, network none, host mount none, read-only rootfs, cap drop ALL/no-new-privileges, pids/memory/cpu limits, private tmpfs에서만 fixture cluster를 initdb하고 single-user backend로 검수했습니다. OS image의 fixed postgres non-root account를 id로 확인(uid999)하며 호스트 UID1000을 container account로 오인하지 않습니다. 실제 native relative include/include_dir C filename order/include_if_exists/@user-list, 잘못된 method/CIDR, 포함 파일 오류 path/line, required include/@list missing, LDAP option value 비노출을 통과했습니다. client 인증·LDAP 연결·운영 DB 접속은 수행하지 않았습니다. PostgreSQL16.15 binary SHA `ea528a9f858bce5eef557522820c945a3d3b9fd260a15d6d0313d6350574229d`, image `sha256:1a6ab3f5345eb6dbe04a1349529caabdb0ab09293a09590fad07b2246bfa4b54`.

처음에는 initdb 단계 실패를 확인했습니다. 기존 진단 runner가 host UID를 사용하던 경로에 fixed image postgres account 옵션을 추가하여 해결했습니다. failure phase만 공개하고 raw output은 보존하지 않는 기존 비공개 정책을 유지했습니다. 성공한 입력/증거를 반복한 것이 아니라 include 순서/@list missing 등 새 범위를 확장하여 최종 PASS했습니다. evidence `.runtime/verification/postgresql-hba-native-2026-10-04T06-57-10.272Z-clarified.json`는 원래 증거를 보존하면서 serverStarted 용어를 postmasterStarted=false/singleUserBackendExecuted=true로 명확히 한 기록입니다. ephemeral single-user cluster에서 SQL backend가 실행됐다는 사실을 숨기지 않습니다. 모든 verification container는 session cleanup/label 검사로 정리됐습니다.

unit 2 PASS, 전체 542 PASS, verifier syntax PASS. docs 기준 https://www.postgresql.org/docs/16/view-pg-hba-file-rules.html 와 https://www.postgresql.org/docs/current/app-postgres.html . 103 서버에는 실행 파일 root ownership metadata만 조회했고 namespace/DB native 실행은 하지 않았습니다. 최신 원격 앱은 이전 HBA backup deb SHA `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`를 유지합니다. 이번 단계는 native validator foundation/verification 변경이므로 앱에 새 검수 버튼이 반영됐다고 주장하지 않습니다.

전체 목표 PARTIAL. 다음 필요 범위는 실제 HBA include/@ graph의 안전한 snapshot/rewrite, root helper private namespace 실행과 native binary/runtime 검증, 웹 검수 버튼 및 검토된 operating apply/restore/rollback입니다. 다른 PostgreSQL major/SSL/GSS/역할·네트워크 환경에서의 실제 인증 의미와 운영 서비스 E2E는 이번16 fixture 검사의 증거로 대체하지 않습니다.

## 2026-10-04 HBA 파일 백업과 복원 코드 초안 연결

pg_hba.conf 노드를 선택하면 헤더 백업/복원은 해당 cluster 파일의 HBA 백업 창을 엽니다. 현재 운영 파일의 조회 SHA와 일치할 때만 private backup을 생성하며, 편집 중인 초안은 백업하지 않습니다. 목록은 해당 target만 표시하고 source text를 노출하지 않습니다. restore draft는 현재 live text/version과 백업 text를 함께 읽어 code baseline을 현재 파일로 유지합니다. 편집 중 초안이 있으면 기존 교체 확인을 거치며 코드/GUI 양쪽에 반영됩니다. 다른 cluster record, traversal, private permission 위반, symlink/hardlink, 손상/변경 기록을 거부합니다. 파일 내용 backup fsync와 private directory fsync를 수행합니다. 운영 파일 복원/DB restart는 이 draft action에 포함하지 않습니다.

root helper closure/action label와 authenticated API를 연결했습니다. GET 목록/복원 초안은 명시적 sudoWithoutPrompt 게이트, POST backup은 databaseChanges/readOnly/server gate/sudo 권한·origin 검사와 감사 로그를 거칩니다. 오래된 persisted HBA code record의 sourceVersion이 없으면 선택 metadata version을 사용하고 actual backup은 다시 SHA를 검증합니다. helper JSON 응답은 byte 단위 제한과 UTF-8 stream decoding을 사용합니다. HBA restore draft의 두 bounded snapshot이 JSON escape 후 정상 크기를 초과할 수 있어 해당 action만 최대 4 MiB로 제한하며 다른 action은 1 MiB를 유지합니다.

최종 전체 540 PASS, 최종 render 백업 payload/older draft fallback/복원 baseline 검사 PASS, production build PASS, deb 인증·권한/PTY/helper closure·모듈 export 검증 PASS. 초기 security test 직접 실행은 isolated auth root를 지정하지 않아 개발 저장소 권한 검사를 실패했으며 표준 npm test의 private fixture root로 최종 통과했습니다. DB 또는 사용자 인증 저장소 권한을 완화하지 않았습니다.

최신 deb SHA-256 `a55b176f9c967d6f53e1c5dd66744c0b80e055f84f6331cffc3606b912b6322a`, package evidence `.runtime/verification/package-2026-10-04T06-42-56.346Z.json`. 기존 설치 승인 대상 103 앱만 재설치하고 helper/BUILD_ID/HBA backup module의 source hash 일치, app active, login HTTP200, 두 HBA GET endpoint의 unauthenticated HTTP401을 확인했습니다. 원격 증거 `.runtime/verification/postgresql-hba-backups-20261004.json`.

전체 목표 PARTIAL. HBA native 검수·운영 적용/실제 파일 복원·실제 브라우저 편집 E2E는 아직 완료하지 않았습니다. 이번 backup/restore draft의 positive 동작은 filesystem/React fixture 증거이며 remote 운영 DB에서 수행한 검사가 아닙니다. 원격 보안 설정·운영 HBA 파일·PostgreSQL 서비스는 변경하지 않았습니다.

## 2026-10-04 PostgreSQL 설치 계정 소유 설정 적용 경로 수정

실제 103번 서버 PostgreSQL cluster 디렉터리와 postgresql.conf는 postgres 소유였습니다. 기존 legacy apply/restore helper의 root-only 파일/부모 검사는 정상 배포 설정을 거부했습니다. 고정 /usr/bin/id 바이너리의 root 소유·nonwritable 여부를 검증하고 postgres uid를 확인하여 PostgreSQL 경로에만 root/postgres 소유권을 허용했습니다. /etc와 /etc/postgresql는 root-owned 정책을 유지합니다. 다른 계정 소유, writable directory/file, 링크와 hardlink는 거부합니다. O_NOFOLLOW/O_NONBLOCK FD의 bounded read, UTF-8/NUL 검사, 읽기 전후 파일 identity와 부모 재검사를 추가했습니다. 설정 적용/복원은 기존 SHA conflict, native candidate 검수, private backup, 소유권 보존, activation rollback 경로를 유지합니다.

관련 helper 회귀 23 PASS, 전체 535 PASS, production build PASS, deb 인증·세션·PTY 검증 PASS. deb SHA-256 `ac025c16351012056aef42a5b9e1e23bc271195e189b6327399cb9cb32ea5118`. 패키지 증거 `.runtime/verification/package-2026-10-04T06-26-58.267Z.json`. 기존 설치 승인으로 103 앱만 재설치했고 installed helper/BUILD_ID checksum 일치, app active, login HTTP200을 확인했습니다. 원격 증거 `.runtime/verification/postgresql-owner-20261004.json`.

전체 목표 PARTIAL. 실제 DB 접속·PostgreSQL 재시작·운영 설정 적용은 수행하지 않았습니다. postgres 소유 파일 적용/복원은 fixture 검증이며 실제 native activation E2E를 대체하지 않습니다. HBA 운영 검수·적용·백업·복원 및 브라우저 E2E는 남아 있습니다.

## 2026-10-04 PostgreSQL pg_hba.conf GUI·코드 편집 및 제한된 관리자 조회

이전 턴은 PostgreSQL 그룹 전환/초안 교체 상태 수정과 실제 앱 반영으로 progress였습니다. 이번에는 cluster별 pg_hba.conf metadata를 live inventory와 IDE tree에 추가했습니다. local/host/SSL/GSS 유형, database/user/address, 인증 방식(18 oauth 포함)/옵션, 규칙 추가·수정·삭제·인접 순서 이동을 GUI로 코드 초안에 반영합니다. quoted keyword/name/주석/CRLF/IPv4 별도 mask를 보존하고 include·복잡한 multiline·알 수 없는 형식은 원문 code 편집으로 남깁니다. include 경계를 넘어 GUI에서 순서를 바꾸지 않습니다. 기존 postgresql.conf GUI import/apply와 HBA는 분리하고 서로의 draft를 덮어쓰지 않습니다. 작업 폴더 초안 저장/다운로드는 기존 코드 편집 경로를 사용하며 운영 HBA 자동 적용은 아직 제공하지 않습니다.

config source는 부모 링크/파일 교체/size/UTF8/NUL 검사를 강화했습니다. unreadable HBA도 오류 metadata node로 표시합니다. 직접 읽기 권한 부족에만 고정 HBA path + sudoWithoutPrompt 게이트를 적용해 전용 postgresql-hba-source helper를 호출합니다. helper는 확인된 root/postgres 소유, nonwritable/일반/single-link/bounded file만 읽고 include target을 열지 않습니다. 소유 uid 조회는 검증된 fixed /usr/bin/id -u postgres만 사용합니다. root module closure, helper allowlist, security label에 새 읽기 동작을 포함했습니다. 실제 sudo 정책/파일 권한은 변경하지 않았습니다.

관련 21 PASS, 전체 533 PASS, production build PASS, 최종 deb 인증/PTY/API/helper closure 검증 PASS. 최초 새 HBA render test는 기존 미저장 초안 교체 확인을 거치지 않아 실패했고 실제 확인 동작을 추가했습니다. HBA guiSynchronized prop를 잘못 제외하던 구현도 수정했습니다. 첫 전체 게이트는 새 helper의 audit entry/label 누락을 찾아 수정 후 최종 PASS했습니다. 공식 기준 https://www.postgresql.org/docs/current/auth-pg-hba-conf.html .

최신 deb SHA-256 `02e7a602b2b5a330ee44ba6aa2a5f4906cee2d36c2d39d180f524c3ab58fbc5c`, package evidence `.runtime/verification/package-2026-10-04T06-13-59.139Z.json`, unsigned/unpublished APT `dist/apt-repository-GJo62N`. 기존 설치 승인 범위에서 103 앱만 checksum 확인 후 재설치, BUILD_ID hash 일치/app active/admin configured=true/loginHTTP200. 설치 module의 15/16/17/18 HBA metadata nodes 확인, 모두 app account 직접 read denied(mode640). 설치 helper의 /etc/passwd 요청 거부 확인. HBA 내용·DB 접속·운영 파일/서비스·sudo 정책은 변경하지 않았습니다. 원격 증거 `.runtime/verification/postgresql-hba-20261004.json`.

전체 목표 PARTIAL. HBA의 positive root read/실제 브라우저 편집·운영 적용/검수/백업·복원 E2E는 미검증/미구현 부분이며 fixture PASS로 대체하지 않습니다. 원격 옵션은 자율 활성화하지 않았습니다. 다음은 HBA 운영 검수·적용·복원 흐름 및 원래 다른 요구의 미완료 범위를 이어갑니다.

로그 `/tmp/tastedev-pg-hba-tests.log`, `/tmp/tastedev-pg-hba-source-tests.log`, `/tmp/tastedev-pg-hba-full.log`, `/tmp/tastedev-pg-hba-build.log`, `/tmp/tastedev-pg-hba-package.log`, `/tmp/tastedev-pg-hba-remote-install.log`.

## 2026-10-04 PostgreSQL 그룹 전환·초안 교체 상태 개선

이전 턴은 nginx 조회 갱신의 선택/초안 유지 수정과 실제 앱 반영으로 progress였습니다. 이번에는 PostgreSQL 같은 파일의 연결/메모리/로그 그룹 전환 시 기존 source record가 있으면 재조회하지 않고 코드 초안을 유지하도록 했습니다. 파일 노드를 다시 선택하는 명시적 재조회는 유지하고 첫 로드 중 group 선택은 소스가 없으므로 다시 요청합니다. inventory 갱신은 같은 파일의 선택 metadata만 새 객체로 교체하며 코드 초안/검토 baseline은 보존합니다. 사라진 파일은 선택과 pending replacement prompt를 해제합니다. package/connection scope 변경도 pending을 지우며 다른 kind pending의 확인창/교체 동작을 차단합니다.

관련 GUI/code/popup 검사 5 PASS, production build PASS, 최종 deb 인증/PTY/API 검증 PASS. 신규 테스트 첫 실행은 group 선택이 settings로 이동한 후 비활성 code editor를 찾으려는 fixture 오류로 실패했고 code 탭을 다시 여는 실제 흐름으로 수정했습니다. 전체 525 회귀는 이전 결과이며 이번에 반복하지 않았습니다.

최신 deb SHA-256 `820533e063c36d62105474ff1868235325f994a848ab26c1cb583f7d556fb8bd`, package evidence `.runtime/verification/package-2026-10-04T05-54-07.930Z.json`, unsigned/unpublished APT `dist/apt-repository-8ml4VV`. 사용자 기존 설치 승인 범위에서 103 앱만 별도 deb checksum 확인 후 재설치했습니다. production BUILD_ID hash 일치, app active/admin configured=true/login HTTP200. 원격 PostgreSQL 15/16/17/18 main postgresql.conf mode644/app account readable=true. 파일 metadata만 확인했으며 DB 접속/설정 수정/서비스 재시작은 실행하지 않았습니다. 원격 증거 `.runtime/verification/postgresql-ide-20261004.json`.

전체 목표 PARTIAL 유지. 실제 브라우저 상호작용·운영 DB/설정 적용/복원 E2E는 미검증이며 파일 읽기 권한 검사는 이들을 증명하지 않습니다. 다음은 패키지별 실제 설정 파일 범위와 GUI 편집 기능의 부족 부분을 이어서 구현합니다. 원격 readOnly 해제 승인 질문은 미응답이고 로컬 개발 터미널 허용은 유지됩니다.

로그 `/tmp/tastedev-postgresql-ide-tests.log`, `/tmp/tastedev-postgresql-ide-build.log`, `/tmp/tastedev-postgresql-ide-package.log`, `/tmp/tastedev-postgresql-ide-remote-install.log`.

## 2026-10-04 nginx IDE 조회 갱신의 선택·초안 유지

이전 턴은 root 파일 편집/트리·백업 연결 및 실제 앱 반영으로 progress입니다. 이번 턴은 모든 data 갱신에서 setSelected(null)하던 버그를 고쳤습니다. 초기 선택 없음은 유지하고 이후 갱신에서는 file path와 semantic ancestry key로 같은 블록을 선택합니다. 이전 parser ID가 달라져도 같은 블록/설정·코드 탭 유지, 사라진 파일 선택 해제, draft source/기존 baseline 보존을 검증했습니다. 블록 details key도 semantic key를 사용하여 앞쪽 노드 번호 변화에 의해 불필요하게 초기화되지 않도록 했습니다.

관련 렌더/semantic-key/editor 검사 5 PASS, production build PASS, 최종 deb 서버/인증/PTY/API 검증 PASS. 이번 UI 변경에 전체 525 회귀를 반복하지 않았으며 이는 직전 턴의 결과입니다. 최신 deb SHA-256 `b4b128482a743d61779c2c5bec4546009e31d1406a0389d9e8add82421d7114a`, package evidence `.runtime/verification/package-2026-10-04T05-45-29.645Z.json`. 로컬 unsigned/unpublished APT `dist/apt-repository-YsMwbL`.

사용자 기존 설치 승인 범위에서 103 앱만 별도 deb checksum 확인 후 재설치했습니다. 최신 production BUILD_ID 해시 대조 PASS, app active/admin configured=true/login HTTP 200. 증거 `.runtime/verification/nginx-selection-20261004.json`. 운영 nginx 파일/서비스, DB, 인증서 발급은 변경하지 않았습니다. 이전 root graph 28files/58edges 경고0은 unchanged backend의 이전 검사 증거이며 이번에 반복하지 않았습니다.

실제 GUI 렌더링/사용자 조작 E2E와 원격 운영 적용·복원은 아직 검증하지 않았습니다. 전체 목표 PARTIAL 유지. 원격 조회 전용 해제 승인 질문은 미응답이고 개발 터미널 활성화는 유지합니다. 다음은 다른 패키지 GUI 흐름과 남은 원래 요구사항 검증을 이어갑니다.

로그 `/tmp/tastedev-nginx-selection-tests.log`, `/tmp/tastedev-nginx-selection-build.log`, `/tmp/tastedev-nginx-selection-package.log`, `/tmp/tastedev-nginx-selection-remote-install.log`.

## 2026-10-04 nginx 루트 설정 파일 GUI·편집·백업 연결

지난 변경은 nginx-tree inventory에 root _.conf와 Certbot 옵션을 추가했지만 renderer가 기존 폴더만 표시하는 누락이 있었습니다. 이번에 root 파일 노드와 letsencrypt 그룹을 실제 렌더링하고 regression에서 표시를 확인했습니다. `nginx-config-paths.ts`로 client/helper 공통 경로 정책을 만들고 root의 안전한 일반 _.conf 파일을 편집·검수·백업·복원 경로에 연결했습니다. /etc 밖, 숨김 파일, root 다른 확장자, 깊은 subdirectory, sites-enabled 직접 편집, Certbot 외부 공통 파일 편집은 계속 거부합니다. graph membership, ownership/symlink, conflict, native validation/service identity, backup/rollback gate는 유지합니다. helper 두 module closure에 새 pure module을 포함했습니다.

root include candidate가 원본을 보존하며 편집본을 전체 private graph에 포함하는 검사, unreferenced file/외부 변경 거부, reload 실패 시 원본 복원+백업 fixture PASS. 최초 render test는 native button을 custom Button 목록에서 찾는 잘못된 assertion으로 실패했고 native 목록으로 수정했습니다. 관련 11 PASS, 전체 525 PASS, 최종 toolbar/tree GUI 3 PASS. production build PASS, 최종 deb 인증/PTY/API/helper closure 검증 PASS.

최신 deb SHA-256 `da6b93fa93023297a79fa4d88843514b63f46dd3b77a7d7ec2f2a799a8b23d91`, package evidence `.runtime/verification/package-2026-10-04T05-39-42.477Z.json`, unsigned/unpublished APT `dist/apt-repository-HIHF5z`. 사용자 기존 설치 승인 범위로 103 앱만 checksum 확인 및 같은 패키지 재설치. 설치 모듈에서 rootEditable=true/certbotEditable=false, fixed readonly graph files=28/edges=58/complete=true/warnings=0, app active/admin configured=true 확인. 증거 `.runtime/verification/nginx-root-settings-20261004.json`. nginx 운영 파일 수정·서비스 재시작·ACME 발급·DB 변경은 실행하지 않았습니다.

전체 목표 PARTIAL 유지. 실제 브라우저 조작과 운영 적용/복원 E2E는 별도 미검증이며 fixture 검사를 해당 범위의 증거로 대체하지 않습니다. 다음 범위는 파일 선택→블록 선택→GUI/코드 초안→검수→적용/복원의 미검증 동작 및 다른 패키지의 동일 IDE 흐름 점검입니다. 원격 조회 전용 해제 명시 승인 질문은 아직 미응답 상태입니다. 로컬 development terminal 활성화는 유지합니다.

로그 `/tmp/tastedev-nginx-root-full.log`, `/tmp/tastedev-nginx-root-targeted.log`, `/tmp/tastedev-nginx-root-gui.log`, `/tmp/tastedev-nginx-root-build.log`, `/tmp/tastedev-nginx-root-package.log`, `/tmp/tastedev-nginx-root-remote-install.log`.

## 2026-10-04 nginx·Certbot 공통 설정 그래프/트리 연결 완료

고정 공통 설정 `/etc/letsencrypt/options-ssl-nginx.conf`만 topology에 읽기 전용으로 포함하고 후보 검수 시 별도 private external namespace에 복사합니다. 원본/후보 그래프 버전과 후보 해시 검사를 유지합니다. 개인키/인증서 경로, 외부 wildcard, symlink 및 외부 파일 편집은 허용하지 않습니다. GUI tree는 nginx root \*.conf와 실제 include된 공통 설정을 표시합니다. 공통 파일 설정/코드는 읽기 전용이며 저장된 초안도 무시하고 mutation/context/초안 버튼을 숨깁니다.

전체 523 PASS, production build PASS, 최종 GUI fixture 5 PASS, 최종 deb 서버/인증/PTY/SSE 검증 PASS. deb SHA-256 `402d2fb381b070514092cc2d9206ef48dc13d586ee8816cfa8fdb9fd141ac152`, package evidence `.runtime/verification/package-2026-10-04T05-31-25.854Z.json`. 로컬 APT 산출물 `dist/apt-repository-ITgEaY`, unsigned/unpublished.

사용자 기존 설치 승인 범위에서 103 앱만 새 별도 deb를 checksum 확인 후 재설치했습니다. 실제 fixed read-only helper 결과 files=28, includeEdges=58, complete=true, warningCount=0, certbotOptionsReadOnly=true, serviceReady=true, operatingConfigurationChanged=false. 기존 46개 Certbot 옵션 include 경고 해결. 앱 active/admin configured=true 유지. 원격 증거 `.runtime/verification/nginx-certbot-options-20261004.json`. 인증서 발급, nginx 서비스 제어/운영 설정 적용, DB 변경은 실행하지 않았습니다.

GUI 실제 픽셀/상호작용과 운영 설정 적용 E2E는 확인하지 않았으며 전체 목표 PARTIAL 유지. 다음 실제 기능 부족 항목: root common.conf 등의 운영 편집 범위, 전체 GUI 검증, 패키지별 적용/복원 실제 안전 환경 검증. 원격 조회 전용 해제는 이전 명시 승인 질문 미응답으로 유지, 로컬 개발 터미널 허용 상태는 유지합니다.

로그 `/tmp/tastedev-certbot-full.log`, `/tmp/tastedev-certbot-gui-tests.log`, `/tmp/tastedev-certbot-build.log`, `/tmp/tastedev-certbot-package.log`, `/tmp/tastedev-certbot-remote-install.log`.

## 2026-10-04 실제 nginx 상대 include·prefixed mask 지원

원격 고정 읽기 전용 nginx-context-inspect에서 최초 files=2/complete=false를 확인했습니다. 지적 include는 common.conf/cache.conf/geoserver.conf/kakao.conf/jenkins.conf 및 conf.d/vhost\__.conf였습니다. 상대 경로를 nginx.conf의 /etc/nginx prefix 기준으로 해석하고 leaf _ 패턴을 일반 prefix/suffix 매칭으로 확장했습니다. GUI include 링크, root topology, private candidate rewrite가 같은 매칭을 사용하며 directory 재확인도 같은 pattern으로 수행합니다. 경로 이탈/상위 디렉터리·변수·directory wildcard 차단 및 기존 editable file 허용 범위는 유지했습니다.

관련 10 PASS, 전체 520 PASS, production build PASS. 초기 신규 fixture는 폴더 권한을 지정하지 않아 unsafe 검증으로 실패했으며 700으로 수정했습니다. candidate 신규 test는 기존 범위 밖 common.conf 직접 편집을 거부하여 실패했고 nginx.conf를 대상으로 바꿔 편집 범위를 넓히지 않았습니다. 후보의 relative/mask private 경로 재작성과 원본 불변 검사 PASS. 기준 자료 https://mailman.nginx.org/pipermail/nginx/2016-April/050456.html .

최신 deb SHA-256 `24f9d0702934ed23748948ff69dfae8fdb8c8dbefcee2bed55fc4cbe1ceca697`, 패키지 증거 `.runtime/verification/package-2026-10-04T05-17-44.460Z.json`. 사용자 목표 시스템/설치 승인 범위에서 103 앱만 재설치, 이전 deb 보존, nginx 설정/운영 서비스 변경 없음. 새 실제 helper graph files=27/includeEdges=12/serviceReady=true, complete=false. 남은 46 경고는 모두 /etc/letsencrypt/options-ssl-nginx.conf include로 확인했습니다. 인증서/개인키 파일은 읽지 않았습니다. 이 공통 Certbot 설정 연결은 다음 미완료 항목으로 유지하며 전체 PARTIAL입니다. 웹 UI 픽셀/조작 또는 실제 설정 적용 E2E PASS가 아닙니다.

로그 /tmp/tastedev-nginx-relative-tests.log, /tmp/tastedev-nginx-relative-full.log, /tmp/tastedev-nginx-relative-build.log, /tmp/tastedev-nginx-relative-package.log, /tmp/tastedev-nginx-relative-apt.log. 이전 턴은 터미널 디자인 수정/실제 배포로 progress, 이번 턴은 nginx include 누락 수정/실제 그래프 증거로 progress입니다.

## 2026-10-04 터미널 스크롤바·내부 선 수정 및 원격 반영

사용자 요청에 따라 terminal host 외부 padding 8px을 0으로 바꾸고 텍스트 inset은 xterm에만 left 8px으로 적용했습니다. xterm scrollable element의 top/left shadow를 숨겨 스크롤 그림자 선을 제거했습니다. FitAddon이 xterm padding을 계산하는 현재 라이브러리 구현을 확인했습니다. shell 출력 내용·입력 커서·선택 표시는 변경하지 않았습니다.

production build PASS, 최신 deb 인증/PTY/SSE 검증 PASS. SHA-256 `92544de9bee4960bc6b8fa32c2305333aa7e5eb34d12c42ec1a332dfe2ffffc1`, 증거 `.runtime/verification/package-2026-10-04T05-09-24.354Z.json`. 수정 요청과 기존 설치 승인 범위로 192.168.0.103에 새 deb를 별도 edge 파일로 전송해 checksum 확인 및 같은 앱 재설치 완료. 이전 deb 보존, 0 upgrade/1 reinstall/0 removal, whitecalvin 실행 계정 유지. SSH 터널 login HTTP 200, 실제 제공되는 CSS의 host padding 0/scroll shadow hidden 확인, 관리자 configured=true 보존 PASS. 실제 GUI 픽셀·스크롤 조작은 미검증입니다.

원격 nginx 1.31.6, Certbot 2.9.0, PostgreSQL meta 18+293, MariaDB 10.11.14 패키지 존재 확인. 버전 조회만 수행하며 해당 운영 서비스/DB 데이터 변경 없음. 사용자 “목표 시스템 구현” 요청에 따라 이들을 다음 GUI/운영 검증 대상으로 유지합니다. 원격 조회 전용 해제 승인 질문은 별도 미응답이고 개발 터미널 활성화는 완료 상태 유지. CSS처럼 낮은 영향의 스타일 변경에 구현 복제 테스트/전체 회귀 반복을 추가하지 않았습니다. 전체 목표 PARTIAL.

## 2026-10-04 사용자 요청 개발환경 터미널 활성화

사용자가 “지금 개발환경에서 터미널 사용할 수 있게 해줘”라고 요청했습니다. 개발 .env.local의 LINUX_ENABLE_TERMINAL=true만 설정하고 보안 설정 terminal=true/readOnly=false를 saveSecurity의 버전 확인/감사 경로로 적용했습니다. 다른 기능 옵션과 원격 103 설정은 변경하지 않았습니다. 확인한 프로젝트 개발 프로세스만 종료하고 npm run dev로 8787 재시작, exec session 13764 유지. 개발 login HTTP 200, serverAllowsTerminal=true/readOnly=false/terminal=true 확인.

같은 개발환경 변수/보안 모듈로 일반 계정 PTY에 입력을 보내 marker와 whoami whitecalvin 출력/exit success를 대조해 PASS. 이는 별도 모듈 subprocess의 실제 PTY 검사이며 인증된 브라우저 입력 증거는 아닙니다. 사용자는 개발 /terminal을 새로고침하여 사용할 수 있습니다. 원격 조회 전용 해제 승인 질문은 별도이며 이번 개발 활성화로 대체되지 않습니다. 앞선 스크롤바/내부 선 디자인 요청은 여전히 후속으로 남습니다. 전체 PARTIAL.

## 2026-10-04 원격 웹 터미널 서버 허용 적용

사용자가 관리자 설정 완료를 알렸고 공개 status에서 configured=true를 확인했습니다. 이어 서버 웹 터미널 허용 적용 질문에 “응”으로 승인했습니다. 192.168.0.103의 /etc/tastedev-linux/environment에 LINUX_ENABLE_TERMINAL=true만 적용하고 앱 서비스만 재시작했습니다. 기존 파일이 있으면 root 600 백업을 만들고 다른 환경 값을 보존하는 방식입니다. 적용 당시 기존 override 파일은 없었습니다.

재시작 후 systemd whitecalvin/active/running, auth configured=true 보존 및 실제 MainPID environ에서 terminal flag true만 추려 확인 PASS. 다른 환경 값/비밀번호/쿠키 노출 없음. 웹 보안 설정의 readOnly/terminal 허용과 인증 후 실제 셸 조작은 미검증이며 전체 PARTIAL입니다. 로컬 QA-01 서비스/설정 변경 없음.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — BLOCKED audit 3

두 이전 턴은 동일 사용자 초기 설정/선택 부재로 no progress였습니다. 이번 턴에도 관리자 생성 완료 및 서버 terminal gate true/서비스 재시작 선택 답변이 없습니다. 마지막 공개 auth status는 configured=false이며 계정 초기 설정이 실행 중이라는 확인도 없습니다. 인증 후 실제 셸/GUI 검증을 진행할 수 없어 goal BLOCKED로 전환합니다. 192.168.0.103 deb 설치, whitecalvin 서비스 실행, loopback 로그인 및 SSH 터널 접근 결과를 보존합니다. 계정 설정 완료와 허용 선택을 받은 뒤 재개합니다. 전체 목표는 여전히 PARTIAL이며 완료 범위를 축소하지 않습니다.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — blocker audit 2

이전 턴은 no progress입니다. 공개 auth status를 다시 확인했으나 configured=false/authenticated=false로 동일합니다. 관리자 설정 완료 답변과 터미널 허용 승인도 아직 없습니다. 동일 사용자 입력/초기 설정 blocker의 두 번째 연속 no-progress 턴입니다. SSH 터널은 응답하지만 사용자 계정 초기 설정 프로세스가 실행 중이라는 증거는 아니므로 verified wait로 세지 않습니다. 서비스 설정/계정 변경 없이 전체 goal active/PARTIAL 유지.

## 2026-10-04 원격 인증·터미널 허용 입력 대기 — blocker audit 1

이전 턴은 원격 관리자 미설정/terminal environment override 없음이라는 새 선행 조건 증거 확보로 progress였습니다. 이번 턴에는 관리자 설정 완료 답변 및 서버 terminal gate true/서비스 재시작 승인 모두 아직 없음을 대조했습니다. 응답을 추정하지 않고 초기 비밀번호 생성·계정 교체·서버 gate 변경을 하지 않았습니다. 실제 인증 후 터미널/GUI 검증이 사용자 초기 설정 및 선택에 막힌 첫 no-progress 턴입니다. SSH 전달 프로세스는 사용자 웹 접근용으로 유지하지만 계정 설정 작업이 실행 중이라는 증거는 아니므로 verified wait로 세지 않습니다. 전체 goal active/PARTIAL 유지.

## 2026-10-04 원격 터미널 활성화 선행 조건 확인

원격 설치 서버의 관리자 configured=false를 공개 HTTP로 확인했습니다. /etc/tastedev-linux/environment가 없어 기본 unit의 LINUX_ENABLE_TERMINAL=false가 적용됩니다. 인증 후 실제 셸 검증에는 관리자 초기 설정, 서버 terminal gate 허용, 웹 보안 설정 허용이 필요합니다. 관리자 설정 완료 여부 및 서버 gate true/서비스 재시작 여부를 사용자에게 질문했습니다. 답변을 추정하지 않으며 인증 계정/서버 gate/서비스를 이번 턴에서 변경하지 않았습니다. 기본값 OFF를 기능 동작 완료로 주장하지 않습니다. 이전 턴은 SSH 터널·설치 바이너리/소유권 증거 확보로 progress이며 전체 목표 PARTIAL입니다.

## 2026-10-04 원격 설치 서비스 SSH 터널·소유권 검증

설치 서버 192.168.0.103의 loopback:8791을 로컬 127.0.0.1:8792로 SSH 전달했습니다. 서버 공개 바인딩/방화벽 변경 없음. 터널 login HTTP 200, 미로그인 terminal 307, 관리자 configured=false 확인. 실행 중 tunnel exec session 54277은 사용자 접근을 위해 유지하며 자동 완료를 기다리는 검증 작업은 아닙니다.

원격 Node 22.23.3 바이너리, startup script 및 SQLite native SHA-256을 기록했습니다. 상태 폴더와 workspace 모두 whitecalvin 소유/700, systemd User=whitecalvin/active/running 확인. 증거 `.runtime/verification/remote-installed-20261004T044052Z.json`. 비밀번호/키/쿠키/계정 파일 내용 기록 없음. 실제 설치 계정 요구의 서비스/소유권 증거가 강화됐으나 인증 후 터미널 및 GUI 조작은 아직 미검증입니다. 관리자 계정 생성 여부를 사용자에게 요청했고 응답을 추정하지 않습니다. 전체 PARTIAL.

## 2026-10-04 사용자 승인 원격 deb 설치 완료

사용자가 SSH 192.168.0.103 / whitecalvin / id_ed25519를 제공한 뒤 “설치해”라고 명시적으로 승인했습니다. 이전 파일 전송 거부 후 해당 승인을 근거로 deb를 원격 임시 폴더에 전송했습니다. 양쪽 SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7` 일치 확인 후 sudo apt-get install으로 tastedev-linux 0.1.0 설치 PASS. Ubuntu 24.04.5, Node 22.23.3. 0 upgrade / 1 new install / 0 removal. 로컬 QA-01 서비스/sudo/apt 변경 없음.

원격 systemd ActiveState=active/SubState=running/User=whitecalvin/Group=1000 확인. 서비스 로그인 HTTP 200, auth status configured=false/authenticated=false. 실제 설치 후 지정 OS 계정으로 서비스 구동 증거 확보. service-user 파일 일반 계정 읽기 Permission denied로 내용은 확인하지 않았고 추가 권한 변경 없음. 웹 관리자 계정 초기 설정과 인증 후 실제 터미널 조작/GUI, 다른 운영 기능의 전체 검증은 아직 남아 전체 PARTIAL입니다. 비밀번호 생성/수집/노출 없음. 이전 환경 blocker에 새 설치 승인이 제공되어 설치 단계 진행 완료.

## 2026-10-04 최종 환경 검증 BLOCKED — blocker audit 3

두 이전 턴은 동일 환경 blocker로 no progress였습니다. 세 번째 턴에도 QA-01 sudo/운영 서비스 변경 금지가 유지되며 DEV-01 접속 주소·프로젝트 경로 답변은 없습니다. 실제 GUI 조작 및 deb 설치 계정/서비스 검증을 진행할 수 없어 goal을 BLOCKED로 전환합니다. 전체 목표는 미완료/PARTIAL이며 범위를 축소하지 않습니다. 코드·빌드·517 회귀·추출 deb PTY/SSE HTTP PASS는 유지하되 운영 설치/GUI PASS로 확대 해석하지 않습니다. 환경 정보와 허용된 검증 접근이 제공되면 재개합니다.

## 2026-10-04 터미널 최종 환경 검증 대기 — blocker audit 2

이전 턴은 no progress이며 실행 중 프로세스 대기가 아닙니다. 이번 턴에도 QA-01 운영 서비스/sudo 변경 금지 지침이 유지되고 DEV-01 접속 주소·프로젝트 경로 답변이 없습니다. 실제 GUI/설치 계정 검증을 대체할 허용된 환경이 확인되지 않았습니다. 기존 성공 검사를 반복하거나 무관한 코드를 추가하지 않았습니다. 동일 환경 blocker의 두 번째 연속 no-progress 턴, 전체 목표 PARTIAL/active 유지.

## 2026-10-04 터미널 최종 환경 검증 대기 — blocker audit 1

이전 목표 턴은 실제 idle SSE HTTP 증거와 검증 스크립트 개선으로 progress입니다. 이번 턴에는 최신 package 증거의 installed=false, 설치 postinst의 configure-service-account -> systemd 경로, serviceAccountPlan의 사용자/HOME/PATH 설정을 다시 대조했습니다. 기존 PASS를 반복 실행하지 않았습니다. 실제 GUI 조작 및 deb 설치 계정/운영 서비스 검증은 여전히 증거가 없습니다.

현재 QA-01 AGENTS.md는 sudo 설정·운영 서비스 변경을 금지합니다. GUI 도구의 기존 접근 제한을 우회하지 않습니다. DEV-01 접속 주소/프로젝트 경로 질문의 답변이 아직 없어 필요한 설치 환경에 접근할 수 없습니다. 실행 중인 검증 프로세스는 없으며 이를 verified wait로 세지 않습니다. 동일 외부 환경 blocker의 첫 no-progress 턴으로 기록합니다. 전체 목표 미완료/PARTIAL, goal active 유지. 추가 코드나 같은 성공 검사로 완료를 대체하지 않습니다.

## 2026-10-04 실제 deb HTTP idle heartbeat 검증

최신 deb의 실제 인증 SSE 연결을 출력 없는 상태로 유지하여 15초 heartbeat 이벤트 전달을 확인했습니다. heartbeat payload는 빈 객체이며 output id/sequence를 변경하지 않습니다. 이후 같은 PTY에 입력을 보내 최종 출력과 종료까지 확인했습니다. 미로그인/소실 작업 거부 및 로그아웃 인증 폐기 등 기존 패키지 검사도 PASS. 첫 시도는 검사 공통 5초 fetch 제한 때문에 TimeoutError로 종료됐으며 heartbeat용 스트림 요청만 30초로 수정해 재검증 PASS. 일반 API 제한은 유지했습니다.

배포 파일은 변경하지 않았습니다. SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7`, 새 증거 `.runtime/verification/package-2026-10-04T04-03-23.535Z.json`. 로그 `/tmp/tastedev-terminal-heartbeat-http.log` (초기 검사 제한 실패), `/tmp/tastedev-terminal-heartbeat-http-retry.log` (PASS). 현재 개발 서버 8787의 /login HTTP 200, /terminal 미로그인 307 -> /login?next=%2Fterminal 확인. 이는 GUI 렌더/로그인 후 터미널 조작 증거가 아닙니다.

서비스 기본 unit의 tastedev-linux 사용자 설정은 configure-service-account.ts의 설치 SUDO_USER 기록 및 systemd drop-in 경로로 덮어쓰도록 구현되어 있습니다. 실제 설치 계정/서비스 동작은 DEV-01 환경이 필요하며 아직 환경 정보 답변 없음. 현재 QA-01의 sudo/운영 서비스 변경 금지 및 GUI 도구 접근 제한을 우회하지 않았습니다. 이전 턴은 idle 복구 코드와 517 검사/빌드/패키지 증거 생성으로 progress. 이번 턴은 실제 idle HTTP 증거 확보로 progress. 전체 목표 PARTIAL 유지.

## 2026-10-04 터미널 연결 후 스트림 정지 복구

첫 SSE 이벤트 이후에도 연결 생존 확인을 유지합니다. 서버는 출력이 없을 때 15초마다 heartbeat 이벤트를 전송하며 로그/sequence는 변경하지 않습니다. 클라이언트는 job/heartbeat마다 35초 타이머를 갱신하고 응답이 멎으면 스트림을 닫고 기존 작업 조회 폴링으로 전환합니다. 셸 재실행/입력 재전송 없음. 첫 응답의 3초 제한은 유지하며 종료·화면 종료·연결 변경·폴링 전환 시 타이머를 정리합니다. 지연 heartbeat는 닫힌 연결을 다시 시작하지 않습니다.

관련 6 검사 PASS: idle heartbeat의 출력 중복/커서 변경 없음, 첫 연결 후 정지의 폴링 전환, heartbeat 타이머 갱신, 전환 이후 지연 heartbeat 무시, 기존 인증 폐기/취소/증분 출력 보존. 전체 회귀 517 PASS, production build PASS. 최신 추출 deb의 인증/PTY/SSE HTTP 검증 PASS. 실제 브라우저 네트워크 정지 재현은 미검증입니다.

deb SHA-256 `939cd8f96d27336e5bc5b753db0cea3eea97ab9214c5b46d924ae27e9ac4d4d7`. 증거 `.runtime/verification/package-2026-10-04T04-01-05.191Z.json`. 로컬 APT 저장소 `dist/apt-repository-kO4utD`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-idle-tests.log`, `/tmp/tastedev-terminal-idle-full.log`, `/tmp/tastedev-terminal-idle-build.log`, `/tmp/tastedev-terminal-idle-package.log`. DEV-01 환경 답변은 아직 없으며 GUI/운영 설치를 포함한 전체 목표는 PARTIAL입니다. 이전 턴은 실제 입력 큐 수정과 PTY 증거/최신 배포 산출물 갱신으로 progress입니다.

## 2026-10-04 터미널 대량 붙여넣기 최신 배포 검증

전체 회귀 516 PASS, production build PASS, 번역 검사 PASS. 일반 Unicode 입력 73,000 UTF-16 단위 / 169,000 UTF-8 바이트를 격리 raw PTY로 전송하여 원문 SHA-256 일치와 입력 echo 없음 PASS. 입력 대기 한도 262,144 단위, 순차 전송 및 실패 입력 폐기/명시적 복구를 유지합니다. backend 요청 한도와 NUL 차단은 그대로입니다. NUL 차단 해제 제안은 자동 승인 검토에서 실행 전 거부됐으며 해당 변경을 제외했습니다.

최신 deb 추출 서버의 인증·PTY 입력/resize·대량 출력·SSE·로그아웃 인증 폐기 검증 PASS. deb SHA-256 `e285792494500f2330161f383e847f453df8082b65f8da512b467cd987cbb433`. 증거 `.runtime/verification/terminal-pty-2026-10-04T03-40-18.249Z.json`, `.runtime/verification/package-2026-10-04T03-50-44.665Z.json`. 같은 deb의 로컬 APT 저장소 `dist/apt-repository-8eBkpW` 생성 완료. 서명/게시/호스트 설치 false.

로그 `/tmp/tastedev-terminal-paste-full.log`, `/tmp/tastedev-terminal-paste-build.log`, `/tmp/tastedev-terminal-paste-package.log`, `/tmp/tastedev-terminal-paste-apt.log`. 실제 브라우저 키보드/클립보드·전체 레이아웃, 실제 deb 설치와 운영 서비스 적용은 미검증입니다. QA-01의 sudo/운영 서비스 변경 금지를 유지하며 DEV-01 접속 주소와 프로젝트 경로를 요청했습니다. 아직 답변이 없어 추정하지 않습니다. 일반 셸은 실행 OS 계정을 사용하며 Claude CLI 로그인은 선택 프리셋의 별도 후속입니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 SSE 최신 배포·인증 폐기 검증

전체 회귀 515 PASS, production build PASS. 최신 deb에서 실제 PTY 명령의 새 출력과 최종 종료 상태를 인증된 SSE HTTP로 읽었습니다. 출력 sequence 중복 없음, 입력 echo 없음, 미로그인 401/소실 작업 404를 확인했습니다. 실행 중인 별도 셸의 SSE를 연 채 로그아웃하여 terminal-error status 401과 stream 종료도 확인하고, fixture 재로그인으로 해당 셸을 중지한 뒤 다시 로그아웃했습니다. 인증 재확인은 1초 간격이며 이 검사는 로그아웃 직후 모든 바이트의 즉시 차단을 보장하는 검사가 아닙니다. 사용자 GUI 응답 속도 측정이나 실제 Claude 대화 검증은 아닙니다.

deb SHA-256 `723b6aeb9c50070236d824445969a2e42af084acf64a95861d403a801fb03ef3`. 증거 `.runtime/verification/package-2026-10-04T03-29-03.553Z.json`. 로컬 APT 저장소 `dist/apt-repository-Djg6VW`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-stream-full.log`, `/tmp/tastedev-terminal-stream-build.log`, `/tmp/tastedev-terminal-stream-package.log`, `/tmp/tastedev-terminal-stream-apt.log`.

Claude 사용자 로그인 완료 답변은 아직 없으며 추정하지 않습니다. GUI·운영 설치·AI 대화 등 원래 미완료 요구를 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 입력 복구 최신 배포 검증

전체 회귀 510 PASS 및 production build PASS. 입력 오류 영역/연결 확인 버튼과 명시적 큐 재개, 실패 입력 미재전송 및 기존 작업 GET 확인이 최신 deb에 반영됐습니다. 추출 deb 인증/PTY 입력·resize·대량 한글·이모지 출력·임시 사용자 Bash CLI 프리셋 HTTP 검증 PASS입니다. 브라우저에서 오류 유발/버튼 클릭을 수행한 증거는 아닙니다.

deb SHA-256 `77d1e4945e147cac4f716e04d4932f5c9b61dd081adfa6da16a315f4f2c081e3`. 증거 `.runtime/verification/package-2026-10-04T03-10-15.729Z.json`. 로컬 APT 저장소 `dist/apt-repository-6qwlGD`, 서명/게시/호스트 설치 false. 로그 `/tmp/tastedev-terminal-recovery-full.log`, `/tmp/tastedev-terminal-recovery-build.log`, `/tmp/tastedev-terminal-recovery-package.log`, `/tmp/tastedev-terminal-recovery-apt.log`.

현재 개발 계정 Claude auth는 직접 실행과 터미널 프리셋과 동일한 사용자 Bash 초기화 실행에서 모두 loggedIn=false/exit 1입니다. 프로필 확인 증거 `.runtime/verification/claude-profile-auth-status-2026-10-04T03-11-19.158Z.json`. 로그인 변경/AI 요청/토큰 기록 없음. 사용자 Claude 로그인 완료 답변을 요청했으며 답변을 추정하지 않습니다. 실제 GUI·운영 설치·AI 대화 등 원래 미완료 범위가 남아 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 대량 출력·소실 상태 최신 배포 검증

전체 회귀 508 PASS, production build PASS. 단일 출력 묶음의 8,000자 이후 누락을 수정한 서버와 성공한 전체 세션 조회의 소실 상태 처리가 최신 deb에 포함됐습니다. 추출 패키지의 인증 PTY HTTP에서 대량 한글·이모지 출력 전체 문자열을 대조하여 PASS했고 기존 입력·resize·실행 제한 시간·임시 Bash CLI 프리셋도 PASS했습니다. 실제 AI CLI 로그인/대화는 검사하지 않았습니다.

deb SHA-256: `919703d05fd6ff9587e6b8f62bd36a07ed3e2611fe47b655a823a33ba281c240`. 증거 `.runtime/verification/package-2026-10-04T02-59-49.208Z.json`. 로컬 APT 저장소 `dist/apt-repository-remZ99`도 같은 deb로 갱신했습니다. 서명/게시/호스트 설치 false.

로그: `/tmp/tastedev-terminal-output-full.log`, `/tmp/tastedev-terminal-output-build.log`, `/tmp/tastedev-terminal-output-package.log`, `/tmp/tastedev-terminal-output-apt.log`. 보관 한도 500개 출력 레코드 유지, 실제 GUI·운영 설치·AI 인증 등 기존 미완료 요구 유지, 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 탭·연결 복구 최신 배포 검증

전체 회귀 506 PASS, production build PASS. 탭 활성화 시 컨테이너 크기 맞춤/입력 포커스, 숨겨진 화면 보존, 새 계정 조회 전 입력 제한, 이전 연결의 지연 응답 차단이 최신 deb에 반영됐습니다. 직접 격리 PTY 검증에서는 4개 동시 탭 입력/출력 독립과 개별 종료를 확인했습니다. 추출 deb는 `package:verify -- --terminal`로 인증된 PTY HTTP 입력·resize·종료·실행 제한 시간과 임시 사용자 Bash 프로필의 CLI 프리셋 실행을 확인했습니다. 실제 Claude AI 대화는 수행하지 않았습니다.

deb SHA-256: `7c4845729743c14a0d1fa9f4079ccbfd9d34765975c039ddd518b9661f604693`. 증거 `.runtime/verification/package-2026-10-04T02-51-44.462Z.json`. 기본 terminal gate OFF 검증도 별도로 PASS: `.runtime/verification/package-2026-10-04T02-50-57.248Z.json`. 로컬 APT 저장소 `dist/apt-repository-mTpA6C` 갱신, 서명/게시/호스트 설치 false.

로그: `/tmp/tastedev-terminal-connection-regression.log`, `/tmp/tastedev-terminal-connection-build.log`, `/tmp/tastedev-terminal-connection-pty-http.log`, `/tmp/tastedev-terminal-connection-apt.log`. 실제 GUI·운영 설치·AI 인증 등 원래 미완료 범위는 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 포르투갈어·상태 오류 번역 최신 배포 검증

전체 회귀 503 PASS (`/tmp/tastedev-i18n-status-regression.log`), production build PASS (`/tmp/tastedev-i18n-status-build.log`), 추출 패키지 로그인 클라이언트의 포르투갈어 partial catalog 포함 및 인증·설정·PTY HTTP 검사 PASS. 첫 문구 검사에서 악센트 문자 빌드 이스케이프 때문에 false negative가 발생했으며, 실제 client chunk에서 catalog를 확인한 뒤 같은 catalog의 ASCII ‘Selecionar idioma’로 검사 기준을 수정했습니다. 동일 deb 재검증 PASS입니다. 실제 브라우저 언어 전환을 검증한 것은 아닙니다.

최신 deb SHA-256: `6c28bf4b8da2bd16a32e32ea16be5599911874658755233c7506381c1a303a07`. 증거: `.runtime/verification/package-2026-10-04T02-34-21.112Z.json`. 최신 deb와 로컬 APT 저장소에 pt-BR/pt-PT 공통 61개 번역, 영어 복구 안내 및 nginx 오류 번역을 반영했습니다. 호스트 설치·운영 서비스·서명·게시 없음.

로그: `/tmp/tastedev-i18n-status-verify.log`, `/tmp/tastedev-i18n-status-apt.log`. 전체 언어 UI·실제 GUI·운영 E2E·CLI/AI 인증 등 기존 미완료 요구를 유지하며 전체 목표 PARTIAL입니다.

## 2026-10-04 사용자 Bash CLI 프리셋 패키지 통합 검증

전체 회귀 501 PASS (`/tmp/tastedev-cli-profile-regression.log`), production build PASS (`/tmp/tastedev-cli-profile-build.log`). 임시 HOME/.bashrc의 PATH에서만 찾을 수 있는 테스트 Claude 명령을 인증된 packaged PTY HTTP로 실행하여 출력 marker와 exit 0을 확인했습니다. 실제 AI CLI/계정은 사용하지 않았습니다. CLI PATH 상태 조회·세션 폐기·로그인 보호 및 기존 설정/PTY 검사도 PASS입니다.

최신 deb SHA-256: `cbdb488fde5c284cda658087aecae2bd18c8f6fc5b6ab44b834a59c15b6e418d`. 증거: `.runtime/verification/package-2026-10-04T02-22-36.202Z.json`. 최신 deb와 로컬 APT 저장소에 Bash 프리셋 변경 및 안내 번역이 포함되었습니다. 호스트 설치·운영 서비스 변경·APT 서명·게시 없음.

현재 개발 계정 실제 CLI --version PTY 증거와 패키지 임시 CLI 프로필 검사는 서로 다른 범위입니다. 설치된 서비스 계정의 실제 CLI 인증·AI 대화·GUI/운영 E2E 및 전체 언어 UI 등 기존 요구는 미완료이며 전체 목표 PARTIAL입니다.

## 2026-10-04 터미널 CLI 상태 인증 HTTP·최신 배포 검증

CLI 드롭다운은 존재/부재를 구분하며 미설치 안내를 번역합니다. 패키지 검증용 PATH의 실행 권한을 가진 비프로그램 Codex fixture를 실행하지 않고 경로만 반환함을 인증 HTTP로 확인했습니다. 미로그인 terminal-context는 401입니다. 전체 회귀 499 PASS (`/tmp/tastedev-cli-context-regression.log`), production build PASS (`/tmp/tastedev-cli-context-build.log`), 추출 패키지 인증·설정·PTY HTTP 검사 PASS. 새 실행 환경 연결 보호와 nginx 복구 안내 21개 번역도 포함했습니다.

최신 deb SHA-256: `231e432251a9d07405de221f4d12826ceabd39cab4067b4df1af3ed4b9c9d6f3`. 증거: `.runtime/verification/package-2026-10-04T02-14-15.401Z.json`. 로컬 APT 저장소 갱신 로그: `/tmp/tastedev-cli-context-apt.log`. 호스트 설치·운영 서비스 변경·서명·게시 없음.

실제 Codex/Claude 로그인·CLI 실행 성공, GUI·운영 적용·전체 언어 UI 등 기존 미완료 요구는 남아 있습니다. CLI 경로 존재는 인증/실행 성공 증거가 아니며 전체 목표 PARTIAL입니다.

## 2026-10-04 nginx 요청 수명·다국어 최신 배포 검증

전체 격리 회귀 497 PASS와 production build PASS인 소스로 최신 deb를 생성했습니다. 추출 패키지 인증·설정·PTY HTTP 검사 PASS. 자동 터미널 탭 다국어 이름, Certbot 35개 안내 번역 및 nginx 헤더/백업/적용 검토의 연결 변경·늦은 응답·잠금 보호가 배포 파일에 반영됐습니다. 로컬 APT 인덱스/Release를 최신 deb로 갱신했습니다.

SHA-256: `0fb14d029a7348ba521c0bb9cdddc197cb9df58a442a27468210cc3b8ad9f402`. 증거: `.runtime/verification/package-2026-10-04T02-06-08.479Z.json`. 로그: `/tmp/tastedev-nginx-lifetime-deb.log`, `/tmp/tastedev-nginx-lifetime-verify.log`, `/tmp/tastedev-nginx-lifetime-apt.log`.

호스트 설치·운영 서비스 변경·서명·게시를 수행하지 않았습니다. 실제 GUI·운영 적용·전체 언어/CLI/AI E2E 등 기존 미완료 요구를 유지하며 전체 목표는 PARTIAL입니다.

## 2026-10-04 nginx 연결 수명·다국어 통합 검증

전체 격리 회귀 497 PASS (`/tmp/tastedev-nginx-lifetime-regression.log`), production build PASS (`/tmp/tastedev-nginx-lifetime-build.log`). 새 연결 수명 테스트는 scripts/run-tests.mjs의 \*.test.mjs 자동 수집을 통해 정식 회귀에 포함됩니다. nginx 검토·헤더·백업 연결 교체, 해시 계산 중 무효화, 자동 터미널 탭 다국어 이름, Certbot 35개 안내 번역 변경이 현재 production build에 반영됐습니다.

기존 deb SHA-256 `1db463b9e4703098cbd188eed784ffd6ee35bfa9db81f7c0693e4da55a5dbb36`은 이 후속 변경 이전 버전입니다. 최신 deb/저장소 갱신 및 기존 실제 GUI·운영 적용·전체 언어/CLI/AI E2E 요구는 남아 있습니다. 전체 목표 PARTIAL입니다.

## 2026-10-04 연결 변경 보호 배포 갱신 — 전체 PARTIAL

nginx API 연결 변경 시 이전 응답 무효화·새 트리 조회, Certbot/PostgreSQL 조회 중복 및 연결 변경 보호, 패키지 설치 안내 21개 번역이 최신 빌드와 deb에 반영됐습니다. 전체 회귀 493 PASS, production build PASS, 추출 패키지 인증·설정·실제 PTY HTTP 검사 PASS. 로컬 APT 저장소도 갱신했습니다. 호스트 설치·게시·서명은 수행하지 않았습니다.

deb SHA-256: `1db463b9e4703098cbd188eed784ffd6ee35bfa9db81f7c0693e4da55a5dbb36`.
증거: `.runtime/verification/package-2026-10-04T01-54-37.240Z.json`. 실행 로그: `/tmp/tastedev-connection-regression.log`, `/tmp/tastedev-connection-build.log`, `/tmp/tastedev-connection-verify.log`, `/tmp/tastedev-connection-apt.log`.

실제 브라우저 GUI, 운영 적용, CLI/AI 실 연결, 전체 언어 UI 번역 등 기존 미완료 요구는 남아 있습니다. 이 검증은 전체 완료를 증명하지 않습니다.

## 2026-10-04 최신 보안·nginx·번역 배포 검증

전체 격리 회귀 493 PASS, production build PASS. 최신 nginx root/alias GUI 항목과 보안 PTY 설명·서버 gate 활성화 안내, 로그인/권한 70개 번역이 deb에 반영됐습니다. 추출 패키지 인증·설정·PTY HTTP 검증 PASS. SHA-256: `21e6ed059724c65af330c88793cdede56b99a30758ddbf9ebadb9bed54780ad0`. 증거: `/mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-04T01-41-59.984Z.json`. 기존 개발 서버 8787의 로그인 HTTP 200과 미로그인 주요 경로 307을 확인했습니다. 실제 브라우저 화면/로그인 흐름 검증은 아닙니다. 호스트 설치·운영 서비스 변경·전체 Linux 언어 번역·실제 CLI/AI 연결 등 원래 미완료 범위는 남아 있으며 전체 목표 PARTIAL입니다.

## 2026-10-04 설치 계정/터미널 요구 갱신 — 전체 PARTIAL

설치 SUDO_USER를 일반 Linux 실행 계정으로 저장하고 systemd drop-in/웹 관리자 setup CLI에 적용하는 패키지 경로 구현. 알 수 없는 root 설치는 service setup 사용자명 안내 후 서비스 시작을 보류. 기록한 계정은 업그레이드에서 유지. Linux 비밀번호 수집 없음. 다른 실행 계정으로 자동 전환은 거부하며 기존 상태의 소유권 지정은 일반 파일/디렉터리 identity와 symlink/hardlink 거부로 제한. 실제 호스트 계정·systemd 변경은 수행하지 않았으며 fixture만 통과했다.

터미널 전체 너비 flex 규칙/탭 위 여백 제거, 중복 조회 전용 안내·하단 상태줄 제거, 상단 투명 아이콘 버튼 통일 및 탭별 화면/대기 입력 유지 구현. 전체 회귀 490개 PASS/build PASS. 마지막 systemd 부재 처리 후 관련 fixture 4개 PASS. 브라우저 실제 렌더·설치된 OS 계정 전환 및 Claude CLI/auth E2E는 미검증. 전체 원래 요구 미완료 범위는 유지한다.

## 2026-10-04 최신 배포 갱신 — 전체 PARTIAL

패키지 GUI 팝업 요청 수명, 서비스 확인 중복 방지, 소실된 터미널 세션의 재시작/탭 닫기, 새 셸 작업 ID 및 출력 sequence·종료 상태 보호가 최신 빌드와 deb에 포함되었다. 전체 회귀 485개 PASS, production build PASS, 격리 추출 패키지 PTY/auth HTTP 검증 PASS. SHA-256 08ad773af5c2eb8bc6359db7c42e6914c65723721ac1209ec87b741339cbb3d9. 로컬 최신 APT pool/index/Release 체크섬 PASS. 서명·게시·호스트 설치는 false. 실제 GUI/E2E·운영 적용·CLI/AI 실 연결·전체 언어 UI 번역 등의 기존 미완료 요구사항은 남아 있으므로 전체 완료로 처리하지 않는다.

## 2026-10-04 터미널 재접속 갱신 — 전체 상태 PARTIAL

최신 탭 터미널: 독립 PTY 세션, 최대 4개 동시 실행 예약, 기본 OS 계정, 설정/CLI 프리셋, 패키지 결과 출력, 살아 있는 서버 세션 재접속 복구, AI 로그 스냅샷 분석 진입점 구현. 전체 회귀 482개 PASS 및 추가 UI 스냅샷 검증 PASS. 프로덕션 build/i18n 체크 PASS. 배포 패키지 SHA-256 c9c24a55341dc3475f648d097aba0019ece1d4d95c3198e36baaaf7f2a67cf35, 추출 패키지 실제 PTY HTTP 검증 PASS(호스트 설치 false). 서버 재시작 후 세션 복원, 실제 브라우저 사용자 흐름, Claude CLI 설치/인증 및 Claude 앱 완전 동등성은 검증되지 않음. 기존 미완료 요구사항과 외부 검증 제한은 유지한다.

# 사용자 요구사항 완료 점검

전체 상태는 PARTIAL이다. 아래 범위는 원래 요청을 유지하며 개별 기능 검사 결과를 제품 전체 완료로 확대하지 않는다.

| 요구사항                                        | 현재 근거                                                                                                                                                               | 남은 작업·검증                                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Next.js 경로 페이지, 해시 URL 금지, 별도 로그인 | app 경로, 로그인 내부 경로 HTTP 이동 검사                                                                                                                               | 전체 메뉴의 브라우저 탐색 검증                                                                            |
| 로그인 필수                                     | auth 테스트, 미로그인 API 401, 보호 페이지 세션 검사                                                                                                                    | 브라우저 로그인·로그아웃·만료 흐름                                                                        |
| 왼쪽 아이콘: 현황·설치·도구·터미널              | ConsoleWorkspace 구현, 이전 부분 브라우저 증거                                                                                                                          | 현재 빌드의 전체 메뉴·반응형 확인                                                                         |
| 설치된 패키지 선택 후 특화 GUI                  | 패키지 라우트, 설정 스키마, PostgreSQL·MariaDB·Redis 파일 조회/폼 가져오기, 검증·다운로드·작업 폴더 저장, PostgreSQL root 소유 설정 적용 helper/API/GUI 및 복구 fixture | 운영 설정의 조회·편집·적용 기능을 패키지별로 완성하고 실제 환경에서 검증                                  |
| nginx.conf/conf.d 노드 트리와 server 블록 GUI   | tree/parser/history 테스트 및 이전 브라우저 증거                                                                                                                        | 현재 전체 편집 흐름과 실제 nginx 적용·롤백 E2E                                                            |
| nginx와 Certbot 연계, cron 보조 역할            | ServerManager 구현, 고정 helper 명령, cron 보존·삭제 검사                                                                                                               | 실제 DNS·ACME 테스트 환경, cron fixture 계정에서 적용/복구 E2E                                            |
| nginx·Certbot·Node.js·데이터베이스 설치         | 패키지 목록과 설치 helper, 허용 대상 검사                                                                                                                               | 실제 격리 장비에서 설치·실패·로그 검증                                                                    |
| 데몬·로그·백업/복구·보안·감사                   | API와 GUI, 단위 검사                                                                                                                                                    | 운영 변경과 복구 E2E, 전체 GUI 검증                                                                       |
| sudo 비밀번호 생략 옵션                         | 전용 권한·서버 gate, 관리 규칙 조회/미리보기/확인/변경 GUI 및 helper 트랜잭션, 격리 검사                                                                                | 실제 권한 변경·복구 E2E와 화면 검증 미완료. 현재 장비 sudo 설정은 변경 금지                               |
| 전체 영역 IDE·터미널                            | 편집·충돌·터미널 작업 테스트, 과거 부분 브라우저 증거                                                                                                                   | 현재 레이아웃과 전체 키보드·실행 흐름 확인                                                                |
| Tauri GUI IDE                                   | Rust 셸·원격 프론트엔드 설정, release 빌드 및 별도 desktop .deb 구성                                                                                                    | 실제 설치·데스크톱 실행·로그인·패키지 GUI 흐름 검증. bundle 활성화와 로컬 패키지 생성만으로 GUI PASS 아님 |
| 테마 토글 아이콘·디자인 참고 반영               | 테마/스타일 구현과 이전 화면 증거                                                                                                                                       | 현재 다크·라이트·초기 로딩·참고 디자인·모바일 전체 검증                                                   |
| Linux 언어 목록과 국기                          | locale 목록, 국기·fallback 테스트, 6개 주요 catalog와 ru/ar 기본 부분 catalog, RTL 코드 방향                                                                            | 전체 언어 UI 완전 번역 및 실제 언어 전환/RTL 화면 검증 미완료                                             |
| AI 오류 원인·해결 방법                          | API 연계·마스킹·동의·mock 응답 테스트, 렌더링 회귀 검사                                                                                                                 | 실제 API 응답은 이전 quota 오류로 미검증. 성공 응답·오류 UI 검증 필요                                     |
| tastedev-linux apt 배포                         | 로컬 .deb 생성·추출 서버 검증, 저장소 index/Release 생성, 합성 키로 격리 apt 인증·다운로드 SHA 확인·변조 거부, 업그레이드 invoker fixture                               | 운영 서명 키·HTTPS 게시 주소 확인, 최신 패키지 저장소 갱신, 실제 설치/업데이트 E2E 미완료                 |

브라우저 도구는 현재 사용자 탭 접근을 URL 정책으로 차단했다. 우회하지 않는다. QA-01 지침은 현재 장비의 sudo 설정·운영 서비스·apt upgrade 변경을 금지한다. 이 단계들은 격리된 DEV/설치 검증 환경을 확보해야 한다. 이 제한으로 코드 구현·문서·격리된 로컬 fixture 검증까지 중단하지 않는다.

MariaDB 추가 진행: main/include 조회 GUI 및 인증 API, private 전체 후보 생성·검사와 적용 트랜잭션 조합을 구현했다. 내부 실행기는 graph 충돌 확인·백업·교체·재시작 실패 복원을 임시 파일/대체 명령으로 검증했다(전체 테스트 112개 PASS). 실제 적용용 root helper/API/GUI 연결, 실제 MariaDB 검사와 재시작은 미완료다.

MariaDB 적용 연결 추가: 패키지 root runtime의 소유권/권한/파일 집합/hash 확인 후 helper 실행, 인증·DB 권한 API 및 GUI 재시작 확인을 구현했다. 테스트 116개와 빌드/HTTP 권한 차단 검사 통과. 실제 helper 성공 실행·MariaDB 검사/재시작·설정 백업 목록/수동 복원 GUI·서비스 별도 시작 옵션 해석·symlink main 지원은 남아 있다.

MariaDB 설정 백업 목록의 helper 검증·인증 GET·GUI 메타데이터 표를 추가했다. 임시 파일 검증과 HTTP 권한 차단, 전체 테스트 118개·빌드·패키지 검증 통과. 실제 root 조회 및 수동 복원 GUI/E2E는 미완료다.

MariaDB 복원 검토 helper/API/GUI를 추가했다. 지원 값 비교·현재 main/전체 연결 버전 대조·미포함 대상과 검토 중 충돌 거부를 fixture로 검사했고 전체 테스트 118개와 빌드/HTTP 권한 검사가 통과했다. 실제 전체 파일 복원 후보 생성·검사·서비스 재시작 실행은 여전히 미완료다.

MariaDB 전체 설정 파일 복원 helper/API/GUI 연결을 추가했다. 복원 후 include를 가상 해석해 새 참조 파일도 private 후보 검사에 포함하고, 직전 파일 백업 및 재시작 실패 복원을 fixture로 검증했다. 전체 테스트 123개와 빌드 통과. 실제 root/MariaDB 복원 E2E·브라우저 검증·서비스 별도 시작 옵션·symlink main 지원은 남아 있다.

MariaDB MainPID/실행파일/시작 main 검사와 GUI 확인을 추가했다. 명시적 다른 main·추가 defaults·지원 외 덮어쓰기 인수를 차단하고 적용/복원 전후에 재검사한다. 전체 테스트 128개·빌드·HTTP 권한 검사 통과. default-main-assumed는 전체 기본 파일/환경을 검증한 상태가 아니다. 중단 서비스 복원·지원 외 인수·실제 root/proc/DB E2E는 남아 있다.

MariaDB 11.4.13 실제 바이너리의 private 전체 후보/options-help 진단을 Docker Desktop 격리 환경에서 통과했다. image/binary SHA-256과 검사 방식·제약을 기록했다. DB/서비스/접속은 시작하지 않았고 systemctl은 mock이다. native 옵션 검사 증거는 추가됐지만 실제 root helper/systemd/DB 재시작·API/GUI E2E는 여전히 미완료다.

PostgreSQL 16.15 실제 postgres -C 후보 설정 진단 네 사례 PASS: 다섯 GUI 값/메모리 단위, 뒤쪽 include 덮어쓰기, 잘못된 옵션, 전체 복구 텍스트/include. 공통 Docker Desktop 진단 실행기 분리 후 MariaDB 네 사례 회귀도 PASS. DB 기동/접속·host mount·호스트 서비스 변경 없음. root helper/runuser/pg_ctlcluster·적용/재시작/복구·GUI E2E는 여전히 미완료이며 전체 PARTIAL이다.

Redis 명시적 main/실행 옵션 내부 검사와 덮어쓰기·민감 인수 거부 fixture를 추가했다. 아직 운영 helper/API/GUI 연결 전이며 process title 변경 시 원래 main을 증명하는 방법도 남아 있다. Redis 적용/백업/복구 요구사항은 미완료다.

Redis literal include 연결 메타데이터와 파일/그래프 버전 검사를 구현했다. glob/지원 외 구문·순환·unsafe 파일은 불완전 상태로 기록한다. 실제 root 적용/후보 진단/백업/복구 및 GUI 연결은 미완료다.

Redis include의 directory/\*.conf 패턴을 추가 지원한다. 숨김 파일 제외·파일 목록 SHA-256·빈 디렉터리·파일 추가/변경·symlink 거부 fixture를 검증한다. 다른 glob 패턴/escape는 아직 불완전 상태다. 목록의 ASCII 정렬은 구조 검사 용도이며 실제 Redis/libc locale의 최종 옵션 적용 순서를 증명하지 않는다. Redis 7.2 upstream config.c의 glob(0) 및 no-match 허용 동작을 확인했다: https://github.com/redis/redis/blob/7.2/src/config.c . helper/API/GUI 및 실제 native/운영 적용 검증은 미완료다.

Redis 그래프 순회 후 wildcard 디렉터리 목록을 다시 대조하고 내부 assertRedisGraphVersion precommit 검사를 추가했다. 최초 검사 이후 include 파일 추가/내용 변경을 409로 거부하며 잘못된 버전은 400이다. 파일 시스템 전체의 원자적 snapshot은 아니며 실제 트랜잭션/helper 연결과 변경 직전·서비스 활성화 전후 호출은 아직 필요하다. 운영 서비스 변경 없음.

Redis include 조회를 인증 GET redis-topology API와 패키지 GUI에 연결했다. 수동 조회·파일/연결/경고/버전 표시, 연결 해제 및 늦은 응답 제외를 구현했다. 원문/인증값은 응답에 포함하지 않으며 root 명령은 실행하지 않는다. production build PASS. 기존 package-config 렌더 테스트에 새 자식 컴포넌트 mock을 추가했다. 실제 브라우저 조작·운영 적용/복구와 새 .deb 갱신은 미완료다.

Redis private 전체 후보 생성기를 추가했다. main만 GUI 지원 값으로 patch하고 literal/include wildcard를 private 경로로 바꾸며 연결 파일과 빈 wildcard 디렉터리를 복사한다. source 파일을 변경하지 않는다. 생성 전후 graph 버전 및 복사할 파일 hash를 대조하고 디렉터리 700/파일 600, WeakSet 후보 등록 및 cleanup 등록 해제를 검사했다. 실제 Redis native 파서/최종 값 진단, full restore 후보, root helper/트랜잭션/API/GUI 적용 연결은 아직 남아 있다. 비공개 후보에는 인증값이 포함될 수 있으므로 HTTP 응답에 노출하지 않는다.

Redis 전체 복구 후보에 trusted restoreText 가상 main을 지원했다. 원본 graph 버전을 보존해 대조하고 복구 텍스트의 include 그래프를 별도로 생성해 새 참조 파일을 private 후보에 포함한다. 복구 텍스트 hash와 후보 graph 버전을 등록하고 생성 후 두 그래프를 다시 검사한다. 복구와 GUI 변경 동시 입력 및 미해결 복구 include는 거부한다. fixture에서 인증값을 포함한 전체 텍스트/새 include 복사와 원본 보존을 확인했다. 실제 백업 record의 root 검증/복구 실행/Redis native 검증/GUI 적용 연결은 미완료다. 새 internal 코드의 배포 빌드 갱신은 다음 연결 작업과 함께 필요하다.

Redis private 백업 record reader/catalog을 추가했다. UUID/고정 target/텍스트 hash/날짜/크기/UTF-8 및 fd O_NOFOLLOW·소유권·private 권한·nlink를 검사하고 목록에서는 text를 제외한다. opendir 전체 1000개 scan·목록 100개 한도를 둔다. private 임시 fixture로 정상 전체 record/민감값 없는 목록/공개 권한·잘못된 target·symlink 거부를 검증했다. root helper/API/GUI 연결과 실제 백업 생성·복구 실행은 미완료다. Redis 실제 native 후보 진단에 필요한 격리 서버 실행 승인 질문은 답변 대기 중이며 승인 전 서버를 시작하지 않는다.

Redis 백업 목록을 packaged runtime hash 확인 후 helper redis-backups, sudo 옵션/관리 모드 인증 GET API, 패키지 GUI의 메타데이터 표에 연결했다. root runtime closure는 11개 모듈이며 Redis 백업 reader의 dependency 검사도 추가했다. 서비스/설정 변경 명령은 없다. 실제 root 조회 성공·브라우저 조작·복원 GUI/실행은 미검증이다. 기존 .deb는 새 helper 연결을 아직 포함하지 않으며 다음 패키지 갱신이 필요하다.

Redis 복구 검토 helper redis-restore-plan 및 인증 GET을 추가했다. private backup record/root 부모/file hash 확인 후 main 지원 값만 비교하며 현재/복구 include 그래프 버전을 재대조한다. 원문과 인증값은 응답에서 제외한다. packaged runtime closure는 12개 모듈이다. VM 대체 root/runtime fixture로 값 비교·민감값 제외·graph 변경 거부를 검사했다. 실제 root 조회 성공·복구 GUI/실행·최종 native 후보 진단은 미검증이며 배포 빌드와 패키지 갱신도 남아 있다.

Redis 백업 목록에 복원 검토 선택과 지원 값 비교·전체 파일 영향 안내·경고 GUI를 연결했다. 연결/권한 변경 시 선택을 해제하고 늦은 조회 응답은 제외한다. 139개 테스트와 production build PASS, 8791 preview 반영. 실제 복원 실행은 연결 전이고 root/API 성공 및 GUI 조작은 미검증이다. 새 배포 패키지는 생성 진행 중이며 추출 검증이 남아 있다.

Redis 조회/복원 검토 포함 .deb 추출 검증 PASS(10376파일), SHA-256 79b59e06b32e0e8257daffb042ae52a08fc5b8edec46b40cfa8308ae93dc6e90, 설치 없음. 이어서 internal applyRedisConfig를 추가해 mandatory native validator/service inspection·private 후보·원본/후보 graph 재대조·백업/원자 교체·활성화 실패 rollback을 조합했다. 현재 validator/서비스 함수는 테스트 대체 함수만이며 실제 root dispatch/API/GUI 적용 연결은 하지 않았다. 임시 파일 fixture의 재시작 실패 복구 및 검증기 없는 요청 차단을 검사한다. 실제 Redis/서비스 실행은 없음.

Redis transaction fixture를 확대했다. 후보 검사 중 기존 include 변경은 409로 중단하며 백업/활성화가 없다. 활성화 중 main 외부 편집은 보존하고 자동 복원/서비스 recovery를 실행하지 않는다. 전체 복구가 새로 참조하는 include의 검사 후 변경도 precommit 409로 막고 main을 보존한다(직전 원본 백업은 검토용으로 유지). 실제 native Redis/서비스 실행이 아닌 대체 hook/임시 파일 검사다. root/helper/API/GUI 적용과 실제 E2E는 여전히 미완료다.

Redis 메모리 제거 정책을 공식 8개 정책으로 확장했다: noeviction, allkeys-lru/lfu/random, volatile-lru/lfu/random/ttl. schema와 생성기 선택값을 하나의 상수로 공유해 GUI/초안/live import에서 동일하게 허용한다. 모든 정책 왕복 및 알 수 없는 값/명령 주입 거부 fixture를 추가했다. 공식 자료 https://redis.io/docs/latest/develop/reference/eviction/ . 실제 Redis 설정 적용/동작 검증은 여전히 미완료다.

Redis GUI 운영 변경 계획에 complete include graph 버전을 연결했다. 계획 생성 전후 topology를 대조하고 main 파일 snapshot과 graph 파일 hash를 맞춘다. graphVersion이 주어지면 stale include를 409로 거부한다. 지원 값만 비교하며 최종 native 설정값을 증명하지 않는다. source/include fixture 검사 포함 전체 145개 PASS. 실제 적용/복구와 native Redis 검증은 미완료다. 배포 .deb는 최근 schema/plan 변경을 아직 포함하지 않는다.

임시 계정/18793 검증 서버의 실제 HTTP 회귀 PASS. Redis topology/backups/restore-plan 미로그인 401, topology 로그인 후 200(metadata only), backups/restore-plan sudo 비활성 403을 확인했다. Redis 허용 대상 경로를 graph 조회 전에 검사해 잘못된 경로는 400을 유지한다. 전체 테스트 145개 및 build PASS. 증거 .runtime/verification/redis-topology-http.json. 관리자 기능 전부 false, 임시 workspace/state/auth 사용 후 검증 서버 종료 및 fixture 삭제, 운영 OS 변경 없음. 실제 root 조회 성공과 GUI 클릭/Redis 적용/복구는 미검증이다.

Redis include/백업/복구 검토의 제목·graph 안내·복구 미연결 안내·디렉터리 변경 경고·재조회/대상 오류 등 8개 문구를 영어·일본어·중국어·독일어·프랑스어·스페인어에 추가했다. 전체 테스트 145개 PASS. 전체 Linux locale 완전 번역이나 주요 언어 전체 UI 완전 번역 완료를 뜻하지 않으며 나머지 누락 문구 및 브라우저 언어 전환 검증이 남아 있다.

Redis topology/candidate/backup reader는 open 전에 일반 파일 여부를 검사하고 O_NONBLOCK|O_NOFOLLOW로 열어 FIFO 교체에도 writer를 기다리지 않도록 보완했다. 실제 mkfifo 임시 fixture의 include/백업 거부 검사 포함 전체 146개 PASS. 특수 파일 조회로 무한 대기하는 경로를 수정했으며 운영 파일/서비스 변경 없음. 실제 root/native/GUI 전체 E2E는 여전히 미완료다.

최근 Redis 8개 제거 정책/계획 graph 검사/6개 언어 문구/특수 파일 거부를 반영한 .deb 생성·추출 검증 PASS(10376파일). SHA-256 fcec5f55fdfc14242ee3a9eef6021cfc1bf9dd319bb525e9650261cc4b9a5ab3. Redis topology/backups runtime의 hash와 실제 module export import까지 추가 확인했다. 증거 .runtime/verification/package-2026-10-03T02-29-14.782Z.json. installed:false. 실제 설치/업데이트·root/Redis 적용/복구·GUI E2E와 전체 locale 번역은 미완료다.

Redis 폼에서 선택한 제거 정책의 설명을 표시한다. 전체 키/TTL 대상, 근사 LRU/LFU/무작위/TTL 우선, noeviction 쓰기 거부를 구분하며 TTL 대상 없음 및 maxmemory=0의 영향도 안내한다. 한국어/영어 리소스를 추가했고 기타 언어는 영어 fallback이다. 전체 테스트 146개 PASS. 설명 기준 https://redis.io/docs/latest/develop/reference/eviction/ . 실제 정책 실행/브라우저 선택 E2E와 전체 요구사항은 미완료다.

테마 버튼의 localStorage 예외 경로를 수정했다. 화면/메모리 선택을 먼저 적용하고 저장 실패는 색상 변경을 막지 않는다. media 변경 시 수동 선택을 우선하며 storage event로 다른 탭의 테마 변경을 반영한다. 기존 회귀 146개 PASS. 실제 저장소 차단/탭 간 동기화 브라우저 E2E는 접근 제한으로 미검증이고 전체 목표 PARTIAL이다.

테마 버튼 SWC 컴파일 후 대체 React hooks/storage/media/window fixture로 저장 실패와 읽기 실패에도 DOM 테마 적용, media 이벤트 뒤 수동 선택 유지, 관련 storage 이벤트 동기화, 무관한 key 무시, 이벤트 cleanup을 검사했다. 이는 로직 단위 검사이며 실제 브라우저 로그인/페이지 이동/초기 paint 확인을 대체하지 않는다. 화면 runtime 변경 없이 회귀 증거만 추가했다.

초기 테마 script를 theme-init.mjs로 분리하고 storage 오류와 matchMedia 오류를 독립적으로 처리한다. 저장소가 차단돼도 OS dark 선호를 유지하며 명시적 light/dark는 시스템값보다 우선한다. VM에서 저장/차단/잘못된 값/환경 API 없음 초기 결정 검사를 추가했다. 실제 browser first-paint/페이지 이동 E2E는 미검증이다.

웹 터미널 stdout/stderr를 별도 StringDecoder UTF-8 스트림으로 해석하도록 변경했다. 실제 일반 사용자 shell fixture에서 한글/emoji 바이트를 시간차로 나눠 출력해 원래 문자열로 결합되는지 검사한다. 운영 서비스 명령/원격 접속은 실행하지 않는다. 현재 터미널은 비대화형 120초 job이며 PTY/대화형 입력 및 실제 브라우저 E2E는 미완료다.

웹 터미널 pipe stdin 전송과 EOF를 추가했다. terminal-input 인증/동일 출처/terminal 권한 API, 4096바이트 입력 제한·대기 버퍼 한도·종료 작업 거부를 적용한다. GUI 입력은 useState만 사용하고 draft/history/job metadata에 입력 원문을 저장하지 않는다. child 자체가 출력하는 입력은 stdout로 보일 수 있다. 실제 read/cat 일반 사용자 임시 shell fixture 및 종료 뒤 입력 거부 검사 PASS, 전체 148개 PASS. PTY/대화형 SSH·sudo·브라우저 조작 E2E는 미완료다.

terminal-input의 완료/차단/실패를 route 감사 기록에 포함했다. 임시 계정/18793 서버에서 미로그인 401, 로그인 후 terminal 권한 비활성 403, blocked 감사 event, 입력 원문 비포함 실제 HTTP PASS. 증거 .runtime/verification/terminal-input-http.json. build PASS. 실행 terminal/admin flags false였고 OS 서비스 변경 없음. PTY/실제 GUI 입력 E2E와 전체 목표는 미완료다.

러시아어/아랍어 로그인·기본 탐색 24개 문구 catalog를 추가했다. 지역 locale도 공유 catalog를 사용하며 나머지는 기존 영어 fallback이다. 영어 기준 catalog 항목 coverage를 계산해 목록의 부분 번역은 Partial UI, catalog 없는 언어는 English UI로 표시한다. coverage는 실제 모든 동적 UI 문구의 완전 번역을 증명하지 않는다. 전체 149개 테스트 PASS. RTL 실제 레이아웃/브라우저 전환 및 전체 locale 완전 번역은 미완료다.

RTL 언어에서도 IDE 코드 캔버스·설정 코드 textarea·디스크 비교 pre·터미널 명령/표준 입력·출력 및 콘솔 로그에 dir=ltr을 지정했다. 번역된 label과 메뉴의 언어 방향은 유지한다. TextInput은 dir을 실제 input에 전달한다. 기존 149개 테스트 PASS. 실제 브라우저 RTL 배치 검증과 전체 목표는 미완료다.

최근 테마·터미널 stdin·ru/ar 부분 번역·RTL 코드 방향을 포함해 웹 .deb 재생성. SHA-256 48145d00057554143b1ce8a2ad946b7228837b8286077b6f57c5fd6a069f3d40. 검증기는 현재 .next BUILD_ID와 패키지 BUILD_ID, 서버 실행/계정 설정/auth runtime 원본 bytes 일치를 추가 검사한다. 10376 파일 package verification PASS; 증거 .runtime/verification/package-2026-10-03T02-50-47.377Z.json. installed:false. 실제 apt 설치·업데이트·운영 서비스 E2E 및 전체 목표 PARTIAL.

Node.js 설정 GUI에 앱 수신 주소(127.0.0.1/::1/0.0.0.0/::) 추가. 서버 configProfile이 allowlist를 검사하고 HOST 환경 변수로 생성한다. 기존 저장 초안은 schema 기본값과 병합해 새 필드 누락을 보완한다. 전체 인터페이스 선택 안내 및 기존 6개 번역 catalog 문구 추가. injection/invalid host rejection과 기본값 검사 포함 전체 150 테스트 PASS, build PASS, 로컬 preview 반영. 실제 앱 환경 파일 로딩·서비스 적용/재시작은 아직 미연결; 전체 PARTIAL. 직전 .deb는 이번 Node.js 변경을 포함하지 않는다.

Node.js GUI에 환경 파일 내용 붙여넣기→지원 항목 검토→폼 반영 연결. lib/node-env.ts는 NODE_ENV/PORT/HOST/NODE_OPTIONS의 단일 max-old-space-size/LOG_LEVEL만 허용하며 중복/범위/실행구문/추가 Node 옵션을 거부한다. 알 수 없는 변수 이름·값은 결과에 남기지 않고 개수만 반환한다. parser는 브라우저에서만 실행하며 API/서버에 원문을 전송하지 않는다. 검토 성공 시 원문을 지우고 지원 값만 계획에 보존한다. 전체 152 테스트 및 build PASS; 실제 GUI 이벤트 E2E 미검증, 영어 외 새 문구 번역과 앱 적용/재시작 연결 미완료. 최신 .deb에 이번 변경 미포함. 전체 PARTIAL.

Node 환경 가져오기 검토/반영 이벤트를 SWC 변환 및 대체 hooks fixture로 검증: 검토 전 onImport 미호출, 원문 삭제, secret 미포함 계획, 명시적 폼 반영, 중복 오류 및 계획 없음 확인. 실제 Node v24.21.0의 --env-file 임시 실행으로 생성 환경 변수와 NODE_OPTIONS 적용 확인. V8 total heap은 old-space 외 공간을 포함하므로 단순 128MB 비교 대신 동일 --max-old-space-size=128 명령줄 실행의 heap_size_limit과 일치 검증한다. 임시 파일/진단 프로세스만 사용, 포트/서버/운영 서비스 시작 없음. 전체 154 테스트 PASS. 브라우저 E2E와 실제 서비스 적용은 여전히 미검증, 전체 PARTIAL.

Node.js 환경 GUI에 로컬 파일 선택→브라우저 읽기→지원 값 검토→폼 반영 연결. readNodeEnvFile는 실제 Blob bytes 256KB 제한, fatal UTF-8, NUL 거부. 선택 input 값을 즉시 지워 동일 파일 재선택 가능. async generation으로 새 입력/clear/disabled/unmount가 이전 파일 결과를 무효화한다. 파일 이름·본문 서버 전송 없음. 실제 Blob과 지연 promise fixture로 입력 수정 후 늦은 파일 결과 차단, 정상 파일 반영, oversized 사전 거부 및 non-UTF8/NUL 오류 확인. 전체 155 테스트 PASS. 실제 브라우저 파일 선택 E2E와 운영 앱 적용 미검증, 최신 배포 패키지에 미포함, 전체 PARTIAL.

최신 Node GUI/환경 파일 불러오기 변경 포함 .deb 재생성 SHA-256 2b1ea23066558455bf958e1bd59bdb1e2671a72b41f7e1a3d1a748b73334a9ee. package verifier는 추출 app scripts/start-server.mjs를 실제 실행하며 임시 상태/auth/workspace, 별도 loopback port, 전 운영 flag false를 사용한다. 서버 Ready 뒤 /login HTML password 입력, /api/auth/status 미설정·미인증, /ide/packages/nodejs 및 /terminal 로그인 redirect, /api/status 401 확인. 소유한 process group 종료 및 임시 추출물 cleanup. 10376 파일과 서버 HTTP package verification PASS; 증거 .runtime/verification/package-2026-10-03T03-05-01.927Z.json. installed:false. 실제 apt 설치/업데이트/systemd/인증 후 GUI·권한 작업 E2E는 미완료, 전체 PARTIAL.

배포 패키지 실제 임시 서버 HTTP 검증 확장: 추출 packaged auth/passwordHash/storeCredentials로 임시 fixture 계정 생성, 실제 로그인 cookie·사용자명, 인증 후 Node IDE 200 확인. config-save 기본 read-only 403 후 임시 security fileEditing 허용, Node 초안 생성·API 조회·실제 임시 작업 파일 bytes/version 일치 및 감사 event 확인. 비밀번호 변경 기존 cookie 401/기존 비밀번호 401/새 비밀번호 로그인 200, 로그아웃 후 cookie 401 확인. fixture만 변경했으며 실제 관리자 계정과 운영 설정 변경 없음. package verification PASS, 증거 .runtime/verification/package-2026-10-03T03-07-09.751Z.json, 동일 .deb SHA 2b1ea23066558455bf958e1bd59bdb1e2671a72b41f7e1a3d1a748b73334a9ee, installed:false. UI 브라우저 E2E/실제 apt-systemd/운영 작업은 미완료, 전체 PARTIAL.

Node.js 환경 파일 가져오기 15개 새 안내/오류 문구를 ja/zh/es/fr/de에 추가하고 공통 설정/값 표 제목을 en/ja/zh/es/fr/de에 보완했다. 이 화면과 parser의 정적 t/Error 문구를 추출해 기존 6개 main catalog 누락/빈값/원문그대로를 검사하는 regression 추가. config-translations+i18n 관련 6 테스트 PASS. 전체 Linux locale 완전 번역 및 실제 브라우저 언어 전환은 미완료. 최신 .deb는 이번 번역 변경을 포함하지 않는다. 전체 PARTIAL.

Node.js 기존 환경 파일 선택 항목 변경용 내부 patchNodeEnv 추가. 검증된 environment/port/host/memory/logLevel만 치환, 미지원 변수·비밀값·주석·export prefix·CRLF 보존, 누락 항목만 추가. known 변수 중복/추가 NODE_OPTIONS/명령 주입/미지원 변경/256KB 초과 거부. patch+parse+실제 Node runtime 관련 6 테스트 PASS. 아직 API/GUI/서비스 적용에 연결되지 않은 기반 모듈이며 실제 환경 파일 변경 없음. Node 대상 앱 경로/명령/서비스 이름 또는 GUI 등록 방식 질문 대기 중. 전체 PARTIAL.

NodeWorkspaceEnv GUI 및 node-env GET/POST API 연결. 작업 폴더 app.env 또는 app.env.local 파일만 상대 경로 허용, GET은 지원 values/version/skipped만 반환하며 미지원 변수 원문 미노출. GUI 파일값/현재 폼 비교→확인→POST 변경 저장. POST 로그인/same-origin/fileEditing/confirm/64hex version 검사, patchNodeEnv로 비밀 변수·주석 보존, saveCode에서 최종 version 충돌 재검사. node-env 요청/완료/차단 감사 연결, 본문 미기록. 실제 임시 workspace write/read와 stale409, confirm400, traversal/absolute/non-env 거부, 인증401 및 정책403 검사 포함 전체160 테스트 PASS, build PASS, preview 반영. 운영 앱 경로·재시작 미연결, 백업/원자 교체는 기존 saveCode 이상의 보강 미완료, 새 GUI 문구 다국어/실제 이벤트 E2E 및 최신 .deb 반영 미완료. 전체 PARTIAL.

Node 작업 폴더 env 변경을 기존 configTransaction 후보 검증/백업/rename 교체로 연결. workspace fileWrites와 transaction lock 사용, 실행 계정 소유·타인 쓰기 불가 파일/디렉터리 검사. 변경 전 private node-env-backups/UUID.json(0600)에 원문/version 보존, GUI에 backupId 표시. no-op 변화는 백업 없이 유지. 공통 configTransaction 읽기에 NONBLOCK 추가해 특수 파일이 열릴 때 대기 방지. 실제 임시 workspace 파일 원본 백업 bytes/version/mode 및 변경 후 값 검사 포함 전체160 테스트 PASS, build PASS. 실제 앱 재시작/백업 복원 GUI 미연결. 교체 직후 외부 변경으로 transaction failed 반환 시 API·GUI 실패 표시 보강 필요(현재 결과 saved:false를 GUI에서 별도 처리하지 않음). 최신 .deb 반영 및 전체 목표 PARTIAL.

Node 환경 transaction failed 결과가 GUI 정상 저장 baseline으로 반영될 수 있는 누락 수정. 공통 requireNodeEnvSaved 경계에서 saved:true/failed 없음/64hex version/values object만 성공 인정. 실패 및 교체 이후 backupId 포함 예외는 원문 reason을 노출하지 않고 재조회409·검증된 UUID 백업 ID만 안내. GUI도 같은 경계를 적용하며 오류 시 snapshot/confirm 해제해 재조회 요구. 실패/잘못된 응답/외부 변경 결과에서 baseline 미변경 및 private diagnostic 미노출, 정상/no-op 결과 검사 추가. 전체162 테스트 PASS 후 예외 backupId 전달 보강 및 결과 관련2 tests PASS, build PASS, preview 반영. 실제 외부 변경 타이밍 HTTP/GUI E2E 및 백업 복원·운영 앱 적용/재시작 미완료. 최신 .deb 미반영, 전체 PARTIAL.

Node 환경 백업 조회 node-env-backups GET 및 NodeEnvBackups GUI 연결. 실행 계정 소유 private backup 경로/파일(단일 링크·NOFOLLOW·NONBLOCK·fatal UTF8·크기·UUID·날짜·내용 SHA) 검증, target을 현재 workspace 안 상대 env 이름으로 제한. HTTP 메타데이터에 ID/name/date/version/bytes만 포함, 원문/비밀 값/absolute workspace root 미노출. 최대1000 entry 스캔/100개 recent 표시와 경고수/truncated 반환. 실제 private fixture에서 원문 미노출, 외부 target·0644·symlink 제외 검사. 전체163 tests/build PASS, preview 반영. 복원 검토/실행 GUI, 실제 HTTP/E2E 및 새 문구 번역/최신 .deb 반영 미완료, 전체 PARTIAL.

Node 환경 백업 목록에서 복원 검토 버튼→node-env-restore-plan GET→현재 지원 값/백업 지원 값 비교 GUI 연결. ID/name/current version/backup version/date/change/지원 field 및 full-restore 영향 안내만 반환. 비밀 값/원문 반환 없음. 현재 파일과 실제 생성 백업 fixture에서 port3100→3000 비교, 버전 대응, secret 미노출 및 경로형 ID 거부 확인. 전체164 tests/build PASS, preview 반영. 복원 실행 버튼은 아직 미연결이라고 명시, 실제 브라우저/HTTP 검증·다국어·최신 .deb 반영 및 운영 앱 재시작 미완료. 전체 PARTIAL.

Node 환경 백업 복원 실행 연결: node-env-restore POST는 로그인/same-origin/fileEditing/confirm 및 current version/backupVersion/name 일치 확인, 검증된 backup 원문만 transaction transform으로 사용. 백업 재조회는 transform·beforeCommit에서 수행하고 최종 file version 재검사 및 원자 교체 전 현재 파일 새 비공개 백업 생성. GUI whole-file 영향 확인→복원, 결과 검증 및 undo backupId 표시, parent 조회 baseline 무효화. 요청/완료/차단 감사 기록 연결. 임시 파일에서 지원 값 원복·복원직전 새 백업 생성, 잘못된 대상409/미확인400/오래된 파일409 및 API 인증401/권한403 검증. 전체165 tests/build PASS, preview 반영. 실제 브라우저/패키지 HTTP 복원 E2E·백업 변경 타이밍 테스트·새 문구 다국어·최신 .deb 및 운영 앱 재시작 미완료, 전체 PARTIAL.

Node 환경 백업 검토 뒤 backup text/hash 변경409 및 실제 복원 원문 bytes 일치 regression 추가, 전체166 tests PASS. 최신 .deb 재생성 SHA-256 a0dfa733f0fc2d7d4db73cfc53ef52d4d937efd8f2e3e9a0ef82b6fd711cc57d. 추출 패키지 임시 HTTP 서버에서 인증후 synthetic secret 환경 파일 저장→지원 값 조회(원문 미노출)→port 변경/백업 생성→stale409→백업 metadata/복원 plan secret 미노출→복원/undo backup 생성→파일 API 및 실제 filesystem original bytes/version 일치→stale restore409, 감사 secret 미포함 확인. package verification PASS 10376 files, 증거 .runtime/verification/package-2026-10-03T03-28-14.774Z.json, installed:false. 실제 apt-systemd/브라우저 GUI·운영 앱 재시작·전체 locale 및 기타 전체 범위 미완료, 전체 PARTIAL.

Node workspace GUI에서 복원 완료가 parent generation을 무효화할 때 pending perform finally가 busy 해제를 건너뛰는 경로 수정. 복원 callback에서 snapshot/confirm뿐 아니라 busy/error도 명시적 해제. SWC·대체 hooks·지연 API promise로 조회 중 restore callback→입력 활성화→늦은 조회 응답 폐기→옛 baseline 재등장 없음 검사 PASS, build PASS 및 preview 반영. 실제 브라우저 동시 동작 E2E 미검증, 최근 .deb에 이 GUI 수정 미반영. 전체 PARTIAL.

configProfile/databaseConfigProfile 정수 검증을 명시적 number 또는 십진 숫자 문자열만 허용하도록 강화. Redis maxMemory null/false/빈문자열/빈배열이 Number()로 0 변환돼 메모리 제한을 끄는 경로와 true→1 포트/작업메모리 변환 차단. booleans/null/arrays/objects/공백/지수·16진 문자열/줄바꿈 거부, 명시적 0 및 HTML 폼 decimal strings 지원 regression 추가. 전체169 tests/build PASS, preview 반영. 실제 DB 파일/서비스 변경 없음. 최신 .deb에 검증 수정 미포함, 전체 PARTIAL.

전체 요구사항 표와 현재 source 재검토 중 독립 root helper port/pgInput에도 Number coercion이 남은 것을 발견해 수정. nginx 포트·PostgreSQL 수치 필드는 명시적 number/십진 문자열만 인정한다. CJS helper를 VM에서 읽고 fs/process 접근을 금지하는 fixture로 bool/null/array/object/지수·16진/공백 입력 거부와 valid decimal 허용 확인, 실제 root 명령 없음. 전체170 tests/build PASS, preview 반영. root helper 변경은 최신 .deb에 아직 미반영. 현재 핵심 미완료는 Redis native/helper apply, Node 앱 등록·서비스 재시작, 실제 apt/GUI/운영 E2E, 전체 locale 번역/AI live 응답이며 원래 전체 범위 유지. 전체 PARTIAL.

미응답 Node 대상 앱 질문은 GUI 등록 방식으로 진행한다고 명시하고 NodeApps GUI·node-apps GET/POST 등록 저장 연결. ID/label/absolute directory/relative js-mjs-cjs entry/relative environment filename(.env 허용)/고정 tastedev-node-ID.service metadata 저장. 인증/same-origin/fileEditing 및 감사, private state directory·owner/mode/no symlink·NOFOLLOW/NONBLOCK·fatal UTF8·64KB/50개 제한·중복 ID·version 충돌·lock/atomic rename 적용. 등록은 앱 파일 존재 확인이나 실행/서비스 설치를 수행하지 않는다. profile traversal·임의 unit 입력 무시·유효 등록·stale 목록409 검사 포함 전체172 tests/build PASS, preview 반영. 등록 앱 실행파일 검증/환경 편집 연결·서비스 설치/시작/재시작과 다국어/GUI/실제 HTTP·최신 .deb 반영 미완료. 전체 PARTIAL.

등록 Node 앱 파일 확인 node-app-files GET/API GUI 연결. 요청 ID는 저장된 registry profile로만 해석한다. 폴더 전 경로 no symlink, 앱 안 경로 root/현재계정 소유·타인 write 불가 검사, 단일 링크 regular file NOFOLLOW/NONBLOCK, 실행파일4MB/환경256KB, 읽기 전후 inode/dev/size/mtime 확인 및 SHA 반환. 환경파일은 private mode 요구, fatal UTF8/지원 값만 파싱해 unknown secret/code content 응답 미포함. GUI는 실제 저장된 앱 directory를 표시해 미저장 폼과 검사 대상 구별. 실제 임시 fixture에서 throw 코드 실행 없음, 지원 port/secret 미노출, env0644·symlink·중간0777 디렉터리 거부·미등록404 검사 포함 전체173 tests/build PASS, preview 반영. 이 ready는 파일 조회 조건 충족만 뜻하며 실제 코드 startup/systemd/Node 문법 검증 PASS가 아니다. 서비스 설치/재시작·등록 환경 변경·다국어/GUI/패키지HTTP 및 최신 .deb 미완료, 전체 PARTIAL.

### 2026-10-03 — 등록 Node 앱 서비스 설정 검토

- 등록 앱의 파일·목록 버전을 확인한 후 고정 systemd unit 설정을 GUI에서 검토하는 기능을 추가했다. 서비스 설치/시작은 수행하지 않는다.
- 숫자 실행 계정, 고정 Node 실행 파일, 셸 없는 인수, systemd 경로 특수문자 처리를 적용했다.
- 174개 테스트 PASS. 실제 systemd-analyze가 WorkingDirectory 따옴표 오류를 발견해 수정했다. 이후 설정 문법 오류는 보고되지 않았으나 /usr/bin/node가 없어 전체 verify는 FAIL이며 실행 검증은 미완료다. GUI에서 실행 파일 부재와 Node --env-file 지원 확인 필요를 표시한다.
- 전체 상태 PARTIAL. Node 서비스 적용, Redis 운영 적용, GUI/E2E 및 배포 검증은 여전히 남아 있다. 현재 deb는 이번 소스 변경을 포함하지 않는다.

### 2026-10-03 — Node 실행 환경 진단

- 등록 앱 서비스 검토에 고정 /usr/bin/node 경로·버전·환경 파일 지원 상태를 연결했다. root 소유 및 쓰기 권한을 검사한 실행 파일에서 격리된 환경으로 --version만 조회하고, 3초 시간 제한과 1KB 출력 제한을 적용한다. 앱 코드는 실행하지 않는다.
- Node 공식 문서 https://nodejs.org/api/cli.html#--env-filefile 의 v20.6.0 도입 경계로 옵션 지원을 판단한다. 이는 실제 앱 시작 합격을 뜻하지 않는다.
- 176개 테스트 PASS. 새 앱 선택 시 이전 파일/서비스 검토 결과를 초기화한다. 전체 상태 PARTIAL이며 운영 적용·배포 및 GUI 검증은 남아 있다.

### 2026-10-03 — 현재 Node 기능 포함 deb 갱신 및 HTTP 검증

- tastedev-linux_0.1.0_amd64.deb를 현재 production build로 재생성했다. SHA-256: e55ff70bddc5f2b6e1d50626fae6d020f459a1ddd0dad29ef7fa3d6ae41633d0.
- 패키지를 임시 폴더에 추출해 10376개 파일, build ID 및 런타임 일치, 권한/체크섬/유지관리 스크립트와 격리 서버 HTTP 검증 PASS. 실제 설치는 수행하지 않았다.
- HTTP 검증에 등록 Node 앱 저장/409 충돌, 비공개 파일 상태와 지원 필드만 조회, 등록 버전에 연결된 고정 서비스 설정 검토/런타임 메타데이터, 없는 앱 404를 추가했다. 기존 로그인·비밀번호 교체/세션 폐기·설정 저장/복구 검증도 PASS.
- 증거: .runtime/verification/package-2026-10-03T03-51-45.391Z.json. 전체 상태 PARTIAL. 앱의 실제 서비스 설치/시작과 apt 저장소 게시/설치/업데이트, GUI 검증 등은 미완료다.

### 2026-10-03 — Node 앱 등록 해제 GUI 및 패키지 검증

- 앱 등록 해제 API와 GUI 확인 체크박스를 추가했다. fileEditing 권한/로그인/동일 출처 게이트, 현재 목록 버전 확인과 잠금/원자적 저장을 사용한다. 앱 파일이나 서비스는 삭제/중지하지 않는다.
- 확인 누락 400, 오래된 버전 409, 없는 앱 404와 다른 등록 앱 보존 검사 포함 177개 테스트 PASS. production build PASS.
- 새 deb SHA-256 7220b5c93eeade916095e065e949dc04ca8f4bf278133a13500708f36942885a. 10376개 파일과 임시 서버 HTTP 검증 PASS; 등록 해제 후 원본 .env 바이트 보존을 확인했다. 설치는 수행하지 않았다. 증거 .runtime/verification/package-2026-10-03T03-54-22.562Z.json.
- 로컬 미리보기 반영. 전체 상태 PARTIAL이며 실제 서비스 적용/배포 설치·업데이트 및 GUI 검증은 남아 있다.

### 2026-10-03 — 등록 앱 서비스 설정 다운로드

- Node 앱 서비스 검토의 정확한 text/unit 이름으로 .service 파일 다운로드를 추가했다. 다운로드는 브라우저 Blob에서 수행하며 운영 파일 저장/서비스 실행은 수행하지 않는다. production build PASS. 기존 테스트는 177개 PASS이며 이번 다운로드 클릭의 실제 브라우저 검증은 접근 제한으로 미완료다.
- lib/operations.mjs와 scripts/admin/linux-admin 서비스 허용 목록은 고정 6개 시스템 데몬이다. 등록 Node 앱용 설치/시작 helper는 아직 없다. 임의 unit 이름으로 기존 제어 게이트를 우회하지 않았다. 전체 상태 PARTIAL, 최신 deb는 이번 다운로드 버튼 변경 전 빌드다.

### 2026-10-03 — 등록 Node 앱 서비스 상태 조회

- 인증된 GET node-app-service-status와 GUI 조회 버튼을 추가했다. 등록 목록에서 파생한 고정 unit만 systemctl show로 조회한다. 3초/4KB 제한과 최소 환경을 사용하며 앱 실행/서비스 변경은 수행하지 않는다.
- LoadState/ActiveState/SubState/UnitFileState만 파싱해 반환하고 중복/누락/임의 속성은 거부한다. 실패 시 원본 stderr/환경값 없이 조회 불가 안내를 반환한다. 179개 테스트 PASS.
- GUI JSX 연결 오류를 빌드에서 발견하고 수정했다. 실제 브라우저 조작 및 실제 systemd 상태 조회 성공/앱 서비스 시작은 미검증이다. 전체 PARTIAL. deb는 이번 상태 조회 기능을 포함하지 않는다.

### 2026-10-03 — 등록 Node 앱 로그 및 AI 도우미 연결

- 인증된 node-app-logs 조회와 독립 GUI 컴포넌트를 추가했다. 등록 목록에서 파생한 unit에 고정 journalctl 조회(최근 150줄, 3초/64KB 제한, 최소 환경)를 사용한다. 사용자 입력으로 다른 unit을 선택할 수 없다.
- 기존 민감 정보 패턴 마스킹 후 로그를 반환한다. 오류 시 원본 stderr 대신 권한/크기 안내만 반환한다. GUI 조회 기록은 React 메모리에만 유지하며 선택/연결 변경과 unmount 시 늦은 응답을 무시한다.
- 기존 AI 도우미에 로그를 연결했다. 로그 불러오기/내용 검토/명시적 전송 동의 후 분석하는 흐름을 유지한다. 실제 유료 API 호출은 하지 않았다. 180개 테스트 PASS.
- 실제 앱 journal 조회 성공, GUI 클릭, AI 성공 응답은 미검증이다. 전체 상태 PARTIAL. deb는 이번 로그/상태 기능을 아직 포함하지 않는다.

### 2026-10-03 — AI 화면 지연 응답 무효화

- AI 도우미에서 연결/소스/로그 변경과 unmount 시 request revision을 무효화하고 busy/표시 상태를 초기화한다. 상태 조회·로그 preview·분석 결과뿐 아니라 늦게 도착한 오류와 finally도 현재 요청일 때만 UI를 갱신한다.
- SWC 컴파일된 컴포넌트의 대체 hook fixture로 연결 해제 후 상태 응답 무시, 소스 변경 후 이전 preview 오류 무시를 재현했다. 초기 테스트 fixture state 인덱스를 수정 후 전체 181개 테스트 PASS, production build PASS. 실제 브라우저/유료 AI API 검증을 대신하지 않는다.
- 로컬 미리보기 반영. 전체 PARTIAL이며 최신 deb는 이번 및 직전 로그/상태 조회 변경을 포함하지 않는다.

### 2026-10-03 — Node 앱 GUI 다국어 확장

- Node 등록/파일 확인/서비스 상태/설정 검토/다운로드/등록 해제/로그 조회와 입력/상태 제목 및 해제 확인 안내 20개 문구를 8개 catalog(en/ja/zh/de/fr/es/ru/ar)에 추가했다. 총 160개 번역 항목. 기존 항목은 보존한다.
- i18n 경계/지역 locale/fallback/부분 번역 coverage 검사 4개 PASS. 모든 Linux locale 완전 번역 또는 실제 브라우저 RTL/언어 전환 검증을 뜻하지 않는다. 서버의 일부 긴 notice/오류 문구는 여전히 번역이 남아 있다. 전체 PARTIAL.

### 2026-10-03 — 등록 Node 앱 실제 환경 파일 편집

- 등록 앱의 비공개 환경 파일 snapshot GET 및 POST 변경 API와 별도 GUI를 추가했다. 로그인/동일 출처/fileEditing 권한/명시적 확인이 필요하며 사용자 임의 절대 경로는 API에서 받지 않는다. 등록 정보에서만 경로를 파생한다.
- 앱 registry 버전 및 파일 SHA를 변경 전과 commit 직전에 확인한다. 기존 private 파일/소유권/심볼릭 링크 검사와 configTransaction 잠금/후보 검증/원자적 교체를 사용한다. 변경 전 전체 바이트는 private state/node-app-env-backups에 백업한다. 앱 재시작은 수행하지 않는다.
- 실제 임시 .env fixture에서 지원 port 변경·비공개 API_KEY 보존·백업 원본 바이트·확인 누락·외부 파일 변경/앱 등록 변경 409를 검증했다. 전체 182개 테스트 PASS. 실제 브라우저 및 운영 앱 편집은 미검증이며 등록 앱 백업 복구 GUI/API는 추가 구현이 남아 있다. 전체 PARTIAL, deb는 아직 이번 변경 전 버전이다.

### 2026-10-03 — 등록 앱 환경 편집 패키지 HTTP 검증

- 최근 상태/로그/AI 응답 무효화/다국어/등록 앱 환경 편집을 포함한 현재 production build로 deb를 갱신했다. SHA-256 e708bb3eccf1eabd18ad2a7927f0ac442a691e48c8c4659de33a79d443b48740.
- 10376개 파일 검증과 격리 패키지 서버 HTTP PASS. 새 검사는 Node app env/status/log 미로그인 401, fileEditing 비활성 환경 저장 403, 등록 앱 환경 snapshot 비공개 변수 생략, 확인 누락 400, 실제 저장/전체 비공개 변수 보존/원본 백업 바이트/오래된 버전 409를 포함한다.
- 증거 .runtime/verification/package-2026-10-03T04-07-35.119Z.json. 설치/운영 앱 변경은 수행하지 않았다. 실제 status/log 조회 성공 및 GUI/유료 AI/서비스 설치·시작/apt 저장소 배포/전체 언어와 등록 앱 백업 복구는 남아 있다. 전체 PARTIAL.

### 2026-10-03 — 등록 앱 환경 백업 목록

- 등록 앱용 private 환경 백업 reader와 인증된 목록 GET, GUI 목록을 추가했다. UUID/일반 파일/심볼릭 링크/소유권/권한/크기/UTF-8/원문 SHA를 검사하며 현재 등록 앱의 환경 파일 경로에 해당하는 백업만 선택한다.
- 공개 응답은 ID/환경 파일명/생성 시각/hash/크기만 포함하고 원문/절대 경로는 제외한다. 최대 1000개 scan/100개 최근 표시와 읽기 실패 건수/잘림을 제공한다. 전체 182개 테스트 PASS: private 변수와 절대 경로 생략 및 내부 reader 원본 바이트 확인 포함. build PASS.
- 복구용 내부 record reader는 추가했지만 복구 plan/apply API와 GUI 확인 흐름은 아직 남아 있다. 실제 브라우저/운영 복구/배포 검증 미완료, 전체 PARTIAL. deb는 이번 목록 기능 전 빌드다.

### 2026-10-03 — 등록 앱 환경 백업 복구 API/GUI

- 백업 목록에서 지원 필드 before/after를 검토하고 전체 환경 파일 교체 확인 후 복구하는 GUI, 인증 GET plan 및 동일 출처/fileEditing 게이트 POST 실행을 추가했다.
- 현재 registry/file/backup 버전을 검토값과 비교하고 transform 및 commit 직전에 재검사한다. configTransaction으로 원본을 undo 백업 후 원자적으로 교체하며 앱은 재시작하지 않는다. 응답에는 지원 값과 버전/새 백업 ID만 반환한다.
- 실제 임시 파일 원문(비공개 API_KEY 포함) 복원, undo 백업의 이전 바이트, 확인 누락 400, 오래된 plan 409 검사 포함 전체 182개 테스트 PASS. production build PASS. 이는 실제 브라우저/운영 앱/패키지 HTTP 복구 검증을 대체하지 않는다. 전체 PARTIAL, deb는 이번 목록/복구 변경을 포함하지 않는다.

### 2026-10-03 — 등록 앱 백업 복구 패키지 HTTP 검증

- 최신 목록/복구 GUI/API 포함 deb 갱신. SHA-256 9edc1bd4fe1f573f89c0e737f5d25b5d5079d57828cbc7033b5fad9d7cf77e53.
- 격리 패키지 서버의 등록 앱 백업 catalog 원문/경로 생략, 복구 plan 지원 값 비교, 확인 누락 400, 전체 파일 원본 바이트 복원, undo 백업 바이트, stale plan 409와 등록 해제 후 복원된 원본 보존을 검증했다. 10376개 파일 및 기존 로그인/세션/환경 저장·복구 검증 전체 PASS.
- 증거 .runtime/verification/package-2026-10-03T04-13-42.766Z.json. installed:false. 실제 GUI/운영 적용/서비스 설치·시작/apt 배포/완전 번역은 여전히 남아 있으므로 전체 PARTIAL.

### 2026-10-03 — nginx 중심 화면 요청·검토 상태 보완

- nginx ServerManager로 범위를 되돌렸다. 작업 중 입력/트리 조작 및 nginx/보조 Certbot·cron 탭 변경을 fieldset/버튼으로 차단하고, 연결 변화/unmount 시 이전 API 응답과 오류를 무효화한다. 조회·검토·동의·목록 상태는 연결 변경 시 초기화한다.
- SWC 컴포넌트 hook fixture에서 실제 지연 API Promise로 필드 잠금/탭 잠금/연결 해제 후 이전 nginx-live 및 tree 결과 무시를 검사했다. 전체 183개 테스트 PASS, production build PASS. 이는 실제 브라우저 및 운영 nginx 적용 성공 검증은 아니다.
- 현재 tree의 nginx.conf/외부 설정 노드는 초안 편집·다운로드이며 운영 적용은 앱 관리 server 파일 폼만 지원한다. 전체 요구사항은 PARTIAL이며 native/GUI 적용 흐름과 디자인 검증은 남아 있다. 최신 deb는 이번 수정 전 빌드다.

### 2026-10-03 — nginx 트리 운영 파일 외부 변경 비교

- 오래된 tree 초안의 baseline과 재조회한 운영 원본을 별도로 비교해 외부 변경을 표시한다. 기존 baseline↔편집 초안 비교도 유지한다. 사용자가 확인하면 해당 파일의 초안/history만 버리고 현재 운영 원본을 선택한다. 시스템 파일은 변경하지 않는다.
- nginx.conf/외부 설정 트리 편집은 다운로드용 초안이고 관리 server 폼은 운영 편집이라는 현재 기능 범위를 화면에 명확히 표시했다. 실제 임의 nginx.conf 운영 적용은 아직 구현/검증이 남아 있다. 전체 PARTIAL, 실제 브라우저 클릭/네이티브 운영 적용 및 디자인 검증 미완료.

### 2026-10-03 — nginx 트리 초안에서 server 폼 연결

- 활성 관리 server 파일의 tree 초안을 폼에 반영하는 버튼을 추가했다. 외부 변경이 있으면 비활성이다. 기존 운영 SHA를 폼에 유지하고 검토/확인을 초기화한다.
- 순수 nginxConfig 생성기를 분리해 클라이언트/서버가 공유한다. inferred form을 다시 생성한 tree(HTTPS는 기존 SSL/redirect 유지)에 초안 tree가 정확히 일치할 때만 가져온다. 지원하지 않는 directive 변경/도메인 변경을 버리지 않고 변환을 거부한다. whitespace도 보수적으로 비교한다.
- nginx 포트의 boolean/배열/공백/hex/exponent coercion을 거부한다. 전체 185개 테스트 PASS 후 보수적 비교 보완의 해당 2개 검사 PASS. 실제 native/브라우저 적용은 미검증이고 전체 PARTIAL. deb는 이번 생성기/GUI 변경 전 빌드다.

### 2026-10-03 — HTTPS 트리 폼 변환 및 nginx 패키지 HTTP 검증

- TLS 인증서/키/HTTP redirect 및 인용 문자열이 있는 fixture에서 upstream 변경 가져오기 성공, cert 경로/redirect status/인용 문자열 내부 공백/listen port 변경 거부를 확인했다. 전체 186개 테스트 PASS.
- nginx 검토 API에 실제 HTTP 프록시 설정 생성, boolean listen 및 array upstream 거부 400, 운영 flag OFF apply 403 검증을 추가했다.
- 최근 nginx GUI 연결/외부 변경 비교/순수 생성기를 포함한 최신 deb SHA-256 eb4ec99e4e5583a25ec64352484239edfd26be050188cee15384a442ff0eb359. 10376개 파일 및 전체 격리 HTTP 검증 PASS. 증거 .runtime/verification/package-2026-10-03T04-22-37.078Z.json. installed:false.
- 실제 nginx -t/reload/Certbot native 및 브라우저 디자인/E2E, 전체 언어, 다른 패키지 운영 기능은 남아 있어 전체 PARTIAL.

### 2026-10-03 — 실제 nginx 문법 검사

- /usr/sbin/nginx 1.28.3 (Ubuntu)의 -t로 임시 prefix/config/certificate만 검사했다. proxy/static/TLS+redirect/HTTPS upstream tree edit PASS, 잘못된 directive 거부 PASS. 바이너리 SHA-256 94eb839f1cdc7f3f42062d352b504fe406e2f888d83b554af7ea25bcdc9506f5.
- 샌드박스는 socket()을 차단해 첫 검사가 실패했다. 동일 임시 검사 스크립트의 승인된 실행에서 PASS. 서비스 시작/재로드/운영 파일 변경 없음, 임시 파일·키는 finally에서 삭제했다. npm run verify:nginx:native를 추가했다.
- 증거 .runtime/verification/nginx-native-2026-10-03T04-24-42.043Z.json. 공식 검사 동작 https://nginx.org/en/docs/switches.html . 실제 root helper 적용/rollback/reload 및 Certbot/GUI E2E를 대체하지 않는다. 전체 PARTIAL.

### 2026-10-03 — nginx GUI HTTP 초안 네이티브 검사

- 인증된 nginx-validate POST와 GUI HTTP 초안 문법 검사 버튼을 추가했다. 고정 생성기 결과를 임시 prefix/config에 넣어 nginx -t(5초/16KB, 최소 환경)로 검사한다. root 실행과 기존 version/HTTPS 입력은 거부한다. 참조 운영 설정을 임의 복제하거나 인증서 권한을 바꾸지 않는다.
- 검사 전/후 nginxPlan 결과를 비교하고 임시 폴더는 finally에서 삭제한다. 결과는 isolated-http-draft 범위로 표시하며 전체 운영 적용/재로드의 PASS로 확대하지 않는다.
- 해당 함수 실제 고정 fixture 실행 valid:true, serviceChanged:false. 전체 187개 테스트 PASS, build PASS. 실제 API HTTP/브라우저 조작 및 기존 HTTPS 전체 운영 검사/적용은 남아 있다. 전체 PARTIAL, deb는 이번 변경 전 버전이다.

### 2026-10-03 — nginx 검사 API의 패키지 HTTP 검증

- 최신 nginx 검사 API/GUI 및 native 검사 script 포함 deb 갱신. SHA-256 d78bebf68a5604d106c9b817e03af1b4c1399e85ec902802ef2270e9a2fba17d.
- 격리 패키지 서버에서 nginx-validate 미로그인 401/다른 Origin 403/기존 운영 version 입력 400, 정상 HTTP 임시 초안 native valid:true/scope/serviceChanged:false를 확인했다. 10376개 파일 및 기존 전체 HTTP 검증 PASS.
- 증거 .runtime/verification/package-2026-10-03T04-28-46.964Z.json. installed:false. 이 검사 장비의 /usr/sbin/nginx를 사용하며 실제 운영 적용/reload/기존 HTTPS 전체 설정 검사/Certbot/GUI E2E를 대체하지 않는다. 전체 PARTIAL.

### 2026-10-03 — nginx 검사 실패 원인 안내

- 임시 nginx 검사 실패를 missing/permission/timeout/output-limit/invalid-config/unavailable로 분류한다. 실행 파일 부재·권한·5초 timeout·출력 크기·설정 구문별 다음 확인 항목을 표시한다. native stderr/cmd/message/경로는 반환하지 않는다. 영어 안내 6개를 추가했다.
- 비공개 marker 및 private path를 포함한 error fixture에서 분류와 원문 미노출을 검사했다. 전체 188개 테스트 PASS, production build PASS. 실제 native 오류별 HTTP/브라우저 검증은 아직 남아 있고 전체 PARTIAL. deb는 이번 진단 변경 전 빌드다.

### 2026-10-03 nginx upload limit GUI

- Added optional location-level `client_max_body_size` in MB (0–65536) to server GUI, renderer, live form parser and privileged helper. Omission inherits nginx settings; explicit zero removes the size limit.
- Tree drafts transfer this supported directive to the form. Invalid/coerced values are rejected before helper mutation. Existing TLS outer blocks remain preserved.
- Verification: 190 isolated tests PASS; actual nginx 1.28.3 temporary syntax check PASS (`.runtime/verification/nginx-native-2026-10-03T04-35-11.445Z.json`). No operational configuration change/start/reload. Full scope remains PARTIAL; browser GUI and actual privileged apply are unverified.

### 2026-10-03 nginx proxy timeout GUI

- Added optional connect/read timeout controls (1–3600 seconds), live parser and tree-to-form transfer, matching privileged helper validation. Blank values inherit nginx configuration. Switching to static mode removes proxy-only values and invalidates the review.
- 192 isolated tests PASS; native nginx temporary syntax check PASS: `.runtime/verification/nginx-native-2026-10-03T04-37-03.596Z.json`. No operational service changes. Overall scope remains PARTIAL.

### 2026-10-03 nginx existing directive preservation gate

- Existing live configuration is checked against tree-to-form reconstruction before GUI planning; unsupported changes return 409 instead of silently removing directives.
- Privileged helper independently rejects unsupported location directive lines before backup/write/nginx execution. Regression fixture proves original custom-header configuration is unchanged on rejection.
- Raw tree operational editing remains incomplete; this gate prevents data loss and does not claim full nginx configuration editing support.

### 2026-10-03 nginx live form availability

- Live managed-site listing now validates lossless form reconstruction before advertising GUI editing. Unsupported files expose a reason in the selected tree node; the original/tree draft remains accessible.
- Added English labels for upload/timeouts and the editing limitation. 194 isolated tests PASS. Full operational editing and GUI E2E remain incomplete.

### 2026-10-03 nginx website selection in Certbot GUI

- Certificate status refresh now retrieves active managed nginx websites; issuance UI offers a website selector and uses the selected domain. Selection clears reviewed command and confirmations; direct entry remains available.
- Existing 194 isolated tests PASS. Actual issuance and browser selection E2E remain unverified; no certificate request was sent.

### 2026-10-03 updated deb artifact validation

- Rebuilt `dist/tastedev-linux_0.1.0_amd64.deb` after nginx options, preservation checks, tree availability and Certbot website selector changes.
- Package SHA-256: `c31071ed6ea5c89126f333243d724b76035653ec2f0935476878e4046db0e0d4`.
- Extracted package verifier PASS, 10376 files; isolated authenticated HTTP checks now assert upload/connect/read values and reject boolean upload limit/zero read timeout, in addition to login/session/config/restore checks.
- Evidence: `.runtime/verification/package-2026-10-03T04-43-41.627Z.json`. `installed:false`; apt repository publication, actual installation/upgrade, privileged service changes and browser E2E remain unverified. Overall PARTIAL.

### 2026-10-03 targeted certificate renewal test

- Added renewal target selector (one certificate lineage or all) with matching preview/API/helper `--cert-name` argv. Certificate names are independently validated before process execution; target changes clear review and confirmations.
- Reference: https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates (selection via `--cert-name`). No actual ACME/dry-run request was executed; existing hooks can still affect nginx during a user-triggered renewal test.
- Updated component fixture to inspect rendered tree props rather than positional hook indexes. Full goal remains PARTIAL.

### 2026-10-03 nginx direct apply plan validation

- nginx apply now runs the same live plan checks as preview after administrator-mode authorization and before helper dispatch. Direct API apply cannot bypass stale-version, disabled-file or unsupported live configuration checks.
- Extracted pure existing-plan logic with regressions for missing/stale/disabled/mismatched/custom-directive files and supported upload edits. 197 isolated tests PASS. Root helper still rechecks current hash; actual operational reload remains unverified.

### 2026-10-03 cron time context and percent command semantics

- Cron status exposes observation time/application process timezone and ordered TZ/CRON_TZ declarations with line numbers; GUI explicitly does not infer the daemon's effective schedule timezone.
- GUI detects unescaped percent separators (including inside shell quotes), explaining cron stdin behavior without rewriting commands. Reference: https://man7.org/linux/man-pages/man5/crontab.5.html.
- 199 isolated tests PASS. No crontab modifications or job executions. Actual scheduling and browser E2E remain unverified; overall PARTIAL.

### 2026-10-03 basic cron schedule GUI

- Added daily/weekly/monthly repetition, time, weekday and day-of-month controls, all bound to the same cron schedule string and invalidating review/confirmation when changed. Custom range/step expressions remain directly editable.
- Pure parsing/generation covers round trips, Sunday alias, bounds and numeric coercion; monthly dates beyond 28 explain skipped months. 201 isolated tests PASS. Browser interaction and actual scheduling remain unverified; overall PARTIAL.

### 2026-10-03 cron/Certbot component interactions and package refresh

- SWC hook fixture drives actual component handlers: monthly day/time and weekly weekday update the displayed cron expression; editing clears confirmation; custom expressions stay custom; nginx website selector sets domain; certificate selector sends exact certName/operation to plan API. 201 tests PASS. This is component evidence, not browser E2E.
- Latest deb SHA-256 `670b0794ff1aa4f90e2ccbb5ca131827ceaa0dfb773433bb4b7f7046cc75f074`; extracted runtime verification PASS, 10376 files, installed:false. HTTP verifier additionally checks targeted certificate plan and rejects traversal names, without running Certbot.
- Evidence `.runtime/verification/package-2026-10-03T04-54-14.594Z.json`. Full goal remains PARTIAL; deployment/install/operational and browser gates remain open.

### 2026-10-03 Redis include file tree

- Added expandable nested Redis include file tree with source lines, byte counts and hashes. Wildcard targets, missing files and cycles are explicit; rendering depth/width are bounded.
- Pure topology fixtures and full suite: 204 tests PASS; production build PASS. No Redis service/configuration changes. This is read-only structural GUI improvement; native apply and full restoration remain incomplete.

### 2026-10-03 Redis selected file details

- Redis tree nodes select files and expose main/include identity, size/hash and inbound/outbound include relationships, including wildcard parents. Reload preserves a still-present selection; disconnect clears it. Unavailable nodes cannot select a nonexistent file.
- Full lists are collapsed by default; selected metadata avoids exposing raw configuration. 205 isolated tests PASS. Read-only GUI scope; operational Redis apply/restore and browser E2E remain incomplete.

### 2026-10-03 reviewed Redis restore orchestration

- Added internal `restoreRedisConfig` linking validated private backup records to full-byte Redis transaction. Requires confirmation and main/current graph/restored graph/backup versions; checks backup and restored include graph again around native validation and service inspection.
- Native validator/service hooks remain mandatory trusted dependencies. No HTTP/helper operation is exposed until native/service scope verification is connected. Temporary fixture exercises successful full-byte restore with secret preservation and undo backup, stale-plan rejection, and backup replacement during validation without file activation.
- Actual native validation/restart/recovery and GUI execution remain incomplete; overall PARTIAL.

### 2026-10-03 reviewed Redis restore recovery evidence

- Added private fixture evidence for activation failure after full restoration: original main bytes (including authentication values) are restored and recovery hook runs. If a concurrent main edit occurred during activation, it remains intact and recovery is not attempted automatically.
- Undo backup is retained in both cases; returned errors/results omit fixture secrets. Full suite 207 tests PASS. These hooks are simulated; no actual Redis native/service operations were run and the operational restore endpoint remains unconnected.

### 2026-10-03 optional PTY terminal command execution

- Added explicit PTY flag across GUI/API/workspace launch using fixed util-linux `/usr/bin/script --quiet --return --flush --echo never --command <command> /dev/null`. Default pipe execution remains; PTY input UI is concealed and no input transcript is configured. Package already depends on util-linux.
- Same authenticated terminal permission, non-root restriction, process-group stop and 120-second timeout remain. This is line-input PTY support with TERM=dumb, not a full terminal emulator; resize/fullscreen-app browser behavior remains incomplete.
- 208 tests PASS. Fixed native diagnostic (`test -t 0 && test -t 1 && printf PTY_FIXTURE_PASS`) returned PASS without remote connection or service/configuration changes. App PTY HTTP/session and browser interaction are not yet verified.

### 2026-10-03 application PTY execution and interrupt evidence

- Added reproducible fixture diagnostic `verify:terminal:pty`. Native app `runCommand`/`terminalInput`/`stopCommand` paths PASS: stdin/stdout TTY, secret env removed, input received without echo, single active command, stop and Ctrl+C foreground interruption.
- Evidence `.runtime/verification/terminal-pty-2026-10-03T05-07-38.548Z.json`. No SSH/sudo/remote/service changes. Added Ctrl+C GUI button for PTY jobs. Browser interaction, resize/full emulator and authenticated HTTP PTY remain unverified; overall PARTIAL.

### 2026-10-03 PTY EOF and authenticated package HTTP evidence

- Native app PTY EOF completes cat fixture, closes stdin and rejects late input. Evidence `.runtime/verification/terminal-pty-2026-10-03T05-08-57.827Z.json`.
- Added opt-in extracted-package terminal verification (`package:verify -- --terminal`), isolated account/state/workspace and fixture-only terminal permission. PTY HTTP launch/read/input/output, no input echo, closed-session input rejection, unauthenticated/cross-origin/invalid-mode requests PASS.
- Latest deb SHA-256 `85c00a03a611ee7a3c799edaa7230b4ba6ddf7f04e2c8757eb0b8a4201489b61`, 10376 files, installed:false. Evidence `.runtime/verification/package-2026-10-03T05-10-48.170Z.json`.
- No real SSH/sudo/service changes. Browser interaction, full emulator/resize, actual installation and remaining product features remain incomplete; overall PARTIAL.

### 2026-10-03 xterm output screen and Next security patch

- Added locally bundled xterm/addon-fit output screen for ANSI/cursor rendering, resize-to-container and theme changes, with lazy client loading and disposal. Terminal output chunks now have monotonic sequences to avoid replaying polling snapshots; legacy snapshots redraw safely.
- Screen is currently output-only; existing line input/PTY control forms remain. Direct keyboard input/backend TTY resizing and browser rendering remain unverified/incomplete. Reference: https://xtermjs.org/docs/api/terminal/classes/terminal/.
- npm audit reported Next 16.3.3 critical advisory GHSA-vcvr-r3jv-pc5j; upgraded to exact 16.3.8. Installation audit reported zero vulnerabilities. Full goal remains PARTIAL.

### 2026-10-03 terminal screen direct keyboard input

- xterm onData now sends input to the existing authenticated terminal-input API only for connected/running/open PTY sessions with terminal permission. Ordered bounded queue splits payloads without cutting surrogate pairs; disposal drops pending input and ignores late failures.
- Existing line input/EOF/Ctrl+C controls remain. 211 tests PASS and production build PASS. Real browser keyboard/paste/rendering and backend PTY size synchronization remain unverified/incomplete; overall PARTIAL.

### 2026-10-03 PTY size synchronization

- Added authenticated/terminal-gated resize API with strict numeric limits. Only a live owned job's sole script child PTY can be opened; character-device ownership and child/fd identity are checked, then fixed stty runs on the opened descriptor. No arbitrary device input is accepted.
- xterm resize events debounce into PTY row/column synchronization; cleanup discards pending calls and ignores stale errors. TERM now advertises xterm-256color.
- Native fixed fixture observed stty size `30 100`; closed-job resize rejected. Evidence `.runtime/verification/terminal-pty-2026-10-03T05-19-24.934Z.json`. Browser/fullscreen program and HTTP resize E2E still unverified; overall PARTIAL.

### 2026-10-03 security-patched xterm package and HTTP resize

- Latest deb includes Next 16.3.8 and xterm 6.0.0/addon-fit 0.11.0, direct keyboard queue and resize API. SHA-256 `db6d951ac8db2bea71b2f342abbddbf2c8f71eaf1e892569266cc54b052394e3`; 10563 files, installed:false.
- Extracted authenticated PTY HTTP resize changes native stty size to `30 100`; string dimensions and closed-job resize are rejected. Full package runtime validation PASS: `.runtime/verification/package-2026-10-03T05-22-03.586Z.json`.
- Latest native app diagnostic PASS: `.runtime/verification/terminal-pty-2026-10-03T05-21-46.907Z.json`. No remote/service changes. Browser xterm rendering/input remains unverified and full original scope is PARTIAL.

### 2026-10-03 serialized PTY resize updates

- Client resize queue prevents overlapping API calls from applying dimensions out of order, coalesces pending sizes to latest, and clears pending work/late errors when session is disposed.
- 214 tests PASS; production build PASS. Browser drag/resize E2E remains unverified. Existing deb predates this client queue change; original scope remains PARTIAL.

### 2026-10-03 native queued Unicode paste evidence

- Native diagnostic now uses the same client input queue with app terminalInput, sending a 3033-byte ASCII/Korean/emoji line across chunk boundaries. The PTY command's SHA-256 exactly matches the original UTF-8 bytes; no input queue errors.
- Evidence `.runtime/verification/terminal-pty-2026-10-03T05-24-44.393Z.json`. This proves the tested payload and chunk-boundary handling, not unlimited paste or browser IME behavior. Browser rendering/IME/paste still unverified; original scope remains PARTIAL.

### 2026-10-03 incremental terminal output frames

- Terminal display processes only new sequence entries, ignores stale polling snapshots, marks gaps in retained output, and resets on job changes. Legacy histories redraw only when changed, including the command header.
- 216 tests PASS and production build PASS. Browser rendering remains unverified; full original scope remains PARTIAL.

### 2026-10-03 certificate-specific GUI draft renewal

- Certbot package configuration draft exposes certificate name only for renewal checks. Empty selects all; named target uses the same strict certificateCommand validator and --cert-name as operation planning. Invalid names and non-string values rejected. New field label translated in eight catalogs.
- 217 tests PASS; production build PASS. This creates a reviewable command draft; actual ACME execution and browser GUI E2E remain unverified. Original scope remains PARTIAL.

### 2026-10-03 Certbot GUI mode rendering and guidance

- SWC-compiled actual package component render verifies certificate-name field appears only in renewal mode and domain/email/staging controls only in issuance mode, without render-time API calls. Updated renewal guidance translated in eight catalogs, with catalog coverage regression.
- Full suite 218 tests PASS before the additional catalog regression; standalone certificate-profile test file PASS afterwards. Production build PASS. Browser click E2E and ACME operations remain unverified; original scope remains PARTIAL.

### 2026-10-03 latest GUI and terminal package regression

- Latest deb SHA-256 `03a77dcfc4e47d49e87853ad12adbd751d97f2855128fbe57165e59ee10ec221`, 10563 files, installed:false. Includes output frames, resize queue and named Certbot draft configuration.
- Extracted package authenticated HTTP verifies named/all Certbot drafts and invalid-name rejection; PTY launch/input/resize and closed-session rejection, plus existing nginx/Node/auth package gates PASS. Evidence `.runtime/verification/package-2026-10-03T05-36-09.499Z.json`. No ACME execution, host installation or operational service changes.
- Full 219 tests PASS. Redis native apply/restore, browser E2E and full original scope remain incomplete/PARTIAL.

### 2026-10-03 Redis private candidate integrity gates

- Private registered candidate snapshots cover file bytes, exact directory membership, directory/file modes and regular-file/link checks. Rechecked before and after native validation dependency and during precommit service inspection; raw snapshots stay internal.
- Fixtures reject changed candidate bytes/new wildcard members/unregistered objects. Validator mutation prevents original replacement, backup creation and activation. 221 tests and production build PASS.
- redis-server executable was not found on this host. Actual Redis native parser/service validation and root/API/GUI apply/restore wiring remain incomplete. Current deb predates these internal changes; full original scope remains PARTIAL.

### 2026-10-03 nginx tree directive input controls

- Tree node editor adds gzip_comp_level numeric control, keepalive_requests numeric control and recognized gzip_http_version dropdown. Shared validator checks numeric boundaries and switch/select choices before draft mutation; special worker_processes auto remains text.
- Official gzip syntax: https://nginx.org/en/docs/http/ngx_http_gzip_module.html . 222 tests and production build PASS. These edit drafts, not arbitrary operational nginx.conf files. Browser E2E/raw operational editing remain unverified/incomplete; original scope PARTIAL.

### 2026-10-03 nginx tree to code workspace

- Selected readable nginx tree file opens an independent ConfigCodeEditor draft under a unique relative nginx-tree UUID filename. Existing edited code requires replacement confirmation; hidden code remains in DraftProvider and unsaved-file guard. Saving reuses authenticated workspace file API, not /etc paths.
- Compiled actual ServerManager handler fixture verifies source handoff, contained unique filename and subsequent code edits. Unsaved state regression and full 223 tests PASS; production build PASS. Browser E2E and arbitrary operational tree apply remain incomplete; original scope PARTIAL.

### 2026-10-03 nginx code-to-tree draft roundtrip

- Code draft captures selected path, transferred tree source and queried live source. Import rejects changed live/tree snapshots, mismatched targets, NUL/oversized text and incomplete display syntax; successful import records tree undo history and resets selection. Native nginx -t remains authoritative. Button label translated in eight catalogs.
- 224 tests PASS and production build PASS. Pure roundtrip fixtures cover undo, concurrent edits and malformed code. Browser interaction and arbitrary operational file application remain incomplete; original scope PARTIAL.

### 2026-10-03 nginx roundtrip actual component event evidence

- Extended SWC-compiled ServerManager hook fixture loads a real synthetic nginx tree response, opens code, edits text and invokes the code-to-tree button. Checks DraftProvider tree source and undo history, then invokes malformed code import and verifies preserved valid tree plus visible parse error.
- Full 224 tests PASS. This tests actual component event handlers with mocked API/component surfaces; it does not prove browser rendering/click E2E or nginx native syntax. No production source change required in this verification step; original scope PARTIAL.

### 2026-10-03 configurable terminal execution deadline

- GUI offers 2/5/15/60-minute limits and sends timeoutSeconds through terminal API. Backend strictly accepts integer seconds 1..3600, defaults to 120, records chosen limit and applies it to process-group termination timer. Active sessions cannot change the selection. Labels localized in eight catalogs.
- 225 tests and production build PASS. Native PTY diagnostic verifies one-second timeout reaches failed terminal state alongside input/resize/Unicode/EOF/Ctrl+C checks; evidence `.runtime/verification/terminal-pty-2026-10-03T05-49-30.589Z.json`. No remote connection or service changes. Browser selection/API package regression remains unverified; original scope PARTIAL.

### 2026-10-03 configuration code editor syntax layers

- Package/nginx code editor now shares IDE line numbers and syntax token overlay; scroll synchronizes the overlay/gutter. Theme/forced-colors selectors cover both editor surfaces and real accessible textarea remains the input.
- Actual compiled component static render checks comments/numbers/strings, line numbers, textarea label and HTML escaping without render-time API calls. 226 tests and production build PASS. Browser geometry/scroll/theme E2E remains unverified; full original scope PARTIAL.

### 2026-10-03 code indent and serialized saves

- ConfigCodeEditor Tab inserts two spaces at selection with cursor restoration and editor length cap; Shift+Tab retains normal focus navigation. Synchronous ref gate prevents overlapping saves, checks current save permission, and releases on failure.
- Pure indent regression covers Unicode/selection/length preservation; actual compiled component save event checks one request for rapid repeated saves and successful retry after failure. Full 228 tests and production build PASS. Browser caret/focus E2E remains unverified; original scope PARTIAL.

### 2026-10-03 packaged IDE and terminal deadline regression

- Latest deb SHA-256 `0be4997dc4a42d049fb957dcbff5a089edddb0d4f9c03ec5f2da32d6cef298da`, 10563 files, installed:false; includes tree/code roundtrip, syntax layers, indent/save gates and terminal deadline UI/API.
- Extracted package authenticated HTTP verifies timeout metadata/default, rejects null/string/out-of-range/fraction values, and one-second fixture termination. Existing login/Certbot/Node/nginx/PTY gates PASS; evidence `.runtime/verification/package-2026-10-03T05-55-23.534Z.json`. No host installation or operational service changes. Browser E2E/apt publication/full original requirements remain incomplete/PARTIAL.

### 2026-10-03 shared configuration code search

- ConfigCodeEditor exposes code search/Enter/next occurrence with wrap and no-result feedback. Full file IDE uses same literal search helper; selecting matches leaves code unchanged.
- Unicode/emoji selection, wrap, missing queries and literal punctuation fixtures PASS; full 229 tests and production build PASS. Actual browser focus/selection visibility remains unverified; latest deb predates search change. Original scope PARTIAL.

### 2026-10-03 backup comparison selection race

- Operations restore comparison is bound to selection revision, connection and selected backup privilege. Changing selection clears confirmation; responses from an earlier selection are ignored even when selecting A → B → A. Revision checked before state mutation.
- Actual compiled component event fixture delays A comparison, switches away/back, verifies no stale preview, then loads B successfully. Full 230 tests and production build PASS. Operational restore/browser E2E remain unverified; original scope PARTIAL.

### 2026-10-03 operational log selection revisions

- Log source/filter changes clear previous output and advance selection revision. Manual and polling responses check revision and latest request number before showing log text; service-to-log navigation supplies the same context.
- Compiled component event fixture verifies source A→B→A rejects delayed output, new response is shown and filter edit clears old output. Full 231 tests and production build PASS. Polling/browser E2E remain unverified; original scope PARTIAL.

### 2026-10-03 polling error request ordering

- Polling error updates notice/live state only for current selection and latest request. A superseded poll failure leaves latest manual output/live refresh intact and schedules next polling cycle.
- Compiled actual component effect/event fixture overlaps automatic and manual requests and rejects old poll after new success; verifies latest output and live toggle retained without stale error. Full 232 tests and production build PASS. Real browser polling remains unverified; original scope PARTIAL.

### 2026-10-03 local apt repository artifacts

- package:apt verifies current deb metadata/checksum, copies into a fresh pool, uses dpkg-scanpackages, emits compressed index and Release SHA-256/size entries. Independent verifier checks package index identity, gzip roundtrip and Release digest/size.
- Generated `dist/apt-repository-DqbVWL` using existing deb SHA `0be4997dc4a42d049fb957dcbff5a089edddb0d4f9c03ec5f2da32d6cef298da`; artifact checks PASS evidence `.runtime/verification/apt-repository-2026-10-03T06-06-42.433Z.json`. Unsigned/unpublished/not installed. Latest UI source changes postdate this deb. Signing, HTTPS hosting, apt install/update and full original scope remain incomplete/PARTIAL.

### 2026-10-03 explicit-key apt repository signing

- package:apt:sign requires generated dist repository and full public key fingerprint, verifies artifacts first, stages signatures, validates GPG signer and exact clearsigned Release bytes, rejects changed Release/existing signatures and records public signature metadata. No implicit production key selection.
- Isolated temporary GNUPGHOME synthetic-key test signs both formats and rejects tampered Release; PASS `.runtime/verification/apt-signing-2026-10-03T06-10-12.217Z.json`. Test agent and key/repository fixtures cleaned. Sandbox GPG-agent restriction required approved isolated test execution. Actual production key/address requested; production signing/publication/apt installation remain incomplete. Original scope PARTIAL.

### 2026-10-03 isolated real apt authentication and download

- Signing fixture now creates isolated apt config/sourceparts/trust/state/status/lists/cache/log paths with only synthetic-key signed-by file repository. Real apt-get update/authentication, apt-cache candidate version and apt-get download exact SHA-256 PASS. GPG rejects changed Release and apt rejects changed InRelease under strict update error mode. No install, production keys, system apt configuration or operational services changed.
- PASS evidence `.runtime/verification/apt-signing-2026-10-03T06-12-48.023Z.json`; fixture apt/key/repository paths cleaned. HTTPS hosting, production signing, real installation/update and full original scope remain incomplete/PARTIAL.

### 2026-10-03 canonical nginx shortcuts and IDE frame

- Dashboard navigation resolves legacy server-settings view directly to /ide/packages/nginx through fixed consoleRoute helper. nginx view uses same IDE page frame, remaining content flex/scroll region beside existing rail/sidebar. Legacy route preserved as redirect.
- 233 tests and production build PASS; current local HTTP /server-settings returns 307 to /ide/packages/nginx. Browser rendered dimensions/scroll remain unverified; original scope PARTIAL.

### 2026-10-03 Certbot package operations route

- Certbot canonical package page now selects actual ServerManager certificate operations rather than only generic command draft form. requestedTab synchronizes route changes, resets preview/confirmation, and installed package sidebar selection follows actual profile. nginx remains primary configuration with certificate/cron companion controls.
- Route selection and compiled component requestedTab transition fixtures plus full 234 tests PASS; production build PASS. Actual browser navigation and ACME execution remain unverified; original scope PARTIAL.

### 2026-10-03 removed certificate renewal selection guard

- If refreshed/disconnected certificate list no longer contains selected name, selection becomes explicit reselect placeholder and preview/confirmation/terms are reset. Plan and execution disabled until user selects a target; no automatic expansion to all certificates. Reselect prompt localized in eight catalogs.
- Compiled component fixture refreshes removed certificate and checks placeholder, disabled plan and cleared confirmation. Full 234 tests and production build PASS. ACME/browser E2E remain unverified; original scope PARTIAL.

### 2026-10-03 refreshed deployment artifacts and package route coverage

- Latest production build packaged into `dist/tastedev-linux_0.1.0_amd64.deb`, SHA-256 `49bd80baf25dd8c0e834efe3a197139ce472e56e8643de2f101a140ae97897f1`. Includes current Certbot route/selection guard, nginx IDE frame, code search and operations request guards.
- Packaged runtime verification now checks login redirects and authenticated responses for all six canonical package routes, plus unsupported package 404. Terminal and existing isolated HTTP checks PASS: `.runtime/verification/package-2026-10-03T06-25-50.274Z.json`.
- Fresh unsigned repository `dist/apt-repository-tIEvVE` index/gzip/Release checks PASS: `.runtime/verification/apt-repository-2026-10-03T06-26-15.052Z.json`. Separate synthetic-key cloned repository real apt authentication/download/hash and tamper rejection PASS: `.runtime/verification/apt-signing-2026-10-03T06-26-21.264Z.json`; fixtures cleaned.
- No system installation, production signing, publication or operational service changes. Browser E2E and remaining original requirements remain incomplete; overall PARTIAL.

### 2026-10-03 Redis topology reload freshness

- Manual topology refresh clears the previous graph and selected file before requesting data. Failed refresh leaves no previous graph presented as current; existing request-generation guards remain in place.
- Compiled component handler fixture verifies immediate data/selection clearing and failed-request error/busy state; Redis render and tree tests PASS. Production rebuild/package refresh and browser E2E for this change remain pending. Original scope PARTIAL.

### 2026-10-03 Redis freshness build and package verification

- Full 235 tests and production build PASS; local loopback preview restarted with install/admin/cron/terminal execution disabled.
- Refreshed deb SHA-256 `932a4d5367e62838aea0b39f105b8042bdee426d8e4989e135f4485ee8f3d69c`; isolated packaged HTTP/login/configuration/PTY checks PASS, evidence `.runtime/verification/package-2026-10-03T06-30-30.790Z.json`. No system installation. Earlier apt repositories retain their earlier package bytes and do not include this final Redis refresh change.
- Browser rendered interaction and operational Redis application remain unverified; original scope PARTIAL.

### 2026-10-03 MariaDB topology request freshness

- Topology/service-scope requests share a generation counter; connection/root/security changes and cleanup invalidate in-flight responses. Superseded failures and finalizers cannot overwrite errors or release the newest request's busy state.
- Graph refresh clears old graph and parent inspection before querying; absent nested security fields safely disable privileged inspection.
- Compiled event fixture checks competing requests, stale failure, newest success and invalidated response. Full 236 tests PASS. Production rebuild/package update and browser E2E remain pending; overall PARTIAL.

### 2026-10-03 MariaDB freshness deployment refresh

- Production build PASS and local preview restarted with operational execution disabled. Latest deb SHA-256 `85bb3d90f230c5cee3ba5f4b205c8a4a0e025f720d201391c37b2c4bf53c2a0b`; isolated packaged runtime verification PASS: `.runtime/verification/package-2026-10-03T06-33-58.061Z.json`.
- VALIDATION.md now explains fresh repository generation, index verification and isolated synthetic-key apt verification, distinguishing these from production publication/installation.
- No system installation or operational service changes. Browser E2E and full original scope remain PARTIAL.

### 2026-10-03 MariaDB backup review and restore request guards

- Backup load/review/restore advance request generation; security changes invalidate previous plans and confirmations. Reload clears stale catalog, and incomplete security objects disable privileged controls.
- Restore handler independently requires plan, confirmation, connection and capability, consumes confirmation before submission, and synchronously locks duplicate mutation requests until completion.
- Compiled handler fixture invokes restore twice before response and verifies exactly one request, immediate confirmation reset and balanced parent busy callbacks. Full 237 tests PASS. Build/package/browser refresh pending; overall PARTIAL.

### 2026-10-03 restore guard production refresh

- Production build PASS; loopback preview now serves latest restore guards with operational execution disabled. Latest deb SHA-256 `53df404967b40e5d91113d96b1092e52bce3cad9da7042ed9d8023e5e0ac4e85`.
- Packaged isolated HTTP/authentication/configuration/PTY verification PASS, `.runtime/verification/package-2026-10-03T06-37-19.494Z.json`. This is not operational MariaDB restoration or browser E2E evidence. No real installation/service changes; overall PARTIAL.

### 2026-10-03 Node service plan snapshot consistency

- Service plan re-inspects app registration and entry/environment file readiness, hashes and modes after asynchronous Node runtime probing. Changed registration or files reject the plan with 409 instead of returning an obsolete unit preview.
- Real service-plan function with injected fixture dependencies rejects registration/content/mode/readiness changes and accepts unchanged snapshots. Full 238 tests PASS. Build/package refresh pending; service installation/start and original scope remain incomplete/PARTIAL.

### 2026-10-03 Node plan production refresh

- Production build PASS; latest local preview serves snapshot consistency checks with operational execution disabled. Refreshed deb SHA-256 `168667273e164a3c9993ed1fa2ede20f72f4cb24cff4937b7b7916504b18d23b`.
- Isolated packaged server including Node service-plan HTTP, authentication/configuration and PTY checks PASS: `.runtime/verification/package-2026-10-03T06-41-26.703Z.json`. No app/service launch or real package installation; service installation/start, browser E2E and overall goal remain PARTIAL.

### 2026-10-03 Node service restart options GUI

- Node app service preview now accepts fixed restart policies no/on-failure/always and integer delay 1–300 seconds through authenticated plan API. Unit generation validates options independently and rejects unknown keys, directive injection, booleans and numeric coercion; defaults preserve previous on-failure/5-second behavior.
- GUI controls clear old preview when options change; generated preview/download contains selected values. Six labels/errors translated in eight catalogs. Unit option regression and full 239 tests PASS; translation checks run after catalog edits.
- Build/package refresh and browser interaction pending. These remain preview options; actual service installation/start is incomplete, overall PARTIAL.

### 2026-10-03 Node restart options production and HTTP verification

- Production build PASS and latest loopback preview serves new controls. Latest deb SHA-256 `f0c6a6b3e2b39e076e7e4e8095c0f42a45d89f19c45ffd4bcb68b04b84e0eb1a`.
- Packaged authenticated HTTP now verifies always/30-second option response and exact unit directives, and rejects injected policy, zero, 301 and exponent delay with 400. Existing isolated checks PASS: `.runtime/verification/package-2026-10-03T06-45-22.668Z.json`.
- No app/service execution or real installation. Browser interaction and operational installation/start remain incomplete; original scope PARTIAL.

### 2026-10-03 Node stop timeout GUI

- Service options now support optional bounded stopSeconds (1–300), rendered as TimeoutStopSec. Default null omits directive to preserve manager default. GUI offers system default and 15/30/60/120/300 seconds, clears previous preview and sends selected value through authenticated plan API.
- Official systemd source documentation consulted: https://github.com/systemd/systemd/blob/main/man/systemd.service.xml . Unit fixtures cover default omission, selected value and invalid/injected values. Full test run passed; eight catalog labels updated and translation checks run separately.
- Build/package refresh, browser interaction and actual service installation/start remain incomplete; overall PARTIAL.

### 2026-10-03 Node stop timeout production refresh

- Production build PASS and loopback preview restarted with latest stop timeout controls. Latest deb SHA-256 `2448eeada69eed1edfdb864fd97cdd81089d5ed0c4e3245a5c85974ae2e9d0c0`.
- Packaged HTTP verifies stopSeconds=60 response and TimeoutStopSec=60, default directive omission, and rejection of zero/301/infinity/directive injection. Existing isolated package checks PASS: `.runtime/verification/package-2026-10-03T06-48-58.398Z.json`.
- No system installation/service execution. Browser E2E and operational service installation/start remain incomplete; original goal PARTIAL.

### 2026-10-03 internal Node service installation transaction

- Added trusted-helper-only installNodeAppService primitive for a new fixed tastedev-node-ID.service. Generates unit from validated app/non-root UID/options, checks trusted directory, stages private candidate, requires explicit context/native validation/manager reload hooks, verifies candidate hash/inode and exclusively links new file without overwriting existing units.
- Reload/context failure removes only the matching installed inode/content and retries manager reload; concurrent administrator edits are preserved and require manual recovery. Finalization checks opened inode/content before chmod. Does not start or enable app services.
- Temporary directory/hooks fixtures cover successful new registration, existing unit rejection, candidate mutation rejection, reload rollback, concurrent edit preservation, missing native hooks and root app UID rejection. Full 244 tests PASS after finalization hardening. No host service/unit modifications.
- Root helper/runtime closure, authenticated API, GUI install control, real systemd-analyze validation and isolated systemd registration E2E remain unconnected/unverified. Original scope PARTIAL.

### 2026-10-03 Node service privileged context validation

- Added internal root-helper context verifier: strict non-root sudo caller UID parser, requested account equality, validated profile/options, exactly two reviewed target/hash records, safe traversable directory graph, regular single-link files, readable owner permissions, private caller-owned environment file, bounded fd reads and post-read inode/content/version checks. Returned metadata omits environment contents.
- Fixtures cover valid private files, caller mismatch, changed environment, public environment permissions and symlink rejection. Full 246 tests PASS after ancestor traversal hardening. No root command/unit/service modifications.
- Root helper/runtime closure and HTTP/GUI installation remain unconnected; native unit validation and operational E2E are still required. Original goal PARTIAL.

### 2026-10-03 Node installation root helper connection

- Root-owned packaged runtime closure now includes six audited Node service modules. Helper dispatch node-service-install verifies explicit confirmation and SUDO_UID non-root account equality before trusted installation hooks. Writable checkout/runtime checksum boundaries remain enforced.
- Native hooks verify root-owned systemd binaries, recheck Node environment-file runtime support and reviewed app context, run fixed systemd-analyze --man=no verify candidate, then fixed systemctl --no-ask-password daemon-reload. No command strings, app start or enable actions. Privilege allowlist and request deadline updated.
- Closure tests and VM helper dispatch tests (confirmation/caller/root-account/checkout rejection) plus full 248 tests PASS. Native commands were not executed; no operational host modifications.
- Authenticated install API/GUI, package refresh, actual native validation and isolated systemd registration E2E remain incomplete; full original goal PARTIAL.

### 2026-10-03 Node service installation API and GUI

- Authenticated same-origin node-app-service-install POST requires serviceChanges/sudo permission, explicit confirmation and reviewed registry/file versions. Server derives profile/account/options from current registry and service plan; client-supplied UID/profile are rejected. Helper installation outcomes are audited as completed/rolled-back/recovery-required without payload contents.
- Node service preview now provides register/confirmation/result controls with capability/runtime gates and a synchronous duplicate-request lock. Selection/options/security changes clear confirmation and prior results. Nine labels/errors translated in eight catalogs.
- Permission tests verify unauthenticated/cross-origin/default-disabled rejection before file access. Request preparation fixtures reject injected privilege fields, stale registry/file preview and unsupported runtime; full 250 tests PASS.
- Production rebuild/package refresh, compiled GUI interaction, actual native systemd validation and isolated registration E2E remain pending. No operational service changes; original scope PARTIAL.

### 2026-10-03 Node registration GUI and native parser evidence

- Compiled NodeApps handler fixture confirms one installation request on repeated confirmation clicks, immediate confirmation consumption, no client UID payload and busy/result completion; full 251 tests PASS.
- Added read-only native unit verifier with private temporary files and binary version/SHA recording. Actual systemd 259.5 rejects generated unit because /usr/bin/node is missing. BLOCKED evidence `.runtime/verification/node-unit-native-2026-10-03T07-05-08.303Z.json`; nativeUnitValidation=false, no registration/start/enable/manager change. Fixtures cleaned. System Node was not installed or replaced.
- Native validation remains blocked on a suitable isolated environment with system Node. Code/build work continues; original goal PARTIAL.
- Production build PASS and loopback preview refreshed with registration controls, operational execution disabled. New deb refresh remains pending.

### 2026-10-03 service installation deployment artifacts

- Latest deb includes Node installation API/GUI and six-module root runtime extension. SHA-256 `5d8da5738d241ea35fb058260ffc908768cf71d5d9c12a913841c6fe10a63be5`, 10569 files. Packaged module imports, login/origin/disabled installation rejection and existing isolated checks PASS: `.runtime/verification/package-2026-10-03T07-07-17.462Z.json`.
- Fresh unsigned apt repository `dist/apt-repository-0SPvm1` matches latest deb; index/Release validation PASS `.runtime/verification/apt-repository-2026-10-03T07-07-40.291Z.json`. Synthetic-key cloned repository real apt authentication/download/hash and metadata tamper rejection PASS `.runtime/verification/apt-signing-2026-10-03T07-07-45.114Z.json`, fixtures cleaned.
- No publication, production signing, installation or operational service registration. Native Node unit validation remains BLOCKED by missing /usr/bin/node; full original scope PARTIAL.

### 2026-10-03 internal Node service lifecycle control

- Added trusted-helper-only control orchestration for fixed generated unit start/stop/restart/enable/disable. Requires explicit confirmation and matching non-root caller, exact reviewed generated unit bytes, context revalidation and effective manager LoadState/FragmentPath/User/empty DropInPaths checks after manager reload.
- Altered unit text, root effective user, transient/different fragment and drop-ins block application operations. Fixtures check all five operations and negative boundaries; full 253 tests PASS. No actual manager/service command executed.
- Native control hooks/root helper/API/GUI remain unconnected; system Node and isolated systemd E2E still required. Original scope PARTIAL.

### 2026-10-03 Node lifecycle control helper connection

- Added fixed native control hooks: safe root-owned unit fd reads, strict effective-state parser, root-owned systemctl binary checks and fixed daemon-reload/start/stop/restart/enable/disable argv. Root helper node-service-control binds SUDO_UID and operation allowlist; control module included in audited runtime closure and package import verifier.
- VM dispatch rejects unconfirmed/injected/wrong-account operations, parser rejects duplicate/incomplete/unknown state and preserves drop-in evidence. Full 255 tests PASS after post-read permission/identity hardening. No actual systemctl actions executed.
- HTTP/GUI control and latest package refresh remain pending. Current control context requires valid reviewed app files and supported system Node; degraded-app stop/disable support still needs separate review. Actual isolated systemd E2E and original scope PARTIAL.

### 2026-10-03 Node lifecycle control API and GUI

- Added authenticated same-origin node-app-service-control POST with serviceChanges/sudo gate, reviewed registry/file snapshot preparation, fixed operation allowlist and audit outcomes. Root profile/account are derived server-side; client privilege fields remain rejected.
- New NodeServiceControl provides five operation buttons, confirmation dialog, result/error states, duplicate mutation lock and parent busy callbacks. Plan/connection/security changes invalidate pending confirmation and responses. New labels/errors added to eight catalogs.
- Permission, request-operation/injected UID and compiled GUI duplicate-click fixtures plus full 258 tests PASS; separate translation checks PASS. No actual service actions executed.
- Build/package refresh, native isolated lifecycle E2E, degraded-app stop/disable and full original scope remain incomplete/PARTIAL.

### 2026-10-03 Node lifecycle production refresh

- Production build PASS and local preview now serves control GUI with operational execution disabled. Latest deb SHA-256 `846e389c04cdb0d7031ee2f2d8dd97f3f4cce12ccb954009b80941980c5cab64`, 10570 files.
- Packaged HTTP verifies service control authentication, cross-origin and disabled permission rejection; root control module imports and existing isolated checks PASS: `.runtime/verification/package-2026-10-03T07-19-16.299Z.json`.
- No real service actions or system installation. Native lifecycle E2E remains unverified; degraded-app stop/disable and full original requirements remain PARTIAL.

### 2026-10-03 degraded Node app stop/disable flow

- Stop/disable request preparation now requires current registration/account/confirmation, without reading missing app files or checking application runtime support. Helper derives bounded restart/stop settings from safe installed unit and compares complete generated bytes; injected extra directives still block control. Start/restart/enable retain file/runtime checks.
- Native stop/disable context skips application-file/runtime probes while retaining caller, root unit, effective manager and trusted systemctl checks. Root helper itself still requires its system Node interpreter; missing /usr/bin/node remains a real execution blocker on this host.
- GUI offers stop/disable from registered app even without full service preview. Semantic plan key prevents parent busy renders from invalidating an unchanged fallback plan.
- Full 260 tests PASS; additional compiled degraded GUI render fixture PASS (only stop/disable buttons, no request during render). Build/package refresh and actual isolated systemd E2E remain pending; full original scope PARTIAL.

### 2026-10-03 degraded control production refresh

- Full 261 tests and production build PASS. Local preview serves latest fallback stop/disable controls with operational execution disabled.
- Latest deb SHA-256 `c2e4126b81e4b8861b6fed2d48f1243bdf32984363bd6e94ffff83f9ed6b58c5`, 10570 files; packaged module exports/imports and isolated authentication/configuration/PTTY checks PASS: `.runtime/verification/package-2026-10-03T07-25-48.791Z.json`.
- No real systemd lifecycle actions or installation. Helper interpreter/system Node and native isolated E2E still required; original scope PARTIAL.

### 2026-10-03 installed Node service settings import

- Added root helper inspection of fixed registered unit: derives bounded restart/stop options, requires exact generated unit text for caller/profile and rereads before returning metadata. Missing unit returns registered:false; modified/extra directives are rejected. No file text or environment content returned.
- Authenticated GET derives account/profile from registry, requires sudo inspection permission and rechecks registry after helper response. GUI import button clears old preview/confirmation, checks registry version and populates restart/delay/stop controls. Labels localized in eight catalogs.
- Inspection fixtures cover valid options, missing unit, extra directive and between-read changes; login/permission API tests plus full 263 tests PASS. No actual root inspection/service command executed.
- Build/package refresh, compiled GUI import events and real isolated systemd inspection remain pending; original scope PARTIAL.

### 2026-10-03 installed settings GUI and deployment verification

- Compiled import handler fixtures verify confirmation/result/preview reset before query, populated bounded options on matching registry, and unchanged input values with errors on absent/stale settings. Full 264 tests and production build PASS; local preview refreshed with operational execution disabled.
- Latest deb SHA-256 `fd7674b622e7bdc48949b42ea675d76f3e8d55fc3755907a8fda014121c00da3`. Packaged service-settings login/sudo permission rejection and helper inspection export imports plus existing isolated checks PASS: `.runtime/verification/package-2026-10-03T07-32-00.731Z.json`.
- No root service inspection/control executed on host. Real isolated systemd E2E and full original goal remain PARTIAL.

### 2026-10-03 Node service settings update transaction

- Added trusted internal update primitive for fixed registered Node unit. Requires explicit confirmation, caller match, reviewed unit SHA and exact managed unit/profile text; validates candidate integrity around native validation.
- Uses private original-unit backup and atomic version-checked replacement. Manager reload failure restores original and reloads metadata; concurrent administrator edits are preserved. Does not restart an application.
- Temporary filesystem fixtures cover successful update/private backup, stale version, extra directives, candidate mutation, rollback, concurrent edits, missing hooks and caller mismatch. Full `npm test`: 268 PASS, 0 failed.
- Root helper/API/GUI update wiring and deployment refresh are still pending. No operational unit or service changed; full original scope remains PARTIAL.

### 2026-10-03 Node update privileged dispatch

- Connected update primitive to fixed packaged root helper with sudo caller matching, explicit confirmation and private backup directory checks. Added module to checksum-controlled runtime closure and package verifier export checks; privileged action timeout covers validation/reload.
- Installed settings inspection now returns a unit SHA for conflict checks. Request preparation derives profile/account/files/options on the server and forwards the reviewed unit SHA. HTTP update endpoint and GUI remain pending.
- Corrected native validation staging to use `.service` suffix for systemd-analyze; suffix is restricted to empty or `.service`. Fixture asserts suffix. Module closure traversal, inspection SHA and helper rejection tests updated; full 269 tests PASS.
- No real privileged dispatch executed and no new build/deb emitted. Actual native systemd and full original scope remain unverified/PARTIAL.

### 2026-10-03 Node service update HTTP API

- Added POST `node-app-service-update` through existing authentication, same-origin and privileged service-change policy gates. Server revalidates registry/files/runtime and supplies the caller profile; reviewed unit SHA is mandatory. Helper result is audited as completed, unchanged, rolled-back or recovery-required; errors as failed.
- Request fixtures cover missing/invalid unit SHA, client account injection, missing confirmation, stale registry and missing runtime. API tests cover unauthenticated, cross-origin and disabled-policy rejection. Full 271 tests PASS.
- Added equivalent packaged HTTP rejection checks to deployment verifier; not yet run against a rebuilt deb. GUI update interaction, production build/package refresh and real isolated native apply remain pending. No actual operational changes; full scope PARTIAL.

### 2026-10-03 Node service update GUI and package

- Connected existing-service update panel beneath reviewed unit preview. Fetches installed options/version for current-versus-proposed comparison, requires confirmation, consumes it on submission and shows backup/recovery result. Does not automatically restart an app.
- Compiled event fixtures verify duplicate submission lock, reviewed unit SHA payload, stale-registry rejection and discarded late results after invalidation. Full 273 tests and production build PASS. Updated existing parent render mocks for new child.
- Rebuilt deb SHA `f20d9f11244db0343304f048ca11b9719515f219dbad972c8564504a045b1743`; isolated packaged HTTP/PTY verification PASS, installed:false. Evidence `.runtime/verification/package-2026-10-03T07-45-04.144Z.json`. Local preview refreshed with operational execution disabled.
- New update text localization, browser visual/E2E and real native privileged update remain pending; missing host system Node blocker unchanged. No operational service changes. Full original scope PARTIAL.

### 2026-10-03 Node update localization

- Added update confirmation, backup/recovery outcomes and stale-settings request guidance in all eight shipped translation catalogs. Filled missing comparison headings and Russian/Arabic common settings/cancel labels.
- Direct source/catalog coverage check confirms update panel labels/errors/outcomes in all eight catalogs. Full 273 tests and production build PASS; local preview refreshed with operational execution disabled.
- Existing deb remains previous build and requires refresh before distributing localized changes. Full Linux locale translation coverage, browser E2E and native operational verification remain incomplete; original scope PARTIAL.

### 2026-10-03 Node service backup catalog primitive

- Added internal private backup reader/catalog for fixed registered Node unit. Requires caller/profile match and exact generated managed unit text; verifies record hash, target, timestamp, file ownership/private mode/single link and bounded UTF-8 reads. Directory symlinks are refused.
- Metadata omits unit source and app paths; returns bounded restart options, timestamp, ID and version. Catalog bounds entry scanning/results and counts rejected records.
- Temporary fixtures verify metadata omission, valid read and rejection of foreign target/account, corrupt content/hash/date, public file and symlink. Full 275 tests PASS; no operational backup read or change performed.
- Backup helper/API/GUI and selected restore wiring remain pending. New module not yet added to privileged package closure. Original full scope PARTIAL.

### 2026-10-03 Node service backup HTTP and privileged dispatch

- Added fixed-root backup listing dispatch with sudo caller binding and checksum-controlled runtime module. Authenticated GET derives registered profile/account, requires sudo inspection permission and rechecks registry version after helper output.
- Helper VM fixtures verify fixed root/caller and reject mismatched accounts without filesystem access. HTTP fixtures cover login and disabled sudo permission; runtime closure traversal updated. Full 277 tests PASS.
- Packaged HTTP permission checks added but rebuild/package verification not yet rerun. Backup GUI and selected restoration remain pending; no operational backup listing or change executed. Full original scope PARTIAL.

### 2026-10-03 selected Node service restoration primitive

- Added internal selected-backup restoration using verified options from exact managed profile/account unit. Requires confirmation and reviewed backup SHA/current-unit SHA; rechecks selected backup content/version/timestamp around context checks and before commit.
- Reuses validated configuration transaction: backs up pre-restoration unit, reloads manager metadata without application restart, restores pre-restoration unit on failed reload, preserves concurrent administrator edits.
- Temporary fixtures cover selected options/undo backup, missing confirmation, stale unit/backup version, backup mutation during candidate validation, reload rollback and concurrent edit preservation. Full 280 tests PASS.
- Restore module is not yet in privileged closure; helper/API/GUI review and restore wiring remain pending. No actual host service changes. Full original scope PARTIAL.

### 2026-10-03 Node service restoration review API

- Added trusted restore plan returning current/selected restart options plus unit and backup SHA, without unit source or app paths. Reads both service and backup again during review and rejects changed content/timestamp or unmanaged unit.
- Added fixed-root privileged review dispatch and authenticated GET with sudo inspection policy and registry recheck. Restore module included in checksum-controlled runtime closure and package export verifier.
- Temporary review fixtures cover metadata omission and changes to service/backup while reviewing; HTTP fixtures cover login and disabled permission. Full 282 tests PASS.
- Actual restore dispatch/POST and GUI remain pending; production/package refresh not yet run. No operational service inspection/restoration executed. Full original scope PARTIAL.

### 2026-10-03 Node selected restore execution API

- Connected confirmed fixed-unit restoration dispatch to POST through login, same-origin and privileged service-change policy. Server revalidates registry/app files/runtime plus unit/backup review versions; audits completion, unchanged, rollback or recovery-required.
- Root dispatch derives context hook settings from verified private backup rather than client options. Requires sudo caller/account match and explicit confirmation; fixed backup root, no arbitrary file/command fields.
- Full 284 tests PASS before final helper fixture addition; separate helper VM suite PASS afterward, covering backup-derived hook settings, caller mismatch and missing confirmation. No native root operation executed.
- Backup/restore GUI, new labels localization, build/deb refresh and native operational E2E remain pending. Original scope PARTIAL.

### 2026-10-03 Node service backup GUI

- Added service backup panel under reviewed unit: fetch/list, selected current-versus-backup option comparison, explicit restore confirmation, undo backup ID and rollback/recovery status. Requests bind app/registry/unit/backup review versions; confirmation consumed on submission.
- Component guards duplicate requests, clears previous comparison, rejects stale catalog registry and discards responses after context invalidation. Compiled event fixtures verify these behaviors; full 287 tests and production build PASS. Local preview refreshed with operational execution disabled.
- Backup panel currently requires unit preview; degraded app-file/runtime read-only access improvement, new text translations, package refresh and browser/native E2E remain pending. No operational restore performed. Original full scope PARTIAL.

### 2026-10-03 degraded Node backup access

- Moved service backup panel outside full unit preview so registered app backup listing/comparison remains available with missing app files/runtime. Uses registry-derived app/unit context; restoration still requires full reviewed file/runtime plan.
- Compiled handler fixture verifies listing button/request remains enabled without runtime while restore button and handler are blocked. Full 288 tests and production build PASS; operational execution disabled in refreshed local preview.
- Backup text localization, package refresh and browser/native E2E remain pending. No operational systemd or backup action executed. Full original scope PARTIAL.

### 2026-10-03 service backup localized deployment verification

- Added backup list, truncated/unreadable guidance, restore confirmation/outcome and reviewed-backup request error to all eight shipped translation catalogs. Direct source/catalog coverage check PASS.
- Extended isolated package HTTP checks for restore review login/sudo rejection and confirmed restoration login/origin/disabled-policy rejection. Full 288 tests, production build and rebuilt deb verification with fixture-only PTY PASS.
- Deb SHA `992453bc9917fe2fda15ff148490293ff7f1b2624fec12198e05ca26e0796a71`; evidence `.runtime/verification/package-2026-10-03T08-01-34.894Z.json`, installed:false. Local preview refreshed with operational execution disabled.
- Actual root service restore/start/control, browser visual E2E, full Linux locale translations and original-scope pending items remain unverified/incomplete. No actual operational installation or service change. Full scope PARTIAL.

### 2026-10-03 Redis restore inspection conflict guard

- Rechecked reviewed Redis backup after trusted service inspection as well as before it; comparison now includes exact text and creation timestamp alongside content version. Backup reader rechecks descriptor size/mtime/mode/owner/link count after reading.
- Added temporary fixture replacing reviewed backup metadata during precommit inspection: restore returns 409, original main remains intact and activation is not called. Full 289 tests PASS before reader follow-up; focused backup/restore 4 tests PASS afterward.
- No real Redis/native validation/service change executed. Redis native validator and privileged apply/restore API/GUI execution wiring remain pending; new source not in refreshed deb yet. Full original scope PARTIAL.

### 2026-10-03 latest apt repository refresh

- Rebuilt current production/deb including Redis backup reader guard; package isolated HTTP/PTY verification PASS. Deb SHA `ce60511fa8a95498e268de9339f03b04a7bef37ba966ba72f0952bb21bb97a5a`, installed:false; evidence `.runtime/verification/package-2026-10-03T08-05-48.280Z.json`.
- New unsigned local repository `dist/apt-repository-wyeBdv` preserves previous repositories. Index bytes/gzip/Release hashes and sizes PASS: `.runtime/verification/apt-repository-2026-10-03T08-05-55.140Z.json`.
- Separate synthetic-key copy passed signing, isolated apt authentication/download SHA and tampered Release/InRelease rejection: `.runtime/verification/apt-signing-2026-10-03T08-06-00.100Z.json`. Production key used:false; published:false; installed:false. Synthetic copy/key cleaned up; local production candidate remains unsigned.
- Operational signing fingerprint/HTTPS destination still missing. No host apt configuration or operational service changed. Full original scope PARTIAL.

### 2026-10-03 scoped sudo policy draft generator

- Added review-only sudoers generator bound to trusted nonroot account and exact packaged helper path/actions. Requires boolean passwordless choice and unique allowlisted actions, rejects request identity/path injection; produces NOPASSWD or PASSWD text, digest and applied:false.
- Runtime helper action list exported as immutable sorted metadata to avoid policy/action drift. Full 291 tests PASS, covering exact command rules, deterministic ordering, password tags, invalid accounts/actions/coercion/extra fields.
- Actual `/usr/sbin/visudo -c -f` validated all helper actions in temporary NOPASSWD/PASSWD fixtures. No sudoers, OS privileges or operational services modified. Syntax PASS does not prove effective sudo authorization or override existing rules.
- Generator API/GUI/download and isolated effective-policy verification remain pending. Current host policy forbids sudo setup changes; original full scope PARTIAL.

### 2026-10-03 sudo policy preview API

- Added authenticated helper action metadata GET and same-origin JSON preview POST. Preview account identity comes from server userInfo; client identity/path fields rejected. Returns review-only text/applied:false and never invokes sudo or writes OS policy. Preview allowed under read-only app policy.
- API fixtures verify login/origin denial, authenticated generated account UID, permitted action list, applied:false and client root-account injection rejection. Full 292 tests PASS.
- GUI/download, localization and deployment refresh remain pending; syntax validation does not establish effective OS permission. No actual sudoers change. Full original scope PARTIAL.

### 2026-10-03 sudo policy GUI

- Added security panel action selection, passwordless toggle, exact-rule preview and text download. Selection/toggle changes clear prior draft; connection changes clear account/action/review context. Explains PASSWD versus sudo -n and existing OS rules.
- Compiled handler fixtures verify duplicate preview lock, request fields, applied:false output and discarded late response after disconnect. Full 292 tests PASS before two new UI tests; separate two UI tests PASS afterward. Production build PASS; local preview refreshed with operational execution disabled.
- New text localization, action-friendly labels, package refresh and browser/effective-policy verification remain pending. No OS sudoers write or privilege application. Full original scope PARTIAL.

### 2026-10-03 sudo helper action labels

- Added browser-safe human-readable labels for every permitted helper action, retaining server allowlist authority. Added select-all/clear controls that invalidate previous draft; no automatic permission selection on initial load.
- Mapping fixture verifies exact agreement with server helper action list. Compiled GUI tests remain passing; full 295 tests and production build PASS. Local preview refreshed with operational execution disabled.
- New labels/GUI localization, package refresh and effective OS authorization/browser verification remain pending. No sudoers modification. Full original scope PARTIAL.

### 2026-10-03 sudo panel translations

- Added all sudo panel instructions, actions/selection/download labels, password-policy explanation and generator error in eight shipped catalogs. Every helper action label translated with product names preserved.
- Direct component/action-label catalog coverage check PASS; full 295 tests and production build PASS. Local preview refreshed with operational execution disabled.
- Updated sudo generator/GUI not yet in rebuilt deb. Full Linux locale translation coverage, browser/effective-policy tests and OS policy application remain incomplete; no sudoers modifications. Original scope PARTIAL.

### 2026-10-03 sudo package and reproducible syntax verification

- Extended extracted package HTTP verifier: authenticated preview generates exact selected rules for executing UID with applied:false; login/origin denial and injected username rejection; authenticated allowlist metadata. Default read-only state remains active during preview.
- Added `scripts/verify-sudo-policy.mjs` using temporary fixtures only. Actual visudo accepted all permitted NOPASSWD/PASSWD rules and rejected malformed syntax; binary SHA recorded in `.runtime/verification/sudo-policy-2026-10-03T08-17-12.565Z.json`. Effective authorization verified:false; OS policy changed:false.
- Rebuilt deb SHA `e8dcaf9778fc61529561d7e34f3e92aae7e18173d81f0cf76840c545b22a9db6`; extracted server/PTY checks PASS, installed:false. Evidence `.runtime/verification/package-2026-10-03T08-17-33.566Z.json`.
- OS policy application/effective authorization, browser E2E and original-scope remaining requirements incomplete. Local apt repository still preceding deb. Full scope PARTIAL.

### 2026-10-03 managed sudo rule parser

- Added bounded canonical managed-file parser for a trusted server account. Requires exact generated header, fixed helper path/root runas, homogeneous password tag and unique allowlisted sorted actions; returns metadata/version without source text.
- Fixtures roundtrip both policies and reject foreign account, wildcard/ALL command, extra lines/arguments, duplicate actions, mixed tags, broad runas and missing final newline. Full 297 tests PASS.
- Parser not yet wired to operational file inspection/update. No OS policy read/write or effective authorization claim; current host policy still forbids sudo setup changes. Production/deb refresh pending for parser addition. Full original scope PARTIAL.

### 2026-10-03 sudo managed-rule update primitive

- Added trusted internal update primitive for existing canonical `tastedev-linux-helper` only. Requires reviewed SHA, confirmation, trusted account check, candidate validation and complete-policy validation hooks. HTTP cannot supply filesystem roots/account; no default OS execution.
- Validates exact prior account/action rules, protects candidate content/inode during validation, stores private original backup and atomically replaces version-checked file. Policy validation failure restores prior rule and revalidates; intervening administrator edits are preserved.
- Temporary filesystem fixtures cover password policy change/backup, stale version, missing confirmation, candidate mutation, foreign account rules, policy-check rollback and concurrent edit. Fixtures use private owner-writable files to simulate privileged edits without root. Full 300 tests PASS.
- Not wired to root helper/API/GUI and initial rule provisioning absent. No actual OS sudoers read/write, native whole-policy test or effective permission claim. Original full scope PARTIAL.

### 2026-10-03 sudo runtime dependency boundary

- Moved immutable helper action metadata to standalone `helper-actions.ts`; privilege execution and sudo rule generation share it. Sudo rule module no longer imports filesystem/process execution module.
- Added action metadata/rule parser/update modules to packaged checksum-controlled privileged runtime closure and export import checks. Runtime can load trusted update primitive, but no sudo update action dispatch exposed yet.
- Closure traversal and manifest equality fixtures PASS; adjusted privilege source fixture to inject real immutable action metadata rather than assume in-file declaration. Full 300 tests PASS.
- Build/package refresh, trusted native/account hooks, initial provisioning and helper/API/GUI apply wiring remain pending. No OS sudoers operation executed. Original scope PARTIAL.

### 2026-10-03 sudo fixed native/account hooks

- Added trusted hooks for fixed getent UID lookup, bounded identity-only passwd parser, native candidate visudo check and whole-policy visudo check. Rechecks server username for trusted UID. Commands use fixed argv/minimal environment/time/output bounds and root-owned non-writable executable/path checks.
- Candidate hook accepts only generated hidden UUID staging path beneath `/etc/sudoers.d`; no request command/path execution. Explicit run injection is internal fixture dependency only.
- Fixtures cover identity omission, wrong/ambiguous UID, changed username, exact command arguments and arbitrary candidate path rejection. Full 302 tests PASS. Actual getent/whole OS visudo execution not performed; prior temporary-file native syntax evidence remains separate.
- Hook module not yet in packaged privileged runtime; root dispatch/API/GUI apply, initial provisioning and native full-policy validation remain pending. Current QA host sudo settings unchanged. Full scope PARTIAL.

### 2026-10-03 sudo managed update privileged dispatch

- Added confirmed `sudo-policy-update` dispatch, account from SUDO_UID/SUDO_USER with native identity verification before backup directory access, fixed private backup root and trusted update/hooks. Added hook module to checksum-controlled runtime and package export checks.
- Shared allowlist includes explicit policy update permission; friendly label added and translated in eight catalogs. Rule generation still requires choosing this permission explicitly. Existing managed rule required; initial setup is not automatic.
- VM fixtures reject missing confirmation, untrusted checkout, caller root and native identity mismatch before filesystem changes. Full 304 tests PASS before final label-only translation edit.
- No actual sudo helper/OS policy command executed. HTTP/GUI apply/inspection, initial provisioning, deployment refresh and native effective authorization remain pending. Current host policy unchanged; full original scope PARTIAL.

### 2026-10-03 managed sudo inspection

- Added fixed managed-file inspection primitive: verifies account before/after reading, directory ownership/permissions and symlink-free graph, bounded nofollow regular single-link file, canonical account rules and final inode/mtime/size/mode. Missing file returns registered:false; metadata omits source/effective permission claim.
- Added packaged inspection dispatch from trusted sudo identity/native account hook; module in checksum-controlled runtime/export checks, action label translated in eight catalogs.
- Temporary fixtures cover missing/valid metadata, unsafe public writes, symlink and during-account-check changes. Full 306 tests PASS before label-only translation addition. No real sudoers read/change executed.
- HTTP/GUI current-policy and apply wiring, initial provisioning, deploy refresh and effective OS/native E2E remain pending. Full original scope PARTIAL.

### 2026-10-03 sudo rule HTTP inspection/update

- Added authenticated current-rule GET gated by sudo option/helper admin readiness. Added confirmed same-origin update POST using current service-change policy; validates SHA/unique allowlisted actions/passwordless boolean and rejects account/path fields.
- Update audits completed/unchanged/rolled-back/recovery-required/errors; root derives account independently. Full 309 tests PASS including request injection, login/origin and default policy rejection. No actual helper execution/OS rule change.
- Dedicated sudo-policy-change permission/server gate should replace shared service-change permission before GUI apply integration. GUI inspection/apply, initial provisioning, deploy refresh and real policy/effective authorization remain pending. Full original scope PARTIAL.

### 2026-10-03 — Dedicated sudo policy permission

Added `sudoPolicyChanges` and the independent `LINUX_ENABLE_SUDO_POLICY=true` server opt-in. General service permission no longer authorizes sudo policy updates. Existing stored settings migrate the new permission to false while preserving prior values. Security UI exposes the dedicated toggle; environment example defaults it off. Isolated full test suite: 310 passed, 0 failed, 0 skipped (`/tmp/tastedev-linux-tests-sudo-dedicated-gate.log`). No host sudo rule changed. Production build and rendered UI verification for this change remain pending; overall scope remains PARTIAL.

### 2026-10-03 — Current sudo rule GUI import

Security panel can query the existing managed sudo rule and import its action selection and password policy. Import checks the server action allowlist, duplicate actions, policy type and SHA-256 version; stale responses after disconnect are ignored. Missing managed rule explains initial server registration. Focused compiled JSX tests: 4 passed. Actual OS read/apply and rendered UI remain unverified; applying reviewed changes from the GUI remains pending. Overall PARTIAL.

### 2026-10-03 — Reviewed sudo rule apply GUI

Connected GUI apply to the dedicated sudo policy update API. Requires a registered baseline version, reviewed plan, explicit impact confirmation and saved dedicated security permission; confirmation is consumed, duplicate submissions blocked, stale responses ignored, and baseline invalidated after an apply attempt. Explains potential loss of web access when selecting PASSWD or removing update permission. Full isolated suite: 314 passed (`/tmp/tastedev-linux-tests-sudo-gui-apply.log`); focused compiled GUI suite after policy-version confirmation invalidation: 6 passed. No current host sudo change. Production build/rendered and actual privileged E2E remain pending. Overall PARTIAL.

### 2026-10-03 — Sudo GUI production/package verification

Production Next.js build passed. Updated local preview is running at 127.0.0.1:8791 with operational flags disabled. Debian candidate SHA-256 `540746967b6ca2ef05f1d2a81af3a37561bcbf4a8e159a6d56944912f82173fd`: isolated package verification including PTY passed, 10578 files, not installed. Evidence `.runtime/verification/package-2026-10-03T08-42-10.064Z.json`. Corrected verifier to check helperActions as a nonempty unique string array rather than a function. Added sudo GUI registration, permissions, access loss and recovery documentation. Actual privileged sudo E2E and rendered UI remain unverified; overall PARTIAL.

### 2026-10-03 — Sudo security regression evidence

Added authenticated HTTP regression cases for service-only permission, absent dedicated server opt-in and read-only mode: each sudo update is rejected with the security gate error before root execution. Added corrupted-core-setting migration rejection. Full suite passed (see `/tmp/tastedev-linux-tests-sudo-gates-regression.log`). Compiled GUI focused tests: 7 passed, including ignoring a delayed apply response after saved security policy changes. These prove denial and UI handling only; actual privileged execution and browser rendering remain unverified. Overall PARTIAL.

### 2026-10-03 — Sudo localization

Added dedicated sudo setting, current-rule lookup, apply button, inspection error and permission description in all eight existing translation catalogs. Security switches and descriptions now call the selected-language translator. English includes the new registration, recovery, access-impact confirmation and apply status text; other-language extended text still falls back to English. Focused language and compiled GUI tests: 11 passed. Full Linux locale coverage, latest build and rendered UI remain incomplete; overall PARTIAL.

### 2026-10-03 — nginx tree contextual draft presets

Added editable common-entry dropdown for nginx main/events/http/server/location contexts. Included-file top-level context is not assumed; unknown contexts and directive nodes have no presets. Existing draft insertion/history remains used, and no operating config is changed. Context source: https://nginx.org/en/docs/http/ngx_http_core_module.html and https://nginx.org/en/docs/ngx_core_module.html . Pure draft tests: 2 passed. Eight catalogs include the new dropdown label. Full build/rendered checks and arbitrary operating-tree apply remain pending; overall PARTIAL.

### 2026-10-03 — nginx new directive controls

New draft entries now use the same typed controls as editing existing entries: on/off switch, enum dropdown or bounded numeric input. Addition validates the chosen value before updating draft/history. nginx tree JSX compilation passed; full isolated suite: 319 passed, no failures/skips (`/tmp/tastedev-linux-tests-nginx-presets-controls.log`). No host configuration change; browser rendering and operating tree apply remain pending. Overall PARTIAL.

### 2026-10-03 — nginx sites/snippets tree

Tree discovery and GUI now include sites-available, sites-enabled and snippets in addition to nginx.conf/conf.d, up to 100 entries per directory. Missing optional directories do not warn. In-root enabled-site symlink resolves for reading; out-of-root link produces an error and empty source. Directory links are refused. Temporary fixture verifies site symlink, snippet nodes and external-link refusal (1 passed). Read-only discovery does not establish include activation or modify sites. Full suite/build/rendering remain pending for this change; overall PARTIAL. Updated original sudo completion row to reflect implemented code without claiming host E2E.

### 2026-10-03 — nginx tree bounded file reads

Read paths reject symlinked parent directories; final files open NOFOLLOW/NONBLOCK and are read through a bounded 256KB buffer. Regular-file type, size, fatal UTF-8, inode/device/mtime/size and enabled-link target are rechecked before returning source. This is change detection, not a filesystem atomic snapshot. Added oversized/invalid-encoding/directory-link fixtures. Full isolated suite: 321 passed, 0 failed/skipped (`/tmp/tastedev-linux-tests-nginx-tree-files.log`). Host files/services unchanged; native operating apply and current browser rendering remain pending. Overall PARTIAL.

### 2026-10-03 — nginx include node navigation

Selecting an include directive shows matching already-discovered files and opens their tree nodes. Supports exact absolute in-root paths and leaf \* wildcard, including quoted paths; ambiguous relative paths, traversal, variables and unsupported glob forms are explicitly unsupported. Does not claim actual activation/native glob completeness. Pure navigation tests: 2 passed; nginx tree JSX compilation passed. Eight catalogs include title/empty state, English fallback covers detailed notices. Build and rendered navigation remain pending; overall PARTIAL.

### 2026-10-03 — nginx include navigation compiled GUI evidence

Compiled React hook fixture renders the sites/snippets folders, selects a discovered include target button and verifies selected file state and parent callback. Full isolated suite: 324 passed, no failures/skips (`/tmp/tastedev-linux-tests-nginx-include-ui.log`). Production build passed (`/tmp/tastedev-linux-build-nginx-include-ui.log`) and preview refreshed with operating flags off. This is component handler evidence, not browser visual/E2E; arbitrary operating config apply remains incomplete. Current Debian candidate predates latest nginx tree additions. Overall PARTIAL.

### 2026-10-03 — nginx general file update primitive

Added internal updateNginxFile transaction for fixed nginx.conf/conf.d/sites-available/snippets paths, existing files only. Rejects sites-enabled/traversal/hidden/nested targets and unknown request fields; requires trusted full-graph native validation, graph/service inspection, activation and recovery hooks. Candidate text/hash/inode checks, current-version conflict handling, private backup and reload failure recovery reuse configTransaction. Temporary fixture confirms missing hooks are blocked and simulated reload failure restores original with backup (2 passed). Native full graph hooks, root/helper/API/GUI and real reload E2E remain unimplemented; not an exposed operating feature. Host config/services unchanged. Overall PARTIAL.

### 2026-10-03 — nginx file transaction serialization

Internal general-file updates acquire a shared nginx graph lock before file transactions. Distinct-file concurrent request fixture is rejected with 409, validation failure releases locks and leaves source/backups unchanged. Candidate mutation inside the validation hook is rejected with 409 before backup/reload. Full isolated suite: 328 passed, no failures/skips (`/tmp/tastedev-linux-tests-nginx-file-transaction.log`). This new primitive is not wired to the existing operating helper lock/native graph checks/API/GUI yet. Real services/configurations unchanged; overall PARTIAL.

### 2026-10-03 — nginx include graph inventory

Added internal bounded nginxTopology and assertNginxGraphVersion. Parses nested include directives, absolute in-root literal/leaf _ or _.conf patterns and in-root site links; records content hashes, resolved identities, include edges and directory listing hashes without raw configuration. Unsupported paths, cycles, unsafe ownership/permissions and limits mark graph incomplete and cannot pass version assertion. Fixture confirms nested linked site/include traversal, no source-secret exposure and rejection after include file addition; cycle/relative paths incomplete (2 passed). ASCII structural ordering does not prove native libc glob ordering; filesystem graph is not an atomic snapshot. Native full-graph candidate validation, service identity/hooks and operating API/GUI remain pending. Overall PARTIAL.

### 2026-10-03 — nginx linked-source candidate graph

Virtual graph overrides now propagate through the canonical source of an enabled-site symlink. Conflicting overrides for alias/source produce an incomplete graph. Traversal completion also rechecks include directory listing hashes and safe directory metadata. Three topology fixture tests passed, including candidate introducing a new snippet via linked source while original remains unchanged. Native private candidate creation/validation, operating helper/API/GUI apply remain pending; no native nginx execution or host change. Overall PARTIAL.

### 2026-10-03 — nginx private whole-graph candidate

Added internal nginxCandidate: obtains original/reviewed virtual graphs, copies bounded include sources into private temporary files, replaces include directives with explicit candidate paths and rechecks both graph versions. Bundle identities are WeakMap-registered and immutable; assertions check private directory/files, empty-include directory, content hashes and file identity. Cleanup unregisters the bundle. Temporary fixture passed for include rewriting, original preservation, changed server port, tamper rejection and invalidation after cleanup (1 passed). Raw candidate source/path is internal only. Native validator integration remains pending; explicit ASCII include ordering and operational log/certificate/resource paths still require native service-context review. No host nginx execution/change. Overall PARTIAL.

### 2026-10-03 — nginx candidate output isolation

Private candidate redirects common access/error logs, pid and five temporary path directives to candidate storage, retaining remaining arguments/log formats/levels. Adds explicit private HTTP access log to override the compiled default. Bundle reports outputPathsIsolated:true and operationalResourcesVerified:false; validates private logs directory. Focused candidate/output tests: 2 passed. This does not validate original destination syntax/permissions, arbitrary module side effects or all cache-resource directives. Native execution remains unconnected and operating apply must stay gated until full resource/service review. Overall PARTIAL.

### 2026-10-03 — native nginx whole-candidate syntax evidence

Added trusted internal validateNginxCandidate with registered candidate checks before/after, fixed nginx binary/argv/environment, deadline/output bounds and generic failure text. Native temporary fixture PASS: whole include graph accepted, log/PID output paths isolated, invalid included directive rejected, fixture original preserved. Actual `/usr/sbin/nginx` SHA-256 `94eb839f1cdc7f3f42062d352b504fe406e2f888d83b554af7ea25bcdc9506f5`. Evidence `.runtime/verification/nginx-candidate-native-2026-10-03T09-11-30.776Z.json`. Sandbox first attempt failed; approved isolated native execution passed. No service start/reload or operating file change. `npm run verify:nginx:candidate` added. Operational resource/module safety, service identity, apply helper/API/GUI and native rollback E2E remain pending; overall PARTIAL.

### 2026-10-03 — nginx whole-graph apply orchestration

Internal applyNginxConfiguration binds selected file version to a reviewed complete graph and reachable/canonical include source. Builds/verifies a private whole-graph candidate; requires separate operational validation and service identity/reload/recovery hooks. Graph and candidate are checked around inspection, commit, activation and recovery. Fixture verifies operational validation failure restores original before reload and inspection-time external edits are preserved/rejected without backup or activation. Full isolated suite: 335 passed, no failures/skips (`/tmp/tastedev-linux-tests-nginx-whole-apply.log`). Mandatory operational/service hooks are still test substitutes; root helper/API/GUI/native rollback integration remains pending. Original operating files/services untouched. Overall PARTIAL.

### 2026-10-03 — nginx startup scope parser

Added nginxBuildScope for verified nginx -V compiled main/prefix and nginxServiceScope for fixed nginx argv or recognized master-process title. Allows matching explicit -c/-p, stderr -e and daemon/master globals only; rejects alternate main/prefix, duplicate options, signal commands and unknown globals without echoing process arguments. Pure parser fixtures: 2 passed. Caller still must verify actual systemd MainPID, native executable identity and process ownership; no live inspection/helper wiring yet. No host service/config change; overall PARTIAL.

### 2026-10-03 — nginx read-only service inspector

Added inspectNginxService: fixed read-only systemctl show and native nginx -V; verifies loaded/active MainPID, root-owned master process, /proc executable path, root UID fields and stable start/argv around a second manager read. Returns scope/PID/start metadata without argv. Injected fixture checks stable identity, PID reuse, inactive/duplicate/malformed state and proc start parsing (2 passed). Actual live host inspection not performed; root service/process permissions and operational resources still need native evidence. Root helper/API/GUI apply remain unconnected. No service/OS change; overall PARTIAL.

### 2026-10-03 — nginx operational hooks

Added trusted nginxOperationHooks factory. Pins inspected PID/start/main/prefix per operation, validates fixed main with native nginx -t and compiled prefix, uses fixed systemctl reload nginx.service and reinspects identity before/after validation and reload. Native executor verifies root-owned non-writable binary path chain, fixed environment/deadline/output limits and generic errors. Mock execution tests prove command arguments, no factory side effects and changed-master denial. Full isolated suite: 341 passed, no failures/skips (`/tmp/tastedev-linux-tests-nginx-operation-hooks.log`). Actual root service/reload not executed. Resource/module side effects, locale ordering, root runtime/helper/API/GUI and actual rollback E2E remain pending; overall PARTIAL.

### 2026-10-03 — nginx collation environment guard

Service snapshot extracts only LC_ALL/LC_COLLATE/LANG selection from bounded process environment, excludes other values and detects selection changes. Operational hooks temporarily require C/POSIX environment for the existing ASCII candidate order; other locales require native-order support before deployment. Six focused inspection/hooks tests passed. Environment selection is not a proof of live libc locale or module-induced locale state. Upstream glob implementation reviewed: https://github.com/nginx/nginx/blob/master/src/os/unix/ngx_files.c ; locale semantics: https://man7.org/linux/man-pages/man3/setlocale.3.html . Full locale support, native live process evidence and helper/API/GUI apply remain incomplete. No host changes; overall PARTIAL.

### 2026-10-03 — nginx native include pattern preservation

Private candidates now retain logical directory structure, filenames and include wildcard patterns rather than expanding sorted explicit paths. nginx performs its own glob selection/order. Candidate directory inventories reject added files or directory changes before/after native validation. Focused candidate/apply tests: 3 passed. Current service hooks still temporarily restrict locale until validator execution environment is bound to inspected service locale; do not claim general-locale deployment yet. Native rewritten-pattern recheck recorded separately. Overall PARTIAL.

### 2026-10-03 — nginx validation locale binding and evidence limitation

Candidate/operational validators now accept only sanitized LC_ALL/LC_COLLATE/LANG and service hooks pin those values. Pattern preservation removes the structural C/POSIX-only restriction. Focused hooks test verifies category preservation/change rejection. Upstream process title implementation moves environment memory (https://github.com/nginx/nginx/blob/master/src/os/unix/ngx_setproctitle.c), so /proc/environ cannot independently prove initial locale. Native inspector explicitly reports localeVerified:false; operational hooks require independent verified context and therefore do not authorize real deployment from that metadata alone. Launch-context proof/administrator-reviewed locale selection remains pending along with helper/API/GUI integration. No operating commands executed. Overall PARTIAL.

### 2026-10-03 — explicit nginx locale context review contract

Added internal administrator review validation binding confirmed locale categories to actual trusted service PID/start and reviewed graph SHA. Outputs clearly distinguish administrator-attested locale from observed live libc proof (liveLibcLocaleVerified:false). Reviewed inspector brackets service observation with graph reads; accepts only the reviewed original or a trusted caller-computed candidate graph version for post-commit inspection. Pure tests: 2 passed for confirmation/context conflict/secret field rejection and graph change denial. Not yet an HTTP/GUI feature or operating authorization; native libc initial locale remains unproven, and full helper integration/E2E remain pending. Overall PARTIAL.

### 2026-10-03 — nginx context read helper

Added read-only nginx-context-inspect helper action and audited root runtime dependency closure (five nginx modules). Brackets service inspection with graph reads; returns bounded graph/service metadata, generic unavailable-service reason and no raw configuration/process argv. Helper accepts no caller-selected path/command input. Eight catalogs include action label; package verifier import checks updated. Focused runtime/context tests: 6 passed. Action is not yet exposed in HTTP/GUI; new runtime is not yet rebuilt into Debian candidate. No live root/helper execution or operating change. Overall PARTIAL.

### 2026-10-03 — nginx context HTTP and GUI

Authenticated GET nginx-context now delegates to the fixed read-only helper only when saved sudoWithoutPrompt permission is enabled; existing server/helper gates remain mandatory. nginx GUI provides explicit lookup with bounded configuration graph/service metadata, warning badges and version, without raw configuration/argv. Request generation invalidates results after connection/policy changes and prevents duplicate lookups. Eight catalogs translate status labels. Full isolated suite: 351 passed (/tmp/tastedev-linux-tests-nginx-context-final.log); includes unauthenticated/permission-denied API checks and stale-result GUI test. Production build recorded separately. Real operating apply/recovery, browser-rendered E2E and latest Debian verification remain incomplete. No operating settings or services changed. Overall PARTIAL.

### 2026-10-03 — reviewed nginx apply composition

Internal applyReviewedNginx composes administrator locale attestation, trusted observed service identity, original/candidate graph guards, private native candidate checks, operational validation and reload/recovery hooks. Review input is cloned before asynchronous observations. A stale reviewed PID is rejected before command execution; fixture tests exercise success ordering and first-reload failure with original restoration, operational revalidation and recovery reload. Focused fixture tests: 2 passed. Full isolated suite: 352 passed (second rollback fixture added afterward and checked separately). No actual service commands executed; this composition remains internal pending helper/API/GUI wiring and native deployment E2E. Overall PARTIAL.

### 2026-10-03 — reviewed nginx helper entry

Added fixed nginx-config-apply root helper action, private nginx-config backup directory and reviewed apply import. Audited runtime closure adds nine modules; static recursive closure and installed-helper integrity guards pass. Eight catalogs include action label. Focused runtime/apply fixture suite: 6 passed; full isolated suite: 353 passed. Subsequent syntax checks pass for the helper, package verifier import extension and 120-second nginx apply timeout (allows validation and rollback checks beyond the previous 30-second default). No helper installation or live root execution. HTTP/GUI apply connection and rebuilt Debian/native E2E remain pending. Overall PARTIAL.

### 2026-10-03 — reviewed nginx apply API

POST nginx-config-apply now requires authenticated same-origin JSON, nginxChanges and sudo permission, strict bounded file/text/SHA input and explicit matching process/locale review before fixed helper dispatch. Successful, rolled-back and failed results are audited without configuration contents. Request validator copies locale and rejects unsafe targets, unknown commands and mismatched reviews. HTTP and helper payload limits for this action are 300000 bytes; configuration text remains limited to 262144 bytes. Full isolated suite: 356 passed; after helper-specific payload limit adjustment, focused runtime/request tests: 6 passed and helper syntax checked. Latest preview still runs previous build; GUI apply controls and rebuilt package/native deployment E2E remain pending. No live root execution or operating change. Overall PARTIAL.

### 2026-10-03 — nginx tree draft apply GUI

Changed tree drafts now expose explicit configuration/service inspection, baseline SHA comparison against the complete graph, administrator-reviewed locale categories and reload impact confirmation before nginx-config-apply. Connection/policy/path/text/baseline changes invalidate review and stale responses; duplicate requests are locked. Locale and confirmation controls are disabled during execution. Full isolated suite: 356 passed; subsequently added compiled GUI stale-review/duplicate lookup test: 1 passed. GUI hints now describe draft apply rather than download-only behavior. Newly introduced extended copy still requires catalog translations. Production build and rendered E2E remain pending; no live operating change. Overall PARTIAL.

### 2026-10-03 — nginx apply GUI production/package verification

Full isolated suite: 357 passed (/tmp/tastedev-linux-tests-nginx-apply-release.log). Production build passed (/tmp/tastedev-linux-build-nginx-apply-ui.log); safe preview restarted on 127.0.0.1:8791 with operating features disabled. New Debian candidate SHA-256 a1e9f1bcc7daf9edc57669b9d5dd55b6be3c85ae671fef4a1cf4e13f5d84648c, files 10592. Isolated package verification including PTY, authenticated package pages, root runtime closure integrity/import, and disabled operational mutations passed: .runtime/verification/package-2026-10-03T09-49-45.234Z.json. Package not installed. Actual nginx apply/reload/rollback E2E, rendered browser checks and new GUI copy translations remain incomplete. Overall PARTIAL.

### 2026-10-03 — nginx apply review localization and target affordance

Added six review/locale/apply status strings in all eight catalogs and a coverage check. Tree apply panel is now shown only for supported main/conf.d/sites-available/snippets targets; sites-enabled aliases retain editing/download without offering a rejected apply target. Focused tree/UI/catalog tests: 4 passed before adding the catalog assertion; catalog suite afterward: 3 passed. Latest safe preview/package predate these localization/affordance edits. Additional extended tree/API/error copy and whole-app translation remain incomplete. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx configuration backup reader and restoration composition

Added bounded private nginx-config backup record reader and metadata-only catalog with UUID/path/owner/mode/single-link/fatal UTF-8/content-SHA checks, warning counts and bounded enumeration. Fixture test verifies no source in catalog, unsafe target/symlink/permissions rejection: 1 passed. Internal restoration composes stored original text with reviewed graph/service apply and requires backup target to match selected path; caller cannot submit replacement text. Restore composition syntax checked, but full restore fixture, helper/API/GUI linkage and native E2E remain pending. Latest preview/package predate these changes. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx restore fixture and helper wiring

Restore fixture passes verified stored-byte restoration, pre-restoration undo backup and stale graph rejection without extra commands. Added fixed nginx-config-backups and nginx-config-restore helper actions, audited runtime modules/imports and package verifier export checks. Restore timeout matches reviewed apply at 120 seconds. List accepts no caller-selected paths; restore requires confirmation and internal reviewed apply. Eight catalogs include helper labels. Focused runtime/backup/restore tests: 6 passed; full isolated suite: 360 passed. Helper/verifier syntax checked. Actual helper installation/execution, HTTP/GUI restore and latest package/build remain pending. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx configuration backup HTTP APIs

Authenticated GET nginx-config-backups delegates only the fixed empty-input helper behind sudo permission/server gates. POST nginx-config-restore requires same-origin JSON, nginxChanges/sudo gates, UUID backup ID, supported target, current hashes and explicit matching service/locale review. Strict restore request rejects caller replacement text and unknown fields; actual backup bytes remain helper-only. Result/failure audit records exclude configuration contents. Request tests and authorization/origin/permission tests added. Full isolated suite: 362 passed (/tmp/tastedev-linux-tests-nginx-restore-api.log); API syntax checked. GUI backup comparison/restore selection and latest build/package integration remain pending. No live helper execution or operating change. Overall PARTIAL.

### 2026-10-03 — nginx restoration review plan

Added internal nginxConfigRestorePlan and fixed helper/POST API with authenticated same-origin JSON and sudo/server gates. It verifies backup target, current complete graph, restored include topology, and stable current graph; returns hashes, date and changed-line counts without source text. Existing restoration fixture now checks plan version/include completeness and source omission. Runtime closure includes plan/config-diff modules; eight catalogs translate helper label. Focused closure/restore tests: 5 passed; full isolated suite: 362 passed. API/helper syntax checked. GUI selection and reviewed restoration controls, plan-specific authorization tests, latest build/package and native E2E remain pending. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx backup selection and reviewed restore GUI

Added backup catalog selector and restoration plan summary (target, changed-line counts, original/backup hashes and include status) to nginx GUI. Selection/connection/policy changes clear plan and stale requests are ignored. Reviewed apply panel now supports restoration with fixed backup ID, current graph/service/locale checks and no caller-provided source; graph changes invalidate review. Full isolated suite: 362 passed; subsequently added compiled restoration dispatch test: 1 passed verifying backup identity/source omission/duplicate lock. Actual browser render, backup-selector component stale/error tests, new copy translations and latest production build/package remain pending. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx backup GUI production verification

Added compiled backup selector tests for duplicate review locking, invalidated selection ignoring late plan, and error clearing/status. Selection invalidation also resets busy state. Full isolated suite: 365 passed (/tmp/tastedev-linux-tests-nginx-backups-release.log). Production build passed (/tmp/tastedev-linux-build-nginx-backups.log); safe preview restarted at 127.0.0.1:8791 with operating changes disabled. Browser rendered E2E, expanded copy translations, native nginx lifecycle and updated Debian package verification remain incomplete. No operating change. Overall PARTIAL.

### 2026-10-03 — nginx restoration plan access checks and backup copy

Added HTTP plan tests for missing authentication, cross-origin and disabled sudo permission; strict plan rejects extra command fields in restore fixture. Four backup-selector labels/status strings translated in eight catalogs. Package verifier now checks exported restoration plan function. Full isolated suite: 366 passed (/tmp/tastedev-linux-tests-nginx-plan-security.log); subsequently strengthened restore fixture and focused restore/catalog suite: 4 passed. Package verifier syntax checked. Preview/package predate this copy/test/verifier update. Actual native lifecycle/rendered E2E and broad remaining requirements still incomplete. Overall PARTIAL.

### 2026-10-03 — nginx restoration production/package candidate

Production build passed (/tmp/tastedev-linux-build-nginx-restoration-release.log), safe preview restarted at 127.0.0.1:8791. Latest Debian candidate SHA-256 71b5e4db28c089ed858d5f71f9247c960f448fd60395279f498d66187a4ec93d, files 10596. Isolated package/PTTY verification PASS: .runtime/verification/package-2026-10-03T10-03-51.142Z.json. Extended verifier explicitly checks five new nginx APIs reject unauthenticated/disabled-permission requests without root execution, plus runtime closure imports including restore plan. Package not installed. Native operational apply/restore E2E and rendered browser checks remain unverified; original broad requirements remain PARTIAL.

### 2026-10-03 — Redis reviewed apply request boundary

Started remaining Redis operational linkage: strict prepareRedisApply separates GUI main-file SHA from include graph SHA, accepts only supported typed nonempty changes and explicit restart confirmation, copies change values and rejects arbitrary paths/commands/unknown fields. Pure request tests: 2 passed. Internal applyReviewedRedis checks complete graph plus selected main SHA before mapping to existing orchestration and mandatory native/service hooks; syntax checked, integration fixture remains pending. No API/helper operational entry or native Redis execution enabled. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis reviewed apply integration fixtures

Fixture tests exercise separate main/graph SHA binding: stale main SHA rejects before inspection/validation/backup/activation; verified typed change preserves unrelated authentication directive, validates registered whole candidate, and restores original on restart failure. Secret text does not appear in transaction result. Focused tests: 2 passed; full isolated suite: 370 passed (/tmp/tastedev-linux-tests-redis-reviewed-apply.log). Native validator/service context and helper/API/GUI execution remain missing. No Redis server started and no operating configuration changed. Overall PARTIAL.

### 2026-10-03 — Redis running-service/context inspection

Added read-only fixed systemctl/PID/proc inspection for redis-server.service, verified executable/account/start/argv stability, and explicit-main scope parsing. Rewritten process title cannot prove startup main and is rejected; no fabricated readiness. Injected tests: 2 passed for stable identity and reuse/account/argv/executable rejection with secret omission. Full isolated suite: 372 passed. Subsequently added internal graph-bracketed context reader returning sanitized service metadata/generic unavailable reason; focused context test: 1 passed. No live native service probe or server start. Helper/API/GUI context wiring and review mechanism for rewritten titles remain pending. Overall PARTIAL.

### 2026-10-03 — Redis context helper/API/GUI linkage

Fixed empty-input redis-context-inspect helper added with audited three-module service/context closure; authenticated GET redis-context enforces sudo/server gates before observation. Package verifier import checks extended. Full isolated suite before GUI edits: 374 passed. Shared context panel now accepts action/title and omits absent prefix; Redis configuration GUI uses it with translated title in all eight catalogs. After GUI changes focused package render/context tests: 3 passed. Latest preview/build/package predate this linkage; production and native runtime checks remain pending. No live helper execution or operating change. Overall PARTIAL.

### 2026-10-03 — Redis explicit main context review

Split trusted process identity observation from strict startup-main scope: overwritten titles still cannot infer main, but stable executable/account/PID/start identity can be observed. Added internal administrator-attested Redis main review bound to PID/UID/start/graph SHA, with explicit observedStartupMainVerified status. Reviewed inspector captures input before asynchronous use and brackets observed identity with original/candidate graph guards. Focused identity/review tests: 5 passed; full isolated suite: 377 passed. Read-only context helper still uses strict startup scope; review UI/native validation/application hooks are not connected. Preview/package predate changes; no live server execution or operating modification. Overall PARTIAL.

### 2026-10-03 — Redis native validator prerequisite and isolated command plan

Read-only /usr/bin/redis-server --help probe confirms ENOENT on this host. No installation/server launch attempted. Added registered-candidate-only internal execution plan with fixed TCP/TLS disable, private Unix socket/output paths and persistence overrides. Plan performs no execution and explicitly does not claim external resource isolation or persistence-policy validation; full directive/resource inspection and runner lifecycle remain mandatory prerequisites. Focused plan fixture: 1 passed. Official command-line parameter documentation: https://redis.io/docs/latest/operate/oss_and_stack/management/config/ . Native validator missing; original scope remains PARTIAL.

### 2026-10-03 — Redis context production/package verification

Full isolated suite: 378 passed (/tmp/tastedev-linux-tests-redis-context-release.log). Production build passed; safe preview restarted on 127.0.0.1:8791. Debian candidate SHA-256 3c952286b113288dd09b620a58fe94ce001486c97c3ec03629890c10e50806e0, files 10599. Isolated package/PTTY verification PASS: .runtime/verification/package-2026-10-03T10-15-56.788Z.json, includes Redis context authentication/disabled-permission denial and Redis runtime service/identity imports. Package not installed. Native Redis binary absent; actual service/main review/apply/restore E2E and browser-rendered validation remain incomplete. Overall PARTIAL.

### 2026-10-03 — Redis observed identity versus startup-main UI

Read-only Redis context now uses inspectRedisIdentity, returning bounded PID/UID/start and startupMainVerified independently from main proof. GUI labels missing startup path as unverified and adds review-needed badge; selected graph root is never substituted as observed startup main. Two messages translated in eight catalogs. Focused context/GUI tests: 3 passed; full isolated suite: 379 passed. Subsequently added compiled UI assertion verifies explicit unknown-main warning and no inferred graph-root text: 1 passed. Build/package preview predate change; actual Redis execution/native apply remain unavailable/incomplete. Overall PARTIAL.

### 2026-10-03 — Redis selected-file resource review

Added conservative Redis resource inventory for module/replication/external files/cluster/network/persistence/output directives, returning names/category/line only and no values. Quoted/unsupported directive syntax is flagged for review, not considered safe. Redis config-operation-plan includes explicit selected-file-only resourceReview; include-wide/native proof is not claimed. Full isolated suite before final scope/bounds adjustment: 382 passed. Response then bounded to 256 records with total/truncation fields; focused tests afterward: 3 passed for secret omission, input bounds/unsupported syntax and inventory truncation. Native binary absent; no runner/server execution. Preview/build/package predate change. Overall PARTIAL.

### 2026-10-03 — Redis whole private candidate resource inventory

Added registered-candidate bounded traversal of copied main/include files with private-owner/single-link/NOFOLLOW/size/total limits and pre/post candidate integrity checks. Reports directive category/path/line only; 256-record inventory cap retains total/truncation. Validation command plan includes whole-private-candidate inventory while explicitly withholding isolation/native/persistence proof. Include fixture verifies nested module/replication detection, value omission and candidate mutation rejection. Focused tests: 2 passed; full isolated suite: 384 passed. Native Redis binary still absent; actual runner/resource approval and operational hooks remain incomplete. No process start or operating changes; preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis operation-plan resource review GUI

Redis package change plan now renders resource review table (line/directive/category), selected-file scope explanation, unsupported-syntax count and omitted-record count. No directive values rendered; compiled component test includes injected secret value and verifies omission. Four title/status labels translated in all eight catalogs; extended hint/category translation remains incomplete. Focused package/resource render tests: 3 passed; full isolated suite: 385 passed. Latest preview/build/package predate UI change. Native Redis runner/apply/restore E2E and whole requested scope remain incomplete. Overall PARTIAL.

### 2026-10-03 — Redis review localization and package candidate

Twelve remaining resource hints/categories translated in eight catalogs; coverage test verifies all sixteen review strings across them. Focused translation/GUI tests: 4 passed; subsequent catalog coverage suite: 4 passed. Production build passed (/tmp/tastedev-linux-build-redis-resource-ui.log); safe preview restarted. Debian SHA-256 60d3ad5bd7a8ff10c9be2585fe78e65731e8f22153e94db1a6b5aaf4900ede83, files 10599, installed false. Isolated package/PTTY verification PASS: .runtime/verification/package-2026-10-03T10-26-10.413Z.json. Native Redis runner/apply/restore, actual browser-rendered checks and original broad requirements remain incomplete. Overall PARTIAL.

### 2026-10-03 — Redis candidate validator lifecycle contract

Added internal validator orchestration with mandatory trusted runtime/resource/start/readiness/stop/cleanup hooks, registered candidate integrity checks and actual 10-second readiness deadline. No default native runner; reviewed resource isolation required before start. Success explicitly excludes operational-resource/persistence proof. Fixture tests cover denied resource review without start, failed readiness with stop/cleanup, success ordering and sanitized cleanup failure. Full isolated suite: 387 passed; subsequent cleanup-error sanitization focused test: 1 passed. Native binary absent and real hooks are not implemented/connected; no Redis server started. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis private runtime filesystem hooks

Added registered /tmp validation directory create/verify/cleanup hooks with owner/mode/inode/device binding, fixed output filename allowlist, single-link/file-size/socket checks and no cleanup for unregistered/unsafe roots. Fixture tests cover permitted output, symlink/unexpected file/permissions rejection and registration removal after cleanup. Full isolated suite: 389 passed. Subsequently integrated real temporary runtime hooks into mocked validator lifecycle; focused lifecycle test: 1 passed. Output creation still requires private file/socket permissions by future native runner. No Redis process started; real resource reviewer/runner/native lifecycle remain missing. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis validation process adapter

Added internal fixed /usr/bin/redis-server no-shell process adapter with mandatory trusted plan verifier/probe, private output umask restored synchronously after launch, ignored stdout/stderr, owned child tracking, SIGTERM closure wait and bounded SIGKILL fallback. Error event does not count as closed; generic readiness failures and foreign handles are rejected. Mocked process tests: 3 passed for launch/umask, close ordering, denial, error and launch-failure restoration. Full isolated suite: 392 passed. No real server launched; binary/resource verification and real socket probe remain pending before native execution/helper integration. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis isolated Unix-socket readiness probe

Added private registered-runtime/socket-owner checks and Unix-only bounded RESP PING probe. Accepts bounded PONG/NOAUTH while explicitly withholding operational authentication proof; raw reply details are never returned. Response limit 1024 bytes, per-attempt timeout and overall deadline, child-exit rejection and socket destruction implemented. Mocked tests cover fragmented response, credential-detail omission, exited/unsafe runtime refusal and timeout cleanup: 4 passed. Full isolated suite before added timeout case: 395 passed. No real socket/server execution; native binary absent and full resource approval/runner integration remain pending. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis native binary review and launch gate

Added fixed-path default root-owned executable fingerprint with safe parent directories, NOFOLLOW/single-link/size limits, SHA-256 and inode/device/stat stability checks; reviewed fingerprint rejects changed content/identity. Fixture-only dependency overrides never enter HTTP. Full isolated suite before process integration: 397 passed. Subsequently connected default binary inspection to process adapter before launch; trusted binary denial blocks spawn. Focused binary/process tests: 5 passed. Native binary remains absent; no Redis process started. Resource reviewer/native integration and operational apply/restore remain incomplete. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis native validation composition

Composed candidate/runtime/binary/process/socket lifecycle under mandatory independent resource reviewer. Command plan and argv frozen before review; only same registered plan/runtime can launch, and reviewed binary fingerprint rechecked immediately before spawn. Real private-runtime plus mocked-process fixture verifies denied resource review, unchanged binary success/cleanup, changed binary rejection and command mutation rejection. Full isolated suite: 399 passed (/tmp/tastedev-linux-tests-redis-native-composition.log). No actual Redis process launched. Native binary absent and independent full resource reviewer still missing; no helper/API operating application enabled. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis namespace sandbox command plan

Added fixed bubblewrap plan with unshared namespaces, dropped capabilities, cleared environment, read-only /usr and registered candidate mounts, and one writable private runtime mount. Host /etc, /run sockets and data directories are not mounted. Focused fixture test: 1 passed, including invalid candidate/runtime refusal and immutable argv. This is planning only: no sandbox or Redis process executed; kernel namespace availability, memory bounds, native runner integration and operational application remain unverified. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis sandbox resource-limit plan

The sandbox command now invokes fixed /usr/bin/prlimit inside the namespace: 512 MiB virtual address space, 10 CPU seconds, 1 MiB output file size, 128 open descriptors, 32 user processes and no core dumps. This is not a wall-clock deadline or an aggregate memory/cgroup guarantee; process-count enforcement depends on execution identity. Focused plan/native-composition fixtures: 3 passed. No process executed, no operating service changed; actual limit enforcement and trusted sandbox-runner integration remain pending. Overall PARTIAL.

### 2026-10-03 — Redis sandbox plan hardening and regression

Added bubblewrap nested-user-namespace disabling/assertion and a 16 MiB /tmp tmpfs plan. Complete isolated regression suite: 400 passed, zero failures (/tmp/tastedev-linux-tests-redis-sandbox.log). This verifies code contracts and existing fixture coverage, not kernel sandbox availability or real Redis startup. Runtime launcher wiring, actual native validation and operating apply/restore remain incomplete. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Redis sandbox process adapter

Added registered immutable sandbox plans and internal process adapter using existing readiness/termination hooks. Original validation object/runtime identity must match, binary review remains mandatory, and independent sandbox review occurs immediately before fixed bwrap launch. Mocked fixtures verify rejected review makes zero launches, forged plans/validation and wrong runtime are denied, and accepted wrapper uses lifecycle cleanup. Focused suite: 5 passed. No real process launched; native composition wiring and actual sandbox/executable review remain pending. Overall PARTIAL.

### 2026-10-03 — Redis sandbox lifecycle composition

Connected immutable sandbox plan and process adapter to registered-runtime candidate validation lifecycle. Trusted sandbox inspection remains mandatory before review and again immediately before launch; Redis fingerprint is rechecked. Fixture uses real temporary runtime and mocked child: refused review starts nothing, accepted review invokes fixed bwrap, readiness/termination succeed and runtime is removed. Focused candidate/sandbox fixtures: 2 passed. No actual Redis/bwrap execution; real wrapper executable/namespace verification and operational GUI apply remain incomplete. Overall PARTIAL.

### 2026-10-03 — Redis sandbox executable integrity gate

Added fixed bwrap/prlimit root-owned executable fingerprints using existing bounded NOFOLLOW filesystem inspector; both snapshots are rechecked immediately before sandbox launch. Tests reject altered hashes/paths and immutable-record mutation; focused suite 2 passed. Read-only host wrapper inspection was rejected by the strict filesystem inspector; cause requires investigation. Neither wrapper nor Redis was executed. Namespace availability, approved native execution and actual operating apply remain pending. Overall PARTIAL.

### 2026-10-03 — Redis fingerprint mutation rejection and namespace evidence

Captured immutable serialized fingerprints before asynchronous review for both native and sandbox compositions. Sandbox composition requires exactly the two fixed wrapper fingerprints; tests reject empty snapshots and in-place mutation before launch (zero extra launches). Focused sandbox tests 2 passed and native test 1 passed. Current agent namespace maps only UID/GID 1000 to outside ID 0; /usr and wrapper files appear as nobody. Root ownership cannot be proved inside this namespace; production ownership guards were retained. No host permission/service changes or actual server execution. Overall PARTIAL.

### 2026-10-03 — Redis failure cleanup ordering

Fixed candidate lifecycle to preserve runtime if child termination fails; cleanup runs only after successful stop or when no process started. Updated failure test to require no cleanup following stop failure. Sandbox composition fixtures additionally verify readiness failure stops child/removes private runtime and changed Redis fingerprint denies launch/removes unused runtime, without leaking error details. Complete isolated suite: 401 passed, zero failures (/tmp/tastedev-linux-tests-redis-sandbox-cleanup.log). Real execution/namespace ownership gate remains unverified. Overall PARTIAL.

### 2026-10-03 — Redis backup GUI request locking

Redis backup metadata/restore-plan UI already exists. Added synchronous request lock and handler-side permission/disabled checks; refresh clears previous restore selection and metadata before requesting a fresh list. Compiled component interaction fixture verifies consecutive clicks before React rerender issue one API request and clear previous selection. Focused test: 1 passed. Preview has not been rebuilt; browser/rendered E2E and actual restoration remain unverified. Overall PARTIAL.

### 2026-10-03 — Redis updates production preview

Production Next build passed (/tmp/tastedev-linux-build-redis-sandbox.log). Stopped only confirmed own preview session 6521 and restarted current build as session 47875 on 127.0.0.1:8791 with operating mutations disabled. Read-only HTTP: /login 200; /ide/packages/redis and /packages 307 to dedicated login with preserved next route. Browser rendered/authenticated interaction remains unverified, package not rebuilt. Overall PARTIAL.

### 2026-10-03 — Current Redis updates packaged and isolated verification

Rebuilt dist/tastedev-linux_0.1.0_amd64.deb from current production build; SHA-256 f0a9a3dd955cf6893d50bffe7f67ede292fb4352a5f6e5736b90e4adbdb8635a. package:verify -- --terminal PASS, files 10599, installed false. Evidence .runtime/verification/package-2026-10-03T10-57-04.963Z.json includes isolated fixture account/password revocation, canonical authenticated package routes, permissions, native nginx draft checks and PTY lifecycle. This is extracted-package HTTP/PTY coverage, not apt installation/upgrade or rendered GUI E2E or operational Redis execution. Overall PARTIAL.

### 2026-10-03 — Native bubblewrap capability check

Approved harmless host /usr/bin/true namespace probe initially failed: --disable-userns requires explicit --unshare-user. Corrected production sandbox plan to include --unshare-user; same no-network/no-service true probe then exited 0. This proves basic namespace creation on current host, not complete Redis sandbox mounts/startup. Read-only host wrapper fingerprints/root ownership passed: bwrap 523da3e7399044be5163aee6f57a77a6bef7454376e28f0a0627920bae1b76b6; prlimit cb28811cb3902773c1a0f3ac0ea554c7a1e232724e9d4cae055ede54b65a7bc4. Focused fixtures 2 passed. Redis not started, host configuration unchanged. Current preview/package predate explicit user-namespace correction. Overall PARTIAL.

### 2026-10-03 — Native Redis sandbox infrastructure fixture

Added verify:redis:sandbox script using registered candidate/runtime and the complete planned bwrap/prlimit mounts, replacing only Redis payload with a fixed shell infrastructure probe. Approved execution PASS: candidate read-only, runtime writable/private, host passwd/systemd absent, virtual address-space/open-descriptor/core limits enforced, original fixture preserved, temporary files cleaned. Evidence .runtime/verification/redis-sandbox-native-2026-10-03T10-59-51.904Z.json. This does not execute Redis directives/start Redis or prove all limits/network behavior/operating resources. Actual Redis candidate validation and GUI application remain pending. Overall PARTIAL.

### 2026-10-03 — Native sandbox namespace and file-limit enforcement

Extended infrastructure verifier to compare actual network/PID namespace IDs with caller and attempt a 2 MiB write under 1 MiB RLIMIT_FSIZE. Both namespace IDs differ; write fails and resulting private file is exactly 1 MiB. All previous mount/private-runtime/limit checks still pass; fixture cleanup succeeds. Evidence .runtime/verification/redis-sandbox-native-2026-10-03T11-01-06.056Z.json. No Redis server/directive validation or operating service changes; overall PARTIAL.

### 2026-10-03 — Redis restoration request snapshot

Added strict Redis restore request parser and connected it at internal restoration entry before asynchronous filesystem work. Accepts backup ID, explicit confirmation and four SHA-256 versions only; rejects request-controlled paths/commands/unknown fields and freezes copied identity against caller mutation. Focused restore request/transaction tests 4 passed, including conflict/rollback/undo backup preservation fixtures. Native validator/service hooks remain mandatory; no public operating restoration enabled. Preview/package unchanged. Overall PARTIAL.

### 2026-10-03 — Internal sandbox availability reviewer

Added trusted internal reviewer using registered immutable plan and fixed true payload under complete bwrap/prlimit mount plan, 3-second timeout, no shell and ignored output. Wrapper fingerprints checked before/after; failures return false without native error details. Fixture verifies forged plan rejection/no execution, fixed payload and failure denial; 1 test passed. Native infrastructure verifier now calls this reviewer before existing enforcement probes and passes. Reviewer does not inspect Redis directives or replace surrounding candidate/runtime identity checks; operating apply/restore still unconnected. Overall PARTIAL.

### 2026-10-03 — Default Redis sandbox reviewer connection

Connected real internal sandbox availability reviewer as the default sandbox candidate validator dependency; trusted fixture overrides remain internal. Real startup still requires fixed Redis binary integrity, candidate/runtime checks and readiness, with no operating resource/persistence proof inferred. Complete isolated regression suite: 403 passed, zero failures (/tmp/tastedev-linux-tests-redis-default-review.log). Actual host Redis executable absent; no Redis started. Preview/package predate latest sandbox/recovery changes. Overall PARTIAL.

### 2026-10-03 — Redis executable status in context GUI

Added fixed executable integrity observation to Redis context helper and packaged dependency closure. Context metadata distinguishes missing executable from ownership/permission rejection without native error text, argv or config secrets. Shared GUI renders the explanatory status only when supplied by Redis; eight catalogs translated. Focused context/UI fixtures: 4 passed. Current preview/package not rebuilt; actual browser interaction and Redis native startup remain pending. Overall PARTIAL.

### 2026-10-03 — Redis status build/package refresh

Complete isolated tests 404 passed (/tmp/tastedev-linux-tests-redis-status.log); production build passed (/tmp/tastedev-linux-build-redis-status.log). Replaced only own preview with current build, session 67449 on 8791, operating changes disabled. Current .deb SHA-256 36fe1379fec051e21d5ab07d089ff35ce9b715beb876c6924830fb89c009aa14, files 10600, installed false. Extracted package+PTY verification PASS, evidence .runtime/verification/package-2026-10-03T11-08-44.034Z.json; root helper closure includes Redis binary inspector. Actual Redis startup/operating apply, rendered GUI and production apt install remain unverified; overall PARTIAL.

### 2026-10-03 — Preserve package GUI after session expiration

Console authentication/status and API-401 redirects now preserve the canonical selected package path instead of reducing it to /ide or /server-settings. Shared consoleRoute accepts only six known package IDs and retains static page fallbacks; callback/effect dependencies include selection. Focused route tests 3 passed including all package return paths and arbitrary input refusal. Preview/package not rebuilt; actual browser expiration/relogin remains unverified. Overall PARTIAL.

### 2026-10-03 — Console stale refresh suppression

Added console refresh generation guard: latest status/security pair alone publishes, invalidated on authentication failure, logout start/success, account change and authentication-effect cleanup. Prevents in-flight older refresh from restoring package/security/job display after newer snapshot or session invalidation. Focused refresh/route tests: 4 passed. Current preview/package not rebuilt; browser logout/route race E2E remains unverified. Overall PARTIAL.

### 2026-10-03 — Ignore invalidated console request failures

Console snapshot guard now discards failed status/security requests after request invalidation or replacement, while propagating the current request error. Focused interaction fixture verifies no publication on stale failures and latest error preservation; 2 tests passed. Preview/package not rebuilt; full goal remains PARTIAL.

### 2026-10-03 — Compiled console session interaction verification

Added actual ConsoleWorkspace SWC-compiled interaction fixture with mocked React/router/fetch dependencies. Clicking refresh then logout before status/security replies preserves cleared state; API 401 from selected Redis tool redirects to /login?next=%2Fide%2Fpackages%2Fredis. Test restores global fetch in finally. Focused compiled component test 1 passed. This confirms component wiring in addition to guard unit tests, not rendered browser E2E; preview/package not rebuilt. Overall PARTIAL.

### 2026-10-03 — Invalidate obsolete console API session responses

Added API request generation captured before fetch and checked after JSON decoding, invalidated on page-effect cleanup/auth failure/logout/account changes. Obsolete responses abort before changing session state or redirecting. Compiled console fixture now includes delayed 401 after completed logout and verifies final /login redirect and cleared state survive; focused fixture passed. Current-route 401 still preserves selected package. Preview/package not rebuilt; browser routing E2E remains unverified. Overall PARTIAL.

### 2026-10-03 — Console session fixes production preview

Complete isolated regression suite: 408 passed, zero failures (/tmp/tastedev-linux-tests-console-session.log). Production build passed (/tmp/tastedev-linux-build-console-session.log). Stopped only own session 67449 and restarted current preview session 97733 on 127.0.0.1:8791 with operating mutations disabled. Current preview includes canonical package login return and stale console API/status suppression. .deb remains previous build; rendered browser E2E/operational Redis/apt installation remain incomplete. Overall PARTIAL.

### 2026-10-03 — Login submission lock and password cleanup

Added synchronous ref lock to LoginScreen before requests, disabled credentials during pending request and cleared password in finally including transport failures. Compiled interaction fixture verifies rapid duplicate submits issue one request, transport failure clears password/releases lock, and retry becomes available. Focused test 1 passed. Setup instructions already distinguish packaged sudo CLI from source-directory npm setup; no account altered. Preview/package not rebuilt; actual browser login remains unverified. Overall PARTIAL.

### 2026-10-03 — Reviewed Redis draft validation orchestration

Added strict request/main+graph version validation, registered whole candidate generation, default sandbox startup validator, post-validation original graph recheck and candidate cleanup. Result whitelists hashes/scope with operating resources/persistence unverified; no file replacement/service restart. Cleanup-required native failures preserve candidate for inspection and retain 500 status. Fixture test passes original/secret preservation, candidate removal, native error omission and stale graph refusal. Helper/API/GUI validation action still to connect; actual Redis binary absent. Overall PARTIAL.

### 2026-10-03 — Redis isolated validation helper dispatch

Added fixed redis-config-validate helper action, root runtime import/dispatch, audited dependency closure and action label in eight catalogs. Root-owned manifest/checkout refusal remains unchanged. Dependency traversal test now starts at reviewed Redis validator and checks exact full packaged closure with no indirect module loading. Focused runtime/helper/validation suite 6 passed. Authenticated API/GUI action still to connect; no native Redis process executed and current package/preview not refreshed. Overall PARTIAL.

### 2026-10-03 — Authenticated Redis isolated validation API

Added POST redis-config-validate allowlist, strict request parser, same-origin/authentication and databaseChanges+sudo gates before fixed helper execution; audit records requested/completed/failed without request config values. Added unauthenticated/cross-origin/disabled-permission regression cases. Complete isolated suite: 411 passed (/tmp/tastedev-linux-tests-redis-validation-api.log). No real helper/Redis successful execution, GUI button and current build/package refresh remain pending. Overall PARTIAL.

### 2026-10-03 — Redis isolated validation GUI connection

Connected Redis operation-plan GUI to authenticated redis-config-validate API. Explicit temporary-process confirmation, permission gating, synchronous duplicate lock, generation invalidation and limited success scope notice added; three notices translated in eight catalogs. Compiled component test verifies exact reviewed fields, one request for repeated clicks and stale result discard. Focused GUI/package rendering suite 3 passed. Native Redis binary absent, current preview/package not rebuilt; real startup/GUI E2E remain unverified. Overall PARTIAL.

### 2026-10-03 — Redis validation GUI production/package verification

Full isolated suite 412 passed; production build passed (logs /tmp/tastedev-linux-tests-redis-gui-validation.log and /tmp/tastedev-linux-build-redis-gui-validation.log). Current preview session 56045 on 8791 includes Redis validation GUI/API/helper and login lock; operating changes disabled. Current .deb SHA-256 12c95a7744dc329303f27fa7154bf4ac600a1446a3c4cdcaae799eaed7911c4b, files 10615, installed false. package+PTY verification PASS including new Redis validation authentication/disabled-permission rejection and full root runtime export import; evidence .runtime/verification/package-2026-10-03T11-26-16.605Z.json. Actual Redis startup, GUI E2E, operating apply/restore and apt install remain pending. Overall PARTIAL.

### 2026-10-03 — Redis validation conflict and cleanup evidence

Added fixture that changes original main during successful native-hook validation: result is rejected 409, concurrent edit preserved and private candidate removed. Cleanup-required 500 fixture preserves candidate/original and omits native details; fixture then explicitly removes its own retained candidate. Focused reviewed/UI suite 3 passed. Requested explicit permission for actual isolated Redis server execution under QA-01 safe-environment/permission requirement; pending response is not approval. No Redis started. Overall PARTIAL.

### 2026-10-03 — Actionable missing Redis executable validation error

Sandbox validation now maps fixed Redis binary ENOENT to a safe unavailable code; reviewed validation preserves a translated package-installation hint while suppressing native paths. Other native failures remain generic and cleanup/conflict statuses unchanged. Reviewed/sandbox fixtures verify no launch and no private error details, 3 tests passed (sandbox rerun also passed). No real Redis execution; approval remains pending, preview/package not refreshed. Overall PARTIAL.

### 2026-10-03 — Account security localization coverage

Filled 31 missing account/password catalog entries across Japanese, Chinese, German, French, Spanish, Russian and Arabic without overwriting existing translations. Password mismatch/failure, all-session revocation notice and account controls now have explicit translations in eight shipped catalogs including English. Source-derived translation coverage test plus existing config language tests: 5 passed. Remaining whole-app/321-locale translation scope remains incomplete; current preview/package not rebuilt. Overall PARTIAL.

### 2026-10-03 — AI connection/log-import localization

Added missing AI helper title, purpose, availability/server setup/connection statuses and masked-log import notices across seven non-English catalogs, preserving existing translations. Eight shipped catalogs now explicitly cover these eight UI strings; language regression suite 6 passed. Analysis consent/cost/privacy copy and whole-app/321-locale translations still incomplete, actual AI quota success and browser flow unverified. Preview/package not rebuilt; overall PARTIAL.

### 2026-10-03 — AI consent/privacy/cost localization

Added log input/source, manual privacy review, selected-log-only OpenAI transfer and possible API cost disclosure, explicit consent, nonautomatic recommendations and truncated-output messages to seven non-English catalogs. Source-derived coverage found and fixed missing exact whitespace-prefixed English truncation key. All 16 literal AI assistant strings now covered in eight shipped catalogs; language suite 7 passed. Dynamic/backend text, other locales, actual API success and rendered RTL E2E remain incomplete. Preview/package not rebuilt; overall PARTIAL.

### 2026-10-03 — Password-change GUI submission protection

Added synchronous password-change submit lock, disabled credential fields during pending requests and current-password cleanup in finally including transport failures. Compiled fixture verifies one request for rapid submit, failed transport clears current credential/releases busy and does not invoke account-changed callback. Focused account/language suite 8 passed. No account changed; preview/package not rebuilt, actual browser flow remains unverified. Overall PARTIAL.

## 2026-10-03 도구 탐색 연결 보완

- 도구 아이콘은 현재 선택 패키지가 설치되어 있으면 해당 전용 GUI 경로를 유지하며, 그렇지 않을 때만 첫 설치 패키지를 선택한다.
- 대시보드 IDE 버튼은 설치 상태가 확인된 패키지에만 활성화한다.
- package-selection 및 실제 컴파일된 console-workspace 세션 테스트: 2 PASS. 이번 변경의 빌드·렌더링·미리보기 반영은 아직 미검증이다.
- 전체 목표는 PARTIAL이며 실제 운영 변경, GUI/E2E, 배포 설치 등 기존 미완료 게이트는 그대로 남아 있다.

## 도구 탐색 빌드 및 패키지 반영

- 현재 선택된 설치 패키지 유지 동작을 컴파일된 콘솔 테스트에서 직접 클릭하여 확인했다. 관련 테스트 2 PASS.
- production build PASS: /tmp/tastedev-linux-build-tool-navigation.log.
- 로컬 미리보기 8791 재시작 완료. 렌더링 GUI는 미검증.
- package:deb 및 package:verify -- --terminal PASS. 검증 로그: /tmp/tastedev-linux-package-verify-tool-navigation.log. 호스트 설치는 수행하지 않았다.
- 전체 목표 PARTIAL 유지.

## nginx·Certbot·cron 작업 중복 요청 방지

- ServerManager 작업 실행에 동기 ref 잠금을 추가했다. React 재렌더링 전 연속 클릭에서도 하나의 작업만 실행하며, 연결이 끊긴 상태에서는 실행하지 않는다.
- 연결 세대 변경 시 잠금을 초기화하고 이전 작업의 finally가 새 작업 잠금을 해제하지 않도록 토큰으로 구분한다.
- 컴파일된 실제 컴포넌트에서 중복 클릭, 연결 변경, 이전 응답 무시, cron 및 인증서 선택 흐름 검사 1 PASS.
- 최신 변경의 production build 및 미리보기 반영은 다음 검증 단계이며 전체 목표는 PARTIAL이다.

## 서버 GUI 작업 잠금 반영 검증

- 전체 격리 테스트 417 PASS, production build PASS. 연결이 끊긴 상태의 직접 핸들러 호출도 API 작업을 실행하지 않는 것을 컴파일된 컴포넌트 추가 검사로 확인했다.
- 미리보기 8791 재시작 완료. 브라우저 렌더링은 미검증이다.
- 패키지 생성 및 package:verify -- --terminal PASS. SHA-256: 08a692f2d4b716ceea179f1937fa51f715a73889c5a389093e0093b2035ea2f5
- 검증 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T11-45-27.398Z.json
- 호스트 설치/운영 서비스 변경/실제 ACME 발급은 수행하지 않았다. 전체 목표 PARTIAL 유지.

## 설치 화면 요청 중복 방지

- 콘솔 perform 작업은 동기 ref 잠금으로 재렌더링 전 중복 요청을 방지한다. 응답 세대가 변경된 오류는 새 세션 화면에 표시하지 않는다.
- 로그아웃은 진행 중인 조회 작업과 독립적으로 실행하여 세션을 종료할 수 있게 유지했다.
- 컴파일된 콘솔 컴포넌트에서 새로고침 중복 호출이 status/security 요청 한 쌍만 실행함을 확인했고, 진행 중 로그아웃 및 지연 401 회귀 검사 PASS.
- 최신 소스의 production build/미리보기 반영은 미완료. 전체 목표 PARTIAL 유지.

## 설치 확인 및 실행 조건 반영

- 설치 시작 핸들러는 검토된 비어 있지 않은 패키지 목록, 사용자 확인, 서버 설치 가능 상태, 설치 권한 및 진행 중 여부를 검사한다. 요청 목록은 검토 목록의 복사본이다.
- 실제 컴파일된 콘솔에서 미확인 직접 핸들러 호출 시 API 요청이 없음을 검사했다. 중복 새로고침 및 로그아웃 회귀와 함께 PASS.
- production build PASS: /tmp/tastedev-linux-build-install-confirmation.log. 미리보기 8791 재시작 완료.
- 이번 빌드의 배포 패키지는 미갱신. 렌더링 GUI/실제 설치는 미검증. 전체 목표 PARTIAL 유지.

## 설치 확인 변경 배포 패키지 검증

- 최신 production build로 .deb를 생성했고 package:verify -- --terminal PASS.
- SHA-256: 101edc809cdc3ae779ef03cc48d4f4ddd28a800a785a909d773f5834b3dd8082
- 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T11-48-58.908Z.json
- 격리 인증·경로·PTY 검증이며 호스트 apt 설치나 실제 운영 변경 검증은 아니다. 전체 목표 PARTIAL 유지.

## 데몬에서 패키지 GUI로 이동

- 로드된 nginx, Certbot, PostgreSQL, MariaDB, Redis 서비스에 환경 설정 IDE 링크를 추가했다. 미로드 서비스/지원 외 unit에는 링크를 표시하지 않는다.
- 고정 unit 매핑만 canonical /ide/packages 경로를 생성한다. 지원 외/경로 형태/객체 prototype 키 입력을 거부한다.
- 경로 및 로그/복구 선택 회귀 7 PASS. 최신 소스의 빌드/미리보기 반영은 미완료이며 전체 목표 PARTIAL 유지.

## 데몬 GUI 링크 빌드 반영

- 전체 테스트 418 PASS 및 production build PASS. 이후 추가한 operations-package-links 정적 렌더링 검사 1 PASS: loaded nginx 링크 표시, not-found Redis/지원 외 서비스/미연결 링크 부재를 확인했다.
- 미리보기 8791 재시작 완료. 실제 브라우저 렌더링은 미검증이다. 최신 배포 패키지는 아직 미갱신이며 전체 목표 PARTIAL 유지.

## 데몬 이름 검색 및 상태 필터

- 데몬 목록에 이름 검색 및 전체/실행 중/중지/실패 필터와 빈 결과 안내를 추가했다. 원본 서비스 데이터와 제어 대상은 변경하지 않는다.
- 신규 안내 3종을 배포된 8개 번역 카탈로그에 추가했다. 전체 다국어 요구사항은 여전히 PARTIAL이다.
- 혼합 서비스 상태 필터와 로그/복구/GUI 링크 회귀 5 PASS. 빌드 및 미리보기 반영은 미완료. 전체 목표 PARTIAL 유지.

## 데몬 필터 GUI 검증 및 반영

- 실제 컴파일된 컴포넌트에서 실패 상태 선택 시 Redis만 남고, 이름 검색 결합 시 빈 결과가 표시되며 제어 대상 nginx가 유지됨을 확인했다. 서버 API 호출 없이 수행한다. 관련 필터/렌더링 3 PASS.
- 번역 및 로그/복구 회귀 검사 PASS. 실행 중/중지 누락 번역을 8개 배포 카탈로그에 보완했다.
- 최종 번역을 포함한 production build PASS 및 미리보기 8791 재시작 완료. 실제 브라우저/운영 서비스 변경 검증은 미완료. 최신 배포 패키지 갱신은 남아 있으며 전체 목표 PARTIAL이다.

## 데몬 상태 조회 응답 순서 보완

- 자동/수동 서비스 조회가 동일한 요청 순서 검사를 사용한다. 최신 요청만 서비스 및 권한 상태를 갱신하고, 연결/API 변경과 화면 조회 종료 시 이전 요청을 무효화한다. 이전 요청 실패는 최신 화면에 전파하지 않는다.
- 컴파일된 컴포넌트에서 두 번째 조회가 먼저 완료된 뒤 첫 응답이 와도 최신 목록이 유지되고, 연결 해제 후 응답이 적용되지 않는 검사 PASS. 로그/복구/필터/GUI 링크 회귀도 PASS.
- 최신 변경 빌드/미리보기 반영은 남아 있으며 전체 목표 PARTIAL 유지.

## 데몬 GUI 전체 회귀 및 패키지 반영

- 전체 격리 테스트 422 PASS: /tmp/tastedev-linux-tests-daemon-refresh.log.
- production build PASS: /tmp/tastedev-linux-build-daemon-refresh.log. 미리보기 8791 재시작 완료.
- 최신 .deb 생성 및 package:verify -- --terminal PASS. SHA-256: ae9f77afc22e729b86630bf72a84c41709a36061d156d5c276dc0a5a0da7e8fe
- 패키지 검증 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T11-57-41.808Z.json
- 실제 브라우저 E2E, 호스트 설치/업데이트, 운영 nginx/Certbot/DB/Redis 서비스 적용 및 복원 검증은 이 검사로 증명되지 않는다. 전체 목표 PARTIAL 유지.

## 서비스 제어 확인 및 응답 일관성

- 실행 함수에서 연결/사용자 확인/서비스 권한을 검사하고 서비스 제어 중복 호출을 차단한다. 작업 응답은 대상·작업·보안 버전·연결·조회 순서가 유지된 경우에만 목록/결과/확인 상태에 반영한다.
- 컴파일된 컴포넌트에서 미확인 요청 차단, 연속 클릭 1건, 대상 변경 후 이전 결과 무시, 새 대상의 정상 응답 표시를 검사해 PASS. 실제 systemd 실행은 하지 않았다.
- 최신 빌드/미리보기/패키지 반영은 미완료. 전체 목표 PARTIAL 유지.

## 서비스 제어 GUI 변경 반영

- 전체 테스트 423 PASS: /tmp/tastedev-linux-tests-service-control.log.
- production build PASS: /tmp/tastedev-linux-build-service-control.log. 미리보기 8791 재시작 완료.
- 최신 .deb 생성 및 package:verify -- --terminal PASS. SHA-256: 33de8406673450fb08c67f9f6a6c5a3a9f489829a3ed75e792f31316cf5d5870
- 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T12-01-39.041Z.json
- 실제 운영 서비스 제어 및 GUI E2E는 미검증이며 전체 목표 PARTIAL 유지.

## 감사 결과 필터의 운영 복구 상태 추가

- 실제 API가 기록하는 rolled-back/recovery-required/unchanged 상태를 감사 결과 드롭다운에 추가하고 8개 번역 카탈로그에 표시명을 보완했다.
- 상태 목록을 audit-view에서 공유하며 각 신규 결과가 독립 필터링되는 검사와 UTC 날짜/내보내기 회귀 2 PASS.
- 빌드/미리보기/배포 패키지 반영은 미완료. 전체 목표 PARTIAL 유지.

## 감사 결과 GUI 검증 및 배포 반영

- 전체 테스트 424 PASS: /tmp/tastedev-linux-tests-audit-outcomes.log. 이후 추가한 컴파일된 감사 GUI 필터 검사 PASS.
- production build PASS: /tmp/tastedev-linux-build-audit-outcomes.log. 미리보기 8791 재시작 완료.
- 최신 .deb 생성 및 package:verify -- --terminal PASS. SHA-256: 6576d6ce31184de731984339b375cde15870eb9fcd8703343fa573848a71b63b
- 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T12-04-58.454Z.json
- 실제 브라우저 E2E 및 운영 변경 검증은 여전히 미완료이며 전체 목표 PARTIAL 유지.

## 로그인 화면 기존 세션 복귀

- 로그인 화면의 인증 상태 응답이 authenticated:true이면 검증된 next 경로로 이동한다. 외부 목적지는 /overview로 제한하고, 화면 종료 후 상태 응답/오류는 무시한다. HTTP 상태 실패도 로그인 상태 조회 실패로 처리한다.
- 컴파일된 실제 로그인 컴포넌트에서 Redis GUI 복귀, 외부 URL 거부, unmount 후 이동 부재, 기존 중복 제출/비밀번호 제거 회귀 2 PASS.
- 계정 설정 CLI와 배포 로그인 안내 연결을 확인했으며 실제 계정 파일은 변경하지 않았다. 최신 빌드/미리보기 반영은 미완료. 전체 목표 PARTIAL 유지.

## 로그인 세션 복귀 반영 및 검증

- 전체 테스트 426 PASS: /tmp/tastedev-linux-tests-login-return.log.
- production build PASS: /tmp/tastedev-linux-build-login-return.log. 미리보기 8791 재시작 완료.
- 최신 .deb 생성 및 package:verify -- --terminal PASS. SHA-256: 08d6773a6a035e7317cd60377e4b4a44196a7fa40c9a558b678e08749675ef42
- 근거: /mnt/data/ssd/works/projects/GXSOFT/TASTEDEV/sources/v1.0/tastedev-linux/.runtime/verification/package-2026-10-03T12-08-39.688Z.json
- 실제 브라우저 E2E 및 운영 설치/서비스 변경 검증은 미완료이며 전체 목표 PARTIAL 유지.

## 2026-10-04 복구 화면의 nginx 설정 백업 연결

- /recovery의 기존 OperationsPanel에 nginx 트리 설정 변경 백업 목록/복구 검토/복원 실행 컴포넌트를 연결했다. 기존 cron 및 사이트 백업 기능은 유지한다.
- 컴포넌트 연결과 권한 전달, 기존 복구 선택 회귀 3 PASS. production build PASS: /tmp/tastedev-recovery-connection-build.log.
- 미리보기 서버 재시작 후 /login HTTP 200 확인. 실제 복원 실행은 QA-01 운영 변경 금지로 수행하지 않았다. 전체 목표 PARTIAL 유지.

## 2026-10-04 복구 페이지의 DB 설정 복원 진입 연결

- 복구 페이지에 설치된 PostgreSQL/MariaDB 전용 설정 복원 GUI 진입 링크를 연결했다. 설치 상태가 false이거나 연결되지 않은 경우 표시하지 않는다. 설정 백업 기능이며 DB 데이터 백업을 구현한 것은 아니다.
- 기존 컴파일된 컴포넌트에서 PostgreSQL 설치 링크 존재 및 MariaDB 미설치 링크 부재를 확인했고, 복구 선택/콘솔 세션 회귀와 함께 4 PASS.
- 전체 기능 목표 PARTIAL 유지.

## Redis 운영 적용 실행 어댑터

- redisConfigHooks를 추가해 기존 트랜잭션에 실제 서비스 조회, 격리 후보 검증, 고정 redis-server.service 재시작/복구를 연결할 수 있게 했다. HTTP에서 실행기나 검사 함수를 전달할 수 없다.
- 후보 변경값/복원 hash를 검토 값에 결합하고 유효한 격리 검증 결과만 인정한다. 실행 main이 직접 관측되지 않는 Redis 프로세스는 현재 차단하며 관리자 추정을 관측 증거로 사용하지 않는다.
- 임시 후보/대체 실행기로 검사 4 PASS. 실제 Redis 실행/운영 서비스 변경은 하지 않았다.
- root helper/API/GUI 연결은 아직 미완료. 전체 목표 PARTIAL 유지.

## Redis 운영 적용·복원 helper/API 연결

- redis-config-apply/redis-config-restore를 고정 helper allowlist 및 엄격한 공개 요청 검증·인증·DB 권한·동일 출처 POST API에 연결했다. 적용은 root-owned runtime closure 검증을 유지하고, 백업은 고정 /var/lib/linux/admin/redis에 저장한다.
- 서비스 main 관측이 모호하면 현재 적용/복원을 거부한다. 격리 검증 성공은 운영 데이터/외부 리소스/지속성의 완전 검증을 의미하지 않는다.
- 전체 격리 테스트 428 PASS: /tmp/tastedev-redis-operating-api-tests.log. 실제 root helper/Redis/서비스 실행은 하지 않았다.
- GUI 실행 연결 및 최신 빌드 반영은 남아 있으며 전체 목표 PARTIAL 유지.

## Redis 운영 적용·복원 GUI 연결

- 설정 변경 검토에 RedisOperation 적용 실행을, 백업 검토에 전체 파일 복원 실행을 연결했다. 권한/확인/버전 hash를 전달하고 동기 잠금과 응답 무효화를 적용한다.
- 후보 검사/복원/GUI 관련 테스트 PASS 및 production build PASS: /tmp/tastedev-redis-operation-gui-build.log. 미리보기 재시작 완료.
- 실제 Redis 실행 및 root 서비스 제어는 수행하지 않았다. 관측 가능한 explicit main만 지원하며 프로세스 제목 변경으로 main이 관측되지 않으면 차단한다. 전체 목표 PARTIAL 유지.

### 2026-10-04 nginx IDE 파일·블록 설정 편집

- 트리는 파일과 블록만 표시하며, 선택한 파일 또는 블록의 직접 설정을 오른쪽에서 개별 편집한다. 반복 지시문은 별도 항목으로 유지한다.
- 알려진 블록의 추가 설정 목록과 임의 지시문 추가를 제공한다. 포함 파일의 문맥은 추정하지 않으며, 설치된 모든 외부 모듈의 설정 카탈로그를 완성한 것으로 판단하지 않는다.
- 진입 시 읽기 조회를 자동 실행하며 중복 요청과 연결 변경의 오래된 응답을 방지한다. 중복 서버 폼, 백업, 코드 및 비교 내용은 접힌 영역으로 이동했다.
- 관련 컴포넌트·파서/프리셋 검사 5개 PASS. 운영 nginx 파일 적용과 현재 브라우저 화면 검증은 이 검사 범위에 포함되지 않는다. 전체 상태 PARTIAL 유지.

### 2026-10-04 최신 구현 배포 패키지 동기화

- nginx 파일·블록 IDE, 검색 아이콘 툴바, http server 추가 아이콘, 컨텍스트 메뉴, 하위 블록 생성, include 대상 탐색과 Redis 적용·복원 연결을 포함하여 deb를 갱신했다.
- 패키지 검증에 Redis 적용·복원 POST의 미인증 401 / 운영 기능 비활성 403 및 관련 runtime export 로딩 검사를 추가했다.
- `tastedev-linux_0.1.0_amd64.deb` SHA-256: `c459420a5c4fb9708ed9bd0599c9d5d48ea3aaf45fa9d74eeb0b1044e32a31b2`.
- 임시 추출·격리 서버 패키지 검사 PASS. 실제 호스트 설치, 운영 Redis 변경 및 브라우저 GUI E2E를 검증한 결과는 아니다. 전체 PARTIAL 유지.
- 증거: `.runtime/verification/package-2026-10-03T20-06-53.747Z.json`, `/tmp/tastedev-linux-current-package-verify.log`.

### 2026-10-04 nginx 헤더·팝업 및 설정 파일 수동 백업

- 헤더를 상태·시작·종료·검수·백업·복원으로 구성하고 검수 로그, 백업 생성, 복원 검토를 별도 dialog로 이동했다.
- `nginx-check`는 helper의 고정 nginx -t 명령으로 연결했다. 권한과 운영 기능 차단 검사를 적용했으며 실제 운영 장비에서 실행하지 않았다.
- `nginx-config-backup`은 조회한 nginx.conf/conf.d/sites-available/snippets 파일을 버전 확인 후 개인 JSON 백업으로 저장한다. UID/모드/링크/경로/크기 검사를 수행하며 응답과 목록에 원문을 노출하지 않는다. 전체 파일 모음을 원자적으로 백업하는 기능은 아니다.
- 개인 fixture에서 원문 보존, 목록 원문 비노출, 오래된 버전 409, 허용 범위 밖 경로 및 심볼릭 링크 거부 검사를 통과했다. 전체 검사 434 PASS, 이후 팝업 관련 검사와 빌드 PASS.
- 새 deb SHA-256 `87c15f4def2fbe4632ed21484c8e1baf915954c1fb9b5789d7824ec47537d12a`. 임시 추출 패키지 검사 PASS, 호스트 설치하지 않음. 증거 `.runtime/verification/package-2026-10-03T20-26-08.852Z.json`.
- 브라우저 GUI E2E와 운영 명령 실행은 미검증이며 전체 PARTIAL을 유지한다.

### 2026-10-05 최신 nginx 설명·감사 페이지 DEB 생성 및 격리 검증

소스와 별도 빌드 복사본의 app/components/lib/public/scripts 내용 일치를 확인하고 최신 빌드의 DEB를 생성했습니다. `dist/tastedev-linux_0.1.0_amd64-nginx-help-additions.deb` SHA-256 `046569eb3f7be5694f8a32450178d9743770a7165e45314c5c846ca1f6ccc9a6`. `package:verify -- --terminal` PASS: 격리된 인증·세션 폐기·PTY 입력/화면 크기/시간 제한·현재 실행 계정 식별·canonical package routes·권한 거부 및 helper closure 등을 검사했습니다. 신규 nginx 설명을 포함한 실제 DEB 내부 클라이언트 번들 해시가 검증 빌드와 일치합니다. 실제 설치·운영 nginx/DB/Certbot 실행·브라우저 GUI 전체 검증은 수행하지 않았습니다. 103 설치본은 이전 workspace-tab-close 패키지 그대로입니다. README의 오래된 PTY 미지원 문구와 실행 제한 설명을 현재 소스에 맞게 정정했습니다. 증거 `.runtime/verification/nginx-help-additions-package-20261005.json`. 전체 목표는 PARTIAL입니다.

### 2026-10-05 감사 페이지의 실제 패키지 HTTP 통합 검사

동일 DEB SHA `046569eb3f7be5694f8a32450178d9743770a7165e45314c5c846ca1f6ccc9a6`를 임시 디렉터리에 풀어 235건의 한국어 fixture 기록을 100/100/35건으로 조회했습니다. 중복·누락 없이 전체 기록 일치, 페이지 조회 중 append 이후 head cursor와 이전 페이지 snapshot 유지, 새로고침 시 새 기록 반영, 추가 private 필드 제외, no-store, 미인증401·잘못된 커서400·축소된 파일409를 실제 패키지 API로 확인했습니다. 검사 후 해당 임시 기록을 원래 bytes로 복구하며 운영 감사 파일은 읽거나 쓰지 않습니다. `package:verify -- --terminal` 전체 PASS. 새 통합 검사는 향후 패키지 검증에도 포함됩니다. 실제 브라우저 GUI/장비 설치/감사 기록 변조 방지 기능의 증거로 확대하지 않습니다. 증거 `.runtime/verification/audit-pagination-package-http-20261005.json`. 전체 목표는 PARTIAL입니다.
