# Certbot 원래 GUI 검수 · 2026-10-08

추가 전송·GUI 검수 승인 후 현재 app/components/lib/public 및 앱 설정·helper 원본 387개 파일을 103번의 새 private 임시 경로로 전송했다. 소스 SHA 목록은 `.runtime/verification/certificate-original-gui-20261008/source-manifest.json`에 보존했다. 설치된 의존성을 읽기 전용 재사용하고 loopback Next 개발 서버·SSH 포워딩·일회성 로그인 계정으로 원래 `/ide/packages/certbot` 화면을 검수했다. 기존 설치 앱/helper는 교체하지 않았다.

실제 인증서 트리에서 eztoy.app 검색·갱신 선택, 원래 인증 API 명령 검토를 확인했다. directory hook 끄기→`--no-directory-hooks`, 켜기→해당 옵션 없음, 변경 후 기존 preview 제거를 확인했다. 로그인 진입 및 로그아웃의 원래 페이지 복귀 URL 유지도 확인했다. 브라우저 수집 경고·오류는 0개였다.

GUI에서 오른쪽 상세 화면에 모든 인증서 정보가 길게 나열되는 문제가 확인됐다. `ServerManager`는 IDE 트리 요청이 있으면 현재 갱신 대상의 정보만 표시하도록 수정했다. 전체 목록은 트리와 대상 드롭다운에 유지한다. 수정 파일을 자체 서버에 추가 전송해 실제 HMR 화면으로 확인했다. 선택·완료 후 갱신·명령 관련 회귀 10개 성공, `selection-regression.log`.

실패 작업 로그 팝업은 앞선 실제 eztoy.app 오류 문구를 담은 **검수용 저장 기록**으로 검사했다. 새 ACME 호출 성공/실패나 native helper dispatch 증거가 아니다. 조회 전용 정책으로 갱신 실행·서비스 변경은 비활성화했다. 이번 GUI 수용은 조회·미리보기·기록 표시 범위다.

증거: `.runtime/verification/certificate-original-gui-20261008/{result.json,selected.png,history.png,web.log,browser-errors.json,cleanup.json}`. 자체 서버·원격 전송물·임시 계정·로컬 로그인 파일·포워딩·검수 탭 정리 완료. 사용자 탭은 유지했다. 전체 상태 PARTIAL: 실제 ACME authorization 오류 해결과 GUI→현재 canonical helper→실제 발급/갱신·설정 원복은 남는다. DEB 검수는 수행하지 않았다.
