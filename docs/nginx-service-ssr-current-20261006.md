# nginx 초기 서비스 상태 SSR

로그인 확인 뒤 nginx 트리·사이트와 함께 서비스 상태를 읽어 헤더에 전달한다. 첫 클라이언트 효과가 SSR 상태를 지우지 않으며, 기존 5초 조회는 유지한다. API·연결·보안 정책 버전 변경에는 이전 상태를 제거한다. 이전 연결의 조회 응답과 서비스 제어 전에 시작된 늦은 응답은 적용하지 않는다.

검사: nginx-initial-ssr, nginx-toolbar, package-ide-initial-ssr 총 15개 통과. 실제 개발 브라우저 신규 탭의 첫 관찰에서 실행 중과 선택 전 안내가 표시되며 콘솔 오류 없음. 화면 증거: /tmp/tastedev-nginx-ssr-status.jpg. 설치 환경 서비스 제어 검사를 의미하지 않는다.
