// Only synthetic logs are sent; never print credentials or raw provider errors.
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {verificationWorkDirectory} from './work-directory.ts';
if(!process.argv.includes('--confirm-synthetic-input'))throw Error('합성 로그 전송 검수는 --confirm-synthetic-input을 명시한 경우에만 실행합니다.');
const {analyzeLog}=await import('../../lib/ai-analysis.ts');
const startedAt=new Date().toISOString();
const evidence=await verificationWorkDirectory('ai-live-korean-');
type CommonResult={startedAt:string;syntheticInputOnly:true;hostCommandsExecuted:false};
type Result=CommonResult & ({status:'PASS'|'FAIL';model:string;koreanResponse:boolean;incomplete:boolean;at:string;analysis:string}|{status:'FAIL';message:string;httpStatus:number|null;providerStatus:number|null;providerCode:string|null});
function statusField(error:unknown,key:string):number|null{if(error===null||typeof error!=='object'||!(key in error))return null;const value:unknown=Object.getOwnPropertyDescriptor(error,key)?.value;return typeof value==='number'&&Number.isInteger(value)&&value>=400&&value<=599?value:null;}
let result:Result;
try {
 const response=await analyzeLog({source:'nginx verification fixture',text:'Synthetic example: nginx: [emerg] open() "/var/log/nginx/example-error.log" failed (13: Permission denied). No commands were executed.',confirm:true});
 const korean=/[가-힣]/u.test(response.analysis);
 result={status:korean&&!response.incomplete?'PASS':'FAIL',model:response.model,koreanResponse:korean,incomplete:response.incomplete,syntheticInputOnly:true,hostCommandsExecuted:false,at:response.at,analysis:response.analysis,startedAt};
} catch(error) {
 const httpStatus=statusField(error,'status'),providerStatus=statusField(error,'providerStatus');
 const code:unknown=error!==null&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'providerCode')?.value:undefined;
 result={status:'FAIL',message:'AI 검사 실행에 실패했습니다. 저장된 업체·모델 설정과 사용 한도를 확인하세요.',httpStatus,providerStatus,providerCode:code==='insufficient_quota'||code==='rate_limit_exceeded'?code:null,syntheticInputOnly:true,hostCommandsExecuted:false,startedAt};
}
const resultFile=join(evidence,'result.json');await writeFile(resultFile,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
const summary={...result,analysis:undefined};console.log(JSON.stringify({...summary,evidence:resultFile}));process.exitCode=result.status==='PASS'?0:1;
