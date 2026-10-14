# 터미널 탭 전환 중 한글 마지막 글자 보존 — 2026-10-06

기존 onData는 visible이 false이면 모든 입력을 버렸다. 설치된 xterm CompositionHelper는 compositionend를 setTimeout(0) 뒤에 확정한다. 조합 종료와 확정 사이에 탭이 숨겨지면 마지막 음절이 누락된다. 기존 visibility-only 분기를 동일 helper/입력 큐로 재현했다.

terminalCompositionVisibility를 추가하고 xterm 공개 textarea의 compositionstart/end 이벤트에 연결했다. 조합을 시작한 아직 입력 가능한 세션만 조합 종료의 지연 입력을 전달한다. 보존 창은 xterm의 조합 확정과 같은 다음 작업으로 제한한다. 숨겨진 탭의 일반 입력은 계속 차단하고, 세션 ID/입력 큐/권한·종료 상태가 달라지면 입력을 버린다. 정리 시 listener·timer·subscription·queue를 해제한다. 키 처리와 자모 조합 자체는 xterm에 맡긴다.

실제 설치 xterm 조합 helper를 SWC 컴파일하여 마지막 음절·받침 이동·Enter 순서·한 번 전달·종료/정리 차단·기존 버그 재현을 검사했다. 실제 컴파일된 TerminalScreen의 이벤트 등록/탭 숨김/큐 전달/listener 정리도 검사했다. 최종 변경 후 조합/화면 13개 통과; 이번 수정 과정의 키/클립보드 회귀 9개도 통과. 전체 반복 합계를 별도 검사 수로 더하지 않는다.

최종 현재 소스 373개 빌드 /tmp/tastedev-current-build-WEWVvZ PASS, 빌드 중 소스 변경 없음. 증거 .runtime/verification/terminal-composition-tab-20261006/result.json 및 .runtime/verification/source-build-2026-10-06T04-07-34.965Z/result.json. 앞선 XRfxBq 빌드는 보존 창을 좁히기 전이며 최종 증거로 사용하지 않는다.

실제 OS 한글 입력기/브라우저 조합을 새로 조작한 증거는 아니다. 이 확인 범위는 재현된 탭 전환 누락과 코드 이벤트 연결이며, 전체 OS IME 호환 완료로 확대하지 않는다. 운영 설정과 배포 패키지는 변경하지 않았다.
