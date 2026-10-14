import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {planPostgresqlDataRestore,restorePostgresqlDataBackup,listPostgresqlDataBackups} from '../lib/postgresql-data-backup.ts';
const context={version:'16',socket:'/run/postgresql',port:5432,uid:100,gid:100,database:'한글 DB',databaseOid:'123',systemIdentifier:'456'};
const key=JSON.stringify([context.version,context.socket,context.port,context.database,context.databaseOid,context.systemIdentifier]);
async function fixture(fn){const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','linux-pg-data-test-'));try{await chmod(root,0o700);const id=randomUUID(),directory=join(root,id);await mkdir(directory,{mode:0o700});const data=Buffer.from('PGDMP fixture');const record={id,format:'postgresql-custom-v1',contextKey:key,database:context.database,version:'16',createdAt:'2026-10-08T00:00:00.000Z',sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length};await writeFile(join(directory,'metadata.json'),JSON.stringify(record),{mode:0o600});await writeFile(join(directory,'data.dump'),data,{mode:0o600});await fn({root,id,directory,record,context,assertCurrent:async()=>{}});}finally{await rm(root,{recursive:true,force:true});}}
test('data restore binds database identity and content; wrong confirmation performs no state lookup',async()=>fixture(async options=>{
 const plan=await planPostgresqlDataRestore(options);assert(plan.undoBackupRequired);assert(plan.transactional);
 let calls=0;await assert.rejects(restorePostgresqlDataBackup({...options,plan,confirmation:'wrong',assertCurrent:async()=>{calls++;}}),/데이터베이스 이름/);assert.equal(calls,0);
 await assert.rejects(planPostgresqlDataRestore({...options,context:{...context,databaseOid:'999'}}),/이 데이터베이스/);
 await assert.rejects(planPostgresqlDataRestore({...options,id:'../metadata.json'}),/백업 ID/);
}));
test('tampered data and symlink archives are excluded without removing original files',async()=>fixture(async options=>{
 await writeFile(join(options.directory,'data.dump'),'tampered',{mode:0o600});await assert.rejects(planPostgresqlDataRestore(options),/내용이 변경/);assert.deepEqual(await listPostgresqlDataBackups(options.root),{backups:[],warnings:1});
 await rm(join(options.directory,'data.dump'));await symlink('/etc/passwd',join(options.directory,'data.dump'));await assert.rejects(planPostgresqlDataRestore(options));assert.equal((await listPostgresqlDataBackups(options.root)).warnings,1);
}));
test('public backup directories and system templates cannot be reviewed',async()=>fixture(async options=>{
 await chmod(options.root,0o755);await assert.rejects(planPostgresqlDataRestore(options),/저장 경로 권한/);await chmod(options.root,0o700);
 await assert.rejects(planPostgresqlDataRestore({...options,context:{...context,database:'template1'}}),/검증된/);
 await assert.rejects(planPostgresqlDataRestore({...options,context:{...context,socket:'/run/../tmp'}}),/검증된/);
}));
test('data backup catalog excludes extra private metadata and refuses malformed public fields',async()=>fixture(async options=>{
 const file=join(options.directory,'metadata.json');
 await writeFile(file,JSON.stringify({...options.record,privateNote:'hidden-fixture-secret'}),{mode:0o600});
 const catalog=await listPostgresqlDataBackups(options.root);assert.equal(catalog.backups.length,1);assert(!JSON.stringify(catalog).includes('hidden-fixture-secret'));assert(!Object.hasOwn(catalog.backups[0],'contextKey'));
 for(const record of [null,[],{...options.record,createdAt:null},{...options.record,bytes:String(options.record.bytes)}]){
  await writeFile(file,JSON.stringify(record),{mode:0o600});
  assert.deepEqual(await listPostgresqlDataBackups(options.root),{backups:[],warnings:1});
 }
}));
