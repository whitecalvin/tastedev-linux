import type {SettingIdentity,SettingRowBase} from './postgresql-settings-text.ts';
export type RedisSettingRow = SettingRowBase & {sensitive: boolean};
import {redisSettingNames} from './redis-setting-names.ts';
// File-local syntax only. Parameter semantics and operational effects require Redis validation.
const known=new Set(redisSettingNames),fail: (message: string) => never = message=>{throw Error(message);};
export function redisSettingSensitive(name: unknown){return typeof name==='string'&&['requirepass','masterauth','masteruser','tls-key-file-pass','tls-client-key-file-pass','user'].includes(name.trim().toLowerCase());}
function check(text: unknown): asserts text is string{
 if(typeof text!=='string'||text.includes('\0')||/\r(?!\n)/.test(text))fail('설정 파일 내용을 확인하세요.');
 if(text.length>262144||new TextEncoder().encode(text).length>262144)fail('설정 파일은 256 KiB 이하만 편집할 수 있습니다.');
}
export function redisValueValid(value: unknown): value is string{
 if(typeof value!=='string'||/[\0\r\n\v\f]/.test(value))return false;
 let quote='',closed=false;
 for(let index=0;index<value.length;index++){
  const char=value[index];
  if(quote){
   if(char==='\\'&&index+1<value.length&&(quote==='"'||value[index+1]==="'")){index++;continue;}
   if(char===quote){quote='';closed=true;}
  }else if(/[ \t]/.test(char)){closed=false;}
  else{if(closed)return false;if(char==='"'||char==="'")quote=char;}
 }
 return !quote;
}
export function parseRedisSettings(text: unknown): RedisSettingRow[]{
 check(text);const rows: RedisSettingRow[]=[],lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];
 for(let index=0;index<lines.length;index++){
  const raw=lines[index],ending=raw.endsWith('\r\n')?'\r\n':raw.endsWith('\n')?'\n':'',body=ending?raw.slice(0,-ending.length):raw;
  const match=/^([ \t]*)(#([ \t]*))?([A-Za-z][A-Za-z0-9_.-]*)([ \t]+)(.*)$/.exec(body);if(!match)continue;
  const name=match[4],value=match[6].trim(),enabled=!match[2];
  if(!enabled&&match[3]&&value&&!known.has(name.toLowerCase()))continue;
  if(!enabled&&(/<[A-Za-z][A-Za-z_-]*>/.test(value)||!redisValueValid(value)))continue;
  rows.push({line:index+1,raw,ending,indent:match[1],commentPrefix:match[2]||'',name,separator:match[5],value,comment:'',enabled,valid:redisValueValid(value)&&(!enabled||Boolean(value)),sensitive:redisSettingSensitive(name)});
 }
 return rows;
}
export function updateRedisSetting(text: unknown,entry: SettingIdentity,{value=entry.value,enabled=entry.enabled}: {value?: unknown; enabled?: unknown}={}){
 check(text);if(!entry||typeof enabled!=='boolean'||!redisValueValid(value))fail('설정값을 확인하세요.');
 const current=parseRedisSettings(text).find(item=>item.line===entry.line&&item.raw===entry.raw);if(!current)fail('설정이 변경되었습니다. 다시 확인하세요.');
 const row=current;
 if(value===row.value&&enabled===row.enabled)return text;
 const trimmed=value.trim();if(enabled&&!trimmed)enabled=false;
 const lines=text.match(/[^\r\n]*(?:\r\n|\n|$)/g)?.filter(Boolean)||[];
 // Compact # keeps disabled unknown/module directives distinct from prose comments.
 lines[entry.line-1]=row.indent+(enabled?'':known.has(row.name.toLowerCase())?(row.commentPrefix||'#'):'#')+row.name+row.separator+trimmed+row.ending;
 const result=lines.join('');check(result);return result;
}
export function appendRedisSetting(text: unknown,name: unknown,value: unknown){
 check(text);if(typeof name!=='string'||!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(name)||!redisValueValid(value))fail('설정값을 확인하세요.');
 const newline=text.includes('\r\n')?'\r\n':'\n',trimmed=value.trim();
 const result=text+(text&&!text.endsWith('\n')?newline:'')+(trimmed?'':'#')+name+' '+trimmed+newline;
 check(result);return result;
}
