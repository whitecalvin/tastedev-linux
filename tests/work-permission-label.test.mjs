import test from 'node:test';
import assert from 'node:assert/strict';
import {workPermissionLabel} from '../lib/capabilities.ts';
const features=['nginxChanges','databaseChanges','certificateChanges','serviceChanges','sudoPolicyChanges','cronChanges','packageInstall','fileEditing','terminal'];
const enabled=()=>({settings:{readOnly:false,sudoWithoutPrompt:true,...Object.fromEntries(features.map(key=>[key,true]))},available:Object.fromEntries(features.map(key=>[key,true])),privilege:{ready:true}});
test('global permission label reflects runtime gates and helper readiness, not just read-only preference',()=>{
 assert.equal(workPermissionLabel(null),'권한 설정 확인');const policy=enabled();assert.equal(workPermissionLabel(policy),'작업 허용');
 policy.available.nginxChanges=false;assert.equal(workPermissionLabel(policy),'일부 작업 허용');
 policy.privilege.ready=false;assert.equal(workPermissionLabel(policy),'일부 작업 허용','local terminal/editing can remain usable without a helper');
 policy.settings.terminal=false;policy.settings.fileEditing=false;policy.settings.cronChanges=false;assert.equal(workPermissionLabel(policy),'작업 차단');
 policy.settings.readOnly=true;assert.equal(workPermissionLabel(policy),'조회 전용');
});
test('an enabled GUI option never claims permission when its server gate or sudo option is disabled',()=>{
 const policy={settings:{readOnly:false,nginxChanges:true,sudoWithoutPrompt:true},available:{nginxChanges:false},privilege:{ready:true}};
 assert.equal(workPermissionLabel(policy),'작업 차단');policy.available.nginxChanges=true;assert.equal(workPermissionLabel(policy),'일부 작업 허용');
 policy.settings.sudoWithoutPrompt=false;assert.equal(workPermissionLabel(policy),'작업 차단');assert.equal(workPermissionLabel({settings:{readOnly:false}}),'작업 차단');
});

import {featureAllowed,featureReason,terminalFeatureMessage} from '../lib/capabilities.ts';
test('malformed policy values do not unlock feature controls or throw while loading',()=>{
 for(const value of [undefined,null,'policy',[],{}, {settings:{}},{settings:{readOnly:'false',terminal:true}}, {settings:{readOnly:false,terminal:'true'}}, {settings:{readOnly:false,terminal:true},privilege:{ready:'true'}}, {settings:{readOnly:false,terminal:true},available:{terminal:'false'}}, {settings:{readOnly:false,terminal:true},available:[]}, {settings:{readOnly:false,terminal:true},privilege:'ready'}]){assert.equal(featureAllowed(value,'terminal'),false);assert.equal(typeof featureReason(value,'terminal'),'string');assert.equal(typeof terminalFeatureMessage(value),'string');}
 const valid={settings:{readOnly:false,terminal:true},available:{terminal:true}};assert.equal(featureAllowed(valid,'terminal'),true);assert.equal(featureReason(valid,'terminal'),'');assert.equal(featureAllowed({...valid,settings:{...valid.settings,readOnly:true}},'terminal'),false);
});
