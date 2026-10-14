import test from 'node:test';import assert from 'node:assert/strict';
import {operationTerminalReport} from '../lib/operation-terminal-report.ts';
import {terminalOutputFrame} from '../lib/terminal-output-frame.ts';
test('malformed operation records cannot inject objects into terminal output',()=>{
 for(const value of [null,[],true])assert.equal(operationTerminalReport('service',value),null);
 assert.equal(operationTerminalReport(null,{logs:'x'}),null);
 const report=operationTerminalReport('service',{id:{private:'secret'},command:{private:'secret'},status:{private:'secret'},exitCode:'0',logs:[null,{text:'public'}, {text:{private:'secret'}}]});
 assert.equal(report.command,'service');assert.equal(report.status,'completed');assert.equal(report.exitCode,null);assert.equal(report.logs[0].text,'public');assert(!JSON.stringify(report).includes('secret'));
});
test('package operation output is viewable but never becomes an interactive shell job',()=>{
 const installation=operationTerminalReport('job',{job:{id:'fixture',command:['apt-get','install','nginx'],status:'running',logs:['reading\n','done\n']}});assert.equal(installation.pollAction,'job');assert.equal(installation.command,'apt-get install nginx');assert.equal(installation.pty,undefined);assert.equal(installation.stdinOpen,undefined);assert.equal(terminalOutputFrame({},installation).chunks[0].text,'reading\ndone\n');
 const cert=operationTerminalReport('admin-job?id=fixture',{job:{id:'fixture',command:['certbot','renew'],status:'running',logs:['checking\n']}});assert.equal(cert.pollAction,'admin-job?id=fixture');
 assert.equal(operationTerminalReport('terminal?job=fixture',{job:{logs:['x']}}),null);assert.equal(operationTerminalReport('config-source',{text:'private'}),null);assert.equal(operationTerminalReport('service',{logs:'x'.repeat(300000)}).logs[0].text.length,262144);
});

test('HBA apply and recovery results create safe terminal output without private configuration or native errors',()=>{
 const backupId='d834ae1b-1108-4835-a860-82077d70d4f8',report=operationTerminalReport('postgresql-hba-operation',{changed:true,reloadRequested:true,managementConnectionVerified:true,reloadAcceptanceVerified:false,backupId,text:'private-draft',difference:{before:['private-original'],after:['private-after']},logs:'private-native-error',reason:'private-reason'});
 assert.equal(report.status,'completed');assert.equal(report.pollAction,null);assert.equal(report.stdinOpen,undefined);assert(report.logs[0].text.includes('Reload requested: true'));assert(report.logs[0].text.includes('Rule load acceptance verified: false'));assert(report.id.endsWith(backupId));assert(!JSON.stringify(report).includes('private-'));
 const rollback=operationTerminalReport('postgresql-hba-operation',{changed:false,failed:true,restored:true,recovered:false,backupId:'private-invalid-id'});assert.equal(rollback.status,'failed');assert.equal(rollback.exitCode,1);assert(rollback.logs[0].text.includes('Management connection recovered: false'));assert(!JSON.stringify(rollback).includes('private-invalid-id'));
 assert.equal(operationTerminalReport('postgresql-hba-operation-plan',{changed:true,difference:{before:['private']}}),null);assert.equal(operationTerminalReport('postgresql-hba-operation',{}),null);
});

test('interrupted HBA recovery emits structured terminal results without source text',()=>{const report=operationTerminalReport('postgresql-hba-recover',{changed:false,restored:true,recovered:true,reloadRequested:true,text:'private-original'});assert.equal(report.status,'completed');assert(!JSON.stringify(report).includes('private-original'));assert(report.logs[0].text.includes('Original file restored: true'));});

test('Redis complete-code terminal reports include only structured results without draft or native output',()=>{
 const plan=operationTerminalReport('redis-code-plan',{changed:true,validation:{valid:true},text:'fixture-private',resourceReview:{password:'fixture-private'},logs:'fixture-private'});assert(plan.logs[0].text.includes('Isolated startup validation: true'));assert(!JSON.stringify(plan).includes('fixture-private'));
 const applied=operationTerminalReport('redis-code-apply',{changed:false,failed:true,restored:true,recovered:true,backupId:'a1ba3524-4283-446d-9fa3-2e3a5e9a4745',logs:'fixture-private'});assert.equal(applied.status,'failed');assert(applied.logs[0].text.includes('Original file restored: true'));assert(!JSON.stringify(applied).includes('fixture-private'));
});

test('MariaDB complete-code terminal reports only options scope and structured recovery results',()=>{
 const plan=operationTerminalReport('mariadb-code-plan',{changed:true,validation:{valid:true},text:'private-draft',values:{password:'private-value'},logs:'private-native-output'});assert(plan.logs[0].text.includes('Isolated options validation: true'));assert(!plan.logs[0].text.includes('startup'));assert(!JSON.stringify(plan).includes('private-'));
 const applied=operationTerminalReport('mariadb-code-apply',{changed:false,failed:true,restored:true,recovered:false,logs:'private-native-output'});assert.equal(applied.status,'failed');assert(applied.logs[0].text.includes('Service recovered: false'));assert(!JSON.stringify(applied).includes('private-'));
});

test('PostgreSQL complete code result records options validation and rollback status without raw configuration',()=>{
 const plan=operationTerminalReport('postgresql-code-plan',{changed:true,validation:{valid:true},text:'private-draft',values:{password:'private-value'},logs:'private-native-output'});assert(plan.logs[0].text.includes('PostgreSQL'));assert(plan.logs[0].text.includes('Isolated options validation: true'));assert(!JSON.stringify(plan).includes('private-'));
 const applied=operationTerminalReport('postgresql-code-apply',{changed:false,failed:true,restored:true,recovered:false,logs:'private-native-output'});assert.equal(applied.status,'failed');assert(applied.logs[0].text.includes('Service recovered: false'));assert(!JSON.stringify(applied).includes('private-'));
});
test('PostgreSQL interrupted recovery reports structured status without private backup, source or process data',()=>{
 const plan=operationTerminalReport('postgresql-code-recovery-plan',{recoveryRequired:true,text:'private-original',service:{argv:'private-process'},logs:'private-native'});assert(plan.logs[0].text.includes('Recovery required: true'));assert(!JSON.stringify(plan).includes('private-'));const result=operationTerminalReport('postgresql-code-recover',{restored:true,recovered:false,recoveryRequired:true,failed:true,text:'private-original'});assert.equal(result.status,'failed');assert(result.logs[0].text.includes('Service recovered: false'));assert(!JSON.stringify(result).includes('private-'));
});

test('PostgreSQL full-code backup restore terminal report stores only structured public status',()=>{
 const data={changed:true,backupId:'d834ae1b-1108-4835-a860-82077d70d4f8',validation:{valid:true},text:'private-code',context:{password:'private-context'},fields:[{before:'private-field'}]};
 for(const action of ['postgresql-code-restore-plan','postgresql-code-restore']){const report=operationTerminalReport(action,data);assert.equal(report.status,'completed');assert(!JSON.stringify(report).includes('private-'));}
});

test('PostgreSQL preparation cancellation reports no service restart and excludes private temporary state',()=>{
 const report=operationTerminalReport('postgresql-code-recover',{kind:'postgresql-stage-cancellation',preparationCancelled:true,recovered:true,restored:false,serviceRestarted:false,operatingConfigurationChanged:false,journalCleanupVerified:true,text:'private-original',stages:{text:'private-candidate'}});
 assert.equal(report.status,'completed');assert(report.logs[0].text.includes('Preparation cancelled: true'));assert(report.logs[0].text.includes('Service restarted: false'));assert(report.logs[0].text.includes('Operating configuration changed: false'));assert(!report.logs[0].text.includes('Service recovered: true'));assert(!JSON.stringify(report).includes('private-'));
});
