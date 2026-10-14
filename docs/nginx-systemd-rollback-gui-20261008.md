# nginx 적용 실패 자동 원복 GUI 검수 — 2026-10-08

nginx 설정 적용/백업 복원에서 실제 작업 실패 후 원복되었을 때 단순 복구 완료로 표시하던 안내를 수정했다. 적용 실패 또는 백업 복원 실패와 원본 설정·서비스 복구를 함께 한국어로 표시하고 role=alert로 전달한다. 실패 결과에서 성공 갱신 콜백을 호출하지 않으며 사용된 확인은 재사용할 수 없다.

실제 컴포넌트 회귀 검수에서 남아 있던 적용 핸들러가 실패 안내를 지우는 문제도 발견했다. 확인 유효성을 안내 초기화보다 먼저 검사하도록 수정했다. 현재 관련 10개 검사가 모두 성공했다.

첫 원본 GUI 검수에서 103번 SSH banner timeout과 적용 요청 지연이 발생했다. 브라우저 결과 관찰 전에 탭을 닫았으므로 전체 GUI 게이트는 FAIL로 보존했다. 이후 실제 reload 2회·원본 파일 bytes·HTTP before 복귀를 확인했고 전용 서비스/작업 폴더 정리 및 호스트 설정/helper 보존을 확인했다. GUI 성공으로 간주하지 않는다.

초기 증거: `.runtime/verification/nginx-systemd-helper-20261008T110456Z/result.json`, `.runtime/verification/nginx-systemd-rollback-gui-20261008/partial-result.json`, `current.png`. 미완료 GUI 경고 관찰부터 새 전용 환경으로 재개한다. 최종 배포 패키지 검수는 수행하지 않았다.

재검수 결과: 현재 원본 GUI→Better Auth→인증 API→실제 sudo/canonical helper→전용 실제 systemd에서 적용 실패를 주입했다. 실제 reload 첫 호출 실패 및 원복 후 두 번째 호출 성공, journal 제거, 원본 HTTP before와 원본 bytes 복귀를 별도 native 프로세스로 확인했다. GUI의 한국어 role=alert와 재사용할 적용 버튼 제거, 초안 원문 정리, 로그인 경로 이동, 브라우저 경고/오류 0건을 확인했다. 전용 unit/stage/서버/검수 탭/포워딩/임시 계정 파일 정리 및 호스트 설정/helper 보존을 확인했다.

최종 증거: `.runtime/verification/nginx-systemd-helper-20261008T110932Z/result.json`, `.runtime/verification/nginx-systemd-rollback-gui-20261008/final-source.json`, `rolled-back.png`. 전송 소스 536개는 현재 소스와 일치한다. 적용 실패 GUI 범위이며 백업 복원 실패 실제 GUI·프로세스 중단 GUI·신규 TLS는 별도 남는다. 전체 목표는 PARTIAL이다.
