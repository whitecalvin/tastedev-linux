export type HbaToken={value:string;initialQuote:boolean;start:number;end:number};
type HbaLogicalLine={start:number;end:number;line:number;text:string;positions:number[]};
export type HbaScannedLine=HbaLogicalLine&{fields:HbaToken[][]};
// Reference scanner, not a syntax validator. PostgreSQL remains authoritative.
// Continuations are folded before quotes/comments; token offsets still refer
// to the original bytes-as-JS-string so candidate rewrites retain line numbers.
export function postgresqlHbaLines(source:unknown):HbaScannedLine[]{
 if(typeof source!=='string'||source.includes('\0')||Buffer.byteLength(source)>262144)throw Error('Invalid HBA source');
 const lines:HbaLogicalLine[]=[];let offset=0,line=1,start=0,startLine=1,text='',positions:number[]=[],lastContinuation=0;
 for(const raw of source.split(/(?<=\n)/)){if(!raw)continue;const body=raw.replace(/\r?\n$/,'');for(let i=0;i<body.length;i++){text+=body[i];positions.push(offset+i);}offset+=raw.length;
 if(text.length>lastContinuation&&text.endsWith('\\')){text=text.slice(0,-1);positions.pop();lastContinuation=text.length;line++;continue;}
 lines.push({start,end:offset,line:startLine,text,positions});start=offset;line++;startLine=line;text='';positions=[];lastContinuation=0;
 }
 if(text||start<source.length)lines.push({start,end:source.length,line:startLine,text,positions});
 return lines.map(entry=>{
  const fields:HbaToken[][]=[];let i=0,field:HbaToken[]=[];
  while(i<entry.text.length){while(/[ \t\r,]/.test(entry.text[i]??'')&&i<entry.text.length)i++;if(i>=entry.text.length||entry.text[i]==='#')break;
   const begin=i;let value='',quoted=false,initialQuote=false,sawQuote=false;
   while(i<entry.text.length){const c=entry.text[i];if(!quoted&&(c==='#'||c===','||/[ \t\r]/.test(c)))break;
    if(c==='"'){sawQuote=true;if(value.length===0)initialQuote=true;if(quoted&&entry.text[i+1]==='"'){value+='"';i+=2;continue;}quoted=!quoted;i++;continue;}value+=c;i++;
   }
   if(value||sawQuote)field.push({value,initialQuote,start:entry.positions[begin],end:entry.positions[i-1]+1});
   if(entry.text[i]===','){i++;continue;}if(field.length){fields.push(field);field=[];}if(entry.text[i]==='#')break;
  }
  if(field.length)fields.push(field);return {...entry,fields};
 });
}
