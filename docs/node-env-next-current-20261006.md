# Node.js 작업 폴더 환경 파일 실제 Next.js 연동

현재 359개 소스의 Next.js 빌드를 사용하여 실제 HTTP 라우트, Better Auth 및 파일 저장소를 연결했다. 임시 Linux 저장소에서만 실행했으며 helper/sudo/service adapter는 사용하지 않았다. 임시 계정과 서버, 작업 폴더는 종료 후 정리했다.

9개 검사 그룹을 확인했다:

- 인증되지 않은 조회 거부 및 로그인 후 지원 환경 값 조회
- 외부 Origin, 확인 누락, 조회 전용/편집 정책 및 잘못된 파일 경로의 변경 차단
- 실제 변경 시 주석·CRLF·한글·이모지·지원하지 않는 변수 보존
- 변경 전 원문을 private 0600 백업으로 보존하고 목록/응답에서 비밀 값 제외
- 이전 파일 버전의 변경 차단
- 복원 비교 및 확인 누락·다른 파일명·변조된 백업 복원 차단
- 실제 Next.js 프로세스 재시작 후 동일 세션과 백업 목록 유지
- 실제 복원 결과가 원문과 바이트 단위로 일치하고 교체 전 파일도 백업으로 보존
- 변경/복원 감사 결과 기록 및 환경 파일 내용 제외

실행: `node scripts/verification/node-env-http.mjs /tmp/tastedev-current-build-IdUdv7`.

빌드 증거: `.runtime/verification/source-build-2026-10-06T00-09-46.907Z/result.json`. 연동 증거: `.runtime/verification/node-env-http-2026-10-06T00-10-50.892Z/result.json`.

호스트 운영 설정/서비스는 변경하지 않았다. 등록 앱의 실제 systemd 제어, 브라우저 GUI 전체 흐름 및 설치 환경 수용 검사를 완료했다는 의미는 아니다. DEB 검증은 수행하지 않았다.
