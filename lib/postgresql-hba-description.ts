import catalogs from './locales/postgresql-hba-descriptions.json' with {type:'json'};

const descriptions:Readonly<Record<string,Record<string,string>>>=catalogs;
// Help is separate from syntax: PostgreSQL option names and source stay intact.
export function postgresqlHbaDescription(key:unknown,locale:unknown='ko'){
 const name=typeof key==='string'?key:'';
 const language=String(locale).toLowerCase().split(/[-_]/)[0];
 const local=Object.hasOwn(descriptions,language)&&Object.hasOwn(descriptions[language],name)?descriptions[language][name]:null;
 const text=local||(Object.hasOwn(descriptions.en,name)?descriptions.en[name]:'');
 return {text,language:local?language:'en',translated:Boolean(local)};
}
