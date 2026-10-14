import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {adminRuntimeFiles} from '../scripts/admin/runtime-files.mts';
import {helperKoreanMessage} from '../lib/helper-korean-message.ts';
import {helperErrorFromStderr} from '../lib/helper-error.ts';
const helper=new URL('../scripts/admin/linux-admin',import.meta.url);
const source=readFileSync(existsSync(helper)?helper:new URL('../scripts/admin/linex-admin',import.meta.url),'utf8');
test('현재 관리자 helper의 명시적인 오류 안내에 한국어가 빠지지 않는다',()=>{
 const messages=[...new Set([...source.matchAll(/fail\('([^'\\]+)'(?:\s*[,)]|\s*\+)/g)].map(match=>match[1]))];
 assert(messages.length>=120);
 for(const message of messages)assert.match(helperKoreanMessage(message),/[가-힣]/,message);
});
test('검증된 helper 오류는 원인별 한국어 안내와 상태 코드를 유지한다',()=>{
 for(const [message,status,expected] of [
  ['Invalid domain',400,'도메인'],
  ['PostgreSQL configuration changed',409,'다시 조회'],
  ['PostgreSQL candidate validation failed',422,'검수'],
  ['MariaDB requires the packaged root-owned helper',403,'root'],
  ['Another admin operation is active',503,'다른 관리자 작업'],
 ]){
  const error=helperErrorFromStderr('nginx-config-apply',JSON.stringify({protocol:'tastedev-helper-error-v1',action:'nginx-config-apply',status,message}));
  assert.equal(error.status,status);assert.match(error.message,new RegExp(expected));assert.match(error.message,/[가-힣]/);
 }
});
test('원복 오류의 원시 명령 진단은 한국어 안내에 포함하지 않는다',()=>{
 for(const prefix of ['Apply failed, previous file restored: ','Toggle failed, previous filename restored: ','Directory must be root-owned and not group/world writable: ']){
  const message=helperKoreanMessage(prefix+'--password=fixture-only-secret');
  assert.match(message,/[가-힣]/);assert(!message.includes('fixture-only-secret'));
 }
});
test('알 수 없는 오류와 기존 한국어는 바꾸지 않고 프로토콜 검사는 유지한다',()=>{
 for(const message of ['이미 변경되었습니다.','fixture validation failure','toString','__proto__'])assert.equal(helperKoreanMessage(message),message);
 const record={protocol:'tastedev-helper-error-v1',action:'nginx-config-apply',status:400,message:'Invalid domain'};
 for(const changed of [{action:'service'},{status:200},{message:'Invalid domain\nprivate'},{message:'x'.repeat(2001)},{extra:true}])assert.equal(helperErrorFromStderr('nginx-config-apply',JSON.stringify({...record,...changed})),null);
});

test('설정 변경·복구·잠금과 주요 패키지 검수 모듈의 명시적인 안내가 한국어로 전달된다',()=>{
 const modules=['config-transaction.ts','config-journal.ts','config-operation-lease.ts','nginx-apply.ts','nginx-candidate-validation.ts','redis-apply.ts','redis-restore.ts','mariadb-apply.ts','node-app-service-control.ts','certificate-execution.ts'];
 let count=0;
 for(const name of modules){
  const text=readFileSync(new URL('../lib/'+name,import.meta.url),'utf8');
  for(const match of text.matchAll(/(?:Error|fail)\(['"]([^'"\\\n]+)['"]/g)){assert.match(helperKoreanMessage(match[1]),/[가-힣]/,name+': '+match[1]);count++;}
 }
 assert(count>=70);
});

test('관리자 실행 목록 전체의 명시적인 사람이 읽는 오류에 한국어 누락이 없다',async()=>{
 const internalCodes=new Set(['unsafe','SYMLINK','PATH','SIZE','CHANGED','ENCODING']);
 const messages=new Set();
 for(const name of adminRuntimeFiles){
  const text=(await readAdminRuntimeModule(name)).toString('utf8');
  for(const match of text.matchAll(/(?:Error|fail)\(['"]([^'"\\\n]+)['"]/g)){
   const message=match[1];messages.add(message);
   if(internalCodes.has(message)){assert.equal(helperKoreanMessage(message),message);continue;}
   assert.match(helperKoreanMessage(message),/[가-힣]/,name+': '+message);
  }
 }
 assert(adminRuntimeFiles.length>=141);assert.equal(new Set(adminRuntimeFiles).size,adminRuntimeFiles.length);assert(messages.size>=400);
});
