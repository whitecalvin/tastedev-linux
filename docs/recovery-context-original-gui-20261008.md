# 중단 복구 화면 연결 변경 GUI 검수 — 2026-10-08

현재 nginx·MariaDB·Redis·Node.js 복구 컴포넌트를 별도 Next.js 개발 서버에서 확인했다. 조회 후 연결 변경 시 이전 검토/확인창이 사라졌으며, 새 연결에서 재조회·최종 확인 후 해당 연결의 복구 요청만 발생했다. Redis와 Node.js는 열린 확인창 상태에서도 연결 변경을 확인했다. 네 화면 모두 복구 완료 안내를 표시했다.

기록된 변경 요청은 nginx 연결 2, MariaDB 연결 3, Redis 연결 4, Node.js 연결 5의 각 1개다. 이전 연결의 변경 요청은 0개이며 브라우저 경고/오류도 0개다. 컴포넌트 원본 해시 일치, 자체 서버 종료·임시 폴더와 자체 탭 정리를 확인했다.

증거: `.runtime/verification/recovery-context-gui-2026-10-08T09-18-18.146Z/result.json`, `.runtime/verification/recovery-context-original-gui-20261008/`.

API 응답은 명시적인 fixture다. 이번 결과는 원래 복구 컴포넌트의 브라우저 흐름 검수이며 설치 helper/systemd의 실제 복구 완료를 의미하지 않는다. 제품 소스 변경은 없었다.
