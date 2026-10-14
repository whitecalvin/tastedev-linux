import type {Stats} from 'node:fs';
import type {ConfigFileIdentity} from './config-journal.ts';
import {hasErrorCode} from './error-code.ts';
export type HbaJournalOptions={root?:string;backupUid?:number};
export type HbaJournalRecord={kind:'postgresql-hba-transaction-v1';target:string;backupId:string;originalVersion:string;draftVersion:string;originalIdentity:ConfigFileIdentity;stagedIdentity:ConfigFileIdentity;temp:string;baselineState:string;service:Record<string,unknown>&{hba:string;identityVerified:true;settingsSource:'running-server'}};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { mkdir, lstat, open, link, unlink, opendir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
const hash = (value:string) => createHash('sha256').update(value).digest('hex');
const fail:()=>never = () => {
  throw Object.assign(Error('중단된 접속 규칙 작업 기록을 안전하게 확인할 수 없습니다.'), { status: 409 });
};
function location(target:unknown, options:HbaJournalOptions) {
  if (typeof target !== 'string' || !/^\/etc\/postgresql\/\d+\/[a-zA-Z0-9_-]+\/pg_hba\.conf$/.test(target)) fail();
  const root = path.join(options.root ?? '/var/lib/linux/admin/postgresql-hba', 'transactions');
  return { root, file: path.join(root, hash(target) + '.json'), uid: options.backupUid ?? 0 };
}
async function directory(root:string, uid:number, create = false) {
  let current = path.parse(path.resolve(root)).root;
  for (const part of path.resolve(root).slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (create)
      try {
        await mkdir(current, { mode: 0o700 });
      } catch (error) {
        if (!hasErrorCode(error,'EEXIST')) throw error;
      }
    const stat = await lstat(current);
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
function identity(value:unknown):value is ConfigFileIdentity {
  return (
    object(value) &&
    Object.keys(value).sort().join(',') === 'dev,gid,ino,mode,uid' &&
    ['dev', 'ino', 'uid', 'gid', 'mode'].every((key) => typeof value[key]==='number'&&Number.isSafeInteger(value[key]) && value[key] >= 0) &&
    typeof value.mode==='number'&&value.mode <= 0o777
  );
}
function valid(value:unknown, target:unknown):value is HbaJournalRecord {
  return (
    object(value) &&
    Object.keys(value).sort().join(',') ===
      'backupId,baselineState,draftVersion,kind,originalIdentity,originalVersion,service,stagedIdentity,target,temp' &&
    value.kind === 'postgresql-hba-transaction-v1' &&
    typeof value.target==='string'&&value.target === target &&
    typeof value.backupId==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value.backupId) &&
    ['draftVersion', 'originalVersion'].every(
      (key) => typeof value[key] === 'string' && /^[a-f0-9]{64}$/.test(value[key]),
    ) &&
    identity(value.originalIdentity) &&
    identity(value.stagedIdentity) &&
    typeof value.temp === 'string' &&
    /^\.tastedev-hba-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value.temp) &&
    typeof value.baselineState === 'string' &&
    Buffer.byteLength(value.baselineState) <= 40000 &&
    object(value.service) &&
    value.service.hba === target &&
    value.service.identityVerified === true &&
    value.service.settingsSource === 'running-server'
  );
}
function fileSafe(stat:Stats, uid:number) {
  return stat.isFile() && stat.nlink === 1 && stat.uid === uid && (stat.mode & 0o777) === 0o600 && stat.size <= 65536;
}
async function sync(root:string) {
  const fd = await open(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await fd.sync();
  } finally {
    await fd.close();
  }
}
// Immutable write-ahead record. No config text or secret is copied into it.
// Fixture roots/uid are dependencies, never values accepted from HTTP input.
export async function createPostgresqlHbaJournal(record:unknown, options:HbaJournalOptions = {}) {
  if (!valid(record, object(record)?record.target:undefined)) fail();
  const { root, file, uid } = location(record.target, options);
  await directory(root, uid, true);
  const data = JSON.stringify(record);
  if (Buffer.byteLength(data) > 65536) fail();
  const temporary = path.join(root, '.journal-init-' + randomUUID()),
    fd = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    await fd.writeFile(data);
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    await link(temporary, file);
  } catch (error) {
    if (hasErrorCode(error,'EEXIST')) fail();
    throw error;
  } finally {
    await unlink(temporary);
  }
  await sync(root);
}
export async function readPostgresqlHbaJournal(target:unknown, options:HbaJournalOptions = {}) {
  const { root, file, uid } = location(target, options);
  try {
    await directory(root, uid);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
  let fd;
  try {
    fd = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
  try {
    let before = await fd.stat();
    if (
      before.nlink === 2 &&
      before.isFile() &&
      before.uid === uid &&
      (before.mode & 0o777) === 0o600 &&
      before.size <= 65536
    ) {
      let count = 0,
        found = 0;
      for await (const entry of await opendir(root)) {
        if (++count > 1000) fail();
        if (!/^\.journal-init-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(entry.name)) continue;
        const alias = path.join(root, entry.name),
          stat = await lstat(alias);
        if (
          stat.isFile() &&
          !stat.isSymbolicLink() &&
          stat.uid === uid &&
          (stat.mode & 0o777) === 0o600 &&
          stat.dev === before.dev &&
          stat.ino === before.ino
        ) {
          if (++found > 1) fail();
          await unlink(alias);
        }
      }
      before = await fd.stat();
      if (before.nlink !== 1) fail();
      await sync(root);
    }
    if (!fileSafe(before, uid)) fail();
    const bytes = Buffer.alloc(65537);
    let size = 0;
    while (size < bytes.length) {
      const result = await fd.read(bytes, size, bytes.length - size, null);
      if (!result.bytesRead) break;
      size += result.bytesRead;
    }
    const after = await fd.stat(),
      named = await lstat(file);
    if (
      size > 65536 ||
      !fileSafe(after, uid) ||
      !fileSafe(named, uid) ||
      (['dev', 'ino', 'uid', 'gid', 'mode', 'size', 'mtimeMs', 'ctimeMs'] as const).some(
        (key) => before[key] !== after[key] || before[key] !== named[key],
      )
    )
      fail();
    let record:unknown;
    try {
      record = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, size)));
    } catch {
      fail();
    }
    if (!valid(record, target)) fail();
    return {
      record,
      identity: {
        dev: before.dev,
        ino: before.ino,
        size: before.size,
        mtimeMs: before.mtimeMs,
        ctimeMs: before.ctimeMs,
      },
    };
  } finally {
    await fd.close();
  }
}
export async function clearPostgresqlHbaJournal(target:unknown, expected:unknown, options:HbaJournalOptions = {}) {
  const current = await readPostgresqlHbaJournal(target, options);
  if (!current || JSON.stringify(current) !== JSON.stringify(expected)) fail();
  const { root, file } = location(target, options);
  await unlink(file);
  await sync(root);
}
export async function assertPostgresqlHbaJournalClear(target:unknown, options:HbaJournalOptions = {}) {
  if (await readPostgresqlHbaJournal(target, options))
    throw Object.assign(Error('중단된 접속 규칙 작업을 복구한 뒤 다시 검토하세요.'), { status: 409 });
}
