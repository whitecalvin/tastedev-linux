# 인증 API와 실제 PostgreSQL 접속 규칙 적용·복원

현재 `lib/api.ts`와 보안 모듈을 Next SWC로 변환한 자체 localhost HTTP 서버에 연결했다. Better Auth 계정/세션은 자체 임시 auth 저장소를 사용한다. 관리자 전송만 명시적 fixture adapter로 현재 HBA coordinator에 연결하며, 실제 PostgreSQL 18 파서와 임시 Unix 소켓 클러스터를 사용했다.

## 실제 실행 결과

8개 검사 PASS:

- 로그인 없음 401, 외부 Origin 403, 조회 전용/DB 기능 미허용/sudo 옵션 미허용 403. 관리자 dispatch 실행 전 거부와 원본 보존.
- 인증된 recovery status GET 및 operation plan POST, 실제 `postgresql-hba-file-rules` 엔진과 검토 전 원본 보존.
- 확인 없는 적용 400, 검토 후 편집된 적용 409와 원본 보존.
- 실제 HTTP 적용 후 임시 HBA 파일 교체, 원본 비공개 백업과 journal 정리.
- 실제 HTTP 백업 복원, 원복 전 내용을 담은 undo 백업과 journal 정리.
- 실제 파서의 invalid-method 결과를 HTTP 응답으로 전달하고 원본 보존.
- 주입한 reload 실패 후 실제 원본 복원·복구 reload·journal 정리.
- 감사 기록은 action/at/result만 포함하고 rolled-back을 기록. 임시 클러스터의 한글 데이터 보존.

reload는 실제 pg_ctl로 요청한 뒤 `pg_conf_load_time()` 변경을 확인했다. PostgreSQL 18.6, 실행 바이너리 SHA-256 `30a38e0516ec1bde4b8ca710cf28ba51ee78bd004cabbf3107e7a52d5414a64a`. 네트워크 listen_addresses는 비어 있으며 자체 Unix 소켓만 사용했다. 클러스터 종료와 임시 폴더 삭제 완료.

- 결과: `.runtime/verification/postgresql-hba-api-local-2026-10-08T03-48-15.789Z.json`
- 실행 도구: `scripts/verification/postgresql-hba-api-local.mjs`
- API bridge의 인증 GET 경로도 추가: `scripts/verification/postgresql-local-api.mjs`

설치 root helper, systemd 및 Next.js 브라우저에서 같은 실제 클러스터까지 연결한 전체 흐름은 이 실행에 포함되지 않는다. 파서는 자체 일반 계정의 private copy/single-user 프로세스를 사용했으며 제품 bwrap namespace 검수 증거로 확대하지 않는다. reload 실패는 주입된 오류이며 실제 운영 장애가 아니다. 기존 운영 DB·설정·서비스 및 OS 권한은 변경하지 않았다.
