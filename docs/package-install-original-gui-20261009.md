# 패키지 설치 GUI와 로그 수정 — 2026-10-09

103번의 자체 Docker 안에서 원래 로그인·패키지 설치 화면과 현재 canonical helper를 사용해 nginx와 Redis를 실제 Debian apt로 설치했다. 호스트 apt·운영 서비스·sudo 설정은 수정하지 않았다. 배포 패키지를 만들지 않았다.

최초 nginx 설치는 성공했으나 GUI 작업 로그가 `{"logs":...}` 그대로 표시되며 2,000자에서 잘렸다. 이 실패 증거를 `native-results.json`의 `initialJob`에 보존했다. `lib/install-process-output.ts`에서 helper JSON 응답을 먼저 해석하고 실제 shell 로그를 줄 단위로 제한·저장하도록 수정했다. UTF-8 조각, 독립 stdout/stderr, 설치 오류 응답, 처리 한도 초과 후 후속 결과도 검사한다. 이미 잘려 저장된 과거 로그를 복원하지는 않는다.

수정 파일만 동일한 격리 환경에 전달한 뒤 Redis를 GUI에서 설치했다. 실제 저장된 42개 로그에 `Setting up redis-server`와 마지막 `Processing triggers`가 포함됐고 화면에서 JSON 껍데기 없이 읽을 수 있었다. 설치 완료 후 두 패키지의 설치 상태·버전·비활성 체크박스가 갱신됐으며, 도구 메뉴에 nginx와 Redis가 표시되고 nginx 설정 트리가 로드됐다. 작업 잠금 제거, 두 설치 완료 감사, 브라우저 오류 0, 로그아웃을 확인했다.

nginx 버전은 `1.26.3-3+deb13u9`, Redis 패키지는 `5:8.0.2-3+deb13u3`다. 바이너리와 helper SHA-256, 최종 399개 파일의 소스 해시 일치, 최초/최종 작업 기록은 `.runtime/verification/package-install-original-gui-20261009/native-results.json`에 보존했다. 초기 준비 스크립트 import 경로 오류도 로그를 보존하고 실패 단계만 수정·재개했다.

관련 실제 Node 검사 10개와 소스 397개 Next.js production 컴파일이 성공했다. 빌드 증거는 `.runtime/verification/source-build-2026-10-08T15-22-30.340Z/result.json`이다. 스크린샷은 같은 검수 폴더의 `installed.png`, `tools.png`다.

Docker의 기본 policy-rc.d는 서비스 자동 시작을 막는다. 따라서 이 결과는 실제 패키지 설치와 GUI 연결 확인이며, nginx/Redis 서비스 기동이나 나머지 네 설치 그룹·제품 전체 완료를 주장하지 않는다. 별도 systemd 서비스 증거는 기존 검수 기록으로 구분한다.

검수 종료 후 exact Docker ID·이미지·소유 표식을 확인하여 자체 컨테이너와 사설 준비 폴더를 제거했다. 임시 터널·검수 탭·로컬 계정 파일도 정리했다.
