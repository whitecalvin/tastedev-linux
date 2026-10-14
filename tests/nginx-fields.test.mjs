import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxDirectiveField,validateNginxField} from '../lib/nginx-fields.ts';
test('mapping and MIME keys accept arbitrary results despite matching typed directive names',()=>{
 for(const context of ['map','geo','types'])for(const [name,value] of [['worker_connections','2'],['gzip','on'],['server_tokens','off'],['ssl_verify_client','on']]){
  const field=nginxDirectiveField(name,value,context);assert.deepEqual(field,{type:'text'});assert.equal(validateNginxField(field,'backend.example'), 'backend.example');
 }
 assert.equal(nginxDirectiveField('gzip','on','location').type,'switch');
 assert.equal(nginxDirectiveField('worker_connections','2','events').type,'number');
 assert.throws(()=>validateNginxField(nginxDirectiveField('worker_connections','2','events'),'backend.example'));
});
test('nginx GUI numeric controls enforce boundaries and preserve special worker forms',()=>{
 for(const [name,min,max] of [['gzip_comp_level',1,9],['keepalive_requests',1,2147483647]]){
  const field=nginxDirectiveField(name,'2');assert.equal(field.type,'number');
  for(const value of [String(min),String(max)])assert.equal(validateNginxField(field,value),value);
  for(const value of [String(min-1),String(max+1),'2.5','1e2','2;id'])assert.throws(()=>validateNginxField(field,value));
 }
 assert.equal(nginxDirectiveField('worker_processes','auto').type,'text');
 assert.equal(nginxDirectiveField('gzip_http_version','unexpected').type,'text');
 const version=nginxDirectiveField('gzip_http_version','1.1');assert.equal(validateNginxField(version,'1.0'),'1.0');assert.throws(()=>validateNginxField(version,'2.0'));
 assert.throws(()=>validateNginxField(nginxDirectiveField('gzip','on'),'yes'));
});
