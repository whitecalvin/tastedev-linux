export function nginxSettingParts(label=''){
 const text=label.trim();let quote='',escaped=false,index=0;
 for(;index<text.length;index++){const char=text[index];if(escaped){escaped=false;continue;}if(char==='\\'){escaped=true;continue;}if(quote){if(char===quote)quote='';continue;}if(char==='"'||char==="'"){quote=char;continue;}if(/\s/.test(char))break;}
 return {name:text.slice(0,index),value:text.slice(index).trimStart()};
}
export function validNginxSettingName(name: unknown,context: string | null | undefined): name is string{
 if(typeof name!=='string'||name.length>128)return false;
 if(context!==null&&context!==undefined&&['map','geo','split_clients'].includes(context)){
  if(!name||nginxSettingParts(name).value)return false;
  let quote='',escaped=false;
  for(const char of name){if(/[\r\n\0]/.test(char))return false;if(escaped){escaped=false;continue;}if(char==='\\'){escaped=true;continue;}if(quote){if(char===quote)quote='';continue;}if(char==='"'||char==="'"){quote=char;continue;}if(/[;{}#\s]/.test(char))return false;}
  return !quote&&!escaped;
 }
 return context==='types'?name==='include'||/^[A-Za-z0-9][A-Za-z0-9.+_-]*\/[A-Za-z0-9][A-Za-z0-9.+_-]*$/.test(name):/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
