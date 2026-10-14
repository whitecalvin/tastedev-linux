const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {readLiveConfig} from './config-live.ts';
import {securitySettings} from './security.ts';
import {runHelper} from './privilege.ts';
// Authentication is enforced by the API handler before this reader is called.
export async function configSource(kind: unknown,target: unknown,{readSource=readLiveConfig,readPolicy=securitySettings,helper=runHelper}={}){
 try{return await readSource(kind,target);}catch(error){
  const redis=kind==='redis'&&target==='/etc/redis/redis.conf';
  const hba=kind==='postgresql'&&/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/pg_hba\.conf$/.test(typeof target==='string'?target:'');
  if((!redis&&!hba)||(!object(error)||(error.status!==403&&error.code!=='EACCES')))throw error;
  const policy=await readPolicy();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error(redis?'Redis 설정 조회에는 sudo 비밀번호 입력 생략 옵션이 필요합니다.':'접속 규칙 조회에는 sudo 비밀번호 입력 생략 옵션이 필요합니다.'),{status:403});
  if(redis)return helper('redis-config-source',{});
  return helper('postgresql-hba-source',{path:target});
 }
}
