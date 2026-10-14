# Certbot 설치 옵션의 코드 초안 동기화 — 2026-10-08

새 발급 GUI의 webroot→nginx 자동 연계 옵션이 공통 패키지 설정/코드 생성에는 전달되지 않는 누락을 수정했다. Certbot schema에 false 기본값의 installNginx 스위치를 추가하고 webroot 신규 발급에서만 노출한다. configProfile은 webroot일 때 해당 boolean을 certificateCommand에 전달하며 다른 인증 방식에서는 숨겨진 기존 값을 실행 명령에 반영하지 않는다. 잘못된 boolean 값은 schema 검사가 거부한다.

관련 명령/초안 검사 12개 성공. 실제 103 전용 GUI에서 nginx 자동 연계 옵션 변경 뒤 기존 preview 제거·변경 확인 해제·실행 버튼 비활성을 확인했고, 원래 webroot/nginx/staging 옵션으로 되돌려 같은 명령을 검토했다. ACME 약관 체크는 하지 않았으며 발급 요청도 보내지 않았다. GUI 약관 확인 답변은 별도로 대기 중이다.

증거 `.runtime/verification/certificate-installer-original-gui-20261008/prepared.json`, 이전 preview.png. 전용 GUI의 현재 ServerManager는 직전 소스이며 이번 공통 config schema/profile/package-config 변경을 hotfix 전송한 검수로 확대하지 않는다. 이 변경 이후 임시 소스 복사본 396개 파일로 Next.js production 빌드를 성공했고, 빌드 중 소스 변경도 없었다. 증거: `.runtime/verification/source-build-2026-10-08T14-09-56.490Z/result.json`.

전용 GUI는 약관 확인 대기 중 제한 시간이 끝나 종료됐다. 발급은 제출되지 않았다. 원격 검수 결과에서 전용 서비스 종료, 기존 설정/인증서 및 challenge 파일 보존, 임시 폴더 제거를 확인했다. 미실행 GUI 발급 검수는 완료로 계산하지 않는다.

후속 확인에서 공통 설정 화면이 HTTPS 자동 연계를 켠 상태에서도 nginx 미변경 안내를 표시하는 오류를 발견했다. 연계 켜짐/꺼짐에 맞게 설명을 바꾸고 백업이 실행 전 수행된다는 순서를 명확히 했다. 기존 컴파일된 설정 화면/코드 생성 검사 10개 성공. 실제 브라우저 확인은 이 기록으로 주장하지 않는다. 증거: `.runtime/verification/certbot-installer-guidance-20261008/result.json`.

설명 수정까지 포함한 최신 빌드 396개 소스 성공, 빌드 중 소스 변경 없음: `.runtime/verification/source-build-2026-10-08T14-15-58.606Z/result.json`. 직전 HTTP 16개 검수 결과는 설명 수정 전 빌드의 증거로 유지한다.
