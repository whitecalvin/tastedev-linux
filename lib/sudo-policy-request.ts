import type {SudoAccount} from './sudo-policy.ts';
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {sudoPolicyPlan} from './sudo-policy.ts';
export function prepareSudoPolicyUpdate(input: unknown,account: SudoAccount){
 if(!object(input)||input.confirm!==true||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||Object.keys(input).some(key=>!['confirm','version','passwordless','actions'].includes(key)))throw Object.assign(Error('sudo 권한 규칙 변경을 다시 확인하세요.'),{status:400});
 const plan=sudoPolicyPlan({passwordless:input.passwordless,actions:input.actions},account);
 return {confirm:true,version:input.version,passwordless:plan.passwordless,actions:plan.actions};
}
