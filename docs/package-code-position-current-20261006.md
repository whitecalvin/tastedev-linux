# 공통 패키지 코드 편집 위치 (2026-10-06)

PostgreSQL·Certbot 등 공통 ConfigCodeEditor가 사용하는 파일별 커서, 선택 방향, 가로/세로 스크롤 위치를 DraftProvider에 보존한다. 설정/코드 탭 전환에 따른 unmount 이후 동일 파일·동일 내용으로 돌아오면 위치를 복원한다. 같은 이름이라도 패키지 kind나 실제 sourcePath가 다르면 위치를 공유하지 않는다. 저장 버전만 바뀐 동일 내용은 위치를 유지한다. 외부 변경으로 내용이 달라지면 오래된 위치를 적용하지 않는다.

선택/스크롤/입력/포커스 해제와 검색/들여쓰기에서 위치를 기록한다. 검색 및 복원 직후 줄 번호와 구문 강조 스크롤도 동기화한다. 들여쓰기 예약 callback은 다른 파일이나 연결로 이동한 뒤 실행되지 않게 기존 context와 실제 textarea를 확인한다. 위치 캐시는 최근 32개로 제한하며 미저장 파일 경고 대상이 아니다. 로그아웃 시 기존 DraftProvider 초기화와 함께 제거된다.

검사: 실제 SWC로 컴파일된 컴포넌트의 remount·다른 클러스터 경로·저장 버전 변경·내용 변경·양방향 스크롤 및 선택 방향 복원, 기존 비동기 저장/비교 충돌 및 IME 단축키 보호, 원문 escape 렌더링, 터키어 로그인 SSR 검사를 포함한 6개 검사 통과.

명령: `node --test tests/config-code-position.test.mjs tests/config-code-save.test.mjs tests/config-code-render.test.mjs tests/editor-turkish-ui.test.mjs`.

증거: `.runtime/verification/config-code-position-20261006/result.json`. 브라우저 실제 패키지 화면의 위치 복원 및 OS 입력기 조합 수용 검사는 이 컴포넌트 검사로 완료 판정하지 않는다. 시스템 설정 및 DEB 검증을 실행하지 않았다.

최종 소스 366개 Next.js 빌드도 성공했다: `.runtime/verification/source-build-2026-10-06T01-56-12.403Z/result.json`. 빌드 전후 소스 SHA-256 일치 확인.

## 실제 브라우저 추가 확인

최종 빌드 `/tmp/tastedev-current-build-vLliUj`의 인증된 Next.js 화면을 별도 localhost 서버와 읽기 전용 임시 `/etc/postgresql/18/{main,other}/postgresql.conf`에 연결했다. 실제 키보드 이동 후 main 파일의 선택 7778–7784(backward), 세로 564, 가로 628이 설정/코드 탭 왕복 및 다른 파일 선택 왕복 후 그대로 유지됐다. 줄 번호 및 강조 레이어도 각각 세로 564/가로 628이었다. other 파일의 독립 선택 32–33(backward), 스크롤 0/0도 복원됐다. 신규 파일은 이전 파일 위치를 상속하지 않았다.

증거: `.runtime/verification/package-editor-gui-2026-10-06T01-58-27.265Z/result.json` PASS. 화면: `/tmp/tastedev-package-editor-verified-20261006.png`. 종료 시 두 원문이 모두 변경되지 않았음을 확인하고 임시 서버·계정·파일 및 생성 탭 66을 정리했다. 운영 DB나 서비스를 실행하지 않았다. 이 증거는 실제 PostgreSQL GUI의 공통 코드 편집기에 대한 것이며 Certbot 업무 흐름이나 OS 입력기 조합을 확인한 것으로 확대 해석하지 않는다.
