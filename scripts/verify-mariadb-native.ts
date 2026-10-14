import type {MariaDBCandidate} from '../lib/mariadb-candidate.ts';
import {nativeDiagnosticSession} from './native-diagnostics.ts';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mariadbTopology} from '../lib/mariadb-topology.ts';
import {mariadbCandidate} from '../lib/mariadb-candidate.ts';
import {mariadbConfigHooks} from '../lib/mariadb-config-hooks.ts';
// Explicit opt-in native diagnostics only. Does not start a DB/service or connect to a DB.
const session=await nativeDiagnosticSession({tag:'mariadb:11.4',prefix:'tastedev-maria-native',binaries:['/usr/sbin/mariadbd','/usr/bin/my_print_defaults','/usr/bin/sha256sum'],directoryPattern:/^\/mnt\/data\/build\/tastedev-linux\/tastedev-mariadb-candidate-[a-zA-Z0-9_-]+$/});
const {context,image}=session;
const native=(binary:string,args:string[],bundle?:MariaDBCandidate|null)=>session.native(binary,[...args,...(binary==='/usr/sbin/mariadbd'&&args.includes('--help')?['--datadir=/mnt/data/build/tastedev-linux']:[])],bundle?.directory);
const base=await mkdtemp('/mnt/data/build/tastedev-linux/linux-maria-native-source-');const checks:string[]=[];const current:{bundle:MariaDBCandidate|null}={bundle:null};
try{
 const version=(await native('/usr/sbin/mariadbd',['--no-defaults','--version'])).trim();assert(version.length<512&&version.includes('MariaDB'));
 const binarySha256=(await native('/usr/bin/sha256sum',['/usr/sbin/mariadbd'])).trim().split(/\s/)[0];assert.match(binarySha256,/^[a-f0-9]{64}$/);
 const help=await native('/usr/sbin/mariadbd',['--no-defaults','--verbose','--help']);
 await mkdir(path.join(base,'conf.d'),{mode:0o700});await writeFile(path.join(base,'my.cnf'),'!includedir /etc/mysql/conf.d\n',{mode:0o600});
 const target='/etc/mysql/conf.d/10-server.cnf',file=path.join(base,'conf.d/10-server.cnf');const original='[client]\npassword=fixture-only-secret\n[mariadbd]\nport=3306\nmax_connections=100\n';await writeFile(file,original,{mode:0o600});
 const changes={port:3307,connections:175,bufferPool:256,charset:'utf8mb4',slowLog:false,slowSeconds:3};
 async function validate(changes:Record<string,unknown>,restoreText?:string){const graph=await mariadbTopology('/etc/mysql/my.cnf',base);current.bundle=await mariadbCandidate({root:graph.root,target,version:graph.version,changes,...(restoreText===undefined?{}:{restoreText})},base);const run=async(binary:string,args:string[])=>binary==='/usr/bin/systemctl'?'':args[0]==='--no-defaults'?help:native(binary,args,current.bundle);const hooks=mariadbConfigHooks(target,changes,run,restoreText===undefined?null:createHash('sha256').update(restoreText).digest('hex'));await hooks.preflight();try{await hooks.validatePrepared(current.bundle);return hooks.validationMode;}catch(error){throw Object.assign(error instanceof Error?error:Error('Native validation failed'),{nativeDiagnostic:session.lastDiagnostic});}finally{await current.bundle.cleanup();current.bundle=null;}}
 const validationMode=await validate(changes);checks.push('native complete candidate and supported option values');assert.equal(await readFile(file,'utf8'),original);
 await writeFile(path.join(base,'conf.d/90-override.cnf'),'[mariadbd]\nport=3308\n',{mode:0o600});await assert.rejects(validate({port:3307}),/실제 값이 요청한 값과 다릅니다/);checks.push('native later include override is rejected');await rm(path.join(base,'conf.d/90-override.cnf'));
 await writeFile(file,original+'tastedev_unknown_option=1\n');await assert.rejects(validate({port:3307}),/후보 설정 검수에 실패했습니다/);assert.equal(session.lastDiagnostic?.category,'invalid-option');checks.push('native invalid option is rejected with sanitized diagnostics');await writeFile(file,original);
 await mkdir(path.join(base,'extra'),{mode:0o700});await writeFile(path.join(base,'extra/restored.cnf'),'[mariadbd]\nmax_connections=80\n',{mode:0o600});await validate({},'[client]\npassword=restored-fixture-secret\n[mariadbd]\nport=3305\n!include /etc/mysql/extra/restored.cnf\n');checks.push('native full restoration candidate and newly referenced include');
 session.assertClean();
 const record={status:'PASS',context,imageId:image.Id,imageDigests:image.RepoDigests,architecture:image.Architecture,version,binarySha256,validationMode,checks,transport:'stdin-tar',hostBindMounts:false,ephemeralContainersUsed:true,hostPackageOrServiceChanges:false,diagnosticUid:process.getuid?.(),diagnosticDatadir:'/mnt/data/build/tastedev-linux',serviceStarted:false,databaseConnections:false,systemctl:'mock-only',operatingSystemChanges:false};
 const destination=path.resolve('/mnt/data/build/tastedev-linux/evidence/mariadb-native-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(destination),{recursive:true,mode:0o700});await writeFile(destination,JSON.stringify(record,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...record,evidence:destination}));
}finally{await current.bundle?.cleanup();await rm(base,{recursive:true,force:true});await session.cleanup();}
