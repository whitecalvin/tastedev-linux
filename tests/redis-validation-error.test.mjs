import test from 'node:test';
import assert from 'node:assert/strict';
import {redisSandboxUnavailableMessage,redisSandboxFailureFromStderr,isRedisSandboxUnavailable} from '../lib/redis-validation-error.ts';
import {translate,translatedLanguages,languageCoverage} from '../lib/i18n.ts';
test('Redis helper preserves only the exact public sandbox failure for known actions',()=>{
 for(const action of ['redis-code-plan','redis-code-apply','redis-config-validate','redis-config-apply','redis-config-restore']){const error=redisSandboxFailureFromStderr(action,redisSandboxUnavailableMessage+'\n');assert.equal(error.status,503);assert.equal(error.code,'REDIS_SANDBOX_UNAVAILABLE');assert.equal(error.message,redisSandboxUnavailableMessage);}
 for(const action of ['service','nginx-config-apply','redis-unknown','redis-apply','redis-restore'])assert.equal(redisSandboxFailureFromStderr(action,redisSandboxUnavailableMessage),null);
 for(const message of ['private namespace path',redisSandboxUnavailableMessage+'\nprivate namespace path'])assert.equal(redisSandboxFailureFromStderr('redis-code-plan',message),null);
 assert.equal(isRedisSandboxUnavailable({code:'REDIS_SANDBOX_UNAVAILABLE',status:500}),false,'unresolved cleanup must keep its higher-priority error');
});
test('Redis unavailable-environment guidance has a direct translation in every UI catalog',()=>{
 for(const language of translatedLanguages){const text=translate(language,redisSandboxUnavailableMessage);assert(text);if(language!=='ko')assert.notEqual(text,redisSandboxUnavailableMessage);assert.equal(languageCoverage(language).translatedEntries>0,true);}
});
