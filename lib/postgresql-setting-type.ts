import metadata from './locales/postgresql-setting-types.json' with {type:'json'};
const types:Readonly<Record<string,string>>=metadata.types;
const enumValues:Readonly<Record<string,readonly string[]>>=metadata.enumValues;
// These are editor hints, not effective server validation. Unknown extension
// or newer-version parameters retain the unrestricted text editor.
export function postgresqlSettingType(name:unknown){
 const key=typeof name==='string'?name.toLowerCase():'';
 return Object.hasOwn(types,key)?types[key]:null;
}

export function postgresqlSettingChoices(name:unknown){
 const key=typeof name==='string'?name.toLowerCase():'';
 if(postgresqlSettingType(name)==='BOOLEAN')return ['on','off'];
 // An empty enum string is a valid PostgreSQL value only when quoted.
 // Keep it distinct from the editor's empty selection used to clear a row.
 return Object.hasOwn(enumValues,key)?enumValues[key].map(value=>value===''?"''":value):[];
}
