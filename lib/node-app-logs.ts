import {systemSettings} from './system-settings.ts';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {nodeApps} from './node-apps.ts';
import {redactLog} from './ai-analysis.ts';
const execute=promisify(execFile);
export async function nodeAppLogs(id: unknown){
 const registry=await nodeApps(),app=registry.apps.find(item=>item.id===id);
 if(!app)throw Object.assign(Error('등록한 앱을 선택하세요.'),{status:404});
 try{const {stdout,stderr}=await execute('/usr/bin/journalctl',['--unit',app.unit,'--lines='+systemSettings().logLines,'--no-pager','--output=short-iso','--quiet'],{timeout:3000,maxBuffer:65536,encoding:'utf8',cwd:'/',env:{NODE_ENV:process.env.NODE_ENV,PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});return {id:app.id,unit:app.unit,text:redactLog(stdout),at:new Date().toISOString(),notice:stderr?'일부 로그를 읽지 못했을 수 있습니다. journal 조회 권한을 확인하세요.':'일부 민감 정보 패턴을 마스킹했습니다. AI 전송 전 내용을 검토하세요.'};}
 catch{throw Object.assign(Error('앱 로그를 조회할 수 없습니다. journal 조회 권한과 출력 크기를 확인하세요.'),{status:403});}
}
