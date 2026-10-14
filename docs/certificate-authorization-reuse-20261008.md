# Certbot 인증 재사용 오류 확인 및 격리 검수 · 2026-10-08

103번 Certbot 2.9.0의 실패 요청만 범위를 제한해 주문·인증 응답을 대조했다. 최초 ready 주문의 eztoy.app/www.eztoy.app 인증은 valid였고, 설치 Certbot의 dry-run 처리에서 valid 인증을 deactivated로 바꾼 후 주문을 다시 만들었다. 두 번째 응답은 invalid 주문이며 www.eztoy.app의 비활성 인증을 그대로 참조했고 eztoy.app은 새 pending 인증이었다. 그 뒤 challenge 요청이 `authorization must be pending`으로 거부됐다. 해당 요청에서 비활성 인증 재사용이 확인되며, DNS/방화벽/한도 문제로 단정하지 않는다. Certbot/ACME 서버 중 어느 쪽의 일반적인 결함인지는 이 자료만으로 확정하지 않는다.

기존 계정이나 갱신 설정을 자동 수정하는 제품 우회 기능을 넣지 않았다. 승인된 eztoy.app만 별도 private 설정·작업·로그 경로에 갱신 설정을 복사하고 새 staging 계정을 사용해 검수했다. 현재 제품의 동일 `renew --dry-run --cert-name eztoy.app --no-directory-hooks` 명령에 verifier용 임시 경로·무인 실행 옵션을 붙였다. 원래 nginx 플러그인과 실제 공개 HTTP 검증으로 eztoy.app 및 www.eztoy.app 갱신 시뮬레이션 성공, exitCode 0. 신규 staging 계정은 이 검수용이며 운영 계정으로 대체하지 않았다.

nginx 활성 graph/version 전후 동일, 기존 `/etc/letsencrypt/renewal/eztoy.app.conf`와 `live/eztoy.app/fullchain.pem` SHA 동일, private 전송물·계정 키·작업 폴더 정리 확인. 증거 `.runtime/verification/certificate-nginx-native-20261008T074301Z/{result.json,prior-order-diagnostic.json,installed-runtime.json}`. 설치 패키지 버전 및 Certbot/nginx/Node 실행 파일 SHA를 기록했다. commit/배포 패키지 해시는 추정하지 않았다.

제품 executor에서 이미 확인 가능한 ACME 인증 상태/요청 한도/DNS/연결 오류를 고정 한국어 안내로 변환하도록 했다. 이전 native 오류 메시지는 줄바꿈·exit 상태 때문에 helper 프로토콜에서 일반 실패로 축소됐다. 이제 해당 네 가지 분류는 HTTP 422/한 줄 안내로 유지되고 원본 provider 문자열·토큰·계정 URL을 전달하지 않는다. 자동 재시도나 계정 변경은 하지 않는다. 알 수 없는 오류는 원래 처리 유지. 관련 executor·공통 명령·helper 런타임 폐쇄 검사 12개 성공: `.runtime/verification/certificate-failure-20261008.log`.

현재 Next 소스 386개 운영 빌드 성공, 소스 변경 없음. `.runtime/verification/source-build-2026-10-08T07-45-07.318Z/result.json`. 이 검수는 native 조정 모듈/실제 ACME 성공이며 원래 GUI→인증 API→current canonical helper의 전체 발급/갱신·백업 복원 수용은 여전히 남는다. 제품 기본 운영 계정에서의 갱신 성공으로 확대하지 않는다. DEB 검수·배포는 수행하지 않았다.

공식 dry-run 및 hook 동작: https://eff-certbot.readthedocs.io/en/stable/using.html . 설치된 Certbot auth_handler/client 소스의 인증 비활성화·주문 재생성 흐름을 직접 대조했다.
