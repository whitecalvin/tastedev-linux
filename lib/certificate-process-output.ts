import {StringDecoder} from 'node:string_decoder';
import {certificateJobLog} from './certificate-job-log.ts';
export function appendCertificateLogRows(previous: string[],added: string[]): string[]{
 const rows=[...previous,...added];if(rows.length<=500)return rows;
 // Keep the initial backup/progress records as well as the newest failure/result.
 return [...rows.slice(0,100),JSON.stringify({logs:'작업 기록의 저장 한도를 넘어 중간 로그 일부를 생략했습니다. 처음 기록과 최신 결과는 유지됩니다.\n'}),...rows.slice(-399)];
}
// Native helper output can contain four MiB of shell output and sixfold JSON
// escaping. Decode the bounded envelope before splitting storage rows.
export function certificateProcessOutput(onRows: (rows: string[])=>void,maxEnvelope=26*1024*1024){
 if(!Number.isInteger(maxEnvelope)||maxEnvelope<16||maxEnvelope>26*1024*1024)throw Error('Invalid certificate output limit');
 function emit(text: string){
  const rows=[];let offset=0;
  while(offset<text.length){let size=Math.min(7000,text.length-offset),row;
   for(;;){if(/[\uD800-\uDBFF]/.test(text[offset+size-1]||'')&&size<text.length-offset)size--;
    row=JSON.stringify({logs:text.slice(offset,offset+size)});if(row.length<=8000)break;size=Math.floor(size/2);
   }
   rows.push(row);offset+=size;
  }
  if(rows.length)onRows(rows);
 }
 function stream(){
  const decoder=new StringDecoder('utf8');let pending='',bytes=0,dropping=false,ended=false;
  function consume(text: string,flush=false){const parts=text.split('\n');
   for(let i=0;i<parts.length;i++){
    if(!dropping){bytes+=Buffer.byteLength(parts[i]);if(bytes>maxEnvelope){pending='';dropping=true;emit('인증서 작업 출력이 처리 한도를 넘어 일부 내용을 생략했습니다.\n');}else pending+=parts[i];}
    if(i<parts.length-1||flush){
     if(!dropping&&pending){let parsed: unknown;try{parsed=JSON.parse(pending);}catch{}
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).join(',')==='logs'&&'logs' in parsed&&typeof parsed.logs==='string')emit(parsed.logs);
      else {const shown=certificateJobLog([pending]);emit(shown===pending?pending+(i<parts.length-1?'\n':''):shown);}
     }else if(!dropping&&i<parts.length-1)emit('\n');
     pending='';bytes=0;dropping=false;
    }
   }
  }
  return {write(chunk: Buffer){if(!ended)consume(decoder.write(chunk));},end(){if(ended)return;ended=true;consume(decoder.end(),true);}};
 }
 const stdout=stream(),stderr=stream();return {stdout:stdout.write,stderr:stderr.write,end(){stdout.end();stderr.end();}};
}
