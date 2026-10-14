export type PackageInventoryRow = {name: string; installed: boolean; version: string | null};
type InventoryQuery = (binary: string,args: string[],options: {timeout: number})=>Promise<{stdout: unknown}>;
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec=promisify(execFile);

// dpkg-query exits with 1 when any requested package is missing, but still
// reports the installed packages on stdout. Preserve that partial result.
export async function queryPackageInventory(names: readonly string[],run: InventoryQuery=exec): Promise<Map<string,PackageInventoryRow>>{
 const unique=[...new Set(names)];
 if(!unique.length)return new Map();
 let stdout: unknown='';
 try {
  ({stdout}=await run('/usr/bin/dpkg-query',['-W','-f=${Package}\t${Status}\t${Version}\n',...unique],{timeout:5000}));
 } catch(error){
  const detail=error!==null&&typeof error==='object'?error as Record<string,unknown>:{};
  if(detail.code===1&&!detail.killed&&!detail.signal)stdout=detail.stdout??'';
  else throw Object.assign(Error('설치된 패키지 목록을 조회할 수 없습니다. 잠시 후 다시 갱신하세요.'),{status:503});
 }
 const rows=new Map<string,PackageInventoryRow>(),requested=new Set(unique);
 for(const line of String(stdout).split('\n')){
  const [name,status,version]=line.split('\t');
  if(!requested.has(name)||!status)continue;
  rows.set(name,{name,installed:status==='install ok installed',version:version||null});
 }
 return new Map(unique.map(name=>[name,rows.get(name)??{name,installed:false,version:null}]));
}
