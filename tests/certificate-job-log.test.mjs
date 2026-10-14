import test from 'node:test';import assert from 'node:assert/strict';
import {certificateJobLog} from '../lib/certificate-job-log.ts';
test('stored native success logs show actual shell lines, Korean and emoji instead of escaped JSON',()=>{
 const output='갱신 테스트\n한글 ✅\n';assert.equal(certificateJobLog([JSON.stringify({logs:output})]),output);
 assert.equal(certificateJobLog(['legacy stdout\n','legacy stderr\n']),'legacy stdout\nlegacy stderr\n');
});
test('known helper error envelope shows its Korean message and unknown JSON stays literal',()=>{
 const value={protocol:'tastedev-helper-error-v1',action:'certificate',status:422,message:'ACME 인증 상태를 확인하세요.'};assert.equal(certificateJobLog([JSON.stringify(value)]),value.message+'\n');
 for(const data of [{...value,action:'install'},{...value,status:0},{...value,extra:true},{...value,message:'line\nline'},{logs:'x',unexpected:true}]){const text=JSON.stringify(data);assert.equal(certificateJobLog([text]),text);}
 assert.equal(certificateJobLog(['{"logs":"unfinished']),'{"logs":"unfinished');assert.equal(certificateJobLog(null),'');
});
