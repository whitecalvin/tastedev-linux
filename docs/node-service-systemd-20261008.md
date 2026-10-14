# Node.js 실제 systemd 서비스 검수

103번 설치 Node22.23.3과 일반 계정 UID1000으로 현재 native8개 모듈의 전용 서비스 동작6개를 확인했다. 임의 고유 앱 ID에 해당하는 새 unit만 생성했다. 실제 systemd-analyze 검수/등록 후 미시작·미활성화, 설치 설정 조회, 일반 계정 실제 실행과 Unix socket HTTP 한글 env 값, 재시작 PID 변경, 자동 시작 enable/disable, env 파일 검토 이후 변경 시 restart 거부와 명시적 stop 가능을 확인했다.

최초5개 성공 후 마지막 stop 검사가 실패했다. 검수 코드가 control request의 operation을 hooks 생성에 전달하지 않은 원인이었으며 제품 코드는 변경하지 않았다. 기록을 보존하고 새 전용 unit/start를 준비한 후 실패 게이트만 재개했다. 두 실행의 제품8개 SHA가 같고 전용 unit·private stage 제거를 확인했다. 원래 서비스·앱 파일은 변경하지 않았다. 두 검수의 systemctl daemon-reload는 생성·제거한 unit을 반영하기 위해 실행했다.

증거: `.runtime/verification/node-service-systemd-20261008/result.json`. 원래 GUI→인증 API→canonical root helper·native supervisor 전체 결합, 서비스 설정 변경/백업 복원은 별도 수용 검사가 남는다. 호스트 패키지 설치·최종 배포 검수는 수행하지 않았다.


## 현재 helper와 실제 systemd 연결

현재 root helper를 private mount namespace의 고정 경로에 연결하여 native lock supervisor를 포함한 실제 systemd 경로 10개를 확인했다. 첫 검수는 호스트에 없는 `/var/lib/linux`에 bind하려다 검사 전에 실패했다. 검수 namespace 내부의 `/var/lib`에만 tmpfs와 private state를 준비하도록 수정하고, 잘못된 조회 action을 `node-service-inspect`로 정정했다. 호스트 state 경로는 생성하지 않았다. 최초 실패 기록을 보존했다.

서비스 등록·정확한 설정 조회·UID1000 실행과 한글 환경 변수 HTTP·재시작 PID 변경·enable/disable·검토 이후 env 변경 시 restart 차단 및 stop 가능 6개를 확인했다. 이어 새 전용 서비스에서 설정 변경·백업·복원 경로만 검사했다. 다른 UID 거부와 unit 보존, 후보 systemd 구문 검수 후 서비스 설정 변경과 자동 백업, 원본 백업 조회/복원 계획, 원래 unit bytes 복원 및 undo 백업 생성 4개를 확인했다. 변경·복원 중 실행 PID와 실제 HTTP 내용이 유지됐으며 journal 정리 결과도 확인했다.

각 실행의 생성 unit/private stage 제거와 호스트 state 경로 부재를 확인했다. 현재 helper와 146개 runtime 소스 SHA가 두 실행 기록과 일치한다. 호스트에는 helper 파일이 없으므로 설치 패키지 검수로 주장하지 않는다. 현재 소스를 전송해 격리 namespace에서 실행한 검수다. 별도의 패키지 생성/검수는 하지 않았다.

증거: `.runtime/verification/node-service-helper-20261008/result.json`, 개별 실행 `node-service-systemd-20261008T120712Z`, `node-service-systemd-20261008T120842Z`. 원래 GUI·인증 API를 통한 실제 서비스 결합과 중단 복구 수용은 남는다.
