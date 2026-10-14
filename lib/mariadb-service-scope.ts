const fail: ()=>never=()=>{throw Object.assign(new Error('MariaDB 실행 서비스의 기본 설정 경로를 확인한 후 적용하세요.'),{status:409});};
// Internal metadata parser. Never return process arguments; they can contain credentials.
export function mariadbServiceScope(root: unknown,argv: unknown,canonical: unknown){
 if(typeof root!=='string'||!['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(root)||!Array.isArray(argv)||argv.length>100||!['/usr/sbin/mariadbd','/usr/sbin/mysqld'].includes(argv[0])||!argv.every((value: unknown): value is string=>typeof value==='string'&&value.length<=4096&&!value.includes('\0'))||typeof canonical!=='function')fail();
 let explicit: string|null=null;
 for(let index=1;index<argv.length;index++){
  const arg=argv[index];
  if(arg==='--defaults-file'||arg.startsWith('--defaults-file=')){if(explicit!==null)fail();explicit=arg==='--defaults-file'?argv[++index]:arg.slice(16);if(typeof root!=='string'||!['/etc/mysql/my.cnf','/etc/mysql/mariadb.cnf'].includes(explicit))fail();continue;}
  if(arg==='--user=mysql'||arg==='-umysql')continue;
  if((arg==='--user'||arg==='-u')&&argv[index+1]==='mysql'){index++;continue;}
  if(/^--wsrep[_-]start[_-]position=[a-fA-F0-9-]+:-?[0-9]+$/.test(arg))continue;
  fail();
 }
 const resolve=(target:string):string=>{const value:unknown=canonical(target);if(typeof value!=='string')fail();return value;};
 const actual=resolve(explicit||'/etc/mysql/my.cnf'),selected=resolve(root);
 if(actual!==selected)fail();
 return {mode:explicit?'explicit-main':'default-main-assumed',main:selected,notice:explicit?'실행 중 서비스의 명시적 main과 선택 main이 일치합니다.':'기본 main 경로를 대조했습니다. 다른 기본 검색 파일과 실행 환경의 영향은 별도 확인이 필요합니다.'};
}
