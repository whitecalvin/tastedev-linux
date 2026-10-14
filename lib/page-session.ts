export type PageSession = {username: string; userId: string; expires: Date; session: unknown};
export type PageSearchParams = Record<string,string | string[] | undefined>;
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {cookieSession} from './auth.ts';
import {isAuthStorageError} from './auth-storage-error.ts';
import {cache} from 'react';
// Share only within one Server Component render. API requests continue to
// authenticate independently; no session is stored across requests/users.
export const pageSession = cache(async (): Promise<PageSession | null> => {
 const incoming=await headers();
 try{return await cookieSession({headers:incoming});}
 catch(error){if(!isAuthStorageError(error))throw error;return null;}
});
export async function requirePageSession(destination: string,searchParams?: PageSearchParams | Promise<PageSearchParams>): Promise<void>{const session=await pageSession();if(!session){const query=new URLSearchParams();for(const [key,value] of Object.entries(await searchParams||{})){for(const item of Array.isArray(value)?value:[value])if(typeof item==='string')query.append(key,item);}const suffix=query.toString();redirect('/login?next='+encodeURIComponent(destination+(suffix?'?'+suffix:'')));}}
