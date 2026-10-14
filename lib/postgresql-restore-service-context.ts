export type PostgresqlRestoreServiceContext={format:'postgresql-restore-service-v1';reviewVersion:string;serviceVersion:string;scope:{config:string;data:string;hba:string;unit:string;major:number;autoConfiguration:{present:boolean;version:string}};originalValues:Record<string,string>;candidateValues:Record<string,string>;pid:number;start:string};
import path from 'node:path';
const fail:()=>never=()=>{throw Object.assign(Error('PostgreSQL 원래 서비스 복원 기록을 확인하세요.'),{status:409});};
const keys=(value:unknown,list:readonly string[]):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...list].sort().join(',');
const hex=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const values=(value:unknown):value is Record<string,string>=>keys(value,['port','max_connections','shared_buffers','work_mem','logging_collector'])&&Object.entries(value).every(([key,item])=>typeof item==='string'&&(key==='logging_collector'?/^(on|off)$/.test(item):/^\d{1,15}$/.test(item)));
const absolute=(value:unknown):value is string=>typeof value==='string'&&value.length<=4096&&path.isAbsolute(value)&&path.normalize(value)===value&&!/[\x00-\x1f\x7f]/.test(value);
function validContext(value:unknown,target:string):value is PostgresqlRestoreServiceContext{
 const match=/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/postgresql\.conf$/.exec(target);
 if(!match||!keys(value,['format','reviewVersion','serviceVersion','scope','originalValues','candidateValues','pid','start'])||value.format!=='postgresql-restore-service-v1'||!hex(value.reviewVersion)||!hex(value.serviceVersion)||typeof value.pid!=='number'||!Number.isSafeInteger(value.pid)||value.pid<1||typeof value.start!=='string'||!/^\d{1,30}$/.test(value.start)||!values(value.originalValues)||!values(value.candidateValues))fail();
 const scope=value.scope;
 if(!keys(scope,['config','data','hba','unit','major','autoConfiguration'])||scope.config!==target||scope.hba!==path.dirname(target)+'/pg_hba.conf'||scope.unit!=='postgresql@'+match[1]+'-'+match[2]+'.service'||scope.major!==Number(match[1])||!absolute(scope.data)||!keys(scope.autoConfiguration,['present','version'])||typeof scope.autoConfiguration.present!=='boolean'||!hex(scope.autoConfiguration.version))fail();
 return true;
}

export function assertPostgresqlRestoreServiceContext(value:unknown,target:unknown){if(typeof target!=='string'||!validContext(value,target))fail();return value;}
