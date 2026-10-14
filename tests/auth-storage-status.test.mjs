import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, chmod, stat, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { GET, POST } from '../app/api/auth/[operation]/route.ts';
import { getBetterAuth } from '../lib/better-auth.ts';
import { handle } from '../lib/api.ts';
import { POST as protectedPost } from '../app/api/[action]/route.ts';

test('unusable auth storage returns safe 503 without creating secrets and recovers after permissions are fixed', async () => {
  const root = await mkdtemp(path.join('/mnt/data/build/tastedev-linux', 'linux-auth-permissions-')),
    previous = process.env.LINUX_AUTH_ROOT;
  process.env.LINUX_AUTH_ROOT = root;
  try {
    await writeFile(
      path.join(root, 'auth.json'),
      JSON.stringify({
        username: 'permission-fixture',
        passwordHash: 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128),
      }),
      { mode: 0o600 },
    );
    const base = path.join(root, 'better-auth');
    await mkdir(base);
    await chmod(base, 0o777);
    const response = await GET(new Request('http://localhost/api/auth/status'), { params: { operation: 'status' } });
    assert.equal(response.status, 503);
    const status = await response.json();
    assert.equal(status.authenticated, false);
    assert.equal(status.configured, null);
    assert.equal(status.storageUnavailable, true);
    assert(!status.error.includes(root));
    await assert.rejects(access(path.join(base, 'secret')), { code: 'ENOENT' });
    const blockedRequest = new Request('http://localhost/api/status', {
      headers: { cookie: 'linux_session=fixture-invalid-cookie' },
    });
    const blocked = await handle(blockedRequest, 'status');
    assert.equal(blocked.status, 503);
    assert.equal((await blocked.json()).storageUnavailable, true);
    const blockedPost = await protectedPost(
      new Request('http://localhost/api/file', {
        method: 'POST',
        headers: { cookie: 'linux_session=fixture-invalid-cookie', 'Content-Type': 'application/json' },
        body: '{}',
      }),
      { params: { action: 'file' } },
    );
    assert.equal(blockedPost.status, 503);
    assert.equal((await blockedPost.json()).storageUnavailable, true);
    const login = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'permission-fixture', password: 'fixture-password' }),
      }),
      { params: { operation: 'login' } },
    );
    assert.equal(login.status, 503);
    assert.equal((await login.json()).storageUnavailable, true);
    await chmod(base, 0o700);
    const recovered = await GET(new Request('http://localhost/api/auth/status'), { params: { operation: 'status' } });
    assert.equal(recovered.status, 200);
    assert.equal((await recovered.json()).configured, true);
    assert.equal((await stat(path.join(base, 'secret'))).mode & 0o777, 0o600);
    (await getBetterAuth()).db.close();
    globalThis.__tasteBetterAuthInstances.delete(root);
  } finally {
    if (previous === undefined) delete process.env.LINUX_AUTH_ROOT;
    else process.env.LINUX_AUTH_ROOT = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test('corrupted account files and a file used as auth root return recovery guidance without replacing data', async () => {
  const root = await mkdtemp(path.join('/mnt/data/build/tastedev-linux', 'linux-auth-invalid-')),
    previous = process.env.LINUX_AUTH_ROOT;
  try {
    process.env.LINUX_AUTH_ROOT = root;
    const file = path.join(root, 'auth.json');
    for (const contents of ['{"username":', 'null', '[]']) {
      await writeFile(file, contents, { mode: 0o600 });
      const result = await GET(new Request('http://localhost/api/auth/status'), { params: { operation: 'status' } });
      assert.equal(result.status, 503);
      assert.equal((await result.json()).storageUnavailable, true);
      assert.equal(await readFile(file, 'utf8'), contents);
      await assert.rejects(access(path.join(root, 'better-auth')), { code: 'ENOENT' });
    }
    process.env.LINUX_AUTH_ROOT = file;
    const invalidRoot = await GET(new Request('http://localhost/api/auth/status'), { params: { operation: 'status' } });
    assert.equal(invalidRoot.status, 503);
    assert.equal(await readFile(file, 'utf8'), '[]');
  } finally {
    if (previous === undefined) delete process.env.LINUX_AUTH_ROOT;
    else process.env.LINUX_AUTH_ROOT = previous;
    await rm(root, { recursive: true, force: true });
  }
});
