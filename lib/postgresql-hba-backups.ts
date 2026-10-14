import type {Stats} from 'node:fs';
import {hasErrorCode} from './error-code.ts';
type BackupOptions={root?:string;backupUid?:number;base?:string;ownerUid?:number};
type HbaBackupRecord={id:string;kind:'postgresql-hba';target:string;text:string;version:string;createdAt:string};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { open, lstat, mkdir, opendir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { readPostgresqlHba } from './postgresql-hba-source.ts';
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const digest = (text:string) => createHash('sha256').update(text).digest('hex');
const fail:()=>never = () => {
  throw Object.assign(Error('접속 규칙 백업을 안전하게 읽을 수 없습니다.'), { status: 400 });
};
function target(value:unknown) {
  if (typeof value !== 'string' || !/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/pg_hba\.conf$/.test(value)) fail();
  return value;
}
function inputFields(input:unknown, keys:string[]):asserts input is Record<string,unknown> {
  if (!object(input) || Object.keys(input).some((key) => !keys.includes(key))) fail();
}
async function privateDirectory(root:string, uid:number, create = false) {
  let cursor = path.parse(path.resolve(root)).root;
  for (const part of path.resolve(root).slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    if (create)
      try {
        await mkdir(cursor, { mode: 0o700 });
      } catch (error) {
        if (!hasErrorCode(error,'EEXIST')) throw error;
      }
    const stat = await lstat(cursor);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      ![0, uid].includes(stat.uid) ||
      (stat.mode & 0o022 && !(stat.uid === 0 && stat.mode & 0o1000))
    )
      fail();
  }
  const stat = await lstat(root);
  if (stat.uid !== uid || stat.mode & 0o077) fail();
}
function storage(options:BackupOptions) {
  return { root: options.root ?? '/var/lib/linux/admin/postgresql-hba', uid: options.backupUid ?? 0 };
}
async function record(id:unknown, options:BackupOptions):Promise<HbaBackupRecord> {
  if (typeof id !== 'string' || !uuid.test(id)) fail();
  const { root, uid } = storage(options);
  await privateDirectory(root, uid);
  const handle = await open(
    path.join(root, id + '.json'),
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  let result:unknown;
  try {
    const safe = (stat:Stats) =>
      stat.isFile() && stat.nlink === 1 && stat.uid === uid && !(stat.mode & 0o077) && stat.size <= 1600000;
    const before = await handle.stat();
    if (!safe(before)) fail();
    const bytes = Buffer.alloc(1600001);
    let length = 0;
    while (length < bytes.length) {
      const read = await handle.read(bytes, length, bytes.length - length, null);
      if (!read.bytesRead) break;
      length += read.bytesRead;
    }
    if (length > 1600000) fail();
    const after = await handle.stat();
    if (
      !safe(after) ||
      (['dev', 'ino', 'mode', 'uid', 'gid', 'size', 'mtimeMs', 'ctimeMs'] as const).some((key) => before[key] !== after[key])
    )
      fail();
    try {
      result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length)));
    } catch {
      fail();
    }
  } finally {
    await handle.close();
  }
  if (
    !object(result) ||
    result.kind !== 'postgresql-hba' ||
    typeof result.id!=='string' || result.id !== id ||
    typeof result.text !== 'string' ||
    result.text.includes('\0') ||
    Buffer.byteLength(result.text) > 262144 ||
    typeof result.version!=='string' || result.version !== digest(result.text) ||
    typeof result.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(result.createdAt))
  )
    fail();
  const logicalTarget=target(result.target);
  return {id:result.id,kind:result.kind,target:logicalTarget,text:result.text,version:result.version,createdAt:result.createdAt};
}
// Fixture roots and uids are internal dependencies, never fields accepted from HTTP.
export async function createPostgresqlHbaBackup(input:unknown, options:BackupOptions = {}) {
  inputFields(input, ['path', 'version']);
  const requestedTarget=target(input.path);
  if (typeof input.version !== 'string' || !/^[a-f0-9]{64}$/.test(input.version)) fail();
  const source = await readPostgresqlHba({ path: requestedTarget }, options);
  if (source.version !== input.version)
    throw Object.assign(Error('접속 규칙 파일이 변경되었습니다. 다시 조회하세요.'), { status: 409 });
  const { root, uid } = storage(options);
  await privateDirectory(root, uid, true);
  const data = {
    id: randomUUID(),
    kind: 'postgresql-hba',
    target: requestedTarget,
    text: source.text,
    version: source.version,
    createdAt: new Date().toISOString(),
  };
  const file = await open(
    path.join(root, data.id + '.json'),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await file.writeFile(JSON.stringify(data));
    await file.sync();
  } finally {
    await file.close();
  }
  const directory = await open(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
  const { text, ...summary } = data;
  return { backup: summary };
}
export async function postgresqlHbaBackups(input:unknown, options:BackupOptions = {}) {
  inputFields(input, ['path']);
  const requestedTarget=target(input.path);
  const { root, uid } = storage(options);
  try {
    await privateDirectory(root, uid);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return { backups: [], warnings: 0, truncated: false };
    throw error;
  }
  const backups = [];
  let count = 0,
    warnings = 0,
    truncated = false;
  for await (const entry of await opendir(root)) {
    if (++count > 1000) {
      truncated = true;
      break;
    }
    if (!entry.name.endsWith('.json') || !uuid.test(entry.name.slice(0, -5))) continue;
    try {
      const data = await record(entry.name.slice(0, -5), options);
      if (data.target === requestedTarget) {
        const { text, ...summary } = data;
        backups.push(summary);
      }
    } catch {
      warnings++;
    }
  }
  backups.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { backups: backups.slice(0, 100), warnings, truncated: truncated || backups.length > 100 };
}
export async function postgresqlHbaRestoreDraft(input:unknown, options:BackupOptions = {}) {
  inputFields(input, ['path', 'id']);
  const requestedTarget=target(input.path);
  const backup = await record(input.id, options);
  if (backup.target !== requestedTarget) fail();
  const live = await readPostgresqlHba({ path: requestedTarget }, options);
  return {
    id: backup.id,
    path: backup.target,
    text: backup.text,
    baseline: live.text,
    sourceVersion: live.version,
    backupVersion: backup.version,
    changed: live.version !== backup.version,
    createdAt: backup.createdAt,
  };
}

export async function postgresqlHbaBackupRecord(id:unknown, options:BackupOptions = {}) {
  return record(id, options);
}
