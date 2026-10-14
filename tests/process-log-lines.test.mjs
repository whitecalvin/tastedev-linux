import test from 'node:test';import assert from 'node:assert/strict';
import {processLogLines} from '../lib/process-log-lines.ts';
test('split UTF-8 bytes form complete operation log rows and flush final text once',()=>{
 const rows=[],output=processLogLines(lines=>rows.push(...lines));
 for(const byte of Buffer.from('설치 😀 성공\r\n마지막 줄'))output.stdout(Buffer.from([byte]));
 assert.deepEqual(rows,['설치 😀 성공']);output.end();output.end();output.stdout(Buffer.from('ignored\n'));assert.deepEqual(rows,['설치 😀 성공','마지막 줄']);
});
test('stdout and stderr cannot combine partial multibyte sequences or unfinished lines',()=>{
 const rows=[],output=processLogLines(lines=>rows.push(...lines)),out=Buffer.from('한글\n'),err=Buffer.from('오류\n');
 for(let i=0;i<Math.max(out.length,err.length);i++){if(i<out.length)output.stdout(out.subarray(i,i+1));if(i<err.length)output.stderr(err.subarray(i,i+1));}output.end();assert.deepEqual(rows,['한글','오류']);
});
test('bounded long lines avoid broken surrogate pairs and accept subsequent rows',()=>{
 const rows=[],output=processLogLines(lines=>rows.push(...lines),4);output.stdout(Buffer.from('abc😀'));output.stdout(Buffer.from('x'.repeat(50000)+'\nnext\n'));output.end();assert.deepEqual(rows,['abc','next']);
});
test('certificate log fragments preserve line and blank-line boundaries for existing UI and AI joins',()=>{
 const rows=[],output=processLogLines(lines=>rows.push(...lines),8,true);for(const byte of Buffer.from('한글\r\n\n마지막'))output.stdout(Buffer.from([byte]));output.end();assert.equal(rows.join(''),'한글\n\n마지막');assert(rows.every(row=>row.length<=8));
 const clipped=[];const bounded=processLogLines(lines=>clipped.push(...lines),4,true);bounded.stdout(Buffer.from('abc😀rest\n'));bounded.end();assert.deepEqual(clipped,['abc\n']);
});
