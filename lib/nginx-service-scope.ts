const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail: ()=>never=()=>{throw Object.assign(Error('Nginx service startup configuration requires review'),{status:409});};
// Values must come from the verified native binary's nginx -V output.
export function nginxBuildScope(text: unknown){
 if(typeof text!=='string'||text.length>65536||text.includes('\0'))fail();
 const value=(name: string)=>{const matches=[...text.matchAll(new RegExp('(?:^|\\s)--'+name+'=(?:\'([^\']+)\'|"([^"]+)"|([^\\s]+))','g'))];if(matches.length!==1)fail();return matches[0][1]||matches[0][2]||matches[0][3];};
 const main=value('conf-path'),prefix=value('prefix');if(main!=='/etc/nginx/nginx.conf'||!/^\/[a-zA-Z0-9_/-]+$/.test(prefix)||prefix.split('/').some(part=>part==='..'||part==='.'))fail();return {main,prefix};
}
// Proc title decoding is limited to unambiguous fixed-path arguments and the
// known Debian global daemon/master directives. Caller must verify /proc/exe.
function masterArguments(argv: string[]){
 if(argv.length!==1||!argv[0].startsWith('nginx: master process '))return argv;
 const title=argv[0].slice(22),global=title.indexOf(' -g '),head=global<0?title:title.slice(0,global),args=head.split(' ');if(args.some(value=>!value))fail();
 if(global>=0)args.push('-g',title.slice(global+4));return args;
}
export function nginxServiceScope(argv: unknown,build: unknown){
 if(!Array.isArray(argv)||!argv.length||argv.length>20||!argv.every((value: unknown): value is string=>typeof value==='string'&&value.length<=4096&&!value.includes('\0'))||!object(build)||build.main!=='/etc/nginx/nginx.conf'||typeof build.prefix!=='string')fail();
 const args=masterArguments(argv);if(args[0]!=='/usr/sbin/nginx')fail();let main=build.main,prefix=build.prefix;const seen=new Set<string>();
 for(let index=1;index<args.length;index++){const option=args[index],value=args[++index];if(seen.has(option)||typeof value!=='string')fail();seen.add(option);
  if(option==='-c'&&value==='/etc/nginx/nginx.conf'){main=value;continue;}
  if(option==='-p'&&(value===build.prefix||value===build.prefix+'/')){prefix=build.prefix;continue;}
  if(option==='-e'&&value==='stderr')continue;
  if(option==='-g'&&/^(?:daemon (?:on|off);\s*)?(?:master_process on;\s*)?$/.test(value)&&value.trim())continue;
  fail();
 }
 return {mode:seen.has('-c')?'explicit-main':'compiled-main',main,prefix,processTitle:args!==argv};
}
