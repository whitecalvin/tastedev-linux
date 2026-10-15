import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { passwordHash } from '../lib/auth-password.ts';

test('Better Auth retains sessions across processes and persists logout revocation', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'taste-auth-restart-'));
  const exec = promisify(execFile);
  const env = {
    ...process.env,
    LINUX_AUTH_ROOT: root,
    LINUX_LOGIN_USERNAME: 'restart-admin',
    LINUX_LOGIN_PASSWORD_HASH: await passwordHash('restart-fixture-password'),
  };
  delete env.NODE_TEST_CONTEXT;
  const moduleURL = new URL('../lib/auth.ts', import.meta.url).href;
  const run = async (code, cookie = '') =>
    JSON.parse(
      (
        await exec(
          process.execPath,
          [
            '--input-type=module',
            '-e',
            `const {login,cookieSession,logoutSession,sessionCookieName}=await import(${JSON.stringify(moduleURL)});const request=new Request('http://127.0.0.1:8791/',{headers:{cookie:sessionCookieName()+'='+process.env.FIXTURE_COOKIE}});${code}`,
          ],
          { env: { ...env, FIXTURE_COOKIE: cookie } },
        )
      ).stdout.trim(),
    );
  try {
    const token = await run("console.log(JSON.stringify(await login('restart-admin','restart-fixture-password')))");
    assert.equal(
      await run('console.log(JSON.stringify((await cookieSession(request))?.username))', token),
      'restart-admin',
    );
    assert.equal(await run('console.log(JSON.stringify(await cookieSession(request)))', token + 'tampered'), null);
    assert.equal((await stat(join(root, 'better-auth', 'secret'))).mode & 0o777, 0o600);
    assert.equal((await stat(join(root, 'better-auth', 'auth.sqlite'))).mode & 0o777, 0o600);
    await run('await logoutSession(request);console.log(JSON.stringify(true))', token);
    assert.equal(await run('console.log(JSON.stringify(await cookieSession(request)))', token), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
