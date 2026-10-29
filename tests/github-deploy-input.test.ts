import test from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
import {githubBuildInput,githubDeploymentAppId,verifyGitHubSignature,githubPushMatches} from '../lib/github-deploy-input.ts';
const valid={repository:'fixture/next-app',branch:'feature/site',directory:'apps/web',port:3000,environment:'NEXT_PUBLIC_URL=https://example.com\nDATABASE_URL="synthetic"',version:'a'.repeat(64)};
test('build input bounds repository, branch, project path, environment and management ports',()=>{
 assert.deepEqual(githubBuildInput(valid),valid);assert.equal(githubDeploymentAppId(valid.repository),githubDeploymentAppId(valid.repository));
 for(const value of [{repository:'fixture/../../etc'},{branch:'--upload-pack=bad'},{branch:'refs/../main'},{directory:'../outside'},{directory:'/etc'},{environment:'NODE_OPTIONS=--import=evil'},{environment:'PORT=8791'},{environment:'LINUX_AUTH_ROOT=/etc'},{environment:'not a variable'},{port:8791},{port:0},{version:'old'}])assert.throws(()=>githubBuildInput({...valid,...value}));
});
test('webhook signature verifies raw bytes and rejects altered payload, wrong secret, malformed headers',()=>{
 const bytes=Buffer.from('{"ref":"refs/heads/main"}'),secret='synthetic-fixture-secret';const signature='sha256='+createHmac('sha256',secret).update(bytes).digest('hex');
 assert(verifyGitHubSignature(secret,bytes,signature));assert(!verifyGitHubSignature(secret,Buffer.from(bytes+' '),signature));assert(!verifyGitHubSignature('different',bytes,signature));for(const bad of [null,'','sha256=abc','sha1='+signature.slice(7),'sha256='+'z'.repeat(64)])assert(!verifyGitHubSignature(secret,bytes,bad));
});
test('only the exact repository and non-deleted selected branch trigger builds',()=>{
 const push={repository:{full_name:'fixture/next-app'},ref:'refs/heads/main',deleted:false};assert(githubPushMatches(push,'fixture/next-app','main'));assert(!githubPushMatches({...push,deleted:true},'fixture/next-app','main'));assert(!githubPushMatches({...push,ref:'refs/tags/main'},'fixture/next-app','main'));assert(!githubPushMatches(push,'other/next-app','main'));assert(!githubPushMatches(null,'fixture/next-app','main'));
});
