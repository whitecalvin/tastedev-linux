import {configDefaults,isDatabaseConfigKind,type DatabaseConfigKind,type ConfigValues} from './config-schema.ts';
import {databaseConfigProfile as configProfile} from './database-config-profile.ts';

const fields: Record<DatabaseConfigKind,Record<string,string>>={postgresql:{port:'port',max_connections:'connections',shared_buffers:'sharedBuffers',work_mem:'workMem',logging_collector:'logging'},mariadb:{port:'port',max_connections:'connections',innodb_buffer_pool_size:'bufferPool',character_set_server:'charset',slow_query_log:'slowLog',long_query_time:'slowSeconds'},redis:{port:'port',maxclients:'connections',maxmemory:'maxMemory','maxmemory-policy':'eviction',appendonly:'appendOnly',appendfsync:'fsync'}};
const memories=new Set(['sharedBuffers','workMem','bufferPool','maxMemory']),booleans=new Set(['logging','slowLog','appendOnly']);
function convert(kind: DatabaseConfigKind,key: string,value: string){
 if(booleans.has(key)){if(/^(on|yes|true|1)$/i.test(value))return true;if(/^(off|no|false|0)$/i.test(value))return false;throw Error();}
 if(memories.has(key)){
  const match=/^(\d+(?:\.\d+)?)\s*(kb|mb|gb|k|m|g|b)?$/i.exec(value);if(!match)throw Error();
  const unit=(match[2]||'').toLowerCase(),number=Number(match[1]);
  const factors: Record<string,number>={kb:1/1024,mb:1,gb:1024,k:1/1024,m:1,g:1024,b:1/1048576};
  // PostgreSQL implicit buffers use 8KB pages; work_mem uses KB. Others use bytes.
  const factor=(kind==='redis'?{...factors,k:1000/1048576,m:1000000/1048576,g:1000000000/1048576}:factors)[unit]??(kind==='postgresql'?(key==='sharedBuffers'?8/1024:1/1024):1/1048576);
  return number*factor;
 }
 return /^(port|connections|slowSeconds)$/.test(key)?Number(value):value;
}
export function parseLiveConfig(kind: string,text: string){
 if(!isDatabaseConfigKind(kind))throw Object.assign(new Error('운영 설정 조회를 지원하는 패키지를 선택하세요.'),{status:400});
 const values: ConfigValues={},warnings: string[]=[];let section='';
 for(const line of text.split(/\r?\n/)){
  if(/^\s*[#;]/.test(line)||!line.trim())continue;
  if(kind==='mariadb'){const group=/^\s*\[([^\]]+)\]/.exec(line);if(group){section=group[1].toLowerCase();continue;}if(!['mysqld','server','mariadb','mariadbd'].includes(section))continue;}
  const match=kind==='redis'?/^\s*([\w-]+)\s+(.+?)\s*$/.exec(line):/^\s*([\w-]+)\s*=\s*(.+?)\s*$/.exec(line);
  if(!match)continue;const key=fields[kind][kind==='mariadb'?match[1].toLowerCase().replaceAll('-','_'):match[1].toLowerCase()];if(!key)continue;
  let value=match[2];const quoted=(kind==='redis'?/^(['"])(.*?)\1\s*$/:kind==='mariadb'?/^(['"])(.*?)\1\s*(?:#.*)?$/:/^(['"])(.*?)\1\s*(?:[#;].*)?$/).exec(value);
  value=quoted?quoted[2]:kind==='redis'?value.trim():value.replace(kind==='mariadb'?/\s*#.*$/:/\s*[#;].*$/,'').trim();
  delete values[key];
  try{const parsed=convert(kind,key,value);configProfile(kind,{...configDefaults(kind),[key]:parsed});values[key]=parsed;}catch{warnings.push(key+': GUI에서 지원하는 값으로 읽을 수 없습니다.');}
 }
 return {values,warnings};
}
