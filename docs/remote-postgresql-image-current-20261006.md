# PostgreSQL helper 격리 이미지 준비 (2026-10-06)

전용 검증 이미지의 Dockerfile·소스 hash manifest와 생성 스크립트를 로컬에서 준비했다. `scripts/verification/remote-postgresql-image.py`는 기본 실행에서 로컬 계획만 생성한다. 원격 전송은 `--execute`를 명시해야 하며 사용자 승인 전에는 실행하지 않는다. 소스는 현재 helper 1개와 감사된 runtime 모듈 137개만 포함한다. .env, API 키, 인증 DB, 사용자 파일, 운영 설정 및 node_modules는 포함하지 않는다. archive 747520 bytes, SHA-256 `728800fe1852f22c5c0326aa6d99fb6eac693537db2ddef6a9b9e0b7a72b2c21`.

계획 `.runtime/verification/remote-postgresql-image-20261006T021224Z/plan.json`, 같은 폴더 Dockerfile. 공식 Node 22 및 PostgreSQL 18 image digest 고정, bubblewrap/util-linux는 해당 이미지 내부에서만 설치할 계획이다. 공개 공식 Node 이미지 pull은 완료했다. 운영 Node 및 서비스는 변경하지 않았다.

원격 소스 전송/빌드 실행은 자동 승인 검토에서 거부됐다. 이유: 현재 helper와 다수 런타임 소스 payload를 192.168.0.103으로 전송할 명시적 사용자 승인이 없음. 차단된 명령은 실행되지 않았으며 소스를 우회 전송하지 않았다. 사용자에게 정확한 대상 장비·파일 범위·보관 위치를 포함해 승인을 요청했고 답변 대기 중이다.

로컬 계획 생성 및 Python 구문 검사 완료. 이미지 빌드, helper 실행, PostgreSQL 기동/적용/복구 및 최종 DEB 검증은 수행하지 않았다.

## 현재 준비 상태 재확인 (2026-10-07)

로컬 현재 파일만 대조했다. runtime 목록은 140개로 늘었고 기존 계획의 137개 중 일부가 변경됐다. 새 모듈 3개는 nginx-sites/nginx-site-request/nginx-site-operation이다. 기존 원격 이미지 계획은 현재 소스 증거로 사용할 수 없다.

현재 예상 helper `scripts/admin/linux-admin`은 없으며 `scripts/admin/linex-admin`만 존재한다. privilege의 소스 hash 조회, 배포 스크립트, 검증 스크립트와 테스트는 linux-admin을 요구한다. 사용자가 이름 변경을 직접 하겠다고 했으므로 자동 변경하지 않았고 helper 파일명만 변경할지 질문을 요청했다. 현재 자료 `.runtime/verification/remote-helper-preflight-20261007/result.json`.

원격 소스 전송 승인은 여전히 확인되지 않았다. 원격 전송/이미지 빌드/서비스 변경/DEB 검증을 실행하지 않았다.
