# Node.js 원래 GUI 실패·중단 복구

103번에서 현재 원래 Next.js 로그인/Node.js IDE/인증 API/canonical helper를 실제 전용 systemd 서비스에 연결했다. 설치 계정 whitecalvin UID 1000으로 실행했고 private Unix socket의 한글 HTTP `한글 GUI 서비스`를 확인했다. 일반 생명주기 재검사는 하지 않고 두 실패 경로의 준비 단계로만 등록·시작했다.

서비스 원본 Restart=no/RestartSec=5/TimeoutStopSec=15를 Restart=on-failure/RestartSec=7로 변경하는 검토와 명시 확인을 사용했다. 자체 namespace systemctl 어댑터가 해당 unit 교체 뒤 daemon-reload에만 일회성 실제 실패를 반환했다. GUI의 이전 설정 복구 안내와 백업 ID 7918f104-bbb4-4414-91d7-a74f48fcbf45, native 원본 바이트·같은 PID·한글 HTTP·journal 삭제를 확인했다. 이는 systemd 자체 고장이 아니라 전용 어댑터 실패의 실제 helper 자동 원복 검수다.

동일 unit의 두 번째 설정 변경을 교체·journal 생성 뒤 자체 장벽에서 멈췄다. 정확한 argv, namespace mnt:[4026532625], PID 874987/시작 tick 118313567을 대조한 canonical helper만 SIGKILL하고 대기 reload를 자체 abort로 해제했다. 웹의 한국어 알 수 없는 적용 결과 안내와 서비스 중단 복구 조회에서 현재/원본 옵션 및 백업 591cc11b-d5f3-4174-b4f0-001a394699cc를 확인했다. 별도 복구 확인으로 같은 서비스 탭에서 원본 설정 복구 완료가 유지됐다.

두 경우 모두 앱을 재시작하지 않았고 PID 868455/User=1000/ActiveState=active와 한글 HTTP가 그대로 유지됐다. unit SHA-256 e4540961fac07d9518e00f7b4c4890d169501727ba03a1aa941458a4ce75e3b0를 실제 바이트로 확인했다. journal 정리와 각각의 감사 기록을 보존했다. 복구 완료 옆의 이전 변경 중단 안내는 이전 작업 결과로 남아 있으며 자동으로 숨기는 변경을 이번 범위에 추가하지 않았다.

전송 소스 400개 해시를 다시 읽어 대조했고 helper SHA-256은 7bb22d462cc920c8bb442e148157ff117cd2f8ac17a6ac36383e675712597053다. Node 패키지 22.23.3-1nodesource1, 실행 버전 v22.23.3, binary SHA-256 fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48다. 400개는 AGENTS.md/admin package.json을 포함한 전송 파일 수이며 기존 398개 앱 소스 집계와 범위가 다르다.

브라우저 오류 0·로그아웃·자체 탭 종료 후 전용 unit 중지/disable/제거와 임시 stage 제거를 확인했다. 터널과 임시 계정 파일을 정리했다. 기존 서비스와 sudo 정책을 변경하지 않았다. 증거·스크린샷은 `.runtime/verification/node-service-faults-original-gui-20261009/`다. 이번 PASS는 두 설정 메타데이터 실패 복구 경로에만 해당하며 제품 전체 완료·DEB 검증이 아니다.
