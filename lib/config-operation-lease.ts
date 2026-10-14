import type {Stats} from 'node:fs';
import {hasErrorCode} from './error-code.ts';
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { lstat, mkdir, rmdir } from 'node:fs/promises';
import { fstatSync, lstatSync, readSync } from 'node:fs';
import path from 'node:path';
const active = new Set<string>(),
  key = Symbol.for('tastedev.admin-native-lock'),
  marker = 'tastedev-linux kernel operation lock v1\n';
const fail: (message: string,status?: number)=>never = (message, status = 409) => {
  throw Object.assign(Error(message), { status });
};
function managed() {
  const context: unknown = Reflect.get(globalThis,key);
  if (context === undefined) return false;
  const property = Object.getOwnPropertyDescriptor(globalThis, key);
  if (
    process.getuid?.() !== 0 ||
    !object(context) ||
    !Object.isFrozen(context) ||
    property?.writable !== false ||
    property?.configurable !== false ||
    typeof context.fd!=='number'||!Number.isInteger(context.fd) ||
    context.helper !== '/usr/lib/tastedev-linux/scripts/admin/linux-admin'
  )
    fail('Unsafe admin operation lease context', 403);
  const fd = fstatSync(context.fd),
    named = lstatSync('/var/lib/linux/admin/operation.lock');
  const safe = (stat: Stats) =>
    stat.isFile() &&
    !stat.isSymbolicLink() &&
    stat.uid === 0 &&
    (stat.mode & 0o777) === 0o600 &&
    stat.nlink === 1 &&
    stat.size === Buffer.byteLength(marker);
  const bytes = Buffer.alloc(Buffer.byteLength(marker));
  if (
    !safe(fd) ||
    !safe(named) ||
    fd.dev !== named.dev ||
    fd.ino !== named.ino ||
    readSync(context.fd, bytes, 0, bytes.length, 0) !== bytes.length ||
    bytes.toString() !== marker
  )
    fail('Unsafe admin operation lease descriptor', 403);
  return true;
}
// The installed helper's inherited kernel lock serializes root operations across
// processes. An in-process lease leaves no stale directory after SIGKILL. Direct
// callers without that trusted context retain their cross-process directory lock.
// Unknown legacy locks are never assumed dead or removed.
export async function acquireConfigOperationLease(lock: unknown) {
  if (typeof lock !== 'string' || !path.isAbsolute(lock) || path.resolve(lock) !== lock || lock.includes('\0'))
    fail('Invalid configuration operation lease', 400);
  if (managed()) {
    if (active.has(lock)) fail('Configuration transaction already in progress');
    active.add(lock);
    try {
      try {
        await lstat(lock);
        fail('Review the existing configuration operation lock; its state is preserved');
      } catch (error) {
        if (!hasErrorCode(error,'ENOENT')) throw error;
      }
    } catch (error) {
      active.delete(lock);
      throw error;
    }
    let released = false;
    return async () => {
      if (!released) {
        released = true;
        active.delete(lock);
      }
    };
  }
  try {
    await mkdir(lock, { mode: 0o700 });
  } catch (error) {
    if (hasErrorCode(error,'EEXIST')) fail('Configuration transaction already in progress');
    throw error;
  }
  let released = false;
  return async () => {
    if (!released) {
      await rmdir(lock);
      released = true;
    }
  };
}
