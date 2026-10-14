import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import path from 'node:path';import {tmpdir} from 'node:os';
import {mariadbTopology} from '../lib/mariadb-topology.ts';import {mariadbCandidate} from '../lib/mariadb-candidate.ts';import {mariadbNamespacePlan,inspectMariaDBSandboxCandidate} from '../lib/mariadb-sandbox-validation.ts';import {mariadbConfigHooks} from '../lib/mariadb-config-hooks.ts';
async function fixture(run){const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','maria-sandbox-test-'));let candidate;try{await mkdir(path.join(base,'conf.d'),{mode:0o700});await writeFile(path.join(base,'my.cnf'),'!includedir /etc/mysql/conf.d\n',{mode:0o600});await writeFile(path.join(base,'conf.d/server.cnf'),'[mariadbd]\nport=3306\n',{mode:0o600});const graph=await mariadbTopology('/etc/mysql/my.cnf',base);candidate=await mariadbCandidate({root:graph.root,target:'/etc/mysql/conf.d/server.cnf',version:graph.version,changes:{port:3307}},base);await run(candidate,base,graph);}finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}}
const inspect=({binary})=>({path:binary,sha256:'a'.repeat(64),ino:1,dev:1,bytes:100});
const executor=(calls,{legacy=false,defaults='--port=3307\n--password=fixture-private\n'}={})=>(binary,args,options)=>{calls.push({binary,args,options});assert.equal(binary,'/usr/bin/bwrap');const at=args.lastIndexOf('--'),payload=args.slice(at+1);if(payload[0]==='/usr/bin/my_print_defaults')return defaults;if(payload.includes('--no-defaults'))return legacy?'': '--validate-config';return '';};
test('MariaDB namespace permits only registered read-only candidates and fixed native inspection commands',async()=>fixture(async candidate=>{
 const plan=mariadbNamespacePlan(candidate,'/usr/sbin/mariadbd',['--defaults-file='+candidate.main,'--verbose','--help']);assert.equal(plan.scope,'private-options-validation');assert(plan.args.includes('--unshare-all'));assert(plan.args.includes('--disable-userns'));assert(plan.args.includes('--clearenv'));assert(plan.args.includes('--core=0:0'));assert(plan.args.includes('--datadir=/mnt/data/build/tastedev-linux/mariadb-validation'));assert(!plan.args.some(value=>value==='/tmp'||value.startsWith('--datadir=/tmp')||value.startsWith('--log-error=/tmp')));assert(!plan.args.includes('--bind'));assert(!plan.args.includes('/var/lib/mysql'));assert(plan.args.includes(candidate.directory));
 assert.throws(()=>mariadbNamespacePlan({...candidate},'/usr/bin/true',[]));assert.throws(()=>mariadbNamespacePlan(candidate,'/bin/sh',['-c','bad']));assert.throws(()=>mariadbNamespacePlan(candidate,'/usr/sbin/mariadbd',['--defaults-file=/etc/mysql/my.cnf','--verbose','--help']));assert.throws(()=>mariadbNamespacePlan(candidate,'/usr/sbin/mariadbd',['--defaults-file='+candidate.main,'--verbose','--help','--plugin-load=bad']));
}));
test('MariaDB isolated inspection uses capability mode, filters defaults and never returns private output',async()=>fixture(async candidate=>{
 const calls=[],report=await inspectMariaDBSandboxCandidate(candidate,{inspect,execute:executor(calls)});assert.equal(calls.length,4);assert.equal(report.validationMode,'configuration');assert.deepEqual(report.values,{port:3307});assert.equal(report.operatingServiceChanged,false);assert.equal(report.operationalResourcesVerified,false);assert(!JSON.stringify(report).includes('fixture-private'));assert(calls[2].args.includes('--validate-config'));assert.equal(calls[0].options.shell,false);assert.equal(calls[0].options.timeout,30000);
 const legacy=[];assert.equal((await inspectMariaDBSandboxCandidate(candidate,{inspect,execute:executor(legacy,{legacy:true})})).validationMode,'options-help');assert(legacy[2].args.includes('--help'));
}));
test('MariaDB isolated inspection rejects missing/changed executables, namespace failure and candidate mutation without native detail',async()=>fixture(async candidate=>{
 await assert.rejects(inspectMariaDBSandboxCandidate(candidate,{inspect:()=>{throw Error('private-path');},execute:()=>assert.fail()}),error=>error.status===409&&!error.message.includes('private-path'));
 await assert.rejects(inspectMariaDBSandboxCandidate(candidate,{inspect,execute:()=>{throw Error('private-native');}}),error=>!error.message.includes('private-native'));
 let changed=false;await assert.rejects(inspectMariaDBSandboxCandidate(candidate,{inspect:options=>({...inspect(options),sha256:(changed?'b':'a').repeat(64)}),execute:()=>{changed=true;return '';}}),error=>error.status===409);
 await assert.rejects(inspectMariaDBSandboxCandidate(candidate,{inspect,execute:async()=>{await writeFile(candidate.main,'[mariadbd]\nport=9999\n');return '';}}),error=>error.status===409);
}));
test('MariaDB prepared hooks require exact isolated scope and expected values before allowing service activation',async()=>fixture(async candidate=>{
 const calls=[],nativeCalls=[];const hooks=mariadbConfigHooks(candidate.sourceTarget,{port:3307},async(binary,args)=>{nativeCalls.push({binary,args});return args[0]==='--no-defaults'?'--validate-config':'';},null,{candidateInspector:value=>inspectMariaDBSandboxCandidate(value,{inspect,execute:executor(calls)})});await hooks.preflight();await hooks.validatePrepared(candidate);assert.equal(hooks.validationMode,'configuration');assert(!nativeCalls.some(value=>value.args[0]?.startsWith('--defaults-file=')));
 const rejected=mariadbConfigHooks(candidate.sourceTarget,{port:3307},async()=>'',null,{candidateInspector:async()=>({valid:true,validationMode:'configuration',scope:'host-execution',operatingServiceChanged:false,values:{port:3307}})});await rejected.preflight();await assert.rejects(rejected.validatePrepared(candidate),/격리 환경 검수에 실패/);
 const mismatch=mariadbConfigHooks(candidate.sourceTarget,{port:3307},async()=>'',null,{candidateInspector:async()=>({valid:true,validationMode:'configuration',scope:'private-options-validation',namespaceCommandsCompleted:true,operatingConfigurationChanged:false,operatingServiceChanged:false,values:{port:3306}})});await mismatch.preflight();await assert.rejects(mismatch.validatePrepared(candidate),/실제 값이 요청한 값과 다릅니다/);
}));

test('MariaDB candidates use the designated build workspace when helper environment is cleared and reject system temp paths',async()=>fixture(async(candidate,base,graph)=>{
 const previous=process.env.TMPDIR;let fresh;
 try{
  delete process.env.TMPDIR;
  fresh=await mariadbCandidate({root:graph.root,target:'/etc/mysql/conf.d/server.cnf',version:graph.version,changes:{port:3307}},base);
  assert(fresh.directory.startsWith('/mnt/data/build/tastedev-linux/tastedev-mariadb-candidate-'));
  await fresh.cleanup();fresh=null;
  process.env.TMPDIR='/tmp';
  await assert.rejects(mariadbCandidate({root:graph.root,target:'/etc/mysql/conf.d/server.cnf',version:graph.version,changes:{port:3307}},base),/검수 작업 경로/);
 }finally{await fresh?.cleanup();if(previous===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=previous;}
}));
