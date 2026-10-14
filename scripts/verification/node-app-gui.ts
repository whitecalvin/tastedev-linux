import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord,listField,successfulJson} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdir, writeFile, readFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const layoutOnly = process.argv.includes('--layout');
const project = process.cwd(),
  build = process.argv[2];
if (!build || !path.isAbsolute(build)) throw Error('Pass the absolute current compiled source directory.');
const sourceFiles=await assertCurrentCompiledSource(build,project);
const fixture = await verificationWorkDirectory('tastedev-node-app-gui-'),
  checks:string[] = [],
  evidence = path.join(
    verificationWorkRoot,
    'node-app-gui-' + new Date().toISOString().replaceAll(':', '-'),
  );
let child:ChildProcess|null=null,
  closed:Promise<unknown>|undefined,
  logs = '';
function childStopped(){return !child||child.exitCode!==null;}
async function stop() {
  if (!child) return;const owned=child;assert(typeof owned.pid==='number');const pid=owned.pid;
  try {
    process.kill(-pid, 'SIGTERM');
  } catch (error) {
    if (!hasErrorCode(error,'ESRCH')) throw error;
  }
  let timer:NodeJS.Timeout|undefined;
  try {
    await Promise.race([
      closed,
      new Promise<void>((resolve, reject) => {
        timer = setTimeout(() => {
          try {
            process.kill(-pid, 'SIGKILL');
          } catch {}
          reject(Error('GUI server cleanup timeout'));
        }, 10000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    child = null;
  }
}
try {
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.2', resolve);
  });
  const address=socket.address();assert(address&&typeof address==='object');const port=address.port;
  await new Promise<void>((resolve) => socket.close(()=>resolve()));
  const base = 'http://127.0.0.2:' + port;
  const auth = path.join(fixture, 'auth'),
    state = path.join(fixture, 'state'),
    workspace = path.join(fixture, 'workspace');
  for (const directory of [auth, state, workspace,path.join(fixture,'tmp')]) await mkdir(directory, { mode: 0o700 });
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
      '/usr/bin/bwrap',
      [
        '--unshare-user',
        '--ro-bind',
        '/',
        '/',
        '--bind',
        fixture,
        fixture,
        '--perms',
        '0755',
        '--tmpfs',
        path.join(fixture,'tmp'),
        '--ro-bind',
        build,
        build,
        '--ro-bind',
        path.join(fixture, 'dpkg-query'),
        '/usr/bin/dpkg-query',
        '--proc',
        '/proc',
        '--dev',
        '/dev',
        '--die-with-parent',
        '--',
        process.execPath,
        path.join(project, 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.2',
        '--port',
        String(port),
      ],
      { cwd: build, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    closed = once(child, 'close');assert(child.stdout&&child.stderr);
    child.stdout.on('data', (bytes) => (logs += bytes));
    child.stderr.on('data', (bytes) => (logs += bytes));
    for (let attempt = 0; attempt < 100; attempt++) {
      if (childStopped()) throw Error('Server exited before readiness');
      try {
        if ((await request('/login')).status === 200) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error('Server readiness timeout');
  }
  await writeFile(
    path.join(fixture, 'dpkg-query'),
    '#!' +
      process.execPath +
      '\nconst args=process.argv.slice(2);if(args.length===3&&args[0]==="-W"&&args[1]==="-f=${Status}\\t${Version}"&&["nodejs","npm"].includes(args[2]))process.stdout.write("install ok installed\\tgui-fixture-only");else process.exit(1);\n',
    { mode: 0o700 },
  );
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
  const setCookie=login.headers.get('set-cookie');assert(setCookie);const cookie=setCookie.split(';')[0];
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
  await writeFile(path.join(fixture, 'gui-login.json'), JSON.stringify({ username, password }), { mode: 0o600 });
  console.log(
    JSON.stringify({
      status: 'GUI_READY',
      fixture,
      url: base + '/ide/packages/nodejs',
      stopFile: path.join(fixture, 'gui-stop'),
    }),
  );
  const deadline = Date.now() + 300000;
  for (;;) {
    if (childStopped()) throw Error('GUI server exited');
    try {
      await lstat(path.join(fixture, 'gui-stop'));
      break;
    } catch {}
    if (Date.now() > deadline) throw Error('GUI verification deadline expired');
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(await readFile(appEnv, 'utf8'), original);
  assert.equal(await readFile(path.join(appFolder, 'server.mjs'), 'utf8'), appCode);
  const backups = await json(await get('node-app-env-backups?id=' + profile.id));
  assert.equal(listField(backups,'backups').length, layoutOnly ? 0 : 2);
  if (layoutOnly) {
    const layout = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'gui-layout.json'), 'utf8')));for(const key of ['pageScrollHeight','pageHeight','tabsTop','beforeTabsTop','panelScrollTop','panelBottom'])assert(typeof layout[key]==='number');
    assert.equal(layout.pageScrollHeight, layout.pageHeight);
    assert.equal(layout.tabsTop, layout.beforeTabsTop);
    assert(typeof layout.panelScrollTop==='number'&&layout.panelScrollTop > 0);
    assert(typeof layout.panelBottom==='number'&&typeof layout.pageHeight==='number'&&layout.panelBottom <= layout.pageHeight);
    checks.push('browser tab strip stays fixed while only the bounded settings panel scrolls');
  } else
    checks.push('browser environment edit and restore created two backups and preserved original application files');
  await stop();
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  const result = {
    status: 'PASS',
    build,
    sourceFiles,
    checks,
    scope: layoutOnly
      ? 'registered Node app browser layout fixture'
      : 'registered Node app browser edit/restore fixture',
    hostOperationalChanges: false,
    realServiceControl: false,
    guiInventoryAdapter: true,
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
