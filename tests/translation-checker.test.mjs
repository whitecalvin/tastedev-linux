import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
test('translation gate rejects untranslated status and component errors, then accepts explicit English fallback',async()=>{
 const root=await mkdtemp(path.join('/mnt/data/build/tastedev-linux','translation-gate-'));
 try{
  for(const folder of ['app','components','lib/locales'])await mkdir(path.join(root,folder),{recursive:true});
  for(const file of ['nginx-setting-info','nginx-operational-help','nginx-mapping-help','nginx-protocol-help','nginx-module-settings','nginx-sites','nginx-site-request','nginx-site-operation','postgresql-data-context','postgresql-data-backup','network-settings','app-restart','system-settings','api','nginx-node-transfer','terminal-session-state','nginx-syntax','security','privilege','nginx-tree','postgresql-hba','config-source','operations','postgresql-hba-operation','postgresql-hba-validation','packages','install-job-record','cron-install','workspace','server-tools','admin-job-record','admin-job-progress','certificate-command','nginx-config','config-operation-plan','certificate-nginx-backup','postgresql-backup-request','postgresql-config-backup','postgresql-hba-backups','postgresql-restore-undo-backup','postgresql-reviewed-graph-recovery','redis-recovery','mariadb-recovery','node-apps','node-app-profile','node-app-env-backups','manual-backup-request','mariadb-recovery-backup','mariadb-config-hooks','auth-store','better-auth','helper-error','helper-json-output','sudo-policy-request','config-live','config-profiles','config-value-parser','database-config-profile','cron-basic-schedule','mariadb-settings-text','postgresql-settings-text','redis-settings-text','nginx-form-import','nginx-apply-request','nginx-validation','nginx-fields','nginx-code-import','nginx-server-presets','node-env-patch','cron-lock','redis-config-hooks','redis-apply-request','mariadb-service-scope','redis-topology','mariadb-topology','node-app-env-restore','node-app-env','node-app-logs','node-app-service-plan','node-app-service-request','node-app-unit','node-env-restore','node-env-workspace','site-form','site-status','redis-apply','redis-candidate-resources','redis-candidate-validation','redis-code-operation','redis-context-inspect','redis-sandbox-executables','redis-validation-plan','redis-validation-process','postgresql-cluster-status','postgresql-code-operation','postgresql-config-candidate','postgresql-config-graph','postgresql-config-validation','postgresql-graph-restore-review','postgresql-hba-candidate','postgresql-hba-graph','postgresql-hba-sandbox','postgresql-hba-service','postgresql-hba-source','postgresql-hba-validate','postgresql-original-config-validation','postgresql-restore-service-context','postgresql-reviewed-graph-restore','ai-analysis','ai-models','ai-provider','ai-settings','capabilities'])await writeFile(path.join(root,'lib',file+'.ts'),'export {};');
  await writeFile(path.join(root,'components/fixture.jsx'),"function Fixture(){setNotice('상태 fixture');setMessage('메시지 fixture');throw Error('오류 fixture');}");
  const catalog=path.join(root,'lib/locales/en.json');await writeFile(catalog,'{}');
  const script=fileURLToPath(new URL('../scripts/check-translations.ts',import.meta.url));
  let failed;try{await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000});}catch(error){failed=error;}
  assert.equal(failed?.code,1);const denied=JSON.parse(failed.stdout);assert.equal(denied.status,'FAIL');assert.deepEqual(denied.missingEnglish.map(item=>item.key).sort(),['메시지 fixture','상태 fixture','오류 fixture']);
  await writeFile(catalog,JSON.stringify({'상태 fixture':'Status fixture','메시지 fixture':'Message fixture','오류 fixture':'Error fixture'}));
  const {stdout}=await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000});const accepted=JSON.parse(stdout);assert.equal(accepted.status,'PASS');assert.equal(accepted.statusLiteralKeys,2);assert.equal(accepted.errorLiteralKeys,1);
  await writeFile(path.join(root,'lib/postgresql-data-backup.ts'),"throw Error('데이터 백업 fixture 오류');");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{
   assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert.equal(report.postgresqlDataRuntimeKeys,1);assert(report.missingEnglish.some(item=>item.key==='데이터 백업 fixture 오류'&&item.files.includes('lib/postgresql-data-backup.ts')));return true;
  });
  await writeFile(catalog,JSON.stringify({'상태 fixture':'Status fixture','메시지 fixture':'Message fixture','오류 fixture':'Error fixture','데이터 백업 fixture 오류':'Data backup fixture error'}));
  const final=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(final.status,'PASS');assert.equal(final.postgresqlDataRuntimeKeys,1);
  await writeFile(path.join(root,'lib/network-settings.ts'),"throw Error('접속 설정 fixture 오류');");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert.equal(report.settingsRuntimeKeys,1);assert(report.missingEnglish.some(item=>item.key==='접속 설정 fixture 오류'));return true;});
  const entries=JSON.parse(await readFile(catalog,'utf8'));entries['접속 설정 fixture 오류']='Network settings fixture error';await writeFile(catalog,JSON.stringify(entries));
  const settingsFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(settingsFinal.status,'PASS');assert.equal(settingsFinal.settingsRuntimeKeys,1);
  await writeFile(path.join(root,'lib/api.ts'),"const result={error:'API 경계 fixture 오류'};");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert.equal(report.apiDiagnosticKeys,1);assert(report.missingEnglish.some(item=>item.key==='API 경계 fixture 오류'));return true;});
  entries['API 경계 fixture 오류']='API boundary fixture error';await writeFile(catalog,JSON.stringify(entries));
  const apiFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(apiFinal.status,'PASS');assert.equal(apiFinal.apiDiagnosticKeys,1);
  await writeFile(path.join(root,'lib/postgresql-hba.ts'),"const messages={'invalid-rule':'접속 규칙 진단 fixture'};");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert(report.missingEnglish.some(item=>item.key==='접속 규칙 진단 fixture'&&item.files.includes('lib/postgresql-hba.ts')));return true;});
  entries['접속 규칙 진단 fixture']='Connection rule diagnostic fixture';await writeFile(catalog,JSON.stringify(entries));
  const hbaFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(hbaFinal.status,'PASS');
  await writeFile(path.join(root,'lib/security.ts'),"const fail=message=>Error(message);throw fail('공통 오류 함수 fixture');");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert(report.missingEnglish.some(item=>item.key==='공통 오류 함수 fixture'&&item.files.includes('lib/security.ts')));return true;});
  entries['공통 오류 함수 fixture']='Shared error factory fixture';await writeFile(catalog,JSON.stringify(entries));
  const factoryFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(factoryFinal.status,'PASS');
  await writeFile(path.join(root,'components/fixture.jsx'),"const pageDescriptions={packages:'패키지 설명 fixture'};function Fixture({view}){return t(pageDescriptions[view]);}");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);assert(report.missingEnglish.some(item=>item.key==='패키지 설명 fixture'&&item.files.includes('components/fixture.jsx')));return true;});
  entries['패키지 설명 fixture']='Package description fixture';await writeFile(catalog,JSON.stringify(entries));
  const pageFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(pageFinal.status,'PASS');
  await writeFile(path.join(root,'components/fixture.jsx'),"const serviceStateLabels={enabled:'동적 상태 fixture'};const optionSections=[{title:'보안 그룹 fixture',description:'그룹 설명 fixture'}];");
  await writeFile(path.join(root,'lib/capabilities.ts'),"export function gate(){return '터미널 안내 fixture';}");
  await assert.rejects(promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000}),error=>{assert.equal(error.code,1);const report=JSON.parse(error.stdout);for(const key of ['동적 상태 fixture','보안 그룹 fixture','그룹 설명 fixture','터미널 안내 fixture'])assert(report.missingEnglish.some(item=>item.key===key),key);return true;});
  for(const key of ['동적 상태 fixture','보안 그룹 fixture','그룹 설명 fixture','터미널 안내 fixture'])entries[key]='Explicit fixture fallback';await writeFile(catalog,JSON.stringify(entries));
  const dynamicFinal=JSON.parse((await promisify(execFile)(process.execPath,[script],{cwd:root,timeout:10000})).stdout);assert.equal(dynamicFinal.status,'PASS');
 }finally{await rm(root,{recursive:true,force:true});}
});
