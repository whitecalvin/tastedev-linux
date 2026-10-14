import type {NginxAstNode} from './nginx-syntax.ts';
import {parseNginxTree} from './nginx-syntax.ts';
const temporary=new Set(['client_body_temp_path','proxy_temp_path','fastcgi_temp_path','uwsgi_temp_path','scgi_temp_path']);
// Output destinations are redirected only for private syntax validation.
// Operational path validity/permissions still require the deployment check.
export function isolateNginxOutput(source:string,root:unknown):string{
 if(typeof root!=='string'||!/^\/mnt\/data\/build\/[a-zA-Z0-9_./-]+\/tastedev-nginx-candidate-[a-zA-Z0-9_-]+$/.test(root)||root.split('/').includes('..'))throw Error('Invalid private nginx output directory');
 const changes:{start:number;end:number;text:string}[]=[];
 function walk(nodes:NginxAstNode[]){for(const node of nodes){const name=node.label.split(/\s/)[0];if(node.kind==='block'){if(name==='http')changes.push({start:node.open+1,end:node.open+1,text:'\naccess_log '+root+'/access.log;\n'});walk(node.children);continue;}
  const argumentsText=node.label.slice(name.length).trim(),match=/^(?:"[^"\\]*"|'[^'\\]*'|[^\s]+)(.*)$/.exec(argumentsText);let text:string|undefined;
  if(name==='access_log'&&argumentsText!=='off'&&match)text='access_log '+root+'/access.log'+match[1]+';';
  if(name==='error_log'&&match)text='error_log stderr'+match[1]+';';
  if(name==='pid'&&match)text='pid '+root+'/nginx.pid'+match[1]+';';
  if(temporary.has(name)&&match)text=name+' '+root+'/'+name+match[1]+';';
  if(text)changes.push({start:node.start,end:node.end,text});
 }}walk(parseNginxTree(source));for(const change of changes.sort((a,b)=>b.start-a.start))source=source.slice(0,change.start)+change.text+source.slice(change.end);return source;
}
