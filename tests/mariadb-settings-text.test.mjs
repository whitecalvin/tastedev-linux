import test from 'node:test';import assert from 'node:assert/strict';
import {parseMariaDBSettings,updateMariaDBSetting,appendMariaDBSetting,mariadbValueValid} from '../lib/mariadb-settings-text.ts';
test('MariaDB file rows retain groups, duplicates, valueless flags, include paths and quoted hashes',()=>{
 const source='!includedir /etc/mysql/conf.d\r\n[client]\r\npassword="fixture # value" # retained\r\nport=3306\r\n[mysqld]\r\nskip-networking # flag\r\n# max_connections = 100\r\nport=3307\r\nport=3308\r\n[mariadb-11.4]\r\nplugin-option = one;two\r\n';
 const rows=parseMariaDBSettings(source);assert.deepEqual(rows.map(row=>row.group),['','client','client','mysqld','mysqld','mysqld','mysqld','mariadb-11.4']);assert(rows[0].include);assert(rows[1].sensitive);assert.equal(rows[1].value,'"fixture # value"');assert(rows[3].flag);assert.equal(rows[3].comment,'# flag');assert.equal(rows.at(-1).value,'one;two');
 assert.equal(updateMariaDBSetting(source,rows[6],{value:'3310'}),source.replace('port=3308','port=3310'));for(const row of rows)assert.equal(updateMariaDBSetting(source,row),source);
});
test('MariaDB clear and switch keep assignment and flag rows with their original group',()=>{
 assert.equal(parseMariaDBSettings('[mysqld]\n# skip_networking\n; general_log\n').length,2);
 for(const source of ['[client]\nport = 3306 # retained\n','[mysqld]\nskip-name-resolve # flag\n']){
  const row=parseMariaDBSettings(source)[0],clear=updateMariaDBSetting(source,row,{value:'',enabled:false}),disabled=parseMariaDBSettings(clear)[0];assert(disabled);assert.equal(disabled.group,row.group);assert.equal(disabled.value,'');assert.equal(disabled.enabled,false);
  const restored=updateMariaDBSetting(clear,disabled,{value:row.flag?'':'3310',enabled:true});assert.equal(parseMariaDBSettings(restored)[0].enabled,true);
 }
});
test('MariaDB additions target the last matching group and preserve later client groups',()=>{
 const source='[mysqld]\nport=3306\n[client]\nport=3306\n[mysqld]\nport=3307\n[client]\npassword=fixture\n';
 const next=appendMariaDBSetting(source,'max_connections','150','mysqld');assert.equal(next,source.replace('port=3307\n','port=3307\nmax_connections = 150\n'));assert.equal(appendMariaDBSetting(next,'skip-networking','','mysqld',true),next.replace('max_connections = 150\n','max_connections = 150\nskip-networking\n'));
 assert(appendMariaDBSetting(source,'plugin-option','value','mariadb-11.4').endsWith('[mariadb-11.4]\nplugin-option = value\n'));
 for(const group of ['mysqld]\n[client','../bad','',null])assert.throws(()=>appendMariaDBSetting(source,'port','9',group));
});
test('MariaDB syntax rejects comments injected into a value, stale rows and UTF-8 overflow',()=>{
 for(const value of ['"quoted # hash"',"'quoted # hash'",'unquoted spaces','value;literal','"escape\\\"quote"'])assert(mariadbValueValid(value));
 for(const value of ['a # comment','"unfinished','a\n!include /tmp/bad','a\0b'])assert.equal(mariadbValueValid(value),false);
 const source='[mysqld]\nport=3306\n',row=parseMariaDBSettings(source)[0];assert.throws(()=>updateMariaDBSetting(source.replace('3306','3307'),row,{value:'3308'}));assert.throws(()=>appendMariaDBSetting(source,'bad\noption','9'));assert.throws(()=>appendMariaDBSetting('# '+ '가'.repeat(87380)+'xx','port','9'));
 assert.equal(parseMariaDBSettings('# heading text\n[client]\n# explanatory paragraph\npassword=fixture\n').length,1);
});
