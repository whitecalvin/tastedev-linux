import {StringDecoder} from 'node:string_decoder';
// stdout/stderr have independent byte and line boundaries. Terminal PTY output
// uses its own raw stream; these are bounded noninteractive operation log rows.
export function processLogLines(onLines: (lines: string[])=>void,limit=2000,preserveNewlines=false){
 if(!Number.isInteger(limit)||limit<2||limit>8000)throw Error('Invalid log line limit');
 function stream(){
  const decoder=new StringDecoder('utf8');let pending='',ended=false;
  function consume(text: string,flush=false){const lines=[],parts=text.split('\n');
   for(let i=0;i<parts.length;i++){pending=(pending+parts[i]).slice(0,limit+1);
    if(i<parts.length-1||flush){const newline=preserveNewlines&&i<parts.length-1?'\n':'';let line=pending.endsWith('\r')?pending.slice(0,-1):pending;line=line.slice(0,limit-newline.length);if(/[\uD800-\uDBFF]/.test(line.at(-1)||''))line=line.slice(0,-1);if(line||newline)lines.push(line+newline);pending='';}
   }
   if(lines.length)onLines(lines);
  }
  return {write(chunk: Buffer){if(!ended)consume(decoder.write(chunk));},end(){if(ended)return;ended=true;consume(decoder.end(),true);}};
 }
 const stdout=stream(),stderr=stream();return {stdout:stdout.write,stderr:stderr.write,end(){stdout.end();stderr.end();}};
}
