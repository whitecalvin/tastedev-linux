# nginx 중단 기록의 교차 작업 차단 — 2026-10-06

설치 helper의 공통 dispatch 진입점에서 미복구 사이트 연결 기록과 설정 transaction 기록을 검사한다. nginx 설정 적용·전환·복원, nginx.service 제어, 인증서 실행, certbot.timer 시작/재시작/활성화 및 nginx/Certbot 설치 요청을 차단한다. 조회·검수·백업은 유지한다. 해당 기록을 복구하는 작업만 자기 기록을 우회하며, 다른 종류의 기록이 함께 있으면 복구도 거부한다. 검사 시 공유 helper lease를 유지한다.

검사: 관련 단위/회귀 26개 통과. 실제 격리 nginx helper를 reload 완료 후 SIGKILL하여 생성된 사이트 기록을 대상으로 19개 변경 요청이 거부됨을 확인했다. 매 요청 후 기록·원본 파일·링크·master PID·HTTP 응답이 유지됐다. 명시적 복구 후 정상 활성화/비활성화도 확인했다.

설정 transaction 쪽은 존재 검사 전용 fixture JSON을 생성해 변경 및 교차 복구 차단을 확인했다. 실제 설정 transaction 중단/복구를 새로 수행한 증거는 아니다. HTTP API와 실제 설치 sudo/systemd 검증은 이번 검사에 포함하지 않았다.

증거: `.runtime/verification/nginx-helper-isolated-2026-10-06T03-52-37.883Z/result.json`. helper 및 checkpoint 원본/계측 SHA가 기록되어 있다. checkpoint는 namespace 복사본만 변경한다. 호스트 서비스·설정은 변경하지 않았다.

첫 실행은 격리 nginx 워커의 initgroups 권한 오류와 cross-guard 모드 checkpoint 누락으로 실패했다. verifier 모드 계측을 연결하고 사용자 namespace 안에서 CAP_SETGID만 추가한 뒤 재실행했다. 이전 실패를 성공으로 간주하지 않는다. 전체 시스템 완료 및 최종 배포 검증과 구분한다.
