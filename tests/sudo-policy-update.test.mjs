import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {sudoPolicyPlan} from '../lib/sudo-policy.ts';
import {updateSudoPolicy} from '../lib/sudo-policy-update.ts';
const account={username:'fixture-admin',uid:1000};
async function fixture(fn){const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-sudo-update-'));try{const directory=path.join(root,'rules'),backupRoot=path.join(root,'backups');await mkdir(directory,{mode:0o700});await mkdir(backupRoot,{mode:0o700});const original=sudoPolicyPlan({passwordless:true,actions:['nginx-apply']},account),file=path.join(directory,original.filename);await writeFile(file,original.text,{mode:0o600});await fn({file,original,input:{confirm:true,version:original.version,passwordless:false,actions:original.actions},hooks:{account,directory,backupRoot,verifyAccount:async()=>{},validateCandidate:async()=>{},validatePolicy:async()=>{}}});}finally{await rm(root,{recursive:true,force:true});}}
test('sudo policy update backs up prior rule and validates replacement without effective permission claim',async()=>fixture(async({file,original,input,hooks})=>{
 let checks=0;const result=await updateSudoPolicy(input,{...hooks,validatePolicy:async()=>{checks++;}});assert.equal(result.changed,true);assert.equal(result.passwordless,false);assert.equal(result.effectiveAuthorizationVerified,false);assert.equal(checks,1);assert((await readFile(file,'utf8')).includes('PASSWD:'));assert.equal(JSON.parse(await readFile(path.join(hooks.backupRoot,result.backupId+'.json'),'utf8')).text,original.text);
}));
test('sudo rule update rejects stale version, candidate mutation, foreign rule and absent confirmation',async()=>fixture(async({file,original,input,hooks})=>{
 await assert.rejects(updateSudoPolicy({...input,version:'a'.repeat(64)},hooks),{status:409});await assert.rejects(updateSudoPolicy({...input,confirm:false},hooks),{status:400});await assert.rejects(updateSudoPolicy(input,{...hooks,validateCandidate:async candidate=>writeFile(candidate,'modified')}),{status:409});assert.equal(await readFile(file,'utf8'),original.text);
 const foreign=sudoPolicyPlan({passwordless:true,actions:['service']},{username:'other-admin',uid:1001});await writeFile(file,foreign.text);await assert.rejects(updateSudoPolicy({...input,version:foreign.version},hooks),{status:400});
}));
test('sudo update restores invalid global policy but preserves concurrent administrator edit',async()=>fixture(async({file,original,input,hooks})=>{
 let checks=0;const restored=await updateSudoPolicy(input,{...hooks,validatePolicy:async()=>{if(++checks===1)throw Error('fixture syntax failure');}});assert.equal(restored.restored,true);assert.equal(restored.recovered,true);assert.equal(await readFile(file,'utf8'),original.text);
 const edited=await updateSudoPolicy(input,{...hooks,validatePolicy:async()=>{await writeFile(file,'administrator edit');throw Error('fixture');}});assert.equal(edited.restored,false);assert.equal(await readFile(file,'utf8'),'administrator edit');
}));
