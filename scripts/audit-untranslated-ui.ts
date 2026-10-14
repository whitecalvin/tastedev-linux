import {readFile,readdir} from 'node:fs/promises';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';

// Review candidates, not definitive failures: a custom component may translate
// its own labels/children. Backend diagnostics, data-driven labels and technical
// content require their own review; an empty report is not full i18n.
type Finding={file:string;kind:string|undefined;text:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const findings:Finding[]=[];
function directStrings(node:unknown):string[]{
 if(!object(node))return [];
 if(node?.type==='StringLiteral')return typeof node.value==='string'?[node.value]:[];
 if(node?.type==='ConditionalExpression')return [...directStrings(node.consequent),...directStrings(node.alternate)];
 return [];
}
function walk(node:unknown,file:string){
 if(!object(node))return;
 let values:string[]=[],kind:string|undefined;
 if(node.type==='JSXText'){values=typeof node.value==='string'?[node.value]:[];kind='text';}
 if(node.type==='JSXExpressionContainer'){values=directStrings(node.expression);kind='expression';}
 if(node.type==='JSXAttribute'&&['label','title','aria-label','placeholder','alt'].includes(object(node.name)&&typeof node.name.value==='string'?node.name.value:'')){
  const value=object(node.value)?node.value:undefined;values=value?.type==='StringLiteral'&&typeof value.value==='string'?[value.value]:directStrings(value?.expression);kind='attribute:'+(object(node.name)?node.name.value:'');
 }
 for(const text of values){const key=text.trim();if(/[가-힣]/.test(key))findings.push({file,kind,text:key});}
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(item=>walk(item,file));else if(value&&typeof value==='object')walk(value,file);
}
async function scan(directory:string){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=directory+'/'+entry.name;
  if(entry.isDirectory())await scan(file);
  else if(/\.(jsx|tsx)$/.test(file))walk(await parse(await readFile(file,'utf8'),{filename:file,syntax:'typescript',tsx:true}),file);
 }
}
await loadBindings();await scan('app');await scan('components');
const unique=[...new Map(findings.map(item=>[JSON.stringify(item),item])).values()];
const byFile:Record<string,number>={};for(const item of unique)byFile[item.file]=(byFile[item.file]||0)+1;
console.log(JSON.stringify({status:unique.length?'DIRECT_JSX_COPY_REVIEW_REQUIRED':'NO_DIRECT_JSX_COPY_FOUND',scope:'Review candidates: direct Korean JSX text, literal expression and accessibility/form attributes; custom components may translate their props. Excludes backend errors, data-driven labels and technical code',findings:unique.length,byFile,items:unique},null,2));
