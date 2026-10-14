// This is the application process clock, not a claim about cron daemon configuration.
export function cronContext(text: string,now=new Date(),timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone){
 const declarations=[];for(const [index,line] of text.split('\n').entries()){const match=/^\s*(CRON_TZ|TZ)\s*=\s*(.*?)\s*$/.exec(line);if(match)declarations.push({line:index+1,name:match[1],value:match[2].slice(0,256)});}
 return {observedAt:now.toISOString(),processTimeZone:timeZone,declarations};
}
export function cronCommandHasInputSeparator(command: string){
 let escaped=false;for(const character of command){if(escaped){escaped=false;continue;}if(character==='\\'){escaped=true;continue;}if(character==='%')return true;}return false;
}
