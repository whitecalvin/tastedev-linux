import type {TerminalOutputJob} from './terminal-output-frame.ts';
export type TerminalSession = TerminalOutputJob & {command: string; status: string; cwd?: string; pty?: boolean; stdinOpen?: boolean; logSequence?: number; exitCode?: number | null; logs?: {text: string; sequence?: number; kind?: string}[]};
export type TerminalSessionTab = {id: string; label: string; job: TerminalSession | null; report?: false};
function acceptSnapshot(previous: TerminalSession | null | undefined,next: TerminalSession){
 if(previous?.id!==next?.id)return true;
 if((next.logSequence||0)<(previous?.logSequence||0))return false;
 return !(previous?.status!=='running'&&next.status==='running');
}
export function applyTerminalSnapshot(tabs: TerminalSessionTab[],key: string,value: TerminalSession,expectedId?: string){
 return tabs.map(tab=>tab.id!==key||(expectedId!==undefined&&tab.job?.id!==expectedId)||!acceptSnapshot(tab.job,value)?tab:{...tab,job:value});
}
export function openTerminalHistory(tabs: TerminalSessionTab[],job: TerminalSession | null | undefined){
 const existing=tabs.find(tab=>tab.job?.id===job?.id);
 if(existing)return {tabs,active:existing.id};
 if(!job?.id||job.status==='running'||tabs.length>=4)return null;
 const tab={id:'history-'+job.id,label:job.command||'Terminal',job};
 return {tabs:[...tabs,tab],active:tab.id};
}

// Reattach server sessions without replacing local tabs or creating duplicate jobs.
export function recoverTerminalTabs(tabs: TerminalSessionTab[],sessions: TerminalSession[],reconcileIds: string[]=[]){
 const known=new Map(sessions.map(job=>[job.id,job]));
 const requested=new Set(reconcileIds);
 const next=tabs.map(tab=>{
  const saved=tab.job?known.get(tab.job.id):undefined;if(saved)return acceptSnapshot(tab.job,saved)?{...tab,job:saved}:tab;
  if(tab.job?.status==='running'&&requested.has(tab.job.id))return {...tab,job:missingTerminalSession(tab.job,{status:404,message:'명령 기록을 찾을 수 없습니다.'})};
  return tab;
 });
 const attached=new Set(next.map(tab=>tab.job?.id).filter(Boolean));
 for(const job of sessions){
  if(job.status!=='running'||attached.has(job.id))continue;
  const empty=next.findIndex(tab=>!tab.job);
  if(empty>=0)next[empty]={...next[empty],job};
  else if(next.length<4)next.push({id:'recovered-'+job.id,label:'Terminal '+(next.length+1),job});
  attached.add(job.id);
 }
 return next;
}

// Only a complete context response can establish that a saved shell disappeared.
// Keep its output and allocate a fresh shell tab instead of replaying its command.
export function recoverTerminalWorkspace(tabs: TerminalSessionTab[],sessions: TerminalSession[],reconcileIds: string[],createId: () => string){
 const next=recoverTerminalTabs(tabs,sessions,reconcileIds);
 const missing=new Set(reconcileIds.filter(id=>!sessions.some(job=>job.id===id)));
 if(next.length>=4||next.some(tab=>!tab.job||tab.job.status==='running')||next.length&&!next.some(tab=>Boolean(tab.job&&missing.has(tab.job.id))))return next;
 const id=createId();
 if(typeof id!=='string'||!id||next.some(tab=>tab.id===id))throw Error('터미널 탭을 생성하지 못했습니다.');
 return [...next,{id,label:'Terminal '+(next.length+1),job:null}];
}

// A missing server job is terminal; transport/auth failures are not evidence of exit.
export function missingTerminalSession(job: TerminalSession | null | undefined,error: unknown): TerminalSession | null{
 if(!job||!error||typeof error!=='object'||!('status' in error)||error.status!==404)return null;
 const message='message' in error&&typeof error.message==='string'?error.message:'명령 기록을 찾을 수 없습니다.';
 return {...job,status:'failed',stdinOpen:false,exitCode:null,logs:[...(job.logs||[]),{kind:'stderr',sequence:(job.logSequence||0)+1,text:'\r\n'+message+'\r\n'}].slice(-500),logSequence:(job.logSequence||0)+1};
}

// Event payloads carry only new output; retain local history and reject stale events.
export function mergeTerminalEvent(previous: TerminalSession | null | undefined,next: TerminalSession): TerminalSession{
 if(!previous||!next||next.id!==previous?.id||!['running','success','failed'].includes(next.status)||!Number.isSafeInteger(next.logSequence)||(next.logSequence ?? -1)<0||!Array.isArray(next.logs)||next.logs.some(item=>!Number.isSafeInteger(item.sequence)||(item.sequence ?? 0)<1||(item.sequence ?? 0)>(next.logSequence ?? 0)||typeof item.text!=='string'))throw Error('서버 요청에 실패했습니다.');
 if(!acceptSnapshot(previous,next))return previous;
 const logs=new Map((previous.logs||[]).map(item=>[item.sequence,item]));for(const item of next.logs)logs.set(item.sequence,item);
 return {...next,logs:[...logs.values()].sort((a,b)=>a.sequence!-b.sequence!).slice(-500)};
}

export function applyTerminalEvent(tabs: TerminalSessionTab[],key: string,value: TerminalSession,expectedId: string){
 return tabs.map(tab=>tab.id===key&&tab.job?.id===expectedId?{...tab,job:mergeTerminalEvent(tab.job,value)}:tab);
}
