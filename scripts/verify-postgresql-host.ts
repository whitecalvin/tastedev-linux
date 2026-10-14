import type {PostgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {hasErrorCode} from '../lib/error-code.ts';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {postgresqlConfigGraph} from '../lib/postgresql-config-graph.ts';
import {postgresqlConfigCandidate} from '../lib/postgresql-config-candidate.ts';
import {inspectPostgresqlConfigCandidate} from '../lib/postgresql-config-validation.ts';
import {validationIdentityBinary} from '../lib/validation-identity-binary.ts';

// Installed binaries, private fixtures, no running database or service access.
const args=process.argv.slice(2);
if(args.length>1||args[0]&&!/^[1-9][0-9]$/.test(args[0]))throw Error('Usage: node scripts/verify-postgresql-host.ts [major]');
const major=args[0]||'18';
if(Number(major)<15)throw Error('PostgreSQL 15 or later is required.');
assert(process.getuid&&process.getgid,'Linux identity support required');const uid=process.getuid(),gid=process.getgid();
assert.notEqual(uid,0,'Run this private fixture verifier as a non-root account.');
const binary='/usr/lib/postgresql/'+major+'/bin/postgres';
const binaries=['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',binary].map(binary=>validationIdentityBinary({binary}));
const version=execFileSync(binary,['--version'],{encoding:'utf8',timeout:10000}).trim();
assert.match(version,new RegExp('PostgreSQL\\) '+major+'\\.'));
const base=await verificationWorkDirectory('tastedev-pg-host-');
const cluster=path.join(base,'postgresql',major,'fixture');
const root='/etc/postgresql/'+major+'/fixture/postgresql.conf';
const checks:string[]=[];
const current:{value:PostgresqlConfigCandidate|null}={value:null};
async function verify(text:string,files:Record<string,string>,expected:Record<string,string>|null,rejected=false){
 await rm(cluster,{recursive:true,force:true});
 await mkdir(path.join(cluster,'conf.d'),{recursive:true,mode:0o700});
 const originals=new Map([['postgresql.conf',text],...Object.entries(files)]);
 for(const [name,content] of originals)await writeFile(path.join(cluster,name),content,{mode:0o600});
 current.value=await postgresqlConfigCandidate(await postgresqlConfigGraph(root,{base}));
 const directory=current.value.directory;
 try{
  const run=()=>inspectPostgresqlConfigCandidate(current.value,{validationUid:uid,validationGid:gid});
  if(rejected)await assert.rejects(run,error=>error instanceof Error&&'status' in error&&error.status===400&&!error.message.includes('fixture_private_marker'));
  else{
   const report=await run();
   assert.deepEqual(report.values,expected);
   assert.equal(report.namespaceUid,uid);
   assert.equal(report.namespaceGid,gid);
   assert.equal(report.postmasterStarted,false);
   assert.equal(report.operatingConfigurationChanged,false);
   assert.equal(report.operatingServiceChanged,false);
  }
  for(const [name,content] of originals)assert.equal(await readFile(path.join(cluster,name),'utf8'),content);
 }finally{await current.value.cleanup();current.value=null;}
 await assert.rejects(stat(directory),error=>hasErrorCode(error,'ENOENT'));
}
try{
 const main="port=5433\nmax_connections=20\nshared_buffers='16MB'\nwork_mem='4MB'\nlogging_collector=off\n";
 const values={port:'5433',max_connections:'20',shared_buffers:'2048',work_mem:'4096',logging_collector:'off'};
 await verify(main,{},values);
 checks.push('real namespace identity and five native configuration values');
 await verify(main+"include 'extra.conf'\ninclude_dir 'conf.d'\ninclude_if_exists 'absent.conf'\n",{
  'extra.conf':"work_mem='8MB'\n",
  'conf.d/20-last.conf':'port=5435\n',
  'conf.d/10-first.conf':'port=5434\n'
 },{...values,port:'5435',work_mem:'8192'});
 checks.push('include graph, sorted include_dir precedence and optional missing include');
 await verify(main+"fixture_private_marker='never expose this diagnostic'\n",{},null,true);
 checks.push('unknown native parameter rejected with sanitized error');
 await verify(main+"shared_buffers='not_a_memory_size'\n",{},null,true);
 checks.push('invalid native value rejected');
 checks.push('all original fixture bytes preserved and private candidates removed');
 assert.deepEqual(['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/id',binary].map(binary=>validationIdentityBinary({binary})),binaries);
 const record={status:'PASS',version,binaries,checks,scope:'installed-binaries-private-config-options',namespaceUid:uid,namespaceGid:gid,operatingConfigurationChanged:false,operatingServiceChanged:false,postmasterStarted:false,operationalResourcesVerified:false,autoConfigurationVerified:false};
 const evidence=path.join(verificationWorkRoot,'postgresql-host-'+new Date().toISOString().replaceAll(':','-')+'.json');
 await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});
 await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({...record,evidence}));
}finally{await current.value?.cleanup();await rm(base,{recursive:true,force:true});}
