# nginx 실제 GUI 적용·복원 확인 (2026-10-06)

최신 운영 빌드 `/tmp/tastedev-current-build-K7ec4O`를 파일/프로세스 namespace의 임시 nginx와 함께 실행하고 실제 in-app browser에서 조작했다. GUI 접근을 위해 namespace의 네트워크는 호스트와 공유하되 nginx 및 Next.js는 임의 `127.0.0.1` 포트만 사용한다. 운영 설정·서비스·sudo 정책은 변경하지 않았다. 설치 목록에 필요한 dpkg 데이터베이스는 읽기 전용이다. 실제 sudo/systemd 대신 제한된 helper 전달 및 임시 nginx reload adapter를 사용한다.

실제 확인 흐름:

1. 별도 로그인 페이지에서 임시 계정으로 로그인하고 nginx IDE 원래 경로로 이동
2. 왼쪽 트리만 표시되고 오른쪽의 노드 선택 안내 확인
3. `conf.d/reviewed.conf` 선택 → 코드 보기 → 응답 문자열 `before`를 `gui-after`로 편집 → 초안 반영
4. 설정 탭에서 전체 설정 적용 → 설정/서비스 검토 → 프로세스 PID·locale 확인 → 영향 확인 → 검사 후 적용
5. 적용 후 미저장 초안이 정리되고 다시 조회한 코드가 `gui-after`임을 확인
6. 헤더 복원 팝업 → 생성된 백업 선택 → 복구 내용 검토 → 설정/서비스 재검토 → 영향 확인 → 검사 후 적용
7. 코드가 `before`로 갱신되고 헤더 검수 팝업에 실제 `nginx -t` 성공 로그 표시
8. 임시 fixture 종료 시 실제 HTTP 응답 `before` 및 원본 파일 바이트 일치 검사 통과; 임시 서버·nginx·계정·fixture·브라우저 탭 정리

원본 복원 검사 증거: `.runtime/verification/nginx-next-isolated-2026-10-05T23-06-21.956Z/result.json`. 이 JSON의 PASS는 fixture 원본 복원/HTTP 응답 확인 범위다. 브라우저 조작 증거는 위 흐름과 스크린샷으로 구분한다.

- 적용 후 코드: `/tmp/tastedev-nginx-gui-applied-20261006.png`
- 복원 후 검수 팝업: `/tmp/tastedev-nginx-gui-restored-check-20261006.png`

첫 GUI 준비에서는 격리 환경에 dpkg-query가 없어 패키지 미설치 화면으로 이동했다. 읽기 전용 실제 설치 목록 조회를 추가한 후 위 흐름을 확인했다. fixture의 systemctl adapter는 헤더의 일반 상태 조회 형식을 지원하지 않으므로 상태는 확인 불가, 시작/종료는 비활성으로 표시됐다. 실제 서비스 시작/종료 확인으로 판정하지 않는다.

추가 개선 발견: 적용/복원 후 갱신이 해당 적용 패널을 제거하면서 패널 내부의 완료 안내도 사라진다. 적용/복원의 실제 성공과 별개로 사용자에게 남는 완료 안내를 보완해야 한다. 실제 설치 환경의 root 권한/서비스 제어 및 Certbot 운영 발급은 별도 남은 범위다. DEB 검증은 수행하지 않았다.
