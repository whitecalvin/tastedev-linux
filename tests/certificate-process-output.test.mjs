import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateProcessOutput,appendCertificateLogRows} from '../lib/certificate-process-output.ts';
import {certificateJobLog} from '../lib/certificate-job-log.ts';
import {completedAdminJob} from '../lib/admin-job-record.ts';
const id='11111111-1111-4111-8111-111111111111';
test('long helper JSON is decoded before storage splitting and survives the actual job validator',()=>{
 const text=('한글 😀 결과\n\n'+JSON.stringify({logs:'literal JSON shell output'})+'\n').repeat(600),rows=[],output=certificateProcessOutput(values=>rows.push(...values));
 const bytes=Buffer.from(JSON.stringify({logs:text}));for(let i=0;i<bytes.length;i+=17)output.stdout(bytes.subarray(i,i+17));output.end();output.end();output.stdout(Buffer.from('ignored'));
 assert(rows.length>1);assert(rows.every(row=>row.length<=8000));assert.equal(certificateJobLog(rows),text);
 const record=completedAdminJob({id,status:'success',command:['/usr/bin/certbot','renew'],logs:rows,exitCode:0,startedAt:new Date().toISOString()},id);assert.equal(certificateJobLog(record.logs),text);
});
test('JSON escape expansion and emoji split retain complete original output',()=>{
 const text=('\u0001\t"\\😀한글\n').repeat(3000),rows=[],output=certificateProcessOutput(values=>rows.push(...values));output.stdout(Buffer.from(JSON.stringify({logs:text})+'\n'));output.end();assert.equal(certificateJobLog(rows),text);assert(rows.every(row=>row.length<=8000));
});
test('independent streams retain backup progress, fixed helper errors, unknown JSON and final fragments',()=>{
 const rows=[],output=certificateProcessOutput(values=>rows.push(...values));output.stdout(Buffer.from(JSON.stringify({logs:'백업 ID\n'})+'\n{"logs":"'));output.stderr(Buffer.from(JSON.stringify({protocol:'tastedev-helper-error-v1',action:'certificate',status:422,message:'검증 실패'})+'\n'));output.stdout(Buffer.from('한글 결과"}'));output.stderr(Buffer.from('{"unexpected":true}\nlast'));output.end();assert.equal(certificateJobLog(rows),'백업 ID\n검증 실패\n{"unexpected":true}\n한글 결과last');
});
test('oversized envelope is visibly omitted and the next output still arrives',()=>{
 const rows=[],output=certificateProcessOutput(values=>rows.push(...values),64);for(let i=0;i<10;i++)output.stdout(Buffer.from('x'.repeat(20)));output.stdout(Buffer.from('\n'+JSON.stringify({logs:'다음 결과\n'})+'\n'));output.end();const text=certificateJobLog(rows);assert.match(text,/처리 한도/);assert(text.endsWith('다음 결과\n'));assert.equal(text.split('처리 한도').length,2);assert(!text.includes('xxxxx'));
});
test('storage limit preserves initial backup records and latest result with one visible omission notice',()=>{
 let rows=appendCertificateLogRows([],Array.from({length:700},(_,i)=>JSON.stringify({logs:'row '+i+'\n'})));
 for(let i=700;i<710;i++)rows=appendCertificateLogRows(rows,[JSON.stringify({logs:'row '+i+'\n'})]);
 assert.equal(rows.length,500);assert.equal(JSON.parse(rows[0]).logs,'row 0\n');assert.equal(JSON.parse(rows[99]).logs,'row 99\n');assert.equal(JSON.parse(rows.at(-1)).logs,'row 709\n');assert.equal(rows.filter(row=>JSON.parse(row).logs.includes('생략했습니다')).length,1);
 completedAdminJob({id,status:'failed',command:['/usr/bin/certbot','renew'],logs:rows,exitCode:1,startedAt:new Date().toISOString()},id);
});
