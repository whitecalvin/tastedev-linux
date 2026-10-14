// Local source preparation only; no SSH, cluster or authentication execution.
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import {readRuntimeModule} from '../runtime-source.ts';
const files:Record<string,string>={};
for(const name of adminRuntimeFiles)files['runtime/'+name]=(await readAdminRuntimeModule(name)).toString('base64');
files['worker.mjs']=(await readRuntimeModule('scripts/verification/postgresql-scram-worker.mjs',['scripts/verification/postgresql-scram-worker.mjs'])).toString('base64');
console.log(JSON.stringify({format:'tastedev-scram-runtime-v1',files}));
