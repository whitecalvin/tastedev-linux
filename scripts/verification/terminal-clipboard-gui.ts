import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord,recordField,listField} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const project = process.cwd(),
  build = process.argv[2],scenario=process.argv[3]||'clipboard';
assert(['clipboard','controls','ansi-route'].includes(scenario));
if (!build || !path.isAbsolute(build)) throw Error('Pass an absolute current source build directory.');
await assertCurrentCompiledSource(build,project);
const fixture = await verificationWorkDirectory('tastedev-terminal-clipboard-gui-');
let child:ChildProcess|null=null,
  closed:Promise<unknown[]>|undefined,
  logs = '',
  cookie:string|undefined;
const checks:string[] = [];
const listener = createServer();
await new Promise<void>((resolve,reject) => {listener.once('error',reject);listener.listen(0, '127.0.0.2', resolve);});
const address=listener.address();assert(address&&typeof address==='object');const port=address.port;
await new Promise<void>((resolve) => listener.close(()=>resolve()));
const base = 'http://127.0.0.2:' + port;
process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
const { passwordHash } = await import('../../lib/auth-password.ts'),
  { storeCredentials } = await import('../../lib/auth-store.ts');
const username = 'clipboard-fixture',
  password = randomBytes(24).toString('base64url');
storeCredentials(username, await passwordHash(password));
const api = async (action:string, body?:unknown) => {
  assert(cookie);const response = await fetch(base + '/api/' + action, {
    headers: { Cookie: cookie, Origin: base, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  assert(response.ok, action + ': ' + response.status);
  return jsonRecord(await response.json());
};
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    const ownedPid=child.pid;assert(typeof ownedPid==='number'&&closed);const ownedClosed=closed;
    const deadline = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          process.kill(-ownedPid, 'SIGKILL');
        } catch {}
        resolve();
      }, 10000);
      ownedClosed.finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    try {
      process.kill(-ownedPid, 'SIGTERM');
    } catch {}
    await deadline;
  }
  child = null;
}
let status = 'FAIL', browserResult:Record<string,unknown>|null = null;
try {
  const env:NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production' as const,
    NEXT_TELEMETRY_DISABLED: '1',
    BETTER_AUTH_URL: base,
    LINUX_WORKSPACE_ROOT: path.join(fixture, 'workspace'),
    LINUX_ENABLE_TERMINAL: 'true',
    LINUX_ENABLE_ADMIN: 'false',
    LINUX_ENABLE_CRON: 'false',
    LINUX_ENABLE_INSTALL: 'false',
    LINUX_ENABLE_AI: 'false',
  };
  delete env.LINUX_LOGIN_USERNAME;
  delete env.LINUX_LOGIN_PASSWORD_HASH;
  delete env.OPENAI_API_KEY;
  child = spawn(
    process.execPath,
    [path.join(project, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.2', '--port', String(port)],
    { cwd: build, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  closed = once(child, 'close');
  assert(child.stdout&&child.stderr);child.stdout.on('data', (data) => (logs += data));
  child.stderr.on('data', (data) => (logs += data));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error('Fixture server exited');
    try {
      if ((await fetch(base + '/login')).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready);
  const response = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(response.status, 200);
  const token=response.headers.get('set-cookie');assert(token);cookie=token.split(';')[0];
  const security = await api('security');
  await api('security', {
    version: security.version,
    settings: { ...recordField(security,'settings'), readOnly: false, terminal: true },
  });
  checks.push('real Better Auth and fixture-only terminal policy enabled');
  await writeFile(path.join(fixture, 'gui-login.json'), JSON.stringify({ username, password }), { mode: 0o600 });
  await writeFile(path.join(fixture, 'gui-ready.json'), JSON.stringify({ url: base + '/terminal' }), { mode: 0o600 });
  console.log(JSON.stringify({ status: 'GUI_READY', fixture, url: base + '/terminal' }));
  const deadline = Date.now() + 300000;
  for (;;) {
    if (child.exitCode !== null) throw Error('Fixture server stopped');
    if (Date.now() > deadline) throw Error('GUI fixture timeout');
    try {
      await readFile(path.join(fixture, 'gui-stop'));
      break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const gui=scenario!=='clipboard'?jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8'))):null;
  browserResult=gui;
  if(gui){assert.equal(gui.status,'PASS');for(const key of scenario==='controls'?['koreanOutput','tabsIndependent','accountSettings','fullViewport','loggedOut']:['ansiCursorOverwrite','routeScreenRetained','inputRetained','singleExecution','loggedOut'])assert.equal(gui[key],true,key);checks.push(scenario==='controls'?'browser terminal controls, Korean output, independent tabs, settings and layout':'browser ANSI cursor overwrite and in-progress input survive route return without repeated command execution');}
  const context = await api('terminal-context');
  assert(listField(context,'sessions').length > 0);
  let observed = false;
  for (const job of listField(context,'sessions')) {
    const detail = await api('terminal?job=' + encodeURIComponent(String(job.id)));
    if (
      listField(recordField(detail,'job'),'logs')
        .map((item) => item.text)
        .join('')
        .includes(scenario==='controls'?'TERMINAL_GUI_한국어':scenario==='ansi-route'?'ANSI_ROUTE_GUI_한글':'CLIPBOARD_GUI_한글')
    )
      observed = true;
    if (job.status === 'running') await api('stop', { id: job.id });
  }
  assert(observed, 'Clipboard command/output not present in actual PTY history');
  checks.push(scenario==='clipboard'?'actual PTY history retains Korean command/output':'actual PTY history retains the scenario command/output');
  let stopped = false;
  for (let i = 0; i < 30; i++) {
    if (listField(await api('terminal-context'),'sessions').every((job) => job.status !== 'running')) {
      stopped = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(stopped, 'Fixture shell termination timeout');
  checks.push('all fixture shell sessions stopped');
  status = 'PASS';
} catch (error) {
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  if (cookie && child?.exitCode === null) {
    try {
      const context = await api('terminal-context');
      for (const job of listField(context,'sessions')) if (job.status === 'running') await api('stop', { id: job.id });
    } catch {}
  }
  await stop();
  const evidence = path.join(
    verificationWorkRoot,
    'terminal-clipboard-gui-' + new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      { status, build, scenario, checks, browserResult, hostSettingsChanged: false, packageOrServiceChanges: false, osImeVerified: false },
      null,
      2,
    ) + '\n',
    { mode: 0o600 },
  );
  await writeFile(path.join(evidence, 'server.log'), logs, { mode: 0o600 });
  await rm(fixture, { recursive: true, force: true });
  console.log(JSON.stringify({ status, evidence: path.join(evidence, 'result.json') }));
}
