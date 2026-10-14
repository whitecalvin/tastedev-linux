import type {PackageConfigApi} from './package-config-types';
import type {FileApi} from './config-code-editor';
import type {WorkspaceFileRecord} from './node-types';
export type WorkspaceTab = {name:string; text:string; baseline:string | null; version?:string};
export interface WorkspaceEditorApi extends FileApi,PackageConfigApi {
 (action:'files'):Promise<{root:string; files:string[]; directories?:string[]}>;
 (action:`file?name=${string}`):Promise<WorkspaceFileRecord>;
 (action:'folder',body:{name:string}):Promise<unknown>;
}
export type WorkspaceComparison = WorkspaceFileRecord & {editor:string};
