# 실제 webroot 신규 발급→nginx installer→TLS — 2026-10-08

103번과 승인된 eztoy.app 테스트 도메인에서 현재 canonical helper/native lock의 certificate action을 실행했다. 입력은 webroot `/var/www/letsencrypt`, installNginx=true, staging=true다. 기존 staging 계정만 private 인증서 저장소에 복사했으며 새 lineage의 인증서를 실제 ACME에서 받았다. Certbot은 실제 nginx installer로 전용 eztoy.conf에 배치했고 HTTPS redirect 설정을 생성했다.

인증 전 현재 helper가 nginx.conf와 eztoy.conf 백업 2개를 보고했다. 인증서 만료는 2027-01-06, 실제 발급/배치 완료 로그를 기록했다. renewal 파일의 authenticator=webroot·installer=nginx를 확인했다. 전용 실제 systemd nginx를 private network에 기동했고 helper/Certbot은 별도 mount namespace의 같은 설정·인증서 저장소·master PID 파일을 사용했다. 실제 nginx master PID 379687을 유지한 native reload다. native nginx/Cerbot 실행 파일을 shim으로 교체하지 않았다.

독립 network namespace 검수에서 TLSv1.3, eztoy.app 호스트명, 발급된 인증서와 peer DER 일치·partial-chain 신뢰 검증을 수행했다. 인증서 검증을 끄지 않았으며 새 staging 인증서를 이 검수의 신뢰 대상으로만 사용했다. 한글 `한글 자동 HTTPS 연계` HTTP 200 응답을 확인했다. peer DER SHA-256은 9c7c727d0450922d954d071de88d2763a82ecc55fde9c7e7eaccde7feb60cacf다. 운영 nginx에 staging 인증서를 배치한 검수는 아니다. HTTP→HTTPS는 생성 설정 확인이며 별도 HTTP 80 응답 검수로 확대하지 않는다.

증거 `.runtime/verification/certificate-webroot-nginx-native-20261008T135010Z/result.json`. 전송 runtime 146개 manifest, 실제 helper/nginx/Certbot 바이너리 SHA와 완료 로그를 보존했다. 모든 전송 파일의 재읽기 해시 대조는 이번 runner에 없었고 향후 준비 단계를 보강했다. 이번 명령은 원래 GUI의 최종 제출이 아니라 현재 helper의 직접 호출이다.

운영 nginx.conf·eztoy vhost·기존 인증서/renewal 파일 해시와 challenge 파일 목록/해시가 전후 동일했다. 전용 unit 중지 및 임시 설정·인증서/키·계정 복사본·소스·fixture 제거 확인. 초기 두 mount 준비 실패 결과와 운영 파일 보존/정리 기록도 보존했다. 첫 실패는 /tmp bind 후 fixture 경로가 가려졌고, 둘째는 자식 mount에서 부모 fd 경로를 읽을 수 없었다. 부모 PID의 열린 directory fd 경로로 수정한 뒤 실제 발급/배치에 성공했다.

nginx 인증 플러그인 자체의 신규 HTTP 인증 검수와 원래 GUI/API 발급 제출·중단 재개 등 아직 기록된 별도 미완료 범위를 이번 성공으로 덮지 않는다.
