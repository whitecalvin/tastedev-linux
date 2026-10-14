# 실제 공통 Next.js 레이아웃 — 2026-10-06

문제: `(console)/layout.jsx`는 children만 반환했으며 실제 공통 헤더·아이콘 패널·메뉴·상태바·검색 팝업은 매 페이지의 ConsoleWorkspace 안에서 다시 생성됐다.

수정: 인증된 관리 라우트의 공통 요소를 `ConsoleChrome`으로 옮겨 `(console)/layout.jsx`에서 한 번 감싼다. 각 페이지는 embedded 본문과 기존 경로별 인증 확인/SSR 초기 데이터를 유지한다. layout은 인증 여부 확인 후 서버 상태를 조회하며, 미인증 요청의 원래 경로/query 리다이렉트는 각 페이지에서 처리한다. 페이지 이동은 usePathname으로 메뉴 선택과 sidebar 유무만 갱신한다. 설치 목록 새로고침과 로그아웃은 공통 헤더/메뉴에서 처리한다. standalone ConsoleWorkspace는 기존 검사 및 독립 사용용으로 유지하고 실제 관리 라우트는 모두 embedded로 렌더링한다.

확인:
- 기존/신규 JSX·SSR 검사 12개 통과.
- 최신 361개 소스 빌드 `/tmp/tastedev-current-build-sgVTUR` 성공, `.runtime/verification/source-build-2026-10-06T00-47-40.181Z/result.json`.
- 실제 인증 HTTP 15개 그룹 통과: `.runtime/verification/production-http-2026-10-06T00-48-13.674Z/result.json`. 11개 보호 라우트, raw daemon SSR, 실제 만료 후 query 보존/재로그인, 서버 재시작 세션 유지, 실제 PTY/SSE 포함.
- 실제 임시 브라우저에서 대시보드→데몬으로 이동 후 공통 검색 팝업의 입력 `보안`이 유지됨을 확인. layout의 클라이언트 상태가 페이지 이동에 보존됨을 관측했다.
- 로그·복구·보안·감사·패키지 화면은 1280×720에서 header 1개/main 1개, 문서 scrollHeight 720. 헤더 top=0. nginx 화면의 설치된 패키지 목록 및 별도 갱신 버튼 확인.

호스트 개발 서버 8787은 현재 소스 프로젝트의 `next dev --webpack`으로 실행되며 최근 터미널 코드가 개발 번들에 포함된 것을 확인했다. 임시 검증 서버와 실제 개발 서버를 구분했고 운영 서비스/DEB 검증은 수행하지 않았다.

화면: `/tmp/tastedev-console-shared-layout-20261006.png`. 임시 GUI fixture 종료에서 실제 PTY 로그의 명령 기록과 모든 소유 셸 종료를 확인했다. 단, terminal 복귀 초기의 프롬프트 redraw에 표시 겹침을 관측했고 Ctrl+L 뒤 다시 명령을 실행해 한글 출력/다음 프롬프트를 확인했다. 이를 터미널 복귀 화면의 무결성 수용 완료로 확대하지 않으며 재현/개선 항목으로 남긴다. 공통 레이아웃 확인과 구분한다.
