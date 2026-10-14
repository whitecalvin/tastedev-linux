import type {NativeNginxReport} from './nginx-native-report.ts';
import {requiredBlock,commandStderr,diagnostic} from './nginx-native-report.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {parseNginxTree,addNginxDirective} from '../../lib/nginx-syntax.ts';
const exec=promisify(execFile),binary='/usr/sbin/nginx',fixture=await verificationWorkDirectory('tastedev-nginx-core-blocks-');
const evidence=join(verificationWorkRoot,'nginx-core-blocks-'+new Date().toISOString().replaceAll(':','-'));await mkdir(evidence,{recursive:true});
const report:NativeNginxReport={workDirectory:fixture,status:'FAIL',binary,serverStarted:false,operationalFilesChanged:false,checks:[]};
try{
 report.version=(await exec(binary,['-V'],{encoding:'utf8',timeout:10000})).stderr.trim();report.binarySHA256=createHash('sha256').update(await readFile(binary)).digest('hex');
 const base=`pid ${fixture}/nginx.pid; error_log stderr; events {} http { access_log off; server { listen 127.0.0.1:18080; location / {} } }`;
 const selected=(source:string,context:string)=>{const http=requiredBlock(parseNginxTree(source),'http');if(context==='http')return http;const server=requiredBlock(http.children,'server');return context==='server'?server:requiredBlock(server.children,'location /');};
 const candidates=[];
 await writeFile(join(fixture,'mime-entries.conf'),'application/json json;\n',{mode:0o600});
 let includeSource=addNginxDirective(base,selected(base,'http').id,'types','','block');const includeTypes=requiredBlock(selected(includeSource,'http').children,'types');includeSource=addNginxDirective(includeSource,includeTypes.id,'include',join(fixture,'mime-entries.conf'));candidates.push({name:'GUI types include',source:includeSource,valid:true});
 for(const context of ['http','server','location']){let source=addNginxDirective(base,selected(base,context).id,'types','','block');const types=requiredBlock(selected(source,context).children,'types');source=addNginxDirective(source,types.id,'application/vnd.api+json','json map');candidates.push({name:'GUI MIME block '+context,source,valid:true});}
 candidates.push({name:'GUI limit_except location',source:addNginxDirective(base,selected(base,'location').id,'limit_except','GET','block'),valid:true});
 for(const [name,value] of [['aio','threads=default'],['aio_write','on'],['open_file_cache_min_uses','0'],['open_file_cache','max=1000 inactive=20s']]){
  let source=base;if(name==='aio_write')source=addNginxDirective(source,selected(source,'http').id,'aio','threads');source=addNginxDirective(source,selected(source,'http').id,name,value);candidates.push({name:name+' '+value,source,valid:true});
 }
 candidates.push({name:'limit_except server rejected',source:addNginxDirective(base,selected(base,'server').id,'limit_except','GET','block'),valid:false});
 candidates.push({name:'MIME entry outside types rejected',source:base.replace('access_log off;','access_log off; application/json json;'),valid:false});
 for(const candidate of candidates){await writeFile(join(fixture,'nginx.conf'),candidate.source,{mode:0o600});let output='',accepted=false;try{output=(await exec(binary,['-t','-p',fixture+'/', '-c',join(fixture,'nginx.conf')],{encoding:'utf8',timeout:10000})).stderr;accepted=true;}catch(error){output=commandStderr(error);}
  assert.equal(accepted,candidate.valid,candidate.name);assert.match(output,candidate.valid?/test is successful/:/directive is not allowed here|unknown directive/);report.checks.push({name:candidate.name,status:'PASS',output});}
 assert.equal(report.checks.length,11);report.status='PASS';
}catch(error){report.error=diagnostic(error);process.exitCode=1;}
finally{await rm(fixture,{recursive:true,force:true});report.fixtureRemoved=true;await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,evidence,error:report.error}));}
