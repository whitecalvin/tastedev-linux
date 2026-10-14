# 등록 Node.js 앱 실제 Next.js 연동

앱 등록 해제와 등록 앱 환경 파일 변경/복원의 최종 감사 결과가 누락되어 있었다. 해당 세 작업을 동기 workspace route의 감사 범위에 추가했다. 인증된 요청의 completed/failed/blocked만 기록하고 이미 API/helper/worker가 결과를 기록하는 서비스 작업은 중복 기록하지 않는다.

현재 소스의 실제 Next.js HTTP 서버를 일반 사용자 UID로 실행해 임시 앱 폴더의 등록→파일 검사→환경 파일 변경/백업→프로세스 재시작→복원→등록 수정→해제를 확인했다. 8개 검사 그룹 통과. 등록 해제 뒤 앱 코드와 환경 파일이 그대로 남는지 확인했다. 앱 코드는 실행하지 않았다.

임시 앱의 CRLF·주석·한글·이모지·지원하지 않는 비밀 변수 보존, 응답/백업 목록/감사에서 비밀 변수 제외, stale registry/file 거부 및 확인 누락 차단을 확인했다. 실제 서버 재시작 후 같은 세션에서 앱 목록과 복원을 계속 사용할 수 있었다. 등록·해제·환경 변경·환경 복원 각각 completed/failed 감사 결과도 실제 조회했다.

실행: `node scripts/verification/node-app-http.mjs /tmp/tastedev-current-build-H8CwJs`.

빌드: `.runtime/verification/source-build-2026-10-06T00-12-15.624Z/result.json`.
연동: `.runtime/verification/node-app-http-2026-10-06T00-12-59.333Z/result.json`.
route 감사 소유권 회귀 2개 검사도 통과했다.

실제 systemd 서비스 설치·시작·종료, GUI 전체 흐름 및 설치 장비 검증은 포함하지 않는다. 호스트 서비스와 기존 파일은 변경하지 않았으며 임시 서버/계정/폴더는 정리했다. DEB 검증은 실행하지 않았다.
