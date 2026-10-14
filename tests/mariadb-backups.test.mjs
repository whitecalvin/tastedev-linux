import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseLiveConfig } from '../lib/config-live.ts';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('MariaDB privileged backup list excludes corrupt, public and symlink records and never returns configuration', async () => {
  const root = fs.mkdtempSync('/mnt/data/build/tastedev-linux/linux-maria-backups-list-'),
    dir = root + '/var/lib/linux/admin/mariadb';
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const source = fs
    .readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
  const fake = new Proxy(fs, {
    get(object, key) {
      if (key === 'lstatSync')
        return (name) => {
          const stat = fs.lstatSync(root + name);
          stat.uid = 0;
          return stat;
        };
      if (key === 'fstatSync')
        return (fd) => {
          const stat = fs.fstatSync(fd);
          stat.uid = 0;
          return stat;
        };
      if (['openSync', 'readdirSync'].includes(key)) return (name, ...args) => object[key](root + name, ...args);
      return object[key];
    },
  });
  const context = vm.createContext({ require: (name) => (name === 'node:fs' ? fake : require(name)), process, Buffer });
  vm.runInContext(source, context);
  const id = (n) => '12345678-1234-1234-1234-' + String(n).padStart(12, '0');
  const text = '[mariadbd]\npassword=private\nport=3306\n';
  const record = (n) => ({
    id: id(n),
    target: '/etc/mysql/conf.d/server.cnf',
    createdAt: '2026-10-03T00:00:00Z',
    version: createHash('sha256').update(text).digest('hex'),
    text,
  });
  try {
    fs.writeFileSync(dir + '/' + id(1) + '.json', JSON.stringify(record(1)), { mode: 0o600 });
    fs.writeFileSync(dir + '/' + id(2) + '.json', JSON.stringify({ ...record(2), version: '0'.repeat(64) }), {
      mode: 0o600,
    });
    fs.writeFileSync(dir + '/' + id(3) + '.json', JSON.stringify(record(3)), { mode: 0o644 });
    fs.symlinkSync(dir + '/' + id(1) + '.json', dir + '/' + id(4) + '.json');
    const result = vm.runInContext("dispatch('mariadb-backups',{})", context);
    assert.equal(result.backups.length, 1);
    assert.equal(result.backups[0].id, id(1));
    assert.equal(result.warnings, 3);
    assert(!JSON.stringify(result).includes('private'));
    assert(!Object.hasOwn(result.backups[0], 'text'));
    fs.mkdirSync(root + '/etc/mysql/conf.d', { recursive: true, mode: 0o700 });
    const current = '[mariadbd]\nport=3307\npassword=current-private\n';
    const graph = {
      complete: true,
      root: '/etc/mysql/my.cnf',
      version: 'a'.repeat(64),
      files: [{ path: record(1).target, version: createHash('sha256').update(current).digest('hex') }],
    };
    context.runtime = { mariadbTopology: async () => graph, trusted: () => Buffer.from(current), parseLiveConfig };
    vm.runInContext('mariaRuntime=async()=>runtime;', context);
    context.input = { id: id(1), root: graph.root };
    await assert.rejects(vm.runInContext('mariaRestore({...input,confirm:false})', context), /confirmation/);
    await assert.rejects(
      vm.runInContext("mariaRestore({...input,confirm:true,backupVersion:'0'.repeat(64)})", context),
      /backup changed/,
    );
    const plan = await vm.runInContext('mariaRestorePlan(input)', context);
    assert.equal(plan.fields.find((field) => field.key === 'port').before, 3307);
    assert.equal(plan.fields.find((field) => field.key === 'port').after, 3306);
    assert(!JSON.stringify(plan).includes('private'));
    assert.equal(plan.graphVersion, graph.version);
    let calls = 0;
    context.runtime.mariadbTopology = async () => (++calls === 1 ? graph : { ...graph, version: 'b'.repeat(64) });
    await assert.rejects(vm.runInContext('mariaRestorePlan(input)', context), /changed/);
    context.runtime.mariadbTopology = async () => ({ ...graph, files: [] });
    await assert.rejects(vm.runInContext('mariaRestorePlan(input)', context), /not included/);
    fs.chmodSync(dir, 0o755);
    assert.throws(() => vm.runInContext("dispatch('mariadb-backups',{})", context), /private/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
