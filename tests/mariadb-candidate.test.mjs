import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,lstat,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {mariadbTopology} from '../lib/mariadb-topology.ts';
import {mariadbCandidate} from '../lib/mariadb-candidate.ts';
async function fixture(run){const root=await mkdtemp('/mnt/data/build/tastedev-linux/linux-maria-source-');try{await mkdir(join(root,'conf.d'));await writeFile(join(root,'my.cnf'),'!includedir /etc/mysql/conf.d\n');await writeFile(join(root,'conf.d/a.cnf'),'[mariadbd]\nport=3306\npassword=private\n');await writeFile(join(root,'conf.d/b.cnf'),'[client]\nport=3306\n');await run(root);}finally{await rm(root,{recursive:true,force:true});}}
test('MariaDB candidate preserves include graph and untouched secrets in private files without altering sources',async()=>fixture(async base=>{
 const root='/etc/mysql/my.cnf',target='/etc/mysql/conf.d/a.cnf',graph=await mariadbTopology(root,base);
 const candidate=await mariadbCandidate({root,target,version:graph.version,changes:{port:3307}},base);
 try{assert.equal((await lstat(candidate.directory)).mode&0o777,0o700);assert.equal((await lstat(candidate.target)).mode&0o777,0o600);assert.equal(await readFile(candidate.main,'utf8'),'!includedir '+join(candidate.directory,'conf.d')+'\n');assert.equal(await readFile(candidate.target,'utf8'),'[mariadbd]\nport = 3307\npassword=private\n');assert.equal(await readFile(join(base,'conf.d/a.cnf'),'utf8'),'[mariadbd]\nport=3306\npassword=private\n');assert.equal(await readFile(join(candidate.directory,'conf.d/b.cnf'),'utf8'),'[client]\nport=3306\n');}finally{await candidate.cleanup();}
 await assert.rejects(lstat(candidate.directory),e=>e.code==='ENOENT');
}));
test('MariaDB candidate rejects stale graph, nonincluded targets and unresolved include structures',async()=>fixture(async base=>{
 const root='/etc/mysql/my.cnf',graph=await mariadbTopology(root,base),input={root,target:'/etc/mysql/conf.d/a.cnf',version:graph.version,changes:{port:3307}};
 await assert.rejects(mariadbCandidate({...input,target:'/etc/mysql/conf.d/missing.cnf'},base),/not included/);await writeFile(join(base,'conf.d/b.cnf'),'[client]\nport=3307\n');await assert.rejects(mariadbCandidate(input,base),e=>e.status===409);
 await writeFile(join(base,'my.cnf'),'!include /etc/passwd\n');await assert.rejects(mariadbCandidate(input,base),/Resolve MariaDB include/);
}));

test('MariaDB candidate preserves CRLF and rejects invalid UTF-8 instead of silently rewriting bytes',async()=>fixture(async base=>{
 const root='/etc/mysql/my.cnf',target='/etc/mysql/conf.d/a.cnf';await writeFile(join(base,'my.cnf'),'# comment\r\n!includedir /etc/mysql/conf.d\r\n');await writeFile(join(base,'conf.d/b.cnf'),'[client]\r\n# keep\r\n');
 const graph=await mariadbTopology(root,base),candidate=await mariadbCandidate({root,target,version:graph.version,changes:{port:3307}},base);try{assert.equal(await readFile(candidate.main,'utf8'),'# comment\r\n!includedir '+join(candidate.directory,'conf.d')+'\r\n');assert.equal(await readFile(join(candidate.directory,'conf.d/b.cnf'),'utf8'),'[client]\r\n# keep\r\n');}finally{await candidate.cleanup();}
 await writeFile(join(base,'conf.d/b.cnf'),Buffer.from([0xff,0xfe]));const invalid=await mariadbTopology(root,base);await assert.rejects(mariadbCandidate({root,target,version:invalid.version,changes:{port:3307}},base),/UTF-8/);
}));
