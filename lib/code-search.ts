export function nextCodeMatch(text:string,query:string,offset=0){
 if(typeof text!=='string'||typeof query!=='string'||!query)return null;
 const start=Number.isInteger(offset)?Math.max(0,Math.min(text.length,offset)):0;
 let index=text.indexOf(query,start);if(index<0)index=text.indexOf(query);
 return index<0?null:{start:index,end:index+query.length};
}
