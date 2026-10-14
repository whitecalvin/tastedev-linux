# Certbot 발급 전 nginx include 문맥 검사

2026-10-08. 추가 전송·GUI 검수 승인에 따라 기존 발급 사전 검사의 누락을 수정했다.

기존 검사는 활성 파일을 각각 독립적으로 파싱하여 `server` 내부의 `server_name`만 찾았다. 따라서 서버 블록 내부에서 include하는 파일에 `server_name`이 있으면 해당 도메인을 놓쳤다.

현재 검사는 nginx.conf부터 실제 include graph를 따라가며 부모 서버 블록 문맥을 전달한다. 동일 파일을 여러 문맥에서 사용하는 경우 각각 검사한다. 같은 줄의 서로 다른 include는 경로 패턴으로 구별하며 심볼릭 링크의 논리 경로로 탐색하고 실제 경로로 백업을 중복 제거한다. 기존 graph 변경 차단과 탐색 한도는 유지한다.

검증:

- `certificate-nginx-backup`, `certificate-command`, `certificate-failure`: 16개 성공. 중첩 include·심볼릭 링크·재사용 문맥·같은 줄의 서로 다른 include 및 잘못된 도메인의 ACME/백업 실행 차단을 포함한다.
- `admin-runtime`: 성공. 현재 privileged runtime 연결 검사.
- 103번 현재 소스 임시 전송 후 실제 eztoy.app nginx graph/private backup 검사 성공. nginx 설정·기존 renewal 파일·fullchain hash 유지 및 임시 폴더 정리 확인. ACME 요청 없음.
- 실제 장비 증거: `.runtime/verification/certificate-nginx-native-20261008T080558Z/result.json`, `stderr.log`. 전송 소스 SHA-256을 포함한다.

이번 변경은 발급 전 include 문맥과 백업 검사 범위다. 신규 인증서 발급·TLS 설정 변경·실패 복원 및 원래 GUI 전체 흐름의 신규 수용 결과가 아니다. 현재 검사는 정확한 server_name 일치이며 와일드카드·정규식 도메인 매칭을 지원한다고 주장하지 않는다. 전체 목표는 진행 중이다.
