import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from '../scripts/verification/audit-runtime-copy.ts';
test('diagnostic audit selects error prose without treating internal identifiers as user copy',async()=>{
 await loadBindings();const ast=await parse("const provider='사용자 지정'; throw Object.assign(Error('설정을 확인하세요.'),{status:400}); const result={error:ok?'실패했습니다.':'다시 시도하세요.',command:'계정 명령'};",{filename:'fixture.mjs'});const result=diagnosticCandidates(ast);assert.deepEqual(result.literals,['다시 시도하세요.','설정을 확인하세요.','실패했습니다.'].sort());assert.deepEqual(result.dynamic,[]);
});
test('diagnostic audit retains dynamic gaps instead of silently treating them as covered',async()=>{
 await loadBindings();const result=diagnosticCandidates(await parse('throw new Error(`파일 ${name} 실패`); const result={error:failure.message}; throw Error(`정적 안내`);',{filename:'fixture.mjs'}));assert.deepEqual(result.literals,['정적 안내']);assert.deepEqual(result.dynamic,[{kind:'exception',type:'TemplateLiteral'},{kind:'error-field',type:'MemberExpression'}]);
});
test('local Error factories expose literal call-site diagnostics including non-first parameters',async()=>{
 await loadBindings();const ast=await parse("const fail=(message,status=400)=>Object.assign(new Error(message),{status}); function reject(status,message){throw TypeError(message);} const build=function(message){return Error(message);}; fail('서비스 권한 안내',403);reject(400,ok?'검수 안내':'복구 안내');build('설정 안내');fail(dynamic);",{filename:'fixture.mjs'});
 const result=diagnosticCandidates(ast);assert.deepEqual(result.literals,['서비스 권한 안내','검수 안내','복구 안내','설정 안내'].sort());assert(result.dynamic.some(item=>item.kind==='local-error-factory'&&item.type==='Identifier'));
});
test('ordinary helpers, aliases, nested functions and ambiguous bindings are not assumed to be Error factories',async()=>{
 await loadBindings();const ast=await parse("import {remoteFail} from './other.mjs'; const record=message=>({message});const nested=message=>()=>Error(message);function first(){const fail=message=>Error(message);fail('중첩 안내');}function second(){const fail=message=>message;fail('식별자 안내');}remoteFail('원격 안내');record('업체 이름');nested('내부 이름');",{filename:'fixture.mjs'});
 const result=diagnosticCandidates(ast);assert.deepEqual(result.literals,[]);
});
test('actual operations and HBA operation factories expose their call-site diagnostic candidates',async()=>{
 const {readFile}=await import('node:fs/promises');await loadBindings();
 for(const [file,key] of [['operations','허용된 서비스와 작업을 선택하세요.'],['postgresql-hba-operation','접속 규칙 적용 검토와 확인이 필요합니다.']]){
  const ast=await parse(await readFile(new URL('../lib/'+file+'.ts',import.meta.url),'utf8'),{filename:file+'.ts',syntax:'typescript'});const result=diagnosticCandidates(ast);assert(result.literals.includes(key));
 }
});
