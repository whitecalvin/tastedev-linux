import test from 'node:test';
import assert from 'node:assert/strict';
import {configFieldDiff} from '../lib/config-field-diff.ts';
test('settings comparison distinguishes imported fields, semantic numbers and changed values',()=>{
 const rows=configFieldDiff('postgresql',{port:5432,logging:false},{port:'5432',logging:true,connections:100});
 assert.equal(rows.find(row=>row.key==='port').changed,false);
 assert.equal(rows.find(row=>row.key==='logging').changed,true);
 assert.equal(rows.find(row=>row.key==='connections').known,false);
 assert.equal(rows.find(row=>row.key==='connections').changed,false);
 assert.equal(configFieldDiff('postgresql',{port:5432},{port:''})[0].changed,true);
 assert.throws(()=>configFieldDiff('unknown',{},{}));
});
