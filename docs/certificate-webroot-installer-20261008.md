# webroot 인증과 nginx HTTPS 설치 연결 — 2026-10-08

원래 Certbot 발급 GUI의 webroot 방식에 `발급 후 nginx HTTPS 자동 연계` 스위치를 연결했다. 기본값은 꺼짐이다. 켜면 고정 `certbot run --authenticator webroot --installer nginx --webroot-path <검증 경로> ... --redirect`를 생성한다. 인증과 설치 플러그인 조합은 [Certbot 공식 사용자 안내](https://eff-certbot.readthedocs.io/en/stable/using.html)의 구성 방식이다. nginx 기본 모드 및 기존 certonly webroot/standalone 동작은 유지한다.

입력 옵션은 엄격한 boolean이고 추가 설치는 webroot에서만 허용한다. 웹 루트의 root 소유권·변경 권한을 먼저 검사하고, 선택 도메인의 활성 nginx include graph를 백업한 뒤 실행한다. 검증·백업 실패 시 ACME 실행을 시작하지 않는다. 발급 명령 검토와 실제 helper는 같은 생성기를 사용한다. 스위치 변경 시 기존 검토·확인·약관 체크를 해제하며 GUI 명령/실행 요청 및 form scope에 옵션을 포함한다. 자동 연계 시 변경 확인 문구와 실행 버튼도 nginx 배치를 명시한다.

관련 명령/권한/백업/진행 로그·GUI 선택/완료 변경 검사 24개 통과. 최종 안내 문구를 포함한 현재 396개 소스 production 빌드 통과. 증거 `.runtime/verification/certificate-webroot-installer-20261008/result.json`, 빌드 `.runtime/verification/source-build-2026-10-08T13-43-49.302Z/result.json`. 실제 ACME 발급+nginx installer 배치는 아직 수행 전이며 이 실행의 상태는 PARTIAL이다.

103의 실제 eztoy.app은 운영 nginx의 80→443 리다이렉트 및 `/var/www/letsencrypt` ACME 경로를 사용한다. 다음 native 통합 검수는 기존 공개 webroot 인증 경로를 사용하되 nginx installer의 변경 대상과 reload PID를 전용 설정/전용 서비스에 묶어 운영 설정과 인증서를 보호해야 한다.
