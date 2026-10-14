const pages=new Set(['overview','packages','daemon','logs','recovery','audit','ide','terminal','security','settings']);
const packages=new Set(['nginx','certbot','nodejs','postgresql','mariadb','redis']);
export function consoleRoute(view:string,selectedPackage:string | null=null){
 if(['ide','server-settings'].includes(view)&&selectedPackage!==null&&packages.has(selectedPackage))return '/ide/packages/'+selectedPackage;
 return view==='server-settings'?'/ide/packages/nginx':pages.has(view)?'/'+view:'/overview';
}

export function packageConsoleView(kind:string){return ['nginx','certbot'].includes(kind)?'server-settings':'ide';}

export function servicePackageRoute(unit:string){
 const kind=({'nginx.service':'nginx','certbot.timer':'certbot','certbot.service':'certbot','postgresql.service':'postgresql','mariadb.service':'mariadb','redis-server.service':'redis'} as Record<string,string>)[unit]||(/^postgresql@[1-9][0-9]?-[a-zA-Z0-9][a-zA-Z0-9_-]{0,254}\.service$/.test(unit)?'postgresql':null);
 return kind!==null&&packages.has(kind)?consoleRoute('ide',kind):null;
}
