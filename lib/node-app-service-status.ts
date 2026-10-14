import type {NodeAppRegistry} from './node-apps.ts';
type ServiceKey = 'LoadState'|'ActiveState'|'SubState'|'UnitFileState';
export type NodeServiceValues = Record<ServiceKey,string>;
type StatusBase = {id: string;unit: string;registryVersion: string};
export type NodeServiceStatus = StatusBase & ({available: true}&NodeServiceValues|{available: false;notice: string});
export type NodeServiceInventoryEntry = NodeServiceStatus & {nodeAppId: string;nodeRegistry: NodeAppRegistry;error?: string};
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {nodeApps} from './node-apps.ts';
const execute=promisify(execFile);
export function nodeAppServiceValues(text: string): NodeServiceValues{
 const values: Partial<NodeServiceValues>={};
 for(const line of text.split('\n')){if(!line)continue;const match=/^(LoadState|ActiveState|SubState|UnitFileState)=([a-z0-9-]*)$/.exec(line);if(!match||Object.hasOwn(values,match[1]))throw Error('Invalid service status');values[match[1] as ServiceKey]=match[2];}
 if(!['LoadState','ActiveState','SubState','UnitFileState'].every(key=>Object.hasOwn(values,key)))throw Error('Incomplete service status');
 return values as NodeServiceValues;
}
export async function nodeAppServiceStatus(id: unknown,{registrySnapshot=null}: {registrySnapshot?: NodeAppRegistry|null}={}): Promise<NodeServiceStatus>{
 const registry=registrySnapshot??await nodeApps(),app=registry.apps.find(item=>item.id===id);
 if(!app)throw Object.assign(Error('등록한 앱을 선택하세요.'),{status:404});
 const base={id:app.id,unit:app.unit,registryVersion:registry.version};
 try{const {stdout}=await execute('/usr/bin/systemctl',['show',app.unit,'--property=LoadState,ActiveState,SubState,UnitFileState','--no-pager','--no-ask-password'],{timeout:3000,maxBuffer:4096,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'},cwd:'/'});return {...base,available:true,...nodeAppServiceValues(stdout)};}
 catch{return {...base,available:false,notice:'서비스 상태를 조회할 수 없습니다. systemd 연결과 조회 권한을 확인하세요.'};}
}

// Only a server-owned registration snapshot supplies unit names. Limit native
// lookups and recheck registration after them, so a changed list is not shown
// as the current daemon inventory.
export async function nodeAppServiceInventory({readRegistry=nodeApps,readStatus=nodeAppServiceStatus}: {readRegistry?: ()=>Promise<NodeAppRegistry>;readStatus?: typeof nodeAppServiceStatus}={}){
 try{
  const registry=await readRegistry(),services=new Array<NodeServiceInventoryEntry>(registry.apps.length);let next=0;
  await Promise.all(Array.from({length:Math.min(4,registry.apps.length)},async()=>{
   for(;;){const index=next++;if(index>=registry.apps.length)return;const app=registry.apps[index],status=await readStatus(app.id,{registrySnapshot:registry});
    if(status.id!==app.id||status.unit!==app.unit||status.registryVersion!==registry.version)throw Error('앱 서비스 조회 대상이 변경되었습니다.');
    services[index]={...status,nodeAppId:app.id,nodeRegistry:{apps:[app],version:registry.version},...(status.available?{}:{ActiveState:'unknown',LoadState:'error',error:status.notice})};
   }
  }));
  if((await readRegistry()).version!==registry.version)return {services:[],warnings:['조회 중 Node.js 앱 목록이 변경되었습니다. 서비스 상태를 다시 조회하세요.']};
  return {services,warnings:[]};
 }catch{return {services:[],warnings:['Node.js 앱 서비스 목록을 읽을 수 없습니다. 앱 등록 경로와 조회 권한을 확인하세요.']};}
}
