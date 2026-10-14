import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPackages} from '../lib/package-filter.ts';
test('package filters distinguish unknown from missing and retain hidden selections',()=>{
 const catalog=[{id:'nginx',name:'nginx'},{id:'certbot',name:'Certbot'}],selected=['certbot'];
 const status={packages:[{id:'nginx',installed:true,packages:[{name:'nginx-core'}]},{id:'certbot',installed:false,packages:[{name:'python3-certbot-nginx'}]}]};
 assert.equal(filterPackages(catalog,null,'','missing').length,0);
 assert.deepEqual(filterPackages(catalog,status,'CORE','all').map(item=>item.id),['nginx']);
 assert.deepEqual(filterPackages(catalog,status,'','selected',selected).map(item=>item.id),['certbot']);
 assert.equal(filterPackages(catalog,status,'CORE','missing',selected).length,0);
 assert.deepEqual(selected,['certbot']);
});
