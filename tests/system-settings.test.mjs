import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {systemSettings,saveSystemSettings,validateSystemSettings} from '../lib/system-settings.ts';
import {logCommand} from '../lib/operations.ts';
test('saved log limits generate bounded commands and stale writes cannot overwrite settings',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','system-settings-')),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;
 try{const first=systemSettings();const saved=await saveSystemSettings({...first,logLines:500,logRefreshSeconds:10});assert.equal(systemSettings().logLines,500);assert(logCommand('nginx.service',null,saved.logLines).includes('--lines=500'));assert.deepEqual(logCommand('nginx-error',null,saved.logLines).slice(1,3),['-n','500']);await assert.rejects(saveSystemSettings({...first,logLines:50}),e=>e.status===409);assert.throws(()=>validateSystemSettings({...saved,logLines:1000000}));assert.throws(()=>logCommand('nginx.service',null,Infinity));}
 finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}
});
test('settings reader rejects symbolic links',async()=>{const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','settings-link-')),old=process.env.LINUX_STATE_ROOT;process.env.LINUX_STATE_ROOT=root;try{await symlink('/etc/passwd',join(root,'system-settings.json'));assert.throws(()=>systemSettings());}finally{if(old===undefined)delete process.env.LINUX_STATE_ROOT;else process.env.LINUX_STATE_ROOT=old;await rm(root,{recursive:true,force:true});}});
