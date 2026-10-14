import type {SecurityKey,SecuritySettings} from '../lib/security.ts';
import type {AuditEvent} from '../lib/audit-log-page.ts';
export type {SecurityKey,SecuritySettings} from '../lib/security.ts';
export type {AuditEvent} from '../lib/audit-log-page.ts';
import type {InstallJob} from './console-workspace-types';
import type {NodeAppsApi,NodeAppRegistry} from './node-types';
import type {TerminalSession, TerminalSessionTab} from '../lib/terminal-session-state.ts';
export type TerminalRecord = TerminalSession;
export type TerminalTab = TerminalSessionTab;
export type RunningTerminalTab = TerminalTab & {job: TerminalRecord};
export type TerminalReport = TerminalRecord & {pollAction?: string | null};
export type TerminalContext = {sessions: TerminalRecord[]; username?: string; cwd?: string; shell?: string; commands?: Record<string, {available: boolean}>};
export type AiStatus = {enabled: boolean; configured: boolean; provider: string; model: string; endpoint: string; version: string};
export type AiAnalysis = {model: string; analysis: string; incomplete?: boolean};
type AiReplies = {'ai-status': AiStatus; 'ai-preview': {text: string}; 'ai-analyze': AiAnalysis};
export interface AiApi {<K extends keyof AiReplies>(action: K, body?: Record<string, unknown>): Promise<AiReplies[K]>;}
export interface TerminalApi extends AiApi {
 (action: 'terminal-context'): Promise<TerminalContext>;
 (action: 'terminal' | 'stop' | `terminal?job=${string}`, body?: Record<string, unknown>): Promise<{job: TerminalRecord}>;
 (action: string, body?: Record<string, unknown>): Promise<unknown>;
}
export type {TerminalAppearance} from '../lib/terminal-appearance.ts';
export function errorMessage(error: unknown, fallback = '서버 요청에 실패했습니다.'): string {return error instanceof Error ? error.message : fallback;}
export function errorStatus(error: unknown): number | undefined {return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : undefined;}



export type SecurityPolicy = {settings: SecuritySettings; version: string; available: Partial<Record<SecurityKey, boolean>>; requirements: Partial<Record<SecurityKey, string>>; privilege?: {ready: boolean; reason: string; path: string}};

export type AuditPage = {events: AuditEvent[]; cursor?: string | null; nextCursor?: string | null; skipped?: boolean};
export interface AuditApi {(action: 'audit' | `audit?cursor=${string}`): Promise<AuditPage>;}
export type SudoPlan = {username: string; uid: number; passwordless: boolean; actions: string[]; text: string; version: string; filename: string};
export type SudoCurrent = {registered: false} | {registered: true; passwordless: boolean; actions: string[]; version: string};
type SudoReplies = {'sudo-policy-actions': {actions: string[]}; 'sudo-policy-plan': SudoPlan; 'sudo-policy-settings': SudoCurrent; 'sudo-policy-update': {failed?: boolean; restored?: boolean; recovered?: boolean; passwordless?: boolean}};
export interface SudoApi {<K extends keyof SudoReplies>(action: K, body?: Record<string, unknown>): Promise<SudoReplies[K]>;}
export interface SecurityApi extends AuditApi, SudoApi {(action: 'security', body?: {settings: SecuritySettings; version: string | null}): Promise<SecurityPolicy>;}

export type ServiceRecord = {unit: string; ActiveState?: string; SubState?: string; UnitFileState?: string; LoadState?: string; error?: string; configPath?: string; nodeAppId?: string; nodeRegistry?: NodeAppRegistry};
export type OperationsData = {services: ServiceRecord[]; permissions: Record<string, boolean>; warnings?: string[]; logs?: string};
export type ServerLogs = {text: string; at?: string; warning?: string; logLines?: number; logRefreshSeconds?: number};
export type BackupRecord = {id: string; kind: string; createdAt: string; target: string; sha256: string; privileged?: boolean};
export type RestoreReview = {current: string; record: BackupRecord & {text: string}; version: string};
export interface OperationsApi extends NodeAppsApi, AiApi, NginxApi, PostgreSQLOperationApi, MariaDBApi, RedisApi {
 (action: 'operations' | 'service', body?: Record<string, unknown>): Promise<OperationsData>;
 (action: `logs?${string}`): Promise<ServerLogs>;
 (action: 'backups'): Promise<{backups: BackupRecord[]; warnings?: string[]}>;
 (action: `restore?${string}`): Promise<RestoreReview>;
 (action: 'backup' | 'restore', body?: Record<string, unknown>): Promise<unknown>;
}

export type ProcessContext = {pid: number; start: string; main?: string; prefix?: string; startupMainVerified?: boolean; locale?: Record<string,string>};
export type ConfigService = ({ready: true} & ProcessContext) | {ready: false; reason: string; pid?: never; start?: never; main?: never; prefix?: never; startupMainVerified?: never; locale?: never};
export type ConfigContext = {graph: {complete: boolean; version: string; files: {path: string; resolved?: string; version: string}[]; warnings: {path: string; reason: string}[]}; service: ConfigService; binary?: {ready: true} | {ready: false; reason: string}};
export type NginxFile = {path: string; name: string; source: string; error?: string | null; readOnly?: boolean};
export type NginxBackup = {id: string; target: string; createdAt: string};
export type NginxBackupCatalog = {backups: NginxBackup[]; warnings?: number; truncated?: boolean};
export type NginxRestorePlan = {path: string; backupId: string; version: string; backupVersion: string; graphVersion: string; includeComplete: boolean; changed: boolean; currentChangedLines: number; restoredChangedLines: number; difference?: {before: string[]; after: string[]}};
export type NginxOperationResult = {failed?: boolean; restored?: boolean; recovered?: boolean; journalCleanupVerified?: boolean};
export type NginxRecoveryReview = {recoveryRequired: false; path: string; service?: {locale?: Record<string,string>}} | {recoveryRequired: true; path: string; backupId: string; reviewVersion: string; service: ProcessContext; currentFiles: {path: string; version: string}[]; originalFiles: {path: string; version: string}[]};
export interface NginxApi {
 (action: 'nginx-context'): Promise<NginxSiteContext>;
 (action: 'nginx-context' | 'redis-context'): Promise<ConfigContext>;
 (action: 'nginx-site-plan', body: Record<string,unknown>): Promise<NginxSitePlan>;
 (action: 'nginx-site-recover' | 'nginx-site-apply', body: Record<string,unknown>): Promise<NginxOperationResult>;
 (action: 'nginx-config-backups' | `nginx-config-backups?${string}`): Promise<NginxBackupCatalog>;
 (action: 'nginx-config-restore-plan', body: Record<string,unknown>): Promise<NginxRestorePlan>;
 (action: 'nginx-config-apply' | 'nginx-config-restore' | 'nginx-recover', body: Record<string,unknown>): Promise<NginxOperationResult>;
 (action: `nginx-recovery-plan?${string}`): Promise<NginxRecoveryReview>;
 (action: 'nginx-check', body: Record<string,unknown>): Promise<{logs: string}>;
 (action: 'nginx-config-backup', body: Record<string,unknown>): Promise<{backup: {id: string}}>;
 (action: 'operations?unit=nginx.service' | 'service', body?: Record<string,unknown>): Promise<OperationsData>;
}

export type SiteInventory = {version?: string; available?: {entries: {path: string; kind: string; links?: {path: string}[]}[]}; enabled?: {entries: {path: string; status?: string; target?: string; included?: boolean}[]}};
export type SiteRecovery = {ready: boolean; recoveryRequired: boolean; path?: string; link?: string};
export type NginxSiteContext = ConfigContext & {sites: SiteInventory; siteRecovery: SiteRecovery};
export type NginxSitePlan = {changed: boolean; sitesVersion: string; graphVersion: string};
export type CertificateHistoryRow = {id: string; status: string; startedAt: string; finishedAt?: string};
export type CertificateHistoryJob = CertificateHistoryRow & {command: string[]; logs: string[]; notice?: string};
export interface CertificateApi extends NginxApi {
 (action: 'admin-jobs'): Promise<{jobs: CertificateHistoryRow[]; warnings?: number; truncated?: boolean}>;
 (action: `admin-job?${string}`): Promise<{job: CertificateHistoryJob}>;
}
export type PostgreSQLHistoryRecord = {id: string; path: string; version: string; phase: 'committed' | 'rolled-back'; createdAt: string; fileCount: number; backupAvailable: boolean};
export type PostgreSQLHistoryCatalog = {path: string; records: PostgreSQLHistoryRecord[]; warnings: number; truncated?: boolean};
export interface PostgreSQLHistoryApi {
 (action: `postgresql-restore-history?${string}`): Promise<PostgreSQLHistoryCatalog>;
 (action: 'postgresql-history-backup', body: Record<string,unknown>): Promise<{path: string; id: string}>;
}

export type PostgreSQLCodeInput = {path: string; text: string; version: string};
export type PostgreSQLOperationPlan = {changed: boolean; graphVersion: string; candidateGraphVersion: string; serviceVersion: string; reviewVersion: string};
export type DatabaseOperationResult = {changed?: boolean; version?: string; failed?: boolean; restored?: boolean; recovered?: boolean; backupId?: string; historyId?: string; journalCleanupVerified?: boolean; preparationCancelled?: boolean; recoveryRequired?: boolean; codeRecovery?: boolean; reason?: string; validationMode?: string; serviceScope?: {main: string; notice?: string}};
export type PostgreSQLRecoveryReview = {path: string; recoveryRequired: false} | {path: string; recoveryRequired: true; reviewVersion: string; backupId?: string; kind?: string; phase?: string; serviceRestartRequired?: boolean; service: {unit: string; activeState: string}; files?: {path: string}[]};
export type PostgreSQLRestoreMetadata = {id: string; target: string; version: string; backupVersion: string; notice?: string; changed: boolean; codeRestoreAvailable?: boolean; fields?: {key: string; before?: string | null; after?: string | null}[]; files?: {path: string; action: string}[]};
export type PostgreSQLRestoreCodePlan = PostgreSQLOperationPlan & {id: string; path: string; version: string; backupVersion: string; backupIdentity: string; files?: {path: string; action: string}[]};
export type PostgreSQLRestoreReview = PostgreSQLRestoreMetadata & Partial<PostgreSQLRestoreCodePlan> & {code: boolean};
export type PostgreSQLHbaInput = {path: string; version: string; text?: string; backupId?: string};
export type PostgreSQLHbaPlan = {changed: boolean; reviewVersion: string; service: {unit: string; port: number}; difference: {before: string[]; after: string[]}};
export type PostgreSQLHbaRecovery = {recoveryRequired: boolean; backupId?: string};
export interface PostgreSQLOperationApi extends PostgreSQLHistoryApi, PostgreSQLDataApi {
 (action: 'config-live?kind=postgresql'): Promise<{configs: {path: string}[]}>;
 (action: 'postgresql-code-plan', body: Record<string,unknown>): Promise<PostgreSQLOperationPlan>;
 (action: 'postgresql-code-recovery-plan', body: Record<string,unknown>): Promise<PostgreSQLRecoveryReview>;
 (action: 'postgresql-code-apply' | 'postgresql-code-recover' | 'postgresql-code-restore' | 'postgresql-restore', body: Record<string,unknown>): Promise<PostgreSQLOperationResult>;
 (action: `postgresql-restore-plan?${string}`): Promise<PostgreSQLRestoreMetadata>;
 (action: 'postgresql-code-restore-plan', body: Record<string,unknown>): Promise<PostgreSQLRestoreCodePlan>;
 (action: `postgresql-hba-recovery-status?${string}`): Promise<PostgreSQLHbaRecovery>;
 (action: 'postgresql-hba-operation-plan', body: Record<string,unknown>): Promise<PostgreSQLHbaPlan>;
 (action: 'postgresql-hba-recover' | 'postgresql-hba-operation', body: Record<string,unknown>): Promise<PostgreSQLOperationResult>;
}

export type PostgreSQLDataReview = {reviewVersion: string; databases: {name: string}[]};
export type PostgreSQLDataBackup = {id: string; database: string; createdAt: string; bytes: number};
export type PostgreSQLDataPlan = {id: string; database: string; sha256: string; bytes: number};
export type PostgreSQLDataResult = ({failed?: false} | {failed: true; message: string}) & {undoBackupId?: string; backup?: {id: string}};
export interface PostgreSQLDataApi {
 (action: 'postgresql-data-context', body: Record<string,unknown>): Promise<PostgreSQLDataReview>;
 (action: 'postgresql-data-backups', body: Record<string,unknown>): Promise<{backups: PostgreSQLDataBackup[]; warnings?: number}>;
 (action: 'postgresql-data-plan', body: Record<string,unknown>): Promise<PostgreSQLDataPlan>;
 (action: 'postgresql-data-backup' | 'postgresql-data-restore', body: Record<string,unknown>): Promise<PostgreSQLDataResult>;
}

export type PostgreSQLOperationResult = DatabaseOperationResult;
export type DatabaseCodePlan = {changed: boolean; graphVersion: string; candidateGraphVersion: string; reviewVersion: string; resourceReview?: RedisResourceInventory};
export type MariaDBCodeInput = {root: string; path: string; text: string; version: string};
export type RedisCodeInput = {path: string; text: string; version: string};
export type RedisResourceInventory = {scope?: string; path?: string; resources: {line: number; directive: string; category: string}[]; truncated: boolean; totalResources: number; unsupportedSyntax: number};
export type MariaDBRecoveryReview = {recoveryRequired: false; root: string; target: string} | {recoveryRequired: true; root: string; target: string; reviewVersion: string; backupId: string; currentFiles: {path: string; version: string}[]; originalFiles: {path: string; version: string}[]; service: {pid: number; main?: string; notice?: string}};
export type RedisRecoveryReview = {recoveryRequired: false; path: string} | {recoveryRequired: true; path: string; reviewVersion: string; backupId: string; currentFiles: {path: string; version: string}[]; originalFiles: {path: string; version: string}[]; service: {pid: number; service: string}};
export interface MariaDBApi {
 (action: 'mariadb-backups'): Promise<ConfigBackupCatalog>;
 (action: `mariadb-restore-plan?${string}`): Promise<MariaDBRestorePlan>;
 (action: 'mariadb-apply' | 'mariadb-restore', body: Record<string,unknown>): Promise<DatabaseOperationResult>;
 (action: `mariadb-topology?${string}`): Promise<ConfigTopology>;
 (action: `mariadb-service-scope?${string}`): Promise<{main: string; notice?: string}>;
 (action: 'mariadb-code-plan', body: Record<string,unknown>): Promise<DatabaseCodePlan>;
 (action: 'mariadb-code-apply' | 'mariadb-recover', body: Record<string,unknown>): Promise<DatabaseOperationResult>;
 (action: `mariadb-recovery-plan?${string}`): Promise<MariaDBRecoveryReview>;
}
export interface RedisApi {
 (action: 'redis-backups'): Promise<ConfigBackupCatalog>;
 (action: `redis-restore-plan?${string}`): Promise<RedisRestoreReview>;
 (action: 'redis-config-restore' | 'redis-config-apply', body: Record<string,unknown>): Promise<DatabaseOperationResult>;
 (action: 'redis-config-validate', body: Record<string,unknown>): Promise<{valid: boolean}>;
 (action: 'redis-topology'): Promise<RedisConfigTopology>;
 (action: 'redis-code-plan', body: Record<string,unknown>): Promise<DatabaseCodePlan>;
 (action: 'redis-code-apply' | 'redis-recover', body: Record<string,unknown>): Promise<DatabaseOperationResult>;
 (action: 'redis-recovery-plan'): Promise<RedisRecoveryReview>;
}

export type SettingDelta = {key: string; before: string | number | boolean | null; after: string | number | boolean | null};
export type ConfigBackupCatalog = {backups: {id: string; target: string; createdAt: string; bytes: number}[]; warnings: number; truncated?: boolean};
export type MariaDBApplyPlan = {root: string; path: string; version: string; graphVersion: string; fields: SettingDelta[]};
export type MariaDBRestorePlan = Omit<MariaDBApplyPlan,'path'> & {id: string; target: string; backupVersion: string; changed: boolean; notice?: string; warnings: string[]};
export type RedisConfigPlan = {version: string; graphVersion?: string; fields: SettingDelta[]; path?: string; target?: string; id?: string; backupVersion?: string; restoreGraphVersion?: string; changed?: boolean; notice?: string; warnings?: string[]};
export type RedisRestoreReview = RedisConfigPlan & {id: string; target: string; changed: boolean; backupVersion: string; restoreGraphVersion: string; warnings: string[]};
export type ConfigTopology = {root: string; complete: boolean; version: string; notice?: string; files: {path: string; bytes: number; version: string}[]; edges: {from: string; line: number; to: string; directive: string; targets: string[]}[]; warnings: {path: string; line?: number; reason: string}[]};
export type ConfigTreeNode = {path: string; line: number | null; bytes: number | null; version: string | null; missing: boolean; cycle: boolean; truncated: boolean; children: ConfigTreeNode[]};
export type ConfigFileDetails = {path: string; bytes: number; version: string; main: boolean; incoming: {from: string; line: number}[]; outgoing: {line: number; targets: string[]}[]};

export type RedisConfigTopology = Omit<ConfigTopology,'edges'> & {edges: {from: string; line: number; to: string; targets?: string[]}[]};

export type InstalledPackageGroup = {id:string; installed:boolean; packages:{name:string; installed:boolean; version?:string | null}[]; binary?:string | null; sha256?:string | null};
export type ConsoleStatus = {hostname:string; packages:InstalledPackageGroup[]; supported?:boolean; canInstall?:boolean; nodeRuntime?:{version:string; binary:string}; job?:InstallJob | null};
export type ConsoleInitialData = {status:ConsoleStatus | null; security:SecurityPolicy | null};
