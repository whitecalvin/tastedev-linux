import {sessionCookieName} from '../lib/auth.ts';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { commandFor, startInstall } from '../lib/packages.ts';
import { handle } from '../lib/api.ts';
import { passwordHash, login } from '../lib/auth.ts';
const token = 'legacy-test-token-at-least-24-characters';
let session;
beforeEach(async () => {
  globalThis.__linuxLoginAttempts.clear();
  process.env.LINUX_LOGIN_USERNAME = 'fixture-admin';
  process.env.LINUX_LOGIN_PASSWORD_HASH = await passwordHash('fixture-password-only');
  session = await login('fixture-admin', 'fixture-password-only');
});
function request(body, extra = {}) {
  return new Request('http://localhost:8787/api/plan', {
    method: 'POST',
    headers: { Cookie: sessionCookieName() + '=' + session, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
}
test('reject arbitrary names, inherited properties, duplicate and injected shell inputs', () => {
  for (const value of [
    [],
    ['nginx', 'nginx'],
    ['toString'],
    ['__proto__'],
    ['nginx; id'],
    ['--allow-unauthenticated'],
    null,
    [5],
  ])
    assert.throws(() => commandFor(value));
  assert.deepEqual(commandFor(['certbot']), [
    '/usr/bin/apt-get',
    'install',
    '--yes',
    '--no-remove',
    '--no-upgrade',
    'certbot',
    'python3-certbot-nginx',
  ]);
});
test('auth is required even for status', async () => {
  process.env.LINUX_ADMIN_TOKEN = token;
  assert.equal((await handle(new Request('http://localhost/api/status'), 'status')).status, 401);
});
test('plan shows fixed command, rejects cross-origin and oversized requests', async () => {
  process.env.LINUX_ADMIN_TOKEN = token;
  const plan = await handle(request({ packages: ['nodejs'] }), 'plan');
  assert.equal(plan.status, 200);
  assert.equal(
    (
      await handle(
        request({ packages: ['nginx'] }, { Origin: 'http://127.0.0.1:8787', Host: '127.0.0.1:8787' }),
        'plan',
      )
    ).status,
    200,
  );
  assert.deepEqual((await plan.json()).command.slice(-2), ['nodejs', 'npm']);
  assert.equal(
    (await handle(request({ packages: ['nginx'] }, { Origin: 'https://evil.example' }), 'plan')).status,
    403,
  );
  assert.equal((await handle(request({ packages: ['nginx'], padding: 'x'.repeat(5000) }), 'plan')).status, 413);
  assert.equal((await handle(request({ packages: ['__proto__'] }), 'plan')).status, 400);
});
test('installation is blocked in read-only mode without starting a process', async () => {
  process.env.LINUX_ENABLE_INSTALL = 'false';
  await assert.rejects(startInstall(['nginx']), (error) => error.status === 403);
  assert.equal((await handle(request({ packages: ['nginx'], confirm: true }), 'install')).status, 403);
  assert.equal((await handle(request({ packages: ['nginx'] }), 'install')).status, 403);
});
test('all operational mutations are gated by server-side security settings', async () => {
  process.env.LINUX_ADMIN_TOKEN = token;
  for (const action of [
    'nginx-toggle',
    'nginx-apply',
    'certbot-issue',
    'cron-apply',
    'service',
    'terminal',
    'file',
    'nginx',
    'restore',
  ])
    assert.equal((await handle(request({ confirm: true, domain: 'app.example.com' }), action)).status, 403, action);
});

test('audit tail tolerates partial records and limits output without leaking extra fields', async () => {
  const { parseAuditTail } = await import('../lib/security.ts');
  const lines = Array.from({ length: 150 }, (_, i) =>
    JSON.stringify({ at: String(i), action: 'service', result: 'success', token: 'private' }),
  );
  const events = parseAuditTail('broken\n' + lines.join('\n') + '\n{"partial":');
  assert.equal(events.length, 100);
  assert.equal(events[0].at, '50');
  assert.equal(events[99].at, '149');
  assert.equal(events[0].token, undefined);
});

test('database packages use fixed apt targets', async () => {
  const { commandFor } = await import('../lib/packages.ts');
  assert.deepEqual(commandFor(['postgresql', 'mariadb', 'redis']).slice(5), [
    'postgresql',
    'mariadb-server',
    'redis-server',
  ]);
  assert.throws(() => commandFor(['mysql;reboot']));
});

test('database daemon control and journals remain allowlisted', async () => {
  const { serviceCommand, logCommand } = await import('../lib/operations.ts');
  for (const unit of ['postgresql.service', 'mariadb.service', 'redis-server.service']) {
    assert.equal(serviceCommand(unit, 'enable').at(-1), unit);
    assert.equal(logCommand(unit)[2], unit);
  }
  assert.throws(() => serviceCommand('sshd.service', 'enable'));
  assert.throws(() => serviceCommand('redis-server.service', 'reload'));
});

test('cron GUI lists only valid unique managed jobs and preserves full shell commands', async () => {
  const { cronJobs, cronEntry } = await import('../lib/server-tools.ts');
  const job = {
    name: 'fixture-backup',
    schedule: '0 3 * * *',
    command: '/bin/printf "hello world" >> /tmp/fixture.log',
    enabled: false,
  };
  assert.deepEqual(cronJobs('PATH=/usr/bin\n' + cronEntry(job)), [job]);
  assert.deepEqual(cronJobs(cronEntry(job) + cronEntry(job)), []);
  assert.deepEqual(cronJobs('# LINUX: broken\nPATH=/bin\n'), []);
});

test('PostgreSQL apply requires login and database permission before reading files or starting the helper', async () => {
  const payload = {
    path: '/etc/postgresql/16/main/postgresql.conf',
    version: 'a'.repeat(64),
    changes: { port: 5433 },
    confirm: true,
  };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/postgresql-apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'postgresql-apply',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(payload), 'postgresql-apply')).status, 403);
});

test('MariaDB apply requires login and database permission before inspecting the graph or invoking root helper', async () => {
  const payload = {
    root: '/etc/mysql/my.cnf',
    path: '/etc/mysql/conf.d/server.cnf',
    version: 'a'.repeat(64),
    graphVersion: 'b'.repeat(64),
    changes: { port: 3307 },
    confirm: true,
  };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/mariadb-apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'mariadb-apply',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(payload), 'mariadb-apply')).status, 403);
});

test('MariaDB restore requires login and database permission before reading root backups', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/mariadb-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'mariadb-restore',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }), 'mariadb-restore')).status, 403);
});

test('Workspace Node environment updates require login, same origin and file permission before reading a target', async () => {
  const payload = { name: 'missing-app.env', version: 'a'.repeat(64), changes: { port: 3100 }, confirm: true };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-env', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'node-env',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(payload, { Origin: 'https://outside.invalid' }), 'node-env')).status, 403);
  assert.equal((await handle(request(payload), 'node-env')).status, 403);
});

test('Environment restore is blocked before backup access without authentication or file editing permission', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-env-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'node-env-restore',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ id: 'missing', confirm: true }), 'node-env-restore')).status, 403);
});

test('Node service install requires login, same origin and service permission before reading app files', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'node-app-service-install',
      )
    ).status,
    401,
  );
  assert.equal(
    (await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), 'node-app-service-install'))
      .status,
    403,
  );
  assert.equal((await handle(request({ confirm: true }), 'node-app-service-install')).status, 403);
});

test('Node service control is rejected before file access without login, same origin or service permission', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'node-app-service-control',
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handle(
        request({ confirm: true, operation: 'restart' }, { Origin: 'https://outside.invalid' }),
        'node-app-service-control',
      )
    ).status,
    403,
  );
  assert.equal(
    (await handle(request({ confirm: true, operation: 'restart' }), 'node-app-service-control')).status,
    403,
  );
});

test('Installed Node service settings require login and sudo inspection permission', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-settings?id=fixture'),
        'node-app-service-settings',
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-settings?id=fixture', {
          headers: { Cookie: sessionCookieName() + '=' + session },
        }),
        'node-app-service-settings',
      )
    ).status,
    403,
  );
});

test('Node service update API requires login, same origin and enabled privileged service policy', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'node-app-service-update',
      )
    ).status,
    401,
  );
  assert.equal(
    (await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), 'node-app-service-update')).status,
    403,
  );
  assert.equal((await handle(request({ confirm: true }), 'node-app-service-update')).status, 403);
});

test('Node service backup API requires login and sudo inspection permission', async () => {
  assert.equal(
    (await handle(new Request('http://localhost/api/node-app-service-backups?id=fixture'), 'node-app-service-backups'))
      .status,
    401,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-backups?id=fixture', {
          headers: { Cookie: sessionCookieName() + '=' + session },
        }),
        'node-app-service-backups',
      )
    ).status,
    403,
  );
});

test('Node service restoration review API requires login and sudo inspection permission', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-restore-plan?id=fixture'),
        'node-app-service-restore-plan',
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-restore-plan?id=fixture', {
          headers: { Cookie: sessionCookieName() + '=' + session },
        }),
        'node-app-service-restore-plan',
      )
    ).status,
    403,
  );
});

test('Node service restore API requires login, same origin and enabled service policy', async () => {
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/node-app-service-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'node-app-service-restore',
      )
    ).status,
    401,
  );
  assert.equal(
    (await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), 'node-app-service-restore'))
      .status,
    403,
  );
  assert.equal((await handle(request({ confirm: true }), 'node-app-service-restore')).status, 403);
});

test('sudo policy preview API requires login and same origin but does not apply OS permission', async () => {
  const payload = { passwordless: true, actions: ['nginx-apply'] };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/sudo-policy-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'sudo-policy-plan',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(payload, { Origin: 'https://outside.invalid' }), 'sudo-policy-plan')).status, 403);
  const response = await handle(request(payload), 'sudo-policy-plan');
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.applied, false);
  assert.equal(result.uid, process.getuid());
  assert(result.text.includes('nginx-apply'));
  assert.equal((await handle(request({ ...payload, username: 'root' }), 'sudo-policy-plan')).status, 400);
  assert.equal(
    (await handle(new Request('http://localhost/api/sudo-policy-actions'), 'sudo-policy-actions')).status,
    401,
  );
  const list = await handle(
    new Request('http://localhost/api/sudo-policy-actions', { headers: { Cookie: sessionCookieName() + '=' + session } }),
    'sudo-policy-actions',
  );
  assert.equal(list.status, 200);
  assert((await list.json()).actions.includes('nginx-apply'));
});

test('sudo current-rule API requires authentication and sudo inspection setting', async () => {
  assert.equal(
    (await handle(new Request('http://localhost/api/sudo-policy-settings'), 'sudo-policy-settings')).status,
    401,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/sudo-policy-settings', { headers: { Cookie: sessionCookieName() + '=' + session } }),
        'sudo-policy-settings',
      )
    ).status,
    403,
  );
});
test('sudo rule update API requires login, same origin and service-change permission', async () => {
  const input = { confirm: true, version: 'a'.repeat(64), passwordless: true, actions: ['service'] };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/sudo-policy-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }),
        'sudo-policy-update',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(input, { Origin: 'https://outside.invalid' }), 'sudo-policy-update')).status, 403);
  assert.equal((await handle(request(input), 'sudo-policy-update')).status, 403);
});

test('sudo rule update stays denied when only service permission is saved', async (context) => {
  const { stateRoot } = await import('../lib/runtime-paths.ts'),
    { defaultSecurity } = await import('../lib/security.ts'),
    { readFile, writeFile, mkdir, unlink } = await import('node:fs/promises'),
    path = await import('node:path');
  const root = stateRoot();
  if (!path.basename(root).startsWith('tastedev-linux-tests-')) {
    context.skip('Requires isolated state');
    return;
  }
  const file = path.join(root, 'security.json');
  let previous;
  try {
    previous = await readFile(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const prior = process.env.LINUX_ENABLE_SUDO_POLICY;
  try {
    await mkdir(root, { recursive: true });
    const base = { ...defaultSecurity, readOnly: false, serviceChanges: true, sudoWithoutPrompt: true };
    for (const [settings, gate] of [
      [base, 'true'],
      [{ ...base, sudoPolicyChanges: true }, 'false'],
      [{ ...base, sudoPolicyChanges: true, readOnly: true }, 'true'],
    ]) {
      await writeFile(file, JSON.stringify(settings), { mode: 0o600 });
      process.env.LINUX_ENABLE_SUDO_POLICY = gate;
      const response = await handle(
        request({ confirm: true, version: 'a'.repeat(64), passwordless: true, actions: ['service'] }),
        'sudo-policy-update',
      );
      assert.equal(response.status, 403);
      assert.match((await response.json()).error, /보안 설정/);
    }
  } finally {
    if (previous) await writeFile(file, previous, { mode: 0o600 });
    else await unlink(file);
    if (prior === undefined) delete process.env.LINUX_ENABLE_SUDO_POLICY;
    else process.env.LINUX_ENABLE_SUDO_POLICY = prior;
  }
});

test('nginx context lookup requires login and sudo policy permission before invoking helper', async () => {
  assert.equal((await handle(new Request('http://localhost/api/nginx-context'), 'nginx-context')).status, 401);
  const response = await handle(
    new Request('http://localhost/api/nginx-context', { headers: { Cookie: sessionCookieName() + '=' + session } }),
    'nginx-context',
  );
  assert.equal(response.status, 403);
});
test('nginx graph apply requires login, same origin and nginx permission before helper execution', async () => {
  const payload = { confirm: true };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/nginx-config-apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'nginx-config-apply',
      )
    ).status,
    401,
  );
  assert.equal(
    (await handle(request(payload, { Origin: 'https://outside.invalid' }), 'nginx-config-apply')).status,
    403,
  );
  assert.equal((await handle(request(payload), 'nginx-config-apply')).status, 403);
});

test('nginx backup APIs require authentication and restore is gated before reading backup records', async () => {
  assert.equal(
    (await handle(new Request('http://localhost/api/nginx-config-backups'), 'nginx-config-backups')).status,
    401,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/nginx-config-backups', { headers: { Cookie: sessionCookieName() + '=' + session } }),
        'nginx-config-backups',
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/nginx-config-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        'nginx-config-restore',
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }), 'nginx-config-restore')).status, 403);
  assert.equal(
    (await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), 'nginx-config-restore')).status,
    403,
  );
});

test('nginx restoration plan rejects unauthorized and cross-origin requests before privileged backup access', async () => {
  const payload = { backupId: '12345678-1234-1234-1234-123456789abc', path: '/etc/nginx/nginx.conf' };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/nginx-config-restore-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        'nginx-config-restore-plan',
      )
    ).status,
    401,
  );
  assert.equal(
    (await handle(request(payload, { Origin: 'https://outside.invalid' }), 'nginx-config-restore-plan')).status,
    403,
  );
  assert.equal((await handle(request(payload), 'nginx-config-restore-plan')).status, 403);
});

test('Redis context lookup requires login and sudo permission before helper observation', async () => {
  assert.equal((await handle(new Request('http://localhost/api/redis-context'), 'redis-context')).status, 401);
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/redis-context', { headers: { Cookie: sessionCookieName() + '=' + session } }),
        'redis-context',
      )
    ).status,
    403,
  );
});
test('Redis isolated validation requires login same origin and database permission before helper execution', async () => {
  const payload = {
    path: '/etc/redis/redis.conf',
    version: 'a'.repeat(64),
    graphVersion: 'b'.repeat(64),
    changes: { port: 6380 },
    confirm: true,
  };
  for (const action of [
    'postgresql-hba-recover',
    'postgresql-hba-operation-plan',
    'postgresql-hba-operation',
    'postgresql-hba-validate',
    'nginx-config-backup',
    'nginx-check',
    'redis-config-validate',
    'redis-config-apply',
    'redis-config-restore',
  ]) {
    assert.equal(
      (
        await handle(
          new Request('http://localhost/api/' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
          action,
        )
      ).status,
      401,
    );
    assert.equal((await handle(request(payload, { Origin: 'https://outside.invalid' }), action)).status, 403);
    assert.equal((await handle(request(payload), action)).status, 403);
  }
});

test('HBA backup endpoints require authentication, explicit sudo read permission and database mutation permission', async () => {
  for (const action of ['postgresql-hba-recovery-status', 'postgresql-hba-backups', 'postgresql-hba-restore-draft']) {
    const url = 'http://localhost/api/' + action + '?path=' + encodeURIComponent('/etc/postgresql/18/main/pg_hba.conf');
    assert.equal((await handle(new Request(url), action)).status, 401);
    assert.equal(
      (await handle(new Request(url, { headers: { Cookie: sessionCookieName() + '=' + session } }), action)).status,
      403,
    );
  }
  const action = 'postgresql-hba-backup',
    body = { path: '/etc/postgresql/18/main/pg_hba.conf', version: 'a'.repeat(64) };
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        action,
      )
    ).status,
    401,
  );
  assert.equal((await handle(request(body), action)).status, 403);
  assert.equal((await handle(request(body, { Origin: 'https://outside.invalid' }), action)).status, 403);
});

test('Node interrupted service recovery requires authenticated sudo inspection and confirmed same-origin service changes', async () => {
  const action = 'node-app-service-recover',
    review = 'node-app-service-recovery-plan';
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        action,
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), action)).status, 403);
  assert.equal((await handle(request({ confirm: true }), action)).status, 403);
  assert.equal((await handle(new Request('http://localhost/api/' + review + '?id=fixture'), review)).status, 401);
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + review + '?id=fixture', {
          headers: { Cookie: sessionCookieName() + '=' + session },
        }),
        review,
      )
    ).status,
    403,
  );
});

test('Redis interrupted recovery API gates login, same origin and database changes before filesystem access', async () => {
  const action = 'redis-recover',
    review = 'redis-recovery-plan';
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        action,
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), action)).status, 403);
  assert.equal((await handle(request({ confirm: true }), action)).status, 403);
  assert.equal((await handle(new Request('http://localhost/api/' + review), review)).status, 401);
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + review, { headers: { Cookie: sessionCookieName() + '=' + session } }),
        review,
      )
    ).status,
    403,
  );
});

test('nginx interrupted recovery API requires login, same-origin changes and sudo inspection before file access', async () => {
  const action = 'nginx-recover',
    review = 'nginx-recovery-plan',
    url = 'http://localhost/api/' + review + '?path=%2Fetc%2Fnginx%2Fnginx.conf';
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        action,
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), action)).status, 403);
  assert.equal((await handle(request({ confirm: true }), action)).status, 403);
  assert.equal((await handle(new Request(url), review)).status, 401);
  assert.equal(
    (await handle(new Request(url, { headers: { Cookie: sessionCookieName() + '=' + session } }), review)).status,
    403,
  );
});

test('MariaDB interrupted recovery gates login, same origin, database permission and sudo inspection before file access', async () => {
  const action = 'mariadb-recover',
    review = 'mariadb-recovery-plan',
    url =
      'http://localhost/api/' + review + '?root=%2Fetc%2Fmysql%2Fmy.cnf&target=%2Fetc%2Fmysql%2Fconf.d%2Fserver.cnf';
  assert.equal(
    (
      await handle(
        new Request('http://localhost/api/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
        action,
      )
    ).status,
    401,
  );
  assert.equal((await handle(request({ confirm: true }, { Origin: 'https://outside.invalid' }), action)).status, 403);
  assert.equal((await handle(request({ confirm: true }), action)).status, 403);
  assert.equal((await handle(new Request(url), review)).status, 401);
  assert.equal(
    (await handle(new Request(url, { headers: { Cookie: sessionCookieName() + '=' + session } }), review)).status,
    403,
  );
});

test('manual backup checks target permission before reading cron or launching nginx helper', async () => {
  for (const body of [{ kind: 'cron' }, { kind: 'nginx', domain: 'app.example.com' }])
    assert.equal((await handle(request(body), 'backup')).status, 403);
  for (const body of [
    { kind: 'nginx', domain: '' },
    { kind: 'nginx', domain: '../etc/passwd' },
    { kind: 'unknown' },
    null,
  ])
    assert.equal((await handle(request(body), 'backup')).status, 400);
});
