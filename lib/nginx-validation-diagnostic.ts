export type NginxValidationCategory='missing'|'output-limit'|'timeout'|'permission'|'invalid-config'|'unavailable';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// Native stderr is classified internally; paths, configuration and process environment are not returned.
export function nginxValidationDiagnostic(input:unknown):{category:NginxValidationCategory;reason:string}{
 const error=object(input)?input:{};
 const stderr=typeof error?.stderr==='string'?error.stderr.slice(0,16384):'';
 if(error?.code==='ENOENT')return {category:'missing',reason:'nginx 실행 파일이 없습니다. nginx 설치 상태를 확인하세요.'};
 if(error?.code==='ERR_CHILD_PROCESS_STDIO_MAXBUFFER')return {category:'output-limit',reason:'nginx 검사 출력 한도를 초과했습니다. 서버에서 설정 오류를 확인하세요.'};
 if(error?.killed&&error?.signal==='SIGTERM')return {category:'timeout',reason:'nginx 문법 검사 시간이 초과되었습니다. 서버 상태를 확인한 뒤 다시 검사하세요.'};
 if(['EACCES','EPERM'].includes(typeof error.code==='string'?error.code:'')||/permission denied|operation not permitted/i.test(stderr))return {category:'permission',reason:'nginx 검사 권한이 부족합니다. 앱 실행 계정의 파일·소켓 접근 권한을 확인하세요.'};
 if(/unknown directive|invalid (?:number of arguments|parameter|value)|unexpected|directive is not allowed|duplicate .*directive/i.test(stderr))return {category:'invalid-config',reason:'nginx 설정 구문이 올바르지 않습니다. 설정 항목과 값을 검토하세요.'};
 return {category:'unavailable',reason:'nginx 문법 검사를 완료하지 못했습니다. 서버의 nginx 실행 상태와 설정을 확인하세요.'};
}
