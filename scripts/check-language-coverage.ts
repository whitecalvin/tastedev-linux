import {readFile,readdir} from 'node:fs/promises';
import {inspectDescriptionCatalogs} from './verification/description-catalog.ts';
import {inspectLanguageCoverage} from './verification/language-coverage.ts';
const read=async(name:string):Promise<unknown>=>JSON.parse(await readFile('lib/locales/'+name+'.json','utf8'));
const catalogs:Record<string,unknown>={};
for(const file of (await readdir('lib/locales')).filter(name=>/^[a-z]{2,3}\.json$/.test(name)))catalogs[file.slice(0,-5)]=await read(file.slice(0,-5));
const descriptions=inspectDescriptionCatalogs(await read('postgresql-descriptions'),await read('postgresql-description-overrides'),await read('postgresql-hba-descriptions'));
if(descriptions.status!=='PASS')throw Error('Description catalog schema failed');
const result=inspectLanguageCoverage(await read('linux-languages'),catalogs,descriptions.coverage);
console.log(JSON.stringify(result,null,2));
// Report partial support without disguising it as complete. Strict mode is a release gate.
if(process.argv.includes('--require-complete')&&result.status!=='SOURCE_COVERAGE_COMPLETE')process.exitCode=1;
