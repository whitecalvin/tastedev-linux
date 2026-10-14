import type {AuditEvent} from '../components/console-types';
type AuditFilter={text?:string;result?:string;from?:string;to?:string;locale?:string;resultLabel?:(result:string)=>string};
import {matchesLocalizedText} from './i18n-core.ts';
export const auditResults=Object.freeze(['requested','completed','failed','blocked','saved','rolled-back','recovery-required','unchanged','invalid','recovered','cancelled','scheduled']);
export function filterAuditEvents<T extends AuditEvent>(events:readonly T[],{text='',result='',from='',to='',locale='ko',resultLabel=auditResultLabel}:AuditFilter={}){
 const start=from?Date.parse(from+'T00:00:00Z'):null,end=to?Date.parse(to+'T23:59:59.999Z'):null;
 return events.filter(event=>{
  const time=Date.parse(event.at);
  return (!result||event.result===result)&&matchesLocalizedText(locale,`${event.at} ${event.action} ${event.result} ${auditResultLabel(event.result)} ${resultLabel(event.result)}`,text)&&(!from||Number.isFinite(start)&&start!==null&&time>=start)&&(!to||Number.isFinite(end)&&end!==null&&time<=end);
 });
}
export function auditExport(events:readonly AuditEvent[]){return JSON.stringify({exportedAt:new Date().toISOString(),scope:'selected records from the currently displayed bounded audit page',events},null,2)+'\n';}

export function auditResultLabel(result:string):string{return ({requested:'요청',completed:'완료',failed:'실패',blocked:'차단',saved:'저장',
 'rolled-back':'변경 복원','recovery-required':'복구 필요',unchanged:'변경 없음',
 invalid:'검수 실패',recovered:'복구 완료',cancelled:'취소',scheduled:'재시작 예약'} as Record<string,string>)[result]||result;}
