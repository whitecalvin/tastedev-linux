import {certificateJobLog} from './certificate-job-log.ts';
import {isNginxEditablePath} from './nginx-config-paths.ts';
// Log metadata selects candidates only. The helper must still read the private
// backup and bind its target/version in a new restore review.
export function certificateJobBackups(logs: unknown): {id: string; path: string}[]{
 const entries=new Map<string,{id: string; path: string}>(),conflicts=new Set<string>();
 for(const line of certificateJobLog(logs).split('\n')){
  const match=/^nginx 설정 백업 · (\/etc\/nginx\/[^\r\n]+) · ([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})$/.exec(line);
  if(!match||!isNginxEditablePath(match[1]))continue;
  const [,path,id]=match;if(entries.has(id)&&entries.get(id)?.path!==path)conflicts.add(id);
  entries.set(id,{id,path});
 }
 return [...entries.values()].filter(item=>!conflicts.has(item.id)).slice(0,100);
}
