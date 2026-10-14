import type {ConfigDraft} from './config-history.ts';
export type NginxCodeImportRecord = {sourcePath: string; text: string; liveSource: string; treeSource: string};
type NginxCodeImportFile = {path: string; source: string; error?: string | null};
import {parseNginxTree} from './nginx-syntax.ts';
import {recordConfigChange} from './config-history.ts';
export function nginxCodeImport(record: NginxCodeImportRecord | null | undefined,file: NginxCodeImportFile | null | undefined,draft?: ConfigDraft | null): ConfigDraft{
 if(!record||!file||file.error||record.sourcePath!==file.path||typeof record.text!=='string'||record.text.includes('\0')||new TextEncoder().encode(record.text).length>262144)throw Error('설정 값을 확인하세요.');
 if(file.source!==record.liveSource||(draft?.source??file.source)!==record.treeSource)throw Error('조회 이후 운영 파일이 변경되었습니다. 현재 초안을 비교해 확인하세요.');
 parseNginxTree(record.text);
 return recordConfigChange(draft,file.source,record.text);
}
