import {readRuntimeModule} from '../runtime-source.ts';
const file='scripts/verification/postgresql-helper-container.mjs';
console.log(JSON.stringify({format:'tastedev-postgresql-helper-container-source-v1',fixture:(await readRuntimeModule(file,[file])).toString('utf8')}));
