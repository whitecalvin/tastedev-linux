import {readRuntimeModule} from '../runtime-source.ts';
const file='scripts/verification/postgresql-hba-lifecycle.mjs';
console.log(JSON.stringify({format:'tastedev-postgresql-hba-lifecycle-source-v1',fixture:(await readRuntimeModule(file,[file])).toString('utf8')}));
