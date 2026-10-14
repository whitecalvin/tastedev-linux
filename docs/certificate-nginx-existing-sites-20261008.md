# Certbot 기존 nginx 설정 연계 · 2026-10-08

이전 executor는 `/etc/nginx/conf.d/linux-도메인.conf`만 읽어 앱이 만든 사이트에 한정됐다. `conf.d`의 기존 파일 및 `sites-enabled` 내부 링크로 활성화된 `sites-available` 서버 블럭에도 nginx 인증 방식을 사용할 수 있도록 수정했다.

`certificate-nginx-backup.mjs`는 현재 활성 include graph를 읽고 server 블럭의 정확한 `server_name`을 확인한다. 실제 canonical 파일별 전체 설정 백업을 한 번씩 생성하고, 백업 전후 graph version을 다시 확인한다. Certbot public options 파일은 읽기 전용 대상으로 유지하며 개인키를 백업하지 않는다. 누락/비활성 도메인·불완전 include·백업 실패·변경된 설정에서는 ACME 실행하지 않는다. 웹 루트·standalone·기존 갱신 방식은 그대로 유지한다.

현재 helper executor가 신규 모듈을 호출하며 패키징 runtime 목록·helper 허용 목록·의존성 검사도 함께 갱신했다. 성공 작업 로그에는 파일 경로와 백업 ID를 포함하여 nginx 백업 GUI에서 복원할 대상을 찾을 수 있다. 인증서 실패 후 백업은 남으며 자동 복원을 수행했다는 의미는 아니다.

관련 검사 18개 성공: `.runtime/verification/certificate-nginx-integration-fixed-20261008.log`. 실제 전용 파일과 내부 링크의 백업 내용/중복 배제, 비활성 도메인 거부, 외부 링크 차단, backup/graph 실패 시 ACME 실행 없음, 세 방식의 명령/확인/경로 보호, 완료 갱신/작업 이력, runtime closure를 검사했다. 초기 fixture umask와 허용 목록 누락 실패 로그는 보존했고 수정했다.

공식 근거: https://eff-certbot.readthedocs.io/en/stable/using.html — nginx plugin 실행 전 설정 백업 권장. 현재 실제 운영 도메인 발급/갱신 및 nginx 변경·복원 수용 검수는 남아 있다. 이번 작업은 기존 운영 nginx·인증서를 변경하지 않았고 최종 배포 검증을 수행하지 않았다.


## 실제 103번 발급 전 검사

현재 백업 모듈과 12개 로컬 의존성을 private `/tmp`로 추가 전송했다. `eztoy.app`의 기존 활성 설정 graph에서 nginx 파일 27개를 임시 경로에 백업하고 원본 bytes/hash와 모두 대조했다. 검사 전후 graph version 동일, ACME 요청 없음, 기존 helper/운영 설정/인증서 변경 없음, private stage 및 임시 백업 정리 완료. 원격 응답에는 설정 원문이나 키 없이 경로/hash/소스 manifest만 보존했다.

최초 실제 검수는 nginx 기본 `mime.types`의 백업 경로 제한으로 실패했고 정리됐으며 `.runtime/verification/certificate-nginx-native-20261008/result.json`에 보존했다. 기본 include 파일 `mime.types`, `fastcgi_params`, `uwsgi_params`, `scgi_params`를 공통 nginx 경로 정책에 명시적으로 추가했다. 임의 경로·외부 키 파일 허용으로 확대하지 않았다. 후속 성공은 `.runtime/verification/certificate-nginx-native-20261008T072002Z/result.json`이다.

표준 include fixture 및 관련 runtime 14개 성공, 기존 nginx 파일 변경·백업·복원과 Certbot 관련 회귀 22개 성공 (`certificate-nginx-path-regression-20261008.log`). 앞선 검사와 중복하므로 합산하지 않는다.

실제 파일 백업 coordinator 수용을 확인했으며 원래 Certbot GUI/인증 API/canonical helper 전체 발급·갱신·nginx 변화·복원 수용을 대신하지 않는다. 발급 검수는 이후 남은 단계다.
