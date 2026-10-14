const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fields=['id','confirm','version','graphVersion','restoreGraphVersion','backupVersion'];
const fail:()=>never=()=>{throw Object.assign(Error('Reload and confirm Redis restore plan'),{status:400});};
export function prepareRedisRestore(input:unknown){
 if(!object(input)||input.confirm!==true||Object.keys(input).some(key=>!fields.includes(key)))fail();
 if(typeof input.id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(input.id))fail();
 const hash=(key:string)=>{const value=input[key];if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))fail();return value;};
 const version=hash('version'),graphVersion=hash('graphVersion'),restoreGraphVersion=hash('restoreGraphVersion'),backupVersion=hash('backupVersion');
 return Object.freeze({id:input.id,confirm:true,version,graphVersion,restoreGraphVersion,backupVersion});
}
