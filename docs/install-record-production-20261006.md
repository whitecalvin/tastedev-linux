# 설치 기록 운영 HTTP 연동 (2026-10-06)

설치 기록 저장 변경을 포함한 현재 357개 소스를 임시 디렉터리에서 운영 빌드했다. 빌드 중 소스 변경 없이 성공했다.

해당 빌드의 저장 모듈로 별도 Linux 임시 디렉터리에 설치 성공 기록을 저장하고, 실제 Next.js 운영 서버에서 로그인하여 `/api/status`를 조회했다. 성공 및 실패 기록과 한글 로그가 저장값과 일치했다. 새 파일의 잘못된 권한은 403, 손상 JSON은 409로 전달됐다. 파일이 없으면 null, 안전한 이전 경로 기록은 조회, 이전 경로의 공개 권한 파일은 제외하는 것을 확인했다.

실제 서버 프로세스를 종료하고 같은 빌드로 재시작한 뒤, 기존 로그인 세션으로 설치 실패 기록과 인증서 완료 기록을 다시 조회했다. API 인증 및 인증서 기록 검사를 포함해 7개 그룹이 통과했다. 검사 도구는 `scripts/verification/certificate-history-http.mjs`이며 이제 설치 기록도 함께 검사한다.

빌드 증거: `.runtime/verification/source-build-2026-10-05T22-37-24.230Z/result.json`.
HTTP 증거: `.runtime/verification/certificate-history-http-2026-10-05T22-37-48.237Z/result.json`.

임시 서버와 fixture는 정리했다. localhost 실행 허용으로 검사했으며 실제 apt 및 Certbot 명령, 운영 helper, 서비스 변경, 사용자 계정 변경은 수행하지 않았다. 실제 설치 장비의 설치 실행·실패·복구 수용 검사는 별도로 남아 있다.
