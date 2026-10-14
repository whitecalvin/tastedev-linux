export const redisSandboxUnavailableMessage='Redis 격리 검수 환경을 사용할 수 없습니다. 서버의 namespace 지원과 bubblewrap 설치 상태를 확인하세요.';
export function redisSandboxUnavailable(){return Object.assign(Error(redisSandboxUnavailableMessage),{status:503,code:'REDIS_SANDBOX_UNAVAILABLE'});}
export function isRedisSandboxUnavailable(error:unknown){return error!==null&&typeof error==='object'&&'code' in error&&error.code==='REDIS_SANDBOX_UNAVAILABLE'&&(!('status' in error)||error.status!==500);}
export function redisSandboxFailureFromStderr(action:unknown,stderr:unknown){return typeof action==='string'&&['redis-code-plan','redis-code-apply','redis-config-validate','redis-config-apply','redis-config-restore'].includes(action)&&String(stderr).trim()===redisSandboxUnavailableMessage?redisSandboxUnavailable():null;}
