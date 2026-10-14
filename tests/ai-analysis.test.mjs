import test, {beforeEach,afterEach} from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {aiSettings,saveAiSettings} from '../lib/ai-settings.ts';
let fixtureRoot,previousRoot;
beforeEach(async()=>{previousRoot=process.env.LINUX_AI_SETTINGS_ROOT;fixtureRoot=await mkdtemp(join('/mnt/data/build/tastedev-linux','ai-analysis-'));process.env.LINUX_AI_SETTINGS_ROOT=fixtureRoot;});
afterEach(async()=>{if(previousRoot===undefined)delete process.env.LINUX_AI_SETTINGS_ROOT;else process.env.LINUX_AI_SETTINGS_ROOT=previousRoot;await rm(fixtureRoot,{recursive:true,force:true});});
async function enableFixture(){await saveAiSettings({...aiSettings(),enabled:true,model:'fixture-model',apiKey:'test-only',clearKey:false});}
import assert from 'node:assert/strict';
import { redactLog, validateAnalysis, analyzeLog } from '../lib/ai-analysis.ts';
test('quota and transient request limits have distinct Korean guidance without provider details', async () => {
  const saved={enabled:process.env.LINUX_ENABLE_AI,key:process.env.OPENAI_API_KEY};
  try {
    await enableFixture();
    for(const code of ['insufficient_quota','rate_limit_exceeded','unknown']) {
      const api=await import('../lib/ai-analysis.ts?error='+code);
      await assert.rejects(api.analyzeLog({text:'fixture',source:'test',confirm:true},async()=>Response.json({error:{code,message:'private provider detail'}},{status:429})),error=>{
        assert.equal(error.status,502);assert.equal(error.providerStatus,429);
        assert.equal(error.providerCode,code==='unknown'?undefined:code);
        assert.ok(!error.message.includes('private provider detail'));
        assert.match(error.message,code==='insufficient_quota'?/크레딧/:code==='rate_limit_exceeded'?/요청 제한/:/사용 한도/);
        return true;
      });
    }
  } finally {
    for(const [name,value] of [['LINUX_ENABLE_AI',saved.enabled],['OPENAI_API_KEY',saved.key]]) {
      if(value===undefined)delete process.env[name];else process.env[name]=value;
    }
  }
});
test('log preview masks common secrets and rejects excessive payloads', () => {
  const text = redactLog(
    'password=hunter2 token="secret" Authorization: Bearer sk-abcdef postgresql://user:pass@localhost/db',
  );
  assert.ok(!text.includes('hunter2'));
  assert.ok(!text.includes('"secret"'));
  assert.ok(!text.includes('sk-abcdef'));
  assert.ok(!text.includes(':pass@'));
  assert.throws(() => validateAnalysis({ text: 'a'.repeat(16001), source: 'test' }));
  assert.equal(validateAnalysis({text:'test',source:'postgresql://user:private@localhost/db'}).source,'postgresql://user:[REDACTED]@localhost/db');
});
test('AI does not send logs without server enable and explicit confirmation', async () => {
  process.env.LINUX_ENABLE_AI = 'false';
  await assert.rejects(analyzeLog({ text: 'test', source: 'test', confirm: true }), (e) => e.status === 403);
  await enableFixture();
  await assert.rejects(analyzeLog(null), (e) => e.status === 400);
  await assert.rejects(analyzeLog({ text: 'test', source: 'test', confirm: false }), (e) => e.status === 400);
});
test('AI request fixes endpoint disables storage masks input and handles message outputs', async () => {
  await enableFixture();
  const response = await analyzeLog(
    { text: 'password=secret test error', source: 'token=source-secret', confirm: true },
    async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.ok(!body.input.includes('password=secret'));
      assert.ok(!body.input.includes('source-secret'));
      assert.equal(body.tools, undefined);
      return Response.json({
        status: 'completed',
        output: [
          { type: 'reasoning' },
          { type: 'message', content: [{ type: 'output_text', text: '설정 경로를 확인하세요.' }] },
        ],
      });
    },
  );
  assert.match(response.analysis, /설정/);
  delete process.env.OPENAI_API_KEY;
  process.env.LINUX_ENABLE_AI = 'false';
});
