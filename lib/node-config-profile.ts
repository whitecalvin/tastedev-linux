import {configDefaults} from './config-schema.ts';
const fail: (message: string) => never = (message)=>{throw Object.assign(new Error(message),{status:400});};
const integer=(value: unknown,label: string,min: number,max: number): number=>{const number=Number(value);if(!(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))||!Number.isInteger(number)||number<min||number>max)fail(`${label}: ${min}~${max} 범위의 정수를 입력하세요.`);return number;};
const choice=(value: unknown,list: readonly string[],label: string): string=>{if(typeof value!=='string'||!list.includes(value))fail(label+' 값을 확인하세요.');return value;};
export function nodeConfigProfile(input: Record<string,unknown>){
 const p={...configDefaults('nodejs'),...input};
 const port=integer(p.port,'포트',1,65535);
 return `NODE_ENV=${choice(p.environment,['production','development','test'],'실행 환경')}\nPORT=${port}\nHOST=${choice(p.host,['127.0.0.1','::1','0.0.0.0','::'],'앱 수신 주소')}\nNODE_OPTIONS=--max-old-space-size=${integer(p.memory,'Node 메모리',64,65536)}\nLOG_LEVEL=${choice(p.logLevel,['debug','info','warn','error'],'로그 수준')}\n`;
}
