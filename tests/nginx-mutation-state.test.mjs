import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const source = readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0],
  native = createRequire(import.meta.url),
  base = '/var/lib/linux/admin';
function fixture() {
  const directories = new Map(),
    files = new Set(),
    commands = [];
  let runtimeCalls = 0;
  const missing = () => Object.assign(Error('missing'), { code: 'ENOENT' });
  const fs = {
    lstatSync(name) {
      if (directories.has(name)) {
        const value = directories.get(name);
        return {
          uid: value.uid ?? 0,
          mode: value.mode ?? 0o700,
          isDirectory: () => !value.link,
          isSymbolicLink: () => Boolean(value.link),
        };
      }
      if (files.has(name)) return { isDirectory: () => false, isSymbolicLink: () => true, uid: 0, mode: 0o777 };
      throw missing();
    },
    readdirSync(directory) {
      return [...files]
        .filter((name) => name.startsWith(directory + '/'))
        .map((name) => name.slice(directory.length + 1));
    },
  };
  const context = vm.createContext({
    process,
    Buffer,
    require(name) {
      if (name === 'node:fs') return fs;
      if (name === 'node:child_process')
        return {
          execFileSync(...args) {
            commands.push(args);
            throw Error('unexpected command');
          },
        };
      return native(name);
    },
    runtime: () => {
      runtimeCalls++;
    },
  });
  vm.runInContext(source, context);
  vm.runInContext('mariaRuntime=async()=>{runtime();throw Error("unexpected runtime");}', context);
  return {
    directories,
    files,
    commands,
    context,
    runtimeCalls: () => runtimeCalls,
    guard: (action, input = {}) =>
      vm.runInContext(`nginxMutationStateGuard(${JSON.stringify(action)},${JSON.stringify(input)})`, context),
    dispatch: (action, input = {}) =>
      vm.runInContext(`dispatch(${JSON.stringify(action)},${JSON.stringify(input)})`, context),
  };
}
const mutations = [
  ...[
    'nginx-apply',
    'nginx-toggle',
    'nginx-restore',
    'nginx-config-apply',
    'nginx-config-restore',
    'nginx-site-apply',
    'certificate',
  ].map((action) => [action, { confirm: true }]),
  ...['start', 'stop', 'restart', 'reload', 'enable', 'disable'].map((action) => [
    'service',
    { unit: 'nginx.service', action, confirm: true },
  ]),
  ['service', { unit: 'certbot.timer', action: 'start', confirm: true }],
  ['service', { unit: 'certbot.timer', action: 'enable', confirm: true }],
  ...['nginx', 'certbot', 'python3-certbot-nginx'].map((name) => ['install', { packages: [name], confirm: true }]),
];
test('pending site/config records block every related helper mutation before imports or commands', () => {
  for (const kind of ['site', 'config']) {
    const f = fixture();
    if (kind === 'site') {
      f.directories.set(base + '/nginx-sites', {});
      f.files.add(base + '/nginx-sites/pending.json');
    } else {
      f.directories.set(base + '/nginx-config', {});
      f.directories.set(base + '/nginx-config/transactions', {});
      f.files.add(base + '/nginx-config/transactions/' + 'a'.repeat(64) + '.json');
    }
    for (const [action, input] of mutations)
      assert.throws(
        () => f.dispatch(action, input),
        (error) => error.status === 409,
        kind + ' ' + action,
      );
    assert.equal(f.commands.length, 0);
    assert.equal(f.runtimeCalls(), 0);
    assert.equal(f.files.size, 1);
  }
});
test('only the matching recovery bypasses its own record; inspection and unrelated operations remain available', () => {
  const f = fixture();
  f.directories.set(base + '/nginx-sites', {});
  f.files.add(base + '/nginx-sites/pending.json');
  assert.doesNotThrow(() => f.guard('nginx-site-recover'));
  assert.throws(
    () => f.guard('nginx-recover'),
    (error) => error.status === 409,
  );
  for (const action of [
    'nginx-context-inspect',
    'nginx-check',
    'nginx-site-recovery',
    'nginx-recovery-plan',
    'nginx-site-plan',
    'nginx-config-backups',
    'nginx-config-backup',
  ])
    assert.doesNotThrow(() => f.guard(action));
  assert.doesNotThrow(() => f.guard('service', { unit: 'redis-server.service', action: 'restart' }));
  assert.doesNotThrow(() => f.guard('service', { unit: 'certbot.timer', action: 'stop' }));
  assert.doesNotThrow(() => f.guard('install', { packages: ['nodejs'] }));
  f.directories.set(base + '/nginx-config', {});
  f.directories.set(base + '/nginx-config/transactions', {});
  f.files.add(base + '/nginx-config/transactions/' + 'b'.repeat(64) + '.json');
  assert.throws(
    () => f.guard('nginx-site-recover'),
    (error) => error.status === 409,
  );
  assert.throws(
    () => f.guard('nginx-recover'),
    (error) => error.status === 409,
  );
  f.files.delete(base + '/nginx-sites/pending.json');
  assert.doesNotThrow(() => f.guard('nginx-recover'));
  assert.throws(
    () => f.guard('nginx-site-recover'),
    (error) => error.status === 409,
  );
});
test('missing records allow normal paths; unsafe parents and private directory permissions fail closed', () => {
  const f = fixture();
  for (const [action, input] of mutations) assert.doesNotThrow(() => f.guard(action, input));
  for (const [directory, value] of [
    [base + '/nginx-sites', { link: true }],
    [base + '/nginx-sites', { mode: 0o755 }],
    [base + '/nginx-config', { link: true }],
    [base + '/nginx-config/transactions', { uid: 1000 }],
  ]) {
    f.directories.clear();
    f.directories.set(base + '/nginx-config', {});
    f.directories.set(directory, value);
    assert.throws(() => f.guard('nginx-site-apply'));
  }
});
