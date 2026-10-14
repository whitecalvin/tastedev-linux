import { hasErrorCode } from './error-code.ts';
import { open, lstat, opendir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { nodeAppProfile } from './node-app-profile.ts';
import { nodeAppUnit, nodeAppServiceOptions } from './node-app-unit.ts';
import { nodeAppInstalledOptions } from './node-app-service-control.ts';
type BackupOptions = { callerUid?: number; root?: string; ownerUid?: number; directory?: string };
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const fail: () => never = () => {
  throw Object.assign(Error('Invalid or unsafe Node service backup'), { status: 400 });
};
async function directory(root: string, uid: number) {
  const resolved = path.resolve(root);
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
  }
  const stat = await lstat(resolved);
  if (stat.uid !== uid || stat.mode & 0o077) fail();
}
// Internal helper API. Filesystem roots/owner are trusted dependencies, never request fields.
export async function nodeServiceBackupRecord(
  id: unknown,
  input: unknown,
  {
    callerUid,
    root = '/var/lib/linux/admin/node-services',
    ownerUid = 0,
    directory: unitDirectory = '/etc/systemd/system',
  }: BackupOptions = {},
) {
  if (
    typeof id !== 'string' ||
    !uuid.test(id) ||
    typeof callerUid !== 'number' ||
    !Number.isInteger(callerUid) ||
    callerUid <= 0 ||
    !input || typeof input !== 'object' || !('uid' in input) || !('profile' in input) || input.uid !== callerUid
  )
    fail();
  const profile = nodeAppProfile(input.profile);
  await directory(root, ownerUid);
  const handle = await open(
    path.join(root, id + '.json'),
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  let record: unknown;
  try {
    const before = await handle.stat();
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.uid !== ownerUid ||
      before.mode & 0o077 ||
      before.size > 131072
    )
      fail();
    const buffer = Buffer.alloc(131073),
      { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 131072) fail();
    const after = await handle.stat();
    if (
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.mode !== before.mode ||
      after.nlink !== 1 ||
      after.uid !== ownerUid
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
    record.target !== path.join(unitDirectory, profile.unit) ||
    typeof record.text !== 'string' ||
    Buffer.byteLength(record.text) > 65536 ||
    typeof record.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(record.createdAt)) ||
    typeof record.version !== 'string' ||
    record.version !== createHash('sha256').update(record.text).digest('hex')
  )
    fail();
  const serviceOptions = nodeAppServiceOptions(nodeAppInstalledOptions(record.text));
  if (record.text !== '# Managed by Tastedev Linux\n' + nodeAppUnit(profile, callerUid, serviceOptions)) fail();
  return { id: record.id, target: record.target, text: record.text, version: record.version, createdAt: record.createdAt, serviceOptions };
}
export async function nodeServiceBackups(input: unknown, options: BackupOptions = {}) {
  const root = options.root ?? '/var/lib/linux/admin/node-services',
    ownerUid = options.ownerUid ?? 0;
  if (typeof options.callerUid !== 'number' || !Number.isInteger(options.callerUid) || options.callerUid <= 0 || !input || typeof input !== 'object' || !('uid' in input) || !('profile' in input) || input.uid !== options.callerUid) fail();
  nodeAppProfile(input.profile);
  try {
    await directory(root, ownerUid);
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return { backups: [], warnings: 0, truncated: false };
    throw error;
  }
  const backups = [];
  let warnings = 0,
    count = 0,
    truncated = false;
  for await (const entry of await opendir(root)) {
    if (++count > 1000) {
      truncated = true;
      break;
    }
    if (!entry.name.endsWith('.json') || !uuid.test(entry.name.slice(0, -5))) continue;
    try {
      const record = await nodeServiceBackupRecord(entry.name.slice(0, -5), input, options);
      backups.push({
        id: record.id,
        createdAt: record.createdAt,
        version: record.version,
        serviceOptions: record.serviceOptions,
      });
    } catch {
      warnings++;
    }
  }
  backups.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { backups: backups.slice(0, 100), warnings, truncated: truncated || backups.length > 100 };
}
