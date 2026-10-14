import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { parseLiveConfig } from '../lib/config-live.ts';
test('Redis helper restoration plan compares supported fields without exposing full credentials and rejects changed graph', async () => {
  const native = createRequire(import.meta.url),
    target = '/etc/redis/redis.conf',
    text = 'port 6379\nrequirepass current-private-secret\n',
    restored = 'port 6380\nrequirepass restored-private-secret\n';
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  const record = {
    id: 'fixture-id',
    target,
    text: restored,
    version: hash(restored),
    createdAt: '2026-10-03T00:00:00Z',
  };
  const source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
  for (const changed of [false, true]) {
    let reads = 0;
    const runtime = {
      redisBackupRecord: async () => record,
      parseLiveConfig,
      trusted: () => Buffer.from(text),
      redisTopology: async (root, base, overrides) => ({
        complete: true,
        version: overrides ? 'restored-graph' : changed && ++reads > 1 ? 'changed' : 'original-graph',
        files: [{ path: target, version: hash(overrides ? restored : text) }],
      }),
    };
    const context = vm.createContext({
      require: native,
      process,
      Buffer,
      __dirname: '/tmp/fixture',
      fixtureRuntime: runtime,
    });
    vm.runInContext(source, context);
    vm.runInContext('rootDir=()=>{};mariaRuntime=async()=>fixtureRuntime;', context);
    const operation = vm.runInContext("redisRestorePlan({id:'fixture-id'})", context);
    if (changed) {
      await assert.rejects(operation, /graph changed/);
      continue;
    }
    const result = await operation;
    assert.equal(result.fields[0].before, 6379);
    assert.equal(result.fields[0].after, 6380);
    assert.equal(result.changed, true);
    assert.equal(result.backupVersion, record.version);
    assert(!JSON.stringify(result).includes('private-secret'));
    assert(!Object.hasOwn(result, 'text'));
  }
});
