import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { postgresqlServiceRequest } from '../lib/postgresql-service-request.ts';
import { controlService, logCommand } from '../lib/operations.ts';
const request = {
  path: '/etc/postgresql/18/main/pg_hba.conf',
  unit: 'postgresql@18-main.service',
  action: 'start',
  confirm: true,
};
test('cluster controls bind HBA and config nodes to the same explicit target', () => {
  assert.deepEqual(postgresqlServiceRequest(request), {
    ...request,
    path: '/etc/postgresql/18/main/postgresql.conf',
    version: '18',
    cluster: 'main',
  });
  for (const change of [
    { unit: 'postgresql.service' },
    { unit: 'postgresql@18-other.service' },
    { path: '/etc/postgresql/18/../postgresql.conf' },
    { path: '/etc/postgresql/18/-main/postgresql.conf' },
    { action: 'enable' },
    { action: 'delete' },
    { path: '/etc/postgresql/018/main/postgresql.conf' },
  ])
    assert.throws(() => postgresqlServiceRequest({ ...request, ...change }));
});
test('cluster control still requires administrator mode before invoking the helper', async () => {
  const previous = process.env.LINUX_ENABLE_ADMIN;
  process.env.LINUX_ENABLE_ADMIN = 'false';
  try {
    await assert.rejects(controlService(request), (error) => error.status === 403);
  } finally {
    if (previous === undefined) delete process.env.LINUX_ENABLE_ADMIN;
    else process.env.LINUX_ENABLE_ADMIN = previous;
  }
});
test('root helper independently rejects mismatched targets and checks config ownership before native execution', async () => {
  const source = await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8');
  const functionSource = source.slice(source.indexOf('function pgService('), source.indexOf('function pgStage('));
  const calls = [];
  let unsafe = false;
  const context = vm.createContext({
    fail: (message) => {
      throw Error(message);
    },
    pgRead: (file) => {
      calls.push(['read', file]);
      if (unsafe) throw Error('Unsafe PostgreSQL configuration file');
    },
    pgRun: (binary, args) => {
      calls.push([binary, ...args]);
      return 'fixture output';
    },
  });
  vm.runInContext(functionSource + ';globalThis.control=pgService', context);
  const input = postgresqlServiceRequest(request);
  const result = context.control(input);
  assert.equal(result.unit, request.unit);
  assert.equal(result.logs, 'fixture output');
  assert.deepEqual(calls, [
    ['read', input.path],
    ['/usr/bin/pg_ctlcluster', '18', 'main', 'start'],
  ]);
  calls.length = 0;
  for (const change of [
    { unit: 'postgresql.service' },
    { path: request.path },
    { confirm: false },
    { action: 'enable' },
    { unit: 'postgresql@18-other.service' },
  ])
    assert.throws(() => context.control({ ...input, ...change }));
  assert.equal(calls.length, 0);
  unsafe = true;
  assert.throws(() => context.control(input));
  assert.deepEqual(calls, [['read', input.path]]);
});

test('cluster journals use the same target and cannot select unrelated units', () => {
  assert.deepEqual(logCommand(request.unit, request.path), [
    '/usr/bin/journalctl',
    '--unit',
    request.unit,
    '--lines=150',
    '--no-pager',
    '--output=short-iso',
  ]);
  assert.throws(() => logCommand('sshd.service', request.path));
  assert.throws(() => logCommand(request.unit, '/etc/shadow'));
});
