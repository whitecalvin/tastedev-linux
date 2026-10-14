# Redis·MariaDB IDE 백업/복원 연결 — 2026-10-06

공통 패키지 IDE 헤더에 Redis 및 MariaDB 백업 조회·복원 검토 아이콘을 추가했다. 각각 기존 패키지 전용 백업 API와 명시적 확인 절차를 사용하는 팝업을 연다. PostgreSQL 복원 컨트롤이 다른 DB의 팝업에 표시되지 않도록 분리했다. 새 백업 생성 API를 추가한 작업은 아니며, 기존 설정 적용 시 만들어진 백업의 조회/복원이다.

복원 완료는 RedisBackups → RedisRestorePlan → RedisOperation 및 MariaDBBackups에서 부모 IDE로 전달한다. 부모는 복원 대상의 운영 파일을 다시 읽고 선택 파일에 해당하는 경우 설정·코드를 갱신한다. 미저장 편집은 보존하며 서버와 다른 내용은 stale로 표시한다. 작업 폴더에 저장한 기준도 운영 파일 복원으로 자동 저장 처리하지 않는다. 닫힌 팝업 또는 바뀐 연결의 늦은 응답은 제외한다.

검사: `node --test --test-isolation=none tests/database-restore-refresh-component.test.mjs tests/package-config-ide-render.test.mjs tests/package-ide-popup.test.mjs tests/redis-operation-ui.test.mjs tests/package-ide-source-failure.test.mjs` — 9개 통과.

실제 JSX/SWC 검사에서 헤더 진입, 패키지별 팝업, 깨끗한 편집기 갱신, 미저장 편집 보존, 닫힌 팝업 무효화, 정확한 복원 payload, 중복 실행 잠금 및 갱신 실패 후 실제 완료/복구 결과 보존을 확인했다. 실제 서비스 재시작·DB 데이터·권한 helper 또는 브라우저 완료 흐름을 확인한 증거는 아니다. 현재 개발 브라우저 탭은 로그인 페이지여서 인증을 우회해 화면 검사를 수행하지 않았다. DEB 검증은 수행하지 않았다.

동일 변경을 포함한 Next.js 운영 빌드 성공: `.runtime/verification/source-build-2026-10-05T23-48-22.434Z/result.json`. 358개 소스 snapshot, 빌드 중 소스 변경 없음. HBA 및 MariaDB/Redis 비동기 갱신 수정도 포함한다.
