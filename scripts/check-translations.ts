import {readdir,readFile} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
import {diagnosticCandidates} from './verification/audit-runtime-copy.ts';

const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const identifier=(value:unknown)=>object(value)&&value.type==='Identifier'&&typeof value.value==='string'?value.value:undefined;
const catalogValue:unknown=JSON.parse(await readFile('lib/locales/en.json','utf8'));if(!object(catalogValue))throw Error('Invalid English catalog');const english=catalogValue;
const keys=new Map<string,Set<string>>(),statusKeys=new Set<string>(),errorKeys=new Set<string>(),helpKeys=new Set<string>(),runtimeKeys=new Set<string>(),postgresqlDataKeys=new Set<string>(),settingsRuntimeKeys=new Set<string>(),apiDiagnosticKeys=new Set<string>(),interactionDiagnosticKeys=new Set<string>(),helperReadinessKeys=new Set<string>();let dynamicCalls=0,dynamicStatusCalls=0,dynamicErrorCalls=0;
function addKey(key:string,file:string){const files=keys.get(key)??new Set<string>();files.add(file);keys.set(key,files);}
function literalKeys(node:unknown):string[]{
 if(!object(node))return [];
 if(node.type==='StringLiteral'&&typeof node.value==='string')return [node.value.trim()];
 if(node.type==='ConditionalExpression')return [...literalKeys(node.consequent),...literalKeys(node.alternate)];
 return [];
}
function walk(node:unknown,file:string){
 if(!object(node))return;
 // Route descriptions are translated through t(pageDescriptions[view]).
 // Inspect their data values as well as direct t() literals.
 if(node.type==='VariableDeclarator'&&['pageDescriptions','serviceStateLabels','optionSections'].includes(identifier(node.id)??''))walkHelp(node.init,file);
 const name=identifier(node.callee)??'';
 const translation=node.type==='CallExpression'&&name==='t';
 const status=node.type==='CallExpression'&&['setNotice','setError','setMessage'].includes(name);
 const error=file.startsWith('components/')&&(node.type==='CallExpression'||node.type==='NewExpression')&&name==='Error';
 if(translation||status||error){
  const argument=Array.isArray(node.arguments)&&object(node.arguments[0])?node.arguments[0].expression:undefined;const found=literalKeys(argument);
  if(!found.length){if(translation)dynamicCalls++;else if(status)dynamicStatusCalls++;else dynamicErrorCalls++;}
  for(const key of found){if(!keys.has(key))keys.set(key,new Set<string>());addKey(key,file);if(status&&key)statusKeys.add(key);if(error&&key)errorKeys.add(key);}
 }
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(item=>walk(item,file));else if(value&&typeof value==='object')walk(value,file);
}
async function scan(directory:string){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=directory+'/'+entry.name;
  if(entry.isDirectory())await scan(file);
  else if(/\.(jsx?|tsx?)$/.test(file))walk(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}),file);
 }
}
await loadBindings();await scan('app');await scan('components');
// Settings descriptions are selected dynamically, so scanning t() calls alone misses them.
function walkHelp(node:unknown,file:string,target:Set<string>=helpKeys){
 if(!object(node))return;
 if(node.type==='StringLiteral'&&typeof node.value==='string'&&/[가-힣]/.test(node.value)){
  const key=node.value.trim();target.add(key);if(!keys.has(key))keys.set(key,new Set<string>());addKey(key,file);
 }
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(item=>walkHelp(item,file,target));else if(value&&typeof value==='object')walkHelp(value,file,target);
}
const helpFiles=new Set(['nginx-setting-info.ts','nginx-operational-help.ts','nginx-mapping-help.ts','nginx-protocol-help.ts','nginx-module-settings.ts',...(await readdir('lib')).filter(name=>/^nginx-(?:main|http-core|proxy|tls|upstream)-settings\.(?:mjs|ts)$/.test(name))]);
for(const name of helpFiles){const file='lib/'+name;walkHelp(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}),file);}
for(const file of ['lib/nginx-sites.ts','lib/nginx-site-request.ts','lib/nginx-site-operation.ts'])walkHelp(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}),file,runtimeKeys);
for(const file of ['lib/postgresql-data-context.ts','lib/postgresql-data-backup.ts'])walkHelp(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}),file,postgresqlDataKeys);
for(const file of ['lib/network-settings.ts','lib/app-restart.ts','lib/system-settings.ts'])walkHelp(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}),file,settingsRuntimeKeys);
const apiDiagnostics=diagnosticCandidates(await parse(await readFile('lib/api.ts','utf8'),{filename:'lib/api.ts'}));
for(const key of apiDiagnostics.literals){apiDiagnosticKeys.add(key);if(!keys.has(key))keys.set(key,new Set<string>());addKey(key,'lib/api.ts');}
for(const file of ['lib/nginx-node-transfer.ts','lib/terminal-session-state.ts','lib/nginx-syntax.ts','lib/security.ts','lib/privilege.ts','lib/nginx-tree.ts','lib/postgresql-hba.ts','lib/config-source.ts','lib/operations.ts','lib/postgresql-hba-operation.ts','lib/postgresql-hba-validation.ts','lib/packages.ts','lib/install-job-record.ts','lib/cron-install.ts','lib/workspace.ts','lib/server-tools.ts','lib/admin-job-record.ts','lib/admin-job-progress.ts','lib/certificate-command.ts','lib/nginx-config.ts','lib/config-operation-plan.ts','lib/certificate-nginx-backup.ts','lib/postgresql-backup-request.ts','lib/postgresql-config-backup.ts','lib/postgresql-hba-backups.ts','lib/postgresql-restore-undo-backup.ts','lib/postgresql-reviewed-graph-recovery.ts','lib/redis-recovery.ts','lib/mariadb-recovery.ts','lib/node-apps.ts','lib/node-app-profile.ts','lib/node-app-env-backups.ts','lib/manual-backup-request.ts','lib/mariadb-recovery-backup.ts','lib/mariadb-config-hooks.ts','lib/auth-store.ts','lib/better-auth.ts','lib/helper-error.ts','lib/helper-json-output.ts','lib/sudo-policy-request.ts','lib/config-live.ts','lib/config-profiles.ts','lib/config-value-parser.ts','lib/database-config-profile.ts','lib/cron-basic-schedule.ts','lib/mariadb-settings-text.ts','lib/postgresql-settings-text.ts','lib/redis-settings-text.ts','lib/nginx-form-import.ts','lib/nginx-apply-request.ts','lib/nginx-validation.ts','lib/nginx-fields.ts','lib/nginx-code-import.ts','lib/nginx-server-presets.ts','lib/node-env-patch.ts','lib/cron-lock.ts','lib/redis-config-hooks.ts','lib/redis-apply-request.ts','lib/mariadb-service-scope.ts','lib/redis-topology.ts','lib/mariadb-topology.ts','lib/node-app-env-restore.ts','lib/node-app-env.ts','lib/node-app-logs.ts','lib/node-app-service-plan.ts','lib/node-app-service-request.ts','lib/node-app-unit.ts','lib/node-env-restore.ts','lib/node-env-workspace.ts','lib/site-form.ts','lib/site-status.ts','lib/redis-apply.ts','lib/redis-candidate-resources.ts','lib/redis-candidate-validation.ts','lib/redis-code-operation.ts','lib/redis-context-inspect.ts','lib/redis-sandbox-executables.ts','lib/redis-validation-plan.ts','lib/redis-validation-process.ts','lib/postgresql-cluster-status.ts','lib/postgresql-code-operation.ts','lib/postgresql-config-candidate.ts','lib/postgresql-config-graph.ts','lib/postgresql-config-validation.ts','lib/postgresql-graph-restore-review.ts','lib/postgresql-hba-candidate.ts','lib/postgresql-hba-graph.ts','lib/postgresql-hba-sandbox.ts','lib/postgresql-hba-service.ts','lib/postgresql-hba-source.ts','lib/postgresql-hba-validate.ts','lib/postgresql-original-config-validation.ts','lib/postgresql-restore-service-context.ts','lib/postgresql-reviewed-graph-restore.ts','lib/ai-analysis.ts','lib/ai-models.ts','lib/ai-provider.ts','lib/ai-settings.ts']){const diagnostics=diagnosticCandidates(await parse(await readFile(file,'utf8'),{filename:file,...(file.endsWith('.ts')?{syntax:'typescript'}:{})}));for(const key of diagnostics.literals){interactionDiagnosticKeys.add(key);if(!keys.has(key))keys.set(key,new Set<string>());addKey(key,file);}}
walkHelp(await parse(await readFile('lib/capabilities.ts','utf8'),{filename:'lib/capabilities.ts'}),'lib/capabilities.ts',interactionDiagnosticKeys);
walkHelp(await parse(await readFile('lib/privilege.ts','utf8'),{filename:'lib/privilege.ts'}),'lib/privilege.ts',helperReadinessKeys);
walkHelp(await parse(await readFile('lib/postgresql-hba.ts','utf8'),{filename:'lib/postgresql-hba.ts'}),'lib/postgresql-hba.ts',interactionDiagnosticKeys);
walkHelp(await parse(await readFile('lib/postgresql-hba-operation.ts','utf8'),{filename:'lib/postgresql-hba-operation.ts'}),'lib/postgresql-hba-operation.ts',interactionDiagnosticKeys);
walkHelp(await parse(await readFile('lib/admin-job-record.ts','utf8'),{filename:'lib/admin-job-record.ts'}),'lib/admin-job-record.ts',interactionDiagnosticKeys);
const missingEnglish=[...keys].filter(([key])=>/[가-힣]/.test(key)&&!Object.hasOwn(english,key)).map(([key,files])=>({key,files:[...files]}));
const invalid:{locale:string;key:string;reason:string}[]=[],coverage:Record<string,{translated:number;total:number;missing:number}>={};
const placeholders=(value:string)=>[...new Set([...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match=>match[1]))].sort().join(',');
for(const file of (await readdir('lib/locales')).filter(name=>/^[a-z]{2,3}\.json$/.test(name)).sort()){
 const decoded:unknown=JSON.parse(await readFile('lib/locales/'+file,'utf8'));if(!object(decoded))throw Error('Invalid language catalog: '+file);const catalog=decoded,locale=file.slice(0,-5);
 for(const [key,value] of Object.entries(catalog)){
  if(typeof value!=='string'||!value.trim()){invalid.push({locale,key,reason:'empty or non-string translation'});continue;}
  if(/[가-힣]/.test(value))invalid.push({locale,key,reason:'Korean text remains in a non-Korean translation'});
  const englishValue=english[key];if(typeof englishValue==='string'&&placeholders(value)!==placeholders(englishValue))invalid.push({locale,key,reason:'placeholder mismatch'});
 }
 const missing=Object.keys(english).filter(key=>!Object.hasOwn(catalog,key));
 coverage[locale]={translated:Object.keys(english).length-missing.length,total:Object.keys(english).length,missing:missing.length};
}
console.log(JSON.stringify({status:missingEnglish.length||invalid.length?'FAIL':'PASS',scope:'Literal UI/status/error messages, dynamic route/service-state/security-group data and capability gate guidance, and all Korean literals in nginx settings help, site runtime, PostgreSQL data context/backup and network/restart/general settings modules and static API/nginx syntax/node transfer/terminal state/security/helper diagnostic candidates and helper readiness literals; other dynamic messages and untranslated languages still require review',literalKeys:keys.size,nginxHelpKeys:helpKeys.size,nginxSiteRuntimeKeys:runtimeKeys.size,postgresqlDataRuntimeKeys:postgresqlDataKeys.size,settingsRuntimeKeys:settingsRuntimeKeys.size,apiDiagnosticKeys:apiDiagnosticKeys.size,interactionDiagnosticKeys:interactionDiagnosticKeys.size,helperReadinessKeys:helperReadinessKeys.size,statusLiteralKeys:statusKeys.size,errorLiteralKeys:errorKeys.size,dynamicCalls,dynamicStatusCalls,dynamicErrorCalls,missingEnglish,invalid,coverage},null,2));
if(missingEnglish.length||invalid.length)process.exitCode=1;

