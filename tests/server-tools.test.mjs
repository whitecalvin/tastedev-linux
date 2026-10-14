import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nginxConfig,
  certificateCommand,
  cronEntry,
  cronSchedule,
  applySite,
  startCertificate,
  applyCron,
} from '../lib/server-tools.ts';
import { validateFile, runCommand } from '../lib/workspace.ts';
test('nginx config validates names ports and directive injection', () => {
  const config = nginxConfig({ domain: 'app.example.com', port: 80, mode: 'proxy', upstreamPort: 3000 });
  assert.match(config, /proxy_pass http:\/\/127.0.0.1:3000;/);
  for (const domain of ['bad; include /etc/passwd', '-d', 'a..com'])
    assert.throws(() => nginxConfig({ domain, port: 80, mode: 'proxy', upstreamPort: 3000 }));
  assert.throws(() => nginxConfig({ domain: 'app.example.com', port: 80, mode: 'static', root: '/tmp; evil' }));
});
test('certbot is fixed argv and validates email', () => {
  assert.equal(
    certificateCommand({ domain: 'app.example.com', email: 'admin@example.com', staging: true }).at(-1),
    '--staging',
  );
  assert.throws(() => certificateCommand({ domain: 'app.example.com', email: '--evil' }));
});
test('cron range validation and disabled jobs', () => {
  assert.equal(cronSchedule('*/5 * * * *'), '*/5 * * * *');
  for (const schedule of ['61 * * * *', '* 24 * * *', '*/0 * * * *', '0 3 0 * *'])
    assert.throws(() => cronSchedule(schedule));
  assert.match(
    cronEntry({ name: 'backup', schedule: '0 3 * * *', command: '/usr/bin/true', enabled: false }),
    /# disabled:/,
  );
  assert.throws(() => cronEntry({ name: 'test', schedule: '* * * * *', command: 'pwd\nrm', enabled: true }));
});
test('workspace disallows traversal hidden files and absolute paths', () => {
  for (const file of ['../file', '/etc/passwd', '.env', 'a/../b', 'a\\b']) assert.throws(() => validateFile(file));
  assert.equal(validateFile('sites/app.conf'), 'sites/app.conf');
});
test('real operations remain gated off', async () => {
  process.env.LINUX_ENABLE_ADMIN = 'false';
  process.env.LINUX_ENABLE_CRON = 'false';
  process.env.LINUX_ENABLE_TERMINAL = 'false';
  await assert.rejects(
    applySite({ domain: 'app.example.com', port: 80, mode: 'proxy', upstreamPort: 3000, confirm: true }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    startCertificate({ domain: 'app.example.com', email: 'a@example.com', agree: true, confirm: true }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    applyCron({ name: 'backup', schedule: '0 3 * * *', command: 'true', enabled: false, confirm: true }),
    (e) => e.status === 403,
  );
  await assert.rejects(runCommand('pwd'), (e) => e.status === 403);
});
import { serviceCommand, logCommand, backupId, controlService, restoreBackup } from '../lib/operations.ts';
test('service and log controls accept only fixed targets', () => {
  assert.deepEqual(serviceCommand('nginx.service', 'reload'), [
    '/usr/bin/systemctl',
    '--no-ask-password',
    'reload',
    'nginx.service',
  ]);
  assert.throws(() => serviceCommand('ssh.service', 'stop'));
  assert.throws(() => serviceCommand('nginx.service', 'invalid'));
  assert.throws(() => logCommand('/etc/shadow'));
  assert.throws(() => backupId('../outside'));
});
test('service mutation denied outside admin mode', async () => {
  process.env.LINUX_ENABLE_ADMIN = 'false';
  await assert.rejects(
    controlService({ unit: 'nginx.service', action: 'stop', confirm: true }),
    (e) => e.status === 403,
  );
});
import { defaultSecurity, validateSecurity, assertFeature } from '../lib/security.ts';
import { helperCommand } from '../lib/privilege.ts';
test('security defaults read-only and rejects malformed options', () => {
  assert.equal(defaultSecurity.readOnly, true);
  assert.equal(defaultSecurity.sudoWithoutPrompt, false);
  assert.throws(() => validateSecurity({ readOnly: false }));
  assert.throws(() => validateSecurity({ ...defaultSecurity, unknown: true }));
  assert.deepEqual(validateSecurity({ ...defaultSecurity }), defaultSecurity);
});
test('sudo only invokes the fixed helper with known actions', () => {
  assert.deepEqual(helperCommand('service'), [
    '/usr/bin/sudo',
    '-n',
    '--',
    '/usr/local/libexec/linux-admin',
    'service',
  ]);
  assert.throws(() => helperCommand('bash'));
});
import { featureAllowed, featureReason } from '../lib/capabilities.ts';
test('UI and API share capabilities, including environment limits and sudo option', () => {
  const policy = {
    settings: { ...defaultSecurity, readOnly: false, nginxChanges: true, sudoWithoutPrompt: true },
    available: { nginxChanges: true },
  };
  assert.equal(featureAllowed(policy, 'nginxChanges', { sudo: true }), true);
  assert.equal(
    featureAllowed({ ...policy, available: { nginxChanges: false } }, 'nginxChanges', { sudo: true }),
    false,
  );
  assert.equal(
    featureAllowed({ ...policy, settings: { ...policy.settings, sudoWithoutPrompt: false } }, 'nginxChanges', {
      sudo: true,
    }),
    false,
  );
  assert.match(
    featureReason({ ...policy, settings: { ...policy.settings, readOnly: true } }, 'nginxChanges'),
    /조회 전용/,
  );
  assert.equal(featureAllowed(null, 'nginxChanges'), false);
});

test('configuration profiles reject injected numeric values and keep local binding', async () => {
  const { configProfile } = await import('../lib/config-profiles.ts');
  assert.match(configProfile('redis', { port: 6379, connections: 100 }), /protected-mode yes/);
  assert.throws(() => configProfile('postgresql', { port: '5432\ninclude evil', connections: 100 }));
  assert.throws(() => configProfile('mariadb', { port: 3306, connections: 0 }));
});
test('package-specific settings validate choices and render targeted directives', async () => {
  const { configProfile } = await import('../lib/config-profiles.ts');
  assert.match(
    configProfile('postgresql', { sharedBuffers: 256, workMem: 8, logging: true }),
    /shared_buffers = '256MB'/,
  );
  assert.match(configProfile('mariadb', { slowLog: true, bufferPool: 256 }), /slow_query_log=ON/);
  assert.match(configProfile('redis', { appendOnly: false, eviction: 'allkeys-lru' }), /appendonly no/);
  assert.match(configProfile('nodejs', { memory: 1024, environment: 'development' }), /max-old-space-size=1024/);
  assert.equal(configProfile('certbot', { operation: 'renew-check' }), '/usr/bin/certbot renew --dry-run --non-interactive --no-random-sleep-on-renew\n');
  assert.throws(() => configProfile('redis', { eviction: 'allkeys-lru\nprotected-mode no' }));
  assert.throws(() => configProfile('postgresql', { logging: 'true' }));
});

test('root actions stay disabled when the dedicated helper is missing', () => {
  const policy = {
    settings: { ...defaultSecurity, readOnly: false, nginxChanges: true, sudoWithoutPrompt: true },
    available: { nginxChanges: true },
    privilege: { ready: false, reason: 'fixture helper missing' },
  };
  assert.equal(featureAllowed(policy, 'nginxChanges', { sudo: true }), false);
  assert.equal(featureReason(policy, 'nginxChanges', { sudo: true }), 'fixture helper missing');
});

test('cron edits preserve unmanaged jobs and environment while rejecting malformed replacement blocks', async () => {
  const { updateCron, cronJobs } = await import('../lib/server-tools.ts');
  const existing = 'PATH=/usr/local/bin:/usr/bin\n15 2 * * * /bin/true # unrelated\n';
  const job = { name: 'backup', schedule: '0 3 * * *', command: '/usr/bin/true', enabled: true };
  const created = updateCron(existing, job);
  assert(created.startsWith(existing));
  const edited = updateCron(created, { ...job, schedule: '0 4 * * *', enabled: false });
  assert(edited.startsWith(existing));
  assert.deepEqual(cronJobs(edited), [{ ...job, schedule: '0 4 * * *', enabled: false }]);
  assert.equal(edited.split('# LINUX: backup').length, 2);
  assert.throws(() => updateCron(existing + '# LINUX: backup\nPATH=/evil\n', job));
  assert.throws(() => cronEntry({ ...job, enabled: 'false' }));
});

test('local backup metadata cannot select arbitrary server files or spoof privileged records', async () => {
  const { validateLocalBackup } = await import('../lib/operations.ts');
  const { createHash } = await import('node:crypto');
  const text = '0 3 * * * /usr/bin/true\n',
    id = '11111111-1111-4111-8111-111111111111',
    record = {
      id,
      kind: 'cron',
      target: 'current-user',
      text,
      createdAt: new Date().toISOString(),
      sha256: createHash('sha256').update(text).digest('hex'),
      privileged: true,
    };
  const safe = validateLocalBackup(record, id);
  assert.equal(safe.privileged, undefined);
  assert.throws(() => validateLocalBackup({ ...record, kind: 'nginx', target: '/etc/shadow' }, id));
  assert.throws(() => validateLocalBackup({ ...record, text: 'changed' }, id));
  assert.throws(() => validateLocalBackup(record, '22222222-2222-4222-8222-222222222222'));
});

test('live GUI parser and HTTPS preview preserve SSL directives and reject nested locations', async () => {
  const { managedSiteForm, mergeHttpsLocation } = await import('../lib/site-form.ts');
  const domain = 'fixture.example.com',
    before =
      '# Managed by LINUX\nserver {\n listen 443 ssl;\n ssl_certificate /etc/fixture/fullchain.pem;\n location / {\n  proxy_pass http://127.0.0.1:3000;\n }\n}\n';
  const form = managedSiteForm(before, domain);
  assert.equal(form.https, true);
  assert.equal(form.port, 443);
  assert.equal(form.upstreamPort, 3000);
  const next = nginxConfig({ ...form, upstreamPort: 4000 });
  const merged = mergeHttpsLocation(next, before, form);
  assert(merged.includes('ssl_certificate /etc/fixture/fullchain.pem;'));
  assert(merged.includes('proxy_pass http://127.0.0.1:4000;'));
  assert.throws(() => mergeHttpsLocation(next, before, { ...form, port: 80 }));
  assert.equal(managedSiteForm(before.replace('  proxy_pass', '  if ($x) {\n  proxy_pass'), domain), null);
});

test('cron deletion preserves unrelated bytes and rejects missing duplicate or malformed blocks', async () => {
  const { removeCron, deleteCron } = await import('../lib/server-tools.ts');
  const before = 'PATH=/usr/bin\n15 2 * * * /bin/true\n';
  const first = cronEntry({ name: 'backup', schedule: '0 3 * * *', command: '/bin/true', enabled: false });
  const other = cronEntry({ name: 'other', schedule: '0 4 * * *', command: '/bin/true', enabled: true });
  assert.equal(removeCron(before + first + other, 'backup'), before + other);
  for (const text of [before, before + first + first, before + '# LINUX: backup\nPATH=/evil\n'])
    assert.throws(() => removeCron(text, 'backup'));
  assert.throws(() => removeCron(before, 'backup\n* * * * * evil'));
  process.env.LINUX_ENABLE_CRON = 'false';
  await assert.rejects(deleteCron({ name: 'backup', confirm: true }), (e) => e.status === 403);
});

test('configuration drafts save validated settings to distinct workspace files', async () => {
  const { saveConfigDraft } = await import('../lib/config-profiles.ts');
  const { readCode, listFiles } = await import('../lib/workspace.ts');
  const first = await saveConfigDraft('postgresql', { port: 5433, name: '/etc/postgresql.conf' });
  const second = await saveConfigDraft('postgresql', { port: 5434 });
  assert.notEqual(first.name, second.name);
  assert.match(first.name, /^postgresql-draft-[a-f0-9-]+\.conf$/);
  assert.match((await readCode(first.name)).text, /port = 5433/);
  assert.match((await readCode(second.name)).text, /port = 5434/);
  const before = (await listFiles()).files;
  await assert.rejects(saveConfigDraft('postgresql', { port: '5432\ninclude evil' }));
  assert.deepEqual((await listFiles()).files, before);
  const node = await saveConfigDraft('nodejs', {});
  assert.match(node.name, /\.env$/);
  assert.match((await readCode(node.name)).text, /HOST=127.0.0.1/);
});

test('Node app binding choices preserve defaults and reject environment injection', async () => {
  const { configProfile } = await import('../lib/config-profiles.ts');
  assert.match(configProfile('nodejs', {}), /^HOST=127\.0\.0\.1$/m);
  for (const host of ['127.0.0.1', '::1', '0.0.0.0', '::'])
    assert(
      configProfile('nodejs', { host })
        .split('\n')
        .includes('HOST=' + host),
    );
  for (const host of ['0.0.0.0\nNODE_OPTIONS=--inspect', 'localhost', null])
    assert.throws(
      () => configProfile('nodejs', { host }),
      (error) => error.status === 400,
    );
});
test('certificate renewal targets one validated lineage or all without shell input', () => {
  assert.deepEqual(certificateCommand({ operation: 'renew-check', certName: 'example.com-0001' }), [
    '/usr/bin/certbot',
    'renew',
    '--dry-run',
    '--non-interactive',
    '--no-random-sleep-on-renew',
    '--cert-name',
    'example.com-0001',
  ]);
  assert.deepEqual(certificateCommand({ operation: 'renew-check' }), ['/usr/bin/certbot', 'renew', '--dry-run', '--non-interactive', '--no-random-sleep-on-renew']);
  for (const certName of ['', true, null, [], '../example', '--all', 'example;id', 'a\nb'])
    assert.throws(() => certificateCommand({ operation: 'renew-check', certName }));
});

test('sudo policy changes require their own permission and server gate', () => {
  const policy = {
    settings: { ...defaultSecurity, readOnly: false, serviceChanges: true, sudoWithoutPrompt: true },
    available: { sudoPolicyChanges: false },
    privilege: { ready: true },
  };
  assert.equal(featureAllowed(policy, 'sudoPolicyChanges', { sudo: true }), false);
  policy.settings.sudoPolicyChanges = true;
  assert.equal(featureAllowed(policy, 'sudoPolicyChanges', { sudo: true }), false);
  policy.available.sudoPolicyChanges = true;
  assert.equal(featureAllowed(policy, 'sudoPolicyChanges', { sudo: true }), true);
  policy.settings.sudoWithoutPrompt = false;
  assert.equal(featureAllowed(policy, 'sudoPolicyChanges', { sudo: true }), false);
});

test('editing a cron job keeps its environment scope and surrounding bytes', async () => {
  const { updateCron, cronJobs } = await import('../lib/server-tools.ts');
  const job = { name: 'daily', schedule: '0 3 * * *', command: '/bin/true', enabled: true };
  const prefix = 'SHELL=/bin/sh\nPATH=/usr/bin\nMAILTO=first@example.invalid\nCRON_TZ=UTC\n';
  const suffix =
    '\n# later jobs use a different environment\nPATH=/opt/other/bin\nSHELL=/bin/bash\nMAILTO=second@example.invalid\nCRON_TZ=Asia/Seoul\n0 9 * * * /bin/true\n\n';
  const before = prefix + cronEntry(job) + suffix;
  const replacement = { ...job, schedule: '15 4 * * *', command: '/usr/bin/true', enabled: false };
  const after = updateCron(before, replacement);
  assert.equal(after, prefix + cronEntry(replacement) + suffix);
  assert.deepEqual(cronJobs(after), [replacement]);
  assert.equal(updateCron(after, job), before);
});

test('cron identity is the OS process account and ignores environment usernames', async () => {
  const { cronAccount } = await import('../lib/server-tools.ts');
  const { userInfo } = await import('node:os');
  const saved = { USER: process.env.USER, LOGNAME: process.env.LOGNAME };
  try {
    process.env.USER = 'not-the-os-account';
    process.env.LOGNAME = 'not-the-os-account';
    const account = userInfo();
    assert.deepEqual(cronAccount(), { username: account.username, uid: account.uid, gid: account.gid });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
