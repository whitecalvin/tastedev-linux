import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRedisSettings,updateRedisSetting,appendRedisSetting,redisValueValid} from '../lib/redis-settings-text.ts';
test('Redis file GUI retains multi-argument directives, repeats, unknown active options and full-line comments',()=>{
 const source='# explanatory paragraph\r\n# save <seconds> <changes>\r\n# save 900 1\r\nsave 300 10\r\nsave 60 10000\r\nrename-command CONFIG ""\r\nrequirepass "secret # value"\r\nfuture-option one two\r\n# replica-announced set to \'no\', the replica can be promoted\r\n  timeout  10  \r\n';
 const rows=parseRedisSettings(source);assert.deepEqual(rows.map(row=>row.name),['save','save','save','rename-command','requirepass','future-option','timeout']);assert.equal(rows[0].enabled,false);assert(rows.every(row=>row.valid));assert.equal(rows[4].sensitive,true);
 assert.equal(updateRedisSetting(source,rows.at(-1)),source,'no-op keeps existing spacing and line endings');
 const after=updateRedisSetting(source,rows[1],{value:'301 11'});assert.equal(after,source.replace('save 300 10','save 301 11'));assert.equal(parseRedisSettings(after)[4].value,'"secret # value"');
 const inline=parseRedisSettings('timeout 10 # literal\n')[0];assert.equal(inline.value,'10 # literal');assert.equal(inline.comment,'');
});
test('Redis quote grammar accepts quoted empty arguments and rejects unbalanced or joined closing quotes',()=>{
 for(const value of ['900 1 300 10','""',"'a b'",'CONFIG ""','abc"def"','"a\\\"b\\x00"',"'a\\\'b'",'a # literal','unquoted\\path'])assert(redisValueValid(value),value);
 for(const value of ['"unfinished',"'unfinished",'"a"b',"'a'b",'"dangling\\',null,123,'a\nport 9999','a\rport 9','a\0b'])assert.equal(redisValueValid(value),false,String(value));
});
test('Redis clear and toggle retain the same row including unknown directives',()=>{
 for(const source of ['future-option one\n','save 900 1\n','# future-option \n']){
  let row=parseRedisSettings(source)[0],cleared=updateRedisSetting(source,row,{value:''});row=parseRedisSettings(cleared)[0];assert(row);assert.equal(row.value,'');assert.equal(row.enabled,false);assert.equal(row.name,source.includes('save')?'save':'future-option');
  const restored=updateRedisSetting(cleared,row,{value:'10 2',enabled:true});row=parseRedisSettings(restored)[0];assert(row.enabled);assert.equal(row.value,'10 2');const disabled=updateRedisSetting(restored,row,{enabled:false});assert.equal(parseRedisSettings(disabled)[0].enabled,false);
 }
});
test('Redis edits reject stale rows and injection while bounded append retains newline style',()=>{
 const source='port 6379\r\n',row=parseRedisSettings(source)[0];assert.throws(()=>updateRedisSetting('port 6380\r\n',row,{value:'6381'}));assert.throws(()=>updateRedisSetting(source,row,{value:'6380\ninclude /tmp/other'}));
 assert.equal(appendRedisSetting(source,'save','900 1'),source+'save 900 1\r\n');assert.equal(appendRedisSetting('port 6379','future-option',''),'port 6379\n#future-option \n');
 for(const name of ['port\n','--port','a b',''])assert.throws(()=>appendRedisSetting(source,name,'1'));
 const size='# '+ '가'.repeat(87380)+'xx';assert.equal(new TextEncoder().encode(size).length,262144);assert.throws(()=>appendRedisSetting(size,'save','900 1'));assert.throws(()=>parseRedisSettings(size+'x'));
 assert.equal(parseRedisSettings('save \n')[0].valid,false);
});

test('Redis credential fields stay masked through edits, clears and comments',()=>{
 for(const name of ['requirepass','masterauth','masteruser','tls-key-file-pass','tls-client-key-file-pass','user']){
  const value=name==='user'?'operator on >fixture-secret ~* +@all':'"fixture secret"';
  const source=name+' '+value+'\r\nport 6379\r\n';
  let row=parseRedisSettings(source)[0];assert.equal(row.sensitive,true,name);
  const edited=updateRedisSetting(source,row,{value:name==='user'?'operator on >changed-secret ~* +@all':'"changed secret"'});
  assert(edited.endsWith('port 6379\r\n'));row=parseRedisSettings(edited)[0];assert(row.sensitive);
  const cleared=updateRedisSetting(edited,row,{value:''});row=parseRedisSettings(cleared)[0];assert(row.sensitive);assert.equal(row.enabled,false);assert.equal(row.value,'');
 }
 for(const name of ['tls-key-file','tls-client-key-file','aclfile','port'])assert.equal(parseRedisSettings(name+' fixture\n')[0].sensitive,false);
});
