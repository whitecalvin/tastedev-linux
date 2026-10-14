import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxValidationDiagnostic} from '../lib/nginx-validation-diagnostic.ts';
test('nginx diagnostics classify failures without returning native secrets or paths',()=>{
 const cases=[[{code:'ENOENT'},'missing'],[{code:'EACCES'},'permission'],[{stderr:'socket() failed (1: Operation not permitted)'},'permission'],[{killed:true,signal:'SIGTERM'},'timeout'],[{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',killed:true,signal:'SIGTERM'},'output-limit'],[{stderr:'unknown directive "fixture-private" in /secret/file.conf'},'invalid-config'],[{stderr:'connection failed token=fixture-private'},'unavailable']];
 for(const [error,category] of cases){const result=nginxValidationDiagnostic({...error,message:'fixture-private',cmd:'private command'});assert.equal(result.category,category);assert.deepEqual(Object.keys(result),['category','reason']);assert(!JSON.stringify(result).includes('fixture-private'));assert(!JSON.stringify(result).includes('/secret/'));}
});
