import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url),
  source = fs
    .readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
const target = '/etc/postgresql/16/main/postgresql.conf';
function fixture(options = {}) {
  const root = fs.mkdtempSync(path.join('/mnt/data/build/tastedev-linux', 'linux-pg-helper-')),
    calls = [];
  const mapped = (name) => (typeof name === 'string' && name.startsWith('/') ? path.join(root, name) : name);
  for (const dir of ['/etc/postgresql/16/main', '/var/lib/linux/admin', '/usr/bin'])
    fs.mkdirSync(mapped(dir), { recursive: true, mode: 0o755 });
  fs.writeFileSync(mapped('/usr/bin/id'), 'fixture', { mode: 0o755 });
  const original = "port = 5432\nwork_mem = '4MB'\n# private\n";
  fs.writeFileSync(mapped(target), original, { mode: 0o644 });
  const fake = new Proxy(fs, {
    get(object, key) {
      if (key === 'chownSync') return () => {};
      if (key === 'lstatSync' || key === 'fstatSync')
        return (name) => {
          const stat = key === 'lstatSync' ? fs.lstatSync(mapped(name)) : fs.fstatSync(name);
          stat.uid = options.owner ?? 0;
          if (key === 'lstatSync' && (!(options.parentOwner ? name.startsWith('/etc/postgresql') : name.startsWith('/etc/postgresql/16')) || name === '/usr/bin/id')) stat.uid = 0;
          if (key === 'lstatSync' && options.foreignDirectory === name) stat.uid = 1000;
          return stat;
        };
      if (
        [
          'readFileSync',
          'writeFileSync',
          'mkdirSync',
          'chmodSync',
          'openSync',
          'unlinkSync',
          'existsSync',
          'readdirSync',
        ].includes(key)
      )
        return (name, ...args) => object[key](mapped(name), ...args);
      if (key === 'renameSync') return (a, b) => fs.renameSync(mapped(a), mapped(b));
      return object[key];
    },
  });
  let restarts = 0;
  const context = vm.createContext({
    require(name) {
      if (name === 'node:fs') return fake;
      if (name === 'node:child_process')
        return {
          spawnSync(binary, args) {
            return { status: 0, stdout: this.execFileSync(binary, args), stderr: '' };
          },
          execFileSync(binary, args) {
            calls.push([binary, ...args]);
            if (binary === '/usr/bin/id') return '113\n';
            if (binary === '/usr/sbin/runuser') {
              if (options.invalid) throw Error('private');
              const config = fs.readFileSync(mapped(args[args.indexOf('-c') + 1].slice(12)), 'utf8');
              const name = args.at(-1),
                value = new RegExp('^' + name + '\\s*=\\s*([^\\n]+)', 'm').exec(config)?.[1].replaceAll("'", '').trim();
              return name === 'work_mem' ? String(parseInt(value) * 1024) : value;
            }
            if (args.at(-1) === 'restart') {
              restarts++;
              if (restarts === (options.failAt || 1) && options.failRestart) {
                if (options.external) fs.writeFileSync(mapped(target), 'port=5439\n');
                throw Error('private');
              }
            }
            return '';
          },
        };
      return require(name);
    },
    process,
    Buffer,
  });
  vm.runInContext(source, context);
  return {
    root,
    calls,
    original,
    file: mapped(target),
    apply(input = {}) {
      context.input = {
        path: target,
        version: createHash('sha256').update(original).digest('hex'),
        confirm: true,
        changes: { port: 5433, workMem: 16 },
        ...input,
      };
      return vm.runInContext("dispatch('postgresql-apply',input)", context);
    },
    restorePlan(id) {
      context.restoreInput = { id };
      return vm.runInContext("dispatch('postgresql-restore-plan',restoreInput)", context);
    },
    restore(plan, extra = {}) {
      context.restoreInput = {
        id: plan.id,
        version: plan.version,
        backupVersion: plan.backupVersion,
        confirm: true,
        ...extra,
      };
      return vm.runInContext("dispatch('postgresql-restore',restoreInput)", context);
    },
    backups() {
      return vm.runInContext("dispatch('postgresql-backups',{})", context);
    },
    close() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
test('root helper applies only a validated PostgreSQL candidate and keeps a private backup', () => {
  const f = fixture();
  try {
    const result = f.apply();
    assert.equal(result.changed, true);
    assert.match(fs.readFileSync(f.file, 'utf8'), /port = 5433/);
    const backup = path.join(f.root, 'var/lib/linux/admin/postgresql', result.backupId + '.json');
    assert.equal(fs.statSync(backup).mode & 0o777, 0o600);
    assert.equal(JSON.parse(fs.readFileSync(backup)).text, f.original);
    assert(!JSON.stringify(result).includes('private'));
  } finally {
    f.close();
  }
});
test('root helper rejects invalid confirmation, stale versions and candidate validation before replacement', () => {
  for (const input of [
    { confirm: false },
    { version: 'a'.repeat(64) },
    { changes: { port: '5433\npassword=x' } },
    { path: '/etc/passwd' },
  ]) {
    const f = fixture();
    try {
      assert.throws(() => f.apply(input));
      assert.equal(fs.readFileSync(f.file, 'utf8'), f.original);
    } finally {
      f.close();
    }
  }
  const f = fixture({ invalid: true });
  try {
    assert.throws(() => f.apply(), /validation failed/);
    assert.equal(fs.readFileSync(f.file, 'utf8'), f.original);
  } finally {
    f.close();
  }
});
test('root helper restores failed activation while preserving intervening external edits', () => {
  for (const external of [false, true]) {
    const f = fixture({ failRestart: true, external });
    try {
      const result = f.apply();
      assert.equal(result.failed, true);
      assert.equal(result.restored, !external);
      assert.equal(fs.readFileSync(f.file, 'utf8'), external ? 'port=5439\n' : f.original);
    } finally {
      f.close();
    }
  }
});

test('PostgreSQL backup catalog omits configuration secrets and rejects corrupt or symlinked records', async () => {
  const f = fixture();
  try {
    const applied = f.apply();
    const dir = path.join(f.root, 'var/lib/linux/admin/postgresql');
    fs.writeFileSync(path.join(dir, '11111111-1111-1111-1111-111111111111.json'), 'invalid', { mode: 0o600 });
    fs.symlinkSync(
      path.join(dir, applied.backupId + '.json'),
      path.join(dir, '22222222-2222-2222-2222-222222222222.json'),
    );
    const result = await f.backups();
    assert.equal(result.backups.length, 1);
    assert.equal(result.warnings, 2);
    assert.equal(result.backups[0].id, applied.backupId);
    assert(!JSON.stringify(result).includes('private'));
    assert(!Object.hasOwn(result.backups[0], 'text'));
  } finally {
    f.close();
  }
});

test('PostgreSQL selected-backup restore previews supported fields without secrets and backs up current configuration', async () => {
  const f = fixture();
  try {
    const applied = f.apply();
    const plan = f.restorePlan(applied.backupId);
    assert.equal(plan.changed, true);
    assert(!JSON.stringify(plan).includes('private'));
    assert.equal(plan.fields.find((item) => item.key === 'port').after, '5432');
    const result = f.restore(plan);
    assert.equal(result.changed, true);
    assert.equal(fs.readFileSync(f.file, 'utf8'), f.original);
    assert.notEqual(result.backupId, applied.backupId);
    assert.equal((await f.backups()).backups.length, 2);
  } finally {
    f.close();
  }
});
test('PostgreSQL restore refuses missing confirmation, changed live configuration, and altered backup', () => {
  const f = fixture();
  try {
    const applied = f.apply(),
      plan = f.restorePlan(applied.backupId);
    assert.throws(() => f.restore(plan, { confirm: false }));
    assert.throws(() => f.restore(plan, { backupVersion: 'a'.repeat(64) }));
    fs.writeFileSync(f.file, 'port=5440\n');
    assert.throws(() => f.restore(plan), /configuration changed/);
    assert.equal(fs.readFileSync(f.file, 'utf8'), 'port=5440\n');
    const backup = path.join(f.root, 'var/lib/linux/admin/postgresql', applied.backupId + '.json');
    const record = JSON.parse(fs.readFileSync(backup));
    record.text += 'tampered';
    fs.writeFileSync(backup, JSON.stringify(record));
    assert.throws(() => f.restorePlan(applied.backupId), /Invalid PostgreSQL backup/);
  } finally {
    f.close();
  }
});

test('failed PostgreSQL selected-backup restore rolls back to the configuration present before restoration', () => {
  const f = fixture({ failRestart: true, failAt: 2 });
  try {
    const applied = f.apply();
    const current = fs.readFileSync(f.file, 'utf8'),
      plan = f.restorePlan(applied.backupId);
    const result = f.restore(plan);
    assert.equal(result.failed, true);
    assert.equal(result.restored, true);
    assert.equal(result.recovered, true);
    assert.equal(fs.readFileSync(f.file, 'utf8'), current);
  } finally {
    f.close();
  }
});

test('PostgreSQL configuration accepts the postgres account owner but rejects unrelated owners and writable directories', () => {
  const accepted = fixture({ owner: 113, parentOwner: true });
  try {
    const applied = accepted.apply();
    assert.equal(applied.changed, true);
    assert.equal(accepted.restore(accepted.restorePlan(applied.backupId)).changed, true);
  } finally {
    accepted.close();
  }
  const unrelated = fixture({ owner: 1000, parentOwner: true });
  try {
    assert.throws(() => unrelated.apply(), /Unsafe PostgreSQL configuration/);
    assert.equal(fs.readFileSync(unrelated.file, 'utf8'), unrelated.original);
  } finally {
    unrelated.close();
  }
  const writable = fixture({ owner: 113 });
  try {
    fs.chmodSync(path.dirname(writable.file), 0o777);
    assert.throws(() => writable.apply(), /Unsafe PostgreSQL configuration directory/);
    assert.equal(fs.readFileSync(writable.file, 'utf8'), writable.original);
  } finally {
    writable.close();
  }
});
test('PostgreSQL configuration refuses symlinks and invalid UTF-8 before native validation', () => {
  for (const kind of ['symlink', 'encoding']) {
    const f = fixture();
    try {
      if (kind === 'symlink') {
        fs.renameSync(f.file, f.file + '.original');
        fs.symlinkSync(f.file + '.original', f.file);
      } else fs.writeFileSync(f.file, Buffer.from([0xff]));
      assert.throws(() => f.apply(), /Unsafe PostgreSQL configuration file|Invalid PostgreSQL configuration/);
      assert(!f.calls.some((call) => call[0] === '/usr/sbin/runuser'));
    } finally {
      f.close();
    }
  }
});


test('PostgreSQL rejects writable, foreign-owned and linked configuration ancestors before invoking native tools', () => {
  for (const ancestor of ['/etc/postgresql', '/etc/postgresql/16', '/etc/postgresql/16/main']) {
    for (const defect of ['writable', 'foreign-owner', 'symlink']) {
      const f = fixture({ owner: 113, parentOwner: true, ...(defect === 'foreign-owner' ? { foreignDirectory: ancestor } : {}) });
      try {
        const directory = path.join(f.root, ancestor);
        if (defect === 'writable') fs.chmodSync(directory, 0o775);
        if (defect === 'symlink') { fs.renameSync(directory, directory + '.original'); fs.symlinkSync(directory + '.original', directory); }
        assert.throws(() => f.apply(), /Unsafe PostgreSQL configuration directory/, ancestor + ': ' + defect);
        assert.equal(fs.readFileSync(f.file, 'utf8'), f.original);
        assert(!f.calls.some(call => call[0] !== '/usr/bin/id'), 'unsafe ancestor must block validation and service execution');
      } finally { f.close(); }
    }
  }
});
