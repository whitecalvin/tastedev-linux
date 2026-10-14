import { hasErrorCode } from './error-code.ts';
import { open, lstat, opendir, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { nginxEditableFile } from './nginx-file-update.ts';
type BackupOptions = { root?: string; ownerUid?: number; base?: string; ids?: unknown };
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const fail: () => never = () => {
  throw Object.assign(Error('Invalid or unsafe nginx configuration backup'), { status: 400 });
};
async function directory(root: string, uid: number) {
  let cursor = path.parse(path.resolve(root)).root;
  for (const segment of path.resolve(root).slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const stat = await lstat(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
  }
  const stat = await lstat(root);
  if (stat.uid !== uid || stat.mode & 0o077) fail();
}
// Trusted root and owner dependencies. Backup text must never be returned by a list endpoint.
export async function nginxConfigBackupRecord(
  id: unknown,
  { root = '/var/lib/linux/admin/nginx-config', ownerUid = 0, base = '/etc/nginx' }: BackupOptions = {},
) {
  if (typeof id !== 'string' || !uuid.test(id)) fail();
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
      before.uid !== ownerUid ||
      before.nlink !== 1 ||
      before.mode & 0o077 ||
      before.size > 1600000
    )
      fail();
    const buffer = Buffer.alloc(1600001),
      { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 1600000) fail();
    const after = await handle.stat();
    if (
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.uid !== ownerUid ||
      after.nlink !== 1 ||
      after.mode & 0o077
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
    record.id !== id || typeof record.target !== 'string' ||
    typeof record.text !== 'string' ||
    record.text.includes('\0') ||
    Buffer.byteLength(record.text) > 262144 ||
    typeof record.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(record.createdAt)) ||
    typeof record.version !== 'string' ||
    record.version !== createHash('sha256').update(record.text).digest('hex')
  )
    fail();
  if (typeof record.target !== 'string' || !record.target.startsWith(base + '/')) fail();
  nginxEditableFile('/etc/nginx/' + record.target.slice(base.length + 1));
  return { id: record.id, target: record.target, text: record.text, version: record.version, createdAt: record.createdAt };
}
export function prepareNginxBackupLookup(input: unknown = {}): { ids?: string[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'ids')) fail();
  if (!Object.hasOwn(input, 'ids')) return {};
  if (!('ids' in input) || !Array.isArray(input.ids) || input.ids.length > 100 || input.ids.some(id => typeof id !== 'string' || !uuid.test(id))) fail();
  return { ids: [...new Set(input.ids)] };
}
export async function nginxConfigBackups(options: BackupOptions = {}) {
  const lookup=prepareNginxBackupLookup(Object.hasOwn(options,'ids')?{ids:options.ids}:{});
  const root = options.root ?? '/var/lib/linux/admin/nginx-config';
  try {
    await directory(root, options.ownerUid ?? 0);
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return { backups: [], warnings: 0, truncated: false };
    throw error;
  }
  const backups = [];
  let count = 0,
    warnings = 0,
    truncated = false;
  if (lookup.ids) {
    for (const id of lookup.ids) {
      try {
        const record=await nginxConfigBackupRecord(id,options);
        backups.push({id:record.id,target:record.target,version:record.version,createdAt:record.createdAt});
      } catch { warnings++; }
    }
    backups.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    return {backups,warnings,truncated:false};
  }
  for await (const entry of await opendir(root)) {
    if (++count > 1000) {
      truncated = true;
      break;
    }
    if (!entry.name.endsWith('.json') || !uuid.test(entry.name.slice(0, -5))) continue;
    try {
      const record = await nginxConfigBackupRecord(entry.name.slice(0, -5), options);
      backups.push({ id: record.id, target: record.target, version: record.version, createdAt: record.createdAt });
    } catch {
      warnings++;
    }
  }
  backups.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { backups: backups.slice(0, 100), warnings, truncated: truncated || backups.length > 100 };
}

// Trusted filesystem roots and uid are injected only by the helper or private tests.
export async function createNginxConfigBackup(
  input: unknown,
  { base = '/etc/nginx', root = '/var/lib/linux/admin/nginx-config', ownerUid = 0 }: BackupOptions = {},
) {
  if (
    !input || typeof input !== 'object' || !('path' in input) || typeof input.path !== 'string' || !('version' in input) ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['path', 'version'].includes(key)) ||
    typeof input.version !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.version)
  )
    fail();
  const relative = nginxEditableFile(input.path),
    file = path.join(base, relative);
  async function walk(dir: string, create = false) {
    let cursor = path.parse(path.resolve(dir)).root;
    for (const part of path.resolve(dir).slice(cursor.length).split(path.sep).filter(Boolean)) {
      cursor = path.join(cursor, part);
      if (create)
        try {
          await mkdir(cursor, { mode: 0o700 });
        } catch (error) {
          if (!hasErrorCode(error, 'EEXIST')) throw error;
        }
      const stat = await lstat(cursor);
      if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
    }
    const stat = await lstat(dir);
    if (stat.uid !== ownerUid || stat.mode & 0o022) fail();
  }
  await walk(path.dirname(file));
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  let text: string, version: string;
  try {
    const before = await handle.stat();
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.uid !== ownerUid ||
      before.mode & 0o022 ||
      before.size > 262144
    )
      fail();
    const buffer = Buffer.alloc(262145),
      { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 262144) fail();
    const after = await handle.stat();
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) fail();
    version = createHash('sha256').update(buffer.subarray(0, bytesRead)).digest('hex');
    if (version !== input.version)
      throw Object.assign(Error('설정 파일이 변경되었습니다. 다시 조회하세요.'), { status: 409 });
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead));
    if (text.includes('\0')) fail();
  } finally {
    await handle.close();
  }
  await walk(root, true);
  await directory(root, ownerUid);
  const record = { id: randomUUID(), target: input.path, version, text, createdAt: new Date().toISOString() };
  const backup = await open(
    path.join(root, record.id + '.json'),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await backup.writeFile(JSON.stringify(record));
    await backup.sync();
  } finally {
    await backup.close();
  }
  const { text: privateText, ...summary } = record;
  return { backup: summary };
}
