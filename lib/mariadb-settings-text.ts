import type {SettingIdentity,SettingRowBase} from './postgresql-settings-text.ts';
export type MariaDBSettingRow = SettingRowBase & {spacing: string; group: string; groupLine: number; flag: boolean; include: boolean; sensitive: boolean};
// File-local option syntax. Effective groups, versions and option semantics require MariaDB.
const fail: (message: string) => never = message=>{throw Error(message);};
function check(text: unknown): asserts text is string{
 if(typeof text!=='string'||text.includes('\0')||/\r(?!\n)/.test(text))fail('설정 파일 내용을 확인하세요.');
 if(text.length>262144||new TextEncoder().encode(text).length>262144)fail('설정 파일은 256 KiB 이하만 편집할 수 있습니다.');
}
function commentOffset(value: string){let quote='',escaped=false;for(let index=0;index<value.length;index++){const ch=value[index];if((ch==='"'||ch==="'")&&!escaped){if(!quote)quote=ch;else if(quote===ch)quote='';}if(!quote&&ch==='#')return index;escaped=Boolean(quote&&ch==='\\'&&!escaped);}return value.length;}
export function mariadbValueValid(value: unknown): value is string{if(typeof value!=='string'||/[\0\r\n]/.test(value)||commentOffset(value)!==value.length)return false;let quote='',escaped=false;for(const ch of value){if((ch==='"'||ch==="'")&&!escaped){if(!quote)quote=ch;else if(quote===ch)quote='';}escaped=Boolean(quote&&ch==='\\'&&!escaped);}return !quote;}
const includeName=(name: string)=>/^!include(?:dir)?$/.test(name)||name==='?includedir';
export function parseMariaDBSettings(text: unknown): MariaDBSettingRow[]{
 check(text);const rows: MariaDBSettingRow[]=[],lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];let group='',groupLine=0;
 for(let index=0;index<lines.length;index++){
  const raw=lines[index],ending=raw.endsWith('\r\n')?'\r\n':raw.endsWith('\n')?'\n':'',body=ending?raw.slice(0,-ending.length):raw;
  const header=/^[ \t]*\[([^\]\r\n]+)\]/.exec(body);if(header){group=header[1].trim();groupLine=index+1;continue;}
  const match=/^([ \t]*)([#;][ \t]*)?([!?]includedir|!include|[A-Za-z][A-Za-z0-9_.-]*)(.*)$/.exec(body);if(!match)continue;
  const name=match[3],include=includeName(name),rest=match[4],enabled=!match[2];
  if(!group&&!include)continue;
  let separator='',value='',comment='',spacing='',flag=false;
  if(include){const arg=/^([ \t]+)(.*)$/.exec(rest);if(!arg)continue;separator=arg[1];value=arg[2];}
  else{const assignment=/^([ \t]*=[ \t]*)(.*)$/.exec(rest);if(assignment){separator=assignment[1];value=assignment[2];}else{if(rest.trim()&&!rest.trim().startsWith('#'))continue;flag=true;value=rest;}}
  const offset=commentOffset(value),before=value.slice(0,offset);comment=value.slice(offset);spacing=before.slice(before.trimEnd().length);value=before.trim();
  if(flag){spacing=before;value='';}
  if(!enabled&&flag&&!/^[#;][A-Za-z]/.test(match[2]+name)&&! /^(skip|disable|enable|loose)[_-]/i.test(name)&&!['ssl','general-log','log-bin','log-slow-queries'].includes(name.toLowerCase().replaceAll('_','-')))continue;
  if(!enabled&&!mariadbValueValid(value))continue;
  rows.push({line:index+1,raw,ending,indent:match[1],commentPrefix:match[2]||'',name,separator,value,comment,spacing,enabled,group,groupLine,flag,include,valid:mariadbValueValid(value)&&(!include||!enabled||Boolean(value)),sensitive:/(?:^|[_-])(?:password|passwd|secret)(?:$|[_-])/i.test(name)});
 }
 return rows;
}
export function updateMariaDBSetting(text: unknown,entry: SettingIdentity,{value=entry.value,enabled=entry.enabled}: {value?: unknown; enabled?: unknown}={}){
 check(text);if(!entry||typeof enabled!=='boolean'||!mariadbValueValid(value))fail('설정값을 확인하세요.');
 const current=parseMariaDBSettings(text).find(item=>item.line===entry.line&&item.raw===entry.raw&&item.groupLine===entry.groupLine);if(!current)fail('설정이 변경되었습니다. 다시 확인하세요.');
 const row=current;
 if(value===row.value&&enabled===row.enabled)return text;
 const trimmed=value.trim();if(!row.flag&&enabled&&!trimmed)enabled=false;
 const separator=row.flag?(trimmed?' = ':''):row.separator;
 const lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];
 lines[entry.line-1]=row.indent+(enabled?'':row.flag?'#':row.commentPrefix||'# ')+row.name+separator+trimmed+(row.comment?(row.spacing||' ')+row.comment:'')+row.ending;
 const result=lines.join('');check(result);return result;
}
export function appendMariaDBSetting(text: unknown,name: unknown,value: unknown,group='mariadbd',flag=false){
 check(text);if(typeof name!=='string'||!(/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name)||includeName(name))||!mariadbValueValid(value)||typeof group!=='string'||! /^[A-Za-z0-9_.-]+$/.test(group))fail('설정값을 확인하세요.');
 if(typeof flag!=='boolean'||flag&&(value.trim()||includeName(name)))fail('설정값을 확인하세요.');
 const newline=text.includes('\r\n')?'\r\n':'\n',trimmed=value.trim(),line=flag?name+newline:(trimmed?'':'# ')+name+(includeName(name)?' ':' = ')+trimmed+newline;
 const lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];let start=-1,end=lines.length;
 for(let index=0;index<lines.length;index++){const header=/^[ \t]*\[([^\]\r\n]+)\]/.exec(lines[index]);if(!header)continue;if(header[1].trim()===group){start=index;end=lines.length;}else if(start!==-1&&end===lines.length)end=index;}
 let result;if(start===-1)result=text+(text&&!text.endsWith('\n')?newline:'')+'['+group+']'+newline+line;else{const before=lines.slice(0,end).join(''),after=lines.slice(end).join('');result=before+(before&&!before.endsWith('\n')?newline:'')+line+after;}
 check(result);return result;
}
