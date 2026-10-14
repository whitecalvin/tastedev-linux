import test from 'node:test';
import assert from 'node:assert/strict';
import {packageJobPayload,stringArray,findRecord} from '../scripts/verify-package-server.ts';

test('typed package HTTP job decoder preserves metadata and rejects malformed task and log shapes',()=>{
 const job=packageJobPayload({job:{id:'fixture',status:'running',pty:true,timeoutSeconds:120,logs:[{text:'한글 😀',kind:'stdout',sequence:1}]}});
 assert.equal(job.pty,true);assert.equal(job.timeoutSeconds,120);assert.deepEqual(job.logs,[{text:'한글 😀',kind:'stdout',sequence:1}]);
 assert.deepEqual(packageJobPayload({job:{id:'fixture',status:'running'}}).logs,[]);
 for(const value of [{job:null},{job:[]},{job:{id:1,status:'running'}},{job:{id:'',status:'running'}},{job:{id:'fixture',status:''}},{job:{id:'fixture',status:'running',logs:{}}},{job:{id:'fixture',status:'running',logs:[{text:1}]}},{job:{id:'fixture',status:'running',logs:[{text:'x',kind:1}]}}])assert.throws(()=>packageJobPayload(value));
});

test('typed package HTTP list and record selectors reject missing or malformed response fields',()=>{
 assert.deepEqual(stringArray(['nginx-apply','node-service-inspect']),['nginx-apply','node-service-inspect']);
 assert.throws(()=>stringArray('nginx-apply'));assert.throws(()=>stringArray(['nginx-apply',1]));
 assert.equal(findRecord({fields:[{key:'port',after:3145}]},'fields','key','port').after,3145);
 assert.throws(()=>findRecord({fields:[]},'fields','key','port'));
 assert.throws(()=>findRecord({fields:[null]},'fields','key','port'));
});
