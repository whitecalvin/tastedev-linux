import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {nodeEnvBackups,nodeEnvBackupRecord} from '../lib/node-env-backups.ts';
test('Environment backup metadata omits secrets and rejects unsafe or external records',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','linux-env-backups-')),backups=path.join(root,'backups'),workspace=path.join(root,'workspace');await mkdir(backups,{mode:0o700});await mkdir(workspace,{mode:0o700});
 try{
  const id=randomUUID(),text='API_KEY=fixture-secret\nPORT=3000\n',record={id,target:path.join(workspace,'app.env'),text,createdAt:new Date().toISOString(),version:createHash('sha256').update(text).digest('hex')},file=path.join(backups,id+'.json');await writeFile(file,JSON.stringify(record),{mode:0o600});
  const list=await nodeEnvBackups(backups,process.getuid(),workspace);assert.equal(list.backups[0].name,'app.env');assert(!JSON.stringify(list).includes('fixture-secret'));assert(!JSON.stringify(list).includes(workspace));
  await writeFile(file,JSON.stringify({...record,target:'/etc/app.env'}));await assert.rejects(nodeEnvBackupRecord(id,backups,process.getuid(),workspace));await writeFile(file,JSON.stringify(record));await chmod(file,0o644);assert.equal((await nodeEnvBackups(backups,process.getuid(),workspace)).warnings,1);await chmod(file,0o600);
  const linked=randomUUID();await symlink(file,path.join(backups,linked+'.json'));assert.equal((await nodeEnvBackups(backups,process.getuid(),workspace)).warnings,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
