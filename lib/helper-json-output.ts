import {StringDecoder} from 'node:string_decoder';
// A restore draft contains both bounded HBA snapshots. JSON escaping can expand
// each byte sixfold; keep that response bounded without dropping valid Unicode.
export function helperJsonOutput(action: string){
 const limit=['postgresql-hba-operation-plan','postgresql-hba-restore-draft'].includes(action)?4*1024*1024:1024*1024,decoder=new StringDecoder('utf8');let bytes=0,text='';
 return {write(chunk: Buffer){bytes+=chunk.length;if(bytes>limit)throw Object.assign(Error('관리 응답 크기가 너무 큽니다.'),{status:502});text+=decoder.write(chunk);},finish(){text+=decoder.end();return text;}};
}
