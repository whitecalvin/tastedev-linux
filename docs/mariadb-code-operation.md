# MariaDB 전체 코드 검수와 적용

도구 → 설치된 MariaDB → 설정 파일 선택 → 설정 또는 코드 보기에서 초안을 편집 → 헤더 검수 아이콘을 선택합니다. 팝업에서 main 설정을 선택하고 검수합니다. 검수 완료 후 재시작과 변경 영향을 확인해야 검토한 설정을 적용할 수 있습니다. 초안·main·연결·권한 변경은 검토를 무효화합니다.

검토는 선택 경로, 기준 파일 버전, 운영 include graph, 후보 include graph, 원문 전체에 묶습니다. 코드 변경이나 새로 포함한 참조 파일 변경은 재검토가 필요합니다. 적용도 namespace에서 후보 옵션을 다시 검수하고 기존 include graph·서비스 main을 확인합니다. 원본 private 백업 후 정확한 원문 전체를 교체하므로 주요 항목 폼 밖의 옵션도 반영합니다. 재시작 실패 시 기존 transaction이 원문 복원과 서비스 복구를 시도하고 결과와 백업 ID를 표시합니다.

API는 로그인·동일 origin·databaseChanges·sudoWithoutPrompt·helper 권한을 요구합니다. 허용된 main과 파일 경로, UTF-8 262144 byte 한도를 검사합니다. filesystem root·runner·명령을 요청으로 지정할 수 없습니다. JSON body 한도는 1.6MB이며 검토·적용 payload를 관리자 helper에서도 재검증합니다. 관리자 모듈은 checksum allowlist에 포함됩니다.

검수의 configuration/options-help 방식은 결과에 명시됩니다. 운영 데이터·TLS 파일·플러그인·계정 접근성이나 전체 기동의 성공은 후보 옵션 검수로 보장하지 않습니다. 자세한 격리 범위는 mariadb-sandbox-validation.md입니다. 터미널에는 구조화한 결과와 백업 ID만 기록하고 원문·암호·native 상세 출력을 기록하지 않습니다.

현재 장비에는 MariaDB 실행 파일이 없어 native 검수·운영 적용 및 설치 환경 GUI E2E는 미완료입니다. source fixture는 검토 변경 거부, 전체 원문 교체와 백업, 재시작 실패 복원, 참조 파일 동시 변경 거부, API 인증/권한, GUI 재검토·중복 실행·늦은 응답 폐기, 결과 로그의 비밀값 제외를 확인합니다.
