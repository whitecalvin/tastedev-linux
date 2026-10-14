const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail: ()=>never=()=>{throw Object.assign(new Error('Redis service startup configuration requires review before applying this main'),{status:409});};
// Internal parser only. Caller must verify the PID, executable and root-owned file.
// Process arguments can contain credentials: neither results nor errors expose them.
export function redisServiceScope(target: unknown,argv: unknown){
 if(target!=='/etc/redis/redis.conf'||!Array.isArray(argv)||argv.length<2||argv.length>100||argv[0]!=='/usr/bin/redis-server'||argv[1]!==target||!argv.every((value: unknown): value is string=>typeof value==='string'&&value.length<=4096&&!value.includes('\0')))fail();
 const seen=new Set<string>();
 for(let index=2;index<argv.length;index++){
  const option=argv[index],value=argv[++index];
  if(seen.has(option))fail();seen.add(option);
  if(option==='--supervised'&&value==='systemd')continue;
  if(option==='--daemonize'&&value==='no')continue;
  fail();
 }
 return {mode:'explicit-main',main:target,notice:'실행 인수의 명시적 Redis main과 선택 파일이 일치합니다. include 파일과 실행 중 설정값은 별도로 확인해야 합니다.'};
}
// Structured systemd execution history, not the text of a unit file. An unused
// or exited command and a command belonging to another PID cannot prove scope.
export function redisSystemdStartup(text: unknown,pid: unknown){
 if(typeof text!=='string'||Buffer.byteLength(text)>16384||typeof pid!=='number'||!Number.isSafeInteger(pid)||pid<=0)fail();
 let value: unknown;try{value=JSON.parse(text);}catch{fail();}
 if(!object(value)||Object.keys(value).sort().join(',')!=='data,type'||value.type!=='a(sasbttttuii)'||!Array.isArray(value.data)||value.data.length!==1)fail();
 const row=value.data[0];
 if(!Array.isArray(row)||row.length!==10||row[0]!=='/usr/bin/redis-server'||row[2]!==false||row.slice(3).some((x: unknown)=>typeof x!=='number'||!Number.isSafeInteger(x)||x<0)||row[3]===0||row[4]===0||row[5]!==0||row[6]!==0||row[7]!==pid||row[8]!==0||row[9]!==0)fail();
 const scope=redisServiceScope('/etc/redis/redis.conf',row[1]);
 return {...scope,mode:'systemd-started-main',notice:'systemd 시작 기록의 실행 파일·설정 파일·PID가 실행 중 Redis와 일치합니다. include 파일과 실행 중 설정값은 별도로 확인해야 합니다.'};
}
