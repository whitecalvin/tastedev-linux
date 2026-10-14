export type ServiceAccount = {name: string; uid: number; gid: number; home: string; shell: string};
export function serviceAccountRecord(text: unknown): ServiceAccount{
 const fields=String(text).trim().split(':');const [name,,uid,gid,,home,shell]=fields;
 if(fields.length!==7||!/^[a-z_][a-z0-9_-]{0,31}\$?$/.test(name)||!/^\d+$/.test(uid)||Number(uid)<1000||!/^\d+$/.test(gid)||!home?.startsWith('/')||/[\r\n\0%\\"]/.test(home)||!shell?.startsWith('/')||/(?:nologin|false)$/.test(shell))throw Error('root나 시스템 계정이 아닌, 이 서버에 존재하는 일반 Linux 로그인 계정을 지정하세요.');
 return {name,uid:Number(uid),gid:Number(gid),home,shell};
}
export function serviceAccountPlan(account: ServiceAccount){
 const parsed=serviceAccountRecord(`${account.name}:x:${account.uid}:${account.gid}::${account.home}:${account.shell}`);
 const path=`${parsed.home}/.local/bin:${parsed.home}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`;
 return {account:parsed,text:`[Service]\nUser=${parsed.name}\nGroup=${parsed.gid}\nEnvironment=${JSON.stringify('HOME='+parsed.home)}\nEnvironment=${JSON.stringify('PATH='+path)}\n`,passwordRequired:false};
}
