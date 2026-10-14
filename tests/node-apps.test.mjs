import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeAppProfile} from '../lib/node-app-profile.ts';
import {nodeApps,saveNodeApp,removeNodeApp} from '../lib/node-apps.ts';
const profile={id:'my-app',label:'My app',directory:'/srv/my-app',entry:'server.js',environmentFile:'.env'};
test('Node app profile accepts a hidden environment filename and binds a managed service name',()=>{assert.equal(nodeAppProfile({...profile,unit:'nginx.service'}).unit,'tastedev-node-my-app.service');for(const patch of [{id:'--evil'},{directory:'/srv/../etc'},{directory:'relative'},{entry:'../server.js'},{entry:'server.js\ncommand'},{environmentFile:'/etc/passwd'},{entry:'npm start'}])assert.throws(()=>nodeAppProfile({...profile,...patch}),error=>error.status===400);});
test('Node app registry persists profiles with a version conflict guard',async()=>{const before=await nodeApps(),saved=await saveNodeApp({profile,version:before.version});assert(saved.apps.some(app=>app.id==='my-app'));assert.deepEqual((await nodeApps()).apps,saved.apps);await assert.rejects(saveNodeApp({profile:{...profile,label:'Changed'},version:before.version}),error=>error.status===409);assert.equal((await nodeApps()).version,saved.version);});

test('Node app unregister requires confirmation and current registry version, and preserves other apps',async()=>{
 const before=await nodeApps(),saved=await saveNodeApp({version:before.version,profile:{...profile,id:'removable-app'}});
 await assert.rejects(removeNodeApp({id:'removable-app',version:saved.version}),error=>error.status===400);
 await assert.rejects(removeNodeApp({id:'removable-app',version:before.version,confirm:true}),error=>error.status===409);
 const removed=await removeNodeApp({id:'removable-app',version:saved.version,confirm:true});assert(!removed.apps.some(app=>app.id==='removable-app'));assert.deepEqual(removed.apps,saved.apps.filter(app=>app.id!=='removable-app'));
 await assert.rejects(removeNodeApp({id:'removable-app',version:removed.version,confirm:true}),error=>error.status===404);
 assert.deepEqual(await nodeApps(),removed);
});
