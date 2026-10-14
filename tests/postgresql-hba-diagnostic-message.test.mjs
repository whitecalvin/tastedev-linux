import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {postgresqlHbaDiagnosticMessage} from '../lib/postgresql-hba.ts';
test('every native and include-graph HBA diagnostic has a Korean action message',async()=>{
 const native=await readFile(new URL('../lib/postgresql-hba-validation.ts',import.meta.url),'utf8');
 const graph=await readFile(new URL('../lib/postgresql-hba-graph.ts',import.meta.url),'utf8');
 const codes=new Set([...native.matchAll(/'((?:invalid|missing)-[a-z-]+)'/g),...graph.matchAll(/(?:reason:|\?|'\s*:\s*)\s*'([a-z-]+)'/g)].map(match=>match[1]));
 for(const code of ['cycle-or-limit','missing-file','unsafe-or-unreadable','token-limit','unsafe-list-reference','missing-directory','unsafe-include-reference','changed-during-inspection','directory-changed','optional-file-appeared','optional-file-unreadable'])codes.add(code);
 assert.equal(codes.size,16);
 for(const code of codes){const text=postgresqlHbaDiagnosticMessage(code);assert.match(text,/[가-힣]/);assert(!text.includes('검수하지 못했습니다.'),code);assert(text.length>25,code);}
});
test('unexpected native diagnostic content is never printed as a user explanation',()=>{
 const fallback=postgresqlHbaDiagnosticMessage('unknown');
 for(const code of ['secret=password', '__proto__', 'constructor', null, undefined])assert.equal(postgresqlHbaDiagnosticMessage(code),fallback);
 assert(!fallback.includes('secret'));
});
