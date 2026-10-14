import test from 'node:test';
import assert from 'node:assert/strict';
import {basicCronSchedule,parseBasicCronSchedule} from '../lib/cron-basic-schedule.ts';
test('daily weekly monthly GUI schedules round trip and Sunday alias is normalized',()=>{
 for(const value of [{kind:'daily',hour:3,minute:0},{kind:'weekly',hour:23,minute:59,day:6},{kind:'monthly',hour:0,minute:1,day:31}])assert.deepEqual(parseBasicCronSchedule(basicCronSchedule(value)),value);
 assert.deepEqual(parseBasicCronSchedule('0 3 * * 7'),{kind:'weekly',hour:3,minute:0,day:0});
});
test('custom ranges steps and day/month combinations stay custom and numeric coercion is refused',()=>{
 for(const schedule of ['*/5 * * * *','0 3 1 * 1','0 3 * 2 *','60 3 * * *','0 24 * * *','0 3 32 * *'])assert.equal(parseBasicCronSchedule(schedule),null);
 for(const value of [null,true,[],[3],'','3e0',-1,24])assert.throws(()=>basicCronSchedule({kind:'daily',hour:value,minute:0}));assert.throws(()=>basicCronSchedule({kind:'weekly',hour:3,minute:0,day:7}));
});
