import test from 'node:test';
import assert from 'node:assert/strict';
import {configProfile} from '../lib/config-profiles.ts';
import {parseLiveConfig} from '../lib/config-live.ts';
import {configSchemas,redisEvictionPolicies} from '../lib/config-schema.ts';
test('All eight Redis eviction policies round trip through GUI schema and live configuration',()=>{
 const policies=['noeviction','allkeys-lru','allkeys-lfu','allkeys-random','volatile-lru','volatile-lfu','volatile-random','volatile-ttl'];
 assert.deepEqual([...redisEvictionPolicies],policies);assert.deepEqual(configSchemas.redis.fields.find(field=>field[0]==='eviction')[4],policies);
 for(const eviction of policies){const text=configProfile('redis',{eviction});const parsed=parseLiveConfig('redis',text);assert.equal(parsed.values.eviction,eviction);assert.equal(parsed.warnings.length,0);}
 for(const eviction of ['unknown','volatile-ttl\nprotected-mode no'])assert.throws(()=>configProfile('redis',{eviction}));
});
