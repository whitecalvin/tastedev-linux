import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import { preparePostgresqlBackupLookup } from '../lib/postgresql-backup-request.ts';
const target = '/etc/postgresql/18/main/postgresql.conf';

test('PostgreSQL backup lookup accepts one main config and rejects ambiguous or unsafe paths', () => {
  assert.deepEqual(preparePostgresqlBackupLookup(null), {});
  assert.deepEqual(preparePostgresqlBackupLookup(target), { path: target });
  for (const value of [
    '',
    false,
    {},
    '/etc/postgresql/18/main/pg_hba.conf',
    '/etc/postgresql/18/../postgresql.conf',
    '/etc/postgresql/18/main/postgresql.conf?x',
    '/etc/postgresql/18/' + 'a'.repeat(256) + '/postgresql.conf',
  ])
    assert.throws(
      () => preparePostgresqlBackupLookup(value),
      (error) => error.status === 400,
    );
});

test('privileged backup catalog filters the selected path before limiting results', async () => {
  const source = await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8');
  const begin=source.indexOf('// BEGIN TYPESCRIPT HELPER POSTGRESQL BACKUPS\n'),
    end=source.indexOf('// END TYPESCRIPT HELPER POSTGRESQL BACKUPS\n',begin);
  assert(begin>=0&&end>begin,'The complete generated backup module is required');
  const code=source.slice(begin,end);
  const hash = (text) => createHash('sha256').update(text).digest('hex'),
    records = new Map();
  for (let i = 0; i < 105; i++) {
    const id = randomUUID(),
      text = 'port = ' + (5432 + i) + '\n';
    records.set(id + '.json', {
      id,
      kind: 'postgresql',
      target: i < 103 ? '/etc/postgresql/18/other/postgresql.conf' : target,
      text,
      version: hash(text),
      createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    });
  }
  const fs = {
    readdirSync: () => [...records.keys()],
    lstatSync: (file) => ({
      mode: file.endsWith('.json') ? 0o600 : 0o700,
      uid: 0,
      nlink: 1,
      size: 1000,
      isFile: () => true,
      isSymbolicLink: () => false,
    }),
    readFileSync: (file) => JSON.stringify(records.get(path.basename(file))),
  };
  const context = vm.createContext({
    fs,
    path,
    hash,
    Buffer,
    BASE: '/fixture',
    rootDir: () => {},
    fail: (message) => {
      throw Error(message);
    },
    mariaRuntime: () => {
      throw Error('unexpected recovery archive');
    },
  });
  vm.runInContext(code + ';globalThis.catalog=pgBackups;', context);
  const scoped = await context.catalog({ path: target });
  assert.equal(scoped.backups.length, 2);
  assert(scoped.backups.every((item) => item.target === target));
  assert.equal(scoped.truncated, false);
  const global = await context.catalog({});
  assert.equal(global.backups.length, 100);
  assert.equal(global.truncated, true);
  await assert.rejects(
    context.catalog({ path: '/etc/postgresql/18/main/pg_hba.conf' }),
    /Invalid PostgreSQL backup path/,
  );
});

test('backup API gates session and sudo mode then forwards the exact selected configuration', async () => {
  const { transform, loadBindings } = await import('next/dist/build/swc/index.js');
  await loadBindings();
  const compiled = await transform(await readFile(new URL('../lib/api.ts', import.meta.url), 'utf8'), {
    filename: 'api.ts',
    jsc: { parser: { syntax: 'typescript' } },
    module: { type: 'commonjs' },
  });
  let loggedIn = false,
    sudo = false;
  const calls = [],
    module = { exports: {} };
  const require = (name) =>
    name === './auth.ts'
      ? { cookieSession: async () => (loggedIn ? { username: 'fixture' } : null) }
      : name === './security.ts'
        ? { securitySettings: async () => ({ settings: { sudoWithoutPrompt: sudo } }) }
        : name === './privilege.ts'
          ? {
              runHelper: async (action, data) => {
                calls.push({ action, data });
                return { backups: [] };
              },
            }
          : name === './postgresql-backup-request.ts'
            ? { preparePostgresqlBackupLookup }
            : {};
  new Function('require', 'module', 'exports', compiled.code)(require, module, module.exports);
  const get = (selected = target) =>
    module.exports.handle(
      new Request(
        'http://localhost/api/postgresql-backups' + (selected === null ? '' : '?path=' + encodeURIComponent(selected)),
      ),
      'postgresql-backups',
    );
  assert.equal((await get()).status, 401);
  loggedIn = true;
  assert.equal((await get()).status, 403);
  assert.equal(calls.length, 0);
  sudo = true;
  assert.equal((await get()).status, 200);
  assert.deepEqual(calls.at(-1), { action: 'postgresql-backups', data: { path: target } });
  assert.equal((await get('/etc/postgresql/18/main/pg_hba.conf')).status, 400);
  assert.equal(calls.length, 1);
  assert.equal((await get(null)).status, 200);
  assert.deepEqual(calls.at(-1), { action: 'postgresql-backups', data: {} });
});

test('manual backup API requires session, same origin and database sudo permission before forwarding a source version', async () => {
  const { preparePostgresqlConfigBackup } = await import('../lib/postgresql-backup-request.ts');
  const { transform, loadBindings } = await import('next/dist/build/swc/index.js');
  await loadBindings();
  const compiled = await transform(await readFile(new URL('../lib/api.ts', import.meta.url), 'utf8'), {
    filename: 'api.ts',
    jsc: { parser: { syntax: 'typescript' } },
    module: { type: 'commonjs' },
  });
  let loggedIn = false,
    allowed = false;
  const calls = [],
    events = [],
    module = { exports: {} };
  const require = (name) =>
    name === './auth.ts'
      ? { cookieSession: async () => (loggedIn ? { username: 'fixture' } : null) }
      : name === './security.ts'
        ? {
            assertFeature: async (feature, options) => {
              assert.equal(feature, 'databaseChanges');
              assert.equal(options.sudo, true);
              if (!allowed) throw Object.assign(Error('disabled'), { status: 403 });
            },
            auditEvent: async (action, result) => events.push(result),
          }
        : name === './privilege.ts'
          ? {
              runHelper: async (action, input) => {
                calls.push({ action, input });
                return { created: true };
              },
            }
          : name === './postgresql-backup-request.ts'
            ? { preparePostgresqlConfigBackup }
            : {};
  new Function('require', 'module', 'exports', compiled.code)(require, module, module.exports);
  const input = { path: target, version: 'a'.repeat(64), confirm: true };
  const post = (data = input, origin = 'http://localhost') =>
    module.exports.handle(
      new Request('http://localhost/api/postgresql-config-backup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify(data),
      }),
      'postgresql-config-backup',
    );
  assert.equal((await post()).status, 401);
  loggedIn = true;
  assert.equal((await post()).status, 403);
  allowed = true;
  assert.equal((await post(input, 'https://other.example')).status, 403);
  assert.equal(calls.length, 0);
  assert.equal((await post({ ...input, text: 'edited draft' })).status, 400);
  assert.equal(calls.length, 0);
  assert.equal(events.at(-1), 'failed');
  assert.equal((await post()).status, 200);
  assert.deepEqual(calls, [{ action: 'postgresql-config-backup', input }]);
  assert.equal(events.at(-1), 'completed');
});
