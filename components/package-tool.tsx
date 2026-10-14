'use client';
import type {PackageConfigApi} from './package-config-types';
import {errorMessage,type SecurityPolicy} from './console-types';
import type {FileApi,ConfigCodeRecord} from './config-code-editor';
import type {PackageProfile,PackageDraftCodeRecord,ToolView} from './node-types';
import {useId,useState,useRef} from 'react';
import {parseNodeEnv} from '../lib/node-env.ts';
import {patchNodeEnv} from '../lib/node-env-patch.ts';
import {configDefaults} from '../lib/config-schema.ts';
import PackageConfig from './package-config';
import ConfigCodeEditor from './config-code-editor';
import {useDraftState} from './draft-provider';
import {Button} from './ui/controls';
import {useLanguage} from './language-provider';
type ToolProps = {api: PackageConfigApi; connected: boolean; requestedProfile?: PackageProfile | null; security: SecurityPolicy | null; nodeSection?: string; tabbed?: boolean; view?: ToolView; onViewChange?: (view:ToolView)=>void; requestedCode?: {name:string; text:string; version?:string | null} | null; recordKey?:string};
export default function PackageTool({api,connected,requestedProfile,security,nodeSection='all',tabbed=false,view='settings',onViewChange,requestedCode=null,recordKey=requestedProfile?.kind??'nginx'}: ToolProps){
 const {t}=useLanguage(),kind=requestedProfile?.kind??'nginx';
 type ToolScope = {api:FileApi; recordKey:string; kind:string; connected:boolean};
 const scope=useRef<ToolScope>({api,recordKey,kind,connected});
 if(scope.current.api!==api||scope.current.recordKey!==recordKey||scope.current.kind!==kind||scope.current.connected!==connected)scope.current={api,recordKey,kind,connected};
 const renderScope=scope.current,current=()=>scope.current===renderScope;
 const tabId=useId();
 const [records,setRecords]=useDraftState<Record<string,PackageDraftCodeRecord>>('packageCodeRecords',{}),[pending,setStoredPending]=useState<PackageDraftCodeRecord | null>(null);
 const pendingRef=useRef<PackageDraftCodeRecord | null>(null),pendingScope=useRef<ToolScope | null>(null);
 function setPending(value:PackageDraftCodeRecord | null){pendingRef.current=value;pendingScope.current=value?renderScope:null;setStoredPending(value);}
 const [,setDrafts]=useDraftState<Record<string,Record<string,string | number | boolean>>>('packageDrafts',{});
 const seed=requestedCode?{...requestedCode,kind,baseline:requestedCode.text,visible:true,stale:false}:null;
 const record=records[recordKey]??seed;
 const synchronized=kind==='nodejs'&&Boolean(record)&&!record.stale;
 let parsed: Record<string,string | number> | null=null;try{if(synchronized)parsed=parseNodeEnv(record.text).values;}catch{}
 function mergeValues(values: Record<string,string | number | boolean>){if(!current())return;setDrafts(previous=>({...previous,nodejs:{...configDefaults('nodejs'),...previous.nodejs,...values}}));}
 function editCode(values: Partial<PackageDraftCodeRecord>){
  if(!current())return;patch(values);
  if(kind!=='nodejs'||!record||typeof values.text!=='string')return;
  let previousValues={...record.lastValues};
  try{previousValues={...previousValues,...parseNodeEnv(record.text).values};mergeValues(previousValues);patch({lastValues:previousValues});}catch{}
  try{const next=parseNodeEnv(values.text).values;mergeValues(next);patch({stale:false,guiValues:{},lastValues:{...previousValues,...next}});}catch{}
 }
 function editFields(changes: Record<string,string | number | boolean>,allowIncomplete=false){
  if(!current()||!record)return '';
  try{
   const text=patchNodeEnv(record.text,changes),next=parseNodeEnv(text).values;
   const guiValues={...record.guiValues};for(const key of Object.keys(changes))delete guiValues[key];
   mergeValues(next);patch({text,guiValues,stale:false,lastValues:{...record.lastValues,...next}});return '';
  }catch(error){if(allowIncomplete)patch({guiValues:{...record.guiValues,...changes}});return errorMessage(error);}
 }
 function open(item: {name:string; text:string; version?:string | null}){if(!current())return;const next={...item,kind,baseline:item.text,visible:true,stale:false};if(record&&record.text!==record.baseline){setPending(next);return;}setRecords(previous=>({...previous,[recordKey]:next}));if(tabbed)onViewChange?.('code');}
 function patch(values: Partial<PackageDraftCodeRecord>){if(!current())return;const name=record?.name;setRecords(previous=>{const current=previous[recordKey]??seed;return current?.name===name?{...previous,[recordKey]:{...current,...values}}:previous;});}
 function selectView(next: ToolView){if(!current())return;if(next==='code'&&record&&!record.visible)patch({visible:true});onViewChange?.(next);}
 const form=<PackageConfig fieldKeys={undefined} requestedConfig={undefined} requestedMain={undefined} controlledDraft={synchronized?{...(requestedCode?configDefaults('nodejs'):{}),...record.lastValues,...parsed,...record.guiValues}:undefined} fieldOrder={synchronized&&parsed?Object.keys(parsed):undefined} codeRevision={synchronized?record.text:undefined} onFieldChange={synchronized?(key:string,value:string | number | boolean)=>editFields({[key]:value},true):undefined} onImportValues={synchronized?editFields:undefined} onResetDraft={synchronized?()=>editFields(configDefaults('nodejs')):undefined} onReviewCode={synchronized?()=>{patch({visible:true});onViewChange?.('code');}:undefined} nodeSection={nodeSection} api={api} connected={connected} security={security} onInvalidate={()=>{if(pending?.kind===kind)setPending(null);if(record&&!record.stale)patch({stale:true});}} requestedProfile={requestedProfile} onOpen={open}/>;
 const confirmation=pending?.kind===kind&&pendingScope.current===renderScope&&<div role="alertdialog" className="config-reset-confirm" aria-label={t('코드 초안 교체 확인')}><p>{t('편집 중인 코드를 새 GUI 초안으로 바꿀까요?')}</p><Button variant="secondary" onClick={()=>{if(current())setPending(null);}}>{t('편집한 코드 유지')}</Button><Button onClick={()=>{if(!current()||!pending||pendingRef.current!==pending)return;setRecords(previous=>({...previous,[recordKey]:pending}));setPending(null);if(tabbed)onViewChange?.('code');}}>{t('새 초안으로 교체')}</Button></div>;
 const editor=connected&&record&&(record.visible?<ConfigCodeEditor key={kind+':'+record.name} record={record} api={api} connected={connected} security={security} guiSynchronized={kind==='nodejs'} onChange={editCode} onHide={()=>{patch({visible:false});if(tabbed)onViewChange?.('settings');}}/>:<Button variant="secondary" onClick={()=>patch({visible:true})}>{t('코드 초안 다시 열기')}</Button>);
 if(!tabbed)return <section className="package-tool">{form}{confirmation}{editor}</section>;
 return <section className="package-tool package-tool--tabbed">
 <div className="nginx-inspector-tabs" role="tablist" aria-label={t('설정 보기 방식')}>{(['settings','code'] as const).map(tab=><Button key={tab} variant="secondary" role="tab" id={tabId+'-'+tab+'-tab'} aria-controls={tabId+'-'+tab+'-panel'} aria-selected={view===tab} tabIndex={view===tab?0:-1} onClick={()=>selectView(tab)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?'settings':event.key==='End'?'code':tab==='settings'?'code':'settings';selectView(next);event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[id="'+tabId+'-'+next+'-tab"]')?.focus();}}>{t(tab==='settings'?'설정':'코드 보기')}</Button>)}</div>
 <div className="package-ide-settings" role="tabpanel" id={tabId+'-settings-panel'} aria-labelledby={tabId+'-settings-tab'} hidden={view!=='settings'}>{form}</div>
 <div className="package-ide-code" role="tabpanel" id={tabId+'-code-panel'} aria-labelledby={tabId+'-code-tab'} hidden={view!=='code'}>{editor||<div className="nginx-tree-empty"><p>{t('생성한 설정 검토')}</p></div>}</div>
 {confirmation}
 </section>;
}
