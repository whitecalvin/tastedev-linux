import test from 'node:test';
import assert from 'node:assert/strict';
import {consoleRoute,packageConsoleView} from '../lib/console-route.ts';
test('session return paths preserve selected package and reject arbitrary path input',()=>{
 for(const kind of ['nginx','certbot','nodejs','postgresql','mariadb','redis'])assert.equal(consoleRoute(packageConsoleView(kind),kind),'/ide/packages/'+kind);
 for(const invalid of ['../security','https://example.com','#redis','unknown'])assert.equal(consoleRoute('ide',invalid),'/ide');
 assert.equal(consoleRoute('packages','redis'),'/packages');
});
test('console shortcuts use canonical nginx package route and static page paths',()=>{assert.equal(consoleRoute('server-settings'),'/ide/packages/nginx');for(const view of ['overview','packages','daemon','logs','recovery','audit','ide','terminal','security','github'])assert.equal(consoleRoute(view),'/'+view);for(const view of ['#packages','https://example.com',null,'unknown'])assert.equal(consoleRoute(view),'/overview');});

test('Certbot route opens actual certificate operations GUI and databases open package tools',()=>{for(const kind of ['nginx','certbot'])assert.equal(packageConsoleView(kind),'server-settings');for(const kind of ['nodejs','postgresql','mariadb','redis'])assert.equal(packageConsoleView(kind),'ide');});

test('known daemon units open their own canonical package GUI and unknown units have no route',async()=>{
 const {servicePackageRoute}=await import('../lib/console-route.ts');
 for(const [unit,kind] of [['nginx.service','nginx'],['certbot.timer','certbot'],['certbot.service','certbot'],['postgresql.service','postgresql'],['mariadb.service','mariadb'],['redis-server.service','redis']])assert.equal(servicePackageRoute(unit),'/ide/packages/'+kind);
 for(const unit of ['cron.service','unknown.service','__proto__','../../nginx.service',null])assert.equal(servicePackageRoute(unit),null);
});

test('GitHub login returns to the canonical repository page',async()=>{const {loginDestination}=await import('../lib/login-destination.ts');assert.equal(loginDestination('/github'),'/github');assert.equal(loginDestination('//github.com'),'/overview');});
