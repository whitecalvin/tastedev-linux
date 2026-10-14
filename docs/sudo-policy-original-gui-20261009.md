# sudo 비밀번호 요구 GUI — 2026-10-09

103번 자체 Docker에서 원래 `/security` 로그인 화면과 canonical helper를 사용했다. 전용 `packageqa` UID 1000 계정의 sudo 권한은 `sudo-policy-inspect`, `sudo-policy-update` 두 명령으로 한정했다. 준비 후 전체 helper bootstrap 규칙은 제거했다. 호스트 sudoers·운영 서비스는 변경하지 않았다.

현재 규칙을 GUI에서 조회하고 비밀번호 생략을 끈 후 PASSWD 두 줄을 미리봤다. 접근 영향 확인을 선택하여 실제 규칙을 적용했다. GUI 적용 완료, 원래 NOPASSWD 규칙 백업 1개, sudo-policy-update 완료 감사, 실제 visudo 성공을 확인했다. 이후 같은 GUI의 현재 규칙 조회가 비밀번호 필요로 차단됐고, native `sudo -k -n ... sudo-policy-inspect`도 종료 1·`sudo: a password is required`를 반환했다. 브라우저 오류는 0개였다.

검수 당시 일반 완료 안내는 다시 조회하라고만 표시했다. PASSWD 결과에서는 인증 없는 웹 sudo가 차단되며 서버 터미널에서 권한을 복구해야 조회·변경할 수 있다고 안내하도록 수정했다. 수정된 실제 SWC 컴파일 화면 검사와 기존 규칙 조회·업데이트·충돌·원복 검사 15개가 통과했다. 새 안내 문구의 브라우저 수용은 별도이며 이번 실제 브라우저 결과로 확대하지 않는다.

원래 GUI에 전달한 399개 소스 파일 SHA가 일치했다. `native-results.json`에 규칙·해시·sudo 버전·비밀번호 요구 차단·원래 백업·감사를 기록했다. `password-required.png`는 적용 이후 원래 GUI의 차단 결과다. 모든 증거는 `.runtime/verification/sudo-policy-original-gui-20261009/`에 있다.

이 결과는 비밀번호 생략을 끄는 실제 GUI 흐름이다. NOPASSWD 권한을 GUI에서 새로 켜는 흐름이나 전체 보안/제품 완료를 주장하지 않는다. 격리 환경 준비로 만든 최초 NOPASSWD 규칙은 GUI 켜기 결과가 아니다.

로그아웃 화면 확인 후 검수 탭·터널·로컬 임시 계정 파일을 정리하고, 정확한 ID와 표식의 자체 Docker·준비 폴더를 제거했다. 증거 파일은 보존했다.
