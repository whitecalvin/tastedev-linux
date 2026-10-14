import {savePendingAdminJobProgress} from './admin-job-record.ts';
// Capture running snapshots at arrival, then serialize atomic writes. Completion
// must await finish() so a delayed progress write cannot follow publication.
export function adminJobProgressWriter(folder: string,save: (folder: string,record: unknown)=>Promise<unknown> | unknown=savePendingAdminJobProgress){
 let queue: Promise<unknown>=Promise.resolve(),failed=false,closed=false;
 return {
  write(record: unknown){if(closed)throw Error('관리 작업 진행 기록이 종료되었습니다.');const snapshot=structuredClone(record);queue=queue.then(()=>save(folder,snapshot)).catch(()=>{failed=true;});},
  async finish(){closed=true;await queue;return {failed};},
 };
}
