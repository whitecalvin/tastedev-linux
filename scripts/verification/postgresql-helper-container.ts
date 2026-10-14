// Runs only inside the disposable, network-disabled verification container.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,renameSync,symlinkSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
assert.equal(process.getuid?.(),0);
const mounts=readFileSync('/proc/self/mountinfo','utf8').split('\n');for(const targets of [['/etc','/etc/postgresql'],['/var/lib/linux']]){const row=mounts.find(line=>targets.includes(line.split(' - ')[0].split(' ')[4])&&line.split(' - ')[1].startsWith('tmpfs '));assert(row,'전용 격리 마운트가 필요합니다: '+targets.join(' 또는 '));}
for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]='/mnt/data/build/tastedev-linux';
function record(value:unknown):Record<string,unknown>{assert(value!==null&&typeof value==='object'&&!Array.isArray(value));return Object.fromEntries(Object.entries(value));}
function rows(value:Record<string,unknown>,key:string){const list=value[key];assert(Array.isArray(list));return list.map(record);}
const helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin';
const file='/etc/postgresql/18/fixture/pg_hba.conf';
const original='# 한국어 검사 전용\nlocal all all peer\nhost all all 127.0.0.1/32 scram-sha-256\n';
const checks:string[]=[];
function call(action:string,input:unknown,expected=0):Record<string,unknown> {
  const result=spawnSync('/usr/bin/node',[helper,action],{input:JSON.stringify(input),encoding:'utf8',timeout:40000,maxBuffer:1048576});
  assert.equal(result.status,expected,result.stderr);
  if(expected===0)return record(JSON.parse(result.stdout));
  const error=record(JSON.parse(result.stderr));
  assert.equal(error.protocol,'tastedev-helper-error-v1');assert.equal(error.action,action);
  return error;
}
let result:Record<string,unknown>;
try {
  mkdirSync('/etc/postgresql/18/fixture',{recursive:true,mode:0o755});
  writeFileSync(file,original,{mode:0o644});
  const source=call('postgresql-hba-source',{path:file});
  assert.equal(source.text,original);assert.equal(source.version,createHash('sha256').update(original).digest('hex'));
  checks.push('packaged root-owned helper reads original Korean fixture and version');
  const backup=record(call('postgresql-hba-backup',{path:file,version:source.version}).backup);
  assert.equal(backup.target,file);assert.equal(backup.version,source.version);assert.equal(backup.text,undefined);
  const catalog=call('postgresql-hba-backups',{path:file});
  assert(rows(catalog,'backups').some(item=>item.id===backup.id));assert(rows(catalog,'backups').every(item=>item.text===undefined));
  checks.push('helper creates private backup and catalog omits configuration content');
  writeFileSync(file,original+'# 외부 변경\n');
  const stale=call('postgresql-hba-backup',{path:file,version:source.version},1);
  assert.equal(stale.status,409);
  assert.equal(rows(call('postgresql-hba-backups',{path:file}),'backups').length,1);
  checks.push('stale version is rejected without creating a second backup');
  const draft=call('postgresql-hba-restore-draft',{path:file,id:backup.id});
  assert.equal(draft.text,original);assert.equal(draft.changed,true);
  assert.equal(readFileSync(file,'utf8'),original+'# 외부 변경\n');
  checks.push('restore preview preserves original Korean backup without applying it');
  renameSync(file,file+'.original');symlinkSync(file+'.original',file);
  assert.equal(call('postgresql-hba-source',{path:file},1).status,400);
  unlinkSync(file);renameSync(file+'.original',file);
  checks.push('symlink source is rejected and original fixture remains intact');
  writeFileSync(file,original);
  const validated=spawnSync('/usr/bin/node',[helper,'postgresql-hba-validate'],{input:JSON.stringify({path:file,version:source.version}),encoding:'utf8',timeout:40000,maxBuffer:1048576});
  let namespace:Record<string,unknown>;
  if(validated.status===0){
    const value=record(JSON.parse(validated.stdout));assert.equal(value.valid,true);
    namespace={status:'PASS',engine:value.engine,namespaceUid:value.namespaceUid,namespaceGid:value.namespaceGid};
    checks.push('actual isolated HBA parser accepts original rules');
    for(const [text,category] of [
      ['local all all nonexistent_method\n','invalid-method'],
      ['host all all 127.0.0.1/999 scram-sha-256\n','invalid-address'],
      ['host all all 127.0.0.1/32 scram-sha-256 invalid_option=1\n','invalid-option'],
    ]) {
      const report=call('postgresql-hba-validate',{path:file,version:source.version,text});
      assert.equal(report.valid,false);assert.equal(report.engine,'postgresql-hba-file-rules');
      assert(rows(report,'diagnostics').some(item=>item.category===category&&item.path===file&&item.line===1));
      assert.equal(readFileSync(file,'utf8'),original);
      checks.push('actual helper reports '+category+' without replacing original configuration');
    }
    const included='/etc/postgresql/18/fixture/extra.conf';
    writeFileSync(included,'# 포함 파일 한국어 오류\nlocal all all nonexistent_method\n',{mode:0o644});
    const report=call('postgresql-hba-validate',{path:file,version:source.version,text:'include extra.conf\n'});
    assert.equal(report.valid,false);assert.equal(report.engine,'postgresql-hba-file-rules');
    assert(rows(report,'diagnostics').some(item=>item.path===included&&item.line===2&&item.category==='invalid-method'));
    assert.equal(readFileSync(included,'utf8'),'# 포함 파일 한국어 오류\nlocal all all nonexistent_method\n');
    checks.push('actual helper maps included-file error to original path and Korean-comment line');
  }
  else {const error=record(JSON.parse(validated.stderr));assert.equal(error.protocol,'tastedev-helper-error-v1');namespace={status:'BLOCKED',statusCode:error.status,message:error instanceof Error?error.message:'HBA helper 검수 실패'};}
  if(namespace.status==='BLOCKED') {
    // Native diagnostic uses only an id command and generated account files.
    // No database/user content is passed to stderr or published in the report.
    const probe='/mnt/data/build/tastedev-linux/linux-pg-hba-probe';
    mkdirSync(probe,{mode:0o700});
    writeFileSync(probe+'/passwd','tastedev_validation:x:65534:65534::'+probe+':/usr/sbin/nologin\n',{mode:0o600});
    writeFileSync(probe+'/group','tastedev_validation:x:65534:\n',{mode:0o600});
    const module:unknown=await import('/usr/lib/tastedev-linux/scripts/admin/runtime/postgresql-hba-sandbox.mjs');const fn=record(module).postgresqlHbaNamespacePlan;assert(typeof fn==='function');const output:unknown=await Reflect.apply(fn,undefined,[probe,'/usr/bin/id',['-u']]);const plan=record(output);assert(typeof plan.binary==='string');assert(Array.isArray(plan.args)&&plan.args.every(value=>typeof value==='string'));const args=plan.args.map(value=>{assert(typeof value==='string');return value;});
    const native=spawnSync(plan.binary,args,{encoding:'utf8',timeout:10000,maxBuffer:4096});
    namespace.probeExitCode=native.status;
    namespace.probeDiagnostic=(native.stderr||'').slice(0,4096);
    namespace.bubblewrapVersion=spawnSync('/usr/bin/bwrap',['--version'],{encoding:'utf8',timeout:3000}).stdout.trim();
  }
  assert.equal(readFileSync(file,'utf8'),original);
  assert.equal(rows(call('postgresql-hba-backups',{path:file}),'backups').length,1);
  result={status:namespace.status==='PASS'?'PASS':'PARTIAL',checks,namespace,helperSha256:createHash('sha256').update(readFileSync(helper)).digest('hex'),fixtureUnchanged:true,hostConfigurationChanged:false,operatingDatabaseStarted:false,configurationApplied:false};
} catch(error) {result={status:'FAIL',checks,message:error instanceof Error?error.message:'HBA helper 검수 실패',hostConfigurationChanged:false};}
console.log(JSON.stringify(result));process.exitCode=result.status==='FAIL'?1:0;
