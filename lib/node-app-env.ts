import type {NodeEnvironmentValues} from './node-env.ts';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {nodeApps} from './node-apps.ts';
import {nodeAppFiles} from './node-app-files.ts';
import {stateRoot} from './runtime-paths.ts';
import {configTransaction} from './config-transaction.ts';
import {patchNodeEnv} from './node-env-patch.ts';
import {parseNodeEnv} from './node-env.ts';
import {requireNodeEnvSaved} from './node-env-outcome.ts';
const fail: (message: string,status?: number)=>never=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export async function nodeAppEnvSnapshot(id: unknown){
 const registry=await nodeApps(),app=registry.apps.find(item=>item.id===id);if(!app)fail('등록한 앱을 선택하세요.',404);
 const inspected=await nodeAppFiles(id);if(inspected.registryVersion!==registry.version)fail('앱 목록이 변경되었습니다. 다시 조회하세요.',409);
 const file=inspected.files.find(item=>item.name===app.environmentFile);if(inspected.directoryStatus!=='ready'||file?.status!=='ready'||typeof file.version!=='string'||!file.values||typeof file.skipped!=='number')fail('등록 앱의 환경 파일 상태를 확인하세요.',403);
 return {id:app.id,name:app.environmentFile,directory:app.directory,registryVersion:registry.version,version:file.version,values:file.values,skipped:file.skipped};
}
export async function updateNodeAppEnv(input: {id?: unknown;backupId?: unknown;name?: unknown;confirm?: unknown;version?: unknown;registryVersion?: unknown;backupVersion?: unknown;changes?: unknown}){
 if(process.getuid?.()===0)fail('환경 파일 편집은 일반 사용자 권한으로 실행하세요.',403);
 if(input?.confirm!==true)fail('환경 파일 변경 확인이 필요합니다.');
 const snapshot=await nodeAppEnvSnapshot(input.id);
 if(snapshot.version!==input.version||snapshot.registryVersion!==input.registryVersion)fail('앱 또는 환경 파일이 변경되었습니다. 다시 조회하세요.',409);
 const backupRoot=path.join(stateRoot(),'node-app-env-backups');await mkdir(backupRoot,{recursive:true,mode:0o700});let values: NodeEnvironmentValues|undefined;
 const result=await configTransaction({configurationUid:undefined,file:path.join(snapshot.directory,snapshot.name),backupRoot,version:input.version,transform:(text: string)=>{const patched=patchNodeEnv(text,input.changes);values=parseNodeEnv(patched).values;return patched;},validate:async (file: string)=>{parseNodeEnv(new TextDecoder('utf-8',{fatal:true}).decode(await readFile(file)));},beforeCommit:async()=>{const current=await nodeAppEnvSnapshot(input.id);if(current.version!==snapshot.version||current.registryVersion!==snapshot.registryVersion)fail('앱 또는 환경 파일이 변경되었습니다. 다시 조회하세요.',409);},activate:async()=>{},recover:async()=>{}});
 return requireNodeEnvSaved({...snapshot,...result,saved:!result.failed,values});
}
