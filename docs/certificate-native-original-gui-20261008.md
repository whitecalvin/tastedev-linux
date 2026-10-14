# Certbot 원래 GUI→현재 helper→실제 갱신 수용 · 2026-10-08

103번에 현재 소스를 일회용 경로로 추가 전송하고 원래 `/ide/packages/certbot`과 Better Auth 로그인·인증 API를 사용했다. 현재 canonical helper/runtime/hash는 자식 mount namespace에만 bind했다. 기존 설치 helper/앱은 교체하지 않았다. 일회용 정책에서 인증서 작업만 허용하고 nginx·서비스·설치·DB·cron·터미널·AI 변경은 비활성으로 유지했다.

최초 검수 서버는 없는 `/var/lib/linux` mount 지점 때문에 종료됐다. 첫 실패 로그·원본 보존/정리 결과를 그대로 보존하고, 호스트 디렉터리를 만들지 않는 namespace 전용 tmpfs 및 읽기 전용 dpkg 연결로 준비를 수정해 실패 게이트부터 재개했다.

설치 Certbot 2.9.0 소스에서 비대화형 renew가 최대 8분 임의 대기하는 반면 앱 제한 시간은 5분임을 확인했다. GUI의 명시적 일회성 갱신 명령에 `--non-interactive --no-random-sleep-on-renew`를 추가했다. preview/코드 프로필/helper 모두 같은 공통 명령을 사용한다. 최초 회귀의 기대값 1개 누락 실패를 보존한 뒤 관련 43개 검사 성공 (`certificate-immediate-renew-fixed-20261008.log`). 예약 Certbot timer 설정은 변경하지 않았다.

원래 GUI 트리에서 eztoy.app을 선택하고 directory hook을 끈 후 미리보기·영향 확인을 거쳐 1회 실행했다. 임시 새 계정 옵션 없이 기존 Certbot 계정/갱신 파일/실제 nginx 플러그인과 공개 HTTP 검증으로 eztoy.app 및 www.eztoy.app staging 갱신 테스트 성공. job `652b87e2-26dc-4e33-9d8c-0b3d6eee5239`, 07:54:23Z→07:54:46Z, exit 0. GUI 완료 안내·완료 후 실제 인증서 상태 갱신·저장 로그 팝업을 확인했다. helper SHA는 전송 manifest와 일치하고 helper/state bind·호스트와 다른 mount namespace를 기록했다.

실제 결과가 `{logs:"...\n..."}` JSON 그대로 표시되는 문제를 발견해 현재 로그와 저장 기록 화면에 알려진 helper 응답만 한 번 해석하는 포맷터를 적용했다. 기존 셸 로그/알 수 없는 JSON은 그대로 보존하며 실행하지 않는다. 알려진 실패 envelope는 한국어 메시지를 표시한다. 관련 5개 검사 및 같은 실제 성공 기록의 HMR GUI 표시 확인 (`certificate-log-display-20261008.log`). 새 ACME 호출을 반복하지 않았다. AI 입력도 표시와 같은 셸 로그 텍스트를 사용한다.

기존 nginx 활성 graph/version과 갱신 파일·fullchain SHA 전후 동일, 자체 서버·전송물·임시 계정·로컬 로그인 파일·포워딩 정리 확인. 브라우저 수집 오류/경고 0개. 증거 `.runtime/verification/certificate-native-original-gui-20261008/{result.json,native-result.json,history-success.png,web.log,browser-errors.json,retry/source-manifest.json,retry/cleanup.json,initial-launch-failure.log}`.

이번 PASS는 위 도메인의 원래 GUI 갱신 dry-run 흐름에 한정한다. 신규 발급/HTTPS 설정 변경·실패/중단 복구·다른 패키지 전체 수용·전체 제품 완료는 별도 남는다. DEB 생성/검수/배포는 수행하지 않았다.

후속: 현재 소스 387개 운영 빌드 성공·실행 중 소스 변경 없음, `.runtime/verification/source-build-2026-10-08T08-00-23.396Z/result.json`. 빌드 로그와 SHA 목록 보존 후 자체 빌드 경로 정리했다.
