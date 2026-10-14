# cron 백업 검토 내용 고정 — 2026-10-06

문제: 현재 crontab 버전만 비교하면 검토 이후 백업 파일이 다른 유효한 내용으로 교체된 경우 새 내용을 복구할 수 있었다.

수정: 복구 화면이 검토한 backup SHA-256을 backupVersion으로 보낸다. 일반 사용자 복구 함수는 cron 잠금 획득 후 백업을 다시 읽고 해당 해시와 비교한다. 일치하는 검토 내용만 적용한다. 누락하거나 변경된 해시는 409로 거부하고 현재 crontab은 보존한다. nginx privileged 요청에는 이 cron 전용 필드를 추가하지 않는다.

실제 일반 사용자 native crontab 13개 검사 통과. 증거: `.runtime/verification/cron-user-isolated-2026-10-05T20-32-28.245Z/result.json`. 검토 후 백업 text와 내부 sha를 모두 유효하게 변경한 경우 거부, backupVersion 없는 요청 거부, 기존 원본 복구 성공을 포함한다.

복구·백업·잠금 관련 29개 회귀 및 언어 카탈로그 15개 검사 통과. 신규 메시지는 현재 지원하는 10개 UI 카탈로그에 추가했다. 원어민 검수 또는 모든 Linux 언어 지원을 의미하지 않는다.

호스트 crontab 또는 운영 서비스를 변경하지 않았다. 예약 daemon 실행과 HTTP/GUI 실제 복구 전체 수용 검사는 남아 있다.
