import {helperKoreanMessage} from './helper-korean-message.ts';
import {StringDecoder} from 'node:string_decoder';
import {helperActions} from './helper-actions.ts';
// Accept one bounded envelope only from the already verified helper transport.
export function helperErrorFromStderr(action: string,stderr: unknown){
 if(!helperActions.includes(action)||typeof stderr!=='string'||Buffer.byteLength(stderr)>4096)return null;
 let record: Record<string,unknown> | null;try{const value: unknown=JSON.parse(stderr.trim());record=value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}catch{return null;}
 if(!record||Array.isArray(record)||typeof record!=='object'||Object.keys(record).sort().join(',')!=='action,message,protocol,status'||record.protocol!=='tastedev-helper-error-v1'||record.action!==action||typeof record.status!=='number'||![400,403,404,409,422,500,503].includes(record.status)||typeof record.message!=='string'||!record.message||Buffer.byteLength(record.message)>2000||/[\0\r\n]/.test(record.message))return null;
 return Object.assign(Error(helperKoreanMessage(record.message)),{status:record.status});
}
export function helperErrorCollector(){
 const decoder=new StringDecoder('utf8');let bytes=0,text='';
 return {write(chunk: Buffer){bytes+=Buffer.byteLength(chunk);if(bytes>4096)throw Object.assign(Error('관리 응답 크기가 너무 큽니다.'),{status:502});text+=decoder.write(chunk);},finish(){text+=decoder.end();return text;}};
}
