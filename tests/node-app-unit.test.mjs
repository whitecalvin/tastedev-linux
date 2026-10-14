import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeAppUnit} from '../lib/node-app-unit.ts';
test('Node service unit uses a fixed executable, account and unit sections with literal escaped paths',()=>{const text=nodeAppUnit({id:'my-app',label:'My app',directory:'/srv/App %i $HOME',entry:'server "name".js',environmentFile:'.env'},1000);assert(text.includes('User=1000\n'));assert(text.includes('WorkingDirectory=/srv/App\\x20%%i\\x20$HOME'));assert(text.includes('ExecStart=:/usr/bin/node'));assert(text.includes('server \\"name\\".js'));assert.equal((text.match(/^ExecStart=/gm)||[]).length,1);assert(!text.includes('/bin/sh'));assert.throws(()=>nodeAppUnit({id:'my-app',label:'My app',directory:'/srv/app',entry:'server.js',environmentFile:'.env'},0));});

test('Node unit restart options are bounded and cannot inject directives',()=>{
 const app={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'};
 for(const restart of ['no','on-failure','always']){const unit=nodeAppUnit(app,1000,{restart,restartSeconds:'30'});assert(unit.includes('Restart='+restart+'\n'));assert(unit.includes('RestartSec=30\n'));}
 for(const options of [{restart:'always\nUser=0'},{restartSeconds:0},{restartSeconds:301},{restartSeconds:'1e2'},{restartSeconds:true},{restartSeconds:1.5},{extra:true},null])assert.throws(()=>nodeAppUnit(app,1000,options),{status:400});
});

test('Node stop timeout retains system default unless a bounded timeout is selected',()=>{
 const app={id:'fixture',label:'Fixture',directory:'/srv/fixture',entry:'server.js',environmentFile:'.env'};
 assert(!nodeAppUnit(app,1000).includes('TimeoutStopSec='));
 assert(nodeAppUnit(app,1000,{stopSeconds:'60'}).includes('TimeoutStopSec=60\n'));
 for(const stopSeconds of [0,301,'infinity','1e2','60\nUser=0',true,''])assert.throws(()=>nodeAppUnit(app,1000,{stopSeconds}),{status:400});
});
