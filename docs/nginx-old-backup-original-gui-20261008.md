# 103번 오래된 백업의 원래 GUI 조회 — 2026-10-08

현재 소스/helper/runtime 143개를 103번 private child mount namespace에 전송했다. 실제 eztoy 설정을 읽어 canonical 백업 함수로 private 기록 105개를 만들고 검수용 시각을 지정했다. 명시적으로 검수용이라고 표시한 Certbot 작업 기록에 가장 오래된 백업 ID를 연결했다. Certbot 명령/ACME 요청/설정 변경은 실행하지 않았다. 일반 카탈로그는 100개이고 가장 오래된 ID가 제외된 것을 준비 단계에서 확인했다.

원래 GUI에 임시 계정 로그인→Certbot eztoy→작업 로그→검수 기록 선택→백업 목록 조회를 수행했다. 특정 ID GET/API/current helper 경로로 오래된 백업 `55f7a2e8-863a-4b20-adcb-b097c28a8978` 하나가 표시됐다. 이를 선택해 native include 그래프와 백업/현재 파일 버전을 검토했으며 `현재 설정이 백업과 동일합니다.` 표시를 확인했다. GUI의 선택 옵션은 빈 값+해당 ID 둘뿐이었다. 최신 100개 제한 때문에 선택 불가하던 문제의 현재 변경 경로를 실제로 확인했다.

백업 105개 모두 원문 해시 유효·대상 eztoy 설정 일치·원본 파일 해시 보존. helper SHA `c33115052674b84fd6d13f4734d42ecfe23e4afdd0dd5b306126c8daabbd3662`는 현재 소스와 일치한다. 브라우저 오류/경고 0·로그아웃·자체 탭/계정/임시 서버 정리. cleanup은 nginx 그래프·기존 eztoy 갱신 파일/fullchain 보존도 확인했다.

증거: `.runtime/verification/nginx-old-backup-original-gui-20261008/`. 이 결과는 오래된 백업의 실제 조회/복원 계획 검수이며 변경 파일 복원 실행이나 신규 TLS 발급의 합격 증거가 아니다. 작업 기록의 명령 성공/실패 자체는 seeded fixture다.

정리 첫 시도는 원본 snapshot 비교 후 Next.js 이벤트 파일의 동시 소멸(ENOENT)로 중단됐다. 종료되지 않은 자체 process group 수 0을 확인하고 남은 자체 private stage를 재정리했다. cleanup.json에 증거를 보존했다. 검수 스크립트도 부모뿐 아니라 같은 process group의 살아 있는 자식 종료를 기다리며, 삭제 중 ENOENT만 허용하도록 수정했다.
