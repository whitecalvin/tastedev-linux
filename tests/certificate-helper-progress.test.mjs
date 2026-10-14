import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {certificateExecution} from '../lib/certificate-execution.ts';
import {certificateProcessOutput} from '../lib/certificate-process-output.ts';
import {certificateJobLog} from '../lib/certificate-job-log.ts';
const source=readFileSync(new URL('../scripts/admin/linux-admin',import.meta.url),'utf8').replace(/^#!.*\n/,'').split('main().catch')[0];
const input={domain:'example.com',email:'admin@example.com',agree:true,confirm:true};

test('canonical helper emits backup progress before the command and preserves it on success and failure',async()=>{
 for(const phase of ['success','acme-failure','partial-backup']){
  const stdout=[],stderr=[],rows=[];let calls=0;
  const entries=[{id:'11111111-1111-4111-8111-111111111111',path:'/etc/nginx/nginx.conf'},{id:'22222222-2222-4222-8222-222222222222',path:'/etc/nginx/conf.d/example.conf'}];
  const context=vm.createContext({require:createRequire(import.meta.url),Buffer,process:{...process,stdout:{write:value=>stdout.push(value)},stderr:{write:value=>stderr.push(value)}},runtimeFixture:{certificateExecution,backupCertificateNginx:async(name,{onBackup})=>{
   assert.equal(name,'example.com');await onBackup(entries[0]);
   if(phase==='partial-backup')throw Error('private fixture backup failure');
   await onBackup(entries[1]);return {backups:entries};
  }},runFixture:()=>{calls++;assert.equal(stdout.length,2);if(phase==='acme-failure')throw Error('urn:ietf:params:acme:error:dns fixture-private-account');return '한글 인증서 결과\n';}});
  vm.runInContext(source,context);
  // Only OS boundary dependencies are replaced; dispatch/executor/protocol are current source.
  vm.runInContext('nginxMutationStateGuard=()=>{};mariaRuntime=async()=>runtimeFixture;run=runFixture;',context);
  try{const output=await vm.runInContext('dispatch("certificate",'+JSON.stringify(input)+')',context);stdout.push(JSON.stringify(output));assert.equal(phase,'success');}
  catch(error){assert.notEqual(phase,'success');context.fixtureError=error;stderr.push(vm.runInContext('helperErrorOutput(fixtureError,"certificate")',context));}
  const collector=certificateProcessOutput(lines=>rows.push(...lines));
  for(const text of stdout){const bytes=Buffer.from(text);for(let i=0;i<bytes.length;i++)collector.stdout(bytes.subarray(i,i+1));}
  for(const text of stderr)collector.stderr(Buffer.from(text));collector.end();
  const shown=certificateJobLog(rows);assert.equal(shown.split('nginx 설정 백업 · ').length-1,phase==='partial-backup'?1:2);
  assert.equal(calls,phase==='partial-backup'?0:1);assert(!shown.includes('fixture-private-account'));assert(!shown.includes('server_name'));
  if(phase==='success')assert(shown.endsWith('한글 인증서 결과\n'));
  if(phase==='acme-failure')assert.match(shown,/DNS 검증/);
 }
});
