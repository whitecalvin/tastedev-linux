import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {mariadbTopology} from '../lib/mariadb-topology.ts';
import {mariadbCandidate,isMariaDBCandidate} from '../lib/mariadb-candidate.ts';
import {mariadbConfigHooks} from '../lib/mariadb-config-hooks.ts';
async function fixture(run){const base=await mkdtemp('/mnt/data/build/tastedev-linux/linux-maria-bundle-validation-');let bundle;try{await mkdir(join(base,'conf.d'));await writeFile(join(base,'my.cnf'),'!includedir /etc/mysql/conf.d\n');await writeFile(join(base,'conf.d/a.cnf'),'[mariadbd]\nport=3306\npassword=private\n');await writeFile(join(base,'conf.d/b.cnf'),'[mariadbd]\nport=3308\n');const graph=await mariadbTopology('/etc/mysql/my.cnf',base);bundle=await mariadbCandidate({root:graph.root,target:'/etc/mysql/conf.d/a.cnf',version:graph.version,changes:{port:3307}},base);await run(bundle);}finally{await bundle?.cleanup();await rm(base,{recursive:true,force:true});}}
test('MariaDB bundle validator uses generated main and rejects later include overrides',async()=>fixture(async bundle=>{
 const calls=[];
 const hooks=mariadbConfigHooks('/etc/mysql/conf.d/a.cnf',{port:3307},async(binary,args)=>{calls.push([binary,args]);if(args[0]==='--no-defaults')return '--validate-config';if(binary==='/usr/bin/my_print_defaults'){const main=args[0].slice('--defaults-file='.length);assert.equal(main,bundle.main);const text=await readFile(main,'utf8');assert(text.includes(join(bundle.directory,'conf.d')));const second=await readFile(join(dirname(main),'conf.d/b.cnf'),'utf8');assert(second.includes('port=3308'));return '--port=3307\n--password=private\n--port=3308\n';}return '';});
 await hooks.preflight();await assert.rejects(hooks.validatePrepared(bundle),/실제 값이 요청한 값과 다릅니다/);assert.equal(calls.filter(([,args])=>args.includes('restart')).length,0);assert.deepEqual(calls[2],['/usr/sbin/mariadbd',['--defaults-file='+bundle.main,'--validate-config']]);
}));
test('MariaDB bundle identity cannot be forged, modified or reused after cleanup',async()=>fixture(async bundle=>{
 const hooks=mariadbConfigHooks('/etc/mysql/conf.d/a.cnf',{port:3307},async binary=>binary==='/usr/bin/my_print_defaults'?'--port=3307\n':'');await hooks.preflight();assert(isMariaDBCandidate(bundle));assert(Object.isFrozen(bundle));await hooks.validatePrepared(bundle);
 await assert.rejects(hooks.validatePrepared({...bundle}),/후보 설정 검토가 만료되었거나 올바르지/);await bundle.cleanup();assert(!isMariaDBCandidate(bundle));await assert.rejects(hooks.validatePrepared(bundle),/후보 설정 검토가 만료되었거나 올바르지/);
}));

test('MariaDB bundle validation is bound to its source target and reviewed changes, with private diagnostics suppressed',async()=>fixture(async bundle=>{
 for(const [target,changes] of [['/etc/mysql/conf.d/b.cnf',{port:3307}],['/etc/mysql/conf.d/a.cnf',{port:3308}]]){const hooks=mariadbConfigHooks(target,changes,async()=> '');await hooks.preflight();await assert.rejects(hooks.validatePrepared(bundle),/검토한 대상 파일 또는 변경 내용과 다릅니다/);}
 const hooks=mariadbConfigHooks('/etc/mysql/conf.d/a.cnf',{port:3307},async(binary,args)=>{if(binary==='/usr/sbin/mariadbd'&&args[0].startsWith('--defaults-file='))throw Error('password=private');return '';});await hooks.preflight();await assert.rejects(hooks.validatePrepared(bundle),error=>error.message==='MariaDB 후보 설정 검수에 실패했습니다. 변경한 설정을 확인하세요.'&&!String(error).includes('private'));
}));
