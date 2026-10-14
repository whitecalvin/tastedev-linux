import assert from 'node:assert/strict';

// Next.js streaming redirects use a refresh meta tag after headers are sent.
// Require the exact destination and reject a rendered authenticated shell.
export async function assertPageRedirect(response:Response,destination:string){
 if(response.status===307){assert.equal(response.headers.get('location'),destination);return;}
 assert.equal(response.status,200,'Expected HTTP or streamed page redirect');
 const html=await response.text();
 const refresh=[...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag])=>tag).find(tag=>/http-equiv=["']refresh["']/i.test(tag));
 assert(refresh,'Stream must contain a refresh redirect');
 const content=/\bcontent=["']([^"']*)["']/i.exec(refresh)?.[1]?.replaceAll('&amp;','&');
 assert(content,'Refresh must include a content value');
 assert.match(content,/^\d+;\s*url=/i);
 assert.equal(content.replace(/^\d+;\s*url=/i,''),destination);
 assert(!/class=["'][^"']*\bconsole-shell\b/.test(html),'Unauthenticated stream must not expose the console shell');
}
