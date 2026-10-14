# 등록 Node.js 앱 환경 파일 GUI

현재 빌드 `/tmp/tastedev-current-build-H8CwJs`의 실제 브라우저에서 Node.js 도구 진입 → 등록 앱 선택 → 환경 파일 조회 → 앱 포트 3000에서 3100으로 편집 → 확인 및 저장 → 백업 조회 → 복구 비교 → 전체 파일 복구 확인 → 실행을 확인했다. 복원 뒤 화면 값은 3000이고 백업 목록은 2개다.

종료 검사에서 앱 환경 파일이 원본과 정확히 일치하고 앱 코드 파일도 변경되지 않았음을 확인했다. 앱 실행과 systemd 서비스 제어는 수행하지 않았다. 소유 UID 1000의 실제 Next.js/API 및 파일 저장 코드가 쓰기를 수행했다.

배포용 Node.js/npm은 개발 장비에 없어 설치 목록에만 fixture adapter를 사용했다. 설치 상태 자체의 수용 증거는 아니다. 호스트 전체는 읽기 전용 bind이고 임시 fixture만 쓰기를 허용했다. tmpfs `/tmp`는 UID 1000, 0755다. 운영 파일 소유권 검사 또는 정책을 완화하지 않았다.

최초 namespace에서는 root 소유 `/tmp`가 unmapped UID로 보였기 때문에 설정 journal 안전성 검사가 저장을 차단했다. 해당 FAIL 결과는 `.runtime/verification/node-app-gui-2026-10-06T00-14-47.173Z/result.json`에 보존했다. 서버 wrapper 종료 뒤 남은 자체 Next.js PID는 확인 후 종료했다. 검증 스크립트의 process group 종료와 10초 정리 제한을 보완했다.

수정된 fixture의 최종 증거: `.runtime/verification/node-app-gui-2026-10-06T00-18-12.550Z/result.json`.
화면 증거: `/tmp/tastedev-node-app-env-restored-20261006.png`.

자체 생성 탭·임시 서버·계정·폴더는 정리했다. 실제 설치 서비스/전체 GUI 수용 검사나 최종 배포 완료를 의미하지 않는다. DEB 검증은 실행하지 않았다.
