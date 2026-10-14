# Certbot 인증 방식과 명령 미리보기

개발 브라우저의 인증서 발급 노드에서 webroot 선택 시 웹 루트 입력과 관련 안내가 나타나고 standalone 선택 시 해당 입력이 사라지는 것을 확인했다. example.invalid 및 qa@example.invalid 검사용 값으로 명령 검토 API만 호출하여 각각 --webroot/--webroot-path, --standalone 명령을 확인했다. 인증서 발급 및 약관 동의는 실행하지 않았다.

방식 변경 시 폼의 검토 내용은 비워졌지만 코드 보기에는 이전 webroot 명령이 남아 있었다. package-config-ide의 onPreview가 빈 문자열을 무시하는 원인이었다. 현재 선택·연결에 속한 미리보기가 비워지면 Certbot 명령 기록과 대기 중인 교체 확인을 함께 해제하도록 수정했다. 다른 패키지 기록은 유지한다. 이전 연결 및 다른 인증서의 늦은 미리보기는 기존 선택·scope 검사로 거부한다.

브라우저에서 webroot 검토→standalone 변경→코드 보기 전환 후 이전 명령이 사라지고 새 검토 안내만 나타나는 것을 확인했다. 다시 검토하면 standalone 명령이 생성됐다. 검사 뒤 도메인/이메일을 비우고 기존 nginx 인증 방식으로 복원했다. 관련 기존 검사 3개가 성공했고 최종 대기 기록 해제 수정 뒤 package-config-ide 검사도 다시 성공했다.

운영 인증서·nginx 설정·서비스·보안 정책은 변경하지 않았다. 실제 ACME 발급과 갱신 성공 증거는 아니다.
