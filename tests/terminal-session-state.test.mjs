import test from 'node:test';import assert from 'node:assert/strict';import {recoverTerminalTabs,recoverTerminalWorkspace,missingTerminalSession,applyTerminalSnapshot,openTerminalHistory} from '../lib/terminal-session-state.ts';
test('server restart retains stale shell output and allocates a new shell without replaying saved commands',()=>{
 const tabs=[{id:'saved',label:'Claude',job:{id:'vanished',command:'claude',status:'running',stdinOpen:true,logs:[{sequence:1,text:'retained output'}],logSequence:1}}];
 const next=recoverTerminalWorkspace(tabs,[],['vanished'],()=> 'fresh');
 assert.equal(next.length,2);assert.equal(next[0].job.status,'failed');assert.equal(next[0].job.stdinOpen,false);assert.equal(next[0].job.logs[0].text,'retained output');assert.equal(next[0].job.command,'claude');assert.deepEqual(next[1],{id:'fresh',label:'Terminal 2',job:null});assert.equal(tabs[0].job.status,'running');
 assert.deepEqual(recoverTerminalWorkspace(next,[],[],()=>{throw Error('duplicate');}),next);
 assert.deepEqual(recoverTerminalWorkspace([],[],[],()=> 'first'),[{id:'first',label:'Terminal 1',job:null}]);
 const live={...tabs[0].job,id:'existing'};assert.equal(recoverTerminalWorkspace(tabs,[live],['vanished'],()=>{throw Error('duplicate');})[1].job.id,'existing');
 const done=[{...tabs[0],job:{...tabs[0].job,status:'success'}}];assert.deepEqual(recoverTerminalWorkspace(done,[],[],()=>{throw Error('history replay');}),done);
 const full=Array.from({length:4},(_,i)=>({id:String(i),job:{...tabs[0].job,id:'old-'+i}}));assert.equal(recoverTerminalWorkspace(full,[],full.map(tab=>tab.job.id),()=>{throw Error('fifth');}).length,4);
});
test('reload recovers live sessions into empty tabs and updates existing output without duplicates',()=>{
 const first={id:'one',status:'running',logs:['new']},second={id:'two',status:'running'},done={id:'done',status:'success'};
 const initial=[{id:'initial',label:'Terminal 1',job:null}],next=recoverTerminalTabs(initial,[first,second,done]);assert.equal(next.length,2);assert.equal(next[0].id,'initial');assert.equal(next[0].job.id,'one');assert.equal(initial[0].job,null);assert.equal(recoverTerminalTabs(next,[first,second]).length,2);
 const updated=recoverTerminalTabs(next,[{...first,status:'success',logs:['finished']},second]);assert.equal(updated[0].job.status,'success');assert.deepEqual(updated[0].job.logs,['finished']);assert.equal(updated[1].id,next[1].id);
});
test('local ended tabs and current edits survive recovery and the tab limit is preserved',()=>{
 const tabs=Array.from({length:4},(_,i)=>({id:String(i),label:'Custom '+i,job:{id:'old-'+i,status:'success'}}));assert.deepEqual(recoverTerminalTabs(tabs,[{id:'new',status:'running'}]),tabs);
 assert.deepEqual(recoverTerminalTabs(tabs,[]),tabs);
});

test('only authoritative missing-session errors end a local running job and retain its output',()=>{
 const job={id:'old',status:'running',stdinOpen:true,logSequence:5,logs:[{sequence:5,text:'previous output'}]};
 for(const status of [undefined,401,403,409,500])assert.equal(missingTerminalSession(job,{status,message:'failure'}),null);
 const ended=missingTerminalSession(job,{status:404,message:'session missing'});assert.equal(ended.status,'failed');assert.equal(ended.stdinOpen,false);assert.equal(ended.logSequence,6);assert.equal(ended.logs[0].text,'previous output');assert.equal(ended.logs[1].sequence,6);assert.equal(job.status,'running');
});

test('missing-session guidance accepts unknown errors without treating network failures as exits',()=>{
 const job={id:'live',command:'bash',status:'running',logs:[]};
 for(const error of [null,undefined,'network error',{},Error('transport')])assert.equal(missingTerminalSession(job,error),null);
 for(const error of [{status:404},{status:404,message:{private:'details'}}]){const ended=missingTerminalSession(job,error);assert.equal(ended.status,'failed');assert.equal(ended.logs.at(-1).text,'\r\n명령 기록을 찾을 수 없습니다.\r\n');}
});

test('late terminal snapshots cannot replace a restarted session or roll back output and exit state',()=>{
 const tabs=[{id:'tab',job:{id:'new',status:'running',logSequence:8,logs:[{sequence:8,text:'latest'}]}}];
 assert.strictEqual(applyTerminalSnapshot(tabs,'tab',{id:'old',status:'failed'},'old')[0],tabs[0]);
 assert.strictEqual(applyTerminalSnapshot(tabs,'tab',{id:'new',status:'running',logSequence:7},'new')[0],tabs[0]);
 const ended=applyTerminalSnapshot(tabs,'tab',{id:'new',status:'success',logSequence:8},'new');assert.equal(ended[0].job.status,'success');
 assert.strictEqual(applyTerminalSnapshot(ended,'tab',{id:'new',status:'running',logSequence:8},'new')[0],ended[0]);
 assert.strictEqual(recoverTerminalTabs(ended,[{id:'new',status:'running',logSequence:7}])[0],ended[0]);
 assert.equal(applyTerminalSnapshot(ended,'tab',{id:'next',status:'running',logSequence:0})[0].job.id,'next');
});

test('completed history opens its original output without rerunning or duplicating a session',()=>{const tabs=[{id:'shell',job:{id:'live',status:'running'}}],job={id:'old',command:'echo result',status:'success',logs:[{text:'result'}]};const opened=openTerminalHistory(tabs,job);assert.equal(opened.tabs.length,2);assert.equal(opened.tabs[1].job,job);assert.equal(opened.active,'history-old');assert.equal(tabs.length,1);assert.equal(openTerminalHistory(opened.tabs,job).tabs,opened.tabs);assert.equal(openTerminalHistory(tabs,{id:'other',status:'running'}),null);assert.equal(openTerminalHistory([...opened.tabs,{id:'3'},{id:'4'}],{...job,id:'fifth'}),null);});

test('complete context marks missing requested shells unavailable while preserving output and newer launches',()=>{
 const old={id:'gone',status:'running',stdinOpen:true,logSequence:4,logs:[{sequence:4,text:'retained output'}]},newer={id:'new',status:'running',stdinOpen:true};
 const tabs=[{id:'old',job:old},{id:'later',job:newer}];
 const next=recoverTerminalTabs(tabs,[],['gone']);assert.equal(next[0].job.status,'failed');assert.equal(next[0].job.stdinOpen,false);assert.equal(next[0].job.logs[0].text,'retained output');assert.equal(next[0].job.logs[1].sequence,5);assert.equal(next[1].job,newer,'a shell launched after the request cannot be declared missing');assert.equal(old.status,'running','the old draft remains immutable');
 assert.equal(recoverTerminalTabs(next,[],['gone'])[0].job,next[0].job,'a missing-session notice is not appended again');
 const restored=recoverTerminalTabs(tabs,[{...old,logSequence:5,logs:[{sequence:5,text:'fresh output'}]}],['gone']);assert.equal(restored[0].job.status,'running');assert.equal(restored[0].job.logs[0].text,'fresh output');
});

test('incremental stream snapshots merge output without duplication and reject unrelated payloads',async()=>{
 const {mergeTerminalEvent}=await import('../lib/terminal-session-state.ts');const previous={id:'live',status:'running',logSequence:1,logs:[{sequence:1,text:'old'}]},next={id:'live',status:'running',logSequence:2,logs:[{sequence:2,text:'new'}]};const merged=mergeTerminalEvent(previous,next);assert.deepEqual(merged.logs.map(item=>item.text),['old','new']);assert.deepEqual(mergeTerminalEvent(merged,next).logs,merged.logs);assert.equal(mergeTerminalEvent(merged,previous),merged);assert.throws(()=>mergeTerminalEvent(previous,{...next,id:'other'}));assert.throws(()=>mergeTerminalEvent(previous,{...next,logs:[{sequence:3,text:'bad'}]}));assert.throws(()=>mergeTerminalEvent(previous,{...next,status:'unknown'}));
});
