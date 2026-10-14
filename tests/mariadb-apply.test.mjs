import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {mariadbTopology} from '../lib/mariadb-topology.ts';
import {applyMariaDBConfig} from '../lib/mariadb-apply.ts';
async function fixture(run){const base=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-maria-apply-')),backupRoot=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-maria-backups-'));try{await mkdir(join(base,'conf.d'),{mode:0o700});await writeFile(join(base,'my.cnf'),'!includedir /etc/mysql/conf.d\n',{mode:0o600});await writeFile(join(base,'conf.d/a.cnf'),'[mariadbd]\nport=3306\npassword=private\n',{mode:0o600});await writeFile(join(base,'conf.d/b.cnf'),'[mariadbd]\nmax_connections=100\n',{mode:0o600});const graph=await mariadbTopology('/etc/mysql/my.cnf',base);await run({base,backupRoot,input:{root:graph.root,target:'/etc/mysql/conf.d/a.cnf',version:graph.version,changes:{port:3307},confirm:true}});}finally{await rm(base,{recursive:true,force:true});await rm(backupRoot,{recursive:true,force:true});}}
function runner({onOptions,onRestart,failRestart=false}={}){const calls=[];let restarts=0;return {calls,run:async(binary,args)=>{calls.push([binary,args]);if(args[0]==='--no-defaults')return '--validate-config';if(binary==='/usr/bin/my_print_defaults'){await onOptions?.();return '--port=3307\n--password=private\n';}if(args.includes('restart')){restarts++;await onRestart?.(restarts);if(restarts===1&&failRestart)throw Error('private');}return '';}};}
test('MariaDB apply composes graph validation, private backup and service activation without exposing configuration',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner(),result=await applyMariaDBConfig(input,{...execute,base,backupRoot});assert(result.changed);assert.equal(result.validationMode,'configuration');assert(!JSON.stringify(result).includes('private'));assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port = 3307/);assert.equal((await readdir(backupRoot)).filter(name=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(name)).length,1);assert(execute.calls.some(([,args])=>args.includes('restart')));assert(!(await readdir(base)).includes('.tastedev-mariadb-graph-lock'));
}));
test('MariaDB apply refuses an include change during validation before replacing the target',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner({onOptions:()=>writeFile(join(base,'conf.d/b.cnf'),'[mariadbd]\nmax_connections=200\n')});await assert.rejects(applyMariaDBConfig(input,{...execute,base,backupRoot}),error=>error.status===409);assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port=3306/);assert.equal(execute.calls.some(([,args])=>args.includes('restart')),false);
}));
test('MariaDB activation failure restores the pre-operation file and checks graph before service recovery',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner({failRestart:true}),before=await readFile(join(base,'conf.d/a.cnf'),'utf8');const result=await applyMariaDBConfig(input,{...execute,base,backupRoot});assert(result.failed);assert(result.restored);assert(result.recovered);assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),before);
}));

test('MariaDB rollback preserves changed sibling includes and reports service recovery as incomplete',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner({failRestart:true,onRestart:count=>count===1?writeFile(join(base,'conf.d/b.cnf'),'[mariadbd]\nmax_connections=200\n'):undefined});const before=await readFile(join(base,'conf.d/a.cnf'),'utf8');const result=await applyMariaDBConfig(input,{...execute,base,backupRoot});assert(result.failed);assert(result.restored);assert.equal(result.recovered,false);assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),before);assert.equal(await readFile(join(base,'conf.d/b.cnf'),'utf8'),'[mariadbd]\nmax_connections=200\n');assert.equal(execute.calls.filter(([,args])=>args.includes('restart')).length,1);
}));

test('MariaDB full-file restoration validates rewired restored includes and backs up the replaced current file',async()=>fixture(async({base,backupRoot,input})=>{
 await mkdir(join(base,'extra'),{mode:0o700});await writeFile(join(base,'extra/old.cnf'),'[mariadbd]\nmax_connections=50\n',{mode:0o600});
 const restoreText='[mariadbd]\nport=3305\npassword=restored-private\n!include /etc/mysql/extra/old.cnf\n';const before=await readFile(join(base,'conf.d/a.cnf'),'utf8');
 const execute=runner(),result=await applyMariaDBConfig({...input,changes:{}},{...execute,base,backupRoot,restoreText});assert(result.changed);assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),restoreText);const backup=JSON.parse(await readFile(join(backupRoot,result.backupId+'.json'),'utf8'));assert.equal(backup.text,before);assert(!JSON.stringify(result).includes('private'));
}));
test('MariaDB restore refuses changed newly referenced include files before replacing the operational target',async()=>fixture(async({base,backupRoot,input})=>{
 await mkdir(join(base,'extra'),{mode:0o700});const extra=join(base,'extra/old.cnf');await writeFile(extra,'[mariadbd]\nmax_connections=50\n',{mode:0o600});
 const restoreText='[mariadbd]\nport=3305\n!include /etc/mysql/extra/old.cnf\n',execute=runner({onOptions:()=>writeFile(extra,'[mariadbd]\nmax_connections=60\n')});
 await assert.rejects(applyMariaDBConfig({...input,changes:{}},{...execute,base,backupRoot,restoreText}),error=>error.status===409);assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port=3306/);assert(!execute.calls.some(([,args])=>args.includes('restart')));
}));
test('MariaDB restore restart failure rolls back to the configuration present before restoration',async()=>fixture(async({base,backupRoot,input})=>{
 const before=await readFile(join(base,'conf.d/a.cnf'),'utf8'),execute=runner({failRestart:true});const result=await applyMariaDBConfig({...input,changes:{}},{...execute,base,backupRoot,restoreText:'[mariadbd]\nport=3305\npassword=old-private\n'});assert(result.failed);assert(result.restored);assert(result.recovered);assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),before);
}));

test('MariaDB restore rejects unsupported restored include paths without changing files or restarting',async()=>fixture(async({base,backupRoot,input})=>{
 const before=await readFile(join(base,'conf.d/a.cnf'),'utf8'),execute=runner();await assert.rejects(applyMariaDBConfig({...input,changes:{}},{...execute,base,backupRoot,restoreText:'[mariadbd]\n!include /etc/shadow\n'}));assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),before);assert(!execute.calls.some(([,args])=>args.includes('restart')));assert.equal((await readdir(backupRoot)).length,0);
}));

test('MariaDB apply refuses a mismatched service main before any validation command or backup',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner();await assert.rejects(applyMariaDBConfig(input,{...execute,base,backupRoot,inspectService:async()=>({argv:['/usr/sbin/mariadbd','--defaults-file=/etc/mysql/mariadb.cnf'],canonical:value=>value})}),error=>error.status===409);assert.equal(execute.calls.length,0);assert.equal((await readdir(backupRoot)).length,0);assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port=3306/);
}));
test('MariaDB apply rechecks service startup scope before replacing a validated target',async()=>fixture(async({base,backupRoot,input})=>{
 let checks=0;const execute=runner();await assert.rejects(applyMariaDBConfig(input,{...execute,base,backupRoot,inspectService:async()=>({argv:['/usr/sbin/mariadbd','--defaults-file='+(++checks===1?'/etc/mysql/my.cnf':'/etc/mysql/mariadb.cnf')],canonical:value=>value})}),error=>error.status===409);assert.equal(checks,2);assert(!execute.calls.some(([,args])=>args.includes('restart')));assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port=3306/);
}));

const isolatedReport={valid:true,scope:'private-options-validation',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,validationMode:'options-help',values:{port:3307}};
test('MariaDB apply and full-file restore pass private candidates through the trusted isolated inspector',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner();let inspected=0;
 const candidateInspector=async candidate=>{inspected++;assert(candidate.main.startsWith(join('/mnt/data/build/tastedev-linux','tastedev-mariadb-candidate-')));assert.match(await readFile(candidate.main,'utf8'),/includedir/);return isolatedReport;};
 const result=await applyMariaDBConfig(input,{...execute,base,backupRoot,candidateInspector});assert(result.changed);assert.equal(result.validationMode,'options-help');assert.equal(inspected,1);assert(!execute.calls.some(([binary,args])=>binary==='/usr/bin/my_print_defaults'||args[0]?.startsWith('--defaults-file=')));
 const graph=await mariadbTopology(input.root,base),restored=await applyMariaDBConfig({...input,version:graph.version,changes:{}},{...execute,base,backupRoot,candidateInspector,restoreText:'[mariadbd]\nport=3306\n'});assert(restored.changed);assert.equal(inspected,2);assert.match(await readFile(join(base,'conf.d/a.cnf'),'utf8'),/port=3306/);
}));
test('MariaDB isolation rejection leaves operational fixture untouched with no backup or restart',async()=>fixture(async({base,backupRoot,input})=>{
 const execute=runner(),before=await readFile(join(base,'conf.d/a.cnf'),'utf8');
 await assert.rejects(applyMariaDBConfig(input,{...execute,base,backupRoot,candidateInspector:async()=>({...isolatedReport,namespaceCommandsCompleted:false})}),/Configuration validation failed/);
 assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),before);assert.equal((await readdir(backupRoot)).length,0);assert(!execute.calls.some(([,args])=>args.includes('restart')));assert(!(await readdir(base)).includes('.tastedev-mariadb-graph-lock'));
}));
