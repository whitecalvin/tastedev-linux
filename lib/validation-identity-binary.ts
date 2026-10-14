import type {ValidationBinaryOptions} from './redis-validation-binary.ts';
import {lstatSync,readlinkSync} from 'node:fs';
import path from 'node:path';
import {redisValidationBinary} from './redis-validation-binary.ts';
const fail=()=>{throw Object.assign(Error('Validation identity executable requires review'),{status:409});};
// Ubuntu's Rust coreutils installs id as this root-owned symlink to a
// root-owned multicall executable. All other executable paths stay strict.
// ownerUid/anchor are trusted fixture hooks, never HTTP request parameters.
export function validationIdentityBinary({binary,ownerUid=0,anchor='/'}:Omit<ValidationBinaryOptions,'allowHardLinks'>={}){
 const base=path.resolve(anchor),location=path.resolve(binary||'/usr/bin/id');
 const identity=base==='/'?'/usr/bin/id':path.join(base,'usr/bin/id');
 if(location!==identity||!lstatSync(location).isSymbolicLink())return redisValidationBinary({binary:location,ownerUid,anchor:base});
 const target=base==='/'?'/usr/lib/cargo/bin/coreutils/id':path.join(base,'usr/lib/cargo/bin/coreutils/id');
 function alias(){
  const directories=[base,path.join(base,'usr'),path.join(base,'usr/bin')];
  const parents=directories.map(directory=>{const stat=lstatSync(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==ownerUid||(stat.mode&0o022))fail();return {path:directory,dev:stat.dev,ino:stat.ino,uid:stat.uid,mode:stat.mode};});
  const stat=lstatSync(location);if(!stat.isSymbolicLink()||stat.uid!==ownerUid||stat.nlink!==1)fail();
  const link=readlinkSync(location);if(path.resolve(path.dirname(location),link)!==target)fail();
  return {parents,dev:stat.dev,ino:stat.ino,uid:stat.uid,mtimeMs:stat.mtimeMs,link};
 }
 const before=alias();
 // Multiple hardlinks are permitted only for this fixed multicall target.
 // Its full root-owned parent chain, bytes and link count are revalidated.
 const fingerprint=redisValidationBinary({binary:target,ownerUid,anchor:base,allowHardLinks:true});
 if(JSON.stringify(before)!==JSON.stringify(alias()))fail();
 return Object.freeze({...fingerprint,path:location,resolvedPath:target,alias:before});
}
