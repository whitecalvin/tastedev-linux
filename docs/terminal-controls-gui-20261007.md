# 현재 터미널 한국어 GUI

현재 383개 소스 빌드 `/tmp/tastedev-current-build-nY9gsx`에서 실제 인증·Next.js API·PTY·xterm을 연결했다. 자체 `/tmp` 인증/상태/작업 폴더 및 127.0.0.2 임시 서버만 사용했다. 호스트 정책·서비스는 변경하지 않았다.

기본 실행 계정 whitecalvin, 기본 셸 /bin/bash와 임시 workspace를 설정 팝업에서 확인했다. 첫 셸의 `TERMINAL_GUI_한국어`, 두 번째 셸의 `SECOND_TAB_한글` 출력과 정상 프롬프트를 확인했다. 서버의 실제 두 세션 이력에도 각 표식이 서로 섞이지 않았다. 탭 왕복 뒤 실제 DOM의 visible xterm 행에서도 각 출력이 보존됐다.

전환 직후 첫 스크린샷에서는 이전 화면이 잠깐 남았으므로 DOM의 현재 visible 행을 대조한 뒤 캡처했다. 이를 셸 혼합으로 판정하지 않았다.

1280×720에서 터미널 호스트는 x48·y89·너비1232·높이605다. 문서 크기는 1280×720으로 외부 스크롤이 없다. 설정 팝업/로그아웃도 확인했으며 자체 셸은 runner가 종료한다.

화면: `.runtime/verification/terminal-controls-gui-20261007.png`. 완성된 한글 문자열 입력을 확인했으며 실제 OS 입력기의 자모 조합·한영 전환이나 연결/API 교체 GUI 수용 검사까지 입증하지 않는다.
