import test from 'node:test';
import assert from 'node:assert/strict';
import {translate,languageCatalog,languageCoverage} from '../lib/i18n.ts';
import {translateWithCatalog} from '../lib/i18n-core.ts';
import {loadLanguageCatalog} from '../lib/i18n-client.ts';

test('inherited locale and message keys never become translation entries or dynamic loaders',async()=>{
 for(const key of ['constructor','__proto__','toString']){
  assert.equal(translate('en',key),key);
  assert.deepEqual(languageCatalog(key),{});
  assert.equal(languageCoverage(key).translatedEntries,0);
  assert.deepEqual(await loadLanguageCatalog(key),{});
 }
 const catalog:Record<string,string>=Object.create({fixture:'inherited-private-value'});
 assert.equal(translateWithCatalog('en','fixture',undefined,catalog,{}),'fixture');
 catalog.fixture='own translation';assert.equal(translateWithCatalog('en','fixture',undefined,catalog,{}),'own translation');
});
