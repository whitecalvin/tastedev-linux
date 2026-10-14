import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {adminDispatchSource,assertAdminDispatchCurrent} from '../scripts/admin/error-output-source.mts';

async function fixture(){
 const calls:{binary:string;args:string[];timeout:unknown}[]=[],guards:string[]=[];
 const context=vm.createContext({Buffer,units:['nginx.service','cron.service','certbot.timer','postgresql.service','mariadb.service','redis-server.service'],
  fail(message:string){throw Error(message);},nginxMutationStateGuard(action:string){guards.push(action);},
  run(binary:string,args:string[],timeout:unknown){calls.push({binary,args,timeout});return args[0]==='show'?'loaded\n':'fixture log';}
 });
 vm.runInContext(await adminDispatchSource(),context);
 function dispatch(action:string,input:unknown):unknown{return vm.runInContext('dispatch('+JSON.stringify(action)+','+JSON.stringify(input)+')',context);}
 return {dispatch,calls,guards};
}
test('helper privilege dispatch exactly matches its TypeScript source',async()=>{
 await assertAdminDispatchCurrent();assert(!/\b(?:export|import)\s/.test(await adminDispatchSource()));
});
test('typed dispatch refuses malformed payloads and unsupported actions before native calls',async()=>{
 const f=await fixture();for(const value of [null,[],1,'text'])assert.throws(()=>f.dispatch('install',value),/Invalid action payload/);
 assert.equal(f.guards.length,0);assert.throws(()=>f.dispatch('bash',{}),/Unsupported action/);assert.equal(f.calls.length,0);
});
test('typed installation dispatch uses a fixed package map and never upgrades or removes packages',async()=>{
 const f=await fixture();
 for(const input of [{confirm:false,packages:['nginx']},{confirm:true,packages:[]},{confirm:true,packages:['nginx','nginx']},{confirm:true,packages:['--allow-unauthenticated']},{confirm:true,packages:['__proto__']},{confirm:true,packages:[1]}])assert.throws(()=>f.dispatch('install',input),/Invalid packages/);
 assert.equal(f.calls.length,0);
 f.dispatch('install',{confirm:true,packages:['nginx','certbot','nodejs','postgresql','mariadb','redis']});
 assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])),{binary:'/usr/bin/apt-get',args:['install','--yes','--no-remove','--no-upgrade','nginx','certbot','python3-certbot-nginx','nodejs','npm','postgresql','mariadb-server','redis-server']});
});
test('typed daemon dispatch validates unit and action before native calls and checks nginx syntax before activation',async()=>{
 const f=await fixture();
 for(const input of [{unit:'ssh.service',action:'stop',confirm:true},{unit:1,action:'start',confirm:true},{unit:'nginx.service',action:1,confirm:true},{unit:'postgresql.service',action:'reload',confirm:true},{unit:'nginx.service',action:'restart',confirm:false}])assert.throws(()=>f.dispatch('service',input),/Invalid service operation/);
 assert.equal(f.calls.length,0);f.dispatch('service',{unit:'nginx.service',action:'restart',confirm:true});
 assert.deepEqual(JSON.parse(JSON.stringify(f.calls)).map((call:{binary:string;args:string[]})=>[call.binary,call.args]),[
  ['/usr/bin/systemctl',['show','nginx.service','--property=LoadState','--value','--no-pager','--no-ask-password']],
  ['/usr/sbin/nginx',['-t']],['/usr/bin/systemctl',['--no-ask-password','restart','nginx.service']]
 ]);
});
