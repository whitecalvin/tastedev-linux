import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectLanguageCoverage} from '../scripts/verification/language-coverage.ts';
const complete={translated:2,total:2,missing:0,complete:true};
const descriptions={en:{settings:complete,hba:complete},ko:{settings:complete,hba:complete},cs:{settings:complete,hba:complete}};
const item=(id:string)=>({id,label:id,flag:'🌐'});

test('Language coverage distinguishes selectable locales from actual complete translations',()=>{
 const result=inspectLanguageCoverage([item('ko'),item('en'),item('cs-CZ'),item('cs-SK'),item('sk-SK')],{en:{a:'one',b:'two'},cs:{a:'jedna',b:'dva'}},descriptions);
 assert.equal(result.status,'PARTIAL');assert.equal(result.localeChoices,5);assert.equal(result.baseLanguages,4);assert.equal(result.uiCompleteLanguages,3);assert.equal(result.fullSourceLanguages,3);
 assert.deepEqual(result.languages.find(row=>row.language==='cs')?.locales,['cs-CZ','cs-SK']);
 const fallback=result.languages.find(row=>row.language==='sk');assert.equal(fallback?.ui.missing,2);assert.equal(fallback?.postgresql.settings.missing,2);assert.equal(fallback?.sourceCoverageComplete,false);
 assert.equal(result.linguisticQualityVerified,false);assert.equal(result.browserCoverageVerified,false);assert.equal(result.deploymentVerified,false);
});

test('Partial UI and description coverage cannot be mistaken for complete support',()=>{
 const result=inspectLanguageCoverage([item('cs')],{en:{a:'one',b:'two'},cs:{a:'jedna',b:' '}},{...descriptions,cs:{settings:{...complete,translated:1,missing:1,complete:false},hba:complete}});
 assert.equal(result.languages[0].ui.translated,1);assert.equal(result.languages[0].ui.complete,false);assert.equal(result.status,'PARTIAL');
});

test('Coverage input rejects malformed reference and duplicated locales',()=>{
 assert.throws(()=>inspectLanguageCoverage([item('en'),item('en')],{en:{a:'one'}},descriptions),/Duplicate locale/);
 assert.throws(()=>inspectLanguageCoverage([item('__proto__')],{en:{a:'one'}},descriptions),/Invalid language/);
 assert.throws(()=>inspectLanguageCoverage([item('en')],{en:{a:''}},descriptions),/non-empty/);
 assert.throws(()=>inspectLanguageCoverage(null,{en:{a:'one'}},descriptions),/required/);
});

test('Full source coverage still does not claim linguistic, browser or deployment acceptance',()=>{
 const result=inspectLanguageCoverage([item('en'),item('ko')],{en:{a:'one',b:'two'}},descriptions);
 assert.equal(result.status,'SOURCE_COVERAGE_COMPLETE');assert.equal(result.uiFallbackLanguages,0);assert.equal(result.deploymentVerified,false);
});
