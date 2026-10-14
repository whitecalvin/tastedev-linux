import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {mariadbTopology} from '../lib/mariadb-topology.ts';
async function fixture(run){const root=await mkdtemp('/mnt/data/build/tastedev-linux/linux-maria-topology-');try{await mkdir(join(root,'conf.d'));await run(root);}finally{await rm(root,{recursive:true,force:true});}}
test('MariaDB topology inventories includes in alphabetical order, hides secrets and detects file/list changes',async()=>fixture(async root=>{
 await writeFile(join(root,'my.cnf'),'password=private\n!includedir /etc/mysql/conf.d\n');await writeFile(join(root,'conf.d/b.cnf'),'port=3307\n');await writeFile(join(root,'conf.d/a.cnf'),'port=3306\n');
 const result=await mariadbTopology('/etc/mysql/my.cnf',root);assert(result.complete);assert.deepEqual(result.edges[0].targets,['/etc/mysql/conf.d/a.cnf','/etc/mysql/conf.d/b.cnf']);assert.equal(result.files.length,3);assert(!JSON.stringify(result).includes('private'));assert(!result.files.some(item=>Object.hasOwn(item,'text')));
 await writeFile(join(root,'conf.d/b.cnf'),'port=3308\n');const changed=await mariadbTopology('/etc/mysql/my.cnf',root);assert.notEqual(changed.version,result.version);await writeFile(join(root,'conf.d/c.cnf'),'port=3309\n');assert.notEqual((await mariadbTopology('/etc/mysql/my.cnf',root)).version,changed.version);
}));
test('MariaDB topology reports cycles, escaping directives and symlinks without reading their contents',async()=>fixture(async root=>{
 await writeFile(join(root,'my.cnf'),'!include /etc/mysql/conf.d/a.cnf\n!include /etc/passwd\n!include /etc/mysql/../private.cnf\n');await writeFile(join(root,'conf.d/a.cnf'),'!include /etc/mysql/my.cnf\n');
 const result=await mariadbTopology('/etc/mysql/my.cnf',root);assert(!result.complete);assert.equal(result.warnings.length,3);await rm(join(root,'conf.d/a.cnf'));await symlink('/etc/passwd',join(root,'conf.d/a.cnf'));const linked=await mariadbTopology('/etc/mysql/my.cnf',root);assert(!linked.complete);assert.equal(linked.files.length,1);await assert.rejects(mariadbTopology('/etc/passwd',root),e=>e.status===400);
}));

test('MariaDB repeated includes stop at a bounded inspection count',async()=>fixture(async root=>{
 await writeFile(join(root,'my.cnf'),'!include /etc/mysql/conf.d/a.cnf\n'.repeat(5000));await writeFile(join(root,'conf.d/a.cnf'),'port=3306\n');const result=await mariadbTopology('/etc/mysql/my.cnf',root);assert(!result.complete);assert(result.edges.length<=300);assert(result.warnings.length<10);
}));
