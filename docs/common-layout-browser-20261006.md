# 공통 화면 레이아웃 확인 (2026-10-06)

개발 서버의 로그인된 임시 브라우저 탭에서 overview/daemon/logs/recovery/security/audit/packages를 각각 열어 측정했다. 브라우저 기본 1280×720에서 모든 페이지의 문서 크기가 1280×720, 상단 공통 헤더가 56px였다. 콘텐츠가 넘치는 6개 페이지는 management-body 내부에서만 세로 스크롤이 생겼고 감사 화면은 현재 내용이 짧아 스크롤이 없었다.

기존 사용자 탭·화면 설정·시스템 설정을 바꾸지 않았다. 증거: `common-layout-browser-20261006.json`, `/tmp/tastedev-packages-common-layout-20261006.jpg`.

이는 현재 브라우저 크기와 현재 데이터의 결과다. 모든 화면 크기나 실제 장기간 운영 데이터까지 검증한 결과는 아니다.
