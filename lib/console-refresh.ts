import type {ConsoleStatus,SecurityPolicy} from '../components/console-types';
interface RefreshApi {(action:'status'):Promise<ConsoleStatus>; (action:'security'):Promise<SecurityPolicy>;}
export function consoleRefreshGuard(){
 let generation=0;
 return {
  invalidate(){generation++;},
  async refresh(api:RefreshApi,publish:(status:ConsoleStatus,policy:SecurityPolicy)=>void){
   const request=++generation;
   let data,policy;
   try{[data,policy]=await Promise.all([api('status'),api('security')]);}
   catch(error){if(request!==generation)return null;throw error;}
   if(request!==generation)return null;
   publish(data,policy);return data;
  },
 };
}
