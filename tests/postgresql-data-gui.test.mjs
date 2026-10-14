import * as consoleTypes from '../components/console-types.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {createRequire} from 'node:module';
const native=createRequire(import.meta.url);
import {readFile} from 'node:fs/promises';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {translate} from '../lib/i18n.ts';

async function fixture(props){
 await loadBindings();
 const compiled=await transform(await readFile(new URL('../components/postgresql-data-backups.tsx',import.meta.url),'utf8'),{filename:'postgresql-data-backups.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const language={locale:'ko'},states=[],refs=[],effects=[],pending=[],module={exports:{}};let si=0,ri=0,ei=0;
 const hooks={...React,useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:initial=>{const i=ri++;return refs[i]??(refs[i]={current:initial});},useEffect:(fn,deps)=>{const i=ei++;if(!effects[i]||deps.some((value,j)=>value!==effects[i].deps[j]))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,fn,cleanup:fn()};});}};
 new Function('require','module','exports',compiled.code)(name=>name==='./console-types'?consoleTypes:name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({locale:language.locale,t:value=>translate(language.locale,value)})}:name==='./ui/controls'?{IconButton:()=>null,NativeSelect:()=>null,Checkbox:()=>null,TextInput:()=>null}:name==='../lib/capabilities.ts'?{featureAllowed:(p)=>!p.settings.readOnly&&p.settings.databaseChanges}:native(name),module,module.exports);
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];
 return{props,language,render(){si=ri=ei=0;const tree=module.exports.default(props);while(pending.length)pending.shift()();return nodes(tree);},replay(){for(const effect of effects){effect.cleanup?.();effect.cleanup=effect.fn();}},dispose(){for(const effect of effects)effect.cleanup?.();}};
}

const policy={version:'1',settings:{sudoWithoutPrompt:true,readOnly:false,databaseChanges:true},privilege:{ready:true},available:{databaseChanges:true}};
test('data GUI consumes backup confirmation, uses reviewed DB, and hides stale connection results',async()=>{
 let writes=0;const review={reviewVersion:'a'.repeat(64),databases:[{name:'fixture',oid:'1'}]},api=async(action,input)=>{if(action==='postgresql-data-context')return review;if(action==='postgresql-data-backups')return{backups:[]};assert.equal(action,'postgresql-data-backup');assert.equal(input.database,'fixture');writes++;return{backup:{id:'fixture-backup'}};};
 const view=await fixture({api,path:'/etc/postgresql/16/main/postgresql.conf',connected:true,security:policy});const find=label=>view.render().find(n=>n.props?.['aria-label']===label||n.props?.label===label);
 await find('데이터베이스·백업 갱신').props.onClick();find('데이터베이스').props.onChange({target:{value:'fixture'}});find('선택한 데이터베이스를 백업합니다.').props.onChange({target:{checked:true}});const backup=find('선택한 데이터베이스 백업');assert.equal(backup.props.disabled,false);await backup.props.onClick();await backup.props.onClick();assert.equal(writes,1);assert(view.render().some(n=>n.props?.role==='status'&&JSON.stringify(n.props.children).includes('데이터 백업을 생성했습니다.')));view.props.api=async()=>({});assert(!view.render().some(n=>n.props?.role==='status'));view.dispose();
});

test('failed restore shows preserved backup, consumes typed approval, and requires a new review',async()=>{
 let restores=0,plans=0;const backup={id:'original',database:'fixture',createdAt:'2026-10-08T00:00:00Z',bytes:100},review={reviewVersion:'a'.repeat(64),databases:[{name:'fixture',oid:'1'}]};
 const api=async(action,input)=>{if(action==='postgresql-data-context')return review;if(action==='postgresql-data-backups')return{backups:[backup]};if(action==='postgresql-data-plan'){plans++;return{...backup,sha256:'b'.repeat(64)};}assert.equal(action,'postgresql-data-restore');assert.equal(input.confirmation,'fixture');assert.equal(input.sha256,'b'.repeat(64));restores++;return{failed:true,transactionStatus:'unknown',undoBackupId:'undo-preserved',message:'데이터 복원에 실패했습니다. 복원 전 데이터 백업을 보존했습니다. 연결이 끊긴 경우 실제 데이터 상태를 다시 확인하세요.'};};
 const view=await fixture({api,path:'/etc/postgresql/16/main/postgresql.conf',connected:true,security:policy});const find=label=>view.render().find(n=>n.props?.['aria-label']===label||n.props?.label===label);
 await find('데이터베이스·백업 갱신').props.onClick();find('데이터베이스').props.onChange({target:{value:'fixture'}});await find('데이터 복원 검토 · original').props.onClick();
 find('확인할 데이터베이스 이름').props.onChange({target:{value:'wrong'}});assert.equal(find('확인한 데이터 백업 복원').props.disabled,true);find('확인할 데이터베이스 이름').props.onChange({target:{value:'fixture'}});const retained=find('확인한 데이터 백업 복원');await retained.props.onClick();await retained.props.onClick();assert.equal(restores,1);
 const alert=view.render().find(n=>n.props?.role==='alert');assert(alert);assert(JSON.stringify(alert.props.children).includes('undo-preserved'));assert(JSON.stringify(alert.props.children).includes('실제 데이터 상태'));assert(!find('확인할 데이터베이스 이름'));for(const locale of ['ja','ar','uk']){view.language.locale=locale;const translatedAlert=view.render().find(n=>n.props?.role==='alert');const text=JSON.stringify(translatedAlert.props.children);assert(!/[가-힣]/.test(text));assert(text.includes('undo-preserved'));}view.language.locale='ko';await find('데이터 복원 검토 · original').props.onClick();assert.equal(plans,2);assert.equal(find('확인할 데이터베이스 이름').props.value,'');assert.equal(find('확인한 데이터 백업 복원').props.disabled,true);view.dispose();
});
test('failed refresh invalidates prior database review instead of leaving stale write controls',async()=>{
 let refreshes=0;const api=async action=>{if(action==='postgresql-data-context'){if(++refreshes>1)throw Error('클러스터 조회 실패');return{reviewVersion:'a'.repeat(64),databases:[{name:'fixture',oid:'1'}]};}return{backups:[]};};
 const view=await fixture({api,path:'/etc/postgresql/16/main/postgresql.conf',connected:true,security:policy});const find=label=>view.render().find(n=>n.props?.['aria-label']===label||n.props?.label===label);
 await find('데이터베이스·백업 갱신').props.onClick();find('데이터베이스').props.onChange({target:{value:'fixture'}});find('선택한 데이터베이스를 백업합니다.').props.onChange({target:{checked:true}});await find('데이터베이스·백업 갱신').props.onClick();assert(!find('데이터베이스'));assert.equal(find('선택한 데이터베이스 백업').props.disabled,true);assert(view.render().some(n=>n.props?.role==='alert'));view.dispose();
});

test('every registered locale renders popup instructions without translating database identities',async()=>{
 const backup={id:'backup_20261010',database:'사용자_DB',createdAt:'2026-10-10T00:00:00Z',bytes:12345};
 const api=async action=>action==='postgresql-data-context'?{reviewVersion:'a'.repeat(64),databases:[{name:backup.database}]}:{backups:[backup]};
 const view=await fixture({api,path:'/etc/postgresql/18/main/postgresql.conf',connected:true,security:policy});
 await view.render().find(n=>n.props?.['aria-label']==='데이터베이스·백업 갱신').props.onClick();
 for(const locale of ['en','ja','zh','de','fr','es','it','pt','ru','ar','tr','uk']){
  view.language.locale=locale;const nodes=view.render();
  const select=nodes.find(n=>n.props?.options);
  assert.equal(select.props.label,translate(locale,'데이터베이스'));
  assert.equal(select.props.options[0].label,translate(locale,'데이터베이스 선택'));
  assert.equal(select.props.options[1].label,backup.database);
  assert(nodes.some(n=>n.props?.['aria-label']===translate(locale,'데이터 복원 검토')+' · '+backup.id));
  assert(nodes.some(n=>n.type==='p'&&n.props.children===translate(locale,'테이블·데이터·백업에 포함된 객체를 백업하고 복원합니다. 복원 전 현재 데이터 백업을 남깁니다.')));
  assert(nodes.some(n=>n.type==='td'&&n.props.children===backup.createdAt));
 }
 view.dispose();
});

test('saved result and refresh-failure notice follow language changes without reissuing a backup',async()=>{
 let writes=0,reads=0;const api=async action=>{
  if(action==='postgresql-data-context')return {reviewVersion:'a'.repeat(64),databases:[{name:'fixture'}]};
  if(action==='postgresql-data-backups'){if(++reads>1)throw Error('refresh failure');return {backups:[]};}
  writes++;return {backup:{id:'stable_backup_id'}};
 };
 const view=await fixture({api,path:'/etc/postgresql/18/main/postgresql.conf',connected:true,security:policy});
 const find=label=>view.render().find(n=>n.props?.['aria-label']===label||n.props?.label===label);
 await find('데이터베이스·백업 갱신').props.onClick();find('데이터베이스').props.onChange({target:{value:'fixture'}});find('선택한 데이터베이스를 백업합니다.').props.onChange({target:{checked:true}});await find('선택한 데이터베이스 백업').props.onClick();
 for(const locale of ['ja','ar','ko']){
  view.language.locale=locale;const alert=view.render().find(n=>n.props?.role==='alert');
  const text=JSON.stringify(alert.props.children);
  assert(text.includes(translate(locale,'데이터 백업을 생성했습니다.')));
  assert(text.includes(translate(locale,'목록 갱신에 실패했습니다.')));
  assert(text.includes('stable_backup_id'));
 }
 assert.equal(writes,1);assert.equal(reads,2);view.dispose();
});
