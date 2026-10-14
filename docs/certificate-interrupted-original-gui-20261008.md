# Certbot 웹 프로세스 중단 후 원래 GUI 복구 조회 · 2026-10-08

103번 current source 397개와 canonical helper/runtime를 전용 mount namespace에 연결했다. 실제 설치 Certbot 대신 해당 자식 namespace에만 70초 대기하는 일회용 shim을 연결했다. ACME 요청이나 실제 Certbot 종료는 수행하지 않았다. 기존 nginx 활성 graph의 27개 파일은 현재 helper가 별도 전용 저장소에 실제 백업했다.

인증 API로 작업 `757c049e-6490-4e3c-98c9-a53fc2b05cc9`을 제출한 뒤 백업 ID 27개가 pending 파일에 저장됐고 publish lock이 닫힌 안정 상태임을 확인했다. 전용 웹 process group만 SIGKILL했다. same-source/저장소의 새 웹 프로세스를 시작하되 계정이나 세션을 다시 생성하지 않았다. API의 기존 쿠키와 브라우저의 기존 로그인으로 계속 접근했다.

재시작한 API가 recovery-required/exitCode null/finishedAt 없음과 27개 백업 로그를 읽었다. 같은 작업 재실행은 HTTP 409로 거부됐다. 원래 Certbot GUI에서 저장 작업을 선택하자 한국어 실행 상태 확인 필요 안내와 백업 27개가 표시됐다. 백업 목록을 읽고 eztoy.app 대상 백업을 선택해 실제 restore plan의 include 검사 및 현재 설정=백업 확인을 표시했다. 복원 적용이나 잠금 해제는 실행하지 않았다.

shim 실행 종료 후에도 초기 pending SHA와 웹 잠금 유지, 완료 기록 없음, 백업 27개의 원문 bytes/버전 해시 일치, 현재 전달 소스/helper SHA 일치를 확인했다. 현재 구현이 실제 종료를 확인하지 못한 작업을 성공/실패로 추정하지 않으며 자동 재실행하지 않는 동작을 직접 검수한 결과다. 진행 중 root helper는 shim만 실행했고 기존 운영 nginx·인증서를 변경하지 않았다.

GUI 오류/경고 0건, 로그아웃 후 로그인 페이지 이동. 운영 nginx graph와 eztoy.app 갱신/fullchain SHA 전후 동일, 자체 웹 서버/private 계정·백업·shim·포워딩·브라우저 탭·로컬 로그인 파일 정리 완료. evidence `.runtime/verification/certificate-interrupted-original-gui-20261008/`의 result/checkpoint/interrupt-restart/recovered-job/repeat-rejected/durable-proof/cleanup JSON 및 recovered-history.png에 보존했다.

이 PASS는 실제 백업을 포함한 웹 프로세스 중단·재시작·원래 GUI 조회와 재실행 차단 범위다. 실제 ACME 자식 프로세스 강제 종료/종료 결과의 권한 있는 확인 및 재개, Certbot nginx plugin 신규 발급→설정 배치 통합은 별도 남아 있다. 성공한 갱신·발급을 반복하지 않았다.
