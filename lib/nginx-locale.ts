export type NginxValidationLocale = Readonly<Partial<Record<'LC_ALL'|'LC_COLLATE'|'LANG',string>>>;
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function nginxValidationLocale(input: unknown): NginxValidationLocale{
 if(!object(input)||Object.keys(input).some(key=>!['LC_ALL','LC_COLLATE','LANG'].includes(key))||Object.values(input).some(value=>typeof value!=='string'||value.length>128||!/^[a-zA-Z0-9_.@-]*$/.test(value)))throw Object.assign(Error('Invalid nginx validation locale'),{status:409});const locale: Partial<Record<'LC_ALL'|'LC_COLLATE'|'LANG',string>>={};for(const key of ['LC_ALL','LC_COLLATE','LANG'] as const){const value=input[key];if(typeof value==='string')locale[key]=value;}return Object.freeze(locale);
}
