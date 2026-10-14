import test from 'node:test';
import assert from 'node:assert/strict';
import {sudoAccountRecord,sudoPolicyHooks} from '../lib/sudo-policy-hooks.ts';
const account={username:'fixture-admin',uid:1000};
test('sudo account parser returns only account identity and rejects ambiguous or changed uid',()=>{
 assert.deepEqual(sudoAccountRecord('fixture-admin:x:1000:1000:Private Name:/private/home:/bin/bash\n',1000),account);
 for(const text of ['fixture-admin:x:0:0::/:/bin/bash\n','fixture-admin:x:01000:1000::/:/bin/bash\n','bad user:x:1000:1000::/:/bin/bash\n','fixture-admin:x:1000:1000::/:/bin/bash\nother:x:1000:1000::/:/bin/bash\n'])assert.throws(()=>sudoAccountRecord(text,1000),{status:403});
});
test('sudo hooks invoke fixed account/native parser commands and reject arbitrary candidate paths',async()=>{
 const calls=[],run=async(file,args)=>{calls.push({file,args});return {stdout:'fixture-admin:x:1000:1000::/private:/bin/bash\n'};},hooks=sudoPolicyHooks(account,{run}),file='/etc/sudoers.d/.tastedev-config-12345678-1234-1234-1234-123456789abc';
 await hooks.verifyAccount();await hooks.validateCandidate(file);await hooks.validatePolicy();assert.deepEqual(calls,[{file:'/usr/bin/getent',args:['passwd','1000']},{file:'/usr/sbin/visudo',args:['-c','-f',file]},{file:'/usr/sbin/visudo',args:['-c']}]);
 await assert.rejects(hooks.validateCandidate('/etc/sudoers'),{status:403});await assert.rejects(hooks.validateCandidate('/tmp/candidate'),{status:403});assert.equal(calls.length,3);
 const changed=sudoPolicyHooks(account,{run:async()=>({stdout:'other-admin:x:1000:1000::/:/bin/bash\n'})});await assert.rejects(changed.verifyAccount(),{status:403});
});
test('sudo account verification rejects malformed native output without exposing account database contents',async()=>{
 for(const output of [null,[],{}, {stdout:Buffer.from('fixture-admin:x:1000:1000::/:/bin/bash')}, {stdout:'fixture-admin:x:1000:1000:private-name:/private:/bin/bash\nother:x:1000:1000::/:/bin/bash\n'}]){
  const hooks=sudoPolicyHooks(account,{run:async()=>output});
  await assert.rejects(hooks.verifyAccount(),error=>error.status===403&&!error.message.includes('private-name')&&!error.message.includes('/private'));
 }
});
