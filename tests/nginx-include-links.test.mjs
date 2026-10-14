import test from 'node:test';
import assert from 'node:assert/strict';
import {nginxIncludeLinks} from '../lib/nginx-include-links.ts';
const files=['conf.d/a.conf','conf.d/a.conf.disabled','conf.d/sub/b.conf','snippets/tls.conf','sites-enabled/example'].map(name=>({name,path:'/etc/nginx/'+name}));
const node=label=>({kind:'directive',label});
test('include navigation matches exact and leaf wildcard paths without implying enabled state',()=>{assert.deepEqual(nginxIncludeLinks(node('include /etc/nginx/conf.d/*.conf'),files).files.map(file=>file.name),['conf.d/a.conf']);assert.deepEqual(nginxIncludeLinks(node('include "/etc/nginx/snippets/tls.conf"'),files).files.map(file=>file.name),['snippets/tls.conf']);assert.deepEqual(nginxIncludeLinks(node('include /etc/nginx/sites-enabled/*'),files).files.map(file=>file.name),['sites-enabled/example']);});
test('include navigation refuses ambiguous prefixes traversal and unsupported pattern forms',()=>{for(const value of ['/etc/nginx/../private','/etc/nginx-other/file','/etc/nginx/*/file','/etc/nginx/[ab].conf','/etc/nginx/$file'])assert.equal(nginxIncludeLinks(node('include '+value),files).supported,false,value);assert.equal(nginxIncludeLinks(node('listen 80'),files),null);assert.equal(nginxIncludeLinks({kind:'block',label:'include /etc/nginx/file'},files),null);});

test('relative include navigation uses the nginx main configuration directory',()=>{assert.deepEqual(nginxIncludeLinks(node('include conf.d/*.conf'),files).files.map(file=>file.name),['conf.d/a.conf']);assert.equal(nginxIncludeLinks(node('include ../private'),files).supported,false);});
