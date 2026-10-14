// Stored helper responses are data. Decode the known envelopes once for display,
// keeping legacy shell rows and unknown JSON intact; never interpret log content.
export function certificateJobLog(logs: unknown): string{
 if(!Array.isArray(logs))return '';
 const rows: unknown[]=logs;return rows.map(row=>{
  if(typeof row!=='string')return '';
  if(row.length>1024*1024)return row;
  let parsed: unknown;try{parsed=JSON.parse(row);}catch{return row;}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return row;const value=parsed as Record<string,unknown>;
  if(Object.keys(value).join(',')==='logs'&&typeof value.logs==='string')return value.logs;
  if(Object.keys(value).sort().join(',')==='action,message,protocol,status'&&value.protocol==='tastedev-helper-error-v1'&&value.action==='certificate'&&typeof value.status==='number'&&[400,403,404,409,422,500,503].includes(value.status)&&typeof value.message==='string'&&value.message.length<=2000&&!/[\0\r\n]/.test(value.message))return value.message+'\n';
  return row;
 }).join('');
}
