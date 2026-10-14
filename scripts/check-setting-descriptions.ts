import {readFile,readdir} from 'node:fs/promises';
import {inspectDescriptionCatalogs} from './verification/description-catalog.ts';

const read=async(name:string):Promise<unknown>=>JSON.parse(await readFile('lib/locales/'+name+'.json','utf8'));
const result=inspectDescriptionCatalogs(
  await read('postgresql-descriptions'),
  await read('postgresql-description-overrides'),
  await read('postgresql-hba-descriptions'),
  ['ko',...(await readdir('lib/locales')).filter(name=>/^[a-z]{2,3}\.json$/.test(name)).map(name=>name.slice(0,-5))],
);
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
