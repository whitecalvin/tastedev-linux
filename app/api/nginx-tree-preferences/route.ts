import {cookieSession} from '../../../lib/auth.ts';
import {saveNginxTreePreferences} from '../../../lib/nginx-tree-preferences.ts';
export const runtime='nodejs';
export async function POST(request: Request){
 const session=await cookieSession(request);
 if(!session)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(origin&&origin!==url.protocol+'//'+(request.headers.get('host')||url.host))return new Response(null,{status:403});
 const text=await request.text();if(text.length>1048576)return new Response(null,{status:413});
 try{const body=JSON.parse(text);if(body.userId!==session.userId)return new Response(null,{status:409});await saveNginxTreePreferences(session.userId,body.expansion);return Response.json({saved:true},{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'트리 상태를 저장하지 못했습니다.'},{status:400});}
}
