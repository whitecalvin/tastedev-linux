import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,chmod,rm,readlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {inspectNginxSites} from '../lib/nginx-sites.ts';
async function fixture(t){const base=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','nginx-sites-'));t.after(()=>rm(base,{recursive:true,force:true}));for(const group of ['sites-available','sites-enabled'])await mkdir(path.join(base,group),{mode:0o755});return base;}
const graph={complete:true,files:[{path:'/etc/nginx/sites-enabled/example'}]};
test('site inventory distinguishes included links, excluded links and file conflicts without mutating them',async t=>{
 const base=await fixture(t),source=path.join(base,'sites-available/example');await writeFile(source,'server { listen 80; }',{mode:0o644});await writeFile(path.join(base,'sites-available/conflict'),'server {}',{mode:0o644});
 await symlink('../sites-available/example',path.join(base,'sites-enabled/example'));await symlink('../sites-available/example',path.join(base,'sites-enabled/alias'));await writeFile(path.join(base,'sites-enabled/conflict'),'server {}',{mode:0o644});
 const first=await inspectNginxSites(graph,{base}),second=await inspectNginxSites(graph,{base});assert.equal(first.version,second.version);assert.equal(first.operatingConfigurationChanged,false);
 const example=first.available.entries.find(row=>row.name==='example');assert.deepEqual(example.links,[{path:'/etc/nginx/sites-enabled/alias',included:false},{path:'/etc/nginx/sites-enabled/example',included:true}]);assert.equal(example.conflict,false);assert.equal(first.available.entries.find(row=>row.name==='conflict').conflict,true);
 assert.equal(await readlink(path.join(base,'sites-enabled/example')),'../sites-available/example');assert.ok(!JSON.stringify(first).includes('listen 80'));await writeFile(source,'server { listen 81; }');assert.notEqual((await inspectNginxSites(graph,{base})).version,first.version);
});
test('missing, broken and external links are explicit and incomplete graphs never imply active inclusion',async t=>{
 const base=await fixture(t);await symlink('../sites-available/missing',path.join(base,'sites-enabled/broken'));await symlink('/etc/passwd',path.join(base,'sites-enabled/external'));
 const result=await inspectNginxSites({complete:false,files:[]},{base});assert.deepEqual(result.enabled.entries.map(row=>[row.name,row.status,row.included]),[['broken','broken',null],['external','external',null]]);assert.ok(!JSON.stringify(result).includes('/etc/passwd'));
 await rm(path.join(base,'sites-available'),{recursive:true});assert.equal((await inspectNginxSites(graph,{base})).available.exists,false);
});
test('unsafe directories and writable files are refused or explicitly unsafe',async t=>{
 const base=await fixture(t);const file=path.join(base,'sites-available/example');await writeFile(file,'server {}',{mode:0o644});await chmod(file,0o666);await symlink('../sites-available/example',path.join(base,'sites-enabled/example'));
 const result=await inspectNginxSites(graph,{base});assert.equal(result.available.entries[0].status,'unsafe');assert.equal(result.enabled.entries[0].status,'unsafe');await chmod(path.join(base,'sites-enabled'),0o777);await assert.rejects(inspectNginxSites(graph,{base}),error=>error.status===409);
});
test('inventory byte budget refuses an oversized directory',async t=>{const base=await fixture(t);for(let index=0;index<5;index++)await writeFile(path.join(base,'sites-available/site'+index),'x'.repeat(262144),{mode:0o644});await assert.rejects(inspectNginxSites(graph,{base}),error=>error.status===409);});
