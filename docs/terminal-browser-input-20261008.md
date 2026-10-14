# 터미널 실제 브라우저 입력 확인

현재 384개 소스 운영 빌드 `/tmp/tastedev-current-build-1YgMnp`의 터미널을 별도 임시 인증·작업 폴더와 실제 로컬 PTY로 확인했다. 브라우저 자동 입력으로 영문과 한글을 직접 전송하고 Enter로 실행해 `CLIPBOARD_GUI_한글` 출력을 확인했다. 두 번째 명령은 `한글X`를 입력하고 Backspace로 X를 지운 뒤 실행해 `EDIT_GUI_한글` 출력을 확인했다.

본문과 terminal-screen 너비는 각각 1232px, 하단은 각각 694px였다. 문서 외부 스크롤 없음. 로그아웃 후 `/login?next=%2Fterminal` 이동을 확인했다. 검수 서버가 자체 셸 세션을 모두 종료하고 자체 계정/작업 폴더를 삭제했으며 브라우저 탭도 닫았다. 운영 서비스·설정 변경 없음.

기록: `.runtime/verification/terminal-clipboard-gui-2026-10-08T04-34-21.091Z/result.json` 및 같은 폴더의 `browser-input.json`. 화면: `/tmp/tastedev-terminal-input-20261008.png`.

기존 clipboard fixture 도구를 재사용해 결과에 clipboard라는 이름이 남지만 이번 브라우저 입력은 직접 Unicode 타이핑이다. 클립보드 단축키와 OS 한글 입력기 조합을 검수한 것으로 해석하지 않는다. 실제 OS IME 및 Tauri 입력 확인은 남는다.
