# 인증서 완료 기록 운영 HTTP 연동 (2026-10-06)

현재 356개 소스의 별도 Next.js 운영 빌드에서 인증서 완료 기록 저장·목록·상세 조회를 실제 HTTP로 확인했다. 저장은 해당 소스 스냅샷의 `saveCompletedAdminJob`을 사용했다. 새 성공/실패 fixture를 Linux 임시 인증 저장소에 공개한 뒤, 실제 Next.js 프로세스를 실행하고 로그인해 조회했다.

- 목록·상세 API는 비인증 요청을 401로 거부한다.
- 목록은 완료 시각 내림차순이며 명령·로그 본문을 포함하지 않는다.
- 성공/실패 작업 선택 조회에서 명령, 한글 로그, 종료 정보가 저장값과 일치한다.
- 손상 JSON 및 안전하지 않은 파일 권한은 목록에서 제외하고 경고 수에 포함한다. 개별 조회는 각각 409/403, 없는 기록과 경로 조작 입력은 404다.
- 실제 서버 프로세스를 종료하고 같은 빌드로 재시작해도 기존 로그인 세션으로 동일 기록을 조회한다.

검증 도구: `scripts/verification/certificate-history-http.mjs`. 5개 검사 그룹 통과.

빌드 증거: `.runtime/verification/source-build-2026-10-05T22-31-19.111Z/result.json`.
HTTP 증거: `.runtime/verification/certificate-history-http-2026-10-05T22-31-55.409Z/result.json`.

임시 서버와 fixture를 정리했다. localhost 포트 실행 제한 때문에 허용된 동일 검증 명령을 재실행했다. 사용자 개발 서버, 계정, 보안 정책 및 운영 서비스는 변경하지 않았다. 실제 Certbot 명령 실행, ACME 발급, GUI에서 완료 기록 선택, 저장 중 강제 종료 검사는 이 증거에 포함하지 않는다.
