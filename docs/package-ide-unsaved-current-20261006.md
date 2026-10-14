# 공통 패키지 IDE 미저장 보호 (2026-10-06)

문제: 실제 PackageConfigIde는 `packageIdeCodeRecords`에 코드를 저장하지만 공통 DraftProvider의 `hasUnsavedFiles` 검사는 이를 포함하지 않았다. 따라서 PostgreSQL·Certbot·Redis·MariaDB의 코드 편집을 한 상태에서 새로고침/창 닫기 시 미저장 보호가 활성화되지 않았다.

수정: 해당 레코드의 text/baseline 차이를 기존 미저장 검사에 포함했다. 설정 조회 시 미러링된 guiValues가 존재하는 것만으로는 변경으로 판단하지 않는다. 코드/설정 화면을 숨기거나 다른 파일을 조회해도 남아 있는 편집 레코드를 감지한다. 저장으로 baseline이 일치하면 해제한다.

실제 SWC 컴파일 IDE 코드 변경·조회 실패 후 초안 보존, 네 패키지의 변경/저장 상태, 기존 beforeunload guard와 로그아웃 epoch, 코드 위치 검사 포함 12개 테스트 PASS. `node --test tests/draft-state.test.mjs tests/draft-session-redirect.test.mjs tests/package-ide-source-failure.test.mjs tests/config-code-position.test.mjs`.

최종 소스 366개 Next.js 빌드 PASS: `.runtime/verification/source-build-2026-10-06T02-02-05.336Z/result.json`.

실제 브라우저 검사에서는 PostgreSQL 코드 5440 초안과 미저장 표시가 보였고 reload 시도 후에도 내용이 유지됐다. 그러나 getJsDialog가 undefined를 반환하여 브라우저 이탈 확인창 표시/취소를 직접 검증할 수 없었다. 해당 자동 게이트는 PASS를 요구하므로 FAIL로 보존: `.runtime/verification/package-editor-gui-2026-10-06T02-03-20.916Z/result.json`, 내부 GUI 결과 PARTIAL. 전체 이탈 확인창 실사용 완료로 주장하지 않는다.

임시 읽기 전용 원본 두 파일 보존과 서버/계정/파일 정리를 확인했다. 서버 정리 후 로그아웃 시도는 Failed to fetch였으므로 로그아웃 성공으로 기록하지 않는다. 이후 브라우저 초안을 fixture 원문으로 되돌리고 임시 탭 68을 닫았다. 화면 `/tmp/tastedev-package-unsaved-20261006.png`. 호스트 DB·서비스·운영 계정 및 DEB를 변경/검증하지 않았다.

현재 실제 개발 서버 127.0.0.1:8787의 로그인 HTTP200과 해당 tastedev-linux Next.js dev 프로세스/리스닝 포트를 확인했다. 로그인 HTML의 Flight 참조 layout/login 클라이언트 청크에도 최신 `hasUnsavedFiles`의 `drafts.packageIdeCodeRecords` 검사가 포함돼 있었다. 서버 재시작 없이 최신 코드가 제공됨을 확인한 증거: `.runtime/verification/live-dev-unsaved-flight-20261006/result.json` PASS. 첫 검사는 script 태그만 읽어 Flight 참조 layout 청크를 놓쳤으며 `.runtime/verification/live-dev-unsaved-20261006/result.json` FAIL로 보존했다. 해당 탐색 누락을 서버 중단이나 실제 미저장 보호 실패로 해석하지 않는다. 브라우저 이탈 확인창 실사용 수용 검사는 여전히 별도다.

## 현재 빌드 후속 (2026-10-07)

현재 383개 빌드 nY9gsx에서 별도 IAB/Chrome 탭으로 재검사했다. IAB API reload 완료 뒤 포트 5440 초안과 미저장 표시는 유지됐지만 getJsDialog는 undefined였다. Chrome API reload 뒤에는 선택 및 포트 5441 초안이 초기화됐고 확인창은 관측되지 않았다. Chrome 키보드 Ctrl+R 경로는 실제 새로고침을 일으키지 않아 대체 증거로 사용하지 않았다. 브라우저 자동 제어의 확인창 처리 여부 또는 제품 보호 실패 중 원인은 확인하지 못했다. 이 게이트는 PARTIAL이며 PASS로 판정하지 않는다.

두 탭의 자체 초안을 원래 포트 5432로 되돌린 뒤 정상 로그아웃/닫기를 확인했다. 호스트 원본은 읽기 전용이다. 화면 `.runtime/verification/package-unsaved-current-20261007.png`. 다음 수용 검사는 사용자 브라우저 도구 모음으로 실제 새로고침한 뒤 이탈 확인창 표시/취소를 직접 확인해야 한다.

## 보호 상태 갱신 타이밍 수정

별도 컴파일 컴포넌트 검사에서 clean 상태의 기존 listener가 편집 후 새 렌더가 끝나도 passive effect 전에는 이전 dirty=false를 읽는 실패를 재현했다. listener를 한 번 등록하고 현재 dirty/generation ref를 읽도록 변경했다. 저장 후 즉시 보호 해제, 로그아웃 clear의 epoch 무효화, 다음 세션 재편집 보호도 같은 listener로 확인한다. 초안·로그아웃·조회 실패·터미널 캐시 관련 17개 검사 통과.

이 수정은 앱의 렌더/effect 사이 타이밍 문제를 해결한다. 직전 Chrome API reload에서 확인창 미관측/초안 초기화 원인과 동일하다고 입증하지 않았고, 실제 브라우저 이탈 확인창 게이트는 계속 PARTIAL이다. 직전 383개 빌드는 이 변경 이전 소스다.
