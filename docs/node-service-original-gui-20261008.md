# Node 실제 GUI·서비스 연결 검수

103번 현재 소스를 일반 Linux 계정 whitecalvin UID1000으로 실행했다. Better Auth 임시 계정 로그인 후 Node.js 앱 노드→파일 확인→정책 검토→서비스 등록→시작→재시작→설정 변경/자동 백업→원래 백업 복원→자동 시작 켜기/끄기→중지→로그아웃을 원래 GUI에서 수행했다. 실제 sudo canonical helper와 native lock supervisor를 사용했다. 대상은 임의 고유 ID의 전용 unit이며 기존 서비스는 대상으로 삼지 않았다.

독립 systemd/Unix HTTP 확인에서 등록 직후 미시작·자동 시작 꺼짐, 실제 PID 변경과 한글 환경 값 응답, 설정 변경 시 unit 해시 변경/실행 PID 유지, 복원 시 원래 unit 해시/PID/한글 응답 유지, enable→disable 및 stop PID0을 확인했다. requested/completed 감사가 각 8개로 일치했고 브라우저 warning/error 0, 로그아웃 로그인 이동도 확인했다. 현재 398개 전송 소스 SHA와 실제 원격 소스가 일치한다.

검수 중 실제 설치 판정 오류를 수정했다. NodeSource nodejs22.23.3-1nodesource1은 설치됐으나 별도 Debian npm은 deinstall/config-files 상태였고, 두 패키지가 모두 설치돼야 IDE를 보여주는 조건으로 Node.js 관리를 막았다. Node.js 그룹은 본체 설치를 기준으로 표시하며 각 하위 패키지 실제 상태는 그대로 유지한다. 다른 그룹 조건은 유지한다. 이 판정 관련 2개 회귀 검사 및 현재 원래 GUI 표시를 확인했다.

첫 namespace 준비는 dpkg 목록 경로가 가려져 정상 패키지 조회를 할 수 없었다. 실제 dpkg 목록을 read-only bind로 보존했고 첫 준비/정리 기록도 유지했다. 호스트 state 경로 및 설치 helper를 만들거나 대체하지 않았다. 임시 서버·unit·폴더·포워딩·로그인 파일을 정리하고 실제 listener 부재를 확인했다. TCP TIME_WAIT를 서버 실행으로 오인하지 않도록 SO_REUSEADDR 독립 bind로 확인했다.

증거: `.runtime/verification/node-service-original-gui-20261008-retry/result.json`, 단계별 JSON, source-and-audit.json, restored.png. 실제 실패/강제 중단 후 복구의 원래 GUI 전체 흐름은 별도 남는다. 최종 배포 패키지 작업은 수행하지 않았다.
