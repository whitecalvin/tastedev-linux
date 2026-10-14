import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const typedSource=await readFile(new URL('../lib/node-app-service-request.ts',import.meta.url),'utf8');
await loadBindings();const source=(await transform(typedSource,{filename:'fixture.ts',jsc:{parser:{syntax:'typescript'},target:'es2022'},module:{type:'es6'}})).code;
const version='a'.repeat(64),hash='b'.repeat(64),profile={id:'fixture',unit:'tastedev-node-fixture.service'},files=[{name:'server.js',version:hash},{name:'.env',version:hash}];
const input={id:'fixture',registryVersion:version,files,options:{restart:'always'},confirm:true};
function fixture(patch={},method='prepareNodeServiceInstall'){
 const plan={registryVersion:version,files,runtime:{status:'ready'},serviceOptions:{restart:'always',restartSeconds:5,stopSeconds:null},...patch};
 const code=source.replace(/^import .*;\n/gm,'').replaceAll('export async function','async function');
 return new Function('nodeApps','nodeAppServicePlan',code+'\nreturn '+method+';')(async()=>({version,apps:[profile]}),async()=>plan);
}
test('Node install request derives profile and account and rejects client privilege fields or stale preview',async()=>{
 const payload=await fixture()(input);assert.equal(payload.uid,process.getuid());assert.equal(payload.profile,profile);assert.equal(payload.confirm,true);
 for(const extra of [{uid:0},{profile:{id:'other'}},{confirm:false},{files:[files[0]]}])await assert.rejects(fixture()({...input,...extra}),{status:400});
 await assert.rejects(fixture({registryVersion:'c'.repeat(64)})(input),{status:409});
 await assert.rejects(fixture({files:[{...files[0],version:'c'.repeat(64)},files[1]]})(input),{status:409});
 await assert.rejects(fixture({runtime:{status:'unsupported'}})(input),{status:403});
});

test('Node control request allowlists operation and preserves verified install context',async()=>{
 const prepare=fixture({},'prepareNodeServiceControl');const payload=await prepare({...input,operation:'restart'});assert.equal(payload.operation,'restart');assert.equal(payload.uid,process.getuid());
 for(const operation of ['reload','start;id','daemon-reload',null])await assert.rejects(prepare({...input,operation}),{status:400});
 await assert.rejects(prepare({...input,operation:'start',uid:0}),{status:400});
});

test('Node stop request remains available without app files or a supported Node runtime',async()=>{
 const prepare=fixture({runtime:{status:'missing'},files:[]},'prepareNodeServiceControl');
 for(const operation of ['stop','disable']){const payload=await prepare({id:'fixture',registryVersion:version,operation,confirm:true});assert.equal(payload.operation,operation);assert.equal(payload.profile,profile);assert(!Object.hasOwn(payload,'files'));}
 await assert.rejects(prepare({...input,operation:'start'}),{status:409});
 await assert.rejects(prepare({id:'fixture',registryVersion:'c'.repeat(64),operation:'stop',confirm:true}),{status:409});
});

test('Node update request binds reviewed unit version and revalidates server-derived app context',async()=>{
 const prepare=fixture({},'prepareNodeServiceUpdate'),unitVersion='d'.repeat(64);
 const payload=await prepare({...input,unitVersion});assert.equal(payload.unitVersion,unitVersion);assert.equal(payload.profile,profile);assert.equal(payload.uid,process.getuid());
 for(const patch of [{unitVersion:null},{unitVersion:'invalid'},{uid:0},{confirm:false}])await assert.rejects(prepare({...input,unitVersion,...patch}),{status:400});
 await assert.rejects(fixture({registryVersion:'c'.repeat(64)},'prepareNodeServiceUpdate')({...input,unitVersion}),{status:409});
 await assert.rejects(fixture({runtime:{status:'missing'}},'prepareNodeServiceUpdate')({...input,unitVersion}),{status:403});
});

test('Node service restore request requires reviewed backup and server-derived app context',async()=>{
 const prepare=fixture({},'prepareNodeServiceRestore'),review={...input,unitVersion:'d'.repeat(64),backupId:'12345678-1234-1234-1234-123456789abc',backupVersion:'e'.repeat(64)};
 const payload=await prepare(review);assert.equal(payload.backupId,review.backupId);assert.equal(payload.backupVersion,review.backupVersion);assert.equal(payload.profile,profile);assert.equal(payload.uid,process.getuid());
 for(const patch of [{backupId:'../file'},{backupVersion:'invalid'},{unitVersion:null},{uid:0},{confirm:false}])await assert.rejects(prepare({...review,...patch}),{status:400});
 await assert.rejects(fixture({registryVersion:'c'.repeat(64)},'prepareNodeServiceRestore')(review),{status:409});
});

test('Node interrupted recovery request derives account and refuses forged or expired app snapshots',async()=>{
 const prepare=fixture({},'prepareNodeServiceRecovery'),review={...input,reviewVersion:'d'.repeat(64)};
 const payload=await prepare(review);assert.equal(payload.uid,process.getuid());assert.equal(payload.profile,profile);assert.equal(payload.reviewVersion,review.reviewVersion);
 for(const patch of [{reviewVersion:null},{confirm:false},{uid:0},{file:'/etc/other'},{files:[]},{backupRoot:'/tmp/other'}])await assert.rejects(prepare({...review,...patch}),{status:400});
 await assert.rejects(fixture({registryVersion:'c'.repeat(64)},'prepareNodeServiceRecovery')(review),{status:409});
 await assert.rejects(fixture({files:[{...files[0],version:'c'.repeat(64)},files[1]]},'prepareNodeServiceRecovery')(review),{status:409});
});
test('Node interrupted recovery inspection requires a registered app and current usable runtime',async()=>{
 const prepare=fixture({},'prepareNodeServiceRecoveryReview'),payload=await prepare('fixture');assert.equal(payload.profile,profile);assert.equal(payload.registryVersion,version);assert.equal(payload.uid,process.getuid());assert.deepEqual(payload.files,files);
 await assert.rejects(prepare('other'),{status:404});await assert.rejects(prepare('../fixture'),{status:400});
 await assert.rejects(fixture({runtime:{status:'missing'}},'prepareNodeServiceRecoveryReview')('fixture'),{status:409});
 await assert.rejects(fixture({registryVersion:'c'.repeat(64)},'prepareNodeServiceRecoveryReview')('fixture'),{status:409});
});
