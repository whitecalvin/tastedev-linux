import {cookieSession} from '../../../lib/auth.ts';
import {isAuthStorageError,authStorageMessage} from '../../../lib/auth-storage-error.ts';
import {githubSnapshot,connectGitHub,disconnectGitHub,githubRepositories,verifyGitHub,githubProject} from '../../../lib/github.ts';
import {securitySettings,auditEvent} from '../../../lib/security.ts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function failure(error:unknown){
 if(isAuthStorageError(error))return reply({error:authStorageMessage},503);
 const e=error as {status?:number;message?:string};
 return typeof e?.status==='number'&&e.status>=400&&e.status<=599?reply({error:e.message},e.status):reply({error:'GitHub 연결 요청을 처리하지 못했습니다.'},500);
}
export async function GET(request:Request){
 try{
  if(!await cookieSession(request))return reply({error:'로그인이 필요합니다.'},401);
  const url=new URL(request.url);
  if(url.searchParams.get('view')==='repositories')return reply(await githubRepositories(Number(url.searchParams.get('page')||'1'),url.searchParams.get('version')||''));
  if(url.searchParams.get('view')==='project')return reply(await githubProject(url.searchParams.get('repository')||'',url.searchParams.get('version')||'',url.searchParams.get('revision')||''));
  return reply(githubSnapshot());
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 try{
  if(!await cookieSession(request))return reply({error:'로그인이 필요합니다.'},401);
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==url.protocol+'//'+(request.headers.get('host')||url.host))return reply({error:'다른 사이트의 요청은 허용하지 않습니다.'},403);
  if((await securitySettings()).settings.readOnly)return reply({error:'조회 전용 모드에서는 GitHub 계정 연결을 변경할 수 없습니다.'},403);
  const reader=request.body?.getReader();if(!reader)return reply({error:'요청 내용을 확인하세요.'},400);
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();return reply({error:'요청 크기가 너무 큽니다.'},413);}chunks.push(value);}
  let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply({error:'요청 형식을 확인하세요.'},400);}
  if(data?.action==='verify')return reply(await verifyGitHub(data));
  if(data?.action!=='connect'&&data?.action!=='disconnect')return reply({error:'지원하지 않는 GitHub 연결 작업입니다.'},400);
  const snapshot=await(data.action==='connect'?connectGitHub(data):disconnectGitHub(data));
  // Never record tokens or request bodies in the audit log.
  try{await auditEvent('github-'+data.action,'saved',true);}catch{console.error('[LINUX] GitHub audit record write failed');}
  return reply(snapshot);
 }catch(error){return failure(error);}
}
