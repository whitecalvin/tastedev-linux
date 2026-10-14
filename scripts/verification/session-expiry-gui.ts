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
import Database from 'better-sqlite3';
const project = process.cwd(),
  build = process.argv[2];
assert(build && path.isAbsolute(build));
await assertCurrentCompiledSource(build,project);
const fixture = await verificationWorkDirectory('tastedev-session-expiry-gui-'),
  checks:string[] = [];
let child:ChildProcess|null=null,
  closed:Promise<unknown[]>|undefined,
  logs = '',
  status = 'FAIL';
const listener = createServer();
await new Promise<void>((resolve,reject) => {listener.once('error',reject);listener.listen(0, '127.0.0.2', resolve);});
const address=listener.address();assert(address&&typeof address==='object');const port=address.port;
await new Promise<void>((resolve) => listener.close(()=>resolve()));
const base = 'http://127.0.0.2:' + port;
process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
const { passwordHash } = await import('../../lib/auth-password.ts'),
  { storeCredentials } = await import('../../lib/auth-store.ts');
const username = 'expiry-fixture',
  password = randomBytes(24).toString('base64url');
storeCredentials(username, await passwordHash(password));
const exists = async (name:string) => {
  try {
    await readFile(path.join(fixture, name));
    return true;
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return false;
    throw error;
  }
};
try {
  const env:NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production' as const,
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
  await writeFile(path.join(fixture, 'gui-login.json'), JSON.stringify({ username, password }), { mode: 0o600 });
  console.log(JSON.stringify({ status: 'GUI_READY', fixture, url: base + '/audit?filter=expiry-fixture' }));
  const deadline = Date.now() + 300000;
  let expired = false;
  for (;;) {
    assert(child.exitCode === null, 'Fixture server exited');
    assert(Date.now() < deadline, 'GUI verification timeout');
    if (!expired && (await exists('gui-expire'))) {
      const database = new Database(path.join(fixture, 'auth/better-auth/auth.sqlite'));
      const expiresAt = Date.now() + 1500;
      try {
        assert(
          database.prepare('UPDATE session SET expiresAt=? WHERE userId=?').run(expiresAt, 'tastedev-administrator')
            .changes > 0,
        );
      } finally {
        database.close();
      }
      await writeFile(path.join(fixture, 'expiry-scheduled.json'), JSON.stringify({ expiresAt }), { mode: 0o600 });
      expired = true;
      checks.push('fixture-only Better Auth session expiry scheduled');
    }
    if (await exists('gui-stop')) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(expired);
  const database = new Database(path.join(fixture, 'auth/better-auth/auth.sqlite'));
  try {
    const active=jsonRecord(database
        .prepare('SELECT COUNT(*) AS count FROM session WHERE userId=? AND expiresAt>?')
        .get('tastedev-administrator', Date.now()));assert(typeof active.count==='number'&&active.count>0,
      'Fresh re-login session missing',
    );
  } finally {
    database.close();
  }
  checks.push('new non-expired session exists after browser re-login');
  status = 'PASS';
} catch (error) {
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  if (child?.exitCode === null) {
    const ownedPid=child.pid;assert(typeof ownedPid==='number'&&closed);const ownedClosed=closed;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const stopped = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
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
    await stopped;
  }
  const evidence = path.join(
    verificationWorkRoot,
    'session-expiry-gui-' + new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      {
        status,
        build,
        checks,
        guiAssertionsRecordedSeparately: true,
        hostSettingsChanged: false,
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
