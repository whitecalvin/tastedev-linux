> 아래는 승인 전 계획의 역사 기록이다. 추가 승인 후 실제 실행·수정·정리 결과는 [postgresql-original-gui-20261008.md](postgresql-original-gui-20261008.md)에 기록했다.

# PostgreSQL 원래 GUI/API 수용 준비

103번 설치 런타임의 Next 16.3.8, React 19.2.8, Better Auth 1.7.7을 읽기 전용으로 확인했다. 기존 helper/runtime 전송 승인과 새 화면 소스 전송을 구분해, 최신 source snapshot을 로컬에서만 준비하고 추가 전송 승인을 요청했다. 아직 전송·서버 생성·GUI 검수를 실행하지 않았다.

정확한 목록과 SHA-256: `.runtime/verification/postgresql-gui-transfer-plan-20261008/plan.json`.

bundle `/tmp/tastedev-postgresql-gui-source-20261008.tar`, 386개 파일, 5,662,720 bytes, SHA-256 `0c5afee6ee25daf188456cce16105ea438987c3cc0e7efb0faccee1b9844c845`. app/components/lib/public 및 package/Next 설정, helper와 helper CommonJS 메타데이터만 포함한다. .env·인증 DB·SSH/API 키·사용자 파일·node_modules는 제외한다.

승인 후 새 /tmp/tastedev-postgresql-gui-* 아래에서 기존 설치 의존성을 재사용한다. 현재 helper는 자식 mount namespace에만 연결하고 원래 인증 API/IDE를 임시 localhost Next.js 서버에서 검사한다. 기존 승인 전용 18/linuxverify20261008은 TCP 비활성으로 생성하고 그 유닛만 제어한다. 임시 계정을 새로 만들며 기존 자격 증명은 전송하지 않는다. SSH loopback forward로 실제 브라우저에서 접근한다. 검수 후 자체 서버·클러스터·임시 경로를 정리한다. 기존 앱/DB/helper를 덮어쓰거나 DEB를 생성·검증하지 않는다.

현재 native systemd/canonical helper 11개 성공 증거는 별도로 유지한다. GUI/API 검수 계획을 전체 수용 완료 증거로 사용하지 않는다.

로컬 준비 후속: scripts/verification/postgresql-gui-namespace.py는 사전 생성 전용 클러스터의 marker/실행 상태와 source SHA, root/private 권한, 이미 분리된 mount namespace를 요구한다. helper와 백업은 namespace에만 연결하고 Next.js는 localhost에서만 실행한다. 임시 계정은 private 파일로만 출력하며 모든 기존 자격 증명/외부 AI/Certbot/설치/터미널 변경은 사용하지 않는다. Python 구문·비실행 plan만 확인했다. 실제 전송·실행 및 모든 검수 폴더 정리 orchestration은 승인 후 단계로 남는다.

전송/시작/상태/정리 orchestration도 scripts/verification/postgresql-original-gui.py로 준비했다. --plan은 로컬 목록만 출력한다. --execute prepare는 승인 snapshot의 현재 SHA와 bundle SHA를 먼저 검증하며, 원격의 새 private /tmp 경로에만 소스를 푼다. 전용 클러스터와 localhost 서버의 PID·시작 식별자를 기록하고 cleanup에서 자기 프로세스 그룹과 자체 marker·설정 hash만 확인해 정리한다. 실패 시 연결 메타데이터와 stage를 보존해 정리 상태를 확인할 수 있도록 한다. 구문 및 plan 출력만 확인했으며 실제 prepare/status/cleanup 실행은 추가 소스 전송 승인 이후다.
