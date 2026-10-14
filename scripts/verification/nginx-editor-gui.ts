import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const project = process.cwd(),
  build = process.argv[2],
  scenario = process.argv[3] || 'editor';
assert(['editor', 'restore-popup', 'pending-apply', 'auxiliary-inputs', 'pending-route', 'http-settings', 'proxy-settings', 'upstream-settings', 'tls-settings', 'conflict-notice'].includes(scenario));
assert(build && path.isAbsolute(build));
const sourceFiles=await assertCurrentCompiledSource(build,project);
const fixture=await verificationWorkDirectory('tastedev-nginx-editor-gui-');
let child:ChildProcess|undefined,
  closed:Promise<unknown>|undefined,
  logs = '',
  status = 'FAIL',
  gui:Record<string,unknown>|undefined;
const socket = createServer();
await new Promise<void>((resolve,reject) => {socket.once('error',reject);socket.listen(0, '127.0.0.2', resolve);});
const address=socket.address();assert(address&&typeof address==='object');const port=address.port;
await new Promise<void>((resolve) => socket.close(()=>resolve()));
const base = 'http://127.0.0.2:' + port;
process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
const { passwordHash } = await import('../../lib/auth-password.ts'),
  { storeCredentials } = await import('../../lib/auth-store.ts');
const username = 'nginx-editor-fixture',
  password = randomBytes(24).toString('base64url');
storeCredentials(username, await passwordHash(password));
const source =
  'worker_processes 1;\nevents { worker_connections 64; }\nhttp {\n' +(scenario==='upstream-settings'?'    upstream backend { server 127.0.0.1:3000; keepalive 32; }\n':['tls-settings','conflict-notice'].includes(scenario)?'    upstream backend { ip_hash; server 127.0.0.1:3000; keepalive 32; }\n':'')+'    server {\n        listen 18080;\n        server_name fixture.example.invalid;\n' +
  Array.from({ length: 65 }, (_, i) => '        # fixture line ' + i + ' ' + '.'.repeat(180)).join('\n') +
  '\n        location / { return 200 "fixture"; }\n    }\n}\n';
try {
  await mkdir(path.join(fixture, 'nginx/conf.d'), { recursive: true, mode: 0o700 });
  await writeFile(path.join(fixture, 'nginx/nginx.conf'), source, { mode: 0o600 });
  const env:NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    BETTER_AUTH_URL: base,
    LINUX_WORKSPACE_ROOT: path.join(fixture, 'workspace'),
    LINUX_ENABLE_TERMINAL: 'false',
    LINUX_ENABLE_ADMIN: 'false',
    LINUX_ENABLE_CRON: 'false',
    LINUX_ENABLE_INSTALL: 'false',
    LINUX_ENABLE_AI: 'false',
  };
  delete env.OPENAI_API_KEY;
  delete env.LINUX_LOGIN_USERNAME;
  delete env.LINUX_LOGIN_PASSWORD_HASH;
  const args = [
    '--unshare-user',
    '--uid',
    '0',
    '--gid',
    '0',
    '--unshare-pid',
    '--die-with-parent',
    '--new-session',
    '--ro-bind',
    '/',
    '/',
    '--bind',
    fixture,
    fixture,
    '--tmpfs',
    '/etc',
    '--ro-bind',
    '/etc/passwd',
    '/etc/passwd',
    '--ro-bind',
    '/etc/group',
    '/etc/group',
    '--ro-bind',
    path.join(fixture, 'nginx'),
    '/etc/nginx',
    '--tmpfs',
    '/run',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    process.execPath,
    path.join(project, 'node_modules/next/dist/bin/next'),
    'start',
    '--hostname',
    '127.0.0.2',
    '--port',
    String(port),
  ];
  child = spawn('/usr/bin/bwrap', args, { cwd: build, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  closed = once(child, 'close');assert(child.stdout&&child.stderr);
  child.stdout.on('data', (data) => (logs += data));
  child.stderr.on('data', (data) => (logs += data));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error('Fixture server exited: ' + logs.slice(-2000));
    try {
      if ((await fetch(base + '/login')).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready);
  await writeFile(path.join(fixture, 'gui-login.json'), JSON.stringify({ username, password }), { mode: 0o600 });
  console.log(JSON.stringify({ status: 'GUI_READY', fixture, url: base + '/ide/packages/nginx' }));
  const deadline = Date.now() + 300000;
  for (;;) {
    assert(child.exitCode === null, 'Fixture server exited');
    assert(Date.now() < deadline, 'GUI timeout');
    try {
      gui = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'gui-result.json'), 'utf8')));
      break;
    } catch (error) {
      if (!hasErrorCode(error,'ENOENT')) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(gui.status, 'PASS');
  if (scenario === 'conflict-notice') {
    for(const key of ['settingsAlertAtTop','codeAlertAtTop','sourcePreserved','outerScrollAbsent','loggedOut']) assert.equal(gui[key], true, key);
  } else if (scenario === 'tls-settings') {
    for(const key of ['ocspChoiceAdded','sessionCacheCompound','handshakeSwitchAdded','balancerConflict','outerScrollAbsent','loggedOut']) assert.equal(gui[key], true, key);
  } else if (scenario === 'upstream-settings') {
    for(const key of ['koreanServerHelp','valuelessAdded','beforeKeepalive','keepaliveInputs','outerScrollAbsent','loggedOut']) assert.equal(gui[key], true, key);
  } else if (scenario === 'proxy-settings') {
    for(const key of ['koreanRetrySearch','zeroValueAdded','cacheSwitchAdded','compoundCookieAdded','codeOrderReflected','outerScrollAbsent','loggedOut']) assert.equal(gui[key], true, key);
  } else if (scenario === 'http-settings') {
    assert.equal(gui.koreanCacheSearch, true);
    assert.equal(gui.cacheCompoundValue, true);
    assert.equal(gui.internalAddedWithoutArgument, true);
    assert.equal(gui.internalRowRetained, true);
    assert.equal(gui.outerScrollAbsent, true);
  } else if (scenario === 'pending-route') {
    assert.equal(gui.customInputRestoredAcrossPage, true);
    assert.equal(gui.blockArgumentsRestoredAcrossPage, true);
    assert.equal(gui.clearedOnLogout, true);
  } else if (scenario === 'auxiliary-inputs') {
    assert.equal(gui.customInputRestored, true);
    assert.equal(gui.blockArgumentsRestored, true);
    assert.equal(gui.newBlockInputRestored, true);
    assert.equal(gui.pendingWarningVisible, true);
    assert.equal(gui.commitClearsPending, true);
  } else if (scenario === 'pending-apply') {
    assert.equal(gui.pendingSettingBlocksReview, true);
    assert.equal(gui.pendingCodeBlocksReview, true);
    assert.equal(gui.revertingInputClearsWarning, true);
  } else if (scenario === 'restore-popup') {
    assert.equal(gui.singleBackupSelector, true);
    assert.equal(gui.reviewedRestoreVisible, true);
    assert.equal(gui.legacyRestoreAbsent, true);
  } else {
    assert.equal(gui.selectionRestored, true);
    assert.equal(gui.scrollRestored, true);
    assert.equal(gui.iconButtonsBorderless, true);
    assert.equal(gui.settingOrderMatchesCode, true);
  }
  assert.equal(await readFile(path.join(fixture, 'nginx/nginx.conf'), 'utf8'), source, 'Operating fixture changed');
  status = 'PASS';
} catch (error) {
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  if (child?.exitCode === null) {
    const owned=child;assert(typeof owned.pid==='number');const pid=owned.pid;const ownedClosed=closed;assert(ownedClosed);
    let timer:NodeJS.Timeout|undefined;
    const stopped = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {}
        resolve();
      }, 10000);
      ownedClosed.finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {}
    await stopped;
  }
  const evidence = path.join(
    verificationWorkRoot,
    'nginx-editor-gui-' + new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      {
        status,
        scenario,
        build,
        sourceFiles,
        gui,
        sourceSnapshot: path.join(build, 'source-snapshot.json'),
        hostSettingsChanged: false,
        configurationMountedReadOnly: true,
        liveAiRequest: false,
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(path.join(evidence, 'server.log'), logs);
  await rm(fixture, { recursive: true, force: true });
  console.log(JSON.stringify({ status, evidence: path.join(evidence, 'result.json') }));
}
