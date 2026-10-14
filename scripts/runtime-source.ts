import {readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {parse,transform,loadBindings} from 'next/dist/build/swc/index.js';
function record(value: unknown): value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
// Build/verification only. Each caller supplies its own fixed runtime closure.
// Installed executables receive plain MJS, with no compiler or TS loader.
export async function readRuntimeModule(name: string,allowed: readonly string[],project=process.cwd()){
 if(!allowed.includes(name))throw Error('Unapproved admin runtime module');
 let sourceFile=path.join(project,name),typed=/\.m?ts$/.test(name);
 try{await lstat(sourceFile);}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='ENOENT')throw error;sourceFile=sourceFile.replace(/\.mjs$/,'.ts');try{await lstat(sourceFile);}catch(missing){if(missing===null||typeof missing!=='object'||!('code' in missing)||missing.code!=='ENOENT')throw missing;sourceFile=sourceFile.replace(/\.ts$/,'.mts');}typed=true;}
 const stat=await lstat(sourceFile);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1048576)throw Error('Invalid admin runtime source');
 const bytes=await readFile(sourceFile),source=bytes.toString('utf8');
 if(!typed&&!(/\.m?ts/.test(source)))return bytes;
 await loadBindings();
 const parsed: unknown=await parse(source,{filename:sourceFile.replace(/\.mts$/,'.ts')}),edits: {start: number; end: number; text: Buffer}[]=[];
 if(!record(parsed)||!Array.isArray(parsed.body))throw Error('Invalid admin runtime source');const nodes: unknown[]=parsed.body;
 function rewrite(literal:Record<string,unknown>){
  if(typeof literal.value!=='string')throw Error('Invalid runtime import');const specifier=literal.value,dependency=specifier.replace(/\.m?ts$/,'.mjs'),target=path.posix.normalize(path.posix.join(path.posix.dirname(name),dependency));
  if(!/^\.{1,2}\/[a-z0-9./-]+\.m?ts$/.test(specifier)||!allowed.includes(target))throw Error('Unapproved typed admin dependency');
  if(typeof literal.raw!=='string'||!record(literal.span)||typeof literal.span.start!=='number'||typeof literal.span.end!=='number'||!Number.isSafeInteger(literal.span.start)||!Number.isSafeInteger(literal.span.end))throw Error('Admin runtime source span mismatch');
  const start=literal.span.start-1,end=literal.span.end-1;if(start<0||end<=start||end>bytes.length)throw Error('Admin runtime source span mismatch');
  if(bytes.subarray(start,end).toString('utf8')!==literal.raw)throw Error('Admin runtime source span mismatch');
  edits.push({start,end,text:Buffer.from(JSON.stringify(dependency),'utf8')});
 }
 for(const node of nodes){
  if(!record(node)||!['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(String(node.type))||node.typeOnly===true||!record(node.source)||node.source.type!=='StringLiteral'||typeof node.source.value!=='string'||!node.source.value.match(/\.m?ts$/))continue;
  rewrite(node.source);
 }
 function dynamic(node:unknown){
  if(!record(node))return;
  if(node.type==='CallExpression'&&record(node.callee)&&node.callee.type==='Import'&&Array.isArray(node.arguments)&&record(node.arguments[0])&&record(node.arguments[0].expression)){const literal=node.arguments[0].expression;if(literal.type==='StringLiteral'&&typeof literal.value==='string'&&literal.value.match(/\.m?ts$/))rewrite(literal);}
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(dynamic);else if(record(value))dynamic(value);
 }
 dynamic(parsed);
 let output=bytes;for(const edit of edits.sort((a,b)=>b.start-a.start))output=Buffer.concat([output.subarray(0,edit.start),edit.text,output.subarray(edit.end)]);
 // Existing JavaScript retains its exact bytes outside approved import literals.
 if(!typed)return output;
 const result=await transform(output.toString('utf8'),{filename:sourceFile,jsc:{parser:{syntax:'typescript'},target:'es2022',experimental:{keepImportAttributes:true}},module:{type:'es6'},sourceMaps:false});
 return Buffer.from(result.code,'utf8');
}
