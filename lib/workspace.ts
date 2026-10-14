import {hasErrorCode} from './error-code.ts';
import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import type {FileHandle} from 'node:fs/promises';
export type WorkspaceCode = {name: string; text: string; version: string};
export type TerminalPublicJob = {id: string; command: string; cwd: string; username: string; pty: boolean; timeoutSeconds: number; status: 'running' | 'success' | 'failed'; stdinOpen: boolean; logSequence: number; logs: {kind: 'stdout' | 'stderr'; sequence: number; text: string}[]; exitCode: number | null; startedAt: string; signal?: NodeJS.Signals | null; finishedAt?: string; terminationReason?: 'timeout' | 'user'; auditError?: boolean};
type TerminalProcess = {events?: boolean; public: TerminalPublicJob; child: ChildProcessWithoutNullStreams; listeners?: Set<() => void>; spawnFailed?: boolean; terminationReason?: 'timeout' | 'user'};
declare global {var __linuxFileWrites: Set<string> | undefined;var __linuxTerminalJobs: Map<string,TerminalProcess> | undefined;var __linuxTerminalStarting: Set<object> | undefined;}
import { auditEvent } from './security.ts';
import { userInfo } from 'node:os';
import { terminalSize } from './terminal-size.ts';
import { constants } from 'node:fs';
import { readlink } from 'node:fs/promises';
import { terminalLaunch, terminalTimeout } from './terminal-launch.ts';
import { configTransaction } from './config-transaction.ts';
import { stateRoot } from './runtime-paths.ts';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { readFile, writeFile, readdir, mkdir, realpath, lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
const fileWrites = (globalThis.__linuxFileWrites ??= new Set<string>());
const jobs = (globalThis.__linuxTerminalJobs ??= new Map<string,TerminalProcess>());
const starting = (globalThis.__linuxTerminalStarting ??= new Set<object>());
export const workspaceRoot = () =>
  path.resolve(process.env.LINUX_WORKSPACE_ROOT || path.join(stateRoot(), 'workspace'));
const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
export function validateFile(name: unknown): string {
  if (
    typeof name !== 'string' ||
    !name ||
    name.length > 240 ||
    path.isAbsolute(name) ||
    name.includes('\\') ||
    name.split('/').some((p) => !p || p === '.' || p === '..' || p.startsWith('.')) ||
    /[\0\r\n]/.test(name)
  )
    throw fail('파일 경로를 확인하세요. 숨김 파일과 상위 경로는 허용하지 않습니다.');
  return name;
}
async function root() {
  const folder = workspaceRoot();
  await mkdir(folder, { recursive: true, mode: 0o700 });
  return realpath(folder);
}
async function filePath(name: unknown): Promise<string> {
  const safeName=validateFile(name);
  const folder = await root();
  let current = folder;
  const parts = safeName.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) throw fail('심볼릭 링크 파일은 편집하지 않습니다.', 403);
      if (i < parts.length - 1 && !stat.isDirectory()) throw fail('폴더 경로가 올바르지 않습니다.');
    } catch (error) {
      if (hasErrorCode(error,'ENOENT') && i === parts.length - 1) break;
      throw error;
    }
  }
  return current;
}
export async function createFolder(name: unknown) {
  if (process.getuid?.() === 0) throw fail('폴더 생성은 일반 사용자 권한으로 실행하세요.', 403);
  const target = await filePath(name);
  try {
    await mkdir(target, { mode: 0o700 });
  } catch (e) {
    if (hasErrorCode(e,'EEXIST')) throw fail('같은 이름의 파일 또는 폴더가 있습니다.', 409);
    throw e;
  }
  return { name:validateFile(name), created: true };
}
export async function listFiles() {
  const folder = await root();
  const files: string[] = [],
    directories: string[] = [];
  async function walk(dir: string, prefix = '', depth = 0): Promise<void> {
    if (depth > 3 || files.length >= 300) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.isSymbolicLink()) continue;
      const name = prefix + entry.name;
      if (entry.isFile()) files.push(name);
      else if (entry.isDirectory()) {
        directories.push(name);
        await walk(path.join(dir, entry.name), name + '/', depth + 1);
      }
      if (files.length >= 300) break;
    }
  }
  await walk(folder);
  return { root: folder, files: files.sort(), directories: directories.sort() };
}
export async function readCode(name: unknown): Promise<WorkspaceCode> {
  const file = await filePath(name);
  const stat = await lstat(file);
  if (!stat.isFile() || stat.size > 262144) throw fail('256KB 이하 텍스트 파일만 편집할 수 있습니다.');
  const text = await readFile(file, 'utf8');
  if (text.includes('\0') || text.includes('\uFFFD')) throw fail('UTF-8 텍스트 파일만 지원합니다.');
  return { name:validateFile(name), text, version: createHash('sha256').update(text).digest('hex') };
}
export async function saveCode(name: unknown, text: unknown, version: unknown = null) {
  if (process.getuid?.() === 0) throw fail('파일 편집은 일반 사용자 권한으로 실행하세요.', 403);
  if (typeof text !== 'string' || Buffer.byteLength(text) > 262144) throw fail('파일은 256KB 이하로 저장하세요.');
  if(text.includes('\0')||text.includes('\uFFFD')||Buffer.from(text).toString('utf8')!==text)throw fail('UTF-8 텍스트 파일만 지원합니다.');
  const file = await filePath(name);
  if (fileWrites.has(file)) throw fail('파일 저장이 진행 중입니다. 완료 후 다시 저장하세요.', 409);
  fileWrites.add(file);
  try {
    const { constants } = await import('node:fs');
    const handle = await open(file, constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.nlink !== 1) throw fail('일반 단일 링크 파일만 저장할 수 있습니다.', 403);
      const existing = await handle.readFile('utf8');
      const current = createHash('sha256').update(existing).digest('hex');
      if ((version !== null && version !== current) || (version === null && existing.length > 0))
        throw fail('파일이 변경되었거나 이미 존재합니다. 새로 열어 비교하세요.', 409);
      const linked = await lstat(file);
      if (linked.isSymbolicLink() || linked.ino !== stat.ino || linked.dev !== stat.dev)
        throw fail('파일 경로가 변경되었습니다. 다시 열어 비교하세요.', 409);
      await handle.truncate(0);
      // Reading advances the descriptor position; explicitly write from byte zero.
      const bytes = Buffer.from(text);
      let offset = 0;
      while (offset < bytes.length) {
        const result = await handle.write(bytes, offset, bytes.length - offset, offset);
        if (!result.bytesWritten) throw fail('파일 저장을 완료하지 못했습니다.', 500);
        offset += result.bytesWritten;
      }
    } finally {
      await handle.close();
    }
  } finally {
    fileWrites.delete(file);
  }
  return { name:validateFile(name), saved: true, version: createHash('sha256').update(text).digest('hex') };
}
export function terminalJob(id: unknown, since: unknown = null): TerminalPublicJob {
  const job = typeof id==='string'?jobs.get(id):undefined;
  if(since!==null&&(typeof since!=='number'||!Number.isSafeInteger(since)||since<0))throw fail('터미널 세션 옵션을 확인하세요.');
  if (!job) throw fail('명령 기록을 찾을 수 없습니다.', 404);
  return structuredClone(
    since === null ? job.public : { ...job.public, logs: job.public.logs.filter((item) => item.sequence > since) },
  );
}
// Subscribers only receive a wake-up signal; snapshots retain the existing bounds.
export function subscribeTerminalJob(id: unknown, listener: () => void): (() => boolean) | null {
  const record = typeof id==='string'?jobs.get(id):undefined;
  if (!record) throw fail('명령 기록을 찾을 수 없습니다.', 404);
  // Jobs retained across development reloads may still use older output handlers.
  if (record.events !== true) return null;
  const listeners = (record.listeners ??= new Set());
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notifyTerminalJob(record: TerminalProcess) {
  for (const listener of record.listeners ?? []) {
    try {
      listener();
    } catch {}
  }
}
export function terminalContext() {
  return {
    username: userInfo().username,
    cwd: workspaceRoot(),
    shell: userInfo().shell || '/bin/bash',
    sessions: [...jobs.values()].map((record) => structuredClone(record.public)),
  };
}
export async function runCommand(command: unknown, pty: unknown = false, timeout: unknown = 120, sessionMode: unknown = 'single'): Promise<TerminalPublicJob> {
  if (process.env.LINUX_ENABLE_TERMINAL !== 'true')
    throw fail('서버에서 LINUX_ENABLE_TERMINAL=true 설정이 필요합니다.', 403);
  if (process.getuid?.() === 0) throw fail('웹 터미널은 일반 사용자 권한으로 실행하세요.', 403);
  const account = userInfo();
  const launch = terminalLaunch(command, pty, account.shell || '/bin/bash'),
    timeoutSeconds = terminalTimeout(timeout);
  if(typeof command!=='string'||typeof pty!=='boolean')throw fail('PTY 옵션을 확인하세요.');
  if (typeof sessionMode!=='string'||!['single', 'tab'].includes(sessionMode)) throw fail('터미널 세션 옵션을 확인하세요.');
  const running = [...jobs.values()].filter((j) => j.public.status === 'running').length;
  if (sessionMode === 'single' && (running || starting.size)) throw fail('실행 중인 명령을 먼저 종료하세요.', 409);
  if (running + starting.size >= 4) throw fail('터미널은 최대 4개까지 동시에 실행할 수 있습니다.', 409);
  const ticket = {};
  starting.add(ticket);
  try {
    if (jobs.size >= 20) {
      const oldest = [...jobs].find(([, item]) => item.public.status !== 'running');
      if (oldest) jobs.delete(oldest[0]);
    }
    const cwd = await root();
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY/i.test(key)) delete env[key];
    // Resolve identity from the execution account, not an inherited launcher environment.
    env.HOME = account.homedir;
    env.USER = account.username;
    env.LOGNAME = account.username;
    if (pty) {
      env.SHELL = account.shell || '/bin/bash';
      env.TERM = 'xterm-256color';
    }
    const child = spawn(launch.binary, launch.args, { cwd, env, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdin.on('error', () => {});
    const record: TerminalProcess = {
      events: true,
      public: {
        id: randomUUID(),
        command: command === 'account-shell' ? launch.args[6] : command,
        cwd,
        username: account.username,
        pty,
        timeoutSeconds,
        status: 'running',
        stdinOpen: true,
        logSequence: 0,
        logs: [],
        exitCode: null,
        startedAt: new Date().toISOString(),
      },
      child,
    };
    jobs.set(record.public.id, record);
    const log = (kind: 'stdout' | 'stderr', data: Buffer | string) => {
      const text = data.toString();
      for (let offset = 0; offset < text.length; ) {
        let end = Math.min(offset + 8000, text.length);
        if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
        record.public.logs.push({ kind, sequence: ++record.public.logSequence, text: text.slice(offset, end) });
        offset = end;
      }
      record.public.logs = record.public.logs.slice(-500);
      notifyTerminalJob(record);
    };
    for (const [kind, stream] of [
      ['stdout', child.stdout],
      ['stderr', child.stderr],
    ] as const) {
      const decoder = new StringDecoder('utf8');
      stream.on('data', (data) => {
        const text = decoder.write(data);
        if (text) log(kind, text);
      });
      stream.on('end', () => {
        const text = decoder.end();
        if (text) log(kind, text);
      });
    }
    child.on('error', (error) => {
      record.spawnFailed = true;
      log('stderr', Buffer.from(error.message));
    });
    const timer = setTimeout(() => {
      record.terminationReason = 'timeout';
      log('stderr', timeoutSeconds + '초 실행 제한으로 종료합니다.\n');
      kill(record);
    }, timeoutSeconds * 1000);
    child.once('close', async (code, signal) => {
      clearTimeout(timer);
      record.public.stdinOpen = false;
      record.public.status = code === 0 && !record.spawnFailed && !record.terminationReason ? 'success' : 'failed';
      record.public.exitCode = code;
      record.public.signal = signal;
      record.public.finishedAt = new Date().toISOString();
      if (record.terminationReason) record.public.terminationReason = record.terminationReason;
      try {
        await auditEvent(
          'terminal',
          record.terminationReason === 'user'
            ? 'cancelled'
            : record.public.status === 'success'
              ? 'completed'
              : 'failed',
        );
      } catch {
        record.public.auditError = true;
      }
      notifyTerminalJob(record);
    });
    return structuredClone(record.public);
  } finally {
    starting.delete(ticket);
  }
}
export async function terminalInput(id: unknown, text: unknown, end: unknown = false) {
  if (process.env.LINUX_ENABLE_TERMINAL !== 'true' || process.getuid?.() === 0)
    throw fail('터미널 입력 권한이 필요합니다.', 403);
  if (typeof text !== 'string' || Buffer.byteLength(text) > 4096 || text.includes('\0') || typeof end !== 'boolean')
    throw fail('터미널 입력은 4096바이트 이하로 입력하세요.');
  const record = typeof id==='string'?jobs.get(id):undefined;
  if (!record) throw fail('명령 기록을 찾을 수 없습니다.', 404);
  if (
    record.public.status !== 'running' ||
    !record.public.stdinOpen ||
    record.child.stdin.destroyed ||
    record.child.stdin.writableEnded
  )
    throw fail('이 명령의 입력은 종료되었습니다.', 409);
  if (record.child.stdin.writableLength > 8192) throw fail('대기 중인 입력이 많습니다. 잠시 후 다시 시도하세요.', 409);
  await new Promise<void>((resolve, reject) => {
    const callback = (error?: Error | null) => (error ? reject(fail('명령 입력을 전달하지 못했습니다.', 409)) : resolve());
    if (end) {
      record.public.stdinOpen = false;
      notifyTerminalJob(record);
      record.child.stdin.end(text, callback);
    } else record.child.stdin.write(text, callback);
  });
  return { accepted: true, stdinOpen: record.public.stdinOpen };
}
export async function terminalResize(id: unknown, cols: unknown, rows: unknown) {
  if (process.env.LINUX_ENABLE_TERMINAL !== 'true' || process.getuid?.() === 0)
    throw fail('터미널 입력 권한이 필요합니다.', 403);
  const size = terminalSize(cols, rows),
    record = typeof id==='string'?jobs.get(id):undefined;
  if (!record) throw fail('명령 기록을 찾을 수 없습니다.', 404);
  if (record.public.status !== 'running' || !record.public.pty) throw fail('실행 중인 PTY 작업이 필요합니다.', 409);
  const parent = record.child.pid,
    childrenFile = `/proc/${parent}/task/${parent}/children`;
  let handle: FileHandle | undefined;
  try {
    const children = (await readFile(childrenFile, 'utf8')).trim();
    if (!/^[1-9][0-9]*$/.test(children)) throw Error();
    const link = `/proc/${children}/fd/0`,
      device = await readlink(link);
    if (!/^\/dev\/pts\/[0-9]+$/.test(device)) throw Error();
    handle = await open(device, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = await handle.stat();
    if (!stat.isCharacterDevice() || stat.uid !== process.getuid?.()) throw Error();
    if (
      (await readFile(childrenFile, 'utf8')).trim() !== children ||
      (await readlink(link)) !== device ||
      record.public.status !== 'running'
    )
      throw Error();
    await new Promise<void>((resolve, reject) => {
      const child = spawn('/usr/bin/stty', ['rows', String(size.rows), 'cols', String(size.cols)], {
        stdio: [handle!.fd, 'ignore', 'pipe'],
        env: { PATH: '/usr/bin:/bin', LANG: 'C', NODE_ENV: process.env.NODE_ENV },
      });
      child.stderr?.resume();
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
      }, 5000);
      child.once('error', () => {
        clearTimeout(timer);
        reject(Error());
      });
      child.once('close', (code) => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(Error());
      });
    });
    return { resized: true, ...size };
  } catch {
    throw fail('PTY 크기를 변경할 수 없습니다. 작업 상태를 확인하세요.', 409);
  } finally {
    await handle?.close();
  }
}
function kill(record: TerminalProcess) {
  try {
    if(record.child.pid!==undefined)process.kill(-record.child.pid, 'SIGKILL');
  } catch {}
}
export function stopCommand(id: unknown) {
  const record = typeof id==='string'?jobs.get(id):undefined;
  if (!record) throw fail('명령 기록을 찾을 수 없습니다.', 404);
  if (record.public.status === 'running') {
    record.terminationReason ??= 'user';
    kill(record);
  }
  return { stopped: true };
}

// Internal transaction for an existing workspace environment file. Never accepts an absolute path.
export async function replaceWorkspaceEnv(name: unknown, version: unknown, transform: (text: string) => string | Promise<string>, beforeCommit: () => void | Promise<void> = async () => {}) {
  if (process.getuid?.() === 0) throw fail('파일 편집은 일반 사용자 권한으로 실행하세요.', 403);
  const file = await filePath(name);
  if (fileWrites.has(file)) throw fail('파일 저장이 진행 중입니다. 완료 후 다시 저장하세요.', 409);
  const backupRoot = path.join(stateRoot(), 'node-env-backups');
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  fileWrites.add(file);
  try {
    return await configTransaction({
      file,
      backupRoot,
      version,
      configurationUid: undefined,
      transform,
      beforeCommit: async()=>{await beforeCommit();},
      validate: async (candidate: string) => {
        const { parseNodeEnv } = await import('./node-env.ts');
        parseNodeEnv(await readFile(candidate, 'utf8'));
      },
      activate: async () => {},
      recover: async () => {},
    });
  } finally {
    fileWrites.delete(file);
  }
}
