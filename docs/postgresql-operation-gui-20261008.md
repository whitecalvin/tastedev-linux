# PostgreSQL 적용·복원·중단 복구 팝업 브라우저 확인

현재 실제 컴포넌트 세 개를 자체 `/tmp` Next.js 개발 서버로 복사하고, 명시적 fixture 응답을 사용하는 별도 검증 페이지에서 확인했다. 원래 개발 서버와 운영 DB에는 연결하거나 변경하지 않았다.

## 실제 화면에서 확인한 흐름

1. 코드 검수 후 영향 확인 체크박스 전에는 적용 버튼이 비활성이다. main→other 대상 변경 후 이전 확인/검토가 사라진다. 새 검수와 확인 후 other에 대한 적용 요청이 한 번만 기록된다.
2. 백업 복원 최종 확인 중 other→main 대상 변경 후 이전 확인이 사라진다. main 백업을 다시 검토·확인한 뒤 main 복원 요청만 한 번 기록된다.
3. 개발 모드의 Strict Mode는 최초 백업 메타데이터를 두 번 조회하지만 정리된 조회가 graph 검토로 이어지지 않는다. other graph 검토는 한 번만 기록된다.
4. 중단 작업 복구 확인 중 main→other 대상 변경 후 이전 확인과 검토가 사라진다. other 작업을 다시 검토·확인한 뒤 other 복구 요청만 한 번 기록된다.
5. 조회 전용 전환 후 이전 결과가 숨겨지고 중단 작업 조회 버튼이 비활성이다.

요구한 브라우저 7개 결과 필드 PASS, 실제 화면 요청 기록 12개 보존. GUI와 fixture 양쪽의 제품 컴포넌트 SHA 일치, fixture 서버 정상 종료와 임시 폴더 삭제, 로그에 Error 없음 확인.

- 결과: `.runtime/verification/postgresql-operation-gui-2026-10-08T03-42-46.493Z/result.json`
- 도구: `scripts/verification/postgresql-operation-gui.mjs`
- 화면: `/tmp/tastedev-postgresql-operation-gui-20261008.jpg`

이 증거는 실제 React/브라우저의 팝업 흐름이다. 응답은 fixture이고 nativeHelperExercised=false이다. 실제 GUI→helper→systemd 및 설치 환경의 운영 적용·복원 전체 수용은 별도로 남는다.
