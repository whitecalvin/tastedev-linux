# sudo 생략 켜기 — 적용 전 상태

103번 표식·ID가 있는 자체 Docker만 사용했다. 원래 GUI/현재 helper를 전달하고 관리 대상 규칙을 `packageqa` UID 1000의 `nginx-check` PASSWD로 준비했다. native `sudo -k -n`은 종료 1·비밀번호 필요로 거부됐다.

규칙 조회·변경을 위한 별도 관리 권한은 `sudo-policy-inspect`, `sudo-policy-update` 두 명령뿐이다. 이 예외가 존재하므로 모든 sudo가 비밀번호를 요구하는 환경을 검수한 것으로 해석하지 않는다. GUI에서 관리 규칙 OFF를 조회한 뒤 생략 ON 미리보기를 만들었다. `nginx-check` 한 명령의 NOPASSWD 한 줄만 생성됐다. 아직 적용하지 않았다.

브라우저 보안 확인 정책에 따라 sudo 비밀번호 보호를 해제하는 최종 적용 직전 승인을 기다린다. 호스트 sudoers는 변경하지 않았다. 결과·준비 ID·승인 화면은 `.runtime/verification/sudo-enable-original-gui-20261009/`에 보존했다. 검수 컨테이너·터널·로그인한 자체 탭은 승인 후 이어갈 수 있도록 현재 활성 상태이며 적용/검수가 끝나면 정리해야 한다.

승인 대기가 반복되어 로그인 화면 확인 후 자체 탭·터널·임시 로그인 파일을 정리했다. 전용 컨테이너와 준비 폴더 정리 결과는 JSON에 기록한다. 적용 미리보기 증거는 보존했으며 NOPASSWD는 적용하지 않았다.
