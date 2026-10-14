# 승인 후 한국어 개발 후속

사용자가 helper 변경·기존 AI 키 사용·192.168.0.103 격리 이미지 전송을 승인했다.

helper 원본을 scripts/admin/linux-admin으로 변경했다. 파일 내용은 그대로이며 SHA-256은 7e56e102026db05e89a76bc87296fedebc9f92d724a020dc12ad2e4174e13bd6이다.

현재 회귀는 1297개 중 1294개 통과·실패 0·건너뜀 3개다. 다국어 설명 검사 두 파일은 한국어 개발 후로 미뤘다. 건너뛴 보안 검사와 AI 오류 구분 후속은 올바른 자체 격리 상태에서 54개 통과·실패 0·건너뜀 0으로 확인했다. 집합이 중복되므로 합산하지 않는다. 제한 실행의 followup.json은 하위 검사가 아닌 파일 종료만 확인했으므로 수용 증거가 아니다. 증거: .runtime/verification/approved-followup-20261007/result.json, test.log, followup-native.json, followup-native.log.

AI 로그 source 이름에도 비밀값 가림을 적용하고 null 입력은 한국어 400 오류로 반환한다. 알려진 공급자 오류 코드는 사용 한도 부족과 일시적 요청 제한을 구분하며 원시 메시지는 반환하지 않는다. 기존 키로 합성 nginx 오류만 두 번 분석 요청했지만 HTTP 429로 실패했다. providerCode는 null이므로 크레딧 부족 또는 일시적 제한으로 단정하지 않는다. 실제 한국어 분석 응답 수용은 미완료다. 서버 AI 설정은 변경하지 않았다. 증거: .runtime/verification/ai-live-korean-20261007/result.json.

원격 첫 빌드는 기존 Docker 빌더가 COPY --chmod를 지원하지 않아 실패했다. COPY 후 chmod로 바꾼 재시도에서 141개 runtime 모듈과 현재 helper의 격리 이미지가 생성됐다. 이미지 ID sha256:3a84f7c8110bbf7a1a55afcac2623be43ed0c48f912a02ff10b8607e6452aac3. env·키·인증 DB·사용자 파일은 전송하지 않았다. 초기 실패 로그도 보존했다. 증거: .runtime/verification/remote-postgresql-image-20261007T083213Z/result.json. 이미지 준비만 증명하며 실제 helper 실행·적용·실패 복구·GUI 수용은 남아 있다. 호스트 서비스 변경 및 DEB 검증은 실행하지 않았다.
