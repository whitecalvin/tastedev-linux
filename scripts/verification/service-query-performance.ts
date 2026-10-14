import type {ServiceQueryRow} from './service-status-query-candidate.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {performance} from 'node:perf_hooks';
import {writeFile} from 'node:fs/promises';
import {queryServiceStatuses} from './service-status-query-candidate.ts';
const run=promisify(execFile);
const units=['nginx.service','cron.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service'];
async function previous():Promise<Record<string,unknown>[]> {return Promise.all(units.map(async unit=>{
 try{const {stdout}=await run('/usr/bin/systemctl',['show',unit,'--property=ActiveState,SubState,LoadState,UnitFileState,Description','--no-pager'],{timeout:5000});
 return {unit,...Object.fromEntries(stdout.trim().split('\n').filter(line=>line.includes('=')).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)];}))};
 }catch(error){return {unit,ActiveState:'unknown',error:object(error)?error.stderr||error.message:undefined};}
}));}
type Sample={previousMs:number;batchMs:number};
const samples:Sample[]=[];let oldRows:Record<string,unknown>[]|undefined,newRows:ServiceQueryRow[]|undefined;
for(let round=0;round<7;round++){
 const measure=async<T>(fn:()=>Promise<T>)=>{const start=performance.now();const value=await fn();return {ms:performance.now()-start,value};};
 let before,after;
 if(round%2){after=await measure(()=>queryServiceStatuses(units,run));before=await measure(previous);}
 else{before=await measure(previous);after=await measure(()=>queryServiceStatuses(units,run));}
 samples.push({previousMs:before.ms,batchMs:after.ms});oldRows=before.value;newRows=after.value;
}
const fields=['unit','ActiveState','SubState','LoadState','UnitFileState','Description'];
const comparable=(rows:Record<string,unknown>[])=>rows.map(row=>Object.fromEntries(fields.map(key=>[key,row[key]??null])));
if(!oldRows||!newRows)throw Error('Service comparison did not produce rows');
const equal=JSON.stringify(comparable(oldRows))===JSON.stringify(comparable(newRows));
const median=(key:keyof Sample)=>samples.map(sample=>sample[key]).sort((a,b)=>a-b)[3];
const result={scope:'Read-only systemctl query only; excludes PostgreSQL discovery, authentication, HTTP and browser navigation',samples,
 previousProcesses:6,batchProcesses:1,previousMedianMs:median('previousMs'),batchMedianMs:median('batchMs'),
 statesEquivalent:equal,actualServiceStatesObserved:newRows.some(row=>row.ActiveState!=='unknown'),rows:newRows};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(!equal)process.exitCode=1;
