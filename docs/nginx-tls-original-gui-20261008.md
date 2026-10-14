# nginx 원래 GUI의 TLS 적용·백업 복원 · 2026-10-08

103번 전용 nginx systemd 서비스와 사설 네트워크에서 원래 GUI/인증 API/현재 canonical helper를 사용했다. 기존 eztoy.app 인증서는 서비스에 읽기 전용으로 연결했다. 운영 nginx 설정은 별도 전용 설정으로 대체된 자식 namespace에만 보였고, nginx.service 요청은 전용 unit 이름으로 매핑했다.

실제 브라우저에서 reviewed.conf 선택 → 코드 보기 → TLS listen/인증서 경로 코드 편집 → 초안 반영 → 설정·서비스/PID/locale 검토 → 검사 후 적용을 실행했다. 실제 전용 서비스 PID 149262에서 TLS 1.3, eztoy.app 도메인 검증, peer 인증서 일치, HTTP 200/after-gui 응답을 확인했다. 클라이언트는 시스템 신뢰 저장소를 사용했으며 인증서 검증을 끄지 않았다. server 노드 설정 화면에 두 listen/호스트/인증서/키 경로와 설명이 편집 순서대로 표시됐다.

원래 복원 팝업에서 생성 백업 `79c4974a-626c-4801-a525-0655eeff7f9f`을 선택해 include/실제 서비스/locale 검토와 적용을 실행했다. GUI의 복원 완료, 원래 파일 bytes 복귀, 원복 전 TLS 설정의 undo 백업 `0f40f56b-8f8b-40e9-97d8-e498191d3046`, 실제 사설 네트워크 HTTPS 18443 포트 ConnectionRefused를 각각 확인했다. 브라우저 오류/경고 0건, 로그아웃 후 로그인 경로 이동.

자동 검수 controller는 마지막 정리 중 transport failure로 종료했다. 첫 실패 기록은 `.runtime/verification/nginx-systemd-helper-20261008T125648Z/result.json`에 그대로 유지한다. 이전 도구가 transport stderr 원문을 보존하지 않아 첫 정리 예외의 정확한 내용과 최종 native 종합 proof는 복구하지 못했다. 이를 PASS로 덮어쓰지 않는다. 별도 관찰에서 전용 unit inactive, 자체 프로세스 및 웹 리스너 부재, 남은 private stage를 확인하고 그 경로만 수동 정리했다. 자동 도구는 이후 stderr/stdout과 native 결과를 정리 실패에도 보존하고, 사라진 파일의 FileNotFoundError만 정리 중 허용하도록 보강했다. 최초 오류 원인을 FileNotFoundError로 단정하지 않는다.

따라서 종합 기록은 PARTIAL이며 위 직접 관찰한 기능 게이트만 PASS다. 이전에 성공한 정상 HTTP 적용·복원·실패 자동 원복을 반복 검사하지 않았다. 기존 인증서/운영 nginx의 정리 시 SHA는 manual-cleanup.json에 남겼지만, 이번 자동 최종 기록이 유실돼 이번 실행 전후 해시 대조 성공으로 확대하지 않는다. 키 원문은 전송/기록하지 않았다. 자체 unit 종료, private stage/포워딩/브라우저 탭/로컬 로그인 파일 정리 완료.

증거: `.runtime/verification/nginx-systemd-tls-original-gui-20261008/{result.json,gui-result.json,applied-runtime.json,restored-runtime.json,tls-closed.json,manual-cleanup.json,applied-tls.png,restored-tls.png}`. Certbot nginx plugin 자체 신규 발급→설정 배치 통합 및 원래 GUI 실행 중단 복구는 아직 남아 있다.
