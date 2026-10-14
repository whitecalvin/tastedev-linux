import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,link,chmod,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {validationIdentityBinary} from '../lib/validation-identity-binary.ts';
import {redisValidationBinary} from '../lib/redis-validation-binary.ts';
async function fixture(run){
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/validation-id-');
 try{
  await mkdir(path.join(root,'usr/bin'),{recursive:true,mode:0o700});
  await mkdir(path.join(root,'usr/lib/cargo/bin/coreutils'),{recursive:true,mode:0o700});
  const binary=path.join(root,'usr/bin/id'),target=path.join(root,'usr/lib/cargo/bin/coreutils/id');
  await writeFile(target,'multicall fixture bytes',{mode:0o700});
  await symlink('../lib/cargo/bin/coreutils/id',binary);
  await run({root,binary,target,options:{binary,anchor:root,ownerUid:process.getuid()}});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('approved coreutils id alias fingerprints all target bytes and binds alias inode and hardlink count',()=>fixture(async({root,binary,target,options})=>{
 await link(target,path.join(root,'usr/lib/cargo/bin/coreutils/another-command'));
 const before=validationIdentityBinary(options);
 assert.equal(before.path,binary);assert.equal(before.resolvedPath,target);assert.equal(before.links,2);
 assert.match(before.sha256,/^[a-f0-9]{64}$/);
 assert.throws(()=>redisValidationBinary({binary:target,anchor:root,ownerUid:process.getuid()}),'ordinary binary policy still refuses hardlinks');
 await writeFile(target,'changed multicall fixture bytes');assert.notEqual(validationIdentityBinary(options).sha256,before.sha256);
 const previous=validationIdentityBinary(options);await rename(binary,binary+'.old');await symlink('../lib/cargo/bin/coreutils/id',binary);
 assert.notEqual(validationIdentityBinary(options).alias.ino,previous.alias.ino,'same target with a replaced alias remains observable');
}));
test('id aliases reject other targets, writable ancestry, writable target and mismatched owners',()=>fixture(async({root,binary,target,options})=>{
 await chmod(path.join(root,'usr/bin'),0o722);assert.throws(()=>validationIdentityBinary(options));await chmod(path.join(root,'usr/bin'),0o700);
 await chmod(path.dirname(target),0o722);assert.throws(()=>validationIdentityBinary(options));await chmod(path.dirname(target),0o700);
 await chmod(target,0o722);assert.throws(()=>validationIdentityBinary(options));await chmod(target,0o700);
 assert.throws(()=>validationIdentityBinary({...options,ownerUid:process.getuid()+1}));
 await rm(binary);await symlink(target+'.other',binary);assert.throws(()=>validationIdentityBinary(options));
}));
test('approved target cannot itself be a symlink and non-id aliases keep the original strict policy',()=>fixture(async({root,binary,target,options})=>{
 await rename(target,target+'.actual');await symlink(target+'.actual',target);assert.throws(()=>validationIdentityBinary(options));
 await rm(target);await rename(target+'.actual',target);
 const other=path.join(root,'usr/bin/other');await symlink('../lib/cargo/bin/coreutils/id',other);
 assert.throws(()=>validationIdentityBinary({...options,binary:other}));
 await rm(binary);await writeFile(binary,'ordinary id fixture',{mode:0o700});
 assert.deepEqual(validationIdentityBinary(options),redisValidationBinary(options));
}));
