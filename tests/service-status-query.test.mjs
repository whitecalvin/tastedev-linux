import test from 'node:test';
import assert from 'node:assert/strict';
import {queryServiceStatuses} from '../scripts/verification/service-status-query-candidate.ts';
const units = ['nginx.service', 'cron.service'];
const row = unit => 'Id='+unit+'\nActiveState=active\nSubState=running\nLoadState=loaded\nDescription=Service = description';
test('one read-only query binds reordered rows to exact units', async () => {
 let calls=0;
 const rows=await queryServiceStatuses(units, async (binary,args,options)=>{
  calls++; assert.equal(binary,'/usr/bin/systemctl');assert.deepEqual(args.slice(0,3),['show',...units]);assert.equal(options.timeout,5000);
  return {stdout:row(units[1])+'\n\n'+row(units[0])};
 });
 assert.equal(calls,1);assert.deepEqual(rows.map(r=>r.unit),units);
 assert.equal(rows[0].Description,'Service = description');assert.equal(rows[1].ActiveState,'active');
});
test('partial exit preserves complete known rows and marks missing rows unknown',async()=>{
 const rows=await queryServiceStatuses(units,async()=>{throw {code:1,stderr:'missing unit',stdout:row(units[0])+'\n\n'+row('other.service')};});
 assert.equal(rows[0].ActiveState,'active');assert.equal(rows[1].ActiveState,'unknown');assert.equal(rows[1].error,'missing unit');
});
test('timeouts, buffer limits and incomplete rows cannot report a successful state',async()=>{
 for(const error of [{code:1,killed:true},{code:1,signal:'SIGTERM'},{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}]){
  const rows=await queryServiceStatuses(units,async()=>{throw {...error,stdout:row(units[0])};});
  assert(rows.every(r=>r.ActiveState==='unknown'));
 }
 const rows=await queryServiceStatuses(units,async()=>({stdout:'Id=nginx.service\nActiveState=active'}));
 assert(rows.every(r=>r.ActiveState==='unknown'));
 let called=false;assert.deepEqual(await queryServiceStatuses([],async()=>{called=true;}),[]);assert.equal(called,false);
});
