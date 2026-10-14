'use client';
import {ToastNotice} from './ui/toast-provider';
import {errorMessage,type DatabaseOperationResult,type ConfigBackupCatalog,type ServiceRecord} from './console-types';
import {isConfigFile,isCertificateFile,areCertificateFiles,isCodeInput,isHbaInput,isMariaCodeInput,type PackageIdeProps,type PackageIdeKind,type IdeFile,type IdeSelection,type IdeCodeRecord,type PendingCode,type OpenCodeInput,type IdeScope,type IdePopup,type IdePopupContext} from './package-ide-types';
import type {LiveConfigFile,ConfigValues,ConfigValue} from './package-config-types';
import type {ButtonHTMLAttributes} from 'react';
import type {HbaRecord,FileSettingRecord} from './file-editor-types';
import IdeSplitLayout from './ui/ide-split-layout';
import PostgreSQLDataBackups from './postgresql-data-backups';
import {postgresqlHbaDiagnosticMessage,retainPostgresqlHbaInputs} from '../lib/postgresql-hba.ts';
import {retainSettingInputs} from '../lib/file-settings-draft.ts';
import {hasUnsavedIdeRecord,hasPendingIdeInputs} from '../lib/draft-state.ts';
import {configNotice} from '../lib/config-notice.ts';
import {useCallback,useEffect,useRef,useState,useId,useMemo} from 'react';
import {useLanguage} from './language-provider';
import {useDraftState} from './draft-provider';
import {Button} from './ui/controls';
import PackageConfig from './package-config';
import PostgreSQLSettings from './postgresql-settings';
import RedisCodeOperation from './redis-code-operation';
import RedisBackups from './redis-backups';
import MariaDBBackups from './mariadb-backups';
import MariaDBCodeOperation from './mariadb-code-operation';
import PostgreSQLCodeOperation from './postgresql-code-operation';
import PostgreSQLCodeRecovery from './postgresql-code-recovery';
import RedisSettings from './redis-settings';
import {mariadbSettingGroups} from '../lib/mariadb-setting-groups.ts';
import MariaDBSettings from './mariadb-settings';
import PostgreSQLHbaSettings from './postgresql-hba-settings';
const isHba=(file:{path?:string} | null | undefined):file is {path:`${string}/pg_hba.conf`}=>Boolean(file?.path?.endsWith('/pg_hba.conf'));
import ServerManager from './server-manager';
import ConfigCodeEditor from './config-code-editor';
import PostgreSQLRestore from './postgresql-restore';
import PostgreSQLCompletedHistory from './postgresql-completed-history';
import PostgreSQLHbaOperation from './postgresql-hba-operation';
import {featureAllowed} from '../lib/capabilities.ts';
import {parseLiveConfig} from '../lib/config-value-parser.ts';
import {configDefaults} from '../lib/config-schema.ts';
import {patchConfig} from '../lib/config-patch.ts';
const fileKey=(file:IdeFile | null | undefined)=>file?.path||file?.name;
const groups:[string,string,string[]][]=[['directives','설정',[]],['connections','연결 설정',['port','connections']],['memory','메모리',['sharedBuffers','workMem']],['logging','로그',['logging']]];
function Icon({name}:{name:string}){const paths:Record<string,string>={apply:'M5 3h14v18H5zM9 7h6M9 11h6m-8 6 2 2 4-4',check:'m5 12 4 4 10-10',refresh:'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1',start:'m8 5 11 7-11 7z',stop:'M6 6h12v12H6z',logs:'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',backup:'M5 4h14v16H5zM8 4v6h8V4M8 20v-6h8v6',restore:'M4 10a8 8 0 1 1 1 7M4 4v6h6M12 8v5l3 2',expand:'M8 4H4v12m4-8h12v12H8zM11 14h6m-3-3v6',collapse:'M8 4H4v12m4-8h12v12H8zM11 14h6'};return <svg viewBox="0 0 24 24" className="nginx-action-icon" aria-hidden="true">
<path d={paths[name]}/>
</svg>;}
export default function PackageConfigIde({kind,api,connected,security,requestedProfile,initialData=null}:PackageIdeProps){
 const {t}=useLanguage(),title=({certbot:'Certbot',postgresql:'PostgreSQL',redis:'Redis',mariadb:'MariaDB'})[kind],unit=({certbot:'certbot.timer',postgresql:'postgresql.service',redis:'redis-server.service',mariadb:'mariadb.service'})[kind];
 const configKind=['postgresql','redis','mariadb'].includes(kind);
 const visibleGroups:[string,string,string[]][]=kind==='redis'?[['directives','설정',[]],['connections','연결 설정',['port','connections']],['memory','메모리',['maxMemory','eviction']],['persistence','AOF 지속성',['appendOnly','fsync']]]:kind==='mariadb'?[['directives','설정',[]],['connections','연결 설정',['port','connections']],['memory','메모리',['bufferPool']],['charset','서버 문자셋',['charset']],['logging','로그',['slowLog','slowSeconds']]]:groups;
 const seed=initialData?.kind===kind?initialData:null;
 const initialContext=useRef(seed&&connected?{kind,connected,api}:null);
 const [files,setFiles]=useState<IdeFile[]>(seed?.files??[]),[service,setService]=useState<ServiceRecord | null | undefined>(seed?.service??null),[selection,setSelection]=useState<IdeSelection | null>(null),[view,setView]=useState<'settings' | 'code'>('settings'),[query,setQuery]=useState(''),[collapsed,setCollapsed]=useState(false),[treeVersion,setTreeVersion]=useState(0),[error,setError]=useState(seed?.error??''),[busy,setBusy]=useState(false);
 const [,setPackageDrafts]=useDraftState<Record<string,ConfigValues>>('packageDrafts',{});
 const [records,setRecords]=useDraftState<Record<string,IdeCodeRecord>>('packageIdeCodeRecords',{}),[pending,setPending]=useState<PendingCode | null>(null),[requestedConfig,setRequestedConfig]=useState<LiveConfigFile | null>(null),[certificate,setCertificate]=useState<{operation:string;name:string} | null>(null);
 const [popup,setPopup]=useState<IdePopup | null>(null),[popupText,setPopupText]=useState(''),[backups,setBackups]=useState<ConfigBackupCatalog['backups']>([]),[restoreId,setRestoreId]=useState<string | null>(null),[control,setStoredControl]=useState<{unit?:string;action:'start' | 'stop';path?:string} | null>(null);
 const [popupLoading,setPopupLoading]=useState(false);
 const [sourceFailure,setSourceFailure]=useState<{path:string;message:string;scope:IdeScope | null} | null>(null);
 const popupContext=useRef<IdePopupContext | null>(null);
 const ignoredCloseEvents=useRef(0),serviceLock=useRef(false),popupRevision=useRef(0),scope=useRef<IdeScope | null>(null);if(scope.current?.kind!==kind||scope.current?.connected!==connected||scope.current?.api!==api)scope.current={kind,connected,api};
 const renderScope=scope.current,mounted=useRef(true),controlRef=useRef<typeof control>(null),currentPolicy=useRef(security);currentPolicy.current=security;
 const currentView=()=>mounted.current&&scope.current===renderScope&&connected;
 function setControl(value:typeof control){if(value&&(!currentView()||!featureAllowed(currentPolicy.current,'serviceChanges',{sudo:true})))return;controlRef.current=value;setStoredControl(value);}
 const dialog=useRef<HTMLDialogElement | null>(null),dialogTitle=useId(),revision=useRef(0),selectionRevision=useRef(0),record=records[kind],recordRef=useRef(record);recordRef.current=record;const selectionRef=useRef(selection);selectionRef.current=selection;
 useEffect(()=>{mounted.current=true;if(!scope.current)scope.current=renderScope;const activeScope=scope.current;revision.current++;closePopup();setControl(null);setBusy(false);setSelection(null);setPending(null);setSourceFailure(null);setRequestedConfig(null);setCertificate(null);setView('settings');if(initialContext.current?.kind!==kind||initialContext.current?.connected!==connected||initialContext.current?.api!==api){initialContext.current=null;setFiles([]);setService(null);setError('');}return()=>{mounted.current=false;controlRef.current=null;revision.current++;selectionRevision.current++;popupRevision.current++;if(scope.current===activeScope)scope.current=null;};},[kind,connected,api]);
 const refreshLock=useRef<{scope:IdeScope;generation:number} | null>(null);
 const refresh=useCallback(async()=>{
  if(!currentView()||!scope.current)return;
  const snapshot=scope.current;if(refreshLock.current?.scope===snapshot)return;
  const ticket={scope:snapshot,generation:revision.current};refreshLock.current=ticket;
  const current=()=>scope.current===ticket.scope&&revision.current===ticket.generation&&refreshLock.current===ticket;
  setBusy(true);setError('');
  try{
   const [data,operations]=await Promise.all([
    kind==='certbot'?api('certificates').then(result=>({files:result.certificates,warnings:result.warning?[result.warning]:[]})):api(`config-live?kind=${kind}`).then(result=>({files:result.configs,warnings:result.warnings??[]})),
    api(`operations?unit=${encodeURIComponent(unit)}`)
   ]);
   if(!current())return;
   const nextFiles:IdeFile[]=data.files;setFiles(nextFiles);if(configKind&&!nextFiles.length)setPending(null);
   const selected=selectionRef.current;
   if(selected?.file){const updated=nextFiles.find(file=>fileKey(file)===fileKey(selected.file));if(!updated){closePopup();selectionRevision.current++;setSelection(null);setPending(null);setRequestedConfig(null);setCertificate(null);setView('settings');}else setSelection(previous=>previous&&fileKey(previous.file)===fileKey(selected.file)?{...previous,file:updated}:previous);}
   setService(operations.services.find(item=>item.unit===unit));setError(data.warnings.filter(Boolean).join(' · '));
  }catch(e){if(current())setError(errorMessage(e));}
  finally{if(current())setBusy(false);if(refreshLock.current===ticket)refreshLock.current=null;}
 },[api,kind,unit,connected]);
 useEffect(()=>{if(connected&&!initialContext.current)refresh();},[connected,refresh]);
 useEffect(()=>{if(popup&&!dialog.current?.open)dialog.current?.showModal();},[popup]);
 function openCode(item:OpenCodeInput,previousSelection=selectionRef.current){if(!currentView())return;const next:IdeCodeRecord={...item,sourcePath:item.sourcePath??selectionRef.current?.file?.path,selectionKey:fileKey(selectionRef.current?.file)??'issue',kind,baseline:item.baseline??item.text,visible:true};if(configKind&&next.sourcePath&&!isHba({path:next.sourcePath}))next.guiValues={...configDefaults(kind),...parseLiveConfig(kind,next.text).values};const current=recordRef.current;if(current&&hasUnsavedIdeRecord(current)&&(current.text!==next.text||current.pendingGuiFields?.length||Object.keys(current.pendingSettingInputs||{}).length)){const key=configKind?current.sourcePath:current.selectionKey;const previousKey=fileKey(previousSelection?.file)??'issue';const file=files.find(file=>fileKey(file)===key);const origin=previousKey===key?previousSelection:file?{file,group:null}:key==='issue'?{file:null,group:null}:null;setPending({...next,previousSelection:origin});return;}setRecords(previous=>({...previous,[kind]:next}));}
 const previewContext=scope.current;
 const preview=useCallback((text:string)=>{if(scope.current!==previewContext||!selection||(fileKey(selection.file)??'issue')!==(fileKey(selectionRef.current?.file)??'issue'))return;if(text)openCode({name:'certbot-command.txt',text});else {setPending(null);setRecords(previous=>{if(!previous.certbot)return previous;const next={...previous};delete next.certbot;return next;});}},[kind,connected,api,selection,setRecords]);
 const parsedCode=useMemo(()=>configKind&&!isHba(selection?.file)&&record?.sourcePath&&record.sourcePath===selection?.file?.path&&typeof record?.text==='string'?parseLiveConfig(kind,record.text):null,[kind,record,selection]);
 function patch(values:Partial<IdeCodeRecord>){
  const current=recordRef.current;if(!current)return;
  let nextValues=values;
  if(isHba(selectionRef.current?.file)&&typeof values.text==='string'&&current.sourcePath===selectionRef.current?.file?.path)nextValues={...values,pendingSettingInputs:retainPostgresqlHbaInputs(current.text,values.text,values.pendingSettingInputs??current.pendingSettingInputs)};
  if(configKind&&!isHba(selectionRef.current?.file)&&typeof values.text==='string'&&current.sourcePath===selectionRef.current?.file?.path){
   const parsed=parseLiveConfig(kind,values.text);
   const pendingGuiFields=Object.hasOwn(values,'pendingGuiFields')?(values.pendingGuiFields??[]):(current.pendingGuiFields??[]).filter(key=>!Object.hasOwn(parsed.values,key));
   const resolved=Object.fromEntries(Object.entries(parsed.values).filter(([key])=>!pendingGuiFields.includes(key)));
   const pendingSettingInputs=retainSettingInputs(kind,values.text,values.pendingSettingInputs??current.pendingSettingInputs,current.text);
   nextValues={...values,pendingSettingInputs,guiValues:{...configDefaults(kind),...current.guiValues,...values.guiValues,...resolved},pendingGuiFields};
   setPackageDrafts(previous=>({...previous,[kind]:{...previous[kind],...parsed.values}}));
  }
  setRecords(previous=>previous[kind]?.name===current.name&&previous[kind]?.sourcePath===current.sourcePath?{...previous,[kind]:{...previous[kind],...nextValues}}:previous);
 }
 function patchGui(key:string,value:string | number | boolean){
  const current=recordRef.current;if(!configKind||!current||!selectionRef.current?.file||isHba(selectionRef.current.file)||current.sourcePath!==selectionRef.current.file.path)return;
  const guiValues={...configDefaults(kind),...current.guiValues,[key]:value};
  try{patch({text:patchConfig(kind,current.text,{[key]:value}),guiValues,pendingGuiFields:(current.pendingGuiFields??[]).filter(field=>field!==key),stale:false});return '';}
  catch(error){patch({guiValues,pendingGuiFields:[...new Set([...(current.pendingGuiFields??[]),key])]});return t(errorMessage(error));}
 }
 function resetGui(){
  const current=recordRef.current;if(!configKind||!current||!selectionRef.current?.file||isHba(selectionRef.current.file)||current.sourcePath!==selectionRef.current.file.path)return;
  try{const guiValues=configDefaults(kind);patch({text:patchConfig(kind,current.text,guiValues),guiValues,pendingGuiFields:[],stale:false});return '';}
  catch(error){return t(errorMessage(error));}
 }
 async function choose(file:IdeFile | null,group:string | null=null){if(!currentView())return;closePopup();const previousSelection=selectionRef.current,ticket=++selectionRevision.current,generation=revision.current,snapshot=scope.current;setPending(null);setSourceFailure(null);setSelection({file,group});setView('settings');setError('');if(kind==='certbot'){setCertificate({operation:file?'renew-check':'issue',name:file?.name||''});return;}if(!isConfigFile(file))return;if(group!==null&&fileKey(selectionRef.current?.file)===fileKey(file)&&recordRef.current?.sourcePath===file.path)return;setRequestedConfig(file);try{const result=await api(`config-source?kind=${kind}&path=${encodeURIComponent(file.path)}`);if(ticket!==selectionRevision.current||generation!==revision.current||snapshot!==scope.current)return;openCode({sourcePath:file.path,sourceVersion:result.version,name:kind+'-'+(file.path??'').split('/').slice(-3,-1).join('-')+(isHba(file)?'-pg_hba':'')+(kind==='mariadb'?'.cnf':'.conf'),text:result.text},previousSelection);}catch(e){if(ticket===selectionRevision.current&&generation===revision.current&&snapshot===scope.current){setSourceFailure({path:file.path,message:errorMessage(e),scope:snapshot});setError(errorMessage(e));}}}
 function keepCode(){if(!currentView())return;if(pending?.kind!==kind)return;const original=pending?.previousSelection,previous=original?.file&&!files.some(file=>fileKey(file)===fileKey(original.file))?null:original;selectionRevision.current++;setPending(null);if(previous){setSelection(previous);if(configKind)setRequestedConfig(isConfigFile(previous.file)?previous.file:null);else setCertificate({operation:previous.file?'renew-check':'issue',name:previous.file?.name||''});}else setSelection(null);setView('code');}
 function closePopup(){popupRevision.current++;popupContext.current=null;setPopup(null);setPopupLoading(false);setPopupText('');setBackups([]);setRestoreId(null);if(dialog.current?.open){ignoredCloseEvents.current++;dialog.current.close();}}
 async function inspect(mode:IdePopup){if(!currentView())return;if(['apply','validate'].includes(mode)&&isHba(selectionRef.current?.file)&&blockPendingReview(recordRef.current))return;const ticket=++popupRevision.current,snapshot=scope.current,file=selectionRef.current?.file;popupContext.current=mode!=='logs'&&isHba(file)?{path:file.path,hba:true}:['restore','backups'].includes(mode)&&kind==='postgresql'&&file?.path?.endsWith('/postgresql.conf')?{path:file.path}:null;setPopup(mode);setPopupLoading(true);setPopupText('');setRestoreId(null);setBackups([]);const current=()=>ticket===popupRevision.current&&snapshot===scope.current;try{if(mode==='apply'){const record=recordRef.current;if(!isHba(file)||record?.sourcePath!==file.path)throw Error(t('접속 규칙을 불러올 수 없습니다.'));popupContext.current={path:file.path,hba:true,operationInput:{path:file.path,version:record.sourceVersion??file.version,text:record.text}};return;}if(mode==='validate'){const record=recordRef.current;if(!isHba(file)||record?.sourcePath!==file.path)throw Error(t('접속 규칙을 불러올 수 없습니다.'));const data=await api('postgresql-hba-validate',{path:file.path,version:record.sourceVersion??file.version,text:record.text});if(current())setPopupText([t(data.valid?'검수 완료':'검수 실패'),...data.diagnostics.map(item=>item.path+':'+item.line+' · '+t(postgresqlHbaDiagnosticMessage(item.category))),t('운영 파일은 변경하지 않습니다.')].join('\n'));}else if(mode==='logs'){const data=await api(`logs?source=${encodeURIComponent(kind==='postgresql'&&file?file.service?.unit??unit:unit)}${kind==='postgresql'&&file?.path?'&path='+encodeURIComponent(file.path):''}`);if(current())setPopupText(data.text);}else{const data=await api(popupContext.current?.hba?`postgresql-hba-backups?path=${encodeURIComponent(file?.path??'')}`:popupContext.current?.path?`postgresql-backups?path=${encodeURIComponent(popupContext.current.path)}`:'postgresql-backups');if(current()){setBackups(data.backups);if(data.warnings||data.truncated)setPopupText(t('일부 백업을 표시하지 못했습니다.'));}}}catch(e){if(current())setPopupText(errorMessage(e));}finally{if(current())setPopupLoading(false);}}
 async function backupSelectedFile(){const context=popupContext.current,snapshot=scope.current,ticket=++popupRevision.current,current=()=>ticket===popupRevision.current&&snapshot===scope.current;if(!context?.path)return;setPopupLoading(true);setPopupText('');try{const version=recordRef.current?.sourcePath===context.path?(recordRef.current.sourceVersion??selectionRef.current?.file?.version):selectionRef.current?.file?.version;await api(context.hba?'postgresql-hba-backup':'postgresql-config-backup',{path:context.path,version,...(context.hba?{}:{confirm:true})});if(!current())return;const data=await api(context.hba?`postgresql-hba-backups?path=${encodeURIComponent(context.path)}`:`postgresql-backups?path=${encodeURIComponent(context.path)}`);if(current()){setBackups(data.backups);setPopupText(t('현재 운영 파일을 백업했습니다. 편집 중인 초안은 포함하지 않습니다.'));}}catch(e){if(current())setPopupText(errorMessage(e));}finally{if(current())setPopupLoading(false);}}
 async function reviewHbaBackup(item:ConfigBackupCatalog['backups'][number]){const context=popupContext.current,snapshot=scope.current,ticket=++popupRevision.current,current=()=>ticket===popupRevision.current&&snapshot===scope.current;if(!context?.hba||!context.path)return;setPopupLoading(true);setPopupText('');try{const data=await api(`postgresql-hba-restore-draft?path=${encodeURIComponent(context.path??'')}&id=${encodeURIComponent(item.id)}`);if(!current())return;openCode({sourcePath:data.path,sourceVersion:data.sourceVersion,baseline:data.baseline,text:data.text,name:'postgresql-'+data.path.split('/').slice(-3,-1).join('-')+'-pg_hba.conf'});setView('code');closePopup();}catch(e){if(current())setPopupText(errorMessage(e));}finally{if(current())setPopupLoading(false);}}

 function reviewHbaRestore(item:ConfigBackupCatalog['backups'][number]){const context=popupContext.current,record=recordRef.current;if(!context?.hba||!context.path)return;const version=record?.sourcePath===context.path?(record.sourceVersion??selectionRef.current?.file?.version):selectionRef.current?.file?.version;popupRevision.current++;popupContext.current={path:context.path,hba:true,operationInput:{path:context.path,version,backupId:item.id}};setPopup('apply');setPopupLoading(false);setPopupText('');}
 async function hbaApplied(result:DatabaseOperationResult){const context=popupContext.current,snapshot=scope.current,ticket=popupRevision.current;if(recordRef.current?.sourcePath===context?.path)patch({sourceVersion:result.version});if(context?.operationInput?.backupId&&context.path&&!result.failed){try{const data=await api(`config-source?kind=postgresql&path=${encodeURIComponent(context.path??'')}`);if(scope.current===snapshot&&popupRevision.current===ticket){openCode({sourcePath:context.path,sourceVersion:data.version,baseline:data.text,text:data.text,name:'postgresql-'+context.path.split('/').slice(-3,-1).join('-')+'-pg_hba.conf'});}}catch(error){if(scope.current===snapshot&&popupRevision.current===ticket)setPopupText(errorMessage(error));}}if(scope.current===snapshot)await refresh();}
 function blockPendingReview(current:IdeCodeRecord | null | undefined){if(!hasPendingIdeInputs(current)){setError('');return false;}closePopup();setError(t('코드에 반영되지 않은 입력이 있습니다. 설정 화면에서 값을 확인하세요.'));setView('settings');return true;}
 function reviewPostgresqlCode(){const selected=selectionRef.current?.file,current=recordRef.current;if(kind!=='postgresql'||!selected?.path?.endsWith('/postgresql.conf')||!current||current.sourcePath!==selected.path)return;if(blockPendingReview(current))return;closePopup();popupContext.current={path:selected.path,operationInput:{path:selected.path,version:current.sourceVersion??selected.version,text:current.text}};setPopupText('');setPopupLoading(false);setPopup('postgresql-code');}
 function reviewMariaDBCode(){const selected=selectionRef.current?.file,current=recordRef.current;if(kind!=='mariadb'||!isConfigFile(selected)||!current||current.sourcePath!==selected.path)return;if(blockPendingReview(current))return;closePopup();const root=['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(selected.path)?selected.path:files.some(file=>file.path==='/etc/mysql/my.cnf')?'/etc/mysql/my.cnf':'/etc/mysql/mariadb.cnf';popupContext.current={path:selected.path,operationInput:{root,path:selected.path,version:current.sourceVersion??selected.version,text:current.text}};setPopupText('');setPopupLoading(false);setPopup('mariadb-code');}
 function reviewRedisCode(){const selected=selectionRef.current?.file,current=recordRef.current;if(kind!=='redis'||!isConfigFile(selected)||!current||current.sourcePath!==selected.path)return;if(blockPendingReview(current))return;closePopup();popupContext.current={path:selected.path,operationInput:{path:selected.path,version:current.sourceVersion??selected.version,text:current.text}};setPopupText('');setPopupLoading(false);setPopup('redis-code');}
 function openDatabaseBackups(mode:'backups' | 'restore'){if(!['redis','mariadb'].includes(kind))return;closePopup();popupContext.current={path:selectionRef.current?.file?.path};setPopup(mode);}
 async function backupSelectedDatabaseFile(){
  const context=popupContext.current,snapshot=scope.current,ticket=popupRevision.current;if(!context?.path||!['redis','mariadb'].includes(kind))return;
  const current=recordRef.current,version=current?.sourcePath===context.path?(current.sourceVersion??selectionRef.current?.file?.version):selectionRef.current?.file?.version;
  await api(kind+'-config-backup',{path:context.path,version,confirm:true});if(scope.current!==snapshot||popupRevision.current!==ticket)return;
  setPopupText(t('현재 운영 파일을 백업했습니다. 편집 중인 초안은 포함하지 않습니다.'));
  const data=await api(kind==='redis'?'redis-backups':'mariadb-backups');return scope.current===snapshot&&popupRevision.current===ticket?data:undefined;
 }
 async function redisCodeApplied(result:DatabaseOperationResult){const context=popupContext.current;if(recordRef.current?.sourcePath===context?.path&&result.version)patch({sourceVersion:result.version});await refresh();}
 async function selectedConfigRestored(result:DatabaseOperationResult,target?:string){
  const context=popupContext.current,snapshot=scope.current,ticket=popupRevision.current;if(!configKind||!context||!target)return;
  const source=await api(`config-source?kind=${kind}&path=${encodeURIComponent(target??'')}`);if(scope.current!==snapshot||popupRevision.current!==ticket)return;
  const current=recordRef.current;if(current?.sourcePath===target)patch({sourceVersion:source.version,...(!hasUnsavedIdeRecord(current)?{text:source.text,baseline:current.version?current.baseline:source.text,stale:false}:{stale:current.text!==source.text})});
  await refresh();
 }
 async function confirmControl(){if(!currentView()||serviceLock.current||!control||controlRef.current!==control||!featureAllowed(currentPolicy.current,'serviceChanges',{sudo:true}))return;controlRef.current=null;serviceLock.current=true;const snapshot=scope.current;setBusy(true);setError('');try{await api('service',{...control,confirm:true});if(snapshot!==scope.current)return;setControl(null);await refresh();}catch(e){if(snapshot===scope.current)setError(errorMessage(e));}finally{serviceLock.current=false;if(snapshot===scope.current)setBusy(false);}}
 const displayedService=kind==='postgresql'?(selection?.file?.service??null):service;
 const displayedStatus=displayedService?.ActiveState??'unknown';
 const controlUnit=kind==='postgresql'?selection?.file?.service?.unit:unit;
 const status=displayedStatus,filtered=files.filter(item=>[item.path||item.name,...fileGroups(item)].join(' ').toLowerCase().includes(query.toLowerCase()));
 const selectedRecord=record&&(configKind?record.sourcePath===selection?.file?.path:record.selectionKey===(fileKey(selection?.file)??'issue'))?record:null;
 function fileGroups(file:IdeFile){if(kind!=='mariadb')return [];if(record?.sourcePath===file.path&&typeof record.text==='string'){try{return mariadbSettingGroups(record.text);}catch{return file.groups||[];}}return file.groups||[];}
 // Pending input maps are written by the file-specific HBA/settings editors; views retain their record identity.
 const invalidPopupInput=popup==='apply'?!isHbaInput(popupContext.current?.operationInput):popup==='mariadb-code'?!isMariaCodeInput(popupContext.current?.operationInput):['postgresql-code','redis-code'].includes(popup??'')&&!isCodeInput(popupContext.current?.operationInput);
 const unavailableSource=configKind&&selection?.file&&sourceFailure?.scope===scope.current&&sourceFailure.path===selection.file.path&&!selectedRecord;
 function action(name:string,label:string,handler:ButtonHTMLAttributes<HTMLButtonElement>['onClick'],disabled=false){return <Button variant="secondary" className="nginx-icon-button" title={t(label)+(kind==='postgresql'&&['start','stop'].includes(name)?' · '+(controlUnit||'PostgreSQL'):'')} aria-label={t(label)} disabled={disabled} onClick={handler}>
<Icon name={name}/>
</Button>;}
 return <div id="package-ide" className="package-config-ide">
<header className="nginx-header">
<div className="nginx-header-identity">
<strong>{title}
</strong>
<span role="status" aria-live="polite" title={displayedService?.unit} className={'nginx-service-status nginx-service-status--'+displayedStatus}>
<span className="nginx-status-dot"/>{kind==='certbot'&&<span>timer · </span>}{kind==='postgresql'&&!selection?.file?t('클러스터 선택 전'):kind==='postgresql'&&displayedService?.SubState==='exited'?t('프로세스 종료'):t(displayedStatus==='active'?'실행 중':displayedStatus==='inactive'?'중지':displayedStatus==='failed'?'실패':'확인 전')}
</span>
</div>
<div className="nginx-header-actions">{action('refresh','새로고침',refresh,busy||!connected)}{action('start','시작',()=>setControl({unit:controlUnit,action:'start',...(kind==='postgresql'?{path:selection?.file?.path}:{})}),busy||!connected||!controlUnit||status==='active'||!featureAllowed(security,'serviceChanges',{sudo:true}))}{action('stop','중지',()=>setControl({unit:controlUnit,action:'stop',...(kind==='postgresql'?{path:selection?.file?.path}:{})}),busy||!connected||!controlUnit||status!=='active'||!featureAllowed(security,'serviceChanges',{sudo:true}))}{action('logs','로그',()=>inspect('logs'),!connected)}{kind==='mariadb'&&action('check','검수',reviewMariaDBCode,!connected||!selectedRecord||!featureAllowed(security,'databaseChanges',{sudo:true}))}{kind==='redis'&&action('check','검수',reviewRedisCode,!connected||!selectedRecord||!featureAllowed(security,'databaseChanges',{sudo:true}))}{['redis','mariadb'].includes(kind)&&<>{action('backup',kind==='redis'?'Redis 백업 조회':'MariaDB 백업 조회',()=>openDatabaseBackups('backups'),!connected)}{action('restore','복원 검토',()=>openDatabaseBackups('restore'),!connected)}</>}{kind==='postgresql'&&<>{action('backup','PostgreSQL 데이터 백업·복원',()=>{if(!selection?.file?.path)return;closePopup();popupContext.current={path:selection.file.path};setPopup('data');},!connected||!selection?.file?.path?.endsWith('/postgresql.conf'))}{!isHba(selection?.file)&&action('check','검수',reviewPostgresqlCode,!connected||!selectedRecord||!selection?.file?.path?.endsWith('/postgresql.conf')||!featureAllowed(security,'databaseChanges',{sudo:true}))}{isHba(selection?.file)&&action('check','검수',()=>inspect('validate'),!connected||record?.sourcePath!==selection.file.path||!featureAllowed(security,'databaseChanges',{sudo:true}))}{isHba(selection?.file)&&action('apply','접속 규칙 적용 검토',()=>inspect('apply'),!connected||record?.sourcePath!==selection.file.path||!featureAllowed(security,'databaseChanges',{sudo:true}))}{action('backup',isHba(selection?.file)?'접속 규칙 백업':'PostgreSQL 백업 조회',()=>inspect('backups'),!connected)}{action('restore','복원 검토',()=>inspect('restore'),!connected)}
</>}
</div>
</header>
<IdeSplitLayout>
<aside className="nginx-tree-panel">
<div className="nginx-tree-title">{kind==='certbot'?'/etc/letsencrypt/live':kind==='redis'?'/etc/redis':kind==='mariadb'?'/etc/mysql':'/etc/postgresql'}
</div>
<div className="nginx-tree-toolbar">
<div className="nginx-tree-search">
<svg viewBox="0 0 24 24" aria-hidden="true">
<circle cx="10" cy="10" r="6"/>
<path d="m15 15 5 5"/>
</svg>
<input type="search" aria-label={t('설정 검색')} placeholder={t('설정 검색')} value={query} onChange={e=>setQuery(e.target.value)}/>
</div>
<Button variant="secondary" className="nginx-tree-icon" title={t('모두 펼치기')} aria-label={t('모두 펼치기')} onClick={()=>{setCollapsed(false);setTreeVersion(v=>v+1);}}>
<Icon name="expand"/>
</Button>
<Button variant="secondary" className="nginx-tree-icon" title={t('모두 접기')} aria-label={t('모두 접기')} disabled={Boolean(query)} onClick={()=>{setCollapsed(true);setTreeVersion(v=>v+1);}}>
<Icon name="collapse"/>
</Button>
</div>
<nav aria-label={title+' '+t('설정')}>{kind==='certbot'&&<button type="button" className="nginx-directive" aria-pressed={selection?.file===null} onClick={()=>choose(null)}>＋ {t('인증서 발급')}
</button>}{filtered.map(file=>
<details key={(file.path||file.name)+':'+treeVersion+':'+query} open={!collapsed||Boolean(query)}>
<summary>
<button type="button" aria-pressed={fileKey(selection?.file)===fileKey(file)&&!selection?.group} title={file.path||file.name} onClick={()=>choose(file)}>▤ {kind==='certbot'?file.name+'/cert.pem':kind==='redis'?(file.path??'').slice('/etc/redis/'.length):kind==='mariadb'?(file.path??'').slice('/etc/mysql/'.length):(file.path??'').split('/').slice(-3).join('/')}
</button>
</summary>
<div className="nginx-branches">{fileGroups(file).map(group=><button type="button" key={'group:'+group} className="nginx-directive" aria-pressed={fileKey(selection?.file)===fileKey(file)&&selection?.group==='group:'+group} onClick={()=>choose(file,'group:'+group)}>{'['+group+']'}</button>)}{kind==='certbot'?<button type="button" className="nginx-directive" onClick={()=>choose(file)}>{t('갱신 테스트 (dry-run)')}
</button>:isHba(file)?<button type="button" className="nginx-directive" onClick={()=>choose(file,'authentication')}>{t('접속 규칙')}</button>:visibleGroups.map(([id,label])=>
<button type="button" key={id} className="nginx-directive" aria-pressed={fileKey(selection?.file)===fileKey(file)&&selection?.group===id} onClick={()=>choose(file,id)}>{t(label)}
</button>)}
</div>
</details>)}{!filtered.length&&<p className="hint">{t(busy?'불러오는 중':'설정 파일이 없습니다.')}
</p>}
</nav>
</aside>
<div className={'nginx-node-inspector'+(view==='code'?' nginx-node-inspector--code':'')}>{selection?unavailableSource?<div className="package-source-failure" role="alert"><strong>{t('설정 파일을 안전하게 읽을 수 없습니다.')}</strong><code>{selection.file?.path}</code><p>{configNotice(sourceFailure.message,t)}</p>{action('refresh','새로고침',()=>choose(selection.file,selection.group),!connected)}</div>:<>
<div className="nginx-inspector-tabs" role="tablist" aria-label={t('설정 보기 방식')}>{(['settings','code'] as const).map(tab=>
<Button variant="secondary" key={tab} role="tab" id={dialogTitle+'-'+tab+'-tab'} aria-controls={dialogTitle+'-'+tab+'-panel'} aria-selected={view===tab} tabIndex={view===tab?0:-1} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?'settings':event.key==='End'?'code':tab==='settings'?'code':'settings';setView(next);event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[id="'+dialogTitle+'-'+next+'-tab"]')?.focus();}} onClick={()=>setView(tab)}>{t(tab==='settings'?'설정':'코드 보기')}
</Button>)}
</div>
<div className="package-ide-settings" role="tabpanel" id={dialogTitle+'-settings-panel'} aria-labelledby={dialogTitle+'-settings-tab'} hidden={view!=='settings'}>{kind==='certbot'?<ServerManager api={api} connected={connected} security={security} requestedTab="certbot" requestedCertificate={certificate} certificatesSnapshot={areCertificateFiles(files)?files:null} onPreview={preview}/>:isHba(selection.file)?(record?.sourcePath===selection.file.path?<PostgreSQLHbaSettings record={record as HbaRecord} onChange={patch} onCode={()=>setView('code')}/>:<p className="hint">{t(error?'접속 규칙을 불러올 수 없습니다.':'접속 규칙을 불러오는 중입니다.')}</p>):kind==='postgresql'&&(!selection.group||selection?.group==='directives')?(selectedRecord?<PostgreSQLSettings record={selectedRecord as FileSettingRecord} onChange={patch} onCode={()=>setView('code')}/>:<p className="hint">{t('불러오는 중')}</p>):kind==='redis'&&(!selection.group||selection?.group==='directives')?(selectedRecord?<RedisSettings record={selectedRecord as FileSettingRecord} onChange={patch} onCode={()=>setView('code')}/>:<p className="hint">{t(error?'설정 파일을 안전하게 읽을 수 없습니다.':'불러오는 중')}</p>):kind==='mariadb'&&(!selection.group||selection?.group==='directives'||selection.group.startsWith('group:'))?(selectedRecord?<MariaDBSettings requestedGroup={selection.group?.startsWith('group:')?selection.group.slice(6):undefined} record={selectedRecord as FileSettingRecord} onChange={patch} onCode={()=>setView('code')}/>:<p className="hint">{t(error?'설정 파일을 안전하게 읽을 수 없습니다.':'불러오는 중')}</p>):['redis','mariadb'].includes(kind)&&!selectedRecord?<p className="hint">{t(error?'설정 파일을 안전하게 읽을 수 없습니다.':'불러오는 중')}</p>:<PackageConfig api={api} connected={connected} security={security} requestedProfile={requestedProfile} requestedConfig={requestedConfig} requestedMain={kind==='mariadb'?(['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(selection?.file?.path??'')?selection?.file?.path:files.some(file=>file.path==='/etc/mysql/my.cnf')?'/etc/mysql/my.cnf':'/etc/mysql/mariadb.cnf'):undefined} codeRevision={parsedCode&&record.text!==record.baseline?record.text:null} controlledDraft={parsedCode?{...configDefaults(kind),...parsedCode.values,...record.guiValues}:undefined} onFieldChange={parsedCode?patchGui:undefined} onResetDraft={parsedCode?resetGui:undefined} onReviewCode={parsedCode?()=>setView('code'):undefined} fieldOrder={parsedCode?Object.keys(parsedCode.values):undefined} fieldKeys={visibleGroups.find(item=>item[0]===selection.group)?.[2]?.length?visibleGroups.find(item=>item[0]===selection.group)?.[2]:undefined} onInvalidate={()=>patch({stale:true})} onOpen={item=>{openCode(item);setView('code');}}/>}
</div><div className="package-ide-code" role="tabpanel" id={dialogTitle+'-code-panel'} aria-labelledby={dialogTitle+'-code-tab'} hidden={view!=='code'}>{view==='code'&&(selectedRecord?<ConfigCodeEditor record={selectedRecord} api={api} connected={connected} security={security} onChange={patch} guiSynchronized={Boolean(configKind&&selectedRecord?.sourcePath&&selectedRecord.sourcePath===selection?.file?.path)} onHide={()=>setView('settings')}/>:<div className="nginx-tree-empty">
<p>{t('생성한 설정 검토')}
</p>
</div>)}</div>
</>:<div className="nginx-tree-empty">
<p>{t('왼쪽 노드를 선택하세요.')}
</p>
</div>}
</div>
</IdeSplitLayout>{error&&!unavailableSource&&<ToastNotice message={configNotice(error,t)} kind={'error'}/>}{pending?.kind===kind&&<div role="alertdialog" className="config-reset-confirm" aria-label={t('코드 초안 교체 확인')}>
<p>{t('편집 중인 코드를 새 GUI 초안으로 바꿀까요?')}
</p>
<Button variant="secondary" onClick={keepCode}>{t('편집한 코드 유지')}
</Button>
<Button onClick={()=>{if(pending?.kind!==kind)return;const {previousSelection,...next}=pending;setRecords(previous=>({...previous,[kind]:next}));setPending(null);}}>{t('새 초안으로 교체')}
</Button>
</div>}{control&&<div role="alertdialog" className="config-reset-confirm">
<p>{control.unit} · {t(control.action==='start'?'시작':'중지')}
</p>
<Button variant="secondary" onClick={()=>setControl(null)}>{t('취소')}
</Button>
<Button disabled={busy||!featureAllowed(security,'serviceChanges',{sudo:true})} onClick={confirmControl}>{t('확인')}
</Button>
</div>}
<dialog ref={dialog} className="nginx-operation-dialog" aria-labelledby={dialogTitle} onCancel={event=>{event.preventDefault();closePopup();}} onClose={()=>{if(ignoredCloseEvents.current){ignoredCloseEvents.current--;return;}if(!dialog.current?.open)closePopup();}}>
<header>
<strong id={dialogTitle}>{t(popup==='data'?'PostgreSQL 데이터 백업·복원':popup==='postgresql-code'?'PostgreSQL 코드 검수 및 적용 검토':popup==='mariadb-code'?'MariaDB 코드 검수 및 적용 검토':popup==='redis-code'?'Redis 코드 검수 및 적용 검토':popup==='apply'?(popupContext.current?.operationInput?.backupId?'접속 규칙 복원 검토':'접속 규칙 적용 검토'):popup==='validate'?'접속 규칙 검수':popup==='logs'?'로그':popupContext.current?.hba?'접속 규칙 백업':popup==='restore'?'복원 검토':kind==='redis'?'Redis 백업 조회':kind==='mariadb'?'MariaDB 백업 조회':'PostgreSQL 백업 조회')}
</strong>
<Button variant="secondary" onClick={closePopup}>{t('닫기')}
</Button>
</header>{invalidPopupInput&&<p role="alert">{t('운영 설정을 다시 조회하세요.')}</p>}{popupLoading&&<p role="status">{t('불러오는 중')}</p>}{popupText&&<pre className="manager-preview" dir="ltr">{popupText}
</pre>}{popup==='data'&&popupContext.current?.path&&<PostgreSQLDataBackups path={popupContext.current.path} api={api} connected={connected} security={security}/>} {popup==='apply'&&isHbaInput(popupContext.current?.operationInput)&&<PostgreSQLHbaOperation input={popupContext.current.operationInput} api={api} connected={connected} security={security} onApplied={hbaApplied}/>}
{popup==='restore'&&kind==='postgresql'&&!popupContext.current?.hba&&<PostgreSQLCodeRecovery api={api} connected={connected} security={security} initialPath={popupContext.current?.path||''} onRecovered={refresh}/>}
{popup==='restore'&&kind==='postgresql'&&!popupContext.current?.hba&&<PostgreSQLCompletedHistory path={popupContext.current?.path||''} api={api} connected={connected} security={security} onReviewBackup={setRestoreId}/>}
{popup==='postgresql-code'&&isCodeInput(popupContext.current?.operationInput)&&<PostgreSQLCodeOperation input={popupContext.current.operationInput} api={api} connected={connected} security={security} onApplied={redisCodeApplied}/>}
{popup==='mariadb-code'&&isMariaCodeInput(popupContext.current?.operationInput)&&<MariaDBCodeOperation input={popupContext.current.operationInput} api={api} connected={connected} security={security} onApplied={redisCodeApplied}/>}
{popup==='redis-code'&&isCodeInput(popupContext.current?.operationInput)&&<RedisCodeOperation input={popupContext.current.operationInput} api={api} connected={connected} security={security} onApplied={redisCodeApplied}/>}
{['backups','restore'].includes(popup??'')&&kind==='redis'&&<RedisBackups api={api} connected={connected} security={security} onRestored={selectedConfigRestored} onBackup={popup==='backups'&&popupContext.current?.path&&(popupContext.current.path==='/etc/redis/redis.conf')?backupSelectedDatabaseFile:undefined}/>}
{['backups','restore'].includes(popup??'')&&kind==='mariadb'&&<MariaDBBackups api={api} connected={connected} security={security} onRestored={selectedConfigRestored} onBackup={popup==='backups'&&popupContext.current?.path?backupSelectedDatabaseFile:undefined}/>}
{kind==='postgresql'&&popup!=='data'&&popup!=='postgresql-code'&&popup!=='mariadb-code'&&popup!=='redis-code'&&popup!=='logs'&&popup!=='validate'&&popup!=='apply'&&<>{popupContext.current?.hba&&<><p className="hint">{popupContext.current.path} · {t('백업을 코드 초안으로 불러옵니다. 운영 파일은 변경하지 않습니다.')}</p><Button variant="secondary" disabled={popupLoading||!featureAllowed(security,'databaseChanges',{sudo:true})} onClick={backupSelectedFile}>{t('현재 파일 백업')}</Button></>}{popup==='backups'&&popupContext.current?.path&&!popupContext.current?.hba&&action('backup','현재 파일 백업',backupSelectedFile,popupLoading||!featureAllowed(security,'databaseChanges',{sudo:true}))}{!popupLoading&&!backups.length&&!popupText&&<p>{t('설정 백업이 없습니다.')}
</p>}{backups.map(item=>
<div className="live-site" key={item.id}>
<strong>{item.target}
</strong>
<p>{item.createdAt} · {item.id}
</p>
<Button variant="secondary" disabled={popupLoading} onClick={()=>popupContext.current?.hba?reviewHbaBackup(item):setRestoreId(item.id)}>{t(popupContext.current?.hba?'코드 초안으로 불러오기':'복원 검토')}
</Button>{popupContext.current?.hba&&<Button variant="secondary" disabled={popupLoading||!featureAllowed(security,'databaseChanges',{sudo:true})} onClick={()=>reviewHbaRestore(item)}>{t('접속 규칙 복원 검토')}</Button>}
</div>)}{restoreId&&!popupContext.current?.hba&&<PostgreSQLRestore onRestored={selectedConfigRestored} onReviewBackup={setRestoreId} id={restoreId} expectedPath={popupContext.current?.path} api={api} connected={connected} security={security} onClose={()=>setRestoreId(null)}/>}
</>}
</dialog>
</div>;
}
