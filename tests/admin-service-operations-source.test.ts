import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {constants} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {adminServiceOperationsSource,assertAdminServiceOperationsCurrent} from '../scripts/admin/error-output-source.mts';

test('service helper exactly matches its standalone TypeScript source',async()=>{
 await assertAdminServiceOperationsCurrent();assert(!/\b(?:export|import)\s/.test(await adminServiceOperationsSource()));
});
test('MariaDB service identity reads bounded process metadata and refuses changed UID or executable',async()=>{
 const contents=new Map([
  ['/proc/42/stat','42 (mariadbd) '+['S',...Array(18).fill('0'),'12345'].join(' ')],
  ['/proc/42/status','Uid:\t106\t106\t106\t106\n'],
  ['/proc/42/cmdline','/usr/sbin/mariadbd\0--defaults-file=/etc/mysql/my.cnf\0']
 ]);
 const descriptors=new Map<number,string>();let next=0,executable='/usr/sbin/mariadbd';
 const context=vm.createContext({Buffer,path,require:createRequire(import.meta.url),rootDir(){},execFileSync(){return '42\n';},fail(message:string){throw Error(message);},fs:{constants,
  openSync(file:string){descriptors.set(++next,file);return next;},
  readSync(fd:number,bytes:Buffer,offset:number,length:number){const file=descriptors.get(fd);assert(file);const content=contents.get(file);assert(content!==undefined);return Buffer.from(content).copy(bytes,offset,0,length);},
  closeSync(fd:number){descriptors.delete(fd);},readlinkSync(){return executable;},realpathSync(){return '/usr/sbin/mariadbd';},
  lstatSync(){return {isFile:()=>true,isSymbolicLink:()=>false,uid:0,nlink:1,mode:0o755};}
 }});
 vm.runInContext(await adminServiceOperationsSource(),context);
 const snapshot:unknown=vm.runInContext('mariaServiceSnapshot()',context);
 assert(snapshot!==null&&typeof snapshot==='object'&&'uid' in snapshot&&'pid' in snapshot&&'identityVerified' in snapshot);assert.equal(snapshot.uid,106);assert.equal(snapshot.pid,42);assert.equal(snapshot.identityVerified,true);assert.equal(descriptors.size,0);
 assert.equal(vm.runInContext("mariaServiceSnapshot().canonical('/etc/mysql/my.cnf')",context),'/etc/mysql/my.cnf');
 executable='/foreign/binary';assert.throws(()=>vm.runInContext('mariaServiceSnapshot()',context),/executable differs/);assert.equal(descriptors.size,0);
 executable='/usr/sbin/mariadbd';contents.set('/proc/42/status','Uid:\t106\t107\t106\t106\n');assert.throws(()=>vm.runInContext('mariaServiceSnapshot()',context),/metadata changed/);assert.equal(descriptors.size,0);
 contents.set('/proc/42/status','x'.repeat(16385));assert.throws(()=>vm.runInContext('mariaServiceSnapshot()',context),/exceeds limit/);assert.equal(descriptors.size,0);
});
test('typed MariaDB inspection validates complete include graphs and exact bytes before accepting content',async()=>{
 const file='/etc/mysql/my.cnf',text='[mysqld]\nport=3306\n',hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');let complete=true,version=hash(text);
 const runtime={async mariadbTopology(){return {root:file,files:[{path:file,version,bytes:Buffer.byteLength(text)}],complete,version:'graph'};},trusted(){return Buffer.from(text);}};
 const context=vm.createContext({Buffer,path,require:createRequire(import.meta.url),rootDir(){},hash,runtime,fail(message:string){throw Error(message);}});
 vm.runInContext(await adminServiceOperationsSource(),context);
 async function inspect(root:unknown=file):Promise<unknown>{context.root=root;const output:unknown=vm.runInContext('mariaInspect(root,runtime)',context);return await output;}
 const result:unknown=await inspect();assert(result!==null&&typeof result==='object'&&'contents' in result);assert.equal(vm.runInContext("runtime.trusted('/etc/mysql/my.cnf').toString()",context),text);
 complete=false;await assert.rejects(inspect(),/complete MariaDB include graph/);complete=true;
 version='stale';await assert.rejects(inspect(),/include graph changed/);
 await assert.rejects(inspect(1),/Invalid MariaDB main/);
});
