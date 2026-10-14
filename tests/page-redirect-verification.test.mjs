import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPageRedirect} from '../scripts/verification/page-redirect.ts';
test('page verifier accepts exact HTTP and streaming redirects, not arbitrary HTTP 200',async()=>{
 await assertPageRedirect(new Response(null,{status:307,headers:{location:'/login?next=%2Foverview'}}),'/login?next=%2Foverview');
 await assertPageRedirect(new Response('<meta http-equiv="refresh" content="1;url=/login?next=%2Foverview">'),'/login?next=%2Foverview');
 for(const html of ['<main>not redirected</main>','<meta http-equiv="refresh" content="1;url=/wrong">','<div class="console-shell">private</div><meta http-equiv="refresh" content="1;url=/login">']){
  await assert.rejects(assertPageRedirect(new Response(html),'/login'));
 }
});
