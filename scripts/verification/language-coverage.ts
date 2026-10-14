type Count={translated:number;total:number;missing:number;complete:boolean};
type DescriptionCoverage=Readonly<Record<string,{settings:Count;hba:Count}>>;
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const nonempty=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;

export function inspectLanguageCoverage(languageList:unknown,catalogs:unknown,descriptionCoverage:DescriptionCoverage){
 if(!Array.isArray(languageList)||!object(catalogs)||!Object.hasOwn(catalogs,'en')||!object(catalogs.en))throw Error('Language list and English catalog are required');
 const english=catalogs.en,keys=Object.keys(english);
 if(!keys.length||keys.some(key=>!nonempty(english[key])))throw Error('English reference must contain non-empty messages');
 const bases=new Map<string,string[]>();
 for(const item of languageList){
  if(!object(item)||typeof item.id!=='string'||!nonempty(item.label)||!nonempty(item.flag)||!(/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(item.id)))throw Error('Invalid language entry');
  const base=item.id.split('-')[0],locales=bases.get(base)??[];
  if(locales.includes(item.id))throw Error('Duplicate locale: '+item.id);
  locales.push(item.id);bases.set(base,locales);
 }
 const count=(translated:number,total:number):Count=>({translated,total,missing:total-translated,complete:translated===total});
 const reference=descriptionCoverage.en;if(!reference)throw Error('English description reference required');
 const languages=[...bases].sort(([a],[b])=>a.localeCompare(b,'en')).map(([language,locales])=>{
  const catalog=Object.hasOwn(catalogs,language)&&object(catalogs[language])?catalogs[language]:null;
  const translated=language==='ko'?keys.length:keys.filter(key=>catalog&&Object.hasOwn(catalog,key)&&nonempty(catalog[key])).length;
  const descriptions=Object.hasOwn(descriptionCoverage,language)?descriptionCoverage[language]:{settings:count(0,reference.settings.total),hba:count(0,reference.hba.total)};
  const ui=count(translated,keys.length);
  return{language,locales,ui,postgresql:descriptions,sourceCoverageComplete:ui.complete&&descriptions.settings.complete&&descriptions.hba.complete};
 });
 return{status:languages.every(row=>row.sourceCoverageComplete)?'SOURCE_COVERAGE_COMPLETE':'PARTIAL',localeChoices:languageList.length,baseLanguages:languages.length,uiCompleteLanguages:languages.filter(row=>row.ui.complete).length,uiFallbackLanguages:languages.filter(row=>!row.ui.complete).length,fullSourceLanguages:languages.filter(row=>row.sourceCoverageComplete).length,languages,linguisticQualityVerified:false,browserCoverageVerified:false,deploymentVerified:false};
}
