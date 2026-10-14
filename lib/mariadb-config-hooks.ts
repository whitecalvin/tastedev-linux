import type {MariaDBCandidate} from './mariadb-candidate.ts';
type MariaRun=(binary:string,args:string[])=>unknown|Promise<unknown>;
type HookOptions={candidateInspector?:(candidate:MariaDBCandidate)=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {isMariaDBCandidate,assertMariaDBCandidate} from './mariadb-candidate.ts';
import path from 'node:path';
import {databaseConfigProfile as configProfile} from './database-config-profile.ts';
import {parseLiveConfig} from './config-live.ts';
const names={port:'port',connections:'max_connections',bufferPool:'innodb_buffer_pool_size',charset:'character-set-server',slowLog:'slow_query_log',slowSeconds:'long_query_time'};
const fail:(message:string)=>never=message=>{throw Object.assign(new Error(message),{status:400});};
// Internal adapter only: execution and privilege gating belong to the helper.
export function mariadbConfigHooks(target:unknown,changes:unknown,run:MariaRun,restoreVersion:string|null=null,{candidateInspector}:HookOptions={}){
 if(typeof target!=='string'||!/^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:mariadb\.conf\.d|conf\.d)\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*\.cnf)$/.test(target)||typeof run!=='function'||!object(changes)||(!Object.keys(changes).length&&!/^[a-f0-9]{64}$/.test(restoreVersion||''))||Object.keys(changes).some(key=>!Object.hasOwn(names,key)))fail('MariaDB 설정 대상 파일과 변경할 항목을 확인하세요.');
 configProfile('mariadb',changes);
 let validationMode:'configuration'|'options-help'|null=null;
 const check=async()=>{try{await run('/usr/bin/systemctl',['--no-ask-password','is-active','--quiet','mariadb.service']);}catch{fail('MariaDB 서비스를 시작한 후 설정을 변경하세요.');}};
 const validateFile=async(candidate:string)=>{
   const defaults='--defaults-file='+candidate;
   try{await run('/usr/sbin/mariadbd',[defaults,...(validationMode==='configuration'?['--validate-config']:['--verbose','--help'])]);}catch{fail('MariaDB 후보 설정 검수에 실패했습니다. 변경한 설정을 확인하세요.');}
   // This output can contain passwords. Filter internally and never return it or diagnostics.
   let output;try{output=await run('/usr/bin/my_print_defaults',[defaults,'--mariadbd']);}catch{fail('MariaDB 후보 설정의 실제 옵션을 조회하지 못했습니다. 실행 파일과 설정을 확인하세요.');}
   if(typeof output!=='string'||output.length>2097152)fail('MariaDB 설정 옵션 조회 결과를 확인할 수 없습니다.');
   const lines=[];
   for(const line of output.split(/\r?\n/)){
    const match=/^--([a-zA-Z_-]+)(?:=(.*))?$/.exec(line);if(!match)continue;
    let name=match[1].replaceAll('-','_'),value=match[2]??'1';
    if(name==='skip_slow_query_log'){name='slow_query_log';value='0';}
    if(name==='character_set_server')name='character-set-server';
    if(Object.values(names).includes(name))lines.push(name+'='+value);
   }
   const values=parseLiveConfig('mariadb','[mariadbd]\n'+lines.join('\n')).values;
   for(const [key,value] of Object.entries(changes)){const actual=values[key];if(actual===undefined||(typeof actual==='number'?Number(value)!==actual:actual!==value))fail('MariaDB 후보 설정의 실제 값이 요청한 값과 다릅니다. include 파일과 중복 설정을 확인하세요.');}

 }
 return {
  get validationMode(){return validationMode;},
  preflight:async()=>{await check();const help=await run('/usr/sbin/mariadbd',['--no-defaults','--verbose','--help']);if(typeof help!=='string'||help.length>2097152)fail('MariaDB 실행 파일의 지원 옵션을 확인할 수 없습니다.');validationMode=/(?:^|\s)--validate-config(?:\s|[=,]|$)/m.test(help)?'configuration':'options-help';return {validationMode};},
  validate:async (candidate:unknown)=>{
   if(!validationMode)fail('MariaDB 실행 파일의 지원 옵션을 먼저 확인하세요.');
   if(typeof candidate!=='string'||path.dirname(candidate)!==path.dirname(target)||!/^\.tastedev-config-[a-f0-9-]{36}$/.test(path.basename(candidate)))fail('MariaDB 후보 설정 파일의 경로를 확인하세요.');
   await validateFile(candidate);
  },
  validatePrepared:async (candidate:unknown)=>{
   if(!validationMode)fail('MariaDB 실행 파일의 지원 옵션을 먼저 확인하세요.');
   if(!isMariaDBCandidate(candidate))fail('MariaDB 후보 설정 검토가 만료되었거나 올바르지 않습니다. 다시 검토하세요.');
   const keys=Object.keys(changes).sort();if(candidate.restoreVersion!==restoreVersion||candidate.sourceTarget!==target||JSON.stringify(Object.keys(candidate.changes).sort())!==JSON.stringify(keys)||keys.some(key=>String(candidate.changes[key])!==String(changes[key])))fail('MariaDB 후보 설정이 검토한 대상 파일 또는 변경 내용과 다릅니다. 다시 검토하세요.');
   await assertMariaDBCandidate(candidate);
   if(candidateInspector){
    const report=await candidateInspector(candidate);if(!object(report)||report.valid!==true||report.scope!=='private-options-validation'||report.namespaceCommandsCompleted!==true||report.operatingConfigurationChanged!==false||report.operatingServiceChanged!==false||(report.validationMode!=='configuration'&&report.validationMode!=='options-help'))fail('MariaDB 격리 환경 검수에 실패했습니다. 후보 설정과 검수 환경을 확인하세요.');
    for(const [key,value] of Object.entries(changes)){const actual=object(report.values)?report.values[key]:undefined;if(actual===undefined||(typeof actual==='number'?Number(value)!==actual:actual!==value))fail('MariaDB 후보 설정의 실제 값이 요청한 값과 다릅니다. include 파일과 중복 설정을 확인하세요.');}
    validationMode=report.validationMode;
   }else await validateFile(candidate.main);
   await assertMariaDBCandidate(candidate);
   if(!isMariaDBCandidate(candidate))fail('MariaDB 검수 중 후보 설정이 만료되었습니다. 다시 검토하세요.');
  },
  activate:async()=>{await run('/usr/bin/systemctl',['--no-ask-password','restart','mariadb.service']);await check();},
  recover:async()=>{await run('/usr/bin/systemctl',['--no-ask-password','restart','mariadb.service']);await check();}
 };
}
