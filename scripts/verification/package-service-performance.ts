import type {ServiceRecord} from '../../components/console-types';
import {serviceStatus} from '../../lib/operations.ts';
import {performance} from 'node:perf_hooks';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const units=['nginx.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service'];
type Sample={fullMs:number;scopedMs:number};
const results:{unit:string;samples:Sample[];fullMedianMs:number;scopedMedianMs:number;rows:ServiceRecord[]}[]=[];
const measure=async(fn:()=>ReturnType<typeof serviceStatus>)=>{const start=performance.now();const rows=await fn();return {ms:performance.now()-start,rows};};
for(const unit of units){
 const samples:Sample[]=[];let observed:ServiceRecord[]|undefined;
 for(let round=0;round<7;round++){
  let full,scoped;
  if(round%2){scoped=await measure(()=>serviceStatus({unit}));full=await measure(()=>serviceStatus());}
  else{full=await measure(()=>serviceStatus());scoped=await measure(()=>serviceStatus({unit}));}
  const selected=full.rows.filter(row=>row.unit===unit||(unit==='postgresql.service'&&row.configPath));
  assert.deepEqual(scoped.rows,selected,'scoped reads must preserve selected service and cluster results');
  observed=scoped.rows;
  samples.push({fullMs:full.ms,scopedMs:scoped.ms});
 }
 if(!observed)throw Error('Service measurement did not produce rows');
 const median=(key:keyof Sample)=>samples.map(sample=>sample[key]).sort((a,b)=>a-b)[3];
 results.push({unit,samples,fullMedianMs:median('fullMs'),scopedMedianMs:median('scopedMs'),rows:observed});
}
const source=await readFile(new URL('../../lib/operations.ts',import.meta.url));
const result={status:'PASS',scope:'Local read-only service status and PostgreSQL discovery; not HTTP/browser navigation, deployment, or a whole-app speedup percentage',sourceSha256:createHash('sha256').update(source).digest('hex'),standardProcesses:{full:6,scoped:1},selectedResultsEquivalent:true,results};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,results:results.map(({unit,fullMedianMs,scopedMedianMs})=>({unit,fullMedianMs,scopedMedianMs}))},null,2));
