import type {ConfigKind as PackageKind,ConfigValue,ConfigValues,ConfigSchemaField,ConfigSchema} from '../lib/config-schema.ts';
export type {ConfigKind as PackageKind,ConfigValue,ConfigValues,ConfigSchemaField,ConfigSchema} from '../lib/config-schema.ts';
import type {OperationsApi,ConfigTopology,ConfigBackupCatalog,SettingDelta,RedisResourceInventory,MariaDBApplyPlan,RedisConfigPlan,DatabaseOperationResult,SecurityPolicy} from './console-types';
import type {FileApi} from './config-code-editor';
import type {NodeWorkspaceApi,PackageProfile} from './node-types';
export type {LiveConfigFile} from '../lib/config-live.ts';
import type {LiveConfigFile} from '../lib/config-live.ts';
export type LiveConfigSnapshot={kind:PackageKind; configs:LiveConfigFile[]; warnings:string[]; notice:string};
export type ConfigBaseline=Pick<LiveConfigFile,'path' | 'version' | 'values'>;
type PlanBase={path:string; version:string; fields:(SettingDelta & {label:string})[]; warnings:string[]; notice:string};
export type ConfigOperationPlan=(PlanBase & {kind:'postgresql'}) | (PlanBase & MariaDBApplyPlan & {kind:'mariadb'}) | (PlanBase & RedisConfigPlan & {kind:'redis'; resourceReview:RedisResourceInventory});
export interface PackageConfigApi extends OperationsApi,NodeWorkspaceApi,FileApi {
 (action:'config-plan',body:ConfigValues):Promise<{text:string}>;
 (action:'config-save',body:ConfigValues):Promise<{name:string; text:string; version:string}>;
 (action:`config-live?kind=${PackageKind}`):Promise<LiveConfigSnapshot>;
 (action:'config-operation-plan',body:Record<string,unknown>):Promise<ConfigOperationPlan>;
 (action:'postgresql-apply',body:Record<string,unknown>):Promise<DatabaseOperationResult>;
 (action:'postgresql-backups'):Promise<ConfigBackupCatalog>;
}
export type PackageConfigProps={api:PackageConfigApi; connected:boolean; onOpen?:(record:{name:string; text:string; version?:string})=>void; onInvalidate?:()=>void; security:SecurityPolicy | null; requestedProfile?:PackageProfile | null; requestedConfig?:LiveConfigFile | null; requestedMain?:string; fieldKeys?:string[]; fieldOrder?:string[]; codeRevision?:string | null; controlledDraft?:ConfigValues; onFieldChange?:(key:string,value:string | number | boolean)=>string | void; onResetDraft?:()=>string | void; onReviewCode?:()=>void; onImportValues?:(values:ConfigValues)=>string | void; nodeSection?:string};
export type MariaGraph=ConfigTopology;
