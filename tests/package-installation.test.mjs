import test from 'node:test';
import assert from 'node:assert/strict';
import {packageGroupInstalled} from '../lib/package-installation.ts';
test('installed Node stays manageable when the separate npm package was removed',()=>{
 assert.equal(packageGroupInstalled('nodejs',[{name:'nodejs',installed:true},{name:'npm',installed:false}]),true);
 assert.equal(packageGroupInstalled('nodejs',[{name:'nodejs',installed:false},{name:'npm',installed:true}]),false);
});
test('other installation groups retain their complete-package requirement',()=>{
 assert.equal(packageGroupInstalled('certbot',[{name:'certbot',installed:true},{name:'python3-certbot-nginx',installed:false}]),false);
 assert.equal(packageGroupInstalled('certbot',[{name:'certbot',installed:true},{name:'python3-certbot-nginx',installed:true}]),true);
 assert.equal(packageGroupInstalled('nginx',[]),false);
});
