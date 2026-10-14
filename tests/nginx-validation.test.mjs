import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNginxDraft} from '../lib/nginx-validation.ts';
test('Isolated nginx draft validation rejects operational scope and malformed ports before starting nginx',async()=>{await assert.rejects(validateNginxDraft({version:'existing'}),e=>e.status===400);await assert.rejects(validateNginxDraft({https:true}),e=>e.status===400);await assert.rejects(validateNginxDraft({domain:'fixture.example.com',mode:'proxy',port:true,upstreamPort:3000}),e=>e.status===400);});
