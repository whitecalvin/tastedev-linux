import { hasErrorCode } from './error-code.ts';
import { open, lstat, opendir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const fail: () => never = () => {
  throw Object.assign(new Error('Invalid or unsafe Redis configuration backup'), { status: 400 });
};
async function directory(root: string, uid: number) {
  let current = path.parse(path.resolve(root)).root;
  for (const part of path.resolve(root).slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
  }
  const stat = await lstat(root);
  if (stat.uid !== uid || stat.mode & 0o077) fail();
}
// Internal root helper use only. uid/root are trusted fixture parameters.
export async function redisBackupRecord(
  id: unknown,
  root = '/var/lib/linux/admin/redis',
  uid = 0,
  target = '/etc/redis/redis.conf',
) {
  if (typeof id !== 'string' || !uuid.test(id)) fail();
  await directory(root, uid);
  const file = path.join(root, id + '.json');
  if (!(await lstat(file)).isFile()) fail();
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  let record: unknown;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.uid !== uid || stat.mode & 0o077 || stat.size > 2097152) fail();
    const buffer = Buffer.alloc(2097153),
      { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 2097152) fail();
    const after = await handle.stat();
    if (
      after.size !== stat.size ||
      after.mtimeMs !== stat.mtimeMs ||
      after.mode !== stat.mode ||
      after.uid !== uid ||
      after.nlink !== 1
    )
      fail();
    try {
      record = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead)));
    } catch {
      fail();
    }
  } finally {
    await handle.close();
  }
  if (
    !record || typeof record !== 'object' || Array.isArray(record) ||
    !('id' in record) || !('target' in record) || !('text' in record) || !('version' in record) || !('createdAt' in record) ||
    record.id !== id ||
    typeof record.target !== 'string' ||
    record.target !== target ||
    typeof record.text !== 'string' ||
    record.text.includes('\0') ||
    Buffer.byteLength(record.text) > 262144 ||
    typeof record.version !== 'string' ||
    record.version !== createHash('sha256').update(record.text).digest('hex') ||
    typeof record.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(record.createdAt))
  )
    fail();
  return { id: record.id, target: record.target, text: record.text, version: record.version, createdAt: record.createdAt };
}
export async function redisBackups(root = '/var/lib/linux/admin/redis', uid = 0) {
  try {
    await directory(root, uid);
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return { backups: [], warnings: 0, truncated: false };
    throw error;
  }
  const backups = [];
  let warnings = 0,
    count = 0,
    truncated = false;
  const entries = await opendir(root);
  for await (const entry of entries) {
    if (++count > 1000) {
      truncated = true;
      break;
    }
    if (!entry.name.endsWith('.json') || !uuid.test(entry.name.slice(0, -5))) continue;
    try {
      const record = await redisBackupRecord(entry.name.slice(0, -5), root, uid);
      backups.push({
        id: record.id,
        target: record.target,
        kind: 'redis',
        createdAt: record.createdAt,
        version: record.version,
        bytes: Buffer.byteLength(record.text),
      });
    } catch {
      warnings++;
    }
  }
  backups.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { backups: backups.slice(0, 100), warnings, truncated: truncated || backups.length > 100 };
}
