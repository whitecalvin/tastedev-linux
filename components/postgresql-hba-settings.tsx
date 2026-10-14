'use client';
import {errorMessage} from './console-types';
import type {HbaValues,HbaRule,HbaEntry,HbaPending,HbaRecord} from './file-editor-types';
import {useRef,useState} from 'react';
import {postgresqlHbaDescription} from '../lib/postgresql-hba-description.ts';
import ConfirmDialog from './ui/confirm-dialog';
import {useLanguage} from './language-provider';
import {Button,TextInput,Dropdown} from './ui/controls';
import {parsePostgresqlHba,updatePostgresqlHba,appendPostgresqlHba,removePostgresqlHba,movePostgresqlHba,hbaTypes,hbaMethods} from '../lib/postgresql-hba.ts';
const initial: HbaValues={type:'host',database:'all',user:'all',address:'127.0.0.1/32',method:'scram-sha-256',options:''};
function RuleFields({value,onChange,t}: {value: HbaValues; onChange: (value: HbaValues) => void; t: (text: string) => string}){
 const {locale}=useLanguage();
 function field(key: keyof HbaValues,control: (help: string) => React.ReactNode){const help=postgresqlHbaDescription(key,locale),specific=['type','method'].includes(key)?postgresqlHbaDescription(value[key],locale):null;const text=help.text+(specific?.text?' '+specific.text:'');return <div className="postgresql-hba-field">{control(text)}<p className="hint" lang={help.language}>{text}</p></div>;}
 return <div className="postgresql-hba-fields">
 {field('type',help=><Dropdown label={t('접속 유형')} aria-description={help} value={value.type} options={hbaTypes.map(value=>({value,label:value}))} onChange={event=>onChange({...value,type:event.target.value})}/>)}
 {field('database',help=><TextInput label={t('데이터베이스')} aria-description={help} value={value.database} onChange={event=>onChange({...value,database:event.target.value})}/>)}
 {field('user',help=><TextInput label={t('사용자')} aria-description={help} value={value.user} onChange={event=>onChange({...value,user:event.target.value})}/>)}
 {field('address',help=><TextInput label={t('주소')} aria-description={help} disabled={value.type==='local'} value={value.type==='local'?'':value.address} placeholder="127.0.0.1/32" onChange={event=>onChange({...value,address:event.target.value})}/>)}
 {field('method',help=><Dropdown label={t('인증 방식')} aria-description={help} value={value.method} options={hbaMethods.map(value=>({value,label:value}))} onChange={event=>onChange({...value,method:event.target.value})}/>)}
 {field('options',help=><TextInput label={t('인증 옵션')} aria-description={help} value={value.options} onChange={event=>onChange({...value,options:event.target.value})}/>)}
 </div>;
}
function Rule({entry,source,onChange,onPending,pending,onDelete,t}: {entry: HbaRule; source: string; onChange: (text: string,applied: boolean) => void; onPending: (value: HbaValues) => void; pending?: HbaPending; onDelete: (entry: HbaRule) => void; t: (text: string) => string}){const [value,setValue]=useState(pending?.value??entry),[error,setError]=useState('');const run=(fn: () => string,applied=false)=>{try{onChange(fn(),applied);setError('');}catch(error){setError(errorMessage(error));}};return <section className="postgresql-hba-rule"><div className="manager-actions"><strong>{entry.type} · {t('줄')} {entry.line}</strong><Button variant="secondary" title={t('위로 이동')} aria-label={t('위로 이동')} onClick={()=>run(()=>movePostgresqlHba(source,entry.line,'up'))}>↑</Button><Button variant="secondary" title={t('아래로 이동')} aria-label={t('아래로 이동')} onClick={()=>run(()=>movePostgresqlHba(source,entry.line,'down'))}>↓</Button><Button variant="secondary" onClick={()=>run(()=>updatePostgresqlHba(source,entry.line,value),true)}>{t('초안에 반영')}</Button><Button variant="secondary" onClick={()=>onDelete(entry)}>{t('삭제')}</Button></div><RuleFields value={value} onChange={next=>{setValue(next);onPending(next);}} t={t}/>{entry.comment&&<p className="hint">{entry.comment}</p>}{error&&<p role="alert">{t(error)}</p>}</section>;}
type DeleteRequest = {record: HbaRecord; text: string; line: number; raw: string};
export default function PostgreSQLHbaSettings({record,onChange,onCode}: {record: HbaRecord; onChange: (change: Partial<HbaRecord>) => void; onCode: () => void}){
 const {t}=useLanguage(),[error,setError]=useState(''),[confirmation,setConfirmation]=useState<DeleteRequest | null>(null);
 const latest=useRef<{record: HbaRecord; onChange: (change: Partial<HbaRecord>) => void} | null>(null),pending=useRef<DeleteRequest | null>(null);latest.current={record,onChange};
 const value=record.pendingSettingInputs?.['$hba:new']?.value??initial;
 function changeNew(next: HbaValues){if(latest.current!.record!==record)return;const inputs={...record.pendingSettingInputs};if((Object.keys(initial) as (keyof HbaValues)[]).every(key=>next[key]===initial[key]))delete inputs['$hba:new'];else inputs['$hba:new']={raw:'',value:next};onChange({pendingSettingInputs:inputs});}
 function requestDelete(entry: HbaRule){if(latest.current!.record!==record)return;const request={record,text:record.text,line:entry.line,raw:entry.raw};pending.current=request;setConfirmation(request);}
 function cancelDelete(){if(pending.current!==confirmation)return;pending.current=null;setConfirmation(null);}
 function approveDelete(){
  const request=confirmation;if(!request||pending.current!==request)return;pending.current=null;setConfirmation(null);
  try{
   if(latest.current!.record!==request.record||latest.current!.record.text!==request.text)throw Error('설정이 변경되었습니다. 현재 초안과 비교한 뒤 다시 편집하세요.');
   const entry=parsePostgresqlHba(latest.current!.record.text).find(item=>item.line===request.line);
   if(entry?.kind!=='rule'||entry.raw!==request.raw)throw Error('삭제할 접속 규칙을 다시 선택하세요.');
   latest.current!.onChange({text:removePostgresqlHba(latest.current!.record.text,request.line)});setError('');
  }catch(failure){setError(errorMessage(failure));}
 }
 const confirmationView=confirmation&&confirmation.record===record?{title:'삭제',message:'이 접속 규칙을 초안에서 삭제할까요?',detail:confirmation.raw}:null;
let entries: HbaEntry[]=[],parseError='';try{entries=parsePostgresqlHba(record.text) as HbaEntry[];}catch(failure){parseError=errorMessage(failure);}return <section className="postgresql-hba-settings"><ConfirmDialog request={confirmationView} onConfirm={approveDelete} onCancel={cancelDelete}/><p className="hint">{t('접속 규칙은 위에서부터 검사합니다. GUI 변경은 코드 초안에 반영됩니다.')}</p><a href="https://www.postgresql.org/docs/current/auth-pg-hba-conf.html" target="_blank" rel="noreferrer">{t('공식 문서')}</a>{entries.map(entry=>entry.kind==='rule'?<Rule key={entry.line+':'+entry.raw} entry={entry} source={record.text} t={t} onDelete={requestDelete} pending={record.pendingSettingInputs?.[entry.line+':hba']?.raw===entry.raw?record.pendingSettingInputs[entry.line+':hba']:undefined} onPending={value=>{if(latest.current!.record!==record)return;onChange({pendingSettingInputs:{...record.pendingSettingInputs,[entry.line+':hba']:{raw:entry.raw,value}}});}} onChange={(text,applied)=>{if(latest.current!.record!==record)return;const next={...record.pendingSettingInputs};if(applied)delete next[entry.line+':hba'];onChange({text,pendingSettingInputs:next});}}/>:<div key={entry.line} className="postgresql-hba-raw"><span>{t('줄')} {entry.line} · {entry.kind==='include'?'include':t('코드로 편집')}</span><code>{entry.raw}</code><Button variant="secondary" onClick={()=>{if(latest.current!.record===record)onCode();}}>{t('코드 보기')}</Button></div>)}<details className="postgresql-hba-rule"><summary>{t('접속 규칙 추가')}</summary><RuleFields value={value} onChange={changeNew} t={t}/><Button variant="secondary" onClick={()=>{if(latest.current!.record!==record)return;try{const inputs={...record.pendingSettingInputs};delete inputs['$hba:new'];onChange({text:appendPostgresqlHba(record.text,value),pendingSettingInputs:inputs});setError('');}catch(error){setError(errorMessage(error));}}}>{t('초안에 항목 추가')}</Button></details>{(error||parseError)&&<p role="alert">{t(error||parseError)}</p>}<p className="hint">{t('작업 폴더에 저장한 초안을 검토하세요. 운영 접속 규칙은 자동 적용되지 않습니다.')}</p></section>;}
