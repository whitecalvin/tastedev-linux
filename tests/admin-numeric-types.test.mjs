import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const source = readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0];
test('Privileged helper independently rejects numeric coercion before filesystem or process access', () => {
  const native = createRequire(import.meta.url);
  let accessed = 0;
  const context = vm.createContext({
    process,
    Buffer,
    require(name) {
      if (name === 'node:fs')
        return new Proxy(
          {},
          {
            get() {
              accessed++;
              throw Error('Unexpected filesystem access');
            },
          },
        );
      if (name === 'node:child_process')
        return {
          execFileSync() {
            accessed++;
            throw Error('Unexpected process');
          },
        };
      return native(name);
    },
  });
  vm.runInContext(source, context);
  for (const value of [true, false, null, '', ' ', [], [80], {}, '0x50', '8e1', '80\n']) {
    context.value = value;
    assert.throws(() => vm.runInContext('port(value)', context), /Invalid port/);
    for (const key of ['port', 'connections', 'sharedBuffers', 'workMem']) {
      context.input = {
        confirm: true,
        path: '/etc/postgresql/16/main/postgresql.conf',
        version: 'a'.repeat(64),
        changes: { [key]: value },
      };
      assert.throws(() => vm.runInContext('pgInput(input)', context), /Invalid PostgreSQL numeric value/);
    }
  }
  assert.equal(accessed, 0);
  context.value = '80';
  assert.equal(vm.runInContext('port(value)', context), 80);
  context.input = {
    confirm: true,
    path: '/etc/postgresql/16/main/postgresql.conf',
    version: 'a'.repeat(64),
    changes: { port: '5433', workMem: '4' },
  };
  assert.equal(vm.runInContext('pgInput(input).values.work_mem', context), '4MB');
  assert.equal(accessed, 0);
});
