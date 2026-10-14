import type {Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import {hasErrorCode} from './error-code.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
type BackupOptions={base?:string;backupRoot?:string;ownerUid?:number;beforePublish?:()=>unknown|Promise<unknown>};
import { open, lstat, mkdir, link, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { acquireConfigOperationLease } from './config-operation-lease.ts';
import { assertConfigJournalClear } from './config-journal.ts';

const hash = (bytes:Buffer) => createHash('sha256').update(bytes).digest('hex');
const fail: (message?:string,status?:number)=>never = (message = '설정 파일 또는 백업 저장 경로를 확인하세요.', status = 409) => {
  throw Object.assign(Error(message), { status });
};
export function prepareDatabaseConfigBackup(kind:unknown, input:unknown) {
  const request=object(input)?input:{};
  const permitted =
    kind === 'redis'
      ? request.path === '/etc/redis/redis.conf'
      : kind === 'mariadb' &&
        typeof request.path === 'string' &&
        /^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:conf\.d|mariadb\.conf\.d)\/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.cnf)$/.test(
          request.path,
        );
  if (
    !object(input) ||
    Object.keys(input).some((key) => !['path', 'version', 'confirm'].includes(key)) ||
    !permitted ||
    input.confirm !== true ||
    typeof input.version !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.version)
  )
    fail('설정 백업 요청을 다시 확인하세요.', 400);
  if(typeof request.path!=='string')fail('설정 백업 요청을 다시 확인하세요.',400);
  return { path: request.path, version: input.version, confirm: true };
}
const identity = (stat:Stats) => [
  stat.dev,
  stat.ino,
  stat.uid,
  stat.gid,
  stat.mode,
  stat.nlink,
  stat.size,
  stat.mtimeMs,
  stat.ctimeMs,
];
const same = (a:unknown, b:unknown) => JSON.stringify(a) === JSON.stringify(b);
async function safeDirectory(directory:string, uid:number|undefined, { create = false, privateRoot = false } = {}) {
  if (typeof directory !== 'string' || !path.isAbsolute(directory) || path.resolve(directory) !== directory) fail();
  let current = '/';
  for (const part of directory.slice(1).split('/').filter(Boolean)) {
    current = path.join(current, part);
    if (create)
      await mkdir(current, { mode: 0o700 }).catch((error) => {
        if (!hasErrorCode(error,'EEXIST')) throw error;
      });
    const stat = await lstat(current);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      ![0, uid].includes(stat.uid) ||
      (stat.mode & 0o022 && !(stat.uid === 0 && stat.mode & 0o1000))
    )
      fail();
  }
  const stat = await lstat(directory);
  if (privateRoot && (stat.uid !== uid || (stat.mode & 0o777) !== 0o700)) fail();
  return stat;
}
async function readSource(file:string, uid:number|undefined) {
  await safeDirectory(path.dirname(file), uid);
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.uid !== uid || before.mode & 0o022 || before.size > 262144)
      fail();
    const bytes = Buffer.alloc(262145);
    let length = 0;
    while (length < bytes.length) {
      const result = await handle.read(bytes, length, bytes.length - length, length);
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, length));
    if (
      length > 262144 ||
      text.includes('\0') ||
      !same(identity(before), identity(await handle.stat())) ||
      !same(identity(before), identity(await lstat(file)))
    )
      fail();
    return { text, version: hash(bytes.subarray(0, length)), identity: identity(before) };
  } finally {
    await handle.close();
  }
}
// Trusted helper dependencies only. HTTP callers cannot choose roots, owners or file contents.
// This captures one operating file; it neither validates nor activates a candidate.
export async function createDatabaseConfigBackup(
  kind:unknown,
  input:unknown,
  {
    base = kind === 'redis' ? '/etc/redis' : '/etc/mysql',
    backupRoot = '/var/lib/linux/admin/' + kind,
    ownerUid = process.getuid?.(),
    beforePublish = async () => {},
  }:BackupOptions = {},
) {
  const request = prepareDatabaseConfigBackup(kind, input),
    uid = process.getuid?.();
  if (typeof ownerUid!=='number'||!Number.isSafeInteger(ownerUid) || ownerUid < 0 || typeof beforePublish !== 'function') fail();
  await safeDirectory(base, ownerUid);
  const file = path.join(base, request.path.slice(11));
  await safeDirectory(backupRoot, uid, { create: true, privateRoot: true });
  if (file.startsWith(backupRoot + '/') || backupRoot.startsWith(path.dirname(file) + '/')) fail();
  const release = await acquireConfigOperationLease(file + '.tastedev-lock');
  let directory:FileHandle|undefined,staged:FileHandle|undefined,temporary:string|null|undefined;
  try {
    await assertConfigJournalClear(file, backupRoot);
    const original = await readSource(file, ownerUid);
    if (original.version !== request.version) fail('설정 파일이 변경되었습니다. 다시 조회하세요.');
    const id = randomUUID(),
      record = {
        id,
        kind,
        target: request.path,
        version: original.version,
        text: original.text,
        createdAt: new Date().toISOString(),
      };
    directory = await open(backupRoot, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    const directoryIdentity = identity(await directory.stat()).slice(0, 5),
      child = (name:string) => `/proc/self/fd/${directory!.fd}/${name}`;
    temporary = '.database-backup-' + id;
    staged = await open(
      child(temporary),
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    );
    await staged.writeFile(JSON.stringify(record));
    await staged.sync();
    const checkpoint = identity(await staged.stat());
    await beforePublish();
    await assertConfigJournalClear(file, backupRoot);
    const current = await readSource(file, ownerUid);
    if (
      current.version !== original.version ||
      !same(current.identity, original.identity) ||
      !same(identity(await lstat(backupRoot)).slice(0, 5), directoryIdentity)
    )
      fail('설정 파일이 변경되었습니다. 다시 조회하세요.');
    const stageStat = await staged.stat(),
      named = await lstat(child(temporary));
    if (
      !same(checkpoint, identity(stageStat)) ||
      !stageStat.isFile() ||
      stageStat.nlink !== 1 ||
      stageStat.uid !== uid ||
      (stageStat.mode & 0o777) !== 0o600 ||
      !same(identity(stageStat), identity(named))
    )
      fail();
    await link(child(temporary), child(id + '.json'));
    await unlink(child(temporary));
    temporary = null;
    await directory.sync();
    return {
      path: request.path,
      created: true,
      backup: {
        id,
        target: request.path,
        version: original.version,
        createdAt: record.createdAt,
        bytes: Buffer.byteLength(original.text),
      },
      scope: 'selected-operating-file',
      operatingConfigurationChanged: false,
      operatingServiceChanged: false,
    };
  } finally {
    if (temporary && staged && directory) {
      const actual = await staged.stat(),
        named = await lstat(`/proc/self/fd/${directory.fd}/${temporary}`).catch((error) => {
          if (hasErrorCode(error,'ENOENT')) return null;
          throw error;
        });
      if (named?.dev === actual.dev && named?.ino === actual.ino)
        await unlink(`/proc/self/fd/${directory.fd}/${temporary}`);
    }
    await staged?.close();
    await directory?.close();
    await release();
  }
}
