import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {successfulJson,jsonRecord,recordField,listField,textField} from './http-json.ts';
import type {ChildProcessByStdio} from 'node:child_process';
import type {Readable} from 'node:stream';
import { mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
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
const fixture = await verificationWorkDirectory('tastedev-node-env-http-'),
  checks:string[] = [],
  evidence = path.join(
    verificationWorkRoot,
    'node-env-http-' + new Date().toISOString().replaceAll(':', '-'),
  );
let child:ChildProcessByStdio<null,Readable,Readable>|null=null,
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
  const snapshot = jsonRecord(JSON.parse(await readFile(path.join(build, 'source-snapshot.json'), 'utf8')));
  for (const [name, digest] of Object.entries(recordField(snapshot,'files')))
    assert.equal(hash(await readFile(path.join(project, name))), digest, 'Current source differs: ' + name);
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const address=socket.address();assert(address&&typeof address==='object');const port=address.port;
  await new Promise<void>((resolve,reject) => socket.close(error=>error?reject(error):resolve()));
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
      NODE_ENV: 'production',
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
    child.stdout.on('data', (bytes) => (logs += bytes));
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
  for (const route of ['/api/node-env?name=' + name, '/api/node-env-backups', '/api/node-env-restore-plan?id=fixture'])
    assert.equal((await request(route)).status, 401);
  checks.push('all environment read endpoints reject unauthenticated requests');
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200);
  const header=login.headers.get('set-cookie');assert(header);const cookie=header.split(';')[0];
  const get = (route:string) => request('/api/' + route, { headers: { Cookie: cookie } }),
    post = (action:string, data:unknown, origin = base) =>
      request('/api/' + action, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
  const json=successfulJson;
  const initial = await json(await get('node-env?name=' + name));
  assert.equal(recordField(initial,'values').port, 3000);
  assert.equal(initial.version, hash(original));
  assert(!JSON.stringify(initial).includes('fixture-private-token'));
  checks.push('authenticated snapshot returns supported values without secret contents');
  const payload = { name, version: initial.version, changes: { port: 3100 }, confirm: true };
  assert.equal((await post('node-env', payload, 'https://foreign.example.invalid')).status, 403);
  assert.equal((await post('node-env', { ...payload, confirm: false })).status, 400);
  for (const blocked of [{ readOnly: true }, { fileEditing: false }]) {
    await writeFile(path.join(state, 'security.json'), JSON.stringify({ ...policy, ...blocked }), { mode: 0o600 });
    assert.equal((await post('node-env', payload)).status, 403);
    assert.equal(await readFile(file, 'utf8'), original);
  }
  await writeFile(path.join(state, 'security.json'), JSON.stringify(policy), { mode: 0o600 });
  for (const target of ['../app.env', '/etc/app.env', 'app.js'])
    assert.equal((await get('node-env?name=' + encodeURIComponent(target))).status, 400);
  checks.push('foreign Origin, missing confirmation, read-only/edit policy and invalid paths prevent mutations');
  const saved = await json(await post('node-env', payload)),
    changed = original.replace('PORT=3000', 'PORT=3100');
  assert.equal(saved.saved, true);
  assert.equal(saved.version, hash(changed));
  assert.equal(await readFile(file, 'utf8'), changed);
  assert(!JSON.stringify(saved).includes('fixture-private-token'));
  const backupFile = path.join(state, 'node-env-backups', textField(saved,'backupId') + '.json'),
    record = jsonRecord(JSON.parse(await readFile(backupFile, 'utf8')));
  assert.equal(record.text, original);
  assert.equal((await lstat(backupFile)).mode & 0o777, 0o600);
  const catalog = await json(await get('node-env-backups'));
  assert.equal(listField(catalog,'backups').length, 1);
  assert.equal(listField(catalog,'backups')[0].id, saved.backupId);
  assert(!JSON.stringify(catalog).includes('fixture-private-token'));
  checks.push(
    'real file changes preserve CRLF, comments, Unicode and unknown variables; private pre-change backup contains exact original',
  );
  assert.equal((await post('node-env', payload)).status, 409);
  assert.equal(await readFile(file, 'utf8'), changed);
  checks.push('stale version prevents a second change');
  const plan = await json(await get('node-env-restore-plan?id=' + saved.backupId));
  assert.equal(plan.changed, true);
  assert(!JSON.stringify(plan).includes('fixture-private-token'));
  assert.deepEqual(
    listField(plan,'fields').find((item) => item.key === 'port'),
    { key: 'port', label: '앱 포트', before: 3100, after: 3000 },
  );
  const restoration = {
    id: textField(plan,'id'),
    name: textField(plan,'name'),
    version: textField(plan,'version'),
    backupVersion: textField(plan,'backupVersion'),
    confirm: true,
  };
  assert.equal((await post('node-env-restore', { ...restoration, confirm: false })).status, 400);
  assert.equal((await post('node-env-restore', { ...restoration, name: 'other.env' })).status, 409);
  await writeFile(backupFile, JSON.stringify({ ...record, text: 'PORT=4000\n', version: hash('PORT=4000\n') }), {
    mode: 0o600,
  });
  assert.equal((await post('node-env-restore', restoration)).status, 409);
  assert.equal(await readFile(file, 'utf8'), changed);
  await writeFile(backupFile, JSON.stringify(record), { mode: 0o600 });
  checks.push('restoration review hides secrets and rejects unconfirmed, mismatched or tampered backups');
  await stop();
  await start();
  const afterRestart = await json(await get('node-env-backups'));
  assert.equal(listField(afterRestart,'backups')[0].id, saved.backupId);
  checks.push('real server restart preserves session and backup catalog');
  const restored = await json(await post('node-env-restore', restoration));
  assert.equal(restored.saved, true);
  assert.equal(restored.version, initial.version);
  assert.equal(await readFile(file, 'utf8'), original);
  const beforeRestore = jsonRecord(JSON.parse(
    await readFile(path.join(state, 'node-env-backups', textField(restored,'backupId') + '.json'), 'utf8'),
  ));
  assert.equal(beforeRestore.text, changed);
  assert.equal(listField(await json(await get('node-env-backups')),'backups').length, 2);
  assert.equal((await post('node-env-restore', restoration)).status, 409);
  assert.equal(await readFile(file, 'utf8'), original);
  checks.push(
    'actual restoration returns original bytes, backs up replaced bytes and rejects repeated stale restoration',
  );
  const audit = listField(await json(await get('audit')),'events');
  assert(audit.some((item) => item.action === 'node-env' && item.result === 'completed'));
  assert(audit.some((item) => item.action === 'node-env-restore' && item.result === 'completed'));
  assert(audit.some((item) => item.action === 'node-env-restore' && item.result === 'failed'));
  assert(!JSON.stringify(audit).includes('fixture-private-token'));
  checks.push('change and restore outcomes are audited without environment contents');
  await stop();
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  const result = {
    status: 'PASS',
    build,
    checks,
    scope: 'temporary workspace Node environment Next.js HTTP lifecycle',
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
    JSON.stringify({ status: 'FAIL', checks, diagnostic: error instanceof Error?error.stack:String(error), hostOperationalChanges: false }, null, 2) + '\n',
    { mode: 0o600 },
  );
  console.error(error instanceof Error?error.stack:String(error));
  process.exitCode = 1;
} finally {
  await stop();
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'server.log'), logs, { mode: 0o600 });
  await rm(fixture, { recursive: true, force: true });
}
