# 현재 소스 운영 빌드 및 HTTP 수용 확인 — 2026-10-06

현재 app/components/lib/public와 package.json, next.config.mjs의 소스 348개를 임시 `/tmp/tastedev-current-build-vKdUby`에 복사했다. 전체 bytes 및 SHA-256 일치, 빌드 중 변경 없음과 검증 종료 시 원본 불변을 확인했다.

Next.js 16.3.8 Webpack 운영 빌드 종료 코드 0. 증거: `.runtime/verification/source-build-2026-10-05T20-35-01.108Z/result.json`. 빌드 로그와 source-snapshot.json은 임시 빌드 폴더에 보존한다.

## 운영 HTTP

증거: `.runtime/verification/production-http-2026-10-05T20-37-02.534Z/result.json`

임시 인증 저장소와 OS가 할당한 loopback 포트에서:
- 보호 라우트 11개 비로그인 요청은 각각 로그인 next 경로로 이동한다.
- 실제 Better Auth 로그인은 HttpOnly/SameSite=Strict 쿠키를 반환한다.
- 같은 11개 페이지가 인증된 요청에서 현재 운영 소스로 HTTP 200을 반환한다.
- ko, it-IT, ar-EG의 초기 HTML 언어가 요청과 일치한다.
- 실제 서버 프로세스 종료/재시작 뒤 같은 세션이 유지된다.
- 외부 Origin 로그아웃 요청은 403이며 기존 세션은 유지된다.
- 외부 next URL은 /overview로 정규화한다.
- 로그아웃 뒤 이전 쿠키로 보호 페이지에 접근하면 로그인으로 이동한다.

임시 서버는 종료했고 시험 인증 저장소는 삭제했다. 기존 개발 서버, 사용자 계정 및 운영 설정을 변경하지 않았다.

HTTP/SSR 확인이며 모든 GUI 상호작용·OS 한글 입력·실제 패키지 변경·AI 호출·Tauri 설치 또는 전체 목표 완료의 증거는 아니다. 최종 배포 패키지를 생성하거나 검증하지 않았다.
