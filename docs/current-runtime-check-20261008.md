최신 확인: 한국어 우선 소스 396개 빌드 및 동일 빌드의 HTTP 검사 16개 그룹 성공. 새 Certbot webroot→nginx 자동 연계 옵션 true/false의 인수 배열, 잘못된 boolean 및 nginx/standalone 조합 400 거부까지 인증 API로 확인했다. 실제 ACME 발급 요청은 하지 않았다. 로그인/11개 페이지/세션 재시작·만료 이동/PTY 한글·이모지/SSE/감사/로그아웃 검사를 포함한다. 빌드 중·HTTP 검사 후 소스 hash 일치, 임시 서버 종료·계정 및 폴더 정리.

증거: `.runtime/verification/source-build-2026-10-08T14-09-56.490Z/result.json`, `.runtime/verification/production-http-2026-10-08T14-13-43.705Z/result.json`. 추가 검사 첫 실패는 API argv를 문자열로 취급한 검사 도구 오류로 보존하고 인수 배열 계약으로 수정했다: `.runtime/verification/certbot-installer-production-http-20261008/`.

아래는 이전 실행 이력이다.

# 현재 한국어 소스 실행 확인 — 2026-10-08

최근 Certbot 검토 상태, PostgreSQL 최초 상태 표시, 데이터베이스 journal 경고를 포함한 소스 384개를 임시 폴더에 정확히 복사해 Next.js 운영 빌드했다. 빌드 중 원본 변경 없음. 증거: `.runtime/verification/source-build-2026-10-08T05-27-37.339Z/result.json`.

동일 빌드의 별도 임시 HTTP 서버에서 15개 검사 그룹 성공. 인증 전 11개 보호 페이지의 로그인 이동, 인증 후 페이지 응답, 데몬 SSR 목록, Certbot 세 인증 방식 미리보기, 실제 PTY 한글·이모지 입력과 SSE 결과, 감사 기록, 세션의 프로세스 재시작 유지, 만료 시 API 거부·로그인 이동, 새 로그인과 로그아웃을 확인했다. 증거: `.runtime/verification/production-http-2026-10-08T05-27-54.051Z/result.json`. 임시 서버·계정·작업 폴더는 검사 도구가 정리했다.

기존 개발 서버 8787도 `/login` 200, 비로그인 `/overview` 307과 `/login?next=%2Foverview` 응답을 확인했다. 로그인 자격 증명과 서버 설정은 변경하지 않았다.

첫 빌드는 자체 임시 공간의 quota 오류(-122)로 실패했다. 실패 snapshot과 로그는 `.runtime/verification/source-build-quota-20261008/`에 보존했다. 이전 자체 빌드 자료를 보존하고 사용하지 않는 폴더 두 개를 정리한 뒤 재시도했다. 사용자 파일은 정리하지 않았다.

이 결과는 현재 소스의 운영 빌드와 HTTP 동작 확인이다. 실제 Certbot 발급·갱신 GUI, 설치 helper/systemd 전체 검수, OS 한글 입력기·Tauri 창, AI API 응답은 전체 완료 증거가 아니다. 한국어 우선 이후 다국어와 최종 배포 시 패키지 검증도 별도 남는다.
