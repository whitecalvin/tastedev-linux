# cron 편집 환경 보존 및 native crontab 확인 — 2026-10-06

기존 관리 작업을 수정할 때 맨 아래로 이동하던 동작을 제거했다. 작업 앞에 적용된 PATH, SHELL, MAILTO 및 순서 의존 환경 선언을 유지하며 기존 위치에서 두 줄만 교체한다.

## 증거

- 실행: `npm run verify:cron:isolated`
- 결과: `.runtime/verification/cron-isolated-2026-10-05T20-16-27.296Z/result.json`
- native crontab으로 원본 저장, 비활성화 편집, 재활성화, 삭제, 원본 복구, 잘못된 시간식 거부 후 원본 보존을 확인했다.
- 실제 바이너리와 수정된 소스 SHA-256은 결과 파일에 기록했다.
- user/pid/network namespace 및 별도 `/var/spool`을 사용했다. 호스트 crontab은 변경하지 않았다.

## 검증 범위

namespace root 시험 계정에서 포맷 및 native 설치/조회 동작을 검증했다. 애플리케이션의 일반 사용자 변경 API, 예약 시각의 daemon 실행, GUI 전체 연동을 검증한 결과는 아니다.

cron 조회·변경 응답은 OS 사용자명/UID/GID와 시간대 정보를 함께 반환한다. GUI는 현재 사용자 crontab에 해당 계정을 표시한다. USER/LOGNAME 환경 변수로 계정 표시를 바꾸지 못하는 검사와 컴포넌트 표시 검사를 추가했다.

nginx 파일/블록 컨텍스트 메뉴의 예약 작업으로 cron 보조 화면에 진입한다. 실제 브라우저에서 진입, 조회, OS 계정 표시, 조회 권한 오류 및 저장 차단, nginx 복귀를 확인했다. 개발 서버 crontab 조회는 Permission denied로 실패했으므로 실제 호스트 변경은 확인되지 않았고 수행하지 않았다. 조회 실패는 빈 목록으로 취급하지 않으며 버전은 null이다. 관련 회귀 검사 30개 통과, 격리 native 검사 8개 통과. 브라우저 증거: `/tmp/tastedev-cron-account-error.jpg`.
