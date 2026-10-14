import test from 'node:test';
import assert from 'node:assert/strict';
import {cronContext,cronCommandHasInputSeparator} from '../lib/cron-context.ts';
test('cron clock distinguishes process timezone and preserves ordered crontab declarations',()=>{
 const text='# TZ=ignored\nCRON_TZ=Asia/Seoul\nMAILTO=secret@example.com\nTZ = "UTC"\n0 1 * * * /bin/true\n';const snapshot=cronContext(text,new Date('2026-10-03T00:00:00Z'),'UTC');assert.equal(snapshot.observedAt,'2026-10-03T00:00:00.000Z');assert.equal(snapshot.processTimeZone,'UTC');assert.deepEqual(snapshot.declarations,[{line:2,name:'CRON_TZ',value:'Asia/Seoul'},{line:4,name:'TZ',value:'"UTC"'}]);assert(!JSON.stringify(snapshot).includes('secret'));
});
test('cron percent separator notices account for escaping but not shell quotes',()=>{
 assert.equal(cronCommandHasInputSeparator('date +%F'),true);assert.equal(cronCommandHasInputSeparator("date '+%F'"),true);assert.equal(cronCommandHasInputSeparator('date +\\%F'),false);assert.equal(cronCommandHasInputSeparator('echo \\\\%data'),true);assert.equal(cronCommandHasInputSeparator('/bin/true'),false);
});
