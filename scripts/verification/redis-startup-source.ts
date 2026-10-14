import {readRuntimeModule} from '../runtime-source.ts';
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
const file='scripts/fixtures/redis-startup-worker.mjs',allowed=[file,...adminRuntimeFiles.map(name=>'lib/'+name)];
let fixture=(await readRuntimeModule(file,allowed)).toString('utf8');
fixture=fixture.replace(/from (["'])\.\.\/\.\.\/lib\/([^"']+)\1/g,(_match:string,_quote:string,name:string)=>{if(!adminRuntimeFiles.includes(name))throw Error('검수 runtime 모듈을 확인하세요.');return 'from '+JSON.stringify('/usr/lib/tastedev-linux/scripts/admin/runtime/'+name);});
fixture=fixture.replace('/mnt/source/lib/redis-code-operation.ts','/usr/lib/tastedev-linux/scripts/admin/runtime/redis-code-operation.mjs');
fixture=fixture.replace(/fs\.writeFileSync\((["'])\/mnt\/evidence\/result\.json\1,\s*/,'console.log(');
if(process.argv.includes('--helper')){if(!fixture.includes('const fixtureHelperMode = false;'))throw Error('검수 모드 표시를 확인하세요.');fixture=fixture.replace('const fixtureHelperMode = false;','const fixtureHelperMode = true;');}
console.log(JSON.stringify({format:'tastedev-redis-startup-source-v1',fixture,helper:process.argv.includes('--helper')}));
