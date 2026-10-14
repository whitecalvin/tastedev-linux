type Catalog = Record<string,unknown>;
type Issue = {dataset:string;locale:string;key:string;reason:string};
type Coverage = {translated:number;total:number;missing:number;complete:boolean};
const record=(value:unknown):value is Catalog=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(value:Catalog,key:string)=>Object.hasOwn(value,key)?value[key]:undefined;

export function inspectDescriptionCatalogs(settings:unknown,overrides:unknown,hba:unknown,requestedLanguages:readonly string[]=[]){
  const invalid:Issue[]=[];
  function catalog(value:unknown,dataset:string):Catalog{
    if(record(value))return value;
    invalid.push({dataset,locale:'',key:'',reason:'catalog must be an object'});
    return {};
  }
  const main=catalog(settings,'settings'),extra=catalog(overrides,'overrides'),rules=catalog(hba,'hba');
  function english(value:Catalog,dataset:string){
    const base=own(value,'en');
    if(record(base)&&Object.keys(base).length)return base;
    invalid.push({dataset,locale:'en',key:'',reason:'non-empty English reference required'});
    return {};
  }
  const mainEn=english(main,'settings'),extraEn=english(extra,'overrides'),hbaEn=english(rules,'hba');
  const settingKeys=new Set([...Object.keys(mainEn),...Object.keys(extraEn)]),ruleKeys=new Set(Object.keys(hbaEn));
  const overrideNames=new Map([...settingKeys].map(name=>[name.toLowerCase(),name]));
  const locales=new Set([...Object.keys(main),...Object.keys(extra),...Object.keys(rules),...requestedLanguages]);
  function validate(data:Catalog,dataset:string,keys:Set<string>,paragraphs:boolean){
    const valid=new Map<string,Set<string>>();
    for(const [locale,value] of Object.entries(data)){
      if(!/^[a-z]{2,3}$/.test(locale)){
        invalid.push({dataset,locale,key:'',reason:'invalid language code'});continue;
      }
      if(!record(value)){
        invalid.push({dataset,locale,key:'',reason:'language entries must be an object'});continue;
      }
      const accepted=new Set<string>();valid.set(locale,accepted);
      for(const [key,text] of Object.entries(value)){
        const canonical=dataset==='overrides'?(key===key.toLowerCase()?overrideNames.get(key):undefined):keys.has(key)?key:undefined;
        if(!canonical){
          invalid.push({dataset,locale,key,reason:'unknown setting or help key'});continue;
        }
        const content=paragraphs?(Array.isArray(text)?text:null):[text];
        if(!content?.length||!content.every(item=>typeof item==='string'&&item.trim().length>0)){
          invalid.push({dataset,locale,key,reason:'non-empty text required'});continue;
        }
        if(locale!=='ko'&&content.some(item=>typeof item==='string'&&/[가-힣]/.test(item))){
          invalid.push({dataset,locale,key,reason:'Korean remains outside Korean catalog'});continue;
        }
        accepted.add(canonical);
      }
    }
    return valid;
  }
  const mainValid=validate(main,'settings',new Set(Object.keys(mainEn)),true);
  const extraValid=validate(extra,'overrides',settingKeys,true);
  const hbaValid=validate(rules,'hba',ruleKeys,false);
  const coverage:Record<string,{settings:Coverage;hba:Coverage}>={};
  const count=(translated:number,total:number):Coverage=>({translated,total,missing:total-translated,complete:translated===total});
  for(const locale of [...locales].filter(name=>/^[a-z]{2,3}$/.test(name)).sort()){
    const localExtra=own(extra,locale);
    const translated=[...settingKeys].filter(key=>record(localExtra)&&Object.hasOwn(localExtra,key.toLowerCase())
      ?extraValid.get(locale)?.has(key):mainValid.get(locale)?.has(key)).length;
    coverage[locale]={settings:count(translated,settingKeys.size),hba:count(hbaValid.get(locale)?.size??0,ruleKeys.size)};
  }
  return {status:invalid.length?'FAIL':'PASS',scope:'PostgreSQL description schema and effective source-key coverage; not linguistic or browser acceptance',invalid,coverage};
}
