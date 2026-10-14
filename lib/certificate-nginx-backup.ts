import type {NginxAstNode} from './nginx-syntax.ts';
type BackupOptions={base?:string;backupRoot?:string;ownerUid?:number;readGraph?:typeof nginxTopology;assertGraph?:typeof assertNginxGraphVersion;backup?:typeof createNginxConfigBackup;onBackup?:(metadata:{id:string;path:string})=>unknown|Promise<unknown>};
import {nginxTopology,assertNginxGraphVersion} from './nginx-topology.ts';
import {parseNginxTree} from './nginx-syntax.ts';
import {nginxIncludeLinks} from './nginx-include-links.ts';
import {createNginxConfigBackup} from './nginx-config-backups.ts';
import {domainName} from './nginx-config.ts';
const fail:(message:string)=>never=message=>{throw Object.assign(Error(message),{status:409});};
// Roots and hooks are internal helper dependencies, never certificate request fields.
export async function backupCertificateNginx(domain:unknown,{base='/etc/nginx',backupRoot='/var/lib/linux/admin/nginx-config',ownerUid=0,readGraph=nginxTopology,assertGraph=assertNginxGraphVersion,backup=createNginxConfigBackup,onBackup}:BackupOptions={}){
 const name=domainName(domain),sources=new Map<string,string>(),graph=await readGraph(base,new Map(),sources);
 if(!graph.complete)fail('nginx 설정 파일과 include 연결을 확인하세요.');
 let matched=false,visits=0;const parsed=new Map<string,NginxAstNode[]>();
 function visit(file:string,inServer=false,stack:string[]=[]){
  if(++visits>300||stack.length>=16||stack.includes(file)||!sources.has(file))fail('nginx 설정 파일과 include 연결을 확인하세요.');
  let nodes=parsed.get(file);if(!nodes){const text=sources.get(file);if(text===undefined)fail('nginx 설정 파일과 include 연결을 확인하세요.');nodes=parseNginxTree(text);parsed.set(file,nodes);}
  walk(nodes,file,inServer,[...stack,file]);
 }
 function walk(nodes:NginxAstNode[],file:string,inServer:boolean,stack:string[]){for(const node of nodes){if(node.kind==='block'){walk(node.children,file,inServer||node.label.trim()==='server',stack);continue;}
  const include=nginxIncludeLinks(node,[]);
  if(include){const edge=graph.edges.find(item=>item.from===file&&item.line===node.line&&item.resolved===include.pattern);
   if(!include.supported||!edge)fail('nginx 설정 파일과 include 연결을 확인하세요.');
   for(const target of edge.targets)visit(target,inServer,stack);
   continue;
  }
  if(!inServer)continue;
  const match=/^server_name\s+(.+)$/.exec(node.label.trim());if(!match)continue;
  const names=match[1].match(/"[^"\\]*"|'[^'\\]*'|[^\s]+/g)||[];
  if(names.some(value=>value.replace(/^(['"])(.*)\1$/,'$2').toLowerCase()===name))matched=true;
 }}
 // An include inherits its enclosing block; the same file can occur in several contexts.
 visit(graph.root);
 if(!matched)fail('활성 nginx 서버 블럭에 해당 도메인의 server_name을 설정하세요.');
 const files=new Map<string,string>();for(const file of graph.files){if(file.readOnly)continue;const target=file.resolved??file.path;if(files.has(target)&&files.get(target)!==file.version)fail('nginx 설정 파일 연결이 변경되었습니다.');files.set(target,file.version);}
 await assertGraph(graph.version,base);
 const records:Awaited<ReturnType<typeof createNginxConfigBackup>>[]=[];for(const [path,version] of files){
  const record=await backup({path,version},{base,root:backupRoot,ownerUid});records.push(record);
  // Publish only completed backup metadata, before the next backup or ACME call.
  if(onBackup)await onBackup({id:record.backup.id,path:record.backup.target});
 }
 await assertGraph(graph.version,base);
 return {graphVersion:graph.version,backups:records.map(record=>({id:record.backup.id,path:record.backup.target}))};
}
