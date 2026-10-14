import type {DataContextDependencies} from './postgresql-data-context.ts';
import {hasErrorCode} from './error-code.ts';
import {mkdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {preparePostgresqlDataRequest,inspectPostgresqlDataContext,postgresqlDataExecutorContext} from './postgresql-data-context.ts';
import {createPostgresqlDataBackup,listPostgresqlDataBackups,planPostgresqlDataRestore,restorePostgresqlDataBackup} from './postgresql-data-backup.ts';
export async function postgresqlDataOperation(action:unknown,input:unknown,{base='/var/lib/linux/admin/postgresql-data',dependencies}:{base?:string;dependencies?:DataContextDependencies}={}){
 const request=preparePostgresqlDataRequest(action,input);
 // Helper verifies parent paths and holds its kernel lease before calling this.
 await mkdir(base,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});
 const stat=await lstat(base);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o077))throw Error('데이터 백업 저장 경로 권한을 확인하세요.');
 const root=base+'/'+createHash('sha256').update(request.path).digest('hex');await mkdir(root,{mode:0o700}).catch(error=>{if(!hasErrorCode(error,'EEXIST'))throw error;});
 if(action==='context'){const review=await inspectPostgresqlDataContext(request.path,dependencies);return {path:review.path,reviewVersion:review.reviewVersion,databases:review.databases,pid:review.service.pid};}
 if(action==='backups')return listPostgresqlDataBackups(root);
 const {context,assertCurrent}=await postgresqlDataExecutorContext(request,dependencies),options={root,context,assertCurrent};
 if(action==='backup')return {backup:await createPostgresqlDataBackup(options)};
 const plan=await planPostgresqlDataRestore({...options,id:request.id});
 if(action==='plan'){const {contextKey,...publicPlan}=plan;return publicPlan;}
 if(request.sha256!==plan.sha256||request.bytes!==plan.bytes)throw Object.assign(Error('데이터 백업을 다시 검토하세요.'),{status:409});
 return restorePostgresqlDataBackup({...options,plan,confirmation:request.confirmation});
}
