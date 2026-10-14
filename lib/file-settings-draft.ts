import {isDatabaseConfigKind} from './config-schema.ts';
import type {SettingRowBase} from './postgresql-settings-text.ts';
import {parsePostgresqlSettings} from './postgresql-settings-text.ts';
import {parseRedisSettings} from './redis-settings-text.ts';
import {parseMariaDBSettings} from './mariadb-settings-text.ts';
const parsers={postgresql:parsePostgresqlSettings,redis:parseRedisSettings,mariadb:parseMariaDBSettings};
export const settingInputKey=(row: {line: number; name: string})=>row.line+':'+row.name;
const identity=(row: SettingRowBase)=>JSON.stringify([row.name,row.group??null,row.raw]);
export function retainSettingInputs<T>(kind: string,text: string,inputs: Record<string,T>={},previousText?: string): Record<string,T>{
 if(!Object.keys(inputs).length)return {};
 try{
  if(!isDatabaseConfigKind(kind))return inputs;const rows=parsers[kind](text);
  const current=new Map(rows.map(row=>[settingInputKey(row),row]));
  const previous=typeof previousText==='string'?parsers[kind](previousText):null;
  const original=new Map((previous??[]).map(row=>[settingInputKey(row),row]));
  const matching=(list: SettingRowBase[],row: SettingRowBase)=>list.filter(candidate=>identity(candidate)===identity(row));
  const retained: Record<string,T>={};
  for(const [key,input] of Object.entries(inputs)){
   if(input===null||typeof input!=='object'||!('raw' in input)||typeof input.raw!=='string')continue;
   if(key==='$setting:new'||key.startsWith('$setting:new:')){retained[key]=input;continue;}
   const before=original.get(key),same=current.get(key);
   if(before&&before.raw!==input.raw)continue;
   if(before&&matching(previous??[],before).length!==matching(rows,before).length)continue;
   if(same?.raw===input.raw&&(!before||identity(same)===identity(before))){retained[key]=input;continue;}
   if(!before)continue;
   const targets=matching(rows,before);
   // A duplicate cannot be identified reliably after a move. Never attach input to another row.
   if(targets.length===1&&matching(previous??[],before).length===1)retained[settingInputKey(targets[0])]=input;
  }
  return retained;
 }catch{return inputs;}
}
