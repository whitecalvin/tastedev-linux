# PostgreSQL 복원 후 IDE 동기화 (2026-10-06)

PostgreSQL 복원 패널에 `onRestored` 연결이 없어 복원 후 선택한 설정 파일의 오른쪽 코드/설정이 이전 상태로 남을 수 있었다. 실제 복원 결과가 현재 패널의 응답일 때 부모 IDE가 `config-source`를 다시 읽고 파일 목록·서비스 상태를 갱신하도록 연결했다.

편집 중인 미저장 코드는 보존한다. 깨끗한 코드 화면은 조회한 복원 파일로 갱신한다. 작업 폴더에 이미 저장한 파일의 version/baseline은 그대로 유지하므로 운영 파일 복원을 작업 폴더 저장 완료로 잘못 표시하지 않는다. 팝업이 닫혔거나 선택/연결이 변경된 응답은 새 화면에 반영하지 않는다.

적용 패널의 비동기 갱신 callback도 await하여 중복 적용을 막고 rejected Promise를 처리한다. 복원/적용이 완료된 뒤 화면 조회가 실패해도 완료 결과를 지우지 않고 조회 실패를 별도 표시한다. DB 실패 결과를 적용 성공으로 바꾸지 않는다.

관련 검사 14개 통과: `postgresql-code-operation-component.test.mjs` 4개, `postgresql-code-restore-component.test.mjs` 9개, `package-config-ide-render.test.mjs` 1개. 마지막 검사는 네 패키지의 공유 IDE 렌더링 및 PostgreSQL 복원 후 깨끗한 코드 갱신·미저장 코드 보존·작업 폴더 저장 상태 보존·닫힌 팝업 callback 차단을 포함한다.

동일 변경의 Next.js 358개 소스 빌드 성공: `.runtime/verification/source-build-2026-10-05T23-29-43.157Z/result.json`. 소스 변경 감지 없음. 이 기록은 컴포넌트/빌드 증거이며 실제 브라우저에서 권한 helper를 통한 PostgreSQL 복원을 확인한 증거는 아니다. 실제 DB coordinator 증거는 `postgresql-lifecycle-current-20261006.md`에 별도로 기록되어 있다.
