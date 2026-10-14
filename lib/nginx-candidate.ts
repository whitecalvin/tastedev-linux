import type {NginxAstNode} from './nginx-syntax.ts';
export type NginxCandidate = Readonly<{root:string;main:string;originalVersion:string;candidateVersion:string;includePatternsPreserved:true;outputPathsIsolated:true;operationalResourcesVerified:false;cleanup:()=>Promise<void>}>;
type CandidateSnapshot = {bundle:NginxCandidate;checks:{path:string;version:string}[];directories:Map<string,string[]>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {mkdir,writeFile,rm,open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {nginxWorkDirectory} from './nginx-work-directory.ts';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nginxTopology,assertNginxGraphVersion} from './nginx-topology.ts';
import {isolateNginxOutput} from './nginx-isolate-output.ts';
import {parseNginxTree} from './nginx-syntax.ts';
import {certbotNginxOptions} from './nginx-include-links.ts';
import {nginxEditableFile} from './nginx-file-update.ts';
const registered=new WeakMap<object,CandidateSnapshot>(),hash=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex');
const fail:()=>never=()=>{throw Object.assign(Error('Nginx private candidate requires review'),{status:409});};
// Trusted internal bundle. Config content and filesystem paths must never be HTTP output.
export async function nginxCandidate(input:unknown,base='/etc/nginx',certbotDirectory='/etc/letsencrypt'){
 if(!object(input)||typeof input.target!=='string')fail();const {version,target,text}=input;
 nginxEditableFile(target);if(typeof text!=='string'||text.includes('\0')||Buffer.byteLength(text)>262144)fail();
 const original=await assertNginxGraphVersion(version,base,new Map(),certbotDirectory),overrides=new Map([[target,text]]),sources=new Map<string,string>(),graph=await nginxTopology(base,overrides,sources,certbotDirectory);
 if(!graph.complete||!graph.files.some(file=>file.path===target||file.resolved===target))fail();
 const hasPid=[...sources.values()].some(source=>parseNginxTree(source).some(node=>node.kind==='directive'&&/^pid(?:\s|$)/.test(node.label)));
 const root=await nginxWorkDirectory('tastedev-nginx-candidate-'),candidatePath=(target:string)=>target===certbotNginxOptions?path.join(root,'external','letsencrypt','options-ssl-nginx.conf'):path.join(root,'config',target.slice(11)),entries=new Map(graph.files.map(file=>[file.path,candidatePath(file.path)])),checks:{path:string;version:string}[]=[];
 try{await mkdir(path.join(root,'config'),{mode:0o700});await mkdir(path.join(root,'logs'),{mode:0o700});for(const entry of graph.directories)await mkdir(path.join(root,'config',entry.path.slice(11)),{recursive:true,mode:0o700});
  for(const file of graph.files){let source=sources.get(file.path);if(typeof source!=='string'||hash(source)!==file.version)fail();const replacements:{start:number;end:number;text:string}[]=[];
   function walk(nodes:NginxAstNode[]){for(const node of nodes){if(node.kind==='block'){walk(node.children);continue;}if(!/^include\s/.test(node.label))continue;const edge=graph.edges.find(edge=>edge.from===file.path&&edge.line===node.line&&node.label.replace(/^include\s+/, '').replace(/^(["'])(.*)\1$/, '$2')===edge.to);if(!edge)fail();const replacement='include '+candidatePath(edge.resolved||edge.to)+';';replacements.push({start:node.start,end:node.end,text:replacement});}}
   walk(parseNginxTree(source));for(const change of replacements.sort((a,b)=>b.start-a.start))source=source.slice(0,change.start)+change.text+source.slice(change.end);
   source=isolateNginxOutput(source,root);if(!hasPid&&file.path===graph.root)source='pid '+root+'/nginx.pid;\n'+source;const destination=entries.get(file.path);if(typeof destination!=='string')fail();await mkdir(path.dirname(destination),{recursive:true,mode:0o700});await writeFile(destination,source,{mode:0o600,flag:'wx'});checks.push({path:destination,version:hash(source)});
  }
  await assertNginxGraphVersion(original.version,base,new Map(),certbotDirectory);await assertNginxGraphVersion(graph.version,base,overrides,certbotDirectory);
  const directories=new Map<string,string[]>();async function inventory(dir:string){const names=(await readdir(dir)).sort();directories.set(dir,names);for(const name of names){const entry=path.join(dir,name),stat=await lstat(entry);if(stat.isDirectory())await inventory(entry);}}await inventory(path.join(root,'config'));if(graph.files.some(file=>file.path===certbotNginxOptions))await inventory(path.join(root,'external'));
  const main=entries.get(graph.root);if(typeof main!=='string')fail();
  const bundle:NginxCandidate={root,main,originalVersion:original.version,candidateVersion:graph.version,includePatternsPreserved:true,outputPathsIsolated:true,operationalResourcesVerified:false,async cleanup(){registered.delete(bundle);await rm(root,{recursive:true,force:true});}};
  registered.set(bundle,{bundle,checks,directories});await assertNginxCandidate(bundle);return Object.freeze(bundle);
 }catch(error){await rm(root,{recursive:true,force:true});throw error;}
}
export async function assertNginxCandidate(value:unknown){
 if(!object(value))fail();const registeredBundle=registered.get(value);if(!registeredBundle)fail();const {bundle,checks,directories}=registeredBundle;const root=await lstat(bundle.root);if(!root.isDirectory()||root.isSymbolicLink()||root.uid!==process.getuid?.()||(root.mode&0o077))fail();
 const logs=await lstat(path.join(bundle.root,'logs'));if(!logs.isDirectory()||logs.isSymbolicLink()||logs.uid!==process.getuid?.()||(logs.mode&0o077))fail();
 for(const [directory,names] of directories){const stat=await lstat(directory);if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077)||JSON.stringify((await readdir(directory)).sort())!==JSON.stringify(names))fail();}
 for(const entry of checks){const handle=await open(entry.path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid?.()||stat.nlink!==1||(stat.mode&0o077)||stat.size>262144)fail();const buffer=Buffer.alloc(262145),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>262144||hash(buffer.subarray(0,bytesRead))!==entry.version)fail();const after=await lstat(entry.path);if(after.isSymbolicLink()||after.ino!==stat.ino||after.dev!==stat.dev||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs)fail();}finally{await handle.close();}}return true;
}
