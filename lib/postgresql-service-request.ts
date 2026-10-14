const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// Derive a cluster target from its configuration path, never an arbitrary unit.
export function postgresqlServiceRequest(input:unknown){
 if(!object(input)||typeof input.path!=='string'||typeof input.action!=='string')throw Object.assign(Error('허용된 서비스와 작업을 선택하세요.'),{status:400});
 const match=/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]{0,254})\/(?:postgresql|pg_hba)\.conf$/.exec(input.path);
 if(!match||!['start','stop','restart','reload'].includes(input.action))throw Object.assign(Error('허용된 서비스와 작업을 선택하세요.'),{status:400});
 const unit='postgresql@'+match[1]+'-'+match[2]+'.service';
 if(input.unit!==unit)throw Object.assign(Error('허용된 서비스와 작업을 선택하세요.'),{status:400});
 return {unit,action:input.action,path:'/etc/postgresql/'+match[1]+'/'+match[2]+'/postgresql.conf',confirm:input.confirm,version:match[1],cluster:match[2]};
}
