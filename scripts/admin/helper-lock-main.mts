// Standalone kernel lock, supervisor and entrypoint for the privileged helper.
type Stat=import('node:fs').Stats;
declare const fs:typeof import('node:fs'),path:typeof import('node:path'),BASE:string;
declare const childProcess:typeof import('node:child_process');
declare const require:NodeRequire;
declare const randomUUID:typeof import('node:crypto').randomUUID;
declare const __filename:string;
declare let adminNativeContext:Readonly<{fd:number;helper:string}>|null;
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare const execFileSync:typeof import('./helper-native-exec.mts').execFileSync;
declare function dispatch(action:string,input:unknown):unknown|Promise<unknown>;
const {StringDecoder:helperInputStringDecoder}:typeof import('node:string_decoder')=require('node:string_decoder');
function helperLockErrorCode(error:unknown,code:string):boolean{return error!==null&&typeof error==='object'&&'code' in error&&error.code===code;}
export const ADMIN_LOCK_MARKER = 'tastedev-linux kernel operation lock v1\n';
export function adminLockIdentity(left:Stat, right:Stat):boolean {
  return left.dev === right.dev && left.ino === right.ino;
}
export function adminLockFile(stat:Stat):boolean {
  return (
    stat.isFile() &&
    !stat.isSymbolicLink() &&
    stat.uid === 0 &&
    (stat.mode & 0o777) === 0o600 &&
    stat.size === Buffer.byteLength(ADMIN_LOCK_MARKER) &&
    [1, 2].includes(stat.nlink)
  );
}
export function acquireAdminLock():number {
  rootDir(BASE);
  rootDir('/usr');
  rootDir('/usr/bin');
  const executable = fs.lstatSync('/usr/bin/flock');
  if (
    !executable.isFile() ||
    executable.isSymbolicLink() ||
    executable.uid !== 0 ||
    executable.nlink !== 1 ||
    executable.mode & 0o022 ||
    !(executable.mode & 0o111)
  )
    fail('Kernel operation lock executable must be root-owned');
  const lock = path.join(BASE, 'operation.lock'),
    temporary = path.join(BASE, '.operation-lock-init-' + randomUUID());
  let init:number|undefined;
  try {
    init = fs.openSync(
      temporary,
      fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW,
      0o600,
    );
    fs.writeFileSync(init, ADMIN_LOCK_MARKER);
    fs.fsyncSync(init);
    fs.closeSync(init);
    init = undefined;
    try {
      fs.linkSync(temporary, lock);
    } catch (error) {
      if (!helperLockErrorCode(error,'EEXIST')) throw error;
    }
  } finally {
    if (init !== undefined) fs.closeSync(init);
    try {
      fs.unlinkSync(temporary);
    } catch (error) {
      if (!helperLockErrorCode(error,'ENOENT')) throw error;
    }
  }
  let fd:number|undefined;
  try {
    const before = fs.lstatSync(lock);
    if (!adminLockFile(before)) fail('Legacy or unsafe admin operation lock requires review; it was preserved');
    fd = fs.openSync(lock, fs.constants.O_RDWR | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
    let stat = fs.fstatSync(fd);
    if (!adminLockFile(stat) || !adminLockIdentity(before, stat) || fs.readFileSync(fd, 'utf8') !== ADMIN_LOCK_MARKER)
      fail('Unsafe admin operation lock');
    // A crash between atomic link and temporary unlink may leave exactly one
    // private initialization alias. Remove only that verified same-inode alias.
    if (stat.nlink === 2) {
      const names = fs.readdirSync(BASE);
      if (names.length > 1000) fail('Admin operation lock directory is too large');
      let aliases = 0;
      for (const name of names) {
        if (!/^\.operation-lock-init-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(name)) continue;
        const file = path.join(BASE, name);
        let alias:Stat;
        try {
          alias = fs.lstatSync(file);
        } catch (error) {
          if (helperLockErrorCode(error,'ENOENT')) continue;
          throw error;
        }
        if (!adminLockIdentity(alias, stat)) continue;
        if (!adminLockFile(alias)) fail('Unsafe operation lock initialization alias');
        try {
          fs.unlinkSync(file);
        } catch (error) {
          if (!helperLockErrorCode(error,'ENOENT')) throw error;
        }
        aliases++;
      }
      stat = fs.fstatSync(fd);
      if (stat.nlink !== 1 || aliases > 1) fail('Unexpected admin operation lock links');
    }
    try {
      execFileSync('/usr/bin/flock', ['--exclusive', '--nonblock', '--conflict-exit-code', '75', '3'], {
        timeout: 5000,
        maxBuffer: 4096,
        env: { PATH: '/usr/bin:/usr/sbin:/bin', LANG: 'C', LC_ALL: 'C', NODE_ENV:'production' },
        stdio: ['ignore', 'pipe', 'pipe', fd],
      });
    } catch (error) {
      if (error!==null&&typeof error==='object'&&'status' in error&&error.status===75) fail('Another admin operation is active');
      fail('Kernel operation lock could not be acquired');
    }
    const after = fs.lstatSync(lock),
      held = fs.fstatSync(fd),
      currentExecutable = fs.lstatSync('/usr/bin/flock');
    if (
      !adminLockFile(after) ||
      after.nlink !== 1 ||
      !adminLockIdentity(after, held) ||
      !adminLockIdentity(executable, currentExecutable) ||
      executable.uid !== currentExecutable.uid ||
      executable.mode !== currentExecutable.mode ||
      executable.size !== currentExecutable.size ||
      executable.mtimeMs !== currentExecutable.mtimeMs ||
      executable.ctimeMs !== currentExecutable.ctimeMs
    )
      fail('Admin operation lock changed while acquiring');
    return fd;
  } catch (error) {
    if (fd !== undefined) fs.closeSync(fd);
    throw error;
  }
}
export async function runNativeLockSupervisor():Promise<void> {
  if (process.getuid?.() !== 0 || process.argv.length < 5) fail('Invalid native lock supervisor');
  const timeout = Number(process.argv[3]),
    binary = process.argv[4];
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 750000 || !binary.startsWith('/'))
    fail('Invalid supervised native command');
  const fd = fs.fstatSync(3),
    lock = fs.lstatSync(path.join(BASE, 'operation.lock')),
    marker = Buffer.alloc(Buffer.byteLength(ADMIN_LOCK_MARKER));
  if (
    !adminLockFile(fd) ||
    fd.nlink !== 1 ||
    !adminLockFile(lock) ||
    !adminLockIdentity(fd, lock) ||
    fs.readSync(3, marker, 0, marker.length, 0) !== marker.length ||
    marker.toString() !== ADMIN_LOCK_MARKER
  )
    fail('Native supervisor requires the private admin lock descriptor');
  // Native programs receive only standard streams, never the root lock FD.
  // This trusted supervisor keeps FD 3 until the native child actually exits.
  const child = childProcess.spawn(binary, process.argv.slice(5), { stdio: 'inherit', detached: true, shell: false });
  let force:ReturnType<typeof setTimeout>|undefined;
  const signal = () => {
    const pid=child.pid;
    if(typeof pid!=='number'||!Number.isInteger(pid))return;
    try {
      process.kill(-pid, 'SIGTERM');
    } catch (error) {
      if (!helperLockErrorCode(error,'ESRCH')) throw error;
    }
    force ??= setTimeout(() => {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch (error) {
        if (!helperLockErrorCode(error,'ESRCH')) throw error;
      }
    }, 3000);
  };
  process.on('SIGTERM', signal);
  process.on('SIGINT', signal);
  const deadline = setTimeout(signal, timeout);
  const result = await new Promise<{code:number|null;signal?:NodeJS.Signals|null}>((resolve) => {
    child.once('error', () => resolve({ code: 127 }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  clearTimeout(force);
  clearTimeout(deadline);
  process.removeListener('SIGTERM', signal);
  process.removeListener('SIGINT', signal);
  process.exitCode = result.code ?? 1;
}
export async function main():Promise<void> {
  if (process.getuid?.() !== 0) fail('Root required', 403);
  if (process.argv[2] === '--native-lock-supervisor') return runNativeLockSupervisor();
  if (process.argv.length !== 3) fail('One action required');
  let text = '',receivedBytes=0;
  const decoder=new helperInputStringDecoder('utf8');
  for await (const chunk of process.stdin) {
    if(typeof chunk!=='string'&&!Buffer.isBuffer(chunk))fail('Invalid input stream');
    receivedBytes+=typeof chunk==='string'?Buffer.byteLength(chunk):chunk.length;
    text += typeof chunk==='string'?chunk:decoder.write(chunk);
    if (
      receivedBytes >
      ([
        'postgresql-code-plan',
        'postgresql-code-apply',
        'mariadb-code-plan',
        'mariadb-code-apply',
        'redis-code-plan',
        'redis-code-apply',
        'postgresql-hba-operation-plan',
        'postgresql-hba-operation',
        'postgresql-hba-validate',
      ].includes(process.argv[2])
        ? 1600000
        : process.argv[2] === 'nginx-config-apply'
          ? 300000
          : 16384)
    )
      fail('Payload too large');
  }
  text+=decoder.end();
  const input:unknown = JSON.parse(text || '{}');
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('Invalid action payload');
  fs.mkdirSync('/var/lib/linux', { recursive: true, mode: 0o700 });
  rootDir('/var/lib/linux');
  fs.mkdirSync(BASE, { mode: 0o700, recursive: true });
  rootDir(BASE);
  const fd = acquireAdminLock();
  adminNativeContext = Object.freeze({ fd, helper: __filename });
  Object.defineProperty(globalThis, Symbol.for('tastedev.admin-native-lock'), { value: adminNativeContext });
  try {
    const output = await dispatch(process.argv[2], input);
    process.stdout.write(JSON.stringify(output));
  } finally {
    fs.closeSync(fd);
  }
}
