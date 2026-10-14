# 현재 사용자 cron 백업 공개 (2026-10-06)

기존 최종 파일 직접 쓰기 대신 임시 `.pending` 파일을 배타적으로 만들고 완성된 내용을 기록·fsync·close한 뒤 최종 이름으로 rename한다. 공개 후 디렉터리도 동기화한다. 읽기 검증과 같은 입력 크기 제한을 저장 전에 적용하여 저장해도 읽을 수 없는 큰 백업 생성을 차단한다. 정상 실패에서는 자체 임시 파일을 정리한다.

동시 한글 백업 12개 기록 및 목록/내용/해시 확인, 중단된 pending 파일 제외, 큰 입력 무공개, 기존 손상/심볼릭 링크 제외 및 화면 회귀를 포함한 12개 검사 통과. 자체 소스 복사본에 파일 sync 직후 checkpoint를 넣고 실제 publisher를 SIGKILL하여 최종 백업 파일이 공개되지 않음을 확인했다. 원본 운영 코드에는 checkpoint를 넣지 않았다. 최초 fixture 문자열 escaping 오류는 고친 후 재확인했다.

증거: `.runtime/verification/local-backup-publication-20261006/result.json`. 실제 crontab·서비스·sudo 정책을 변경하지 않았으며 자체 fixture를 정리했다. 전원 장애나 모든 파일 시스템의 crash durability를 검증한 것으로 확대하지 않는다. 이전 Next.js 빌드와 HTTP 증거는 이 변경 이전 결과다. 사용자 담당 이름 변경 경로의 전체 검사 실패는 별도 유지한다.
