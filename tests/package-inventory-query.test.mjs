import test from 'node:test';
import assert from 'node:assert/strict';
import {queryPackageInventory} from '../lib/package-inventory-query.ts';
import {inventorySnapshot} from '../lib/inventory-snapshot.ts';

test('one query preserves versions and requested order across package groups',async()=>{
 let calls=0;
 const result=await queryPackageInventory(['nginx','npm','nginx'],async(binary,args,options)=>{
  calls++;assert.equal(binary,'/usr/bin/dpkg-query');
  assert.deepEqual(args.slice(2),['nginx','npm']);assert.equal(options.timeout,5000);
  return {stdout:'npm\tinstall ok installed\t10.8.2\nnginx\tinstall ok installed\t1.28.0\n'};
 });
 assert.equal(calls,1);assert.deepEqual([...result.keys()],['nginx','npm']);
 assert.deepEqual(result.get('nginx'),{name:'nginx',installed:true,version:'1.28.0'});
});
test('missing packages do not discard installed packages from dpkg exit 1',async()=>{
 const result=await queryPackageInventory(['nginx','certbot','redis-server'],async()=>{
  throw Object.assign(Error('missing package'),{code:1,stdout:'nginx\tinstall ok installed\t1.28.0\nredis-server\tdeinstall ok config-files\t7.0.0\n'});
 });
 assert.equal(result.get('nginx').installed,true);
 assert.deepEqual(result.get('certbot'),{name:'certbot',installed:false,version:null});
 assert.equal(result.get('redis-server').installed,false);
});
test('timed out output and unrelated records cannot claim installed packages',async()=>{
 await assert.rejects(queryPackageInventory(['nginx'],async()=>{throw Object.assign(Error('timeout'),{code:1,killed:true,stdout:'nginx\tinstall ok installed\t1.28.0\n'});}),{status:503});
 const result=await queryPackageInventory(['nginx'],async()=>({stdout:'other\tinstall ok installed\t1\nnginx\tinstall ok unpacked\t1.28.0\n'}));
 assert.equal(result.size,1);assert.equal(result.get('nginx').installed,false);
});

test('inventory execution failures reject without disclosing raw diagnostic output',async()=>{
 for(const failure of [{code:2},{code:'ENOENT'},{code:'EACCES'},{code:1,signal:'SIGTERM'},{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}]){
  await assert.rejects(queryPackageInventory(['nginx'],async()=>{throw Object.assign(Error('private diagnostic'),failure,{stderr:'private diagnostic',stdout:'nginx\tinstall ok installed\t1.28.0\n'});}),error=>error.status===503&&!error.message.includes('private diagnostic'));
 }
});
test('failed native inventory refresh preserves the last successful package membership and versions',async()=>{
 let failed=false,version='1.28.0';
 const read=inventorySnapshot(()=>queryPackageInventory(['nginx','redis-server'],async()=>{if(failed)throw Object.assign(Error('permission denied'),{code:2});return {stdout:'nginx\tinstall ok installed\t'+version+'\nredis-server\tinstall ok installed\t7.4\n'};}));
 const initial=await read();assert.equal(initial.get('nginx').version,'1.28.0');assert.equal(initial.get('redis-server').installed,true);
 failed=true;await assert.rejects(read({refresh:true}),{status:503});assert.deepEqual(await read(),initial);
 failed=false;version='1.29.0';assert.equal((await read({refresh:true})).get('nginx').version,'1.29.0');
});
