# cron GUI 일정 편집·백업·복원 — 2026-10-06

실제 Next.js 빌드 `/tmp/tastedev-current-build-mQpuhx`에서 임시 Better Auth 계정으로 브라우저 화면을 조작했다. 서버는 `127.0.0.2:34563`에서 실행하고 native `/usr/bin/crontab`의 SHA-256을 원본과 비교한 뒤 별도 namespace spool을 사용했다. 설치 목록·crontab·API에 adapter를 사용하지 않았다. nginx 설정 파일은 조회만 했다. 호스트 crontab과 서비스는 변경하지 않았다.

확인한 흐름:
- nginx 설정 파일 컨텍스트 메뉴의 예약 작업 진입.
- 현재 OS 계정·시간대 및 기존 PATH/비관리 예약 작업 조회.
- `gui-cron` 작업 `/bin/true`, 매일 03:00 활성 상태 검토·저장·완료 안내·목록 표시.
- 편집하여 04:15 비활성 상태 저장, 기존 비관리 작업 보존 표시.
- 복구 페이지에서 현재 사용자 crontab 수동 백업 생성.
- 첫 변경 전 백업 선택·현재/복원 내용 비교·확인·복원 완료 안내.
- 서버 종료 검사에서 native crontab이 원래 바이트와 정확히 일치.

증거: `.runtime/verification/cron-gui-isolated-2026-10-06T00-33-34.318Z/result.json`, 화면 `/tmp/tastedev-cron-restored-20261006.png`. 자동 결과의 `guiVerified:false`는 자동 runner가 화면 클릭을 검사하지 않고 최종 원문 복원만 검사한다는 뜻이다. 위 화면 관찰 범위를 별도로 기록하며 전체 GUI 검사를 통과했다고 확대하지 않는다.

화면에서 발견한 오류: 성공 후 기존 검토 내용과 확인 체크가 남아 같은 내용을 바로 다시 저장할 수 있었다. `ServerManager`는 성공 시 검토와 확인을 소모하고, 저장된 작업 입력 및 완료 안내는 유지하도록 수정했다. 관련 실제 JSX 검사 2개 통과. 이 수정은 위 GUI 빌드 이후이므로 수정 후 화면 확인을 별도 기록한다.

cron daemon을 실행하지 않았으며 설치 환경의 setgid/spool 권한과 실제 예약 시각 실행은 별도 미완료다. DEB 검증은 수행하지 않았다.

수정 후 확인: 최신 359개 소스 빌드 `/tmp/tastedev-current-build-p5kBwG` 성공, 증거 `.runtime/verification/source-build-2026-10-06T00-34-36.180Z/result.json`. 별도 임시 서버 `127.0.0.2:39783`의 실제 브라우저에서 저장 성공 후 검토문 제거·확인 해제·저장 버튼 비활성·입력/완료 안내 유지가 표시됨을 확인했다. 화면 `/tmp/tastedev-cron-review-reset-20261006.png`. 임시 관리 작업 삭제 확인 후 기존 PATH/비관리 작업만 남았고 runner 종료 검사에서도 원문 일치를 확인했다. 이전의 성공한 백업/복원 검사를 반복하지 않고 변경한 완료 상태와 정리 흐름만 확인했다.
