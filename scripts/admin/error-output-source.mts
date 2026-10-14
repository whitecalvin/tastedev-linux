import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {readRuntimeModule} from '../runtime-source.ts';

const begin='// BEGIN TYPESCRIPT HELPER ERROR OUTPUT\n',end='// END TYPESCRIPT HELPER ERROR OUTPUT\n';
export async function adminErrorOutputSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-error-output.mjs';
 const source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 assert.equal(source.split('export function helperErrorOutput(').length,2,'Unexpected helper error compiler output');
 return begin+source.replace(/export function helperErrorOutput\(/,'function helperErrorOutput(')+end;
}
export async function assertAdminErrorOutputCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(begin),finish=helper.indexOf(end,start);
 assert(start>=0&&finish>start&&helper.indexOf(begin,start+1)<0&&helper.indexOf(end,finish+1)<0,'Missing or ambiguous typed helper error source');
 assert.equal(helper.slice(start,finish+end.length),await adminErrorOutputSource(project),'Root helper error output differs from the TypeScript source');
}

const configBegin='// BEGIN TYPESCRIPT HELPER NGINX CONFIG\n',configEnd='// END TYPESCRIPT HELPER NGINX CONFIG\n';
export async function adminNginxConfigSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-nginx-config.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['hash','domain','port','config','updateConfig']){
  const signature='export function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper config compiler output: '+fn);
  source=source.replace(signature,'function '+fn+'(');
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper config must be standalone');
 return configBegin+source+configEnd;
}
export async function assertAdminNginxConfigCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(configBegin),finish=helper.indexOf(configEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(configBegin,start+1)<0&&helper.indexOf(configEnd,finish+1)<0,'Missing or ambiguous typed helper config source');
 assert.equal(helper.slice(start,finish+configEnd.length),await adminNginxConfigSource(project),'Root helper nginx config differs from the TypeScript source');
}

const filesBegin='// BEGIN TYPESCRIPT HELPER NGINX FILES\n',filesEnd='// END TYPESCRIPT HELPER NGINX FILES\n';
export async function adminNginxFilesSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-nginx-files.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['rootDir','target','current','writeConfig','backup','record']){
  const signature='export function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper file compiler output: '+fn);
  source=source.replace(signature,'function '+fn+'(');
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper file code must be standalone');
 return filesBegin+source+filesEnd;
}
export async function assertAdminNginxFilesCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(filesBegin),finish=helper.indexOf(filesEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(filesBegin,start+1)<0&&helper.indexOf(filesEnd,finish+1)<0,'Missing or ambiguous typed helper file source');
 assert.equal(helper.slice(start,finish+filesEnd.length),await adminNginxFilesSource(project),'Root helper nginx file code differs from the TypeScript source');
}

const pgFilesBegin='// BEGIN TYPESCRIPT HELPER POSTGRESQL FILES\n',pgFilesEnd='// END TYPESCRIPT HELPER POSTGRESQL FILES\n';
export async function adminPostgresqlFilesSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-postgresql-files.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['pgSync','pgRun','pgInput','pgOwner','pgDirectories','pgRead','pgService','pgStage','pgReplace','pgApply']){
  const signature='export function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper PostgreSQL compiler output: '+fn);
  source=source.replace(signature,'function '+fn+'(');
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper PostgreSQL code must be standalone');
 return pgFilesBegin+source+pgFilesEnd;
}
export async function assertAdminPostgresqlFilesCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(pgFilesBegin),finish=helper.indexOf(pgFilesEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(pgFilesBegin,start+1)<0&&helper.indexOf(pgFilesEnd,finish+1)<0,'Missing or ambiguous typed helper PostgreSQL source');
 assert.equal(helper.slice(start,finish+pgFilesEnd.length),await adminPostgresqlFilesSource(project),'Root helper PostgreSQL file code differs from the TypeScript source');
}

const pgBackupsBegin='// BEGIN TYPESCRIPT HELPER POSTGRESQL BACKUPS\n',pgBackupsEnd='// END TYPESCRIPT HELPER POSTGRESQL BACKUPS\n';
export async function adminPostgresqlBackupsSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-postgresql-backups.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['pgBackupRecord','pgPublicValues','pgRestorePlan','pgRestore','pgBackups']){
  const signature='export '+(fn==='pgBackups'?'async ':'')+'function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper PostgreSQL backup compiler output: '+fn);
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper PostgreSQL backup code must be standalone');
 return pgBackupsBegin+source+pgBackupsEnd;
}
export async function assertAdminPostgresqlBackupsCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(pgBackupsBegin),finish=helper.indexOf(pgBackupsEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(pgBackupsBegin,start+1)<0&&helper.indexOf(pgBackupsEnd,finish+1)<0,'Missing or ambiguous typed helper PostgreSQL backup source');
 assert.equal(helper.slice(start,finish+pgBackupsEnd.length),await adminPostgresqlBackupsSource(project),'Root helper PostgreSQL backup code differs from the TypeScript source');
}

const databaseBackupsBegin='// BEGIN TYPESCRIPT HELPER DATABASE BACKUPS\n',databaseBackupsEnd='// END TYPESCRIPT HELPER DATABASE BACKUPS\n';
export async function adminDatabaseBackupsSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-database-backups.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['mariaBackupRoot','redisBackupRoot','mariaBackupRecord','mariaBackups']){
  const signature='export function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper database backup compiler output: '+fn);
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper database backup code must be standalone');
 return databaseBackupsBegin+source+databaseBackupsEnd;
}
export async function assertAdminDatabaseBackupsCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(databaseBackupsBegin),finish=helper.indexOf(databaseBackupsEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(databaseBackupsBegin,start+1)<0&&helper.indexOf(databaseBackupsEnd,finish+1)<0,'Missing or ambiguous typed helper database backup source');
 assert.equal(helper.slice(start,finish+databaseBackupsEnd.length),await adminDatabaseBackupsSource(project),'Root helper database backup code differs from the TypeScript source');
}

const nativeBegin='// BEGIN TYPESCRIPT HELPER NATIVE EXEC\n',nativeEnd='// END TYPESCRIPT HELPER NATIVE EXEC\n';
export async function adminNativeExecSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-native-exec.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['execFileSync','run']){
  const signature='export function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper native compiler output: '+fn);
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper native code must be standalone');
 return nativeBegin+source+nativeEnd;
}
export async function assertAdminNativeExecCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(nativeBegin),finish=helper.indexOf(nativeEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(nativeBegin,start+1)<0&&helper.indexOf(nativeEnd,finish+1)<0,'Missing or ambiguous typed helper native source');
 assert.equal(helper.slice(start,finish+nativeEnd.length),await adminNativeExecSource(project),'Root helper native code differs from the TypeScript source');
}

const runtimeBegin='// BEGIN TYPESCRIPT HELPER RUNTIME\n',runtimeEnd='// END TYPESCRIPT HELPER RUNTIME\n';
export async function adminHelperRuntimeSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-runtime.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const signature of ['export const mariaModules','export async function mariaRuntime(']){
  assert.equal(source.split(signature).length,2,'Unexpected helper runtime compiler output');
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper runtime must have no static module imports');
 return runtimeBegin+source+runtimeEnd;
}
export async function assertAdminHelperRuntimeCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(runtimeBegin),finish=helper.indexOf(runtimeEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(runtimeBegin,start+1)<0&&helper.indexOf(runtimeEnd,finish+1)<0,'Missing or ambiguous typed helper runtime source');
 assert.equal(helper.slice(start,finish+runtimeEnd.length),await adminHelperRuntimeSource(project),'Root helper runtime differs from the TypeScript source');
}

const serviceBegin='// BEGIN TYPESCRIPT HELPER SERVICE OPERATIONS\n',serviceEnd='// END TYPESCRIPT HELPER SERVICE OPERATIONS\n';
export async function adminServiceOperationsSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-service-operations.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const fn of ['mariaInspect','mariaServiceSnapshot','mariaApply','mariaRestore','mariaRestorePlan','redisRestorePlan','nginxMutationStateGuard']){
  const async=!['mariaServiceSnapshot','nginxMutationStateGuard'].includes(fn);
  const signature='export '+(async?'async ':'')+'function '+fn+'(';
  assert.equal(source.split(signature).length,2,'Unexpected helper service compiler output: '+fn);
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper service code must be standalone');
 return serviceBegin+source+serviceEnd;
}
export async function assertAdminServiceOperationsCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(serviceBegin),finish=helper.indexOf(serviceEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(serviceBegin,start+1)<0&&helper.indexOf(serviceEnd,finish+1)<0,'Missing or ambiguous typed helper service source');
 assert.equal(helper.slice(start,finish+serviceEnd.length),await adminServiceOperationsSource(project),'Root helper service code differs from the TypeScript source');
}

const lockBegin='// BEGIN TYPESCRIPT HELPER LOCK MAIN\n',lockEnd='// END TYPESCRIPT HELPER LOCK MAIN\n';
export async function adminLockMainSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-lock-main.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const signature of ['export const ADMIN_LOCK_MARKER','export function adminLockIdentity(','export function adminLockFile(','export function acquireAdminLock(','export async function runNativeLockSupervisor(','export async function main(']){
  assert.equal(source.split(signature).length,2,'Unexpected helper lock compiler output');
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper lock code must be standalone');
 return lockBegin+source+lockEnd;
}
export async function assertAdminLockMainCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(lockBegin),finish=helper.indexOf(lockEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(lockBegin,start+1)<0&&helper.indexOf(lockEnd,finish+1)<0,'Missing or ambiguous typed helper lock source');
 assert.equal(helper.slice(start,finish+lockEnd.length),await adminLockMainSource(project),'Root helper lock code differs from the TypeScript source');
}

const dispatchBegin='// BEGIN TYPESCRIPT HELPER DISPATCH\n',dispatchEnd='// END TYPESCRIPT HELPER DISPATCH\n';
export async function adminDispatchSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-dispatch.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 for(const signature of ['export function apply(','export function dispatch(']){
  assert.equal(source.split(signature).length,2,'Unexpected helper dispatch compiler output');
  source=source.replace(signature,signature.slice(7));
 }
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper dispatch code must be standalone');
 return dispatchBegin+source+dispatchEnd;
}
export async function assertAdminDispatchCurrent(project=process.cwd()):Promise<void>{
 const helper=await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8');
 const start=helper.indexOf(dispatchBegin),finish=helper.indexOf(dispatchEnd,start);
 assert(start>=0&&finish>start&&helper.indexOf(dispatchBegin,start+1)<0&&helper.indexOf(dispatchEnd,finish+1)<0,'Missing or ambiguous typed helper dispatch source');
 assert.equal(helper.slice(start,finish+dispatchEnd.length),await adminDispatchSource(project),'Root helper dispatch code differs from the TypeScript source');
}

const bootstrapBegin='// BEGIN TYPESCRIPT HELPER BOOTSTRAP\n',bootstrapEnd='// END TYPESCRIPT HELPER BOOTSTRAP\n';
export async function adminBootstrapSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-bootstrap.mjs';
 let source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 assert.equal((source.match(/^export /gm)??[]).length,10,'Unexpected helper bootstrap compiler output');
 source=source.replace(/^export /gm,'');
 assert(!/\b(?:export|import)\s/.test(source),'Embedded helper bootstrap code must be standalone');
 return bootstrapBegin+source+bootstrapEnd;
}
export async function adminEntrypointSource(project=process.cwd()):Promise<string>{
 const name='scripts/admin/helper-entrypoint.mjs';
 const source=(await readRuntimeModule(name,[name],project)).toString('utf8');
 assert(source.startsWith('main().catch(')&&!/\b(?:export|import)\s/.test(source),'Unexpected helper entrypoint compiler output');
 return '// BEGIN TYPESCRIPT HELPER ENTRYPOINT\n'+source+'// END TYPESCRIPT HELPER ENTRYPOINT\n';
}
export const adminHelperSourceModules:readonly string[]=['helper-bootstrap','helper-native-exec','helper-error-output','helper-nginx-config','helper-nginx-files','helper-postgresql-files','helper-postgresql-backups','helper-database-backups','helper-runtime','helper-service-operations','helper-dispatch','helper-lock-main','helper-entrypoint'];
export async function adminHelperSource(project=process.cwd()):Promise<string>{
 let source="#!/usr/bin/node\n// Generated from checked TypeScript helper sources.\n// Install root-owned 0755; never execute a writable checkout through sudo.\n'use strict';\n";
 for(const compile of [adminBootstrapSource,adminNativeExecSource,adminErrorOutputSource,adminNginxConfigSource,adminNginxFilesSource,adminPostgresqlFilesSource,adminPostgresqlBackupsSource,adminDatabaseBackupsSource,adminHelperRuntimeSource,adminServiceOperationsSource,adminDispatchSource,adminLockMainSource,adminEntrypointSource])source+=await compile(project);
 return source;
}
export async function assertAdminHelperCurrent(project=process.cwd()):Promise<void>{
 assert.equal(await readFile(path.join(project,'scripts/admin/linux-admin'),'utf8'),await adminHelperSource(project),'Root helper differs from its complete TypeScript sources');
}
