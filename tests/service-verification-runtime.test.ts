import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRuntimeModule} from '../scripts/runtime-source.ts';

test('Node22 emitted service query and measurement tools preserve service identities with fixture-only commands',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','service-verification-runtime-'));
 try{
  const allowed=['scripts/verification/service-status-query-candidate.mjs','scripts/verification/service-query-performance.mjs','scripts/verification/package-service-performance.mjs','lib/operations.mjs'];
  for(const file of allowed.slice(0,3)){await mkdir(dirname(join(root,file)),{recursive:true,mode:0o700});await writeFile(join(root,file),await readRuntimeModule(file,allowed),{mode:0o600});}
  await mkdir(join(root,'tests'));const original=await readFile(new URL('./service-status-query.test.mjs',import.meta.url),'utf8');await writeFile(join(root,'tests/query.test.mjs'),original.replace('../scripts/verification/service-status-query-candidate.ts','../scripts/verification/service-status-query-candidate.mjs'));
  const environment:NodeJS.ProcessEnv={...process.env};delete environment.NODE_TEST_CONTEXT;
  const checked=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--test','--test-reporter=tap',join(root,'tests/query.test.mjs')],{env:environment,encoding:'utf8',timeout:10000});assert.equal(checked.status,0,checked.stdout+checked.stderr);assert.match(checked.stdout,/# pass 3\b/);
  const preload=join(root,'preload.mjs');await writeFile(preload,`import cp from 'node:child_process';import {promisify} from 'node:util';import {syncBuiltinESMExports} from 'node:module';cp.execFile=function(){throw Error('Only the explicit promisified fixture is allowed');};cp.execFile[promisify.custom]=async(binary,args)=>{if(binary!=='/usr/bin/systemctl'||args[0]!=='show')throw Error('Unexpected command');const units=args.slice(1).filter(value=>!value.startsWith('--'));const ids=args.some(value=>value.startsWith('--property=Id,'));return {stdout:units.map(unit=>(ids?'Id='+unit+'\\n':'')+'ActiveState=active\\nSubState=running\\nLoadState=loaded\\nUnitFileState=enabled\\nDescription=Fixture service').join('\\n\\n')};};syncBuiltinESMExports();`);
  const measured=spawnSync('/usr/bin/node',['--no-experimental-strip-types','--import',preload,join(root,'scripts/verification/service-query-performance.mjs')],{env:environment,encoding:'utf8',timeout:10000});assert.equal(measured.status,0,measured.stderr);const comparison=JSON.parse(measured.stdout);assert.equal(comparison.statesEquivalent,true);assert.equal(comparison.samples.length,7);assert.equal(comparison.rows.length,6);
  await mkdir(join(root,'lib'));const operations="const units=['nginx.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service'];export async function serviceStatus({unit}={}){const rows=units.map(unit=>({unit,ActiveState:'active'}));rows.push({unit:'postgresql@16-fixture.service',configPath:'/etc/postgresql/16/fixture/postgresql.conf'});return unit?rows.filter(row=>row.unit===unit||(unit==='postgresql.service'&&row.configPath)):rows;}";await writeFile(join(root,'lib/operations.mjs'),operations);await writeFile(join(root,'lib/operations.ts'),operations);
  const scoped=spawnSync('/usr/bin/node',['--no-experimental-strip-types',join(root,'scripts/verification/package-service-performance.mjs')],{env:environment,encoding:'utf8',timeout:10000});assert.equal(scoped.status,0,scoped.stderr);assert.equal(JSON.parse(scoped.stdout).results.length,5);
 }finally{await rm(root,{recursive:true,force:true});}
});
