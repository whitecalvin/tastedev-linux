import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateExecution} from '../lib/certificate-execution.ts';
import {certificateFailureMessage} from '../lib/certificate-failure.ts';
import {helperErrorFromStderr} from '../lib/helper-error.ts';
const input={operation:'renew-check',certName:'eztoy.app',confirm:true,agree:true};
test('ACME native failure survives the bounded helper protocol without exposing provider output or retrying',async()=>{
 let calls=0;const secret='fixture-private-account-token';
 let observed;
 try{await certificateExecution(input,{run:()=>{calls++;throw Error('Native command failed\nUnable to update challenge :: authorization must be pending\n'+secret);}});}catch(e){observed=e;}
 assert.equal(calls,1);assert.equal(observed.status,422);assert.match(observed.message,/認証|인증 상태/);assert.match(observed.message,/기존 인증서를 삭제하지/);assert(!observed.message.includes(secret));assert(!/[\r\n]/.test(observed.message));
 const restored=helperErrorFromStderr('certificate',JSON.stringify({protocol:'tastedev-helper-error-v1',action:'certificate',status:observed.status,message:observed.message}));assert.equal(restored.message,observed.message);assert.equal(restored.status,422);
});
test('distinct ACME failures have distinct fixed guidance; unrelated native failures retain original semantics',async()=>{
 for(const [type,expected] of [['rateLimited','요청 한도'],['dns','DNS'],['connection','80 포트']])assert.match(certificateFailureMessage(Error('urn:ietf:params:acme:error:'+type+' :: private fixture')),new RegExp(expected));
 const unknown=Error('unexpected fixture');assert.equal(certificateFailureMessage(unknown),null);await assert.rejects(()=>certificateExecution(input,{run:()=>{throw unknown;}}),e=>e===unknown);
 assert.equal(certificateFailureMessage({message:null}),null);
});
