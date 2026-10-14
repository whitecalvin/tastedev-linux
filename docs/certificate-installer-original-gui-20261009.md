# Certbot 원래 GUI 발급과 nginx 연동

사용자의 ACME 약관/최종 제출 승인 후 103번 장비의 전용 검수 서버에서 현재 원래 GUI로 eztoy.app staging 인증서를 발급했다. webroot=/var/www/letsencrypt와 발급 후 nginx 연동을 선택하고 명령 미리보기를 검토한 뒤 약관·변경 확인과 최종 발급 버튼을 눌렀다. 인증 API를 별도로 호출하여 GUI 제출을 대체하지 않았다.

GUI 작업 완료와 Certbot 실제 종료 코드 0, 설정 백업 두 개, nginx 인증서 배치 성공을 확인했다. 독립 검사에서 전용 nginx의 TLSv1.3 인증서/호스트명 검증과 한글 HTTP 200 응답을 확인했다. 저장된 갱신 설정은 authenticator=webroot, installer=nginx다.

운영 설정·인증서 및 공개 challenge 파일의 검수 전후 해시를 보존했다. 검수 계정 로그아웃과 자체 탭 닫기 후 전용 nginx 종료·임시 저장소 제거·SSH 터널 종료를 확인했다. nginx 인증 플러그인으로 새 HTTP challenge를 제공하는 방식과 실제 ACME 자식 중단/재개를 이 성공으로 대체하지 않는다. DEB 검증은 수행하지 않았다.

증거: `.runtime/verification/certificate-webroot-nginx-native-20261008T170111Z/result.json`, 같은 디렉터리 `gui-observation.json`, `.runtime/verification/certbot-installer-gui-complete-20261009.png`. 설치 버전 certbot 2.9.0-1, python3-certbot-nginx 2.9.0-1, nginx 1.31.6-1~noble이며 바이너리 SHA-256은 result.json에 기록했다.
