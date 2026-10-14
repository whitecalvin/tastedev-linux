# PostgreSQL 실제 DB와 인증 HTTP API 연결 (2026-10-06)

`npm run verify:postgresql:local -- --api`를 추가했다. 기존 임시 PostgreSQL 18.6 흐름을 앱의 `lib/api.ts` 처리기와 실제 Better Auth 로그인/세션·보안 파일·감사 파일에 연결한다. HTTP 서버는 `127.0.0.2` 임시 포트로 한정한다. 브라우저 로그인 쿠키는 사용하지 않는다. 자격 정보와 DB는 새 `/tmp` 실행 폴더 안에서만 생성·제거한다.

API 모듈과 보안 모듈은 현재 소스를 SWC로 컴파일한다. privilege transport 및 helper readiness만 명시적인 fixture adapter로 대체한다. 실제 보안 옵션 판단·요청 검증·인증·감사는 앱 구현이며 DB 검토/적용·namespace 검수·백업 그래프 복원도 실제 구현이다. 임시 DB의 PID/start·SQL 설정·auto.conf 버전을 사용한다. systemd 대신 임시 pg_ctl 어댑터를 사용한다. Next.js 서버나 root helper 실행 증거로 확대 해석하지 않는다.

실제 HTTP에서 미로그인·유효하지 않은 쿠키·외부 Origin·조회 전용·databaseChanges 비활성·sudo 옵션 비활성 요청이 DB transport 전에 차단됨을 확인했다. 인증된 검토·확인 누락/코드 변경/DB 재시작 충돌·실제 적용·잘못된 항목 거부·활성화 실패 후 원본/DB 복구·백업 그래프 복원·한글 데이터 보존을 확인했다. 감사에는 코드나 데이터가 들어가지 않고 rollback/restore 결과가 남는다.

검증 과정에서 PostgreSQL 코드 검토/적용 및 복원 검토/실행의 정책 차단 결과가 감사에 기록되지 않는 누락을 발견했다. 네 action을 `outcomeAuditActions`에 추가했다. 실제 HTTP 정책 차단 세 건이 정확히 `postgresql-code-plan / blocked`로 남는지 확인했고, 별도 API 검사에서 네 action 모두 정책 차단 기록과 transport 미호출을 확인했다.

현재 증거: `.runtime/verification/postgresql-local-lifecycle-2026-10-05T23-33-16.681Z.json` (9개 그룹, DB 종료·fixture 제거 완료). 관련 API/라우트 감사 검사 4개 통과. 최종 API 변경을 포함한 Next.js 소스 358개 빌드: `.runtime/verification/source-build-2026-10-05T23-33-46.960Z/result.json`, 소스 변경 없음.

남은 범위는 현재 소스의 패키지 권한 helper·실제 systemd·Next.js 라우트·브라우저 GUI 전체 연결이다. 호스트 DB/서비스/패키지와 sudo 설정은 변경하지 않았다.
