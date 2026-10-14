export type MessageCatalog=Readonly<Record<string,string>>;
export type InterpolationValues=Readonly<Record<string,unknown>>;
const entry=(catalog:MessageCatalog,key:string)=>Object.hasOwn(catalog,key)&&typeof catalog[key]==='string'?catalog[key]:undefined;
import linuxLanguages from './locales/linux-languages.json' with {type:'json'};
export const languages=linuxLanguages;
const localeFlags=new Map(languages.map(item=>[item.id,item.flag]));
export function resolveLocale(value:unknown){const input=String(value||'').replace(/\..*$/,'').replaceAll('_','-');try{const id=Intl.getCanonicalLocales(input)[0];if(languages.some(item=>item.id===id))return id;const base=id.split('-')[0];return languages.find(item=>item.id===base)?.id||languages.find(item=>item.id.split('-')[0]===base)?.id||'en';}catch{return 'en';}}
export function formatNumber(locale:string|string[]|undefined,value:number|bigint){return new Intl.NumberFormat(locale).format(value);}
export function formatDate(locale:string|string[]|undefined,value:string|number|Date){return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value instanceof Date?value.getTime():value));}
export function localeFlag(locale:unknown){return typeof locale==='string'?localeFlags.get(locale)||'🌐':'🌐';}
// Preserve case-insensitive identifiers while respecting localized prose.
export function matchesLocalizedText(locale:unknown,text:unknown,query:unknown){
 const value=String(text),needle=String(query);
 if(value.toLowerCase().includes(needle.toLowerCase()))return true;
 const language=resolveLocale(locale);
 return value.toLocaleLowerCase(language).includes(needle.toLocaleLowerCase(language));
}

const diagnosticWrappers=[
  ['운영 설정을 조회할 수 없습니다. ','운영 설정을 조회할 수 없습니다. {detail}'],
  ['현재 사용자 crontab을 읽을 수 없습니다: ','현재 사용자 crontab을 읽을 수 없습니다: {detail}'],
  ['로그 조회 권한 또는 서비스 상태를 확인하세요: ','로그 조회 권한 또는 서비스 상태를 확인하세요: {detail}'],
  ['crontab 조회 실패: ','crontab 조회 실패: {detail}'],
  ['요청 처리 실패: ','요청 처리 실패: {detail}'],
  ['관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. ','관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. {detail}'],
 ];

// Only recognize messages produced by the package profile validators. Do not rewrite
// arbitrary stderr, user-supplied names, paths or provider responses.
const profileIntegerBounds=new Map([
 ['포트','1~65535'],['최대 연결 수','1~10000'],['공유 버퍼','16~65536'],
 ['작업 메모리','1~4096'],['InnoDB 버퍼 풀','16~65536'],
 ['느린 쿼리 기준','1~3600'],['Redis 메모리','0~65536'],
 ['Node 메모리','64~65536'],
]);
const profileChoiceLabels=new Set(['문자셋','제거 정책','AOF 동기화','로그 파일 수집','느린 쿼리 로그','AOF 지속성','실행 환경','앱 수신 주소','로그 수준','작업','테스트 인증서 사용','발급 후 nginx HTTPS 자동 연계']);
function profileDiagnostic(text:string,catalog:MessageCatalog,english:MessageCatalog){
 const range=/^(.+): ([0-9]+)~([0-9]+) 범위의 정수를 입력하세요\.$/.exec(text);
 const choice=/^(.+) 값을 확인하세요\.$/.exec(text);
 if(range&&profileIntegerBounds.get(range[1])===range[2]+'~'+range[3]){
  const template=entry(catalog,'{label}: {min}~{max} 범위의 정수를 입력하세요.')??entry(english,'{label}: {min}~{max} 범위의 정수를 입력하세요.');
  const label=entry(catalog,range[1])??entry(english,range[1]);
  if(typeof template==='string'&&typeof label==='string'){
   const parameters:Record<string,string>={label,min:range[2],max:range[3]};
   return template.replace(/\{(label|min|max)\}/g,(_,name)=>parameters[name]);
  }
 }else if(choice&&profileChoiceLabels.has(choice[1])){
  const template=entry(catalog,'{label} 값을 확인하세요.')??entry(english,'{label} 값을 확인하세요.');
  const label=entry(catalog,choice[1])??entry(english,choice[1]);
  if(typeof template==='string'&&typeof label==='string')return template.replace(/\{label\}/g,()=>label);
 }
}

export function translateWithCatalog<T>(locale:unknown,text:T,values?:InterpolationValues|null,catalog:MessageCatalog={},english:MessageCatalog={}):T|string{
 if(typeof text!=='string')return text;
 const base=String(locale).split('-')[0],trimmed=text.trim();
 let translated=base==='ko'?undefined:entry(catalog,trimmed)??entry(english,trimmed);
 // The legacy API keeps a single error string. Translate its known wrapper
 // and known diagnostic separately; arbitrary paths/provider text stay intact.
 if(base!=='ko'&&translated===undefined){
  translated=profileDiagnostic(trimmed,catalog,english);
 }
 if(base!=='ko'&&translated===undefined){
  for(const [prefix,key] of diagnosticWrappers){
   if(!trimmed.startsWith(prefix))continue;
   const template=entry(catalog,key)??entry(english,key),detail=trimmed.slice(prefix.length);
   if(detail&&typeof template==='string'&&template.includes('{detail}')){
    const localizedDetail=entry(catalog,detail)??entry(english,detail)??profileDiagnostic(detail,catalog,english)??detail;
    translated=template.replace('{detail}',()=>localizedDetail);
   }
   break;
  }
 }
 // Match only paths and field identifiers emitted by the configuration readers.
 // Paths, identifiers and unrelated text remain byte-for-byte unchanged.
 if(base!=='ko'&&translated===undefined){
  const warning=/^([^\r\n]+): (설정 목록을 읽을 수 없습니다\.|설정 파일을 안전하게 읽을 수 없습니다\.|GUI에서 지원하는 값으로 읽을 수 없습니다\.)$/.exec(trimmed);
  if(warning){
   const [,target,detail]=warning;
   const configPath=/^\/etc\/(?:redis\/redis\.conf|mysql\/(?:my\.cnf|mariadb\.cnf|(?:mariadb\.conf\.d|conf\.d)(?:\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*\.cnf)?)|postgresql\/[0-9]+\/[a-zA-Z0-9_-]+\/(?:postgresql|pg_hba)\.conf)$/.test(target);
   const field=/^(?:port|connections|sharedBuffers|workMem|logging|bufferPool|charset|slowLog|slowSeconds|maxMemory|eviction|appendOnly|fsync)$/.test(target);
   if((configPath&&detail!=='GUI에서 지원하는 값으로 읽을 수 없습니다.')||(field&&detail==='GUI에서 지원하는 값으로 읽을 수 없습니다.')){
    const local=entry(catalog,detail)??entry(english,detail);
    if(typeof local==='string')translated=target+': '+local;
   }
  }
 }
 // Preserve canonical directory names in legacy nginx tree warnings.
 if(base!=='ko'&&translated===undefined){
  const warning=/^(conf\.d|sites-available|sites-enabled|snippets): (.+)$/.exec(trimmed);
  if(warning){
   const [,group,detail]=warning,limit=/^처음 ([0-9]+)개 파일만 표시합니다\.$/.exec(detail);
   const template=entry(catalog,'{group}: 처음 {count}개 파일만 표시합니다.')??entry(english,'{group}: 처음 {count}개 파일만 표시합니다.');
   if(limit&&typeof template==='string'&&template.includes('{group}')&&template.includes('{count}'))translated=template.replace('{group}',()=>group).replace('{count}',()=>limit[1]);
   else if(entry(catalog,detail)??entry(english,detail))translated=group+': '+(entry(catalog,detail)??entry(english,detail));
  }
 }
 const result=translated===undefined?text:text.replace(trimmed,()=>translated);
 return values?result.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(placeholder,key)=>Object.hasOwn(values,key)&&values[key]!=null?String(values[key]):placeholder):result;
}
