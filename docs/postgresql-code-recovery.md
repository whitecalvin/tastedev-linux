# PostgreSQL 전체 코드 중단 복구 기반

복구 페이지에서 설치된 PostgreSQL의 클러스터 목록을 조회하고 main 파일을 선택합니다. PostgreSQL IDE의 복원 팝업에서는 선택한 main 파일이 기본 대상입니다. 중단 작업 조회로 원본 검수·현재 서비스 상태를 확인한 뒤 재시작 영향을 확인하고 복구합니다. 기존 일반 백업 복원과 접속 규칙 복원 경로도 유지합니다.

`postgresql-code-recovery-plan`과 `postgresql-code-recover` POST API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt 권한을 확인합니다. 클러스터 경로와 확인 digest만 전달하며 UID/명령/기준 경로는 거부합니다. 관리자 helper는 checksum 검증된 private 모듈을 사용하고 PostgreSQL UID를 서버에서 조회합니다. 대상·연결·정책 변경은 검토와 확인을 해제하고 늦은 응답과 중복 실행을 막습니다. 클러스터 목록은 명시적으로 조회하며 연결이 바뀌면 기존 목록과 선택을 지웁니다. 터미널 기록에는 구조화한 복구 상태와 백업 ID만 보존합니다.

새 전체 코드 적용 백업에 원래 include graph 버전, 클러스터 경로·unit·major, postgresql.auto.conf 부재/hash, 다섯 공개 runtime 값을 private context로 함께 보존합니다. 원문과 이 context는 private 백업에만 저장하고 journal에는 기존 원문 없는 작업 기록을 유지합니다. 실행 중인 서비스의 프로세스 snapshot이나 명령 인수는 백업 context에 포함하지 않습니다.

복구 검토는 정확한 main 경로, journal/백업, 현재 graph와 원래 graph, 현재 서비스 상태에 묶입니다. 서비스 관리자에서 loaded 상태이고 작업 중인 ControlPID가 없으며 active 또는 inactive/failed 상태인 canonical cluster unit만 허용합니다. active unit은 실제 실행 프로세스와 설정 조회까지 확인합니다. active 조회 실패를 inactive로 대체하지 않습니다. inactive/failed unit은 MainPID=0을 요구하며 운영 원문과 auto configuration을 확인한 뒤 원래 후보를 격리 검수합니다.

확인된 검토 digest 없이 복구를 실행할 수 없습니다. 파일이 원본 또는 journal에 기록한 정확한 staged 후보인지 공통 recovery transaction이 검사합니다. 복구 전에 원래 전체 include 후보를 다시 검수하고 graph·백업·journal·서비스를 확인합니다. 이미 원본이 복원된 경우 파일 inode를 유지하고 서비스 복구만 다시 시도합니다. 코드가 변경되었다면 원문 복원 후 고정 cluster unit을 재시작하며 실제 경로·runtime 값·auto configuration 및 graph를 확인한 경우에만 journal을 정리합니다.

서비스 재시작 전에는 디스크 원문 교체로 달라질 수 있는 설정 오류 수를 서비스 identity 비교에서 제외합니다. 원문/참조 graph를 별도로 비교하고 재시작 후 설정 오류가 없음을 확인합니다. 실패 시 원본 파일과 journal을 보존합니다. 외부에서 바꾼 파일, 백업, 참조 파일이나 auto configuration을 덮어쓰지 않습니다. 공개 검토에는 백업 ID와 버전, 서비스 상태, 공개 후보 값만 포함하고 원문·비밀값·native 상세 출력을 포함하지 않습니다.

context가 없는 이전 버전 백업은 원래 서비스/graph를 증명할 수 없어 자동 중단 복구에 사용하지 않습니다. 기록과 원본 자료를 보존하며 기존 백업 조회·복원 경로는 변경하지 않습니다. whole graph 백업 복원과 include 파일 단독 전체 코드 적용도 별도 남은 범위입니다.

테스트는 private 파일 fixture와 신뢰된 모의 서비스/검수기입니다. 실제 PostgreSQL16 binary가 없어 native namespace·root에서 PostgreSQL 소유 파일 교체·실제 클러스터 재시작·설치 브라우저 GUI/E2E는 완료하지 않았습니다. private 옵션 검수는 운영 데이터, TLS 파일, 플러그인 또는 실제 시작 옵션의 접근성과 의미를 증명하지 않습니다.


## 파일 교체 전 준비 취소 (2026-10-06)

기존 postgresql-code-recovery-plan / postgresql-code-recover API와 databaseChanges·sudo 권한을 그대로 사용합니다. 원본 전체 include 그래프와 서비스 범위, auto 설정, 실행 값, 기록된 임시 후보의 hash와 inode를 검증한 ready 단계 또는 임시 파일 생성 전 intent-only 단계는 postgresql-stage-cancellation 검토로 반환합니다. 검토에는 원문 없이 파일 경로와 보존 작업, 준비 개수, 서비스 상태 및 재시작하지 않는다는 사실만 포함합니다.

확인된 검토 버전으로 준비 취소를 실행하면 원본 후보를 다시 격리 검수하고 준비 원장을 고정합니다. 기록된 임시 후보만 기존 안전 취소 실행기로 정리한 뒤 원본·서비스를 다시 확인하고 활성 intent를 정리합니다. 결과는 preparationCancelled=true, restored=false, serviceRestarted=false, operatingConfigurationChanged=false입니다. 감사 상태는 cancelled이며 터미널 결과도 서비스 복원 완료와 구분합니다. GUI 확인창은 실제 복원·재시작 안내와 별도로 표시하며 현재 UI 카탈로그에 번역을 제공합니다.

임시 준비 취소가 완료된 뒤 intent 정리 전에 중단된 경우, 원본과 서비스가 그대로라면 intent-only 검토로 정리할 수 있습니다. preparing/cleaning 또는 알 수 없는 custody 상태는 이 공개 경로에서 자동 처리하지 않습니다. 준비 원장이 없어도 swap 기록이 남아 있으면 intent-only로 간주하지 않습니다. 서비스·auto 설정·원본·준비 원장 교체 등 충돌 시 기록을 보존합니다. root helper 작업 종류나 sudo 권한 범위를 추가하지 않았습니다.
