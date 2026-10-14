import type {NodeEnvironmentValues} from './node-env.ts';
import {requireNodeEnvSaved} from './node-env-outcome.ts';
import {readCode,replaceWorkspaceEnv,validateFile} from './workspace.ts';
import {parseNodeEnv} from './node-env.ts';
import {patchNodeEnv} from './node-env-patch.ts';
const fail: (message: string,status?: number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
function target(name: unknown){const safeName=validateFile(name);if(!/\.env(?:\.[A-Za-z0-9_-]+)?$/.test(safeName))fail('작업 폴더의 환경 파일을 선택하세요.');return safeName;}
export async function nodeEnvSnapshot(name: unknown){const record=await readCode(target(name));return {name:record.name,version:record.version,...parseNodeEnv(record.text)};}
export async function updateNodeEnv(input: {id?: unknown;backupId?: unknown;name?: unknown;confirm?: unknown;version?: unknown;registryVersion?: unknown;backupVersion?: unknown;changes?: unknown}){
 if(input?.confirm!==true)fail('환경 파일 변경 확인이 필요합니다.');if(typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version))fail('환경 파일을 다시 조회하세요.');
 const record=await readCode(target(input.name));if(record.version!==input.version)fail('환경 파일이 변경되었습니다. 다시 조회하세요.',409);
 let values: NodeEnvironmentValues|undefined,result;try{result=await replaceWorkspaceEnv(record.name,input.version,text=>{const patched=patchNodeEnv(text,input.changes);values=parseNodeEnv(patched).values;return patched;});}catch(error){if(error!==null&&typeof error==='object'&&'backupId' in error&&error.backupId)requireNodeEnvSaved({failed:true,backupId:error.backupId});throw error;}
 return requireNodeEnvSaved({name:record.name,saved:!result.failed,...result,values});
}
