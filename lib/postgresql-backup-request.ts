const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// The lookup may name one main configuration; omitting it retains the global catalog.
export function preparePostgresqlBackupLookup(path:unknown){
 if(path===undefined||path===null)return {};
 if(typeof path!=='string'||!/^\/etc\/postgresql\/[1-9][0-9]?\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,254}\/postgresql\.conf$/.test(path))throw Object.assign(Error('PostgreSQL 설정 경로를 확인하세요.'),{status:400});
 return {path};
}

export function preparePostgresqlConfigBackup(input:unknown){
 if(!object(input)||Object.keys(input).some(key=>!['path','version','confirm'].includes(key))||input.confirm!==true||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version)||input.path==null)throw Object.assign(Error('PostgreSQL 백업 요청을 다시 확인하세요.'),{status:400});
 return {...preparePostgresqlBackupLookup(input.path),version:input.version,confirm:true};
}
