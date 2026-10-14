import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePostgresqlSettings,updatePostgresqlSetting,appendPostgresqlSetting,postgresqlValueValid} from '../lib/postgresql-settings-text.ts';
test('sample syntax and unit documentation remain comments while custom settings stay editable',()=>{
 const text="#   name = value\n# Memory units: B = bytes Time units: us = microseconds\n# kB = kilobytes ms = milliseconds\n# d = days\n# MB = megabytes\n# h = hours\n#shared_buffers = 128MB\n#extension.option = days\n#name = 'custom'\nd = days\n";
 const rows=parsePostgresqlSettings(text);
 assert.deepEqual(rows.map(row=>row.name),['shared_buffers','extension.option','name','d']);
 assert.deepEqual(rows.map(row=>row.line),[7,8,9,10]);
 const updated=updatePostgresqlSetting(text,rows[0],{value:'256MB',enabled:true});
 assert.equal(updated,text.replace('#shared_buffers = 128MB','shared_buffers = 256MB'));
});
test('PostgreSQL file GUI reads active and commented parameters, optional equals, quoted hashes and duplicates in exact order',()=>{
 const text="# RESOURCE USAGE\r\n# kB = kilobytes    ms = milliseconds\r\n#shared_buffers = 128MB # memory\r\ninclude 'conf.d/a.conf'\r\napplication_name = '한글 # ''quoted'' \\' value' # note\r\nPORT = 5432\r\nport 5433\r\n";
 const rows=parsePostgresqlSettings(text);
 assert.deepEqual(rows.map(row=>row.name),['shared_buffers','include','application_name','PORT','port']);
 assert.equal(rows[0].enabled,false);assert.equal(rows[0].comment,'# memory');assert.equal(rows[2].comment,'# note');assert(rows.every(row=>row.valid));
 const next=updatePostgresqlSetting(text,rows[4],{value:'5434'});
 assert.equal(next,text.replace('port 5433','port 5434'),'only the selected duplicate changes; CRLF and all other bytes survive');
});
test('clearing a setting retains its row and comment, disables it and allows restoring its value',()=>{
 const text='  log_line_prefix = \'%m [%p]\' # retained\nnext_setting = on';
 const cleared=updatePostgresqlSetting(text,parsePostgresqlSettings(text)[0],{value:''});
 const row=parsePostgresqlSettings(cleared)[0];assert.equal(row.name,'log_line_prefix');assert.equal(row.value,'');assert.equal(row.enabled,false);assert.equal(row.comment,'# retained');assert(cleared.endsWith('next_setting = on'));
 const restored=updatePostgresqlSetting(cleared,row,{value:"'%t'",enabled:true});assert.equal(parsePostgresqlSettings(restored)[0].enabled,true);assert(restored.includes("log_line_prefix = '%t' # retained"));
});
test('PostgreSQL setting edits reject multiline injection and stale rows without altering source',()=>{
 const text='port = 5432\n';const row=parsePostgresqlSettings(text)[0];
 for(const value of ['5433\nlisten_addresses = \'*\'','abc # injected',"'unterminated",'abc def','bad\0value'])assert.throws(()=>updatePostgresqlSetting(text,row,{value}));
 assert.throws(()=>updatePostgresqlSetting('port = 5440\n',row,{value:'5441'}));
 assert.throws(()=>parsePostgresqlSettings('port = 5432\rbad'));assert.equal(text,'port = 5432\n');
});
test('adding custom parameters keeps the last-entry ordering and preserves an existing include',()=>{
 const text="include_dir = 'conf.d'\r\nport = 5432";
 const next=appendPostgresqlSetting(text,'extension.option',"'quoted # text'");assert(next.startsWith(text+'\r\n'));
 assert.equal(parsePostgresqlSettings(next).at(-1).name,'extension.option');
 assert.equal(parsePostgresqlSettings(appendPostgresqlSetting(next,'port','')).at(-1).enabled,false);
 for(const name of ['port\n','a = b','',null])assert.throws(()=>appendPostgresqlSetting(text,name,'on'));
 for(const value of ['on','OFF','0x10','1.5','-2','128MB',"'120 ms'","'a''b'","'a\\\'b'"])assert(postgresqlValueValid(value),value);
 assert.throws(()=>appendPostgresqlSetting('a'.repeat(262144),'port','5432'));
});
