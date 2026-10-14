import {configSchemas,configDefaults,redisEvictionPolicies,isDatabaseConfigKind} from './config-schema.ts';
const fail: (message: string) => never = (message)=>{throw Object.assign(new Error(message),{status:400});};
const integer=(value: unknown,label: string,min: number,max: number): number=>{const number=Number(value);if(!(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))||!Number.isInteger(number)||number<min||number>max)fail(`${label}: ${min}~${max} 범위의 정수를 입력하세요.`);return number;};
const choice=(value: unknown,list: readonly string[],label: string): string=>{if(typeof value!=='string'||!list.includes(value))fail(label+' 값을 확인하세요.');return value;};
export function databaseConfigProfile(kind: string,input: Record<string,unknown>){
 if(!isDatabaseConfigKind(kind))fail('지원하는 데이터베이스를 선택하세요.');
 const p={...configDefaults(kind),...input};
 for(const [key,label,type] of configSchemas[kind].fields)if(type==='switch'&&typeof p[key]!=='boolean')fail(label+' 값을 확인하세요.');
 const port=integer(p.port,'포트',kind==='redis'?0:1,65535);
 const connections=integer(p.connections,'최대 연결 수',1,10000);
 if(kind==='postgresql')return `# LINUX PostgreSQL settings fragment\nlisten_addresses = 'localhost'\nport = ${port}\nmax_connections = ${connections}\nshared_buffers = '${integer(p.sharedBuffers,'공유 버퍼',16,65536)}MB'\nwork_mem = '${integer(p.workMem,'작업 메모리',1,4096)}MB'\nlogging_collector = ${p.logging?'on':'off'}\n`;
 if(kind==='mariadb')return `[mariadbd]\nbind-address=127.0.0.1\nport=${port}\nmax_connections=${connections}\ninnodb_buffer_pool_size=${integer(p.bufferPool,'InnoDB 버퍼 풀',16,65536)}M\ncharacter-set-server=${choice(p.charset,['utf8mb4','utf8'],'문자셋')}\nslow_query_log=${p.slowLog?'ON':'OFF'}\nlong_query_time=${integer(p.slowSeconds,'느린 쿼리 기준',1,3600)}\n`;
 return `# LINUX Redis settings fragment\nbind 127.0.0.1\nprotected-mode yes\nport ${port}\nmaxclients ${connections}\nmaxmemory ${integer(p.maxMemory,'Redis 메모리',0,65536)}mb\nmaxmemory-policy ${choice(p.eviction,redisEvictionPolicies,'제거 정책')}\nappendonly ${p.appendOnly?'yes':'no'}\nappendfsync ${choice(p.fsync,['always','everysec','no'],'AOF 동기화')}\n`;
}
