# 공통 IDE 미완성 GUI 입력 보호 (2026-10-06)

잘못된 GUI 입력으로 patchConfig가 실패하면 코드 text는 그대로지만 guiValues만 바뀐다. 이 경우 기존 text/baseline 비교만으로는 미저장 입력이 없는 것으로 처리되어, 새 파일의 초안으로 교체하거나 창을 닫을 때 값이 사라질 수 있었다.

수정: 실패한 GUI 입력을 record.pendingGuiFields로 표시한다. 미저장 감지와 새 초안 교체 확인은 코드 변경과 pending GUI 입력을 모두 검사한다. 개별 항목을 고칠 때 그 항목만 해제하고 다른 미완성 항목을 보존한다. 코드 변경에서 직접 파싱된 유효 항목은 GUI에 반영하고 해당 미완성 상태를 해제한다. 기본값 복원이 성공하면 미완성 목록을 해제한다. 조회만 한 정상 GUI 값이나 커서 위치는 미저장으로 처리하지 않는다.

실제 SWC 컴파일 PackageConfigIde에서 빈 workMem 입력은 원래 코드를 유지하면서 pending으로 표시됐다. 두 항목이 빈 상태일 때 workMem을 고쳐도 connections의 빈 값과 pending이 남았고, connections를 고친 뒤에는 pending 목록이 비워졌다. 기존 조회 실패/교체/연결 변경/세션 guard를 포함한 12개 검사 PASS. 명령: `node --test tests/draft-state.test.mjs tests/package-ide-source-failure.test.mjs tests/package-ide-popup.test.mjs tests/draft-session-redirect.test.mjs`.

증거 `.runtime/verification/package-ide-pending-gui-20261006/result.json`. 이 검사로 실제 브라우저 이탈 확인창 표시/취소를 완료한 것으로 주장하지 않는다. 원격 소스 전송은 승인 대기 상태로 유지하며 이 수정과 검사는 로컬에서만 수행했다.

현재 소스 366개 Next.js 빌드 PASS, 전후 소스 hash 일치: `.runtime/verification/source-build-2026-10-06T02-21-23.132Z/result.json`.

## 실제 브라우저 추가 확인

현재 빌드 `/tmp/tastedev-current-build-LyrpcV`의 임시 PostgreSQL GUI에서 workMem과 connections를 비운 뒤 그룹을 바꿔도 빈 값이 유지됐다. workMem을 4로 고쳐도 connections는 빈 상태였다. 코드를 fixture 원문으로 되돌리고 connections만 비운 경우에는 코드 전체가 원문과 정확히 같은데도 다른 파일 선택 시 초안 교체 확인이 표시됐다. 편집 유지 선택 후에도 빈 connections가 남았다. 값을 100으로 고친 뒤 로그아웃하여 login?next=... 이동을 확인했다.

증거 `.runtime/verification/package-editor-gui-2026-10-06T02-23-43.610Z/result.json` PASS. 화면 `/tmp/tastedev-package-pending-gui-20261006.png`. 읽기 전용 fixture 두 원본 보존 및 임시 서버/계정/파일/탭69 정리 완료. 브라우저 beforeunload 확인창 표시/취소는 이 파일 교체 확인과 다른 범위이며 여전히 미완료다.
