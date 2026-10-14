# Redis 실제 중단 후 같은 팝업 복구

103번에서 현재 소스의 원래 Next.js 로그인·Redis IDE·인증 API·canonical helper를 전용 Redis systemd 서비스에 연결했다. 웹 화면에서 maxclients 100을 123으로 편집하고 실제 격리 후보 검수와 영향 확인 후 적용했다.

설정 파일 교체와 원본 백업·journal 생성을 확인한 뒤, 전용 재시작 어댑터의 검수 장벽에서 실제 redis-code-apply helper만 SIGKILL했다. mount namespace, 정확한 argv, PID 시작 시각을 확인했으며 supervisor는 종료하지 않았다. 자체 장벽을 해제하면서 해당 대기 재시작은 실행하지 않게 했다. 기존 Redis 서비스·호스트 helper는 변경하지 않았다.

원래 팝업에 한국어 중단 안내와 복구 조회 버튼이 나타났다. 실제 journal의 백업 ID와 현재/원본 파일 해시를 조회한 뒤, 같은 팝업의 별도 복구 확인을 사용해 실제 helper와 systemd를 통한 복구를 수행했다. 완료 표시·백업 ID가 유지됐고 이전 검수 버튼은 비활성화됐다.

원본 설정 바이트, 실제 CONFIG GET maxclients=100, 한글 AOF 값 `한글 GUI Redis 복원`, active systemd와 새 MainPID 814040, journal 삭제를 확인했다. 123이 runtime에 적용되기 전에 중단됐으므로 123 실행 성공으로 기록하지 않는다. 적용 failed와 복구 recovered 감사가 기록됐다.

백업 ID는 `06225c4c-1918-4161-bfaa-70c83ce627b6`다. Redis 패키지 버전은 `5:7.0.15-1ubuntu0.24.04.5`, 실행 바이너리 SHA-256은 `8716cd03cf5a0fcd99d0e95f9b04f7983fb134345d6e5802a7f4259af3658b6d`다. helper SHA-256은 기존 현재 helper와 동일하며, 전달한 실제 앱 소스 398개 해시를 읽어 대조했다.

결과와 interruption/recovered-native/스크린샷은 `.runtime/verification/redis-interrupted-original-gui-20261009/`에 있다. 최종 native 전체 증거는 `.runtime/verification/redis-service-identity-20261008T154549Z/result.json`이다. UTC 날짜가 한국 현지 날짜와 달라 폴더명에는 10월 8일이 표시된다.

브라우저 오류 0·로그아웃을 확인하고 자체 탭을 서버 종료 전에 닫았다. 최종 wrapper는 전용 서비스를 멈추고 임시 stage를 제거했으며 기존 설치 helper와 호스트 Redis binary 존재 상태를 보존했다. 터널과 임시 계정 파일도 정리했다. dpkg inventory만 사설 fixture이며 host apt 설치나 MariaDB/Node 중단 복구·제품 전체 완료를 증명하지 않는다.
