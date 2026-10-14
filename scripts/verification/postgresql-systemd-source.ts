// Preparation only. No SSH, namespace, service or database command is executed.
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import {readRuntimeModule} from '../runtime-source.ts';
const files:Record<string,string>={};
for(const name of adminRuntimeFiles)files[name]=(await readAdminRuntimeModule(name)).toString('base64');
const script='scripts/verification/postgresql-systemd-fixture.mjs';
const fixture=(await readRuntimeModule(script,[script])).toString('utf8');
console.log(JSON.stringify({format:'tastedev-postgresql-systemd-source-v1',files,fixture}));
