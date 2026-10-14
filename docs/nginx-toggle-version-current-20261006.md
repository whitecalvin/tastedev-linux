# nginx 활성 상태 전환 원본 버전 검사 — 2026-10-06

현재 nginx-toggle은 앱이 생성한 /etc/nginx/conf.d/linux-<domain>.conf와 .disabled 파일을 전환하는 API다. sites-available/sites-enabled의 심볼릭 링크 활성화 기능은 아직 없다. 이번 변경을 링크 관리 완료로 표시하지 않는다.

API에서 domain/enabled/confirm/version 구조를 검사하고 다른 필드를 거부한다. root helper도 64자리 SHA-256 버전을 독립적으로 요구하며 활성화/비활성화의 현재 원본 바이트 해시와 비교한다. 오래된 버전이면 409로 백업과 파일 이름 변경 전에 거부한다. 누락/잘못된 버전은 400이다. 정상 전환의 기존 백업→nginx -t→reload 및 실패 시 파일 이름 복원을 유지한다.

관련 검사 16개 통과. 활성화와 비활성화 양쪽의 누락/잘못된/오래된 버전이 백업·이름 변경·명령 없이 거부되는지, 정상 버전의 전환, API 감사/권한과 실패 복구를 확인했다.

현재 helper를 복사한 파일·프로세스·네트워크 namespace의 실제 nginx에서도 오래된 전환 요청 거부 후 원본 파일/백업 수 유지, 정상 비활성화→활성화와 reload, 실제 구문 오류와 reload 실패의 원본 복구를 확인했다. TLS 설정/리다이렉트 보존 및 복원 회귀도 통과했다. 증거 .runtime/verification/nginx-isolated-2026-10-06T03-16-32.512Z/result.json. helper/nginx SHA-256은 해당 결과에 기록했다. 모든 임시 fixture를 정리했다.

호스트 운영 설정/서비스/sudo 정책과 DEB 검증은 변경하지 않았다. 설치 helper/sudo/systemd 수용과 GUI 활성화/링크 관리, 이번 API 변경을 포함한 별도 Next.js 전체 빌드는 아직 수행하지 않았다. API JSX/JS 컴파일 및 실제 helper 검증 범위로 구분한다.
