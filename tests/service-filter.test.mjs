import test from 'node:test';import assert from 'node:assert/strict';
import {filterServices} from '../lib/service-filter.ts';
test('daemon filtering combines service name with exact lifecycle state without conflating loading errors',()=>{
 const services=[{unit:'nginx.service',ActiveState:'active'},{unit:'redis-server.service',ActiveState:'failed'},{unit:'postgresql.service',ActiveState:'inactive'},{unit:'missing.service',LoadState:'not-found'}];
 assert.deepEqual(filterServices(services,' NGINX ','active'),[services[0]]);
 assert.deepEqual(filterServices(services,'redis','failed'),[services[1]]);
 assert.deepEqual(filterServices(services,'','inactive'),[services[2]]);
 assert.deepEqual(filterServices(services,'redis','active'),[]);
 assert.equal(filterServices(services).length,4);assert.deepEqual(filterServices(services,'','unknown'),[]);
 assert.equal(services.length,4);
});
