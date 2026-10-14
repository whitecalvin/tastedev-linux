import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';

test('fixed helper service scope runs Node22 with synthetic argv and injected cluster queries',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-service-scope-runtime-'));
 try{
  for(const file of ['postgresql-cluster-status.mjs','mariadb-service-scope.mjs','redis-service-scope.mjs','nginx-service-scope.mjs','error-code.mjs'])await writeFile(join(root,file),await readAdminRuntimeModule(file),{mode:0o600});
  const worker=join(root,'worker.mjs');await writeFile(worker,`import assert from 'node:assert/strict';import {postgresqlClusterStatuses} from './postgresql-cluster-status.mjs';import {mariadbServiceScope} from './mariadb-service-scope.mjs';import {redisServiceScope,redisSystemdStartup} from './redis-service-scope.mjs';import {nginxBuildScope,nginxServiceScope} from './nginx-service-scope.mjs';const files=[{path:'/etc/postgresql/18/main/postgresql.conf'}],stdout='Id=postgresql@18-main.service\\nActiveState=active\\nSubState=running\\nLoadState=loaded\\n';const observed=await postgresqlClusterStatuses(files,async(binary,args)=>{assert.equal(binary,'/usr/bin/systemctl');assert.equal(args[0],'show');return {stdout};});assert.equal(observed[0].ActiveState,'active');const interrupted=await postgresqlClusterStatuses(files,async()=>{throw Object.assign(Error('synthetic timeout'),{code:'ETIMEDOUT',stdout});});assert.equal(interrupted[0].ActiveState,'unknown');assert.match(interrupted[0].error,/시간이 초과/);assert.equal(mariadbServiceScope('/etc/mysql/my.cnf',['/usr/sbin/mariadbd','--user=mysql'],x=>x).mode,'default-main-assumed');assert.equal(redisServiceScope('/etc/redis/redis.conf',['/usr/bin/redis-server','/etc/redis/redis.conf']).mode,'explicit-main');const row=['/usr/bin/redis-server',['/usr/bin/redis-server','/etc/redis/redis.conf'],false,1,2,0,0,44,0,0];assert.equal(redisSystemdStartup(JSON.stringify({type:'a(sasbttttuii)',data:[row]}),44).mode,'systemd-started-main');assert.throws(()=>redisSystemdStartup(JSON.stringify({type:'a(sasbttttuii)',data:[row]}),45));const build=nginxBuildScope('--conf-path=/etc/nginx/nginx.conf --prefix=/usr/share/nginx');assert.equal(nginxServiceScope(['/usr/sbin/nginx'],build).mode,'compiled-main');assert.throws(()=>nginxServiceScope(['/usr/sbin/nginx','-c','/private/other.conf'],build));console.log('PASS');`,{mode:0o600});
  const result=spawnSync('/usr/bin/node',['--no-experimental-strip-types',worker],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
