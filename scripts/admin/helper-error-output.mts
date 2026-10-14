// Compiled and embedded in the root helper: error reporting must survive runtime checksum failures.
export function helperErrorOutput(error:unknown,action:string|undefined):string{
 const object=error!==null&&typeof error==='object';
 const suppliedStatus=object&&'status' in error?error.status:undefined;
 const suppliedMessage=object&&'message' in error?error.message:undefined;
 const validStatus=typeof suppliedStatus==='number'&&[400,403,404,409,422,500,503].includes(suppliedStatus);
 const status=validStatus?suppliedStatus:500;
 const message=validStatus&&typeof suppliedMessage==='string'&&Buffer.byteLength(suppliedMessage)<=2000&&!/[\0\r\n]/.test(suppliedMessage)?suppliedMessage:'관리 작업을 완료하지 못했습니다.';
 return JSON.stringify({protocol:'tastedev-helper-error-v1',action,status,message})+'\n';
}
