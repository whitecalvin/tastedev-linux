import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {adminHelperRuntimeSource,assertAdminHelperRuntimeCurrent} from '../scripts/admin/error-output-source.mts';

async function fixture(){
 const home='/usr/lib/tastedev-linux/scripts/admin',reads:string[]=[],directories:string[]=[];
 let manifest:unknown={},metadata:Record<string,unknown>={};
 const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
 const context=vm.createContext({Buffer,__dirname:home,hash,fail(message:string){throw Error(message);},rootDir(dir:string){directories.push(dir);},fs:{
  lstatSync(){return {isFile:()=>true,isSymbolicLink:()=>false,uid:0,nlink:1,mode:0o600,size:100,...metadata};},
  readFileSync(file:string){reads.push(file);return file.endsWith('manifest.json')?Buffer.from(JSON.stringify(manifest)):Buffer.from('module fixture');}
 }});
 vm.runInContext(await adminHelperRuntimeSource(),context);
 const names:unknown=vm.runInContext('mariaModules',context);assert(Array.isArray(names));
 const hashes=Object.fromEntries(names.map(name=>{assert(typeof name==='string');return [name,hash('module fixture')];}));
 async function load():Promise<unknown>{const result:unknown=vm.runInContext('mariaRuntime()',context);return await result;}
 return {context,reads,directories,hashes,load,setManifest(value:unknown){manifest=value;},setMetadata(value:Record<string,unknown>){metadata=value;}};
}
test('root helper runtime exactly matches its typed manifest and loader',async()=>{
 await assertAdminHelperRuntimeCurrent();const source=await adminHelperRuntimeSource();
 assert(!/\b(?:export|import)\s/.test(source));assert(source.includes('async function mariaRuntime('));
});
test('typed loader rejects a checkout before filesystem access',async()=>{
 const f=await fixture();f.context.__dirname='/checkout/scripts/admin';
 await assert.rejects(f.load(),/packaged root-owned helper/);assert.equal(f.reads.length,0);assert.equal(f.directories.length,0);
});
test('typed loader refuses malformed manifests, unauthorized modules and checksum mismatch before imports',async()=>{
 const f=await fixture();
 for(const value of [null,[],1,'invalid',{}, {...f.hashes,'unapproved.mjs':'0'.repeat(64)}]){f.setManifest(value);await assert.rejects(f.load(),/Invalid admin runtime manifest/);}
 const first=Object.keys(f.hashes)[0];f.setManifest({...f.hashes,[first]:'altered'});await assert.rejects(f.load(),/checksum mismatch/);
 assert(f.reads.every(file=>file.startsWith('/usr/lib/tastedev-linux/scripts/admin/runtime/')));
});
test('typed loader rejects writable, linked, non-regular and oversized runtime files',async()=>{
 const f=await fixture();f.setManifest(f.hashes);
 for(const patch of [{uid:1000},{mode:0o622},{nlink:2},{size:262145},{isFile:()=>false},{isSymbolicLink:()=>true}]){f.setMetadata(patch);await assert.rejects(f.load(),/Unsafe admin runtime/);}
});
