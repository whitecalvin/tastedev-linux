# 작업 기록의 오래된 nginx 백업 조회 — 2026-10-08

Certbot 작업 기록의 백업 ID가 일반 목록 최신 100개 밖으로 밀려나면 이전 화면은 선택할 수 없었다. 특정 작업의 ID 배열을 GET 조회에 전달하고 helper가 해당 private 기록을 직접 확인하도록 수정했다. 전체 목록의 최대 100개/탐색 1000개 제한은 유지한다. 특정 조회는 UUID 최대 100개, 중복 제거, 다른 파일 시스템 경로·UID 입력 거절을 적용한다. 실제 기록의 소유자/권한/심볼릭 링크/단일 링크/바이트 제한/해시/설정 경로 검사는 그대로다. 응답에는 원문 없이 메타데이터만 포함한다. 누락·손상 기록은 warning으로 표시하고 선택 불가다.

33개 회귀 검사 성공. private 실제 fixture에 105개 백업을 저장해 가장 오래된 ID가 일반 목록에서는 제외되고 특정 조회에서는 반환되는 것을 확인했다. GET 인증/정책/UUID 검증과 current canonical helper dispatch 전달도 검사했다. 변경 후 현재 helper/runtime을 격리 실제 nginx에 연결해 7개 적용·복원·구문 오류·reload 오류·해시 변조 방어 검사 성공. sudo/systemd는 검수 어댑터이며 운영 설정 변경 없음.

현재 소스 390개 Next.js 빌드 성공·빌드 중 소스 변경 없음. 증거는 `.runtime/verification/nginx-job-backup-lookup-20261008/`, `.runtime/verification/nginx-helper-isolated-2026-10-08T09-07-30.736Z/`, `.runtime/verification/source-build-2026-10-08T09-07-05.626Z/`. 빌드 로그/snapshot 보존 후 자체 임시 빌드 정리. 새 특정 ID 조회 경로의 원래 GUI/103번 수용은 아직 별도 검수 필요. 기존 GUI 적용·복원 증거로 이 변경 이후 GUI 합격을 추정하지 않는다.
