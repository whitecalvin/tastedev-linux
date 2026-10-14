import test from 'node:test';
import assert from 'node:assert/strict';
import {orderAiModels} from '../lib/ai-model-order.ts';
const sorted=ids=>orderAiModels(ids.map(id=>({id}))).map(item=>item.id);
test('quality priority distinguishes premium, balanced and lightweight product tiers in a generation',()=>{
 assert.deepEqual(sorted(['gpt-6-luna','gpt-6.1-sol','gpt-6-astra']),['gpt-6-astra','gpt-6.1-sol','gpt-6-luna']);
 assert.deepEqual(sorted(['claude-haiku-5-5','claude-sonnet-5-5','claude-opus-5-5','claude-fable-5-1']),['claude-fable-5-1','claude-opus-5-5','claude-sonnet-5-5','claude-haiku-5-5']);
 assert.deepEqual(sorted(['gemini-3.5-flash-lite','gemini-3.8-flash','gemini-3.1-pro']),['gemini-3.1-pro','gemini-3.8-flash','gemini-3.5-flash-lite']);
});
test('new model versions are recognized without maintaining a fixed model ID catalog',()=>{
 assert.deepEqual(sorted(['gpt-7.1-sol','gpt-6-astra','gpt-7-astra']),['gpt-7-astra','gpt-7.1-sol','gpt-6-astra']);
 assert.deepEqual(sorted(['claude-3-5-sonnet-latest','claude-sonnet-4-6']),['claude-sonnet-4-6','claude-3-5-sonnet-latest']);
});
test('unknown and specialized models remain available after classified analysis models; sorting leaves input intact',()=>{
 const original=[{id:'gpt-image-2.5'},{id:'unknown-vendor-model'},{id:'gpt-6-astra'},{id:'gpt-4o-mini-tts'}];
 assert.equal(orderAiModels(original)[0].id,'gpt-6-astra');assert.equal(orderAiModels(original)[1].id,'unknown-vendor-model');assert.equal(original[0].id,'gpt-image-2.5');assert.equal(orderAiModels(original).length,original.length);
 const records=[{id:'claude-opus-5-5',line:'haiku'},{id:'claude-sonnet-5-5',line:'opus'}];assert.equal(orderAiModels(records)[0].id,'claude-sonnet-5-5');
});
