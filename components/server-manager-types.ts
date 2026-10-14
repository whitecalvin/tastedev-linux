import type {CertificateApi,AiApi,CertificateHistoryJob,ServiceRecord} from './console-types';
import type {FileApi,ConfigCodeRecord} from './config-code-editor';
import type {TreeFile} from './nginx-editor-types';
export type SiteForm={domain:string; port:string | number; mode:string; upstreamPort:string | number; root:string; version?:string; https?:boolean};
export type ManagedSite={domain:string; path:string; version:string; enabled:boolean; form?:SiteForm | null; editWarning?:string | null};
export type {CertificateSummary} from '../lib/site-status.ts';
import type {CertificateSummary} from '../lib/site-status.ts';
export type CronForm={name:string; schedule:string; command:string; enabled:boolean};
export type CronSnapshot={jobs:CronForm[]; version:string | null; text:string | null; canApply?:boolean; error?:string; account?:{username:string; uid:number; gid:number}; clock?:{observedAt:string; processTimeZone:string; declarations:{line:number; name:string; value:string}[]} | null};
export type ServerTree={root:string; files:TreeFile[]};
export type ServerInitialData={tree:ServerTree | null; sites:ManagedSite[]; service?:Partial<ServiceRecord> | null};
export type ServerTreeCode=ConfigCodeRecord & {sourcePath:string; liveSource:string; treeSource:string; visible:boolean};
export interface ServerManagerApi extends CertificateApi,AiApi,FileApi {
 (action:`admin-job?${string}`):Promise<{job:CertificateHistoryJob}>;
 (action:'nginx-live'):Promise<{sites:ManagedSite[]; warning?:string | null}>;
 (action:'nginx-tree'):Promise<ServerTree>;
 (action:'certificates'):Promise<{certificates:CertificateSummary[]; warning?:string | null}>;
 (action:'certbot-plan',body:Record<string,unknown>):Promise<{command:string[]}>;
 (action:'certbot-issue',body:Record<string,unknown>):Promise<{job:CertificateHistoryJob}>;
 (action:'cron' | 'cron-apply' | 'cron-delete',body?:Record<string,unknown>):Promise<CronSnapshot>;
 (action:'cron-plan',body:CronForm):Promise<{entry:string}>;
 (action:string,body?:Record<string,unknown>):Promise<unknown>;
}
