import test from 'node:test';import assert from 'node:assert/strict';
import {certificateJobBackups} from '../lib/certificate-job-backups.ts';
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const row=(path,id)=>'nginx 설정 백업 · '+path+' · '+id+'\n';
test('current JSON envelopes and legacy logs yield deduplicated editable backup candidates only',()=>{
 const logs=[JSON.stringify({logs:row('/etc/nginx/nginx.conf',id)+row('/etc/nginx/conf.d/eztoy.conf',other)}),row('/etc/nginx/nginx.conf',id)];
 assert.deepEqual(certificateJobBackups(logs),[{id,path:'/etc/nginx/nginx.conf'},{id:other,path:'/etc/nginx/conf.d/eztoy.conf'}]);
});
test('conflicting IDs, traversal, external paths, malformed UUIDs and incidental substrings are rejected',()=>{
 for(const path of ['/etc/passwd','/etc/nginx/../passwd','/etc/nginx/sites-enabled/evil','/etc/nginx/conf.d/foo;bar'])assert.deepEqual(certificateJobBackups([row(path,id)]),[]);
 assert.deepEqual(certificateJobBackups([row('/etc/nginx/nginx.conf',id)+row('/etc/nginx/mime.types',id)]),[]);
 assert.deepEqual(certificateJobBackups(['prefix '+row('/etc/nginx/nginx.conf',id),row('/etc/nginx/nginx.conf','bad')]),[]);assert.deepEqual(certificateJobBackups(null),[]);
});
