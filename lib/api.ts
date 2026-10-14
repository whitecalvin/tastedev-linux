type OperationOutcome = Record<string,unknown> & {failed?: boolean; restored?: boolean; recovered?: boolean; changed?: boolean};
function apiError(value: unknown): {message: string; status: number | undefined} {
 const error=value!==null&&typeof value==='object'?value as Record<string,unknown>:{};
 return {message:typeof error.message==='string'?error.message:'설정 값을 확인하세요.',status:typeof error.status==='number'&&Number.isInteger(error.status)&&error.status>=400&&error.status<=599?error.status:undefined};
}
import {restartApp} from './app-restart.ts';
import {networkSettings,saveNetworkSettings} from './network-settings.ts';
import {systemSettings,saveSystemSettings} from './system-settings.ts';
import {listAiModels} from './ai-models.ts';
import {aiSettings,saveAiSettings} from './ai-settings.ts';
import {preparePostgresqlDataRequest} from './postgresql-data-context.ts';
import {prepareNginxBackupLookup} from './nginx-config-backups.ts';
import {prepareNginxSite,prepareNginxSiteRecovery} from './nginx-site-request.ts';
import {prepareDatabaseConfigBackup} from './database-config-backup.ts';
import {preparePostgresqlBackupLookup,preparePostgresqlConfigBackup} from './postgresql-backup-request.ts';
import {preparePostgresqlHistory} from './postgresql-completed-history.ts';
import {preparePostgresqlCodeRestore} from './postgresql-code-restore.ts';
import {preparePostgresqlCodeRecovery} from './postgresql-code-recovery.ts';
import {preparePostgresqlCode} from './postgresql-code-request.ts';
import {prepareMariaDBCode} from './mariadb-code-request.ts';
import {prepareRedisCode} from './redis-code-request.ts';
import {prepareMariaDBRecovery} from './mariadb-recovery.ts';
import {prepareNginxRecovery} from './nginx-recovery.ts';
import {prepareRedisRecovery} from './redis-recovery.ts';
import {preparePostgresqlHbaOperation} from './postgresql-hba-operation.ts';
import {preparePostgresqlHbaValidation} from './postgresql-hba-validate.ts';
import {configSource} from './config-source.ts';
import {terminalEventResponse} from './terminal-events.ts';
import {terminalCliCommands} from './terminal-cli.ts';
import {isAuthStorageError,authStorageMessage} from './auth-storage-error.ts';
import {prepareRedisRestore} from './redis-restore-request.ts';
import {prepareRedisApply} from './redis-apply-request.ts';
import {prepareNginxApply,prepareNginxRestore} from './nginx-apply-request.ts';
import {prepareSudoPolicyUpdate} from './sudo-policy-request.ts';
import {userInfo} from 'node:os';
import {sudoPolicyPlan} from './sudo-policy.ts';
import {helperActions} from './privilege.ts';
import {prepareNodeServiceRecoveryReview,prepareNodeServiceRecovery,prepareNodeServiceRestore,prepareNodeServiceUpdate,prepareNodeServiceInstall,prepareNodeServiceControl,prepareNodeServiceInspection} from './node-app-service-request.ts';
import {validateNginxDraft} from './nginx-validation.ts';
import {nodeAppEnvRestorePlan,restoreNodeAppEnv} from './node-app-env-restore.ts';
import {nodeAppEnvBackups} from './node-app-env-backups.ts';
import {nodeAppEnvSnapshot,updateNodeAppEnv} from './node-app-env.ts';
import {nodeAppLogs} from './node-app-logs.ts';
import {nodeAppServiceStatus} from './node-app-service-status.ts';
import {nodeAppServicePlan} from './node-app-service-plan.ts';
import {nodeAppFiles} from './node-app-files.ts';
import {nodeApps,saveNodeApp,removeNodeApp} from './node-apps.ts';
import {nodeEnvRestorePlan,restoreNodeEnv} from './node-env-restore.ts';
import {nodeEnvBackups} from './node-env-backups.ts';
import {nodeEnvSnapshot,updateNodeEnv} from './node-env-workspace.ts';
import {mariadbTopology} from './mariadb-topology.ts';
import {redisTopology} from './redis-topology.ts';
import {configOperationPlan} from './config-operation-plan.ts';
import {liveConfig,readLiveConfig} from './config-live.ts';
import {nginxTree} from './nginx-tree.ts';
import {cookieSession} from './auth.ts';
import { commandFor, getStatus, getJob, startInstall } from './packages.ts';
import { createFolder, listFiles, readCode, saveCode, terminalContext, terminalJob, subscribeTerminalJob, terminalInput, terminalResize, runCommand, stopCommand } from './workspace.ts';
import { nginxSites, saveSite, nginxConfig, nginxPlan, applySite, certificateCommand, startCertificate, operationJob, operationHistory, cronStatus, cronEntry, applyCron, deleteCron } from './server-tools.ts';
import { serviceStatus, permissions, controlService, readLogs, backups, backupCatalog, manualBackup, restorePlan, restoreBackup } from './operations.ts';
import {securitySettings,saveSecurity,assertFeature,auditEvent,auditPage} from './security.ts';
import {managedSites,certificates} from './site-status.ts';
import {aiStatus,validateAnalysis,analyzeLog} from './ai-analysis.ts';
import {configProfile,saveConfigDraft} from './config-profiles.ts';
import {runHelper} from './privilege.ts';
const outcomeAuditActions=new Set(['nginx-site-plan','nginx-site-apply','nginx-site-recover','redis-config-backup','mariadb-config-backup','postgresql-code-plan','postgresql-code-apply','postgresql-code-restore-plan','postgresql-code-restore','nginx-toggle','nginx-config-backup','nginx-check','nginx-config-apply','nginx-config-restore','service','restore','nginx-apply','cron-delete','cron-apply','install','certbot-issue','terminal']);
const reply = (data: unknown, status = 200): Response => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function authorized(request: Request): Promise<boolean>{return Boolean(await cookieSession(request));}
export async function handle(request: Request, action: string): Promise<Response> {
  try{if (!await authorized(request)) return reply({ error: '로그인이 필요하거나 세션이 만료되었습니다.' }, 401);}catch(error){if(isAuthStorageError(error))return reply({error:authStorageMessage,storageUnavailable:true},503);throw error;}
  try {
    if (request.method === 'GET') {
      if(action==='postgresql-restore-history'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,preparePostgresqlHistory({path:new URL(request.url).searchParams.get('path')})));}
      if(action==='mariadb-recovery-plan'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const query=new URL(request.url).searchParams;return reply(await runHelper(action,{root:query.get('root'),target:query.get('target')}));}
      if(action==='nginx-recovery-plan'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,{path:new URL(request.url).searchParams.get('path')}));}
      if(action==='redis-recovery-plan'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,{}));}
      if(action==='sudo-policy-settings'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper('sudo-policy-inspect',{}));}
      if(action==='sudo-policy-actions')return reply({actions:helperActions});
      if(action==='node-app-env-restore-plan'){const query=new URL(request.url).searchParams;return reply(await nodeAppEnvRestorePlan(query.get('id'),query.get('backupId')));}
      if(action==='node-app-env-backups')return reply(await nodeAppEnvBackups(new URL(request.url).searchParams.get('id')));
      if(action==='node-app-env')return reply(await nodeAppEnvSnapshot(new URL(request.url).searchParams.get('id')));
      if(action==='node-app-logs')return reply(await nodeAppLogs(new URL(request.url).searchParams.get('id')));
      if(action==='node-app-service-restore-plan'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const payload=await prepareNodeServiceInspection(new URL(request.url).searchParams.get('id')),result=await runHelper('node-service-restore-plan',{...payload,backupId:new URL(request.url).searchParams.get('backupId')});if((await nodeApps()).version!==payload.registryVersion)throw Object.assign(Error('서비스 설정을 다시 검토하세요.'),{status:409});return reply({...result,id:payload.profile.id,registryVersion:payload.registryVersion});}
      if(action==='node-app-service-backups'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const payload=await prepareNodeServiceInspection(new URL(request.url).searchParams.get('id')),result=await runHelper('node-service-backups',payload);if((await nodeApps()).version!==payload.registryVersion)throw Object.assign(Error('서비스 설정을 다시 검토하세요.'),{status:409});return reply({...result,id:payload.profile.id,registryVersion:payload.registryVersion});}
      if(action==='node-app-service-recovery-plan'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const payload=await prepareNodeServiceRecoveryReview(new URL(request.url).searchParams.get('id')),result=await runHelper('node-service-recovery-plan',payload);if((await nodeApps()).version!==payload.registryVersion)throw Object.assign(Error('서비스 설정을 다시 검토하세요.'),{status:409});return reply({...result,id:payload.profile.id,registryVersion:payload.registryVersion,files:payload.files,options:payload.options});}
      if(action==='node-app-service-settings'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const payload=await prepareNodeServiceInspection(new URL(request.url).searchParams.get('id')),result=await runHelper('node-service-inspect',payload);if((await nodeApps()).version!==payload.registryVersion)throw Object.assign(Error('서비스 설정을 다시 검토하세요.'),{status:409});return reply({...result,id:payload.profile.id,registryVersion:payload.registryVersion});}
      if(action==='node-app-service-status')return reply(await nodeAppServiceStatus(new URL(request.url).searchParams.get('id')));
      if(action==='node-app-service-plan'){const params=new URL(request.url).searchParams;return reply(await nodeAppServicePlan(params.get('id'),{...(params.has('restart')?{restart:params.get('restart')}:{}),...(params.has('restartSeconds')?{restartSeconds:params.get('restartSeconds')}: {}),...(params.has('stopSeconds')?{stopSeconds:params.get('stopSeconds')}: {})}));}
      if(action==='node-app-files')return reply(await nodeAppFiles(new URL(request.url).searchParams.get('id')));
      if(action==='node-apps')return reply(await nodeApps());
      if(action==='node-env-restore-plan')return reply(await nodeEnvRestorePlan(new URL(request.url).searchParams.get('id')));
      if(action==='node-env-backups')return reply(await nodeEnvBackups());
      if(action==='node-env')return reply(await nodeEnvSnapshot(new URL(request.url).searchParams.get('name')));
      if(action==='redis-topology')return reply(await redisTopology());
      if(['redis-restore-plan','postgresql-restore-plan','mariadb-restore-plan'].includes(action)){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(new Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,{id:new URL(request.url).searchParams.get('id'),...(action==='mariadb-restore-plan'?{root:new URL(request.url).searchParams.get('root')}: {})}));}
      if(['redis-backups','postgresql-backups','mariadb-backups'].includes(action)){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(new Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,action==='postgresql-backups'?preparePostgresqlBackupLookup(new URL(request.url).searchParams.get('path')):undefined));}
      if(action==='mariadb-service-scope'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(new Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,{root:new URL(request.url).searchParams.get('root')||'/etc/mysql/my.cnf'}));}
      if(action==='mariadb-topology')return reply(await mariadbTopology(new URL(request.url).searchParams.get('root')||'/etc/mysql/my.cnf'));
      if(action==='config-live')return reply(await liveConfig(new URL(request.url).searchParams.get('kind')));
      if(action==='config-source'){const params=new URL(request.url).searchParams;return reply(await configSource(params.get('kind'),params.get('path')));}
      if(action==='network-settings')return reply(networkSettings(new URL(request.url).port));
      if(action==='system-settings')return reply(systemSettings());
      if(action==='ai-settings')return reply(aiSettings());
      if(action==='ai-status')return reply(aiStatus());
      if(['postgresql-hba-recovery-status','postgresql-hba-backups','postgresql-hba-restore-draft'].includes(action)){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const params=new URL(request.url).searchParams;return reply(await runHelper(action,{path:params.get('path'),...(action==='postgresql-hba-restore-draft'?{id:params.get('id')}: {})}));}
      if(action==='nginx-config-backups'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});const params=new URL(request.url).searchParams;let lookup={};if(params.has('ids')){try{lookup={ids:JSON.parse(params.get('ids')!)};}catch{throw Object.assign(Error('백업 목록 요청을 확인하세요.'),{status:400});}}return reply(await runHelper('nginx-config-backups',prepareNginxBackupLookup(lookup)));}
      if(action==='redis-context'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper('redis-context-inspect',{}));}
      if(action==='nginx-site-recovery'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper(action,{}));}
      if(action==='nginx-context'){const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper('nginx-context-inspect',{}));}
      if(action==='nginx-tree') return reply(await nginxTree());
      if(action==='nginx-live') return reply(await managedSites());
      if(action==='certificates') return reply(await certificates());
      if(action==='security') return reply(await securitySettings());
      if(action==='audit') return reply(await auditPage(new URL(request.url).searchParams.get('cursor')));
      if(action==='operations'){const query=new URL(request.url).searchParams;const units=query.getAll('unit');if(units.length>1)throw Object.assign(Error('조회할 서비스는 하나만 선택하세요.'),{status:400});const services=await serviceStatus(units.length?{unit:units[0]}:undefined);return reply({services,permissions:permissions(),warnings:services.warnings||[]});}
      if(action==='logs') {const query=new URL(request.url).searchParams;return reply(await readLogs(query.get('source'),query.get('filter')||'',query.get('path')));}
      if(action==='backups') return reply(await backupCatalog());
      if(action==='restore') return reply(await restorePlan(new URL(request.url).searchParams.get('id'),new URL(request.url).searchParams.get('privileged')==='true'));
      if(action==='nginx') return reply({sites:await nginxSites()});
      if(action==='cron') return reply(await cronStatus());
      if(action==='admin-jobs')return reply(await operationHistory());
      if(action==='admin-job') return reply({job:await operationJob(new URL(request.url).searchParams.get('id'))});
      if (action === 'files') return reply(await listFiles());
      if (action === 'file') return reply(await readCode(new URL(request.url).searchParams.get('name')));
      if(action==='terminal-context'){const context=terminalContext();return reply({...context,commands:await terminalCliCommands(process.env.PATH||'',context.cwd)});}
      if(action==='terminal-events')return await terminalEventResponse(request,{readJob:terminalJob,subscribe:subscribeTerminalJob,authorize:()=>authorized(request)});
      if (action === 'terminal') return reply({job:terminalJob(new URL(request.url).searchParams.get('job'))});
      if (action === 'status') return reply(await getStatus());
      if (action === 'job') return reply({ job: await getJob() });
      return reply({ error: '페이지를 찾을 수 없습니다.' }, 404);
    }
    const origin = request.headers.get('origin');
    const url = new URL(request.url);
    const targetOrigin = url.protocol + '//' + (request.headers.get('host') || url.host);
    if (origin && origin !== targetOrigin) return reply({ error: '다른 사이트의 요청은 허용하지 않습니다.' }, 403);
    if (!['postgresql-data-context','postgresql-data-backups','postgresql-data-backup','postgresql-data-plan','postgresql-data-restore','nginx-site-plan','nginx-site-apply','nginx-site-recover','redis-config-backup','mariadb-config-backup','postgresql-config-backup','postgresql-history-backup','postgresql-code-restore-plan','postgresql-code-restore','postgresql-code-recovery-plan','postgresql-code-recover','postgresql-code-plan','postgresql-code-apply','mariadb-recover','nginx-recover','redis-recover','node-app-service-recover','postgresql-hba-recover','postgresql-hba-operation-plan','postgresql-hba-operation','postgresql-hba-validate','postgresql-hba-backup','nginx-config-backup','nginx-check','mariadb-code-plan','mariadb-code-apply','redis-code-plan','redis-code-apply','redis-config-apply','redis-config-restore','redis-config-validate','nginx-config-restore-plan','nginx-config-restore','nginx-config-apply','sudo-policy-update','sudo-policy-plan','node-app-service-restore','node-app-service-update','node-app-service-control','node-app-service-install','terminal-resize','nginx-validate','node-app-env-restore','node-app-env','node-app-remove','node-apps','node-env-restore','node-env','terminal-input','mariadb-restore','mariadb-apply','postgresql-restore','postgresql-apply','config-operation-plan','folder','app-restart','network-settings','system-settings','ai-settings','ai-models','ai-preview','ai-analyze','config-plan', 'config-save', 'plan', 'install', 'file', 'terminal', 'stop', 'nginx', 'nginx-plan', 'nginx-apply', 'certbot-plan', 'certbot-issue', 'cron-plan', 'cron-delete', 'cron-apply', 'service', 'backup', 'restore','security','nginx-toggle'].includes(action)) return reply({ error: '페이지를 찾을 수 없습니다.' }, 404);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'JSON 요청이 필요합니다.' }, 415);
    // Bound request size even when Content-Length is omitted or forged.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: '요청 본문이 필요합니다.' }, 400);
    const chunks: Buffer[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > (['postgresql-code-plan','postgresql-code-apply','mariadb-code-plan','mariadb-code-apply','redis-code-plan','redis-code-apply','postgresql-hba-operation-plan','postgresql-hba-operation','postgresql-hba-validate'].includes(action)?1600000:['folder','app-restart','network-settings','system-settings','ai-settings','ai-models','ai-preview','ai-analyze'].includes(action)?20000:['file','nginx-config-apply'].includes(action) ? 300000 : ['plan','install'].includes(action) ? 4096 : 8192)) { await reader.cancel(); return reply({ error: '요청 크기가 너무 큽니다.' }, 413); } chunks.push(Buffer.from(value)); }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString());
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return reply({error:'설정 값을 확인하세요.'},400);
    const data=parsed as Record<string,unknown>;
    if(action==='nginx-config-restore-plan'){if(data?.includeDiff===true)await assertFeature('nginxChanges',{sudo:true});const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});return reply(await runHelper('nginx-config-restore-plan',data));}
    if(action==='sudo-policy-plan')return reply(sudoPolicyPlan(data,userInfo()));
    if(action==='app-restart')return reply(await restartApp(data));
    if(action==='network-settings'){const policy=await securitySettings();if(policy.settings.readOnly)throw Object.assign(Error('조회 전용 모드에서는 접속 설정을 저장할 수 없습니다.'),{status:403});const result=await saveNetworkSettings(data);await auditEvent('network-settings','saved; external='+result.externalEnabled+'; '+result.host+':'+result.port,true);return reply(networkSettings(url.port));}
    if(action==='system-settings'){const policy=await securitySettings();if(policy.settings.readOnly)throw Object.assign(Error('조회 전용 모드에서는 시스템 설정을 저장할 수 없습니다.'),{status:403});const result=await saveSystemSettings(data);await auditEvent('system-settings','saved',true);return reply(result);}
    if(action==='ai-models')return reply(await listAiModels(data));
    if(action==='ai-settings'){const policy=await securitySettings();if(policy.settings.readOnly)throw Object.assign(Error('조회 전용 모드에서는 AI 설정을 저장할 수 없습니다.'),{status:403});const result=await saveAiSettings(data);await auditEvent('ai-settings','saved',true);return reply(result);}
    if(action==='ai-preview')return reply(validateAnalysis(data));
    if(action==='ai-analyze')return reply(await analyzeLog(data));
    if(action==='config-operation-plan')return reply(await configOperationPlan(data));
    if(action==='config-plan')return reply({text:configProfile(data.kind,data)});
    if(action==='security') return reply(await saveSecurity(data));
    const features: Record<string,[string,boolean]>={'nginx-site-plan':['nginxChanges',true],'nginx-site-apply':['nginxChanges',true],'nginx-site-recover':['nginxChanges',true],'redis-config-backup':['databaseChanges',true],'mariadb-config-backup':['databaseChanges',true],'postgresql-config-backup':['databaseChanges',true],'postgresql-history-backup':['databaseChanges',true],'postgresql-code-restore-plan':['databaseChanges',true],'postgresql-code-restore':['databaseChanges',true],'postgresql-code-recovery-plan':['databaseChanges',true],'postgresql-code-recover':['databaseChanges',true],'postgresql-code-plan':['databaseChanges',true],'postgresql-code-apply':['databaseChanges',true],'mariadb-recover':['databaseChanges',true],'nginx-recover':['nginxChanges',true],'redis-recover':['databaseChanges',true],'node-app-service-recover':['serviceChanges',true],'postgresql-hba-recover':['databaseChanges',true],'postgresql-hba-operation-plan':['databaseChanges',true],'postgresql-hba-operation':['databaseChanges',true],'postgresql-hba-validate':['databaseChanges',true],'postgresql-hba-backup':['databaseChanges',true],'nginx-config-backup':['nginxChanges',true],'nginx-check':['nginxChanges',true],'mariadb-code-plan':['databaseChanges',true],'mariadb-code-apply':['databaseChanges',true],'redis-code-plan':['databaseChanges',true],'redis-code-apply':['databaseChanges',true],'redis-config-apply':['databaseChanges',true],'redis-config-restore':['databaseChanges',true],'redis-config-validate':['databaseChanges',true],'nginx-config-restore':['nginxChanges',true],'nginx-config-apply':['nginxChanges',true],'sudo-policy-update':['sudoPolicyChanges',true],'node-app-service-restore':['serviceChanges',true],'node-app-service-update':['serviceChanges',true],'node-app-service-control':['serviceChanges',true],'node-app-service-install':['serviceChanges',true],'node-app-env-restore':['fileEditing',false],'node-app-env':['fileEditing',false],'node-app-remove':['fileEditing',false],'node-apps':['fileEditing',false],'node-env-restore':['fileEditing',false],'node-env':['fileEditing',false],'terminal-resize':['terminal',false],'terminal-input':['terminal',false],'mariadb-restore':['databaseChanges',true],'mariadb-apply':['databaseChanges',true],'postgresql-restore':['databaseChanges',true],'postgresql-apply':['databaseChanges',true],'config-save':['fileEditing',false],'folder':['fileEditing',false],'nginx-toggle':['nginxChanges',true],'service':['serviceChanges',true],'nginx-apply':['nginxChanges',true],'certbot-issue':['certificateChanges',true],'cron-delete':['cronChanges',false],'cron-apply':['cronChanges',false],'install':['packageInstall',true],'terminal':['terminal',false],'file':['fileEditing',false],'nginx':['fileEditing',false]};
    if(features[action]){const [key,sudo]=features[action];try{await assertFeature(key,{sudo});}catch(error){if(outcomeAuditActions.has(action))await auditEvent(action,'blocked');throw error;}await auditEvent(action,'requested');}
    if(action==='mariadb-recover'){try{const result=await runHelper(action,prepareMariaDBRecovery(data));await auditEvent(action,result.recovered?'recovered':'recovery-required');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='nginx-recover'){try{const result=await runHelper(action,prepareNginxRecovery(data));await auditEvent(action,result.recovered?'recovered':'recovery-required');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='redis-recover'){try{const result=await runHelper(action,prepareRedisRecovery(data));await auditEvent(action,result.recovered?'recovered':'recovery-required');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['redis-config-backup','mariadb-config-backup'].includes(action)){try{const result=await runHelper(action,prepareDatabaseConfigBackup(action.startsWith('redis')?'redis':'mariadb',data));await auditEvent(action,'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action.startsWith('postgresql-data-')){const operation=action.slice('postgresql-data-'.length);const policy=await securitySettings();if(!policy.settings.sudoWithoutPrompt)throw Object.assign(Error('sudo 비밀번호 입력 생략 옵션이 꺼져 있습니다.'),{status:403});if(['backup','restore'].includes(operation))await assertFeature('databaseChanges',{sudo:true});try{const result=await runHelper(action,preparePostgresqlDataRequest(operation,data));if(['backup','restore'].includes(operation))await auditEvent(action,result.failed?'failed':'completed');return reply(result);}catch(error){if(['backup','restore'].includes(operation))await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-config-backup'){try{const result=await runHelper(action,preparePostgresqlConfigBackup(data));await auditEvent(action,'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-history-backup'){try{const result=await runHelper(action,preparePostgresqlHistory(data,true));await auditEvent(action,result.created?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['postgresql-code-restore-plan','postgresql-code-restore'].includes(action)){try{const result=await runHelper(action,preparePostgresqlCodeRestore(data,action==='postgresql-code-restore'));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):action.endsWith('-plan')?'completed':result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['postgresql-code-recovery-plan','postgresql-code-recover'].includes(action)){try{const result=await runHelper(action,preparePostgresqlCodeRecovery(data,action==='postgresql-code-recover'));await auditEvent(action,action==='postgresql-code-recovery-plan'?'completed':result.preparationCancelled?'cancelled':result.recovered?'recovered':result.recoveryRequired===false?'unchanged':'recovery-required');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['postgresql-code-plan','postgresql-code-apply'].includes(action)){try{const result=await runHelper(action,preparePostgresqlCode(data,action==='postgresql-code-apply'));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):action==='postgresql-code-plan'?'completed':result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['mariadb-code-plan','mariadb-code-apply'].includes(action)){try{const result=await runHelper(action,prepareMariaDBCode(data,action==='mariadb-code-apply'));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):action==='mariadb-code-plan'?'completed':result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['redis-code-plan','redis-code-apply'].includes(action)){try{const result=await runHelper(action,prepareRedisCode(data,action==='redis-code-apply'));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):action==='redis-code-plan'?'completed':result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['redis-config-apply','redis-config-restore'].includes(action)){try{const prepared=action==='redis-config-apply'?prepareRedisApply(data):prepareRedisRestore(data),result=await runHelper(action,prepared);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-hba-recover'){try{if(!data||Array.isArray(data)||Object.keys(data).some(key=>!['path','confirm'].includes(key))||data.confirm!==true)throw Object.assign(Error('접속 규칙 복구 확인이 필요합니다.'),{status:400});const result=await runHelper(action,data);await auditEvent(action,result.recoveryRequired?'recovery-required':'recovered');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['postgresql-hba-operation-plan','postgresql-hba-operation'].includes(action)){try{const result=await runHelper(action,preparePostgresqlHbaOperation(data,action==='postgresql-hba-operation'));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-hba-validate'){try{const result=await runHelper(action,preparePostgresqlHbaValidation(data));await auditEvent(action,result.valid?'completed':'invalid');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='redis-config-validate'){try{const result=await runHelper('redis-config-validate',prepareRedisApply(data));await auditEvent(action,'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='nginx-config-restore'){try{const result=await runHelper('nginx-config-restore',prepareNginxRestore(data));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['nginx-site-plan','nginx-site-apply','nginx-site-recover'].includes(action)){try{const payload=action==='nginx-site-recover'?prepareNginxSiteRecovery(data):prepareNginxSite(data,action==='nginx-site-apply'),result=await runHelper(action,payload);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.recovered?'recovered':action==='nginx-site-plan'?'completed':result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='nginx-config-apply'){try{const result=await runHelper('nginx-config-apply',prepareNginxApply(data));await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='sudo-policy-update'){try{const payload=prepareSudoPolicyUpdate(data,userInfo()),result=await runHelper('sudo-policy-update',payload);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='restore'){try{await assertFeature(data.privileged===true?'nginxChanges':'cronChanges',{sudo:data.privileged===true});}catch(error){await auditEvent(action,'blocked');throw error;}await auditEvent(action,'requested');}
    async function finishOperation(work: () => Promise<OperationOutcome>): Promise<Response>{try{const result=await work();await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed===false?'unchanged':'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-restore'){try{const result=await runHelper('postgresql-restore',data);await auditEvent(action,result.failed?(result.restored?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='mariadb-restore'){try{const result=await runHelper('mariadb-restore',data);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='mariadb-apply'){try{if(data.confirm!==true)throw Object.assign(new Error('MariaDB 재시작 영향 확인이 필요합니다.'),{status:400});await configOperationPlan({...data,kind:'mariadb'});const result=await runHelper('mariadb-apply',{root:data.root,target:data.path,version:data.graphVersion,changes:data.changes,confirm:true});await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-apply'){try{if(data.confirm!==true)throw Object.assign(new Error('클러스터 재시작 영향 확인이 필요합니다.'),{status:400});await configOperationPlan({...data,kind:'postgresql'});const result=await runHelper('postgresql-apply',data);await auditEvent(action,result.failed?(result.restored?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='postgresql-hba-backup'){try{const result=await runHelper(action,data);await auditEvent(action,'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(['nginx-toggle','nginx-config-backup','nginx-check'].includes(action)){
      try{
        if(action==='nginx-check'&&(!data||Array.isArray(data)||Object.keys(data).length))throw Object.assign(Error('검수 요청을 확인하세요.'),{status:400});
        if(action==='nginx-toggle'&&(!data||Array.isArray(data)||typeof data.domain!=='string'||typeof data.enabled!=='boolean'||data.confirm!==true||typeof data.version!=='string'||!/^[a-f0-9]{64}$/.test(data.version)||Object.keys(data).some(key=>!['domain','enabled','confirm','version'].includes(key))))throw Object.assign(Error('설정 버전과 활성화 변경 요청을 확인하세요.'),{status:400});
        const result=await runHelper(action,action==='nginx-check'?{}:data);
        await auditEvent(action,action==='nginx-check'&&result.valid===false?'invalid':action==='nginx-toggle'&&result.changed===false?'unchanged':'completed');
        return reply(result);
      }catch(error){await auditEvent(action,'failed');throw error;}
    }
    if(action==='service') return await finishOperation(()=>controlService(data));
    if(action==='backup') return reply({backup:await manualBackup(data)});
    if(action==='restore') return await finishOperation(()=>restoreBackup(data));
    if(action==='nginx-validate')return reply(await validateNginxDraft(data));
    if(action==='nginx-plan') return reply(await nginxPlan(data));
    if(action==='nginx') return reply(await saveSite(data));
    if(action==='nginx-apply') return await finishOperation(()=>applySite(data));
    if(action==='certbot-plan') return reply({command:certificateCommand(data)});
    if(action==='certbot-issue'){try{return reply({job:await startCertificate(data)},202);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='cron-plan') return reply({entry:cronEntry(data)});
    if(action==='cron-delete') return await finishOperation(()=>deleteCron(data));
    if(action==='cron-apply') return await finishOperation(()=>applyCron(data));
    if(action==='node-app-service-recover'){try{const payload=await prepareNodeServiceRecovery(data),result=await runHelper('node-service-recover',payload);await auditEvent(action,result.recoveryRequired?'recovery-required':'recovered');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='node-app-service-restore'){try{const payload=await prepareNodeServiceRestore(data),result=await runHelper('node-service-restore',payload);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='node-app-service-update'){try{const payload=await prepareNodeServiceUpdate(data),result=await runHelper('node-service-update',payload);await auditEvent(action,result.failed?(result.restored&&result.recovered?'rolled-back':'recovery-required'):result.changed?'completed':'unchanged');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='node-app-service-control'){try{const payload=await prepareNodeServiceControl(data),result=await runHelper('node-service-control',payload);await auditEvent(action,'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='node-app-service-install'){try{const payload=await prepareNodeServiceInstall(data),result=await runHelper('node-service-install',payload);await auditEvent(action,result.failed?(result.removed&&result.reloaded?'rolled-back':'recovery-required'):'completed');return reply(result);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='node-app-env-restore')return reply(await restoreNodeAppEnv(data));
    if(action==='node-app-env')return reply(await updateNodeAppEnv(data));
    if(action==='node-apps')return reply(await saveNodeApp(data));
    if(action==='node-app-remove')return reply(await removeNodeApp(data));
    if(action==='node-env-restore')return reply(await restoreNodeEnv(data));
    if(action==='node-env')return reply(await updateNodeEnv(data));
    if(action==='config-save')return reply(await saveConfigDraft(data.kind,data));
    if(action==='folder')return reply(await createFolder(data?.name));
    if(action==='file') return reply(await saveCode(data?.name,data?.text,data?.version??null));
    if(action==='terminal-resize')return reply(await terminalResize(data?.id,data?.cols,data?.rows));
    if(action==='terminal-input')return reply(await terminalInput(data?.id,data?.text,data?.end??false));
    if(action==='terminal'){try{return reply({job:await runCommand(data?.command,data?.pty===undefined?false:data.pty,data?.timeoutSeconds,data?.sessionMode??'single')},202);}catch(error){await auditEvent(action,'failed');throw error;}}
    if(action==='stop') return reply(stopCommand(data?.id));
    if (action === 'plan') return reply({command:commandFor(data?.packages)});
    try{commandFor(data?.packages);if(data.confirm!==true)throw Object.assign(Error('설치 영향 확인이 필요합니다.'),{status:400});return reply({job:await startInstall(data.packages)},202);}catch(error){await auditEvent(action,'failed');throw error;}
  } catch (error) {const failure=apiError(error);return reply({error:failure.status?failure.message:'요청 처리 실패: '+failure.message},failure.status||400);}
}
