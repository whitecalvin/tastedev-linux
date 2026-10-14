import type { PackagePageProps } from '../../../../route-types';
import {nodeWorkspaceTree} from '../../../../../lib/node-workspace-tree.ts';
import {packageConsoleView} from '../../../../../lib/console-route.ts';
import ConsoleWorkspace from '../../../../../components/console-workspace';
import {requirePageSession} from '../../../../../lib/page-session.ts';
import {initialStatus,initialSecurity,initialServices} from '../../../../../lib/console-initial-data.ts';
import {nginxTree} from '../../../../../lib/nginx-tree.ts';
import {liveConfig} from '../../../../../lib/config-live.ts';
import {managedSites,certificates} from '../../../../../lib/site-status.ts';
import {nodeApps} from '../../../../../lib/node-apps.ts';
import {notFound} from 'next/navigation';
export default async function Page({params,searchParams}: PackagePageProps){const {package:kind}=await params;if(!['nginx','certbot','nodejs','postgresql','mariadb','redis'].includes(kind))notFound();await requirePageSession('/ide/packages/'+kind,searchParams);let initialData=null;
 if(kind==='nginx'){
  const [status,security,tree,live,services]=await Promise.all([initialStatus(),initialSecurity(),nginxTree(),managedSites(),initialServices('nginx.service')]);
  initialData={status,security,nginx:{tree,sites:live.sites,service:services.find(item=>item.unit==='nginx.service')??{ActiveState:'unknown'}}};
 }else if(['certbot','postgresql','redis','mariadb'].includes(kind)){
  const unit=kind==='certbot'?'certbot.timer':kind==='redis'?'redis-server.service':kind==='mariadb'?'mariadb.service':'postgresql.service';
  const [status,security,config,services]=await Promise.all([initialStatus(),initialSecurity(),kind==='certbot'?certificates():liveConfig(kind),initialServices(unit)]);
  initialData={status,security,packageIde:{kind,files:'certificates' in config ? config.certificates : 'configs' in config ? config.configs : [],service:services.find(item=>item.unit===unit)??null,error:('warnings' in config ? config.warnings : [config.warning]).filter(Boolean).join(' · ')}};
 }else{
  const [status,security,apps,workspace]=await Promise.all([initialStatus(),initialSecurity(),nodeApps().catch((error: unknown)=>({apps:[],error:error instanceof Error ? error.message : String(error)})),nodeWorkspaceTree().catch((error: unknown)=>({root:'',files:[],error:error instanceof Error ? error.message : String(error)}))]);
  initialData={status,security,nodeIde:{...apps,workspace}};
 }
 return <ConsoleWorkspace embedded view={packageConsoleView(kind)} selectedPackage={kind} initialData={initialData}/>;}
