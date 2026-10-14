# 패키지 IDE 탭 고정

공통 inspector에 세로 flex와 외부 overflow 차단을 명시했다. 기존 상위 workbench의 더 강한 overflow-y 규칙이 패키지 화면에도 적용돼 탭이 스크롤에 따라 사라지던 문제를 수정한다. 본문 tabpanel만 스크롤하며 트리·패키지 헤더와 탭은 유지한다.

최신 381개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-06T19-10-36.083Z/result.json`.

한국어 PostgreSQL 실제 브라우저 1280×720에서 긴 임시 설정 파일을 열고 본문을 1056px 스크롤했다. 탭 top 128px·트리 top 128px 및 tree.scrollTop=0 유지, inspector.scrollTop=0, body 높이 720px와 root 너비 1280px 유지. 코드 tabpanel 높이 528px·끝 위치가 inspector와 같고 textarea 690×367.4px 확인. 로그아웃 및 자체 탭/계정/서버/설정 fixture 정리 완료. 실제 운영 설정과 DB는 변경하지 않았다.

CSS는 공통 패키지 inspector에 적용되지만 Certbot·MariaDB·Redis 개별 브라우저 스크롤 수용 검사는 별도 남는다.

## Certbot 발급 폼 확인

같은 최신 소스 빌드에서 한국어 Certbot의 새 발급 노드를 선택했다. 실제 브라우저 본문 scrollTop=280, 탭/트리 top=128 및 tree.scrollTop=0·inspector.scrollTop=0 유지, 외부 스크롤 없음 확인. webroot 선택 시 웹 루트 입력이 표시되고 명령 미리보기가 생성되며 standalone으로 변경하면 웹 루트 입력과 이전 명령 미리보기가 제거된다. 테스트 전용 `.invalid` 도메인·이메일만 입력했고 약관 동의나 실제 발급은 하지 않았다. 로그아웃과 자체 탭·서버·fixture 정리 완료.

발급 폼 수용 증거이며 실제 인증서 파일 선택·갱신·ACME 발급 또는 운영 설치 전체 완료의 증거가 아니다. 증거: `.runtime/verification/package-editor-gui-2026-10-06T19-14-33.446Z/result.json`.
