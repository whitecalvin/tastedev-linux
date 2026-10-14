# nginx 실제 변경 파일의 GUI 적용·백업 복원 — 2026-10-08

현재 390개 소스 Next.js 운영 빌드와 원래 GUI/Better Auth/인증 API/현재 canonical helper를 연결했다. 격리된 실제 nginx 설정 `conf.d/reviewed.conf`를 GUI 코드 보기에서 변경·초안 반영·서비스 검토·확인·검사 후 적용했다. native nginx HTTP 응답이 `before`에서 `after-gui`로 변했다. 적용 중 생성된 실제 백업 `afc0c8cb-e312-474d-8347-57abf4103160`을 GUI 복원 팝업에서 선택·include 그래프 검토·서비스 검토·확인·검사 후 적용했다. 복원 완료 표시와 HTTP `before` 복귀 및 원래 파일 바이트 일치를 확인했다.

검수 도구를 보완해 GUI 경로에서 native 파일/응답 변화 관찰 및 원본 복귀, 적용·복원 completed 감사 기록, 각 GUI 단계 기록이 모두 있어야 합격하도록 했다. 실제 helper SHA-256: `d592369b5ff7a4d9e7faea306bf602fd9911339777f8a6e307904a7c22d7b06e`. 임시 공간 한도 문제를 해결하려고 같은 Node 실행 파일을 두 번 복사하던 부분을 읽기 전용 bind로 바꿨다.

증거: `.runtime/verification/nginx-config-restore-original-gui-20261008/` 및 `.runtime/verification/nginx-next-isolated-2026-10-08T09-00-09.180Z/`. native proof의 감사 기록은 apply requested/completed, restore requested/completed 네 행이다. 브라우저 경고/오류 0, 로그아웃 확인. 자체 nginx/Next 프로세스·격리 fixture/계정·탭 정리. 현재 소스 빌드 로그/snapshot은 `.runtime/verification/source-build-2026-10-08T08-58-53.819Z/`에 보존, 임시 빌드 제거.

이 검사는 개발 장비에서 별도 PID·마운트 namespace와 loopback 임시 포트를 사용했다. 현재 helper와 실제 nginx는 사용했지만 sudo/systemd는 검수용 어댑터다. 운영 호스트의 설정/서비스는 변경하지 않았다. 103번 실제 systemd 복원·Certbot의 신규 발급/TLS 변경·전체 목표 합격을 뜻하지 않는다. 앞선 103번 조회 전용 GUI 제한 결과도 보존했다.
