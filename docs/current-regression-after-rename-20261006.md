# 이름 변경 중 현재 검사 (2026-10-06)

현재 전체 runner 결과는 FAIL이다. 보고된 1171개 중 1147개 통과, 24개 실패, 취소/건너뜀 0. helper 파일을 읽는 여러 모듈이 초기화 단계에서 실패하므로 이전 1199개 결과와 전체 개수를 동일하다고 해석하지 않는다.

실제 helper 파일은 `scripts/admin/linex-admin`인데 검사와 소스 참조는 `scripts/admin/linux-admin`을 요청한다. 이름 변경은 사용자가 직접 진행한다고 지정했으므로 파일/프로젝트/환경 이름을 대신 변경하지 않았다. legacy cron 검사도 동일 문자열 치환 결과 `assert(!updated.includes('LINUX'))`가 새 LINUX 표시와 충돌한다. 해당 검사와 이름 변경을 여기서 대신 수정하지 않았다.

전체 실패 로그 및 관련 파일 SHA-256은 `.runtime/verification/current-regression-after-rename-20261006/`에 보존했다. 반복 실행으로 성공했다고 보고하지 않는다.

별도로 최신 소스 373개 빌드와 동일 빌드의 실제 HTTP 15개 그룹은 성공했다. `.runtime/verification/source-build-2026-10-06T08-26-30.780Z/result.json`, `.runtime/verification/production-http-2026-10-06T08-27-11.403Z/result.json`. 로그인/11개 페이지 SSR/실제 PTY 한글·이모지/SSE/감사/세션 재시작/만료/로그아웃 범위이며 helper 실제 운영 실행이 아니다. 임시 서버·계정·작업 폴더는 정리했다.
