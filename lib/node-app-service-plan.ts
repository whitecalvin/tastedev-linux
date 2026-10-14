import {nodeAppRuntime} from './node-app-runtime.ts';
import {nodeApps} from './node-apps.ts';
import {nodeAppFiles} from './node-app-files.ts';
import {nodeAppUnit,nodeAppServiceOptions} from './node-app-unit.ts';
const conflict: ()=>never=()=>{throw Object.assign(Error('앱 목록이 변경되었습니다. 다시 조회하세요.'),{status:409});};
export async function nodeAppServicePlan(id: unknown,options: unknown={}){
 if(typeof id!=='string')throw Object.assign(Error('등록한 앱을 선택하세요.'),{status:404});
 const serviceOptions=nodeAppServiceOptions(options);
 const registry=await nodeApps(),app=registry.apps.find(item=>item.id===id);
 if(!app)throw Object.assign(Error('등록한 앱을 선택하세요.'),{status:404});
 const files=await nodeAppFiles(id);
 if(registry.version!==files.registryVersion)conflict();
 if(!files.ready)throw Object.assign(Error('등록 앱 파일 상태를 먼저 확인하세요.'),{status:400});
 const runtime=await nodeAppRuntime();
 // Runtime probing is asynchronous. Bind the displayed unit to files and the
 // registration that are still present after the probe, not an earlier snapshot.
 const current=await nodeAppFiles(id),latest=await nodeApps();
 if(latest.version!==registry.version||current.registryVersion!==registry.version||!current.ready||current.directory!==files.directory||JSON.stringify(current.files.map(({name,version,mode})=>({name,version,mode})))!==JSON.stringify(files.files.map(({name,version,mode})=>({name,version,mode}))))conflict();
 return {runtime,id,unit:app.unit,registryVersion:registry.version,files:files.files.map(({name,version})=>{if(typeof name!=='string'||typeof version!=='string')conflict();return {name,version};}),serviceOptions,text:nodeAppUnit(app,process.getuid?.()??0,serviceOptions),notice:'서비스 설정 검토입니다. 서비스 설치·시작·자동 시작 설정은 아직 적용되지 않습니다.'+(runtime.status==='ready'?' Node 환경 파일 옵션을 지원하는 버전을 확인했습니다.':runtime.status==='missing'?' /usr/bin/node 실행 파일이 없어 현재 설정으로 실행할 수 없습니다.':runtime.status==='unsupported'?' 설치된 Node 버전이 환경 파일 옵션을 지원하지 않습니다.':' Node 실행 파일의 안전성 또는 버전을 확인할 수 없습니다.')};
}
