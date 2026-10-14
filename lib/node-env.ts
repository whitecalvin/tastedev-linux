export type NodeEnvironmentKey = 'environment' | 'port' | 'host' | 'memory' | 'logLevel';
export type NodeEnvironmentValues = Partial<Record<NodeEnvironmentKey,string | number>>;
type VariableKey = 'NODE_ENV' | 'PORT' | 'HOST' | 'NODE_OPTIONS' | 'LOG_LEVEL';
// Import only GUI-supported values; never evaluate shell syntax or retain other variables.
const fields: Record<VariableKey,NodeEnvironmentKey>={NODE_ENV:'environment',PORT:'port',HOST:'host',NODE_OPTIONS:'memory',LOG_LEVEL:'logLevel'};
const choices: Partial<Record<VariableKey,string[]>>={NODE_ENV:['production','development','test'],HOST:['127.0.0.1','::1','0.0.0.0','::'],LOG_LEVEL:['debug','info','warn','error']};
const isVariableKey = (key: string): key is VariableKey => Object.hasOwn(fields,key);
export function parseNodeEnv(text: unknown): {values: NodeEnvironmentValues; skipped: number}{
 if(typeof text!=='string'||text.length>262144||text.includes('\0'))throw Error('환경 파일 형식을 확인하세요.');
 const values: NodeEnvironmentValues={},seen=new Set<string>();let skipped=0;
 for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const match=/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
  if(!match||!isVariableKey(match[1])){skipped++;continue;}
  const [,key]=match;if(seen.has(key))throw Error('지원 환경 변수에 중복 항목이 있습니다.');seen.add(key);
  let value=match[2].trim();
  if(value.startsWith('"')||value.startsWith("'")){const quote=value[0],end=value.indexOf(quote,1);if(end<0||!/^\s*(?:#.*)?$/.test(value.slice(end+1)))throw Error('지원 환경 변수의 값 형식을 확인하세요.');value=value.slice(1,end);}
  else value=value.replace(/\s+#.*$/,'').trim();
  if(choices[key]){if(!choices[key]!.includes(value))throw Error('지원 환경 변수의 값 형식을 확인하세요.');values[fields[key]]=value;}
  else {const number=key==='PORT'?value:/^--max-old-space-size=(\d+)$/.exec(value)?.[1];if(!number||!/^\d+$/.test(number))throw Error('포트와 Node 메모리는 지원하는 정수 형식으로 입력하세요.');const n=Number(number),min=key==='PORT'?1:64,max=key==='PORT'?65535:65536;if(n<min||n>max)throw Error('포트 또는 Node 메모리 범위를 확인하세요.');values[fields[key]]=n;}
 }
 return {values,skipped};
}

export async function readNodeEnvFile(file: {size: number; arrayBuffer: () => Promise<ArrayBuffer>}): Promise<string>{
 if(!file||!Number.isInteger(file.size)||file.size<0||file.size>262144||typeof file.arrayBuffer!=='function')throw Error('UTF-8 환경 파일은 최대 256KB까지 불러올 수 있습니다.');
 try{const bytes=await file.arrayBuffer();if(bytes.byteLength>262144)throw Error();const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))throw Error();return text;}
 catch{throw Error('UTF-8 환경 파일을 읽을 수 없습니다.');}
}

export function nodeEnvironmentValue(values: NodeEnvironmentValues,key: string){if(key==='environment'||key==='port'||key==='host'||key==='memory'||key==='logLevel')return values[key];return undefined;}
