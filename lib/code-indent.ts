export function insertCodeIndent(text:string,start:number,end:number){
 if(typeof text!=='string'||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>text.length)throw Error('Invalid editor selection');
 const next=text.slice(0,start)+'  '+text.slice(end);
 return next.length>262144?null:{text:next,cursor:start+2};
}

export function editCodeIndent(text:string,start:number,end:number,outdent=false,indent='  '){
 if(typeof text!=='string'||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>text.length)throw Error('Invalid editor selection');
 if(typeof indent!=='string'||!/^ +$/.test(indent))throw Error('Invalid indentation');
 if(!outdent&&!text.slice(start,end).includes('\n')){
  const next=text.slice(0,start)+indent+text.slice(end),cursor=start+indent.length;
  return next.length>262144?null:{text:next,start:cursor,end:cursor};
 }
 const first=start===0?0:text.lastIndexOf('\n',start-1)+1;
 const last=end>start&&text[end-1]==='\n'?end-1:end,edits:{position:number;remove:number;insert:string}[]=[];
 for(let position=first;position<=last;){
  const prefix=outdent?(text.slice(position,position+indent.length).match(/^(?:\t| +)/)?.[0]||''):'';
  if(!outdent||prefix)edits.push({position,remove:prefix.length,insert:outdent?'':indent});
  const newline=text.indexOf('\n',position);if(newline<0)break;position=newline+1;
 }
 if(text.length+edits.reduce((length,edit)=>length+edit.insert.length-edit.remove,0)>262144)return null;
 const pieces:string[]=[];let cursor=0;
 for(const edit of edits){pieces.push(text.slice(cursor,edit.position),edit.insert);cursor=edit.position+edit.remove;}
 pieces.push(text.slice(cursor));const next=pieces.join('');
 function offset(value:number){let delta=0;for(const edit of edits){if(value<edit.position)break;if(value<edit.position+edit.remove)return edit.position+delta+edit.insert.length;delta+=edit.insert.length-edit.remove;}return value+delta;}
 return {text:next,start:offset(start),end:offset(end)};
}
