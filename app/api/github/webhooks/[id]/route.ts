import {receiveGitHubWebhook} from '../../../../../lib/github-webhooks.ts';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const reply=(data:unknown,status:number)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 try{if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'application/json만 지원합니다.'},415);const reader=request.body?.getReader();if(!reader)return reply({error:'본문이 필요합니다.'},400);const chunks:Uint8Array[]=[];let size=0;while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>2*1024*1024){await reader.cancel();return reply({error:'본문 제한을 초과했습니다.'},413);}chunks.push(v.value);}
 return reply(await receiveGitHubWebhook((await params).id,Buffer.concat(chunks),request.headers),202);
 }catch(e){const error=e as {status?:number;code?:string};return reply({error:'Webhook 요청을 처리하지 못했습니다. 서명·경로·서버 허용 설정을 확인하세요.'},error.status??(error.code==='ENOENT'?404:500));}
}
