import {sessionCookieName} from '../lib/auth.ts';
import test, { beforeEach } from 'node:test';
beforeEach(() => globalThis.__linuxLoginAttempts.clear());
import assert from 'node:assert/strict';
import { passwordHash, login, cookieSession, logoutSession, sessionCookie, changePassword } from '../lib/auth.ts';
import { getBetterAuth } from '../lib/better-auth.ts';
import { authorized } from '../lib/api.ts';
test('login uses hashed password, revocable cookie and ignores legacy bearer', async () => {
  process.env.LINUX_LOGIN_USERNAME = 'test-admin';
  process.env.LINUX_LOGIN_PASSWORD_HASH = await passwordHash('test-login-password');
  await assert.rejects(login('test-admin', 'incorrect'), (e) => e.status === 401);
  const id = await login('test-admin', 'test-login-password');
  const request = new Request('http://localhost/api/status', { headers: { Cookie: sessionCookieName() + '=' + id } });
  assert.equal((await cookieSession(request)).username, 'test-admin');
  assert.equal(await authorized(request), true);
  assert.match(sessionCookie(request, id), /HttpOnly; SameSite=Strict/);
  const { db } = await getBetterAuth();
  db.prepare('UPDATE session SET expiresAt=?').run(Date.now() - 1000);
  assert.equal(await authorized(request), false);
  assert.equal(
    await authorized(
      new Request('http://localhost', { headers: { Authorization: 'Bearer ' + process.env.LINUX_ADMIN_TOKEN } }),
    ),
    false,
  );
  const next = await login('test-admin', 'test-login-password');
  const second = new Request('http://localhost', { headers: { Cookie: sessionCookieName() + '=' + next } });
  await logoutSession(second);
  assert.equal(await cookieSession(second), null);
});

test('password changes persist securely and revoke every old session', async () => {
  const { mkdtemp, readFile, stat, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-auth-'));
  const previous = process.env.LINUX_AUTH_ROOT;
  process.env.LINUX_AUTH_ROOT = root;
  try {
    process.env.LINUX_LOGIN_USERNAME = 'test-admin';
    process.env.LINUX_LOGIN_PASSWORD_HASH = await passwordHash('old-fixture-password');
    const first = await login('test-admin', 'old-fixture-password'),
      second = await login('test-admin', 'old-fixture-password');
    const request = (id) => new Request('http://localhost', { headers: { Cookie: sessionCookieName() + '=' + id } });
    await assert.rejects(changePassword(request(first), 'wrong', 'new-fixture-password'), (e) => e.status === 401 && e.code !== 'SESSION_EXPIRED');
    assert(await cookieSession(request(first)));
    await changePassword(request(first), 'old-fixture-password', 'new-fixture-password');
    assert.equal(await cookieSession(request(first)), null);
    assert.equal(await cookieSession(request(second)), null);
    await assert.rejects(login('test-admin', 'old-fixture-password'), (e) => e.status === 401);
    const next = await login('test-admin', 'new-fixture-password');
    assert(await cookieSession(request(next)));
    assert.equal((await stat(join(root, 'auth.json'))).mode & 0o777, 0o600);
    assert(!(await readFile(join(root, 'auth.json'), 'utf8')).includes('new-fixture-password'));
  } finally {
    if (previous === undefined) delete process.env.LINUX_AUTH_ROOT;
    else process.env.LINUX_AUTH_ROOT = previous;
    await rm(root, { recursive: true, force: true });
  }
});
