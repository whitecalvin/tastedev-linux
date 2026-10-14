import type {WorkspaceTab} from '../components/workspace-editor-types';
type MergeResult={tabs:WorkspaceTab[];existing:WorkspaceTab;preserved:true} | {tabs:WorkspaceTab[];preserved:false};
export function mergeWorkspaceTab(tabs:WorkspaceTab[],item:Omit<WorkspaceTab,'baseline'>):MergeResult{
 const existing=tabs.find(tab=>tab.name===item.name);
 if(existing&&existing.text!==existing.baseline&&existing.text!==item.text)return {tabs,existing,preserved:true};
 const tab={...item,baseline:item.version?item.text:null};
 return {tabs:existing?tabs.map(current=>current.name===item.name?tab:current):[...tabs,tab],preserved:false};
}

export function closeWorkspaceTab(tabs:WorkspaceTab[],active:string,request:WorkspaceTab):{tabs:WorkspaceTab[];active:string};
export function closeWorkspaceTab(tabs:WorkspaceTab[],active:null,request:WorkspaceTab):{tabs:WorkspaceTab[];active:null};
export function closeWorkspaceTab(tabs:WorkspaceTab[],active:string | null,request:WorkspaceTab){
 const index=tabs.findIndex(tab=>tab.name===request?.name),current=tabs[index];
 if(!current||(['text','baseline','version'] as const).some(key=>current[key]!==request[key]))throw Error('설정이 변경되었습니다. 다시 확인하세요.');
 const next=tabs.filter(tab=>tab.name!==request.name);
 return {tabs:next,active:active===request.name?(next[index]?.name||next[index-1]?.name||''):active};
}
