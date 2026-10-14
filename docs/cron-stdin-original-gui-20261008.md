# 현재 cron 표준 입력 저장·복원 GUI — 2026-10-08

현재 396개 소스의 Next production 빌드 성공 뒤 원래 로그인·nginx IDE·복구 화면을 조작했다. 실제 Better Auth 계정, 일반 UID 1000 및 바이트가 같은 native crontab을 사용하고 spool을 별도 user/mount namespace에 격리했다. 호스트 crontab을 바꾸지 않았다.

nginx.conf 컨텍스트 메뉴의 예약 작업에서 사용자 whitecalvin/UID/GID·PATH/비관리 예약을 확인했다. `gui-stdin`의 04:00 한글 echo 명령을 비활성으로 검토·저장했으며 목록·원문·성공 안내에 반영됐다. 저장 후 확인 체크 해제·검토 제거·저장 버튼 비활성을 확인했다.

복구 페이지에서 자동 생성된 변경 전 백업을 선택하고 현재/복원 원문과 SHA를 비교한 뒤 GUI 복원 완료를 확인했다. native runner가 종료 전 기존 원문과 정확히 일치함을 검사했다. 로그아웃은 로그인 페이지로 이동했고 브라우저 오류/경고는 0개다. 검수 서버·탭·임시 자격 증명·fixture 정리를 완료했다.

증거: `.runtime/verification/cron-stdin-original-gui-20261008/result.json` 및 `restored.png`. 자동 runner 결과는 `.runtime/verification/cron-gui-isolated-2026-10-08T13-36-09.396Z/result.json`이다. 자동 runner의 guiVerified=false는 클릭 자체를 자동 판정하지 않고 native 원문 복원을 확인한다는 의미이며 실제 화면 조작 기록을 별도로 보존했다.

이번 GUI 환경의 바이너리는 같은 bytes의 일반 소유 실행 파일이다. 설치 setgid/PAM/daemon은 직전 103번 별도 검수에서 성공했으며 이번 GUI 세션으로 그 daemon을 직접 실행한 단일 검수는 아니다. 이 경계를 유지한다. 임시 빌드 quota 오류는 작업 전용 과거 빌드 출력 6개만 정리해 해소했다. 해당 source/manifest/log는 보존했고 정리 기록은 `.runtime/verification/temporary-build-cleanup-20261008.json`이다.
