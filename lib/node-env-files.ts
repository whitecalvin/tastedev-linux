const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
// Match only editable workspace paths; hidden files and links are omitted by the workspace catalog.
export function nodeEnvFiles(catalog:unknown){
 const input=object(catalog)?catalog:{};
 const files=(Array.isArray(input.files)?input.files:[]).filter((name:unknown):name is string=>typeof name==='string'&&name.length<=240&&!/[\\\0\r\n]/.test(name)&&name.split('/').every(part=>part&&!part.startsWith('.'))&&/\.env(?:\.[A-Za-z0-9_-]+)?$/.test(name));
 return {root:typeof input.root==='string'?input.root:'',files:[...new Set(files)].sort()};
}

export function nodeEnvDraftFiles(records:unknown){
 const files:string[]=[];
 for(const [key,record] of Object.entries(object(records)?records:{})){if(object(record)&&typeof record.name==='string'&&key==='nodejs:'+record.name&&record.kind==='nodejs'&&(record.text!==record.baseline||object(record.guiValues)&&Object.keys(record.guiValues).length>0))files.push(record.name);}
 return nodeEnvFiles({files}).files;
}
