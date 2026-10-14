export type NodeAppProfile = {id: string; label: string; directory: string; entry: string; environmentFile: string; unit: string};
const fail: ()=>never=()=>{throw Object.assign(Error('앱 이름·절대 폴더 경로·상대 실행 파일·환경 파일을 확인하세요.'),{status:400});};
export function nodeAppProfile(value: unknown): NodeAppProfile{
 if(value===null||typeof value!=='object')fail();const input=value as Record<string,unknown>;
 if(!input||typeof input!=='object'||typeof input.id!=='string'||!/^[a-z][a-z0-9-]{0,39}$/.test(input.id)||typeof input.label!=='string'||!input.label.trim()||input.label.trim().length>80||/[\0\r\n]/.test(input.label))fail();
 if(typeof input.directory!=='string'||!input.directory.startsWith('/')||input.directory.startsWith('//')||input.directory.length>1024||/[\0\r\n\\]/.test(input.directory)||input.directory.split('/').some(part=>part==='..'||part==='.')||input.directory==='/')fail();
 function relative(value: unknown,entry=false): string{if(typeof value!=='string'||!value||value.length>240||/[\0\r\n\\]/.test(value)||value.startsWith('/')||value.split('/').some(part=>!part||part==='.'||part==='..'))fail();if(entry&&!/\.(?:js|mjs|cjs)$/.test(value))fail();return value;}
 return {id:input.id,label:input.label.trim(),directory:input.directory.replace(/\/+$/,''),entry:relative(input.entry,true),environmentFile:relative(input.environmentFile),unit:'tastedev-node-'+input.id+'.service'};
}
