import {readRuntimeModule} from '../runtime-source.ts';
import {adminRuntimeFiles} from './runtime-files.mts';
const allowed=adminRuntimeFiles.map(name=>'lib/'+name);
export async function readAdminRuntimeModule(name: string,project=process.cwd()){
 if(!adminRuntimeFiles.includes(name))throw Error('Unapproved admin runtime module');
 return readRuntimeModule('lib/'+name,allowed,project);
}
