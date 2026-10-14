import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {liveConfig} from '../lib/config-live.ts';
import {configOperationPlan} from '../lib/config-operation-plan.ts';
test('operational plan checks the inspected version and exposes only supported changed fields',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/linux-operation-plan-');
 try{
  await mkdir(join(root,'redis'));const file=join(root,'redis/redis.conf');
  const source='requirepass private-secret\nport 6379\nmaxmemory 128mb\n';await writeFile(file,source);
  const snapshot=(await liveConfig('redis',root)).configs[0];assert.match(snapshot.version,/^[a-f0-9]{64}$/);
  const input={kind:'redis',path:snapshot.path,version:snapshot.version,changes:{port:6380}};
  const plan=await configOperationPlan(input,root);
  assert.equal(plan.fields.length,1);assert.equal(plan.fields[0].before,6379);assert.equal(plan.fields[0].after,6380);
  assert(!JSON.stringify(plan).includes('private-secret'));assert(!Object.hasOwn(plan,'text'));assert.equal(await readFile(file,'utf8'),source);
  await writeFile(file,source+'# external edit\n');await assert.rejects(configOperationPlan(input,root),e=>e.status===409);
  await assert.rejects(configOperationPlan({...input,path:'/etc/passwd'},root),e=>e.status===400);
  await assert.rejects(configOperationPlan({...input,version:null},root),e=>e.status===400);
  await rm(file);await symlink(join(root,'secret'),file);await writeFile(join(root,'secret'),source);
  await assert.rejects(configOperationPlan(input,root),e=>e.status===409);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('MariaDB operational plan binds target to a complete current include graph without exposing secrets',async()=>{
 const base=await mkdtemp('/mnt/data/build/tastedev-linux/linux-maria-plan-');
 try{
  await mkdir(join(base,'mysql'));await mkdir(join(base,'mysql/conf.d'));
  await writeFile(join(base,'mysql/my.cnf'),'!includedir /etc/mysql/conf.d\n');
  await writeFile(join(base,'mysql/conf.d/a.cnf'),'[mariadbd]\nport=3306\npassword=secret\n');
  const {mariadbTopology}=await import('../lib/mariadb-topology.ts');
  const graph=await mariadbTopology('/etc/mysql/my.cnf',join(base,'mysql'));
  const target=graph.files.find(file=>file.path.endsWith('/a.cnf'));
  const input={kind:'mariadb',path:target.path,version:target.version,root:graph.root,graphVersion:graph.version,changes:{port:3307}};
  const plan=await configOperationPlan(input,base);assert.equal(plan.graphVersion,graph.version);assert.equal(plan.root,graph.root);assert(!JSON.stringify(plan).includes('secret'));
  await assert.rejects(configOperationPlan({...input,graphVersion:null},base),e=>e.status===409);
  await writeFile(join(base,'mysql/conf.d/b.cnf'),'[mariadbd]\nport=3308\n');
  await assert.rejects(configOperationPlan(input,base),e=>e.status===409);
 }finally{await rm(base,{recursive:true,force:true});}
});

test('Redis operational plan binds includes and rejects stale graph versions',async()=>{
 const base=await mkdtemp('/mnt/data/build/tastedev-linux/linux-redis-plan-');
 try{
  await mkdir(join(base,'redis'));await writeFile(join(base,'redis/redis.conf'),'port 6379\ninclude /etc/redis/extra.conf\n');await writeFile(join(base,'redis/extra.conf'),'maxclients 150\n');
  const snapshot=(await liveConfig('redis',base)).configs[0],input={kind:'redis',path:snapshot.path,version:snapshot.version,changes:{port:6380}};
  const plan=await configOperationPlan(input,base);assert.match(plan.graphVersion,/^[a-f0-9]{64}$/);assert.equal(plan.root,'/etc/redis/redis.conf');
  await writeFile(join(base,'redis/extra.conf'),'maxclients 200\n');await assert.rejects(configOperationPlan({...input,graphVersion:plan.graphVersion},base),error=>error.status===409);
 }finally{await rm(base,{recursive:true,force:true});}
});
