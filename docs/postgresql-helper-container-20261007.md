# 현재 PostgreSQL helper 격리 검사

승인된 192.168.0.103의 자체 이미지에서 현재 root-owned helper를 실제 실행했다. 호스트 mount·공개 port·network·privileged·unconfined 없이 읽기 전용 이미지와 자체 tmpfs를 사용했다. 첫 실패는 상태 tmpfs의 넓은 권한을 helper가 거부한 것으로 보존했고, tmpfs mode=0700으로 수정 후 재실행했다.

현재 소스 hash를 대조한 image sha256:1accdaf55ee38e77840f88a6317f228f32484d68900dbb800c96123af192b3a9에서 다음 실제 helper 경로를 확인했다: 한국어 HBA 읽기와 버전, 비공개 백업 생성·내용 없는 목록, 오래된 버전 거부와 중복 백업 방지, 한국어 백업의 복원 미리보기와 원본 무변경, 심볼릭 링크 거부와 원본 보존.

격리 파서 실행은 namespace 단계에서 409로 차단됐다. 운영 파서로 우회하지 않았으며 실제 적용·실패 후 서비스 복구를 완료했다고 판단하지 않는다. 결과 PARTIAL. source/backup 및 임시 컨테이너 제거 확인은 성공했다. 증거 .runtime/verification/remote-postgresql-helper-20261007T083856Z/result.json, process.log. 이전 영문 단계 안내 재현 .runtime/verification/remote-postgresql-helper-20261007T083729Z/result.json도 보존한다.

실패 안내의 copy/namespace/initdb/single-user/report 단계명을 한국어로 수정했다. HBA 검수 요청·격리 계획·응답·진단 관련 하위 검사 8개 통과. 이후 현재 소스로 격리 이미지를 갱신하고 실제 helper의 한국어 단계 안내를 확인했다. 도구는 이미지 결과 경로를 명시적으로 받고 현재 helper와 runtime module hash가 일치하지 않으면 실행을 거부한다. 운영 DB 기동·운영 설정 적용·DEB 검증은 수행하지 않았다.

## namespace 원인 구분 후속

단순 root CLONE_NEWUSER 생성은 기존 제한 프로필과 SETFCAP에서 성공했다. 이 성공을 전체 bwrap 검수 성공으로 확대하지 않는다. 증거 .runtime/verification/remote-namespace-policy-20261007T083947Z/result.json.

현재 bwrap 0.12.0의 동일 격리 계획으로 id만 실행한 진단은 namespace 생성 권한 부족을 명시했다. 호스트 보안 정책은 변경하지 않았다. PostgreSQL 검수 실패를 시간 초과·실행 파일 시작 실패·namespace 권한 거부·기타 실패로 나누어 한국어 안내하며, 원시 명령 출력과 비밀값은 사용자 오류에 전달하지 않는다. 관련 실제 하위 검사 10개 통과.

현재 코드 이미지 sha256:e672869eb61e71814f1365d5b7b3cb45b86ea3d74faf36ae5dfd776d5edeff18에서 실제 helper의 한국어 namespace 권한 안내, 기존 다섯 경로, 원본 보존 및 임시 컨테이너 제거를 확인했다. 결과는 계속 PARTIAL: .runtime/verification/remote-postgresql-helper-20261007T084328Z/result.json. namespace 생성 가능한 승인된 검증 환경의 실제 검수·적용·복구 수용은 여전히 미완료다.
