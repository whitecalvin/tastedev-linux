import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {stateRoot} from '../lib/runtime-paths.ts';
import {randomUUID} from 'node:crypto';
import {saveCode,readCode} from '../lib/workspace.ts';
import {nodeEnvSnapshot,updateNodeEnv} from '../lib/node-env-workspace.ts';
test('Workspace environment changes return only supported values and reject stale or unconfirmed writes',async()=>{
 const name='node-app-'+randomUUID()+'.env',original='TOKEN=fixture-secret\nPORT=3000 # app\nHOST=127.0.0.1\n';await saveCode(name,original);
 const snapshot=await nodeEnvSnapshot(name);assert(!JSON.stringify(snapshot).includes('fixture-secret'));assert.equal(snapshot.skipped,1);
 await assert.rejects(updateNodeEnv({name,version:snapshot.version,changes:{port:3100}}),error=>error.status===400);
 const result=await updateNodeEnv({name,version:snapshot.version,changes:{port:3100},confirm:true});assert(!JSON.stringify(result).includes('fixture-secret'));assert.equal(result.values.port,3100);assert(result.backupId);const backupFile=path.join(stateRoot(),'node-env-backups',result.backupId+'.json');assert.equal((await lstat(backupFile)).mode&0o777,0o600);const backup=JSON.parse(await readFile(backupFile,'utf8'));assert.equal(backup.text,original);assert.equal(backup.version,snapshot.version);assert.equal((await readCode(name)).text,'TOKEN=fixture-secret\nPORT=3100 # app\nHOST=127.0.0.1\n');
 await assert.rejects(updateNodeEnv({name,version:snapshot.version,changes:{port:3200},confirm:true}),error=>error.status===409);assert.equal((await readCode(name)).version,result.version);
 await assert.rejects(nodeEnvSnapshot('../app.env'));await assert.rejects(nodeEnvSnapshot('/etc/app.env'));await assert.rejects(nodeEnvSnapshot('app.js'));
});
