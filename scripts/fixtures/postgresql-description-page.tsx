'use client';
import {useState} from 'react';
import FileSettings from '../../components/file-settings';
import HbaSettings from '../../components/postgresql-hba-settings';
import {useLanguage} from '../../components/language-provider';
import type {FileSettingRecord,HbaRecord} from '../../components/file-editor-types';

const settingsText="port = 5432\nlogging_collector = on\nwork_mem = '4MB'\nrow_security = on\nssl = off\nwal_level = replica\nvacuum_max_eager_freeze_failure_rate = 0.03\nmaintenance_io_concurrency = 10\nunix_socket_permissions = 0777\narchive_mode = off\n";
const hbaText='local all all peer\nhostssl all all 127.0.0.1/32 scram-sha-256\n';
export default function DescriptionFixture(){
 const {locale,setLocale,pending}=useLanguage();
 const [mode,setMode]=useState<'settings'|'hba'>('settings');
 const [record,setRecord]=useState<FileSettingRecord>({text:settingsText});
 const [hba,setHba]=useState<HbaRecord>({text:hbaText});
 const unchanged=record.text===settingsText&&hba.text===hbaText;
 return <main>
  <h1>PostgreSQL 다국어 설명 검사</h1>
  <p>전용 예제만 표시합니다. 서버 파일·데이터베이스·API에 연결하지 않습니다.</p>
  <nav aria-label="검수 언어">
   {["ko","ar","bg","ca","cs","da","de","el","en","es","fi","fr","hi","hu","id","it","ja","nb","nl","pl","pt","ro","ru","sk","sv","tr","uk","vi","zh"].map(language=><button key={language} disabled={pending} aria-pressed={locale===language} onClick={()=>void setLocale(language)}>{language}</button>)}
  </nav>
  <nav aria-label="검수 화면"><button onClick={()=>setMode('settings')}>설정</button><button onClick={()=>setMode('hba')}>접속 규칙</button></nav>
  <output aria-label="검수 상태">{locale} · {unchanged?'원본 유지':'예제 변경'}</output>
  {mode==='settings'?<FileSettings record={record} onChange={change=>setRecord(previous=>({...previous,...change}))}/>:<HbaSettings record={hba} onChange={change=>setHba(previous=>({...previous,...change}))} onCode={()=>{}}/>}
 </main>;
}
