# 승인 후 현재 소스 운영 빌드 및 HTTP

현재 소스 384개 파일을 자체 임시 폴더 /tmp/tastedev-current-build-4PkqSr에서 Next.js 운영 빌드했다. 빌드 종료 0, 소스 변경 없음. 증거 .runtime/verification/source-build-2026-10-07T08-46-14.976Z/result.json, 같은 임시 폴더 source-snapshot.json·build.log.

첫 빌드는 EDQUOT(-122)로 실패했다. 종료된 자체 이전 빌드 세 개의 사용 프로세스·소유자·프로젝트 snapshot을 확인하고 로그/목록을 보존한 후 정확한 해당 폴더만 정리했다. .runtime/verification/build-quota-cleanup-20261007-13/result.json. 이전 build root를 가리키는 기록은 해당 보존본과 함께 확인한다.

같은 최신 빌드의 실제 임시 Next.js 서버·자체 인증 계정에서 HTTP 15개 그룹을 확인했다. 11개 보호 페이지 로그인 이동과 인증된 SSR, Better Auth 쿠키, 서버 재시작 후 세션 유지, 실제 시간 만료 후 보호 라우트/쿼리 복귀, 재로그인, 로그아웃, 외부 Origin 거부, 외부 next URL 차단, 한글·이모지 PTY→SSE 입력과 최종 상태, 감사 내용 제한, nginx 권한 거부 감사, Certbot nginx/webroot/standalone 명령 미리보기 확인. 기존 3개 언어 HTML lang 회귀는 번역 확장이 아니다. 증거 .runtime/verification/production-http-2026-10-07T08-46-38.281Z/result.json.

운영 사용자 계정·시스템 서비스·DB·crontab·인증서는 변경하지 않았다. DEB 검증은 실행하지 않았다. 이 범위는 실제 설치 환경 전체 적용/실패/복구, OS 입력기의 한영 전환·조합, Tauri 실제 창, 실제 ACME 발급·갱신, HTTP 429로 막힌 AI 분석 응답을 완료했다는 뜻이 아니다. Certbot 검증용 도메인을 사용자에게 요청한 상태다.
