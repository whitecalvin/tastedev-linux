# 터미널 복사·붙여넣기 단축키 — 2026-10-06

기존 터미널 custom key handler는 OS 입력기 전환 키만 구분했다. Ctrl+Shift+C/V가 선택 복사와 붙여넣기로 연결되지 않았으므로 `terminalClipboardHandler`를 추가했다.

- Ctrl+Shift+C: 선택 문자열만 브라우저 클립보드에 복사. 선택이 없으면 셸 중단 문자를 보내지 않는다.
- Ctrl+Shift+V: 입력 가능한 현재 세션에서 클립보드를 읽고 xterm의 `paste` API를 통해 기존 onData/직렬 입력 큐로 전달한다. 개행/Unicode 원문을 유지하며 xterm의 bracketed-paste 처리를 이용한다.
- 비동기 읽기 완료 시 terminal 인스턴스, 세션 ID, 입력 큐, 표시 상태와 disableStdin을 확인한다. 이전/숨겨진/중단된 세션에는 전달하지 않는다.
- 두 번 연속 읽기의 완료 순서가 역전되어도 붙여넣기 요청 순서를 유지한다. 반복 keydown/keyup은 추가 작업을 발생시키지 않는다.
- 일반 Ctrl+C 및 조합 중인 키는 기존 xterm/IME 처리에 맡긴다.
- 클립보드 접근 실패는 내용/예외를 노출하지 않는 안내를 표시한다. 현재 11개 외국어 카탈로그에도 안내를 추가했다.

확인: 새 단축키 검사 5개, 기존 화면·키·실제 xterm CompositionHelper 검사 9개, 언어 검사 16개 통과. 실제 JSX와 helper 단위 확인이며 OS 입력기 자모 조합이나 실제 브라우저 클립보드 권한 수용 검사를 수행한 증거는 아니다. 이 환경의 CUA 네이티브 앱 입력 API는 비활성이라 OS 입력기 검사는 여전히 미완료다.

계정/시스템 권한, 실제 셸 입력, 운영 서비스 또는 DEB 패키지는 변경하지 않았다.

최신 360개 소스 Next.js 빌드 성공: `/tmp/tastedev-current-build-7TSIFZ`, 증거 `.runtime/verification/source-build-2026-10-06T00-38-21.185Z/result.json`. 소스 snapshot과 컴파일 완료 시 원문 해시 일치를 확인했다.

실제 브라우저 확인 중 비동기 클립보드 읽기 완료 전에 Enter가 입력될 수 있음을 관측했다. 이전 화면에서는 두 번째 Enter로 명령 출력이 표시됐다. 클립보드 작업이 입력 큐 앞에 자리를 예약하고 이후 Enter/타이핑/다음 붙여넣기도 동일한 순서에 놓이도록 보완했다. 새 순서 검사 2개와 기존 단축키·화면 검사까지 10개 통과. 실제 이전 빌드 출력 화면은 `/tmp/tastedev-terminal-clipboard-output-20261006.png`이며 수정 후 순서 확인과 구분한다.

첫 GUI runner는 종료 API 접수 직후 세션 상태를 확인해 FAIL이었다. 이 API의 비동기 종료 상태를 짧은 폴링으로 확인하도록 검사 도구를 수정했다. FAIL 기록 `.runtime/verification/terminal-clipboard-gui-2026-10-06T00-41-14.265Z/result.json`은 보존했다. 임시 서버와 소유한 셸 종료는 finally에서 처리했으며 기존 사용자 탭 및 원래 브라우저 클립보드는 보존했다.

수정 후 최신 360개 소스 빌드 성공: `/tmp/tastedev-current-build-A5OKDw`, `.runtime/verification/source-build-2026-10-06T00-42-19.670Z/result.json`. 실제 브라우저 `127.0.0.2:46261`에서 Ctrl+Shift+V 뒤 Enter를 한 번만 눌러 `CLIPBOARD_GUI_한글` 출력과 다음 프롬프트를 확인했다. 출력 줄을 선택한 뒤 Ctrl+Shift+C를 눌러 클립보드가 정확히 해당 문자열과 일치함을 확인했다. 화면 `/tmp/tastedev-terminal-clipboard-verified-20261006.png`. 테스트 전 브라우저 클립보드를 복원하고 임시 탭/계정/셸/서버를 정리했다.

관찰 한계 정정: 첫 스크린샷은 Enter 직후 출력이 도착하기 전 상태일 수 있다. 따라서 이전 화면의 두 번째 Enter 관찰만으로 기존 코드의 실행 지연 원인을 확정하지 않는다. 비동기 클립보드 읽기와 Enter 순서 문제는 지연 읽기를 구성한 단위 검사로 확인했고, 실제 수정본의 한 번 Enter 실행은 위 화면으로 확인했다. OS 입력기 자모 조합 검사는 여전히 미완료다.
