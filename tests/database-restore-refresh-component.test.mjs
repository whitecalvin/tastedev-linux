import {toastTestModuleWithReact,toastTestChildren} from './support/toast-test-module.mjs';
import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';

async function fixture(name,props){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/'+name+'.tsx',import.meta.url),'utf8'),{filename:name+'.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const states=[],refs=[],effects=[],pending=[],Button=()=>null,Checkbox=()=>null,Dropdown=()=>null,module={exports:{}},native=createRequire(import.meta.url);
 let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const at=si++;if(!(at in states))states[at]=initial;return[states[at],value=>states[at]=typeof value==='function'?value(states[at]):value];},useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useEffect:(fn,deps)=>{const at=ei++;if(!effects[at]||deps.some((value,i)=>value!==effects[at].deps[i]))pending.push(()=>{effects[at]?.cleanup?.();effects[at]={deps,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./ui/toast-provider'?toastTestModuleWithReact(hooks):name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:value=>value})}:name==='./ui/controls'?{Button,Checkbox,Dropdown}:name==='./redis-restore-plan'?{__esModule:true,default:()=>null}:native(name),module,module.exports);
 const all=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(toastTestChildren(tree)).flatMap(all)];
 const nodes=()=>{si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return all(tree);};
 return{props,nodes,Button,Checkbox,dispose:()=>effects.forEach(effect=>effect.cleanup?.())};
}
const security={settings:{readOnly:false,databaseChanges:true,sudoWithoutPrompt:true},available:{databaseChanges:true},privilege:{ready:true}};
for(const kind of ['redis','mariadb'])test(kind+' manual backup control locks duplicate clicks and displays the newly returned catalog',async()=>{
 let resolve,calls=0;const record={id:'12345678-1234-4123-8123-123456789abc',target:kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/my.cnf',createdAt:'2026-10-06',bytes:25};
 const view=await fixture(kind+'-backups',{connected:true,security,api:async()=>assert.fail('manual action callback owns API calls'),onBackup:()=>{calls++;return new Promise(done=>resolve=done);}});
 view.nodes();const button=view.nodes().find(node=>node.type===view.Button&&node.props['aria-label']==='현재 파일 백업');assert(button);assert.equal(button.props.className,'nginx-icon-button');
 const pending=button.props.onClick();await button.props.onClick();assert.equal(calls,1);resolve({backups:[record]});await pending;
 assert(JSON.stringify(view.nodes()).includes(record.id));view.dispose();
});
for(const kind of ['redis','mariadb'])for(const failed of [false,true])test(kind+' restore retains its actual outcome after refresh rejection: '+failed,async()=>{
 const plan={id:'12345678-1234-4123-8123-123456789abc',root:'/etc/mysql/my.cnf',target:kind==='redis'?'/etc/redis/redis.conf':'/etc/mysql/mariadb.conf.d/50-server.cnf',changed:true,version:'a'.repeat(64),graphVersion:'b'.repeat(64),backupVersion:'c'.repeat(64),restoreGraphVersion:'d'.repeat(64),fields:[],warnings:[]};
 const output={changed:!failed,failed,restored:failed,recovered:failed,version:'e'.repeat(64)};
 let rejectRefresh,restoreCalls=0,callbackCalls=0;
 const api=async(action,payload)=>{
  if(action==='mariadb-backups')return{backups:[{id:plan.id,target:plan.target,createdAt:'2026-10-06',bytes:20}]};
  if(action.startsWith('mariadb-restore-plan?'))return plan;
  restoreCalls++;assert.equal(action,kind==='redis'?'redis-config-restore':'mariadb-restore');assert.equal(payload.confirm,true);assert.equal(payload.backupVersion,plan.backupVersion);
  return output;
 };
 const callback=(result,target)=>{callbackCalls++;assert.equal(result,output);assert.equal(target,plan.target);return new Promise((resolve,reject)=>rejectRefresh=reject);};
 const view=await fixture(kind==='redis'?'redis-operation':'mariadb-backups',{api,connected:true,security,...(kind==='redis'?{plan,restore:true,onApplied:callback}:{onRestored:callback})});
 const click=label=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label).props.onClick();
 view.nodes();
 if(kind==='mariadb'){await click('MariaDB 백업 조회');await click('복원 검토');await click('백업으로 복원');}
 else view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});
 const button=view.nodes().find(node=>node.type===view.Button&&node.props.children===(kind==='redis'?'Redis 설정 복원':'복원 및 재시작'));
 const executing=button.props.onClick();await Promise.resolve();assert.equal(callbackCalls,1);await button.props.onClick();assert.equal(restoreCalls,1);
 rejectRefresh(Error('refresh unavailable'));await executing;
 const nodes=view.nodes();assert(nodes.some(node=>node.props?.role==='alert'&&node.props.children===(failed?'refresh unavailable':'설정 적용은 완료되었지만 목록 갱신에 실패했습니다.')));
 if(kind==='redis'&&failed)assert(nodes.some(node=>node.props?.role==='alert'&&String(node.props.children).includes('백업 복원에 실패')));
 const text=JSON.stringify(nodes);assert(text.includes(failed?'백업 복원에 실패하여 원본 설정을 복원하고 서비스를 복구했습니다.':kind==='redis'?'설정 적용 완료':'설정 복원 완료'));
 view.dispose();
});

for(const name of ['mariadb-apply','mariadb-backups','redis-operation'])test(name+' retains incomplete journal cleanup warning and clears it on connection change',async()=>{
 const plan={id:'12345678-1234-4123-8123-123456789abc',root:'/etc/mysql/my.cnf',path:name==='redis-operation'?'/etc/redis/redis.conf':'/etc/mysql/mariadb.conf.d/50-server.cnf',target:'/etc/mysql/mariadb.conf.d/50-server.cnf',changed:true,version:'a'.repeat(64),graphVersion:'b'.repeat(64),backupVersion:'c'.repeat(64),restoreGraphVersion:'d'.repeat(64),fields:[{key:'max_connections',before:100,after:120}],warnings:[]};
 const api=async action=>action==='mariadb-backups'?{backups:[{id:plan.id,target:plan.target}]}:action.startsWith('mariadb-restore-plan?')?plan:{changed:true,version:'e'.repeat(64),journalCleanupVerified:false};
 const view=await fixture(name,{plan,api,connected:true,security});view.nodes();
 const click=label=>view.nodes().find(node=>node.type===view.Button&&node.props.children===label).props.onClick();
 if(name==='mariadb-apply'){await click('MariaDB 설정 적용');await click('적용 및 재시작');}
 else if(name==='mariadb-backups'){await click('MariaDB 백업 조회');await click('복원 검토');await click('백업으로 복원');await click('복원 및 재시작');}
 else{view.nodes().find(node=>node.type===view.Checkbox).props.onChange({target:{checked:true}});await click('Redis 설정 적용');}
 assert(view.nodes().some(node=>node.props?.role==='alert'&&node.props.children==='파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다. 기록을 검토하세요.'));
 view.props.api=(...args)=>api(...args);assert(!JSON.stringify(view.nodes()).includes('파일 작업은 완료됐지만 중단 기록 정리를 확인하지 못했습니다.'));view.dispose();
});
