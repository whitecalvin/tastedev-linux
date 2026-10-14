export type CodeViewSnapshot={text:string;start:number;end:number;direction:'forward' | 'backward' | 'none';top:number;left:number};
type CodeViewInput=Pick<HTMLTextAreaElement,'value' | 'selectionStart' | 'selectionEnd' | 'selectionDirection' | 'scrollTop' | 'scrollLeft' | 'setSelectionRange'>;
export function rememberCodeView(previous:Record<string,CodeViewSnapshot>,key:string,input:CodeViewInput){
 const next={...previous};delete next[key];next[key]={text:input.value,start:input.selectionStart,end:input.selectionEnd,direction:input.selectionDirection,top:input.scrollTop,left:input.scrollLeft};
 for(const stale of Object.keys(next).slice(0,-32))delete next[stale];return next;
}
export function restoreCodeView(input:CodeViewInput | null | undefined,snapshot:CodeViewSnapshot | null | undefined){
 if(!input||!snapshot||snapshot.text!==input.value)return false;
 input.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);input.scrollTop=snapshot.top;input.scrollLeft=snapshot.left;return true;
}
