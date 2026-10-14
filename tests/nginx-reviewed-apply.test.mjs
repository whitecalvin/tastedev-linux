import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {nginxTopology} from '../lib/nginx-topology.ts';import {applyReviewedNginx} from '../lib/nginx-reviewed-apply.ts';
test('reviewed nginx apply binds graph and service before fixed validation and reload commands',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','nginx-reviewed-fixture-'));try{
 const base=path.join(root,'nginx'),backupRoot=path.join(root,'backups');await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});await writeFile(path.join(base,'nginx.conf'),'events {} http {}',{mode:0o600});const graph=await nginxTopology(base),commands=[];
 const scope={identityVerified:true,service:'nginx.service',main:'/etc/nginx/nginx.conf',prefix:'/usr/share/nginx',pid:42,start:'123',localeVerified:false};
 const input={path:'/etc/nginx/nginx.conf',text:'events { worker_connections 1024; } http {}',version:graph.files[0].version,graphVersion:graph.version,confirm:true,review:{confirm:true,pid:42,start:'123',graphVersion:graph.version,locale:{LANG:'ko_KR.UTF-8'}}};
 await assert.rejects(applyReviewedNginx({...input,review:{...input.review,pid:43}},{base,backupRoot,inspect:async()=>scope,runCommand:async()=>commands.push('unexpected')}),error=>error.status===409);assert.deepEqual(commands,[]);
 const result=await applyReviewedNginx(input,{base,backupRoot,inspect:async()=>scope,runCommand:async(binary,args,locale)=>{commands.push({binary,args,locale});return {stdout:'',stderr:''};}});
 assert.equal(result.changed,true);assert.equal(commands.length,3);assert.ok(commands[0].args.includes('-t'));assert.ok(commands[0].args.some(arg=>arg.startsWith(path.join('/mnt/data/build/tastedev-linux','tastedev-nginx-candidate-'))));assert.ok(commands[1].args.includes('/etc/nginx/nginx.conf'));assert.deepEqual(commands[2].args,['--no-ask-password','reload','nginx.service']);assert.ok(commands.every(command=>command.locale.LANG==='ko_KR.UTF-8'));assert.equal(await readFile(path.join(base,'nginx.conf'),'utf8'),input.text);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reviewed nginx reload failure restores original configuration and validates recovery',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','nginx-reviewed-rollback-'));try{
 const base=path.join(root,'nginx'),backupRoot=path.join(root,'backups');await mkdir(base,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const original='events {} http {}';await writeFile(path.join(base,'nginx.conf'),original,{mode:0o600});const graph=await nginxTopology(base);let reloads=0,checks=0;
 const scope={identityVerified:true,service:'nginx.service',main:'/etc/nginx/nginx.conf',prefix:'/usr/share/nginx',pid:42,start:'123',localeVerified:false};
 const input={path:'/etc/nginx/nginx.conf',text:'events { worker_connections 1024; } http {}',version:graph.files[0].version,graphVersion:graph.version,confirm:true,review:{confirm:true,pid:42,start:'123',graphVersion:graph.version,locale:{LC_ALL:'C'}}};
 const result=await applyReviewedNginx(input,{base,backupRoot,inspect:async()=>scope,runCommand:async(binary,args)=>{if(binary==='/usr/bin/systemctl'){if(++reloads===1)throw Error('fixture reload failure');}else{checks++;if(checks===3)assert.equal(await readFile(path.join(base,'nginx.conf'),'utf8'),original);}return {stdout:'',stderr:''};}});
 assert.equal(result.restored,true);assert.equal(result.recovered,true);assert.equal(reloads,2);assert.equal(checks,3);assert.equal(await readFile(path.join(base,'nginx.conf'),'utf8'),original);
 }finally{await rm(root,{recursive:true,force:true});}
});
