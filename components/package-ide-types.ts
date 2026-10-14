import type {SecurityPolicy,ServiceRecord,ConfigBackupCatalog,DatabaseOperationResult,PostgreSQLHbaInput,PostgreSQLCodeInput,MariaDBCodeInput,RedisCodeInput} from './console-types';
import type {ConfigCodeRecord} from './config-code-editor';
import type {PackageConfigApi,LiveConfigFile,LiveConfigSnapshot,ConfigValues} from './package-config-types';
import type {ServerManagerApi,CertificateSummary} from './server-manager-types';
import type {PackageProfile} from './node-types';
export type PackageIdeKind='certbot' | 'postgresql' | 'mariadb' | 'redis';
export type IdeConfigFile=LiveConfigFile & {name?:never; groups?:string[]; service?:ServiceRecord};
export type IdeCertificateFile=CertificateSummary & {path?:never; groups?:never; service?:never; version?:never; values?:never; format?:never; warnings?:never};
export type IdeFile=IdeConfigFile | IdeCertificateFile;
export type IdeSelection={file:IdeFile | null; group:string | null};
export type IdeCodeRecord=ConfigCodeRecord & {sourcePath?:string; sourceVersion?:string | null; selectionKey?:string; visible:boolean; guiValues?:ConfigValues};
export type OpenCodeInput={name:string; text:string; baseline?:string; sourcePath?:string; sourceVersion?:string | null};
export type PendingCode=IdeCodeRecord & {previousSelection:IdeSelection | null};
export type IdePopup='logs' | 'validate' | 'apply' | 'backups' | 'restore' | 'data' | 'postgresql-code' | 'mariadb-code' | 'redis-code';
export type IdeOperationInput={path:string; version?:string | null; text?:string; backupId?:string; root?:string};
export type IdePopupContext={path?:string; hba?:boolean; operationInput?:IdeOperationInput};
export type IdeScope={kind:PackageIdeKind; connected:boolean; api:PackageIdeApi};
export type PackageIdeSeed={kind:string; files:IdeFile[]; service:ServiceRecord | null; error?:string};
export type PackageIdeProps={kind:PackageIdeKind; api:PackageIdeApi; connected:boolean; security:SecurityPolicy | null; requestedProfile:PackageProfile; initialData?:PackageIdeSeed | null};
export interface PackageIdeApi extends PackageConfigApi,ServerManagerApi {
 (action:'certificates'):Promise<{certificates:CertificateSummary[]; warning?:string | null}>;
 (action:`config-live?kind=${PackageIdeKind}`):Promise<LiveConfigSnapshot>;
 (action:'postgresql-backups' | `postgresql-backups?path=${string}` | `postgresql-hba-backups?path=${string}`):Promise<ConfigBackupCatalog>;
 (action:'mariadb-backups' | 'redis-backups'):Promise<ConfigBackupCatalog>;

 (action:`config-source?kind=${string}`):Promise<{text:string; version:string}>;
 (action:`operations?unit=${string}`):Promise<{services:ServiceRecord[]}>;
 (action:'postgresql-hba-validate',body:Record<string,unknown>):Promise<{valid:boolean; diagnostics:{path:string; line:number; category:string}[]}>;
 (action:`postgresql-hba-backups?path=${string}` | `postgresql-backups?path=${string}`):Promise<ConfigBackupCatalog>;
 (action:'postgresql-hba-backup' | 'postgresql-config-backup',body:Record<string,unknown>):Promise<unknown>;
 (action:`postgresql-hba-restore-draft?path=${string}`):Promise<{path:string; sourceVersion:string; baseline:string; text:string}>;
 (action:`logs?source=${string}`):Promise<{text:string}>;
}
export function isConfigFile(file:IdeFile | null | undefined):file is IdeConfigFile{return typeof file?.path==='string';}
export function isCertificateFile(file:IdeFile):file is IdeCertificateFile{return !isConfigFile(file);}

export function isPackageIdeKind(value:string | null):value is PackageIdeKind{return value!==null&&['certbot','postgresql','mariadb','redis'].includes(value);}
export function isCodeInput(value:IdeOperationInput | undefined):value is PostgreSQLCodeInput{return Boolean(value&&typeof value.version==='string'&&typeof value.text==='string');}
export function isHbaInput(value:IdeOperationInput | undefined):value is PostgreSQLHbaInput{return Boolean(value&&typeof value.version==='string');}
export function isMariaCodeInput(value:IdeOperationInput | undefined):value is MariaDBCodeInput{return isCodeInput(value)&&'root' in value&&typeof value.root==='string';}

export function areCertificateFiles(files:IdeFile[]):files is IdeCertificateFile[]{return files.every(file=>typeof file.name==='string'&&!isConfigFile(file));}
