// Localize diagnostic prose separately from literal paths and identifiers.
export function configNotice<T>(text:T,t:(text:string)=>string):T|string{
 if(typeof text!=='string')return text;
 const translated=t(text);
 if(translated!==text)return translated;
 return text.split(' · ').map(part=>{
  const translatedPart=t(part);
  if(translatedPart!==part)return translatedPart;
  const separator=part.lastIndexOf(': ');
  if(separator<0)return t(part);
  const prefix=part.slice(0,separator+2),message=part.slice(separator+2);
  return prefix+t(message);
 }).join(' · ');
}
