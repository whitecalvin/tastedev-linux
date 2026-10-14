# 선택 파일 IDE 중복 불러오기 제거 — 2026-10-06

PackageConfig의 onFieldChange가 제공되는 선택 파일 편집 모드에서는 운영 설정 조회·불러오기 확인창을 표시하지 않는다. 모드 전환 시 이전 불러오기 요청을 해제하며, 독립 설정 생성기의 비교 기준을 선택 파일 IDE에 노출하지 않는다. 독립 생성기의 운영 설정 조회와 수동 불러오기 확인은 유지한다.

변경 파일: components/package-config.jsx, tests/package-config-render.test.mjs.

검사: Node v24.21.0에서 package-config-render, package-config-draft-response, package-ide-source-failure 테스트 8개 통과. PostgreSQL·MariaDB·Redis의 제어 모드 전환, 초안/비교 기준 저장소 변경 없음, 독립 불러오기 확인 유지, 편집·기본값 복원 위임을 확인했다. 이번 변경의 실제 브라우저 확인과 전체 앱 완료는 주장하지 않는다. DEB 관련 검사는 실행하지 않았다.

실제 브라우저 추가 확인: 현재 소스 366개를 스냅샷한 /tmp/tastedev-current-build-tFa8VP 빌드에서 PostgreSQL 파일 → 메모리 그룹 선택 시 불러오기 확인창/조회 버튼이 없고 work_mem 기본값 4가 표시되었다. 8로 편집 후 코드에 work_mem = '8MB'가 생성되고 설정 탭에 8이 유지됨을 확인했다. 운영 fixture는 읽기 전용으로 유지했으며 초안을 원본으로 되돌린 후 실제 로그아웃과 임시 탭 종료를 완료했다. 스크린샷: /tmp/tastedev-package-source-import-20261006.png. 이번 브라우저 검사는 PostgreSQL에 한정되며 MariaDB·Redis 화면까지 확인했다고 주장하지 않는다.
