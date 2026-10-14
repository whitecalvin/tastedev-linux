# nginx 사이트 연결 중단 복구 — 2026-10-06

`NginxSiteDialog`의 복구 성공 안내를 일반 설정 적용 안내와 구분해 **원본 복구 완료**로
표시한다. 적용/복구가 실패하면 현재 nginx 컨텍스트와 중단 기록을 다시 읽고 승인을
초기화한다. 일부 복구 이후 오래된 그래프 버전으로 같은 요청을 반복하는 상태를 피한다.

실제 helper를 다음 단계에서 `SIGKILL`한 뒤 검토된 복구 API를 실행했다.

| 시점 | 활성화 | 비활성화 |
|---|---|---|
| 변경 전 기록 저장 완료 | 확인 | 확인 |
| 링크 생성/제거 및 기록 갱신 완료 | 확인 | 확인 |
| reload 직전 기록 저장 완료 | 확인 | 확인 |
| 실제 native reload 완료 | 확인 | 확인 |

8가지 경우 모두 중단 기록 감지, 새 사이트 적용 차단, 원본 링크 상태 복원, 실제 HTTP
응답/listener 상태 복원, 원본 설정 바이트 보존과 기록 정리를 확인했다. helper 잠금도
프로세스 종료 후 다음 검토/복구 요청을 허용했다.

강제 종료 시점을 재현하려고 namespace 안의 runtime 복사본에 대기 지점만 삽입했다.
호스트 소스와 실제 변경·검수·reload·복구 로직은 바꾸지 않았다. 결과에 원본 및 계측
복사본 SHA-256, 시점, helper SHA-256을 기록했다. 모든 시스템 호출 사이의 임의 종료를
망라한 검사로 확대하지 않는다.

증거:

- 실제 API/helper 강제 종료 및 복구:
  `.runtime/verification/nginx-api-isolated-2026-10-06T03-40-27.452Z/result.json`.
- 팝업의 실제 복구 대상 표시·승인 payload·성공 안내·실패 후 재조회와 기존 적용 보호
  컴포넌트 검사 2개 통과.
- 최종 372개 소스 빌드, 빌드 중 소스 변경 없음:
  `.runtime/verification/source-build-2026-10-06T03-42-41.302Z/result.json`.
- 최종 빌드의 실제 브라우저: reload 후 helper가 강제 종료된 사이트 링크 노드의
  컨텍스트 메뉴 → 복구 대상/승인 확인 → 원본 연결 복구 → 완료 안내 → 링크/포트/원본
  실제 확인 → 트리 갱신. 콘솔 오류 없음. 로그아웃·탭 종료·fixture 정리 완료:
  `.runtime/verification/nginx-next-isolated-2026-10-06T03-42-58.197Z/gui-workflow.json`.

스크린샷:

- `/tmp/tastedev-nginx-site-recovery-before-20261006.png`
- `/tmp/tastedev-nginx-site-recovery-after-20261006.png`

실제 nginx 프로세스·검수·reload·HTTP를 사용했으며 sudo/systemd는 fixture adapter다.
운영 장비의 설치 helper/권한 수용은 별도 남아 있다. 다른 nginx 설정 변경과 중단된
사이트 기록 간의 변경 차단도 다음 검토 대상이다. 전체 제품 완료 증거는 아니다.
