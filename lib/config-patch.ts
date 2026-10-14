import {databaseConfigProfile as configProfile} from './database-config-profile.ts';
import {configDefaults,isDatabaseConfigKind,type DatabaseConfigKind} from './config-schema.ts';
const directives: Record<DatabaseConfigKind,Record<string,string>>={
 postgresql:{port:'port',connections:'max_connections',sharedBuffers:'shared_buffers',workMem:'work_mem',logging:'logging_collector'},
 mariadb:{port:'port',connections:'max_connections',bufferPool:'innodb_buffer_pool_size',charset:'character-set-server',slowLog:'slow_query_log',slowSeconds:'long_query_time'},
 redis:{port:'port',connections:'maxclients',maxMemory:'maxmemory',eviction:'maxmemory-policy',appendOnly:'appendonly',fsync:'appendfsync'}
};
const fail: (message: string) => never = message=>{throw Object.assign(new Error(message),{status:400});};
const bounded=(text: string)=>{if(new TextEncoder().encode(text).length>262144)fail('Invalid configuration');return text;};
// Pure text transformation. Callers enforce file access and operational write authorization.
export function patchConfig(kind: unknown,text: unknown,changes: unknown): string{
 if(!isDatabaseConfigKind(kind))fail('Invalid configuration');
 const mapping=directives[kind];
 if(!mapping||typeof text!=='string'||new TextEncoder().encode(text).length>262144||text.includes('\0'))fail('Invalid configuration');
 if(!changes||typeof changes!=='object'||Array.isArray(changes)||Object.keys(changes).some(key=>!Object.hasOwn(mapping,key)))fail('Invalid configuration fields');
 const keys=Object.keys(changes);if(!keys.length)return text;
 const fragment=configProfile(kind,{...configDefaults(kind),...changes});
 const generated=new Map<string,string>();
 for(const line of fragment.split('\n')){const match=kind==='redis'?/^([\w-]+)\s+(.+)$/.exec(line):/^([\w-]+)\s*=\s*(.+)$/.exec(line);if(match)generated.set(match[1],match[2]);}
 const selected=new Map(keys.map(key=>[mapping[key],generated.get(mapping[key])]));
 const newline=text.includes('\r\n')?'\r\n':'\n';
 const parts=(text.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[]).filter(Boolean);
 const seen=new Set();let section='';
 const output=parts.map(part=>{
  const ending=part.endsWith('\r\n')?'\r\n':part.endsWith('\n')?'\n':'';
  const line=ending?part.slice(0,-ending.length):part;
  if(kind==='mariadb'){const group=/^\s*\[([^\]]+)\]/.exec(line);if(group){section=group[1].toLowerCase();return part;}if(!['mysqld','server','mariadb','mariadbd'].includes(section))return part;}
  const match=kind==='redis'?/^(\s*)([\w-]+)\s+(.+)$/.exec(line):/^(\s*)([\w-]+)\s*=\s*(.+)$/.exec(line);
  if(!match)return part;
  const normalize=(value: string)=>kind==='mariadb'?value.toLowerCase().replaceAll('-','_'):value.toLowerCase();
  const name=[...selected.keys()].find(key=>normalize(key)===normalize(match[2]));if(!name)return part;seen.add(name);
  // Redis treats inline # characters as arguments; do not invent inline comments.
  const comment=kind==='redis'?'':((kind==='mariadb'?/\s+#.*$/:/\s+[#;].*$/).exec(match[3])?.[0]||'');
  return match[1]+match[2]+(kind==='redis'?' ':' = ')+selected.get(name)+comment+ending;
 }).join('');
 const missing=[...selected].filter(([name])=>!seen.has(name));
 if(!missing.length)return bounded(output);
 const suffix=(output&&!output.endsWith('\n')?newline:'')+(kind==='mariadb'?('[mariadbd]'+newline):'');
 return bounded(output+suffix+missing.map(([name,value])=>name+(kind==='redis'?' ':' = ')+value+newline).join(''));
}
