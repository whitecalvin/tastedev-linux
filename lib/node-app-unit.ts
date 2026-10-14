export type NodeServiceOptions = {restart: 'no' | 'on-failure' | 'always'; restartSeconds: number; stopSeconds: number | null};
import path from 'node:path';
import {nodeAppProfile} from './node-app-profile.ts';
const quote=(value: string)=>JSON.stringify(value.replaceAll('%','%%'));
const directory=(value: string)=>value.replaceAll('%','%%').replace(/[\s"\\]/g,char=>'\\x'+char.charCodeAt(0).toString(16).padStart(2,'0'));
export function nodeAppServiceOptions(value: unknown={}): NodeServiceOptions{
 const input=value!==null&&typeof value==='object'?value as Record<string,unknown>:null;
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['restart','restartSeconds','stopSeconds'].includes(key)))throw Object.assign(Error('Invalid Node service options'),{status:400});
 const restart=input.restart??'on-failure',raw=input.restartSeconds??5;
 if((restart!=='no'&&restart!=='on-failure'&&restart!=='always')||!(typeof raw==='number'&&Number.isInteger(raw)||typeof raw==='string'&&/^[0-9]{1,3}$/.test(raw))||Number(raw)<1||Number(raw)>300)throw Object.assign(Error('Invalid Node service options'),{status:400});
 const stop=input.stopSeconds??null;
 if(stop!==null&&(!(typeof stop==='number'&&Number.isInteger(stop)||typeof stop==='string'&&/^[0-9]{1,3}$/.test(stop))||Number(stop)<1||Number(stop)>300))throw Object.assign(Error('Invalid Node service options'),{status:400});
 return {restart,restartSeconds:Number(raw),stopSeconds:stop===null?null:Number(stop)};
}
export function nodeAppUnit(input: unknown,uid: unknown,options: unknown={}){
 const service=nodeAppServiceOptions(options),app=nodeAppProfile(input);if(typeof uid!=='number'||!Number.isInteger(uid)||uid<=0||uid>2147483647)throw Object.assign(Error('앱 서비스는 일반 사용자 계정으로 실행해야 합니다.'),{status:400});
 return `[Unit]\nDescription=Tastedev Node app: ${app.id}\nAfter=network.target\n\n[Service]\nType=simple\nUser=${uid}\nWorkingDirectory=${directory(app.directory)}\nExecStart=:/usr/bin/node ${quote('--env-file='+path.join(app.directory,app.environmentFile))} ${quote(path.join(app.directory,app.entry))}\nRestart=${service.restart}\nRestartSec=${service.restartSeconds}\n${service.stopSeconds===null?'':`TimeoutStopSec=${service.stopSeconds}\n`}NoNewPrivileges=true\nUMask=0077\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=multi-user.target\n`;
}
