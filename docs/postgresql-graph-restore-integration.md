# PostgreSQL 여러 파일 복원 연결

`reviewPostgresqlGraphRestore`는 검증된 묶음 백업과 실행 중인 서비스의 데이터,
HBA, unit, major, auto.conf 상태가 같을 때만 복원 검토를 만든다. 파일별 변경
목록, 실제 네이티브 검수의 옵션값, 파일 snapshot 및 서비스 identity를 하나의
검토에 묶는다. 검수 중 파일 변경이나 서비스 교체는 거부하고, 검토를 사용하기
전에는 `assertPostgresqlGraphRestoreReview`로 다시 확인한다.

`createReviewedPostgresqlGraphRestoreJournal`은 등록된 검토의 snapshot으로
준비 기록을 생성한다. 현재 파일을 새로 읽어 다른 snapshot을 대신 승인하지
않는다. 게시 전후 검토·서비스·journal identity를 다시 검사한다. 게시 후 충돌이
생기면 journal ID와 기록 보존 여부를 오류에 포함하고 운영 파일은 변경하지
않는다. 중복 journal이 있으면 기존 기록을 덮어쓰지 않는다.

입력 archive와 archiveScope는 검증된 비공개 백업에서 가져오는 내부 데이터다.
웹 요청으로 해당 객체나 검수 함수를 받지 않는다. 검토 자체는 파일이나
서비스를 변경하지 않는다. 현재 이 검토 모듈은 GUI/API/helper에 연결하기 전
단계이며 기존 주 파일 복원 경로를 대체하지 않는다.

`applyReviewedPostgresqlGraphRestore`는 등록된 검토에서 journal/stage를 생성한
뒤 여러 파일 교체를 실행한다. 활성화 전에는 원래 서비스 PID·시작 identity와
scope·실행값을 검사하고 고정된 unit을 재시작한다. 적용 후에는 실제 graph,
service scope·실행값·설정 오류 수를 검사한다. 실패 시 파일을 복구한 뒤 서비스
복구 상태를 확인하고 같은 unit을 재시작하여 원래 실행값을 검증한다. 변경된
서비스 scope의 복구 재시작은 거부하며 실행 기록을 보존한다. 설정 파일에
변경이 없으면 재시작이나 실행 journal을 만들지 않는다.

이 실행 모듈은 내부 source 상태다. 서비스 inspector/control의 기본 구현은
실제 운영 명령이지만 현재 검증의 활성화·서비스 조회는 fixture 콜백이다.
해당 모듈을 root helper 또는 HTTP 요청에서 호출하도록 연결하지 않았다.

`npm run verify:postgresql:restore:host -- 18`은 임시 fixture에서 실제 PostgreSQL
namespace 검수와 여러 파일 교체 구현을 함께 실행한다. 저장된 include 파일의
수정·생성·제거, 성공 후 실제 설정 graph/옵션, 활성화 콜백 실패 후 원본 복구와
durable phase를 검사한다. 이 명령의 서비스 콜백은 fixture이며 운영 서비스는
시작하거나 재시작하지 않는다. root helper의 실행 증거도 아니다.

남은 연결 작업은 검토에서 실행 journal/stage로의 proof 전달, 원래 서비스 및
운영 리소스 검증, 재시작/실패 복구 coordinator, GUI/API/helper 연결과 보관물
정리다. 여러 파일 native fixture PASS만으로 운영 복원이 완료된 것으로
판단하지 않는다.

복원 검토를 통해 생성하는 journal은 v3이며 원래 service scope, PID·시작값,
원래/후보 실행값, serviceVersion 및 reviewVersion을 파일 snapshot과 함께
원자적으로 게시한다. 별도 sidecar의 게시 순서 차이를 만들지 않는다. v1/v2
legacy 기록은 계속 읽지만 서비스 proof가 없는 기록으로부터 새 서비스 context를
추정하지 않는다. `postgresqlGraphRestoreJournalServiceContext`는 검증된 journal에서
복사본을 반환한다. process-local review가 없어도 저장된 정보를 읽을 수 있다.
이 저장 정보와 독립 중단복구 service coordinator의 연결은 아직 남아 있다.

`recoverReviewedPostgresqlGraph`는 메모리 내 원래 검토 없이 검증된 v3 journal의
service context와 swap 진행 기록으로 원본 파일/서비스 복구를 실행한다. 먼저
`inspectPostgresqlOriginalConfiguration`이 기록된 원래 include 파일만 비공개
fixture에 구성해 namespace 검수한다. 원래 graph가 불완전하거나 원본 증거가
없으면 운영 파일로 대신 채우지 않는다. 복구 전후 서비스 대상과 원래 값을
확인한다. 설정 원본이 돌아온 뒤에만 고정 unit을 재시작하며 변경된 서비스 scope는
거부한다. 실제 프로세스 강제 종료 시험·운영 서비스 실행·GUI/API/helper 연결은
아직 완료하지 않았다. 현재 native 시험의 중단 단계는 activation checkpoint
재현이며 서비스 콜백은 fixture다.

2026-10-05의 최신 host 검증은 실제 writer SIGKILL와 새 recovery 프로세스도
검사한다. writer는 모든 파일 배치 후 activation 단계에서 대기하다 종료되고,
새 프로세스는 v3 journal만으로 원본 native 검수·파일 복구를 실행한다. fixture
직접 호출의 directory lease는 정확히 캡처한 child 종료와 빈 디렉터리 identity를
확인한 뒤 시험 코드에서만 제거한다. 설치 helper의 inherited kernel lock 경로는
이 시험에서 실행하지 않는다. 다른 crash window나 실제 서비스 검증의 증거로
확대 해석하지 않는다. 이전 checkpoint 재현 증거는 별도로 보존한다.

`retainPostgresqlGraphRestoreJournal`는 검증된 committed/rolled-back 진행 기록의
journal만 completed/<journalId>/intent.json으로 옮긴다. 원본 hash와 파일 identity를
확인하고 진행 중인 기록을 거부한다. active 위치를 비워 다음 검토를 허용하지만
원래 설정, swap/undo 및 완료 기록은 삭제하지 않는다. 이 보관 함수의 자동 호출,
보관 게시 중 crash window와 이력 GUI 연결은 아직 남아 있다.

새 내부 restore/recovery coordinator는 기본적으로 완료 기록을 자동 보관한다.
성공한 적용 또는 확인된 원본 복구 후 같은 작업 lease를 얻어 기록을 보존하고
active 위치를 비운다. 보관 실패는 activationComplete/rollbackComplete와
retentionComplete를 분리해 보고하며, 완료된 적용을 다시 재시작하거나 자동
롤백하지 않는다. retainCompleted=false는 중단 상태를 만드는 trusted fixture
옵션이다. HTTP 요청 옵션으로 제공하지 않는다. 같은 경로의 연속 복원과 보관
실패 시 active 기록 보존을 검증했다. 외부 API/helper에는 아직 연결하지 않았다.
