import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';

test('account setup reads the same private auth path from Next environment files and respects packaged overrides', async () => {
  const root = await mkdtemp(path.join('/mnt/data/build/tastedev-linux', 'linux-account-env-')),
    auth = path.join(root, 'private-auth'),
    exec = promisify(execFile);
  try {
    await mkdir(auth, { mode: 0o700 });
    await writeFile(
      path.join(auth, 'auth.json'),
      JSON.stringify({ username: 'fixture-admin', passwordHash: 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128) }),
      { mode: 0o600 },
    );
    await writeFile(path.join(root, '.env.local'), 'LINUX_AUTH_ROOT=' + auth + '\n');
    const env = { ...process.env, NODE_ENV: 'development', LINUX_STATE_ROOT: path.join(root, 'unused') };
    for (const key of [
      'LINUX_AUTH_ROOT',
      'LINUX_LOGIN_USERNAME',
      'LINUX_LOGIN_PASSWORD_HASH',
      'LINUX_PACKAGED',
      'NODE_TEST_CONTEXT',
    ])
      delete env[key];
    const script = fileURLToPath(new URL('../scripts/setup-admin.ts', import.meta.url));
    const args = [
      '--input-type=module',
      '-e',
      'Object.defineProperty(process.stdin,"isTTY",{value:true});await import(process.argv[1]);',
      script,
    ];
    for (const configured of [env, { ...env, LINUX_PACKAGED: 'true', LINUX_AUTH_ROOT: auth }])
      await assert.rejects(exec(process.execPath, args, { cwd: root, env: configured, timeout: 5000 }), (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /이미 계정이 설정/);
        assert.doesNotMatch(error.stdout, /관리자 사용자명/);
        return true;
      });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
