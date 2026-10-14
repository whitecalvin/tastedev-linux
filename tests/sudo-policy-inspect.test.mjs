import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,chmod,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {sudoPolicyPlan} from '../lib/sudo-policy.ts';
import {inspectSudoPolicy} from '../lib/sudo-policy-inspect.ts';
const account={username:'fixture-admin',uid:1000};
async function fixture(fn){const directory=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','tastedev-sudo-inspect-'));try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}}
test('sudo inspection returns policy metadata or missing registration without source',async()=>fixture(async directory=>{
 const options={account,directory,verifyAccount:async()=>{}},missing=await inspectSudoPolicy(options);assert.equal(missing.registered,false);
 const plan=sudoPolicyPlan({passwordless:true,actions:['service']},account);await writeFile(path.join(directory,plan.filename),plan.text,{mode:0o600});const result=await inspectSudoPolicy(options);assert.equal(result.registered,true);assert.equal(result.version,plan.version);assert.equal(result.effectiveAuthorizationVerified,false);assert(!Object.hasOwn(result,'text'));
}));
test('sudo inspection rejects public writes, symlink and changes during account recheck',async()=>fixture(async directory=>{
 const plan=sudoPolicyPlan({passwordless:true,actions:['service']},account),file=path.join(directory,plan.filename),options={account,directory,verifyAccount:async()=>{}};await writeFile(file,plan.text,{mode:0o666});await chmod(file,0o666);await assert.rejects(inspectSudoPolicy(options),{status:409});await chmod(file,0o600);
 let checks=0;await assert.rejects(inspectSudoPolicy({...options,verifyAccount:async()=>{if(++checks===2)await writeFile(file,plan.text+'# changed\n');}}),{status:409});await rm(file);await symlink('/etc/sudoers',file);await assert.rejects(inspectSudoPolicy(options));
}));
