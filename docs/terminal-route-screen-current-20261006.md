# 터미널 페이지 복귀 시 화면/커서 보존 — 2026-10-06

원인 구조: 기존 TerminalScreen은 페이지를 떠나면 xterm을 dispose하고 돌아올 때 새 인스턴스에 서버 로그를 재생했다. ANSI 커서 이동과 화면 폭 변경이 포함된 이력은 재생 시 현재 커서/프롬프트 상태와 달라질 수 있었다.

수정: 실행 중인 동일 세션의 xterm·FitAddon·화면 출력 sequence cursor를 메모리에 보존한다. 복귀 시 같은 DOM/emulator를 재부착하고 입력/클립보드/크기 이벤트는 새 컴포넌트 연결로 다시 구독한다. 보존한 출력 sequence 이후 로그만 반영하며 기존 출력과 스크롤백을 다시 재생하지 않는다. 메모리 화면은 최대 4개이고 교체/퇴출 시 dispose한다. 종료한 탭은 보존하지 않으며 DraftProvider의 계정/세션 초기화는 화면을 dispose하고 generation을 바꿔 이전 컴포넌트의 늦은 cleanup 재등록도 막는다. 화면은 파일이나 localStorage에 저장하지 않는다.

확인: cache/화면/연결/탭 검사 8개, 초안·입력·출력 검사 17개 통과. 실제 DraftProvider.clear가 보존 화면을 정리하고 이전 ticket의 재등록을 거부하는 검사도 포함했다. 최신 362개 소스 빌드 `/tmp/tastedev-current-build-s5O1L9` 성공: `.runtime/verification/source-build-2026-10-06T00-54-20.309Z/result.json`.

실제 임시 브라우저 `127.0.0.2:32881`에서 한글 printf 명령을 입력하고 Enter 없이 대시보드로 이동한 뒤 터미널로 돌아왔다. 입력 중 명령과 화면 위치가 그대로 남아 있고 콘솔 오류가 없음을 확인했다. Enter 한 번으로 한글 결과 출력과 정상 프롬프트 복귀를 확인했다(Ctrl+L 사용 없음). 기존 탭을 닫고 새 터미널을 열었을 때 이전 출력 없이 새 프롬프트만 표시됨도 확인했다. 화면 증거: `/tmp/tastedev-terminal-route-preserved-20261006.png`. GUI runner는 정리 과정에서 exit 143으로 종료되어 마지막 자동 이력/종료 assertion은 완료되지 않았다. 실제 GUI 관찰과 자동 runner 결과를 구분해 `.runtime/verification/terminal-route-gui-20261006/result.json`에 PARTIAL로 기록했다. 남아 있던 이번 fixture의 셸 두 개와 임시 인증/작업 폴더는 별도로 정리했다. OS 한글 자모 조합 및 모든 ANSI 프로그램/창 크기 변경 수용 완료를 의미하지 않는다.
