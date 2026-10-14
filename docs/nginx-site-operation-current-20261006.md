# nginx 사이트 연결 관리 — 2026-10-06

트리의 `sites-available` 파일 또는 해당 파일에 연결된 `sites-enabled` 노드에서
컨텍스트 메뉴 **사이트 연결**을 연다. 별도 팝업에서 연결 이름을 선택하고 활성화
스위치를 바꾼 후 설정·서비스를 검토한다. locale과 reload 영향을 확인한 뒤 아이콘
버튼으로 검사 후 적용한다. 링크 존재와 실제 include 포함 상태는 따로 표시한다.
미저장 nginx 초안/코드/설정 입력이 있으면 적용 검토를 차단한다.

처리는 원본 파일·전체 사이트 목록·include 그래프·실행 중 서비스의 버전에 묶인다.
다른 파일과 이름이 겹치거나 include 대상이 아니면 생성하지 않는다. 활성화는
심볼릭 링크를 만들고 비활성화는 검증한 링크만 제거한다. 원본 설정은 보존한다.
변경 전 기록을 저장하고 실제 전체 nginx 검사 후 reload하며, 실패하면 원래 연결을
복구한다. 외부 충돌은 덮어쓰지 않으며 기록을 남겨 검토 후 복구할 수 있게 한다.
중단 기록은 일반 설정 조회에 포함해 팝업의 복구 흐름에 연결했다.

API: `nginx-site-plan`, `nginx-site-apply`, `nginx-site-recovery`,
`nginx-site-recover`. 로그인·동일 Origin·nginx 변경 정책·sudo 옵션을 기존 API와
동일하게 적용하고 결과를 감사 기록에 남긴다. helper의 모듈/행동 허용 목록과
설치 런타임 의존성을 함께 갱신했다. 실제 서버에는 helper를 설치하지 않았다.

검증:

- 파일/링크 변경, stale 원본·서비스, 충돌 보존, 구문/reload 실패 원복 및 기록 복구,
  인증·정책·감사 API와 런타임 검사 24개 통과.
- 팝업의 검토/초안 차단/성공 갱신과 기존 트리/SSR 검사 4개 통과.
- 실제 첫 GUI에서 두 병렬 조회가 helper 잠금과 충돌했다. 조회를 `nginx-context`
  한 번으로 합친 뒤 관련 팝업/컨텍스트/런타임 검사 8개 통과. 위 숫자는 검사 명령별
  결과이며 중복 항목을 합산한 고유 검사 수를 뜻하지 않는다.
- 실제 격리 nginx API: 조회, 연결 생성과 HTTP 응답, 오래된 요청 거부, 연결 제거와
  listener 종료, 잘못된 설정 원복, reload 실패 원복 등 6개 그룹 통과.
  `.runtime/verification/nginx-api-isolated-2026-10-06T03-29-23.165Z/result.json`.
- 최종 Next.js 소스 372개 빌드 성공, 빌드 중 소스 변경 없음.
  `.runtime/verification/source-build-2026-10-06T03-33-08.296Z/result.json`.
- 최종 빌드의 실제 브라우저에서 컨텍스트 메뉴/팝업 활성화·비활성화를 실행하고
  실제 링크·HTTP 응답·포트 종료·원본 바이트 보존·트리 갱신을 확인했다. 아이콘 버튼
  테두리 0px, 콘솔 오류 없음. 로그아웃, 탭 종료, fixture 정리 완료.
  `.runtime/verification/nginx-next-isolated-2026-10-06T03-33-24.391Z/gui-workflow.json`.
- 첫 조회 충돌은 성공으로 덮어쓰지 않았다.
  `.runtime/verification/nginx-next-isolated-2026-10-06T03-31-05.144Z/gui-workflow.json`.

스크린샷: `/tmp/tastedev-nginx-site-enabled-20261006.png`,
`/tmp/tastedev-nginx-site-disabled-20261006.png`.

실제 nginx 프로세스/검사/응답은 확인했지만 sudo와 systemd는 fixture adapter다.
후속 단계의 강제 종료 8가지 경우 및 실제 복구 팝업 확인은
`nginx-site-interruption-current-20261006.md`에 기록했다. 운영 설정·서비스·
sudo 정책 변경 및 DEB 검증은 하지 않았다. 전체 tastedev-linux 완료 증거는 아니다.
