# nginx 인증 플러그인의 실제 신규 GUI 발급

사용자 승인 범위의 103번 eztoy.app staging에서 현재 원래 GUI로 nginx 인증·설치 플러그인의 신규 발급을 완료했다. 전용 인증서 저장소에 새 ACME 계정이 등록되어 기존 계정의 이미 유효한 인증을 재사용하지 않았다. GUI 명령 미리보기, 약관/변경 확인, 최종 발급 제출, 실제 종료 코드 0과 완료 로그를 확인했다.

운영 nginx를 변경하지 않기 위해 전용 실제 nginx의 challenge URI를 HTTP로 조회하고 정상 token.keyAuthorization 응답만 기존 승인된 공개 webroot에 배치했다. 한 개의 실제 nginx challenge 응답이 전달되었으며 ACME 서버가 해당 응답으로 인증을 성공했다. 이 전달기는 Certbot이나 nginx의 가짜 실행/응답을 사용하지 않는다. 공개 nginx로 challenge 요청을 직접 처리하는 배포 환경의 네트워크 경로 전체와는 구분한다.

전용 nginx 설정 두 개 백업, 실제 인증서 배치, 저장된 authenticator=nginx/installer=nginx, 독립 TLSv1.3 호스트명·발급 인증서 검증과 한글 HTTP 200 응답이 성공했다. 기존 운영 설정·인증서 및 공개 challenge 파일의 전후 해시 보존을 확인했다. 자체 로그인 세션/탭/포워딩·전용 systemd unit·임시 인증서 저장소·생성한 challenge 파일은 정리했다.

증거 `.runtime/verification/certificate-nginx-auth-original-gui-20261008T170737Z/result.json`, `gui-observation.json`, `.runtime/verification/certbot-nginx-auth-gui-complete-20261009.png`. 실제 ACME 자식 중단/재개는 별도 미완료이며 이번 결과로 전체 제품 완료를 선언하지 않는다. DEB 검증은 수행하지 않았다.
