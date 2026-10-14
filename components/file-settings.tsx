'use client';
import {errorMessage} from './console-types';
import type {FileFormat,SettingRow,SettingModel,SettingAddition,RowPending,AdditionPending,FileSettingRecord,SettingDescription} from './file-editor-types';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {useLanguage} from './language-provider';
import {Button,Switch,TextInput,Dropdown} from './ui/controls';
import {parseMariaDBSettings,updateMariaDBSetting,appendMariaDBSetting} from '../lib/mariadb-settings-text.ts';
import {parseRedisSettings,updateRedisSetting,appendRedisSetting,redisSettingSensitive} from '../lib/redis-settings-text.ts';
import {parsePostgresqlSettings,updatePostgresqlSetting,appendPostgresqlSetting} from '../lib/postgresql-settings-text.ts';
import {postgresqlSettingDescription,postgresqlSettingNames} from '../lib/postgresql-setting-description.ts';
import {postgresqlSettingChoices} from '../lib/postgresql-setting-type.ts';
import {redisSettingDescription} from '../lib/redis-setting-description.ts';
import {mariadbSettingDescription,mariadbSettingSuggestionNames} from '../lib/mariadb-setting-description.ts';
import {redisSettingSuggestionNames} from '../lib/redis-setting-names.ts';
import {settingInputKey} from '../lib/file-settings-draft.ts';
import {matchesLocalizedText} from '../lib/i18n-core.ts';
const models: Record<FileFormat,SettingModel>={mariadb:{parse:parseMariaDBSettings,update:updateMariaDBSetting,append:appendMariaDBSetting},postgresql:{parse:parsePostgresqlSettings,update:updatePostgresqlSetting,append:appendPostgresqlSetting},redis:{parse:parseRedisSettings,update:updateRedisSetting,append:appendRedisSetting}};
function settingDescription(format: FileFormat,name: string,locale: string,group?: string): SettingDescription | null {return format==='postgresql'?postgresqlSettingDescription(name,locale):format==='redis'?redisSettingDescription(name,locale):format==='mariadb'?mariadbSettingDescription(name,locale,group):null;}
function descriptionView(description: SettingDescription){
 return <div className="postgresql-setting-description">{!description.translated&&<p className="hint">{description.paragraphs.length?description.fallbackLabel:description.unavailable}</p>}{description.paragraphs.map((paragraph,index)=><p className="hint" lang={description.language} key={index}>{paragraph}</p>)}</div>;
}
function Setting({row,text,onChange,onPending,pending,t,model,format,locale}: {row: SettingRow; text: string; onChange: (change: Partial<FileSettingRecord>) => void; onPending: (input: RowPending) => void; pending?: RowPending; t: (text: string) => string; model: SettingModel; format: FileFormat; locale: string}){
 const description=settingDescription(format,row.name,locale,row.group);
 const choices: string[]=format==='postgresql'?postgresqlSettingChoices(row.name):[];
 const [value,setValue]=useState(pending?.value??row.value),[error,setError]=useState(pending?.error??'');
 useEffect(()=>{setValue(pending?.value??row.value);setError(pending?.error??'');},[row.value,pending?.value,pending?.error]);
 function change(next: string,enabled=pending?.enabled??row.enabled){setValue(next);try{onChange({text:model.update(text,row,{value:next,enabled})});setError('');}catch(failure){setError(errorMessage(failure));onPending({raw:row.raw,value:next,enabled,error:errorMessage(failure)});}}
 return <section className="postgresql-setting" data-enabled={row.enabled}><div className="postgresql-setting-heading"><strong>{row.name}</strong>{row.group&&<span className="hint">[{row.group}]</span>}{row.flag&&<span className="hint">{t('값 없는 옵션')}</span>}<span className="hint">{t('줄')} {row.line}</span><Switch label={t('설정 활성화')} checked={pending?.enabled??row.enabled} onChange={event=>change(value,event.target.checked)}/></div>
 {description&&descriptionView(description)}
 {row.comment&&(description?<details className="postgresql-setting-comment"><summary className="hint">{description.commentLabel}</summary><p className="hint">{row.comment.replace(/^#\s*/,'')}</p></details>:<p className="hint">{row.comment.replace(/^#\s*/,'')}</p>)}
 <div className="postgresql-setting-value">{choices.length>0?<Dropdown label={row.name} aria-label={row.name} aria-description={description?(description.paragraphs.join(' ')||description.unavailable):undefined} value={value} options={[{value:'',label:t('설정값 비우기')},...(value&&!choices.includes(value)?[{value,label:value}]:[]),...choices.map(option=>({value:option,label:option}))]} onChange={event=>change(event.target.value,event.target.value?row.enabled:false)}/>:<TextInput label={row.name} aria-label={row.name} aria-description={description?(description.paragraphs.join(' ')||description.unavailable):undefined} type={row.sensitive?'password':'text'} value={value} onChange={event=>change(event.target.value)} spellCheck={false}/>}<Button variant="secondary" className="nginx-icon-button" title={t('설정값 비우기')} aria-label={t('설정값 비우기')} onClick={()=>change('',false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></Button></div>
 {(error||!row.valid)&&<p role="alert">{t(error||'설정값을 확인하세요.')}</p>}</section>;
}
export type FileSettingsProps = {format?: FileFormat; record: FileSettingRecord; onChange: (change: Partial<FileSettingRecord>) => void; onCode?: () => void; requestedGroup?: string};
export default function FileSettings({format='postgresql',record,onChange,onCode,requestedGroup}: FileSettingsProps){
 const latest=useRef<{record: FileSettingRecord; format: FileFormat; requestedGroup?: string} | null>(null),mounted=useRef(true);
 const snapshot={record,format,requestedGroup};latest.current=snapshot;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;latest.current=null;};},[]);
 function isCurrent(){return mounted.current&&latest.current?.record===snapshot.record&&latest.current?.format===snapshot.format&&latest.current?.requestedGroup===snapshot.requestedGroup;}
 function emit(change: Partial<FileSettingRecord>){if(isCurrent())onChange(change);}
 const model=models[format]||models.postgresql;
 const settingNamesId=useId();
 const {t,locale}=useLanguage(),[query,setQuery]=useState(''),[error,setError]=useState(''),[groupFilter,setGroupFilter]=useState('');
 const additionKey='$setting:new'+(format==='mariadb'&&requestedGroup!==undefined?':'+requestedGroup:'');
 const emptyAddition: SettingAddition={name:'',value:'',group:'mariadbd',flag:false};
 const savedAddition=record.pendingSettingInputs?.[additionKey]?.value;
 const addition=typeof savedAddition==='object'?savedAddition:emptyAddition;
 const {name,value,group,flag}=addition;
 function changeAddition(change: Partial<SettingAddition>){if(!isCurrent())return;const next={...addition,...change},inputs={...record.pendingSettingInputs};if((Object.keys(emptyAddition) as (keyof SettingAddition)[]).every(key=>next[key]===emptyAddition[key]))delete inputs[additionKey];else inputs[additionKey]={raw:'',value:next};emit({pendingSettingInputs:inputs});}

 const parsed=useMemo(()=>{try{return {rows:model.parse(record.text),error:''};}catch(failure){return {rows:[],error:errorMessage(failure)};}},[record.text,model]),rows=parsed.rows;
 const addedChoices: string[]=format==='postgresql'?postgresqlSettingChoices(name.trim()):[];
 const addedDescription=name.trim()?settingDescription(format,name.trim(),locale,requestedGroup??group):null;
 const suggestedNames=format==='postgresql'?postgresqlSettingNames:format==='redis'?redisSettingSuggestionNames:format==='mariadb'?mariadbSettingSuggestionNames.filter(parameter=>mariadbSettingDescription(parameter,'ko',requestedGroup??group)):[];
 const visible=rows.filter(row=>(!(requestedGroup??groupFilter)||row.group===(requestedGroup??groupFilter))&&matchesLocalizedText(locale,row.name+' '+row.value+' '+row.comment+' '+(settingDescription(format,row.name,locale,row.group)?.paragraphs.join(' ')||''),query));
 return <section className="postgresql-settings" data-format={format}><div className="postgresql-settings-search"><TextInput type="search" label={t('설정 검색')} value={query} onChange={event=>setQuery(event.target.value)}/><span className="hint">{visible.length} / {rows.length}</span></div>
 {format==='mariadb'&&requestedGroup===undefined&&<Dropdown label={t('설정 그룹 필터')} value={groupFilter} options={[{value:'',label:t('전체 그룹')},...[...new Set(rows.map(row=>row.group).filter((value): value is string=>Boolean(value)))].map(value=>({value,label:'['+value+']'}))]} onChange={event=>setGroupFilter(event.target.value)}/>}
 <p className="hint">{t('파일의 설정과 주석 처리된 항목을 순서대로 표시합니다. 변경은 코드 초안에 반영됩니다.')}</p>
 {format==='redis'&&<p className="hint">{t('Redis는 줄 끝 #을 주석으로 처리하지 않습니다. 여러 인수와 따옴표를 그대로 입력하세요.')}</p>}
 {visible.map(row=>{const inputKey=settingInputKey(row),pending=record.pendingSettingInputs?.[inputKey];const removePending=()=>{const next={...record.pendingSettingInputs};delete next[inputKey];return next;};return <Setting model={model} key={(record.sourcePath||record.name||format)+':'+inputKey} row={row} text={record.text} pending={pending?.raw===row.raw&&typeof pending.value==='string'?pending as RowPending:undefined} onChange={change=>emit({...change,pendingSettingInputs:removePending()})} onPending={input=>emit({pendingSettingInputs:{...record.pendingSettingInputs,[inputKey]:input}})} t={t} format={format} locale={locale}/>;})}
 {parsed.error&&<div role="alert"><p>{t('설정값을 확인하세요.')}</p>{onCode&&<Button variant="secondary" onClick={()=>{if(isCurrent())onCode();}}>{t('코드 보기')}</Button>}</div>}
 {!visible.length&&<p className="hint">{t('검색 결과가 없습니다.')}</p>}
 <details className="postgresql-setting"><summary>{t('초안에 항목 추가')}</summary><div className="postgresql-setting-add">{format==='mariadb'&&<TextInput label={t('추가할 설정 그룹')} value={requestedGroup??group} disabled={requestedGroup!==undefined} onChange={event=>changeAddition({group:event.target.value})} spellCheck={false}/>}<TextInput label={t('설정 이름')} list={suggestedNames.length?settingNamesId:undefined} autoComplete="off" aria-description={addedDescription?(addedDescription.paragraphs.join(' ')||addedDescription.unavailable):undefined} value={name} onChange={event=>changeAddition({name:event.target.value})} spellCheck={false}/>{suggestedNames.length>0&&<datalist id={settingNamesId}>{suggestedNames.map(parameter=><option key={parameter} value={parameter} label={settingDescription(format,parameter,locale,requestedGroup??group)?.paragraphs[0]||parameter}/>)}</datalist>} {format==='mariadb'&&<Switch label={t('값 없는 옵션')} checked={flag} onChange={event=>{changeAddition({flag:event.target.checked,value:''});}}/>}{addedChoices.length>0?<Dropdown label={t('설정값')} aria-description={addedDescription?(addedDescription.paragraphs.join(' ')||addedDescription.unavailable):undefined} value={value} options={[{value:'',label:t('설정값 비우기')},...(value&&!addedChoices.includes(value)?[{value,label:value}]:[]),...addedChoices.map(option=>({value:option,label:option}))]} onChange={event=>changeAddition({value:event.target.value})}/>:<TextInput label={t('설정값')} type={format==='redis'&&redisSettingSensitive(name)?'password':'text'} disabled={format==='mariadb'&&flag} value={value} onChange={event=>changeAddition({value:event.target.value})} spellCheck={false}/> }<Button onClick={()=>{if(!isCurrent())return;try{const inputs={...record.pendingSettingInputs};delete inputs[additionKey];emit({text:model.append(record.text,name,value,requestedGroup??group,flag),pendingSettingInputs:inputs});setQuery('');setGroupFilter('');setError('');}catch(failure){setError(errorMessage(failure));}}}>{t('초안에 항목 추가')}</Button>{addedDescription&&descriptionView(addedDescription)}</div>{error&&<p role="alert">{t(error)}</p>}</details>
 </section>;
}
