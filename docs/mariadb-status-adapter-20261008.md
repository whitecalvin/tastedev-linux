# MariaDB 상태 조회 검수 환경 보완 — 2026-10-08

직전 원래 GUI 정상 적용/복원 실행에서 헤더는 확인 전이었다. 제품 lib/operations.mjs는 systemctl show 서비스명 뒤에 property/no-pager 옵션을 전달한다. 전용 검수 어댑터가 마지막 인수만 mariadb.service로 허용했기 때문에 해당 조회를 거부했다. 제품 상태 조회 오류로 확정하거나 제품 코드를 변경하지 않았다.

검수 어댑터는 인수 위치에 관계없이 mariadb.service가 정확히 한 번 있을 때 그 대상만 전용 unit으로 치환한다. 다른 service/timer/socket/target, 중복 대상, 허용 외 명령은 거부한다. 실제 생성되는 어댑터를 AST로 추출하여 옵션 순서·기존 helper MainPID/restart·다른 서비스/stop 거부 3개 검사 통과.

새 --status 실행은 원래 IDE의 동일 show 인수로 실제 103 전용 systemd MariaDB 10.11.14의 active/running/loaded를 확인했고 MainPID의 /proc exe도 실제 mariadbd와 일치했다. 6개 native 검사 통과. 전용 unit 종료, host 설정/설치 helper 보존, private 전송물/DB 정리 완료.

증거 `.runtime/verification/mariadb-helper-remote-20261008T100111Z/result.json`. 이 후속은 네이티브 상태 조회이며 새 브라우저 헤더 표시 검사가 아니다. 직전 GUI 적용/복원 증거는 유지되며 새로운 전체 GUI 실행은 반복하지 않았다.
