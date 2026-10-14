import type {PackageConfigApi} from './package-config-types';
import type {FileApi} from './config-code-editor';
import type {SecurityPolicy,DatabaseOperationResult,AiApi} from './console-types';
import type {NodeEnvironmentValues} from '../lib/node-env.ts';
export type {NodeEnvironmentValues} from '../lib/node-env.ts';
export type NodeServiceOperation = 'start' | 'stop' | 'restart' | 'enable' | 'disable';
import type {NodeServiceOptions} from '../lib/node-app-unit.ts';
export type {NodeServiceOptions} from '../lib/node-app-unit.ts';
export type NodeServicePlan = {id: string; unit: string; registryVersion: string; files: {name: string; version: string}[]; serviceOptions: NodeServiceOptions; runtime?: {status: 'ready' | 'missing' | 'unsupported' | 'unreadable'; version?: string; executable?: string; envFileSupported?: boolean}};
export type NodeServiceResult = {changed: boolean; unit: string; operation: NodeServiceOperation};
type NodeControlBase={id:string; registryVersion:string; confirm:true};
export type NodeControlRequest=NodeControlBase & ({operation:'stop' | 'disable'; files?:NodeServicePlan['files']; options?:NodeServiceOptions} | {operation:'start' | 'restart' | 'enable'; files:NodeServicePlan['files']; options:NodeServiceOptions});
export interface NodeServiceApi {(action:'node-app-service-control',body:NodeControlRequest):Promise<NodeServiceResult>;}
type NodeServiceCommonProps={api:NodeServiceApi; connected:boolean; security:SecurityPolicy | null; disabled?:boolean; onBusy?:(busy:boolean)=>void; onCompleted?:(result:NodeServiceResult)=>void | Promise<void>};
export type NodeServiceProps=NodeServiceCommonProps & ({stopOnly?:false; plan:NodeServicePlan | null} | {stopOnly:true; plan:NodeServicePlan | NodeBasicServicePlan | null});
export type NodeEnvironmentBackup = {id: string; name: string; kind: 'nodejs'; createdAt: string; version: string; bytes: number};
export type NodeEnvironmentBackups = {backups: NodeEnvironmentBackup[]; warnings: number; truncated: boolean};
export type NodeEnvironmentRestorePlan = {id: string; name: string; version: string; backupVersion: string; createdAt: string; changed: boolean; fields: {key: string; label: string; before: string | number | null; after: string | number | null}[]; notice: string};
export type NodeEnvironmentSaved = {saved: true; failed?: false; name: string; version: string; values: NodeEnvironmentValues; backupId?: string};
export interface NodeEnvironmentApi {
 (action: 'node-env-backups'): Promise<NodeEnvironmentBackups>;
 (action: `node-env-restore-plan?id=${string}`): Promise<NodeEnvironmentRestorePlan>;
 (action: 'node-env-restore', body: Pick<NodeEnvironmentRestorePlan,'id' | 'name' | 'version' | 'backupVersion'> & {confirm: true}): Promise<NodeEnvironmentSaved>;
}

export type NodeEnvironmentSnapshot = {name: string; version: string; values: NodeEnvironmentValues; skipped?: number; backupId?: string};
export interface NodeWorkspaceApi extends NodeEnvironmentApi {
 (action: `node-env?name=${string}`): Promise<NodeEnvironmentSnapshot>;
 (action: 'node-env', body: {name: string; version: string; changes: NodeEnvironmentValues; confirm: true}): Promise<NodeEnvironmentSaved>;
}
export type NodeAppEnvironmentSnapshot = NodeEnvironmentSnapshot & {id: string; directory: string; registryVersion: string};
export type NodeAppEnvironmentRestorePlan = NodeEnvironmentRestorePlan & {backupId: string; registryVersion: string};
export interface NodeAppEnvironmentApi {
 (action: `node-app-env?id=${string}`): Promise<NodeAppEnvironmentSnapshot>;
 (action: 'node-app-env', body: {id: string; version: string; registryVersion: string; changes: NodeEnvironmentValues; confirm: true}): Promise<NodeAppEnvironmentSnapshot>;
 (action: `node-app-env-backups?id=${string}`): Promise<NodeEnvironmentBackups>;
 (action: `node-app-env-restore-plan?id=${string}&backupId=${string}`): Promise<NodeAppEnvironmentRestorePlan>;
 (action: 'node-app-env-restore', body: NodeAppEnvironmentRestorePlan & {confirm: true}): Promise<NodeAppEnvironmentSnapshot>;
}
export type NodeEnvironmentField = [key: keyof NodeEnvironmentValues,label: string,type: 'select',fallback: string,options: string[]] | [key: keyof NodeEnvironmentValues,label: string,type: 'number',fallback: number];

export type NodeServiceIdentity = {id: string; unit: string; registryVersion: string};
export type NodeBasicServicePlan = NodeServiceIdentity & {files?:never; serviceOptions?:never; runtime?:never; text?:never; notice?:never};
export type NodeServiceSettings = NodeServiceIdentity & ({registered: false} | {registered: true; unitVersion: string; serviceOptions: NodeServiceOptions});
export type NodeServiceBackupCatalog = Pick<NodeServiceIdentity,'id' | 'registryVersion'> & {backups: {id: string; createdAt: string; version: string; serviceOptions: NodeServiceOptions}[]; warnings: number; truncated: boolean};
export type NodeServiceRestoreReview = NodeServiceIdentity & {unitVersion: string; backupId: string; backupVersion: string; createdAt: string; currentOptions: NodeServiceOptions; serviceOptions: NodeServiceOptions};
export type NodeServiceMutationResult = DatabaseOperationResult & {unit?: string; restarted?: boolean};
export type NodeServiceRecoveryReview = NodeServiceIdentity & {files: NodeServicePlan['files']; options: NodeServiceOptions} & ({recoveryRequired: false} | {recoveryRequired: true; unitVersion: string; backupId: string; backupVersion: string; currentOptions: NodeServiceOptions; serviceOptions: NodeServiceOptions; reviewVersion: string; restarted: false});
type NodeServiceWrite = {id: string; registryVersion: string; files: NodeServicePlan['files']; options: NodeServiceOptions; confirm: true};
export interface NodeServiceManagementApi {
 (action: `node-app-service-settings?id=${string}`): Promise<NodeServiceSettings>;
 (action: 'node-app-service-update', body: NodeServiceWrite & {unitVersion: string}): Promise<NodeServiceMutationResult>;
 (action: `node-app-service-backups?id=${string}`): Promise<NodeServiceBackupCatalog>;
 (action: `node-app-service-restore-plan?id=${string}&backupId=${string}`): Promise<NodeServiceRestoreReview>;
 (action: 'node-app-service-restore', body: NodeServiceWrite & Pick<NodeServiceRestoreReview,'unitVersion' | 'backupId' | 'backupVersion'>): Promise<NodeServiceMutationResult>;
 (action: `node-app-service-recovery-plan?id=${string}`): Promise<NodeServiceRecoveryReview>;
 (action: 'node-app-service-recover', body: NodeServiceWrite & {reviewVersion: string}): Promise<NodeServiceMutationResult>;
}
export type NodeServiceManagementProps = {api: NodeServiceManagementApi; connected: boolean; security: SecurityPolicy | null; plan: NodeServicePlan | NodeBasicServicePlan | null; disabled?: boolean; onBusy?: (busy: boolean) => void; onRecovered?: (result: NodeServiceMutationResult) => void | Promise<void>; recoveryVersion?: number};
export type NodeServiceManagementScope = {key: string; api: NodeServiceManagementApi};
export type NodeRegisteredService = Extract<NodeServiceSettings,{registered:true}>;
export type NodeRecoverableService = Extract<NodeServiceRecoveryReview,{recoveryRequired:true}>;

import type {NodeAppProfile} from '../lib/node-app-profile.ts';
export type {NodeAppProfile} from '../lib/node-app-profile.ts';
export type NodeAppRegistry = {apps: NodeAppProfile[]; version: string; error?: string; workspace?: {root: string; files: string[]; error?: string}};
export type WorkspaceFileRecord = {name: string; text: string; version: string};
export type PackageProfile = {kind: string; serial?: number};
export type ToolView = 'settings' | 'code';
export type PackageDraftCodeRecord = import('./config-code-editor').ConfigCodeRecord & {visible?: boolean; guiValues?: Record<string,string | number | boolean>; lastValues?: Record<string,string | number | boolean>};
export interface NodeIdeApi extends FileApi,NodeAppsApi,PackageConfigApi {
 (action: 'node-apps'): Promise<NodeAppRegistry>;
 (action: 'files'): Promise<{root: string; files: string[]}>;
 (action: `file?name=${string}`): Promise<WorkspaceFileRecord>;
}

export type NodeAppEditableProfile = Omit<NodeAppProfile,'unit'>;
export type NodeAppFiles = {id:string; registryVersion:string; directory:string; directoryStatus:string; ready:boolean; notice:string; files: {name:string; status:string; bytes?:number; version?:string; mode?:string; values?:NodeEnvironmentValues; skipped?:number}[]};
export type NodeAppStatus = Pick<NodeServiceIdentity,'id' | 'unit' | 'registryVersion'> & ({available:false; notice:string} | {available:true; LoadState:string; ActiveState:string; SubState:string; UnitFileState:string});
export type NodeReviewedServicePlan = NodeServicePlan & {runtime:NonNullable<NodeServicePlan['runtime']> & {executable:string}; text:string; notice:string};
export type NodeServiceInstallResult = {installed?:boolean; manualRecovery?:boolean};
export interface NodeAppsApi extends NodeServiceApi,NodeServiceManagementApi,NodeAppEnvironmentApi,AiApi {
 (action:'node-apps',body?:{version:string; profile:NodeAppEditableProfile}):Promise<NodeAppRegistry>;
 (action:'node-app-remove',body:{id:string; version:string; confirm:true}):Promise<NodeAppRegistry>;
 (action:`node-app-files?id=${string}`):Promise<NodeAppFiles>;
 (action:`node-app-service-status?id=${string}`):Promise<NodeAppStatus>;
 (action:`node-app-service-plan?id=${string}`):Promise<NodeReviewedServicePlan>;
 (action:'node-app-service-install',body:{id:string; registryVersion:string; files:NodeServicePlan['files']; options:NodeServiceOptions; confirm:true}):Promise<NodeServiceInstallResult>;
 (action:`node-app-logs?id=${string}`):Promise<{id:string; unit:string; at:string; notice:string; text:string}>;
}

export type NodeIdeData=Omit<NodeAppRegistry,'version'> & {version?:string};
