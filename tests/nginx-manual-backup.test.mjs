import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createNginxConfigBackup,nginxConfigBackupRecord,nginxConfigBackups} from '../lib/nginx-config-backups.ts';
test('manual nginx file backups retain exact bytes and reject stale versions, unsafe paths and symlinks',async()=>{
 const fixture=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','nginx-manual-backup-'));try{
 const base=path.join(fixture,'nginx'),root=path.join(fixture,'backups'),ownerUid=process.getuid();await mkdir(base,{mode:0o700});const text='# private comment\nevents {}\nhttp {}\n',file=path.join(base,'nginx.conf');await writeFile(file,text,{mode:0o600});const version=createHash('sha256').update(text).digest('hex'),options={base,root,ownerUid};
 const result=await createNginxConfigBackup({path:'/etc/nginx/nginx.conf',version},options);assert.equal(result.backup.version,version);assert.ok(!('text' in result.backup));const record=await nginxConfigBackupRecord(result.backup.id,{root,ownerUid});assert.equal(record.text,text);assert.equal(await readFile(file,'utf8'),text);const catalog=await nginxConfigBackups({root,ownerUid});assert.equal(catalog.backups.length,1);assert.ok(!JSON.stringify(catalog).includes('private comment'));
 await assert.rejects(createNginxConfigBackup({path:'/etc/nginx/nginx.conf',version:'0'.repeat(64)},options),error=>error.status===409);assert.equal((await readdir(root)).length,1);
 await assert.rejects(createNginxConfigBackup({path:'/etc/passwd',version},options));await mkdir(path.join(base,'conf.d'),{mode:0o700});await symlink(file,path.join(base,'conf.d','link.conf'));await assert.rejects(createNginxConfigBackup({path:'/etc/nginx/conf.d/link.conf',version},options));assert.equal((await readdir(root)).length,1);
 }finally{await rm(fixture,{recursive:true,force:true});}
});
