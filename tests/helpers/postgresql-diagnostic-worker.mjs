import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from '../../lib/admin-native-exec.ts';
import {postgresqlConfigGraph} from '../../lib/postgresql-config-graph.ts';
import {postgresqlConfigCandidate} from '../../lib/postgresql-config-candidate.ts';
import {inspectPostgresqlConfigCandidate} from '../../lib/postgresql-config-validation.ts';

const mode=process.argv[2];
if(!['success','failure','excessive-stderr'].includes(mode))throw Error('Invalid diagnostic fixture');
const base=await mkdtemp('/mnt/data/build/tastedev-linux/pg-diagnostic-fixture-');let candidate;
try{
 const cluster=base+'/postgresql/18/fixture';await mkdir(cluster,{recursive:true,mode:0o700});
 await writeFile(cluster+'/postgresql.conf','port=5433\n',{mode:0o600});
 candidate=await postgresqlConfigCandidate(await postgresqlConfigGraph('/etc/postgresql/18/fixture/postgresql.conf',{base}));
 const report=await inspectPostgresqlConfigCandidate(candidate,{
  validationUid:process.getuid(),validationGid:process.getgid(),
  inspect:({binary})=>({path:binary,sha256:'a'.repeat(64),ino:1,dev:1,bytes:100}),
  execute:(_binary,args,options)=>{
   const payload=args.slice(args.lastIndexOf('--')+1),id=payload[0]==='/usr/bin/id';
   const value=id?String(payload[1]==='-u'?process.getuid():process.getgid()):({port:'5433',max_connections:'100',shared_buffers:'16384',work_mem:'4096',logging_collector:'off'})[payload.at(-1)];
   const diagnostic=id||mode==='success'?'private-setting-value 한글':mode==='excessive-stderr'?'private-setting-value'.repeat(1000):'private-setting-value native failure';
   const program='process.stderr.write('+JSON.stringify(diagnostic)+');process.stdout.write('+JSON.stringify(value+'\n')+');'+(!id&&mode==='failure'?'process.exit(1);':'');
   return execFileSync(process.execPath,['-e',program],options);
  }
 });
 process.stdout.write(JSON.stringify(report));
}catch(error){process.stdout.write(JSON.stringify({valid:false,status:error.status,message:error.message,keys:Object.keys(error)}));}
finally{await candidate?.cleanup();await rm(base,{recursive:true,force:true});}
