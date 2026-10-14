export type RedisResource = {line:number;directive:string;category:string};
const categories=new Map([
 ['loadmodule','module'],['replicaof','replication'],['slaveof','replication'],
 ['aclfile','external-file'],['tls-cert-file','external-file'],['tls-key-file','external-file'],['tls-ca-cert-file','external-file'],['tls-ca-cert-dir','external-file'],['tls-dh-params-file','external-file'],
 ['cluster-enabled','cluster'],['cluster-config-file','external-file'],['cluster-announce-ip','network'],['cluster-announce-hostname','network'],
 ['dir','data-directory'],['dbfilename','persistence'],['appendfilename','persistence'],['appenddirname','persistence'],['appendonly','persistence'],['save','persistence'],
 ['logfile','output'],['pidfile','output'],['unixsocket','socket'],['port','network'],['tls-port','network'],['bind','network'],['syslog-enabled','output']
]);
// Conservative inventory, not a Redis parser or proof of isolated execution.
// Values may contain secrets; never return values or raw source lines.
export function redisResourceReview(text:unknown){
 if(typeof text!=='string'||Buffer.byteLength(text)>262144||text.includes('\0'))throw Object.assign(Error('Review Redis configuration encoding and size'),{status:400});
 const resources:RedisResource[]=[];let unsupportedSyntax=0,totalResources=0;
 text.split(/\r?\n/).forEach((line,index)=>{const trimmed=line.trim();if(!trimmed||trimmed.startsWith('#'))return;const match=/^([a-zA-Z][a-zA-Z0-9-]*)(?:\s|$)/.exec(trimmed);if(!match){unsupportedSyntax++;return;}const directive=match[1].toLowerCase(),category=categories.get(directive);if(category){totalResources++;if(resources.length<256)resources.push({line:index+1,directive,category});}});
 return {resources,unsupportedSyntax,totalResources,truncated:totalResources>resources.length,resourceIsolationVerified:false,notice:'Inventory only; native validation and external resource review remain required'};
}
