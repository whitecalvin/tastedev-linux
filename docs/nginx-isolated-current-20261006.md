# 현재 helper의 격리 nginx 확인

현재 scripts/admin/linux-admin을 복사한 별도 user/PID/network namespace에서 실제 nginx 프로세스를 실행했다. sudo와 운영 systemd, 호스트 nginx 설정은 변경하지 않았다.

8개 시나리오 완료: 관리 사이트 적용·검수·재로드, 버전 지정 수정, 백업 복원·검수·재로드, 비활성/활성, 구문 오류 시 이전 파일 복구, TLS 인증서와 리다이렉트 유지 수정, 오래된 버전 거부, 재로드 실패 시 이전 파일 복구. 인증서는 임시 자체서명 인증서이다.

시험 스크립트의 /usr·/usr/bin과 node/flock 복사본을 namespace 안에서 root 소유로 제공하도록 수정했다. helper의 root 소유권 검사는 그대로 유지한다. host /usr/lib와 /usr/sbin은 읽기 전용이다.

증거: .runtime/verification/nginx-isolated-2026-10-05T19-50-31.640Z/result.json

helper SHA-256: 776113cf5425f76d548a38971b1fddb4d9f2ccbe22ba27cf46049f6bee6fd640
nginx SHA-256: 94eb839f1cdc7f3f42062d352b504fe406e2f888d83b554af7ea25bcdc9506f5

범위는 기존 관리 사이트 helper 작업(nginx-apply/restore/toggle)이다. GUI의 임의 설정 파일 검토 적용(nginx-config-apply), systemd 제어, 실제 Certbot 발급 및 전체 설치 환경 완료를 증명하지 않는다.
