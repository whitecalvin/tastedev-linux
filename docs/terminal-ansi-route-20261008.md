# 실제 터미널 ANSI 화면과 페이지 복귀

현재 384개 소스 빌드의 실제 브라우저·로컬 PTY에서 ANSI clear screen, home cursor, carriage return, erase line을 사용했다. OLD를 덮어쓴 NEW만 화면에 남음을 확인했다.

한글 printf 명령을 입력하고 Enter 없이 대시보드로 이동한 뒤 터미널로 복귀했다. NEW 화면과 입력 중인 명령이 유지됐다. Enter 한 번으로 `ANSI_ROUTE_GUI_한글` 출력 줄이 정확히 한 번 나타났으며 다음 셸 프롬프트가 표시됐다. 이후 로그아웃 로그인 이동, 자체 셸 종료, 임시 서버/계정/작업 폴더/브라우저 탭 정리 완료.

자동 기록: `.runtime/verification/terminal-clipboard-gui-2026-10-08T04-36-53.226Z/result.json`. 실제 브라우저 관찰과 렌더링 줄: 같은 폴더 `browser-observation.json`. 화면: `/tmp/tastedev-terminal-ansi-route-20261008.png`.

검수 도구에 ansi-route 시나리오를 추가해 기존 clipboard 검사와 분리했다. 후속 실행부터 GUI 관찰 payload도 임시 폴더 삭제 전에 자동 결과에 보존한다. 이번 실행의 관찰 payload는 별도 browser-observation.json에 보존했다. 제품 소스 변경·운영 서비스 변경·배포 패키지 검증 없음.

이 검사는 특정 ANSI 제어 시퀀스와 Next.js 클라이언트 페이지 왕복을 확인한다. 모든 TUI 프로그램, 브라우저 새로고침 시 화면 복원, OS 입력기 조합, Tauri 환경의 완료를 뜻하지 않는다.
