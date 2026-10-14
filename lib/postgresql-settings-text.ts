export type SettingIdentity = {line: number; raw: string; value: string; enabled: boolean; groupLine?: number};
export type SettingRowBase = SettingIdentity & {name: string; ending: string; indent: string; commentPrefix: string; separator: string; comment: string; valid: boolean; group?: string; flag?: boolean; sensitive?: boolean};
export type PostgresqlSettingRow = SettingRowBase & {spacing: string};
// File-local syntax only. Effective values and parameter types require PostgreSQL.
const fail: (message: string) => never = message=>{throw new Error(message);};
// PostgreSQL's sample preamble documents syntax and units as assignments.
// Match those exact commented examples; custom parameters remain editable.
const sampleAssignments=new Map([['name','value'],['B','bytes'],['kB','kilobytes'],['MB','megabytes'],['GB','gigabytes'],['TB','terabytes'],['us','microseconds'],['ms','milliseconds'],['s','seconds'],['min','minutes'],['h','hours'],['d','days']]);
function checkText(text: unknown): asserts text is string{
 if(typeof text!=='string'||text.includes('\0')||/\r(?!\n)/.test(text))fail('설정 파일 내용을 확인하세요.');
 if(text.length>262144||new TextEncoder().encode(text).length>262144)fail('설정 파일은 256 KiB 이하만 편집할 수 있습니다.');
}
function commentOffset(value: string){let quoted=false;for(let i=0;i<value.length;i++){const ch=value[i];if(quoted&&ch==='\\'){i++;continue;}if(ch==="'"){if(quoted&&value[i+1]==="'"){i++;continue;}quoted=!quoted;}else if(ch==='#'&&!quoted)return i;}return value.length;}
export function postgresqlValueValid(value: unknown): value is string{
 if(typeof value!=='string'||/[\0\r\n]/.test(value))return false;
 const text=value.trim();if(!text)return true;
 if(text[0]!=="'")return /^[A-Za-z0-9_.+\-]+$/.test(text);
 for(let i=1;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==="'"){if(text[i+1]==="'"){i++;continue;}return i===text.length-1;}}
 return false;
}
export function parsePostgresqlSettings(text: unknown): PostgresqlSettingRow[]{
 checkText(text);const rows: PostgresqlSettingRow[]=[];
 const lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];
 for(let index=0;index<lines.length;index++){
  const raw=lines[index],ending=raw.endsWith('\r\n')?'\r\n':raw.endsWith('\n')?'\n':'',body=ending?raw.slice(0,-ending.length):raw;
  const match=/^(\s*)(#\s*)?([A-Za-z_][A-Za-z0-9_.]*)(\s*=\s*|\s+)(.*)$/.exec(body);
  // Comment headings are not directives; only commented assignments are editable.
  if(!match||match[2]&&!match[4].includes('='))continue;
  const offset=commentOffset(match[5]),before=match[5].slice(0,offset),value=before.trim(),spacing=before.slice(before.trimEnd().length),comment=match[5].slice(offset);
  if(match[2]&&sampleAssignments.get(match[3])===value&&!comment)continue;
  if(match[2]&&!postgresqlValueValid(value))continue;
  rows.push({line:index+1,raw,ending,indent:match[1],commentPrefix:match[2]||'',name:match[3],separator:match[4],value,comment,spacing,enabled:!match[2],valid:postgresqlValueValid(value)});
 }
 return rows;
}
export function updatePostgresqlSetting(text: unknown,entry: SettingIdentity,{value=entry.value,enabled=entry.enabled}: {value?: unknown; enabled?: unknown}={}){
 checkText(text);if(!entry||typeof enabled!=='boolean'||!postgresqlValueValid(value))fail('설정값을 확인하세요.');
 const current=parsePostgresqlSettings(text).find(item=>item.line===entry.line&&item.raw===entry.raw);
 if(!current)fail('설정이 변경되었습니다. 다시 확인하세요.');
 const row=current;
 const trimmed=value.trim();if(enabled&&!trimmed)enabled=false;
 const lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];
 lines[entry.line-1]=row.indent+(enabled?'':row.commentPrefix||'# ')+row.name+row.separator+trimmed+(row.comment?(trimmed?(row.spacing||' '):'')+row.comment:'')+row.ending;
 const result=lines.join('');checkText(result);return result;
}
export function appendPostgresqlSetting(text: unknown,name: unknown,value: unknown){
 checkText(text);if(typeof name!=='string'||!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(name)||!postgresqlValueValid(value))fail('설정값을 확인하세요.');
 const newline=text.includes('\r\n')?'\r\n':'\n',trimmed=value.trim();
 const result=text+(text&&!text.endsWith('\n')?newline:'')+(trimmed?'':'# ')+name+' = '+trimmed+newline;
 checkText(result);return result;
}
