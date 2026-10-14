import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,chmod,symlink} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {preparePostgresqlHbaValidation,validatePostgresqlHba} from '../lib/postgresql-hba-validate.ts';
import {postgresqlHbaNamespacePlan,readPostgresqlHbaReport} from '../lib/postgresql-hba-sandbox.ts';
import {postgresqlHbaValidationPlan} from '../lib/postgresql-hba-validation.ts';
const path='/etc/postgresql/16/main/pg_hba.conf',hash=value=>createHash('sha256').update(value).digest('hex');
test('HBA validation request rejects executable/root overrides and supports the PostgreSQL 15 view schema',()=>{
 const request={path,version:'a'.repeat(64),text:'local all all peer\n'};assert.deepEqual(preparePostgresqlHbaValidation(request),request);
 for(const input of [{...request,path:'/etc/passwd'},{...request,version:null},{...request,binary:'/bin/bash'},{...request,base:'/tmp'},{...request,text:'\0'}, {...request,path:'/etc/postgresql/14/main/pg_hba.conf'}])assert.throws(()=>preparePostgresqlHbaValidation(input));
 const plan=postgresqlHbaValidationPlan('/mnt/data/build/tastedev-linux/linux-pg-hba-fixture',15);assert(!plan.inspect.stdin.includes('file_name'));assert(!plan.inspect.stdin.includes('rule_number'));assert(plan.inspect.stdin.includes("'file','/mnt/data/build/tastedev-linux/linux-pg-hba-fixture/pg_hba.conf'"));
});
test('namespace plan uses a disposable cluster mount and fixed account without operating data or config',()=>{
 const root='/mnt/data/build/tastedev-linux/linux-pg-hba-fixture',plan=postgresqlHbaNamespacePlan(root,'/usr/lib/postgresql/16/bin/initdb',['-D',root+'/data']);
 assert.equal(plan.binary,'/usr/bin/bwrap');assert(plan.args.includes('--unshare-all'));assert(plan.args.includes('--disable-userns'));assert(plan.args.includes('--cap-drop'));assert.equal(plan.args[plan.args.indexOf('--uid')+1],'65534');assert.equal(plan.args[plan.args.indexOf('--gid')+1],'65534');
 const writable=plan.args.flatMap((value,index)=>value==='--bind'?[plan.args.slice(index+1,index+3)]:[]);assert.deepEqual(writable,[[root,root]]);assert(!plan.args.some(value=>value.startsWith('/etc/postgresql')||value.startsWith('/var/lib/postgresql')));assert(plan.args.includes('--as=536870912:536870912'));assert(plan.args.includes('--core=0:0'));
 for(const binary of ['/bin/bash','/usr/bin/psql','/usr/lib/postgresql/16/bin/pg_ctl'])assert.throws(()=>postgresqlHbaNamespacePlan(root,binary,[]));
});
test('native validation checks live version, passes only private draft graph, and detects changes during execution',async()=>{
 const base=await mkdtemp('/mnt/data/build/tastedev-linux/hba-validate-'),folder=base+'/postgresql/16/main',text='local all all peer\n';
 try{await mkdir(base+'/postgresql',{mode:0o700});await mkdir(base+'/postgresql/16',{mode:0o700});await mkdir(folder,{mode:0o700});await writeFile(folder+'/pg_hba.conf',text,{mode:0o600});let calls=0;
  const options={base,ownerUid:process.getuid(),runCandidate:async(graph,sources,major)=>{calls++;assert.equal(major,16);assert.equal(sources.get(path),'local all all reject\n');return {valid:true,diagnostics:[],operationalFilesChanged:false};}};
  const result=await validatePostgresqlHba({path,version:hash(text),text:'local all all reject\n'},options);assert.equal(result.valid,true);assert.equal(result.sourceVersion,hash(text));assert.equal(result.draftVersion,hash('local all all reject\n'));assert.equal(await readFile(folder+'/pg_hba.conf','utf8'),text);
  await assert.rejects(validatePostgresqlHba({path,version:'f'.repeat(64),text},options),error=>error.status===409);assert.equal(calls,1);
  const incomplete=await validatePostgresqlHba({path,version:hash(text),text:'include missing.conf\n'},options);assert.equal(incomplete.valid,false);assert.equal(incomplete.diagnostics[0].category,'missing-file');assert.equal(calls,1);
  await assert.rejects(validatePostgresqlHba({path,version:hash(text),text},{...options,runCandidate:async()=>{await writeFile(folder+'/pg_hba.conf','local all all reject\n');return {valid:true};}}),error=>error.status===409);
 }finally{await rm(base,{recursive:true,force:true});}
});

test('COPY report is restricted to 0600 through its verified descriptor inside a private runtime',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/linux-pg-hba-'),file=root+'/result.json',text='{"schema":1,"rows":[]}\n';
 try{await writeFile(file,text,{mode:0o644});await chmod(file,0o644);assert.equal(await readPostgresqlHbaReport(file,{ownerUid:process.getuid()}),text);assert.equal((await lstat(file)).mode&0o777,0o600);
  await chmod(file,0o664);await assert.rejects(readPostgresqlHbaReport(file,{ownerUid:process.getuid()}));assert.equal((await lstat(file)).mode&0o777,0o664,'unsafe files are rejected before permission changes');
  await rm(file);await writeFile(root+'/other.json',text,{mode:0o600});await symlink(root+'/other.json',file);await assert.rejects(readPostgresqlHbaReport(file,{ownerUid:process.getuid()}));
  await rm(file);await writeFile(file,text,{mode:0o644});await chmod(root,0o755);await assert.rejects(readPostgresqlHbaReport(file,{ownerUid:process.getuid()}));assert.equal((await lstat(file)).mode&0o777,0o644,'a public parent is rejected before reading');
 }finally{await rm(root,{recursive:true,force:true});}
});
