import path from 'node:path';
import {readPostgresqlGraphSwapProgress,postgresqlGraphSwapProgressContext} from './postgresql-graph-swap-progress.ts';
import {retainPostgresqlGraphRestoreJournal} from './postgresql-graph-restore-journal.ts';
import {acquireConfigOperationLease} from './config-operation-lease.ts';
export async function completePostgresqlGraphRestore(journal:unknown,backupRoot:string){
 const progress=await readPostgresqlGraphSwapProgress(journal,backupRoot);
 const context=postgresqlGraphSwapProgressContext(progress);
 const release=await acquireConfigOperationLease(path.join(context.root,context.journalId+'.lock'));
 try{return await retainPostgresqlGraphRestoreJournal(journal,backupRoot,progress);}finally{await release();}
}
