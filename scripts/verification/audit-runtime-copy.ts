import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {parse,loadBindings} from 'next/dist/build/swc/index.js';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const type=(node:unknown)=>object(node)&&typeof node.type==='string'?node.type:undefined;
const identifier=(node:unknown)=>object(node)&&node.type==='Identifier'&&typeof node.value==='string'?node.value:undefined;
const argument=(node:Record<string,unknown>,index=0)=>Array.isArray(node.arguments)&&object(node.arguments[index])?node.arguments[index].expression:undefined;
export type DiagnosticCandidates={literals:string[];dynamic:{kind:string;type:string}[]};
// Candidate inventory only: no imported/aliased helpers or control-flow proof.
export function diagnosticCandidates(ast:unknown):DiagnosticCandidates{
 const literals=new Set<string>(),dynamic:DiagnosticCandidates['dynamic']=[];
 const errorTypes=new Set(['Error','TypeError','RangeError']),functionTypes=new Set(['ArrowFunctionExpression','FunctionExpression','FunctionDeclaration']);
 const declarations=new Map<string,number>(),candidates=new Map<string,Set<number>>();
 const children=(node:Record<string,unknown>,visit:(value:unknown)=>void)=>{for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(object(value))visit(value);};
 function factory(name:string,fn:unknown){
  declarations.set(name,(declarations.get(name)??0)+1);
  if(!object(fn)||!functionTypes.has(type(fn)??''))return;
  const names=(Array.isArray(fn.params)?fn.params:[]).map(parameter=>{const pattern=object(parameter)?parameter.pat??parameter:parameter;return identifier(pattern)??(object(pattern)&&pattern.type==='AssignmentPattern'?identifier(pattern.left):undefined)??null;});
  const positions=new Set<number>();
  function inspectBody(node:unknown){
   if(!object(node)||functionTypes.has(type(node)??''))return;
   if(['CallExpression','NewExpression'].includes(type(node)??'')&&errorTypes.has(identifier(node.callee)??'')){
    const name=identifier(argument(node));if(name!==undefined){const index=names.indexOf(name);if(index>=0)positions.add(index);}
   }
   children(node,inspectBody);
  }
  inspectBody(fn.body);if(positions.size)candidates.set(name,positions);
 }
 function discover(node:unknown){
  if(!object(node))return;
  const variable=identifier(node.id),fn=identifier(node.identifier);
  if(node.type==='VariableDeclarator'&&variable!==undefined)factory(variable,node.init);
  if(node.type==='FunctionDeclaration'&&fn!==undefined)factory(fn,node);
  children(node,discover);
 }
 discover(ast);
 // Ambiguous repeated bindings are excluded rather than guessing a scope.
 const factories=new Map([...candidates].filter(([name])=>declarations.get(name)===1));
 function inspect(value:unknown,kind:string){
  if(object(value)&&value.type==='StringLiteral'&&typeof value.value==='string'){if(/[가-힣]/.test(value.value))literals.add(value.value.trim());return;}
  if(object(value)&&value.type==='ConditionalExpression'){inspect(value.consequent,kind);inspect(value.alternate,kind);return;}
  if(object(value)&&value.type==='TemplateLiteral'&&Array.isArray(value.expressions)&&!value.expressions.length&&Array.isArray(value.quasis)){
   const parts=value.quasis.map(q=>object(q)?q.cooked??q.raw:undefined);
   if(parts.every((part):part is string=>typeof part==='string')){const text=parts.join('');if(/[가-힣]/.test(text))literals.add(text.trim());return;}
  }
  dynamic.push({kind,type:type(value)??'missing'});
 }
 function walk(node:unknown){
  if(!object(node))return;
  const callee=identifier(node.callee);
  if(['CallExpression','NewExpression'].includes(type(node)??'')&&callee!==undefined&&errorTypes.has(callee))inspect(argument(node),'exception');
  const positions=callee===undefined?undefined:factories.get(callee);if(node.type==='CallExpression'&&positions)for(const index of positions)inspect(argument(node,index),'local-error-factory');
  if(node.type==='KeyValueProperty'&&object(node.key)&&((node.key.type==='Identifier'||node.key.type==='StringLiteral')&&node.key.value==='error'))inspect(node.value,'error-field');
  children(node,walk);
 }
 walk(ast);return {literals:[...literals].sort(),dynamic};
}
export async function auditRuntimeCopy(root:string){
 await loadBindings();const english:unknown=JSON.parse(await readFile(path.join(root,'lib/locales/en.json'),'utf8'));if(!object(english))throw Error('Invalid English diagnostic catalog');const catalog=english;
 const files:(DiagnosticCandidates&{file:string;missingEnglish:string[]})[]=[];
 async function walk(dir:string){for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory()&&entry.name!=='locales')await walk(file);else if(entry.isFile()&&/\.(?:[cm]?js|[cm]?ts)$/.test(file)){const result=diagnosticCandidates(await parse(await readFile(path.join(root,file),'utf8'),{filename:file,...(/\.[cm]?ts$/.test(file)?{syntax:'typescript'}:{})}));if(result.literals.length||result.dynamic.length)files.push({file,...result,missingEnglish:result.literals.filter(key=>!Object.hasOwn(catalog,key))});}}}
 await walk('lib');const all=new Set(files.flatMap(f=>f.literals)),missing=new Set(files.flatMap(f=>f.missingEnglish));return {status:'AUDIT',scope:'Korean literals in Error constructors, unambiguous local parameter-to-Error factories and error object fields in lib; imported/aliased helpers and control flow remain unverified; internal exceptions are review candidates',filesScanned:files.length,uniqueLiteralCandidates:all.size,uniqueMissingEnglish:missing.size,dynamicCandidates:files.reduce((n,f)=>n+f.dynamic.length,0),files,wholeTranslationComplete:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log(JSON.stringify(await auditRuntimeCopy(process.cwd()),null,2));
