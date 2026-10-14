# 터미널 표시 설정 — 2026-10-06

터미널 설정 팝업에 글자 크기(11–20px), 커서 모양(블록/세로선/밑줄), 커서 깜박임 및 출력 보관량(1000–10000줄)을 추가했다. 선택값을 허용 목록으로 정규화하며 실행 중인 셸을 재시작하거나 출력 buffer를 초기화하지 않고 xterm 옵션을 변경한다. 표시 중인 화면은 fit으로 크기를 맞추고 기존 resize 큐가 PTY에 전달한다. 숨겨진 탭은 0 너비로 fit하지 않는다. 새 탭/기존 탭/작업 로그 화면에 동일한 표시 옵션을 전달한다.

설정은 DraftProvider의 현재 로그인 작업 공간 메모리에서 페이지 이동 시 유지하며 계정/세션 초기화 시 정리된다. 브라우저 재시작 후 영구 보존을 구현했다는 의미는 아니다. 보관 줄 수를 낮추면 xterm의 이전 스크롤백이 줄어든다. 서버 작업 로그 보관량을 변경하지 않는다. 새 문구는 기존 11개 외국어 카탈로그에 추가했다.

25개 관련 검사 통과(터미널 설정 UI/기존 emulator 갱신·입력 조합·화면 cache·다국어). 보관량 UI 전달 assertion 보완 후 동일 UI 검사 1개 재실행 통과. 현재 363개 소스 Next.js 빌드 성공: `.runtime/verification/source-build-2026-10-06T01-03-07.960Z/result.json`.

임시 계정의 실제 브라우저에서 18px/세로선/깜박임 선택 표시를 확인했다. 팝업을 닫고 실제 xterm-rows의 computed fontSize가 18px임을 확인했으며 같은 실행 중인 셸에 한글 printf를 입력·Enter 한 번으로 결과 및 정상 프롬프트를 확인했다. 설정 팝업 증거 `/tmp/tastedev-terminal-appearance-settings-20261006.png`, 출력 증거 `/tmp/tastedev-terminal-appearance-output-20261006.png`. 자동 runner는 실제 PTY 이력 및 임시 셸 종료 확인 PASS: `.runtime/verification/terminal-clipboard-gui-2026-10-06T01-04-29.688Z/result.json`. 이번 입력은 키보드 입력이며 클립보드 수용 검사의 재실행으로 주장하지 않는다. GUI의 모든 선택값 조합 및 OS 입력기 검수까지 확대하지 않는다. 임시 서버·셸·인증/작업 파일 정리 완료, 운영 서비스/보안 설정 변경 및 DEB 검사 없음.
