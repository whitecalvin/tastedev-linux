# 터미널 입력 표시

대화형 터미널의 `account-shell`, `bash -i`, `codex`, `claude` 프리셋은 PTY 생성 시 `/usr/bin/script --echo always`를 사용합니다. 서버 입력이 pipe인 경우에도 셸의 정상 입력 표시가 동작해야 합니다. 이전 `--echo never`는 Bash readline과 sh에서 Enter 이전 영문·한글 표시를 막았습니다.

브라우저는 입력을 별도로 로컬 에코하지 않고 PTY 출력을 표시합니다. 비밀번호를 읽는 프로그램의 `stty -echo` 등은 그대로 적용됩니다. 명령 실행/출력 작업은 기존 `--echo never` 정책을 유지하며 transcript는 `/dev/null`로 설정됩니다.

실행 중인 세션의 PTY 옵션은 변경하지 않습니다. 개발 서버가 변경된 소스를 반영한 뒤 터미널의 `+` 아이콘으로 새 탭을 열면 적용됩니다. 이전 탭의 출력과 실행 중인 작업은 보존합니다.

`tests/terminal-interactive-echo.test.mjs`는 실제 Bash·sh에서 Enter 이전 영문·한글 표시, 동일 입력의 단일 실행, 프로그램이 비밀번호 에코를 해제하는 동작을 검사합니다. 실제 브라우저의 한영 전환 키/IME 동작을 검증한 증거는 아닙니다.
