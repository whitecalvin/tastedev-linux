# nginx 미반영 입력 페이지 유지 — 2026-10-06

트리 내부 ref에만 보관되던 미반영 입력을 공통 DraftProvider의 nginxPendingInputs 스냅샷에도 보관한다. 입력 변경마다 스냅샷을 기록하고 노드/초안/원본 변경 후에도 동기화한다. 페이지 재진입 시 파일 원본 버전과 함께 복원한다. 저장은 로그인 작업 공간의 메모리이며 브라우저 저장소나 디스크에 비밀번호/설정 원문을 새로 저장하지 않는다.

기존 지시어/사용자 지정 지시어/블록 인수/새 블록 입력 모두 포함한다. 미반영 입력만 있는 경우도 hasUnsavedFiles에 포함해 페이지를 벗어나 브라우저를 닫을 때 경고 대상으로 삼는다. 실제 브라우저의 native beforeunload 팝업 표시/취소는 별도 미확인이다. 원본 버전이 달라지면 기존 무효화 정책을 유지한다.

공통 draft generation 초기화를 구독해 로그아웃으로 초기화된 이전 계정 입력을 트리 ref에서 다시 저장하는 것을 방지했다. 변경 중 임시 연결 끊김만으로 미반영 입력을 지우던 기존 동작도 제거했다.

관련 모델/컴파일 컴포넌트/SSR 검사 총 25개 통과. 입력 객체 스냅샷의 불변성, 트리 remount 후 블록 인수 복원, 미반영 입력의 이탈 경고 및 generation 초기화 후 이전 입력 미복원, nginx 최초 SSR/검색/트리/설정 회귀를 확인했다. 이전 검사 모형이 ref를 공유하던 오류 및 현재 ServerManager의 certificate-job-history 표시 의존성 mock 누락도 수정했다.

실제 페이지 왕복 GUI와 운영 환경 수용은 아직 별도 남아 있다. 운영 설정/서비스 및 DEB 검증은 실행하지 않았다.

실제 GUI 확인 완료: 현재 소스 368개 빌드 /tmp/tastedev-current-build-6i6wrW PASS. 별도 읽기 전용 fixture에서 location의 미반영 사용자 지정 add_header/X-Route preserved 및 블록 인수 /pending-route 작성→현황 /overview→도구 nginx 복귀→location 재선택 시 모든 입력 복원 확인. 로그아웃 후 같은 임시 계정 재로그인에서는 이름/값이 빈 값이고 블록 인수는 원본 /로 돌아온 것을 확인했다. 두 번째 로그아웃·탭 종료·원본 바이트 보존 및 fixture 정리 PASS: .runtime/verification/nginx-editor-gui-2026-10-06T03-13-51.820Z/result.json. 스크린샷 /tmp/tastedev-nginx-pending-route-20261006.png. OS native beforeunload 팝업이나 운영 서비스 수용 확인을 뜻하지 않는다.
