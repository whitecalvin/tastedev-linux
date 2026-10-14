# Redis 원본 GUI 검수 — 2026-10-08

103번의 전용 Redis 서비스에서 원본 Next.js 개발 서버, 인증, API, 실제 sudo/helper를 연결하여 로그인 → 코드 편집 → 후보 검수 → 적용 → 백업 비교 → 복원 → 로그아웃을 확인했다.

실제 CONFIG GET maxclients 값은 100 → 123 → 100이었다. 복원 후 원본 설정 바이트와 한글 AOF 데이터가 보존됐다. 브라우저 경고/오류는 0건이었다. 전용 서비스 종료, 임시 서버·비밀 파일·stage 삭제, 기존 설치 helper 보존을 확인했다.

복원 검토의 Strict Mode effect 재실행이 같은 API를 두 번 호출하여 두 번째 요청이 커널 잠금 오류를 표시하는 문제를 발견했다. 같은 컨텍스트의 진행 중 Promise를 재사용하도록 수정했다. effect 재실행의 단일 요청과 컨텍스트 변경 시 새 요청/이전 응답 무시를 검사했다. 관련 회귀 검사 4개 파일이 통과했다.

초기 소스 해시는 보존했다. 검수 중 수정 전송한 redis-restore-plan.jsx의 최종 해시는 final-source.json과 native helperProof.gui에 별도 기록했다.

증거: `.runtime/verification/redis-service-identity-20261008T104017Z/result.json`, `.runtime/verification/redis-original-gui-20261008/final-source.json`, `applied-restored.png`.

범위: 실제 전용 Redis 7.0.15와 원본 GUI 흐름. 패키지 목록의 redis-server 항목은 private dpkg inventory fixture로 노출했다. 호스트 apt 설치나 전체 배포 검증이 아니다. 전체 목표는 PARTIAL이며 nginx/TLS, Node/cron 등 남은 실제 검수는 별도이다.

임시 브라우저 탭 34의 닫기는 서버 종료 뒤 브라우저 오류 페이지 URL 정책으로 차단됐다. 인증은 이미 로그아웃했고 서버와 계정 파일은 삭제됐다. 사용자 탭은 변경하지 않았다.
