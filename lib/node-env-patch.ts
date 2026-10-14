const isRecord=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {nodeConfigProfile} from './node-config-profile.ts';
import {parseNodeEnv,type NodeEnvironmentKey} from './node-env.ts';
const variables: Record<NodeEnvironmentKey,string>={environment:'NODE_ENV',port:'PORT',host:'HOST',memory:'NODE_OPTIONS',logLevel:'LOG_LEVEL'};
const isEnvironmentKey=(key: string): key is NodeEnvironmentKey => Object.hasOwn(variables,key);
export function patchNodeEnv(text: string,changes: unknown): string{
 if(!isRecord(changes)||!Object.keys(changes).length||Object.keys(changes).some(key=>!Object.hasOwn(variables,key)))throw Object.assign(Error('지원하는 Node.js 환경 항목을 선택하세요.'),{status:400});
 // Refuse duplicate or unsupported values of known variables before changing any bytes.
 parseNodeEnv(text);
 const generated=nodeConfigProfile(changes),validated=parseNodeEnv(generated).values;
 const keys=Object.keys(changes).map(key=>{if(!isEnvironmentKey(key))throw Error('지원하는 Node.js 환경 항목을 선택하세요.');return key;});
 const replacements=new Map(keys.map(key=>[variables[key],key==='memory'?'--max-old-space-size='+validated[key]:String(validated[key])]));
 const newline=text.includes('\r\n')?'\r\n':'\n';
 let result=text.replace(/^(\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*)([^\r\n]*)(\r?)$/gm,(line,prefix,key,value,cr)=>{
  if(!replacements.has(key))return line;
  const next=replacements.get(key);replacements.delete(key);const comment=/\s+#.*$/.exec(value)?.[0]||'';
  return prefix+next+comment+cr;
 });
 if(replacements.size){if(result&&!result.endsWith('\n'))result+=newline;result+=[...replacements].map(([key,value])=>key+'='+value+newline).join('');}
 if(new TextEncoder().encode(result).byteLength>262144)throw Object.assign(Error('환경 파일은 최대 256KB까지 저장할 수 있습니다.'),{status:400});
 parseNodeEnv(result);return result;
}
