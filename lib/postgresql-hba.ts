export type HbaValues = {type: string; database: string; user: string; address: string; method: string; options: string};
type HbaPosition = {line: number; start: number; end: number; raw: string; comment?: string};
export type HbaRule = HbaPosition & HbaValues & {kind: 'rule'};
export type HbaEntry = HbaRule | (HbaPosition & {kind: 'raw'}) | (HbaPosition & {kind: 'include'; target: string});
// Structural draft editor only. PostgreSQL native inspection is still required
// before an operational reload; include targets are never read by this parser.
export const hbaTypes=['local','host','hostssl','hostnossl','hostgssenc','hostnogssenc'];
export const hbaMethods=['trust','reject','scram-sha-256','md5','password','gss','sspi','ident','peer','ldap','radius','cert','pam','bsd','oauth'];
function tokens(text: string){let quote=false,start: number | null=null,items: string[]=[],comment='';for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(start===null)start=i;if(quote&&text[i+1]==='"'){i++;continue;}quote=!quote;}else if(c==='#'&&!quote){if(start!==null)items.push(text.slice(start,i));comment=text.slice(i);start=null;break;}else if(/\s/.test(c)&&!quote){if(start!==null){items.push(text.slice(start,i));start=null;}}else if(start===null)start=i;}if(quote)throw Error('따옴표를 확인하세요.');if(start!==null)items.push(text.slice(start));return {items,comment};}
export function parsePostgresqlHba(source: unknown): HbaEntry[]{
 if(typeof source!=='string'||source.includes('\0')||source.length>262144)throw Error('접속 규칙 코드 크기와 내용을 확인하세요.');
 const entries: HbaEntry[]=[];let start=0,line=1,continued=false;
 for(const raw of source.split(/(?<=\n)/)){const body=raw.replace(/\r?\n$/,''),end=start+raw.length;if(continued){if(body.trim())entries.push({line,start,end,raw,kind:'raw'});continued=body.trimEnd().endsWith('\\');start=end;line++;continue;}continued=body.trimEnd().endsWith('\\');try{
 const {items,comment}=tokens(body);if(items.length){const type=items[0];let entry: HbaEntry={line,start,end,raw,comment,kind:'raw'};
 if(['include','include_if_exists','include_dir'].includes(type)&&items.length===2)entry={...entry,kind:'include',target:items[1]};
 else if(hbaTypes.includes(type)&&!body.trimEnd().endsWith('\\')){const local=type==='local';let methodAt=local?3:4;if(!local&&items.length>5&&!hbaMethods.includes(items[4])&&hbaMethods.includes(items[5]))methodAt=5;if(items.length>methodAt&&hbaMethods.includes(items[methodAt]))entry={...entry,kind:'rule',type,database:items[1],user:items[2],address:local?'':items.slice(3,methodAt).join(' '),method:items[methodAt],options:items.slice(methodAt+1).join(' ')};}
 entries.push(entry);}
 }catch{if(body.trim())entries.push({line,start,end,raw,kind:'raw'});}start=end;line++;}
 return entries;
}
function ruleText(values: HbaValues){
 for(const key of ['type','database','user','address','method','options'] as const)if(typeof values[key]!=='string'||/[\r\n\0]/.test(values[key]))throw Error('한 줄의 접속 규칙을 입력하세요.');
 const text=[values.type,values.database,values.user,...(values.type==='local'?[]:[values.address]),values.method,values.options].filter(Boolean).join(' '),parsed=parsePostgresqlHba(text);
 const rule=parsed[0];if(parsed.length!==1||rule?.kind!=='rule')throw Error('접속 규칙 필드와 인용부호를 확인하세요.');if((['type','database','user','method','options'] as const).some(key=>rule[key]!==values[key].trim())||(values.type!=='local'&&rule.address!==values.address.trim())||rule.comment)throw Error('접속 규칙 필드와 인용부호를 확인하세요.');return text;
}
export function updatePostgresqlHba(source: string,line: number,values: HbaValues){const entry=parsePostgresqlHba(source).find(item=>item.line===line);if(entry?.kind!=='rule')throw Error('편집할 접속 규칙을 다시 선택하세요.');const indent=/^\s*/.exec(entry.raw)![0],eol=entry.raw.endsWith('\r\n')?'\r\n':entry.raw.endsWith('\n')?'\n':'';return source.slice(0,entry.start)+indent+ruleText(values)+(entry.comment?' '+entry.comment:'')+eol+source.slice(entry.end);}
export function appendPostgresqlHba(source: string,values: HbaValues){parsePostgresqlHba(source);const eol=source.includes('\r\n')?'\r\n':'\n';return source+(source&&!source.endsWith('\n')?eol:'')+ruleText(values)+eol;}
export function removePostgresqlHba(source: string,line: number){const entry=parsePostgresqlHba(source).find(item=>item.line===line);if(entry?.kind!=='rule')throw Error('삭제할 접속 규칙을 다시 선택하세요.');return source.slice(0,entry.start)+source.slice(entry.end);}
export function movePostgresqlHba(source: string,line: number,direction: string){const entries=parsePostgresqlHba(source),index=entries.findIndex(item=>item.line===line),other=index+(direction==='up'?-1:direction==='down'?1:0),a=entries[Math.min(index,other)],b=entries[Math.max(index,other)];if(index<0||index===other||a?.kind!=='rule'||b?.kind!=='rule')throw Error('인접한 접속 규칙 안에서만 이동할 수 있습니다.');const eol=source.includes('\r\n')?'\r\n':'\n';const first=b.raw.endsWith('\n')?b.raw:b.raw+eol,last=a.raw.replace(/\r?\n$/,'')+(b.raw.endsWith('\r\n')?'\r\n':b.raw.endsWith('\n')?'\n':'');return source.slice(0,a.start)+first+source.slice(a.end,b.start)+last+source.slice(b.end);}

const diagnosticMessages: Readonly<Record<string,string>>=Object.freeze({
 'invalid-method':'인증 방식이 올바르지 않습니다. 인증 방식 이름과 PostgreSQL 지원 버전을 확인하세요.',
 'invalid-address':'접속 주소가 올바르지 않습니다. IP 주소, CIDR 접두 길이와 넷마스크를 확인하세요.',
 'invalid-option':'인증 옵션이 올바르지 않습니다. 선택한 인증 방식에서 지원하는 옵션과 값을 확인하세요.',
 'missing-include':'포함 파일을 읽을 수 없습니다. 파일 경로와 읽기 권한을 확인하세요.',
 'invalid-rule':'접속 규칙이 올바르지 않습니다. 연결 유형, 데이터베이스, 사용자, 주소와 인증 방식의 순서를 확인하세요.',
 'cycle-or-limit':'포함 파일이 순환 참조되거나 탐색 한도를 초과했습니다. 포함 경로와 중첩 깊이를 확인하세요.',
 'missing-file':'포함 파일이 없습니다. 파일 경로와 파일 존재 여부를 확인하세요.',
 'unsafe-or-unreadable':'설정 파일을 안전하게 읽을 수 없습니다. 경로, 파일 형식과 읽기 권한을 확인하세요.',
 'token-limit':'접속 규칙의 항목 수가 검사 한도를 초과했습니다. 포함 목록의 크기를 확인하세요.',
 'unsafe-list-reference':'사용자 또는 데이터베이스 목록 파일의 참조 경로가 허용되지 않습니다. 목록 파일 경로를 확인하세요.',
 'missing-directory':'포함 디렉터리가 없습니다. 디렉터리 경로와 존재 여부를 확인하세요.',
 'unsafe-include-reference':'설정 포함 경로가 허용되지 않습니다. 포함 파일 또는 디렉터리 경로를 확인하세요.',
 'changed-during-inspection':'검사 중 설정 파일이 변경되었습니다. 파일을 다시 불러온 뒤 검수하세요.',
 'directory-changed':'검사 중 포함 디렉터리의 파일 목록이 변경되었습니다. 다시 불러온 뒤 검수하세요.',
 'optional-file-appeared':'검사 중 선택적 포함 파일이 새로 생성되었습니다. 다시 불러온 뒤 검수하세요.',
 'optional-file-unreadable':'선택적 포함 파일의 상태를 확인할 수 없습니다. 파일 경로와 읽기 권한을 확인하세요.'
});
export function postgresqlHbaDiagnosticMessage(category: string){
 return Object.hasOwn(diagnosticMessages,category)?diagnosticMessages[category]:'접속 규칙을 검수하지 못했습니다. 설정 파일을 다시 불러오고 서버 검사 로그를 확인하세요.';
}

export function retainPostgresqlHbaInputs<T>(previousText: string,text: string,inputs: Record<string,T>={}): Record<string,T>{
 const oldRows=parsePostgresqlHba(previousText).filter(row=>row.kind==='rule'),rows=parsePostgresqlHba(text).filter(row=>row.kind==='rule'),next: Record<string,T>={};
 for(const [key,input] of Object.entries(inputs)){
  if(!input||typeof input!=='object'||!('raw' in input)||typeof input.raw!=='string')continue;
  if(key==='$hba:new'){next[key]=input;continue;}
  const old=oldRows.find(row=>row.line+':hba'===key&&row.raw===input.raw);if(!old)continue;
  const oldMatches=oldRows.filter(row=>row.raw===old.raw),matches=rows.filter(row=>row.raw===old.raw);if(oldMatches.length!==matches.length)continue;
  const exact=matches.find(row=>row.line===old.line),moved=oldMatches.length===1&&matches.length===1?matches[0]:null,target=exact??moved;
  if(target)next[target.line+':hba']=input;
 }
 return next;
}
