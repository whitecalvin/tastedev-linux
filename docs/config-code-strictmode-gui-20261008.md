# 개발 코드 편집기 StrictMode 입력 수정 — 2026-10-08

103번 현재 원래 Next.js MariaDB IDE를 전용 systemd 서비스와 함께 실행했다. 초기 코드 입력은 textarea에 일시 표시되지만 코드/설정 탭 전환 후 원래 값 100으로 되돌아갔다. 공통 ConfigCodeEditor의 mount effect cleanup이 context.current를 null로 만들고 StrictMode 재실행 setup이 되돌리지 않아 isCurrent가 입력을 거부하는 제품 오류였다.

components/config-code-editor.jsx setup에서 활성 renderContext가 비어 있을 때 복원한다. 이전 파일/API 이벤트 및 unmount 후 응답 보호는 유지했다. 실제 개발 GUI에서 hotfix 후 코드 max_connections=123이 미저장 초안으로 유지됐고 설정 탭 값도 123으로 갱신됐다. reload 후 초안도 유지됐으며 검수 종료 전 100 원문 초안으로 돌린 뒤 로그아웃했다. tests/config-code-save.test.mjs에 setup→cleanup→setup 후 첫 입력 회귀를 추가했다. 기존 저장/연결/파일/선택/IME 이벤트 보호와 편집/위치 회귀 총 4개 통과.

원래 GUI→API→helper 실제 적용은 이번 실행에서 미완료다. private namespace의 /var/lib tmpfs 때문에 package status가 처음 가려졌고, GUI 서버가 개발 helper 경로를 사용하는 준비 설정도 발견했다. 같은 namespace에 상태 복사본을 읽기 전용 연결하고 helper 준비 상태 ready=true를 별도 확인했지만 GUI 적용 버튼은 비활성이었다. 수행하지 않은 실제 적용을 PASS로 처리하지 않았다.

검수 runner에 시작 전 LINUX_PACKAGED=true·현재 helper hash 연결·읽기 전용 package status 연결을 추가했다. 이 준비 보완은 Python 구문만 확인했으며 새 전체 GUI 실행은 다음 남은 단계다. 이번 원격 sourceManifest의 editor는 최초 전송 버전이며, 실제 hotfix GUI 버전 SHA는 별도 gui-result.json에 기록했다.

증거 `.runtime/verification/mariadb-original-gui-20261008/`. 네이티브 runner 결과 `.runtime/verification/mariadb-helper-remote-20261008T095025Z/result.json`은 GUI PASS 조건 미충족으로 FAIL이다. 화면 편집 수정 증거와 구분한다. 원본 host 설정/설치 helper 보존·자체 systemd unit 종료·private 전송물/DB 정리·로그아웃/탭/SSH 터널/로그인 파일 정리를 확인했다. 이전 실제 helper→systemd 적용·복원·실패 원복 9개 증거는 유지된다.

## 동일 소스 재전송 후 전체 정상 흐름 확인

보완한 runner의 새 실행에서는 원래 Next.js 개발 GUI→Better Auth 인증 API→현재 canonical helper→실제 전용 systemd MariaDB 서비스 흐름을 완료했다. 코드 편집 123→검수 완료→재시작 영향 확인→설정 적용 완료→생성 백업 목록/현재123·백업100 비교→복원 및 재시작→설정 복원 완료를 GUI에서 수행했다. 기본 상태 100에서 실제 SQL max_connections=123을 독립 네이티브 관측했고, 복원 후 실제 값100·원본 파일 바이트·기존 한글 행 보존·PID 변경을 검수 runner가 확인했다.

이번 최초 전송 manifest 전체는 현재 소스와 일치하며 실행 중 제품 hotfix는 없다. 브라우저 경고/오류0, 로그아웃 후 로그인 페이지 이동, 전용 서비스 종료·전송물/DB 제거·원래 host 설정/설치 helper 보존·탭/터널/임시 로그인 파일 정리를 확인했다. 이전 PARTIAL/FAIL 기록은 보존한다.

증거: `.runtime/verification/mariadb-helper-remote-20261008T095801Z/result.json`, `.runtime/verification/mariadb-original-gui-20261008/native-gui-result.json`, `applied-restored.png`. 이번에는 기본 적용/복원 정상 흐름을 확인했다. systemctl 고정 어댑터는 mariadb.service만 전용 unit으로 연결하며 기존 운영 MariaDB unit을 변경하지 않았다. 다중 unit 상태 헤더는 확인 전이었으며 상태 조회 합격으로 확대하지 않는다. DB 내용 백업/복원·모든 오류의 GUI 수용·전체 제품 완료는 별도 남는다.
