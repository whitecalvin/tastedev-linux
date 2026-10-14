# Node.js 앱 IDE 탭과 본문 스크롤

선택한 앱의 등록 정보·환경 파일·서비스·로그를 각각 설정/환경 설정/서비스/로그 탭으로 구분했다. 기존 비탭 사용처는 그대로 유지한다. 탭 전환 시 같은 컴포넌트와 숨겨진 패널을 유지해 입력값을 보존한다. 등록되지 않은 앱에는 설정 탭만 표시한다.

공통 IDE 탭 구분선과 활성 밑줄을 사용하고 패널 하나만 스크롤한다. 키보드 좌우 화살표/Home/End 이동, roving tabIndex, tablist/tab/tabpanel 연결을 제공한다. 최초 브라우저 확인에서 details의 내부 레이아웃 때문에 탭이 함께 이동하는 문제를 발견해, 탭 모드의 루트를 일반 flex 컨테이너로 변경했다.

관련 JSX 실행 검사 7개 통과. 실제 브라우저에서 등록 입력값의 탭 왕복 보존, 오른쪽 화살표 이동, 환경 파일 변경·백업·복원 및 값 재표시를 확인했다. 이때의 빌드는 `/tmp/tastedev-current-build-LsYyMf`이며 연동 증거는 `.runtime/verification/node-app-gui-2026-10-06T00-22-43.712Z/result.json`이다.

최종 컨테이너 변경 이후 `/tmp/tastedev-current-build-KpfjL6` 빌드 성공: `.runtime/verification/source-build-2026-10-06T00-24-40.988Z/result.json`. 실제 1280×720 브라우저에서 패널 scrollTop=110인 동안 탭 top은 128로 유지되고 문서 scrollHeight=clientHeight=720, 패널 bottom=694임을 확인했다. 최종 레이아웃 증거: `.runtime/verification/node-app-gui-2026-10-06T00-24-54.015Z/result.json`.

화면: `/tmp/tastedev-node-app-tabs-fixed-20261006.png`. 임시 서버·탭·파일은 정리했다. Node.js/npm 설치 목록만 fixture adapter다. 실제 설치 장비 또는 서비스 제어 수용 검사는 포함하지 않는다. DEB 검증은 실행하지 않았다.
