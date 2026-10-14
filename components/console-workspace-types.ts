import type {StoredInstallJob} from '../lib/install-job-record.ts';
import type {ConsoleInitialData,ConsoleStatus,SecurityApi,TerminalApi,OperationsData} from './console-types';
import type {PackageConfigApi} from './package-config-types';
import type {ServerManagerApi,ServerInitialData} from './server-manager-types';
import type {NodeIdeData} from './node-types';
import type {PackageIdeSeed,PackageIdeApi} from './package-ide-types';
export type {PackageIdeSeed} from './package-ide-types';
export type InstallJob=Omit<StoredInstallJob,'startedAt'|'exitCode'> & {startedAt?:string; exitCode?:number | null; monitoringUnavailable?:boolean; monitoringMessage?:string};
export type InstallPlan={command:string[]; packages:string[]};
export type WorkspaceInitialData=ConsoleInitialData & {nginx?:ServerInitialData; nodeIde?:NodeIdeData; operations?:OperationsData | null; packageIde?:PackageIdeSeed};
export interface ConsoleApi extends PackageIdeApi,PackageConfigApi,ServerManagerApi,TerminalApi,SecurityApi {
 (action:'status'):Promise<ConsoleStatus>;
 (action:'job' | 'install',body?:{packages:string[]; confirm:true}):Promise<{job:InstallJob | null}>;
 (action:'plan',body:{packages:string[]}):Promise<{command:string[]}>;
}
