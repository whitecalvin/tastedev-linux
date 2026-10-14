'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage} from './console-types';
import type {ChangeEvent} from 'react';
import {useId,useState,useRef,useEffect} from 'react';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
import {parseNodeEnv,readNodeEnvFile} from '../lib/node-env.ts';
import {configSchemas} from '../lib/config-schema.ts';
type EnvironmentValues = Partial<Record<'environment' | 'port' | 'host' | 'memory' | 'logLevel',string | number>>;
type ImportReview = {values: EnvironmentValues; skipped: number};
type ImportProps = {disabled?: boolean; onImport: (values: EnvironmentValues) => string | void};
// Keep the schema order; imported values contain only supported keys.
const fields = configSchemas.nodejs.fields as [keyof EnvironmentValues,string,string,string | number,string[]?][];
export default function NodeEnvImport({disabled,onImport}: ImportProps){
 const {t}=useLanguage(),id=useId(),[text,setText]=useState(''),[plan,setPlan]=useState<ImportReview | null>(null),[error,setError]=useState(''),[reading,setReading]=useState(false),generation=useRef(0);
 useEffect(()=>{if(disabled){generation.current++;setReading(false);}return ()=>{generation.current++;};},[disabled]);
 async function loadFile(event: ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value='';if(!file||disabled)return;const request=++generation.current;setReading(true);setPlan(null);setText('');setError('');try{const contents=await readNodeEnvFile(file);if(request===generation.current)setText(contents);}catch(e){if(request===generation.current)setError(errorMessage(e));}finally{if(request===generation.current)setReading(false);}}
 return <details className="live-site"><summary>{t('Node.js 환경 파일 불러오기')}</summary><p className="hint">{t('지원 환경 변수만 브라우저에서 읽습니다. 다른 변수는 반영하지 않습니다. 환경 파일 로딩과 앱 재시작은 별도로 진행하세요.')}</p><div className="ui-field"><label htmlFor={id+'-file'}>{t('환경 파일 선택')}</label><input id={id+'-file'} type="file" disabled={disabled||reading} onChange={loadFile}/></div>{reading&&<p role="status">{t('파일 읽는 중')}</p>}<label htmlFor={id}>{t('환경 파일 내용')}</label><textarea id={id} dir="ltr" className="ai-log-input" value={text} maxLength={262144} autoComplete="off" spellCheck={false} disabled={disabled} onChange={e=>{generation.current++;setReading(false);setText(e.target.value);setPlan(null);setError('');}}/><div className="manager-actions"><Button variant="secondary" disabled={disabled||reading||!text.trim()} onClick={()=>{try{const next=parseNodeEnv(text);setPlan(next);setText('');setError('');}catch(e){setError(errorMessage(e));}}}>{t('지원 항목 검토')}</Button><Button variant="secondary" disabled={disabled} onClick={()=>{generation.current++;setReading(false);setText('');setPlan(null);setError('');}}>{t('입력 지우기')}</Button></div>{error&&<ToastNotice message={t(error)} kind={'error'}/>}{plan&&<><table className="admin-table"><thead><tr><th>{t('설정')}</th><th>{t('값')}</th></tr></thead><tbody>{fields.filter(([key])=>Object.hasOwn(plan.values,key)).map(([key,label])=><tr key={key}><td>{t(label)}</td><td dir="ltr">{plan.values[key]}</td></tr>)}</tbody></table><p className="hint">{t('지원하지 않는 항목 제외')}: {plan.skipped}</p><Button disabled={disabled||!Object.keys(plan.values).length} onClick={()=>{const issue=onImport(plan.values);if(typeof issue==='string'&&issue){setError(issue);return;}setError('');setPlan(null);}}>{t('폼에 반영')}</Button></>}</details>;
}
