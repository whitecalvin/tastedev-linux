import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, lstat, symlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { acquireConfigOperationLease } from '../lib/config-operation-lease.ts';
test('direct configuration callers retain a private cross-process lock and release it once', async () => {
  const root = await mkdtemp('/mnt/data/build/tastedev-linux/config-lease-'),
    lock = root + '/operation';
  try {
    const release = await acquireConfigOperationLease(lock);
    assert.equal((await lstat(lock)).mode & 0o777, 0o700);
    await assert.rejects(acquireConfigOperationLease(lock), (error) => error.status === 409);
    const exec = promisify(execFile),
      module = new URL('../lib/config-operation-lease.ts', import.meta.url).href;
    await assert.rejects(
      exec(process.execPath, [
        '--input-type=module',
        '-e',
        'const {acquireConfigOperationLease}=await import(process.argv[1]);await acquireConfigOperationLease(process.argv[2]);',
        module,
        lock,
      ]),
      (error) => error.code === 1,
    );
    await release();
    await release();
    await assert.rejects(lstat(lock), (error) => error.code === 'ENOENT');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('legacy links remain untouched and an invalid managed context never falls back to creating a directory', async () => {
  const root = await mkdtemp('/mnt/data/build/tastedev-linux/config-lease-'),
    lock = root + '/operation';
  try {
    await symlink(root, lock);
    await assert.rejects(acquireConfigOperationLease(lock), (error) => error.status === 409);
    assert((await lstat(lock)).isSymbolicLink());
    await rm(lock);
    const exec = promisify(execFile),
      module = new URL('../lib/config-operation-lease.ts', import.meta.url).href;
    await assert.rejects(
      exec(process.execPath, [
        '--input-type=module',
        '-e',
        "Object.defineProperty(globalThis,Symbol.for('tastedev.admin-native-lock'),{value:Object.freeze({fd:0,helper:'/usr/lib/tastedev-linux/scripts/admin/linux-admin'})});const {acquireConfigOperationLease}=await import(process.argv[1]);await acquireConfigOperationLease(process.argv[2]);",
        module,
        lock,
      ]),
      (error) => error.code === 1,
    );
    await assert.rejects(lstat(lock), (error) => error.code === 'ENOENT');
    await assert.rejects(acquireConfigOperationLease('relative'), (error) => error.status === 400);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
