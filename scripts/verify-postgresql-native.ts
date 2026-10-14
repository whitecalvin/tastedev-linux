import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {nativeDiagnosticSession} from './native-diagnostics.ts';
import {patchConfig} from '../lib/config-patch.ts';
assert(process.getuid?.()!==0,'PostgreSQL diagnostics require a non-root executing account');
const binary='/usr/lib/postgresql/16/bin/postgres',session=await nativeDiagnosticSession({tag:'postgres:16',prefix:'tastedev-pg-native',binaries:[binary,'/usr/bin/sha256sum'],directoryPattern:/^\/mnt\/data\/build\/tastedev-linux\/linux-pg-native-[a-zA-Z0-9_-]+$/});
const directory=await mkdtemp('/mnt/data/build/tastedev-linux/linux-pg-native-'),file=path.join(directory,'postgresql.conf'),candidate=path.join(directory,'.tastedev-config-native'),checks:string[]=[];
const original="# private fixture comment must remain private\nport = 5432\nmax_connections = 100\nshared_buffers = '128MB'\nwork_mem = '4MB'\nlogging_collector = off\n";
const changes={port:5433,connections:175,sharedBuffers:256,workMem:8,logging:true};
const expected={port:'5433',max_connections:'175',shared_buffers:'32768',work_mem:'8192',logging_collector:'on'};
async function query(key:string){return (await session.native(binary,['-D',directory,'-c','config_file='+candidate,'-C',key],directory)).trim();}
try{
 const version=(await session.native(binary,['--version'])).trim();assert(version.length<512&&version.includes('PostgreSQL'));
 const binarySha256=(await session.native('/usr/bin/sha256sum',[binary])).trim().split(/\s/)[0];assert.match(binarySha256,/^[a-f0-9]{64}$/);
 await writeFile(file,original,{mode:0o600});await writeFile(candidate,patchConfig('postgresql',original,changes),{mode:0o600});
 for(const [key,value] of Object.entries(expected))assert.equal(await query(key),value);checks.push('native candidate resolves all five requested fields and internal memory units');assert.equal(await readFile(file,'utf8'),original);
 await mkdir(path.join(directory,'conf.d'),{mode:0o700});await writeFile(path.join(directory,'conf.d/90-override.conf'),'port = 5434\n',{mode:0o600});await writeFile(candidate,patchConfig('postgresql',original,changes)+"include_dir = 'conf.d'\n");assert.equal(await query('port'),'5434');assert.notEqual(await query('port'),expected.port);checks.push('native include override differs from requested value');
 await writeFile(candidate,patchConfig('postgresql',original,changes)+'tastedev_unknown_option = on\n');await assert.rejects(query('port'));assert.equal(session.lastDiagnostic?.category,'invalid-option');checks.push('native invalid configuration option is rejected with sanitized diagnostics');
 const restored="port=5431\nshared_buffers='64MB'\nwork_mem='2MB'\ninclude_dir='conf.d'\n";await writeFile(path.join(directory,'conf.d/90-override.conf'),'max_connections=80\n');await writeFile(candidate,restored);assert.equal(await query('port'),'5431');assert.equal(await query('shared_buffers'),'8192');checks.push('native full restored text is parsed with includes');
 session.assertClean();const record={status:'PASS',context:session.context,imageId:session.image.Id,imageDigests:session.image.RepoDigests,architecture:session.image.Architecture,version,binarySha256,checks,transport:'stdin-tar',hostBindMounts:false,ephemeralContainersUsed:true,hostPackageOrServiceChanges:false,diagnosticUid:process.getuid?.(),serviceStarted:false,databaseConnections:false,pgCtlcluster:'not-executed',rootHelper:'not-executed'};
 const evidence=path.resolve('/mnt/data/build/tastedev-linux/evidence/postgresql-native-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...record,evidence}));
}finally{await rm(directory,{recursive:true,force:true});await session.cleanup();}
