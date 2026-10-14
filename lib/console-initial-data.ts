import {cache} from 'react';
import {serviceStatus,permissions} from './operations.ts';
import {getStatus} from './packages.ts';
import {securitySettings} from './security.ts';

// React cache is request-scoped: share layout/page reads, never authorization
// or policy snapshots across different requests.
export const initialStatus=cache(()=>getStatus({reuseInventory:true}));
export const initialSecurity=cache(()=>securitySettings());
export const initialServices=cache((unit?:string)=>serviceStatus(unit===undefined?undefined:{unit}));

// Call only after requirePageSession. These are the same public snapshots used
// by the authenticated status/security endpoints and the package IDE routes.
export async function consoleInitialData({operations=false}={}){
 const [status,security,operationSnapshot]=await Promise.all([initialStatus(),initialSecurity(),operations?initialServices().then(services=>({services,permissions:permissions(),warnings:services.warnings||[]})):null]);
 return {status,security,...(operations?{operations:operationSnapshot}:{})};
}
