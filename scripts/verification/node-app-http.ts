import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord,recordField,listField,successfulJson} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdtemp, mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const project = process.cwd(),
  build = process.argv[2],
  hash = (value:string|Buffer) => createHash('sha256').update(value).digest('hex');
if (!build || !path.isAbsolute(build)) throw Error('Pass the absolute current compiled source directory.');
const fixture = await verificationWorkDirectory('tastedev-node-app-http-'),
  checks:string[] = [],
  evidence = path.join(
    verificationWorkRoot,
    'node-app-http-' + new Date().toISOString().replaceAll(':', '-'),
  );
let child:ChildProcess|null=null,
  closed:Promise<unknown[]>|undefined,
  logs = '';
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await closed;
  }
  child = null;
}
try {
  await assertCurrentCompiledSource(build,project);
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const address=socket.address();assert(address&&typeof address==='object');const port=address.port;
  await new Promise<void>((resolve) => socket.close(()=>resolve()));
  const base = 'http://127.0.0.1:' + port;
  const auth = path.join(fixture, 'auth'),
    state = path.join(fixture, 'state'),
    workspace = path.join(fixture, 'workspace');
  for (const directory of [auth, state, workspace]) await mkdir(directory, { mode: 0o700 });
  process.env.LINUX_AUTH_ROOT = auth;
  process.env.LINUX_STATE_ROOT = state;
  process.env.LINUX_WORKSPACE_ROOT = workspace;
  const { passwordHash } = await import('../../lib/auth-password.ts'),
    { storeCredentials } = await import('../../lib/auth-store.ts');
  const username = 'node-env-fixture',
    password = randomBytes(24).toString('base64url');
  storeCredentials(username, await passwordHash(password));
  const { defaultSecurity } = await import('../../lib/security.ts');
  const policy = { ...defaultSecurity, readOnly: false, fileEditing: true };
  await writeFile(path.join(state, 'security.json'), JSON.stringify(policy), { mode: 0o600 });
  const name = 'app.env',
    file = path.join(workspace, name),
    original = '# 한글 설정 😀\r\nTOKEN=fixture-private-token\r\nPORT=3000 # 앱 포트\r\nHOST=127.0.0.1\r\n';
  await writeFile(file, original, { mode: 0o600 });
  const request = (route:string, options:RequestInit = {}) =>
    fetch(base + route, { redirect: 'manual', ...options, signal: AbortSignal.timeout(20000) });
  async function start() {
    const env:NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'production' as const,
      NEXT_TELEMETRY_DISABLED: '1',
      BETTER_AUTH_URL: base,
      LINUX_ENABLE_ADMIN: 'false',
      LINUX_ENABLE_INSTALL: 'false',
      LINUX_ENABLE_TERMINAL: 'false',
      LINUX_ENABLE_CRON: 'false',
      LINUX_ENABLE_AI: 'false',
    };
    delete env.LINUX_LOGIN_USERNAME;
    delete env.LINUX_LOGIN_PASSWORD_HASH;
    delete env.OPENAI_API_KEY;
    child = spawn(
      process.execPath,
      [
        path.join(project, 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      { cwd: build, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    closed = once(child, 'close');
    assert(child.stdout&&child.stderr);child.stdout.on('data', (bytes) => (logs += bytes));
    child.stderr.on('data', (bytes) => (logs += bytes));
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw Error('Server exited before readiness');
      try {
        if ((await request('/login')).status === 200) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error('Server readiness timeout');
  }
  await start();
  if (process.getuid?.() === 0) throw Error('Node app registration must run as the installing non-root user.');
  for (const route of ['/api/node-apps', '/api/node-app-files?id=fixture', '/api/node-app-env?id=fixture'])
    assert.equal((await request(route)).status, 401);
  checks.push('registration, file inspection and environment endpoints reject unauthenticated requests');
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200);
  const token=login.headers.get('set-cookie');assert(token);const cookie=token.split(';')[0];
  const get = (route:string) => request('/api/' + route, { headers: { Cookie: cookie } }),
    post = (action:string, data:unknown) =>
      request('/api/' + action, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  const json=successfulJson;
  const appFolder = path.join(fixture, 'application');
  await mkdir(appFolder, { mode: 0o700 });
  const appCode = 'throw new Error("This fixture must never execute");\n';
  await writeFile(path.join(appFolder, 'server.mjs'), appCode, { mode: 0o600 });
  const appEnv = path.join(appFolder, 'app.env');
  await writeFile(appEnv, original, { mode: 0o600 });
  const profile = {
      id: 'fixture-app',
      label: '한글 앱 😀',
      directory: appFolder,
      entry: 'server.mjs',
      environmentFile: 'app.env',
    },
    initial = await json(await get('node-apps'));
  assert.equal(listField(initial,'apps').length, 0);
  const register = { version: initial.version, profile };
  await writeFile(path.join(state, 'security.json'), JSON.stringify({ ...policy, readOnly: true }), { mode: 0o600 });
  assert.equal((await post('node-apps', register)).status, 403);
  await writeFile(path.join(state, 'security.json'), JSON.stringify(policy), { mode: 0o600 });
  const registered = await json(await post('node-apps', register));
  assert.equal(listField(registered,'apps').length, 1);
  assert.equal(listField(registered,'apps')[0].label, profile.label);
  assert.equal(listField(registered,'apps')[0].unit, 'tastedev-node-fixture-app.service');
  assert.equal((await lstat(path.join(state, 'node-apps/apps.json'))).mode & 0o777, 0o600);
  assert.equal((await post('node-apps', register)).status, 409);
  checks.push('non-root account registers a Unicode app in a private registry and rejects stale or read-only writes');
  const inspected = await json(await get('node-app-files?id=' + profile.id));
  assert.equal(inspected.ready, true);
  assert.equal(inspected.directory, appFolder);
  assert.equal(listField(inspected,'files').length, 2);
  assert(!JSON.stringify(inspected).includes('fixture-private-token'));
  const snapshot = await json(await get('node-app-env?id=' + profile.id));
  assert.equal(recordField(snapshot,'values').port, 3000);
  assert(!JSON.stringify(snapshot).includes('fixture-private-token'));
  checks.push('registered app inspection validates files and only exposes supported environment values');
  const update = {
    id: profile.id,
    registryVersion: snapshot.registryVersion,
    version: snapshot.version,
    changes: { port: 3100 },
    confirm: true,
  };
  assert.equal((await post('node-app-env', { ...update, confirm: false })).status, 400);
  const changed = original.replace('PORT=3000', 'PORT=3100'),
    saved = await json(await post('node-app-env', update));
  assert.equal(saved.saved, true);
  assert.equal(await readFile(appEnv, 'utf8'), changed);
  assert.equal((await post('node-app-env', update)).status, 409);
  const catalog = await json(await get('node-app-env-backups?id=' + profile.id));
  assert.equal(listField(catalog,'backups').length, 1);
  assert.equal(listField(catalog,'backups')[0].id, saved.backupId);
  assert(!JSON.stringify(catalog).includes('fixture-private-token'));
  checks.push(
    'actual registered app environment edits preserve comments, CRLF, Unicode and private variables and produce metadata-only backups',
  );
  const plan = await json(await get('node-app-env-restore-plan?id=' + profile.id + '&backupId=' + saved.backupId));
  assert.equal(plan.changed, true);
  assert(!JSON.stringify(plan).includes('fixture-private-token'));
  const restoration = {
    id: profile.id,
    backupId: plan.backupId,
    version: plan.version,
    registryVersion: plan.registryVersion,
    backupVersion: plan.backupVersion,
    confirm: true,
  };
  assert.equal((await post('node-app-env-restore', { ...restoration, confirm: false })).status, 400);
  await stop();
  await start();
  assert.equal(listField(await json(await get('node-apps')),'apps')[0].id, profile.id);
  const restored = await json(await post('node-app-env-restore', restoration));
  assert.equal(restored.saved, true);
  assert.equal(await readFile(appEnv, 'utf8'), original);
  assert.equal(listField(await json(await get('node-app-env-backups?id=' + profile.id)),'backups').length, 2);
  assert.equal((await post('node-app-env-restore', restoration)).status, 409);
  checks.push('actual server restart preserves session and registration, and restoration returns exact original bytes');
  const renamed = await json(
    await post('node-apps', { version: registered.version, profile: { ...profile, label: '수정된 앱' } }),
  );
  assert.equal(listField(renamed,'apps')[0].label, '수정된 앱');
  assert.equal((await post('node-app-env', { ...update, version: restored.version })).status, 409);
  checks.push('registry edit updates label and invalidates stale environment registry version');
  const removal = { id: profile.id, version: renamed.version, confirm: true };
  assert.equal((await post('node-app-remove', { ...removal, confirm: false })).status, 400);
  const removed = await json(await post('node-app-remove', removal));
  assert.equal(listField(removed,'apps').length, 0);
  assert.equal(await readFile(path.join(appFolder, 'server.mjs'), 'utf8'), appCode);
  assert.equal(await readFile(appEnv, 'utf8'), original);
  assert.equal((await get('node-app-env?id=' + profile.id)).status, 404);
  checks.push('unregistering requires confirmation and preserves application code and environment files');
  const audit=listField(await json(await get('audit')),'events');
  for (const action of ['node-apps', 'node-app-env', 'node-app-env-restore', 'node-app-remove']) {
    assert(
      audit.some((event) => event.action === action && event.result === 'completed'),
      action,
    );
    assert(
      audit.some((event) => event.action === action && event.result === 'failed'),
      action,
    );
  }
  assert(audit.some((event) => event.action === 'node-apps' && event.result === 'blocked'));
  assert(!JSON.stringify(audit).includes('fixture-private-token'));
  checks.push('registration, removal, edit and restore audit completed/failed outcomes without private contents');
  assert.equal(await readFile(file, 'utf8'), original);
  assert.equal(await readFile(path.join(appFolder, 'server.mjs'), 'utf8'), appCode);
  await stop();
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  const result = {
    status: 'PASS',
    build,
    checks,
    scope: 'temporary registered Node app Next.js HTTP lifecycle',
    hostOperationalChanges: false,
    realServiceControl: false,
    temporaryServerStopped: true,
  };
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ ...result, evidence: path.join(evidence, 'result.json') }));
} catch (error) {
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify({ status: 'FAIL', checks, diagnostic: diagnostic(error), hostOperationalChanges: false }, null, 2) + '\n',
    { mode: 0o600 },
  );
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  await stop();
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'server.log'), logs, { mode: 0o600 });
  await rm(fixture, { recursive: true, force: true });
}
