import type { ReactNode } from 'react';
import {pageSession} from '../../lib/page-session.ts';
import {consoleInitialData} from '../../lib/console-initial-data.ts';
import ConsoleChrome from '../../components/console-chrome';
import ConsoleLoadError from '../../components/console-load-error';
export const dynamic='force-dynamic';
export default async function ConsoleLayout({children}: {children: ReactNode}){
 const session=await pageSession();
 // Each page retains its own exact path/query login redirect and route snapshot.
 if(!session)return children;
 let initialData;
 try{initialData=await consoleInitialData();}
 catch(error){
  if(!(error && typeof error === 'object' && 'status' in error && error.status===503))throw error;
  return <ConsoleChrome initialData={null}><ConsoleLoadError/></ConsoleChrome>;
 }
 return <ConsoleChrome initialData={initialData}>{children}</ConsoleChrome>;
}
