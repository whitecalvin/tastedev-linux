// Return only fixed messages; never echo native output, account URLs, or secrets.
export function certificateFailureMessage(error: unknown): string | null{
 const text=error!==null&&typeof error==='object'&&'message' in error&&typeof error.message==='string'?error.message:'';
 if(/authorization must be pending/i.test(text))return 'ACME 인증 상태가 갱신 요청과 일치하지 않습니다. 해당 요청의 주문·인증 상태 로그를 확인하세요. 기존 인증서를 삭제하지 말고, 필요하면 별도 임시 staging 계정으로 인증 재사용 여부를 검수하세요.';
 if(/urn:ietf:params:acme:error:rateLimited\b/.test(text))return 'ACME 서버의 요청 한도에 도달했습니다. Certbot 로그의 재시도 가능 시각을 확인하고 자동 반복 요청을 멈추세요.';
 if(/urn:ietf:params:acme:error:dns\b/.test(text))return 'ACME DNS 검증에 실패했습니다. Certbot 로그에 표시된 도메인의 DNS 응답과 A·AAAA 레코드를 확인하세요.';
 if(/urn:ietf:params:acme:error:connection\b/.test(text))return 'ACME 서버가 검증 주소에 연결하지 못했습니다. 해당 도메인의 DNS, HTTP 80 포트 접근과 nginx 응답을 확인하세요.';
 return null;
}
