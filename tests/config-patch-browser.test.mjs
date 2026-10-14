import test from 'node:test';
import assert from 'node:assert/strict';
import {browserConfigPatch} from './browser-config-patch.mjs';
test('database GUI patch module closure works without Buffer process or Node polyfills',async()=>{
 const patch=await browserConfigPatch();
 const cases=[['postgresql',"# 한글 😀\r\nport = 5432 # retained\r\ninclude = 'local.conf'\r\n",5433,'port = 5433 # retained'],['mariadb','[client]\r\nport=3306\r\n[mysqld]\r\nport=3306\r\n# 한글 😀\r\n',3307,'port = 3307'],['redis','# 한글 😀\r\nport 6379\r\nrequirepass retained-secret\r\n',6380,'port 6380']];
 for(const [kind,source,port,expected] of cases){const changed=patch(kind,source,{port});assert(changed.includes(expected));assert(changed.includes('# 한글 😀'));assert.equal(changed.replace(expected,kind==='postgresql'?'port = 5432 # retained':kind==='mariadb'?'port=3306':'port 6379'),source);assert.equal(patch(kind,source,{}),source);assert.throws(()=>patch(kind,source,{port:'1\nother-setting bad'}));}
});
test('browser configuration patch uses UTF-8 bytes for input and result size limits',async()=>{
 const patch=await browserConfigPatch(),limit=262144;
 const source='# '+ '가'.repeat(87380)+'xx';assert.equal(new TextEncoder().encode(source).length,limit);assert.equal(patch('postgresql',source,{}),source);
 assert.throws(()=>patch('postgresql',source+'x',{}));
 assert.throws(()=>patch('postgresql',source,{port:5433}),'appended settings must not exceed the allowed result bytes');
 const prefix='port = 9\n# ',atLimit=prefix+'x'.repeat(limit-prefix.length);assert.equal(patch('postgresql',atLimit,{port:1}).length,limit);assert.throws(()=>patch('postgresql',atLimit,{port:65535}),'replacing an existing short value must obey the result limit');
});
