import {createHash} from 'node:crypto';
import {postgresqlHbaOperationPlan,applyPostgresqlHbaOperation} from '../../lib/postgresql-hba-operation.ts';
const root=process.argv[2],target='/etc/postgresql/16/main/pg_hba.conf',service={hba:target,pid:123,start:'777',unit:'postgresql@16-main.service',settingsSource:'running-server',identityVerified:true};
const options={base:root+'/etc',root:root+'/backups',backupUid:process.getuid(),ownerUid:process.getuid(),inspectService:async()=>({...service}),runCandidate:async()=>({valid:true,ruleCount:1,diagnostics:[]}),reload:async()=>{setInterval(()=>{},1000);process.send('replaced');await new Promise(()=>{});}};
const text='local all all scram-sha-256\n',request={path:target,version:createHash('sha256').update('local all all peer\n').digest('hex'),text};
const plan=await postgresqlHbaOperationPlan(request,options);await applyPostgresqlHbaOperation({...request,reviewVersion:plan.reviewVersion,confirm:true},options);
