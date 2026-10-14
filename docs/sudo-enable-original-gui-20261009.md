# nginx-check 비밀번호 생략 켜기 — 2026-10-09

사용자의 103번 전용 컨테이너 nginx-check 비밀번호 생략 적용 승인으로 원래 보안 GUI에서 미리보기·확인·적용·재조회를 완료했다. 재조회 시 스위치는 켜짐이며 선택 작업은 nginx-check 하나다.

독립 native 확인: 기존 PASSWD에서는 비밀번호 요구, 적용 후 sudo -k -n에서 비밀번호 요구 없이 helper 진입, visudo 성공, 원래 PASSWD 규칙 백업 1개 및 요청·완료 감사 확인. 컨테이너에는 nginx가 없어서 helper의 구조화된 실패 응답을 확인했으며 nginx 구문 검수 성공으로 해석하지 않는다. 첫 관찰 스크립트의 stdout 가정 실패는 stderr 구조화 응답을 읽어 바로잡았다.

전용 컨테이너의 관리 조회·변경 두 작업은 별도의 좁은 NOPASSWD 규칙으로 유지했다. 호스트 sudo 정책과 운영 서비스에는 적용하지 않았다. 이전 켜기 미리보기 미적용 기록과 끄기 성공 기록을 보존한다.

증거: `.runtime/verification/sudo-enable-approved-20261009/`의 result.json, native-results.json, gui-observation.json, applied.png. 전체 제품 완료 판정은 별도다.
