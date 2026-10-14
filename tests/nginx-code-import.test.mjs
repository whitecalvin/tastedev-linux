import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxCodeImport} from '../lib/nginx-code-import.ts';
import {stepConfigHistory} from '../lib/config-history.ts';
test('nginx code roundtrip preserves draft history and rejects concurrent edits or malformed code',()=>{
 const file={path:'/etc/nginx/nginx.conf',source:'events {}\n'},record={sourcePath:file.path,liveSource:file.source,treeSource:file.source,text:'events { worker_connections 512; }\n'};
 const imported=nginxCodeImport(record,file);assert.equal(imported.source,record.text);assert.equal(imported.baseline,file.source);assert.equal(stepConfigHistory(imported,'undo').source,file.source);
 assert.throws(()=>nginxCodeImport(record,{...file,source:'events { }\n'}));assert.throws(()=>nginxCodeImport(record,file,{source:'events { worker_connections 100; }\n'}));
 assert.throws(()=>nginxCodeImport({...record,text:'events {'},file));assert.throws(()=>nginxCodeImport({...record,text:'a\0;'},file));assert.throws(()=>nginxCodeImport({...record,sourcePath:'/other'},file));
});
