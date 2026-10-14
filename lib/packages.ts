import type {StoredInstallJob} from './install-job-record.ts';
import {hasErrorCode} from './error-code.ts';
import { packageGroupInstalled } from './package-installation.ts';
import { auditEvent } from './security.ts';
import { readInstallJob, saveInstallJob } from './install-job-record.ts';
import { observeInstallJob, installProcessIdentity } from './install-job-monitor.ts';
import { installProcessOutput } from './install-process-output.ts';
import { inventorySnapshot } from './inventory-snapshot.ts';
import { queryPackageInventory } from './package-inventory-query.ts';
import { stateRoot } from './runtime-paths.ts';
import { readFile, open, mkdir, unlink, lstat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import path from 'node:path';
import { spawnHelper, helperStatus } from './privilege.ts';
export const PACKAGES = Object.freeze({
  nginx: ['nginx'],
  certbot: ['certbot', 'python3-certbot-nginx'],
  nodejs: ['nodejs', 'npm'],
  postgresql: ['postgresql'],
  mariadb: ['mariadb-server'],
  redis: ['redis-server'],
});
type PackageName=keyof typeof PACKAGES;
const isPackageName=(name:unknown):name is PackageName=>typeof name==='string'&&Object.hasOwn(PACKAGES,name);
const binaries:Partial<Record<PackageName,string>> = {
  nginx: '/usr/sbin/nginx',
  certbot: '/usr/bin/certbot',
  nodejs: '/usr/bin/node',
  mariadb: '/usr/sbin/mariadbd',
  redis: '/usr/bin/redis-server',
};
const legacyStateFile = path.join(stateRoot(), 'job.json');
const stateDir = path.join(process.env.LINUX_AUTH_ROOT || stateRoot(), 'install-jobs');
const stateFile = path.join(stateDir, 'job.json');
const lockFile = path.join(stateDir, 'install.lock');
export function commandFor(names:unknown) {
  if (
    !Array.isArray(names) ||
    !names.length ||
    names.length > 6 ||
    new Set(names).size !== names.length ||
    !names.every(isPackageName)
  )
    throw new Error('설치할 패키지를 올바르게 선택하세요.');
  return ['/usr/bin/apt-get', 'install', '--yes', '--no-remove', '--no-upgrade', ...names.flatMap((n) => PACKAGES[n])];
}
export async function supported() {
  try {
    const os = await readFile('/etc/os-release', 'utf8');
    return /^(ID|ID_LIKE)=.*\b(debian|ubuntu)\b/m.test(os);
  } catch {
    return false;
  }
}
export async function canInstall() {
  return process.env.LINUX_ENABLE_INSTALL === 'true' && helperStatus().ready && (await supported());
}
export async function inventory() {
  const queried = await queryPackageInventory(Object.values(PACKAGES).flat());
  return Promise.all(
    Object.keys(PACKAGES).filter(isPackageName).map(async id => {
      const names=PACKAGES[id],binary=binaries[id];
      const packages = names.map(name => queried.get(name)??{name,installed:false,version:null});
      let sha256 = null;
      try {
        if(!binary)throw Error('Unavailable binary');
        sha256 = createHash('sha256')
          .update(await readFile(binary))
          .digest('hex');
      } catch {}
      return {
        id,
        installed: packageGroupInstalled(id, packages),
        packages,
        binary: sha256 ? binary : null,
        sha256,
      };
    }),
  );
}
export async function getJob() {
  const current = await readInstallJob(stateFile);
  if (current) return observeInstallJob(current, lockFile);
  // Preserve old records only when they meet the same private-file requirements.
  try {
    return observeInstallJob(await readInstallJob(legacyStateFile), path.join(stateRoot(), 'install.lock'));
  } catch (error) {
    if (error!==null&&typeof error==='object'&&'status' in error&&error.status===403) return null;
    throw error;
  }
}
async function saveJob(job:StoredInstallJob) {
  await saveInstallJob(stateFile, job);
}
const readInventory = inventorySnapshot(inventory);
export async function getStatus({ reuseInventory = false } = {}) {
  // Share this read only within the current call. A later status request must
  // still observe current installation permissions and platform information.
  const platform = supported();
  const installAllowed = process.env.LINUX_ENABLE_INSTALL === 'true' && helperStatus().ready;
  const [platformSupported, packages, job] = await Promise.all([
    platform, readInventory({ refresh: !reuseInventory }), getJob(),
  ]);
  return {
    hostname: hostname(),
    nodeRuntime: { version: process.version, binary: process.execPath },
    supported: platformSupported, canInstall: installAllowed && platformSupported, packages, job,
  };
}
export async function startInstall(names:unknown) {
  const command = commandFor(names);
  if (!(await canInstall()))
    throw Object.assign(new Error('설치 모드, 관리자 권한 및 Ubuntu/Debian 환경이 필요합니다.'), { status: 403 });
  // An older process may still hold the previous installation lock.
  try {
    await lstat(path.join(stateRoot(), 'install.lock'));
    throw Object.assign(new Error('설치 작업 잠금이 있습니다. 진행 중인 작업 또는 이전 중단 기록을 확인하세요.'), {
      status: 409,
    });
  } catch (error) {
    if (!hasErrorCode(error,'ENOENT')) throw error;
  }
  await mkdir(stateDir, { recursive: true, mode: 0o700 });
  let lock;
  try {
    lock = await open(lockFile, 'wx', 0o600);
  } catch (error) {
    if (hasErrorCode(error,'EEXIST'))
      throw Object.assign(new Error('설치 작업 잠금이 있습니다. 진행 중인 작업 또는 이전 중단 기록을 확인하세요.'), {
        status: 409,
      });
    throw error;
  }
  const job:StoredInstallJob = {
    id: randomUUID(),
    status: 'running',
    command,
    logs: [],
    startedAt: new Date().toISOString(),
    exitCode: null,
  };
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, jobId: job.id, identity: await installProcessIdentity(process.pid) }));
    await saveJob(job);
  } catch (error) {
    await lock.close();
    await unlink(lockFile);
    throw error;
  }
  // Queue writes so all processes observe an atomic, persistent record.
  let queue = Promise.resolve();
  const persist = () => {
    const copy = structuredClone(job);
    queue = queue.then(() => saveJob(copy));
    queue.catch(() => {});
  };
  let child;
  try {
    child = spawnHelper('install', { packages: names, confirm: true });
  } catch (error) {
    job.status = 'failed';
    job.finishedAt = new Date().toISOString();
    job.logs.push((error instanceof Error?error.message:'설치 작업을 시작할 수 없습니다.').slice(0, 2000));
    await saveJob(job);
    await lock.close();
    await unlink(lockFile);
    throw error;
  }
  let timedOut = false,
    spawnFailed = false;
  const timer = setTimeout(() => {
    timedOut = true;
    job.logs.push('900초 시간 제한에 도달했습니다. dpkg 상태를 점검하세요.');
    job.logs = job.logs.slice(-1000);
    child.kill('SIGTERM');
  }, 900000);
  const output = installProcessOutput((lines) => {
    job.logs.push(...lines);
    job.logs = job.logs.slice(-1000);
    persist();
  });
  child.stdout.on('data', output.stdout);
  child.stderr.on('data', output.stderr);
  child.on('error', (error) => {
    spawnFailed = true;
    job.logs.push((error instanceof Error?error.message:'설치 작업을 시작할 수 없습니다.').slice(0, 2000));
    job.logs = job.logs.slice(-1000);
  });
  child.once('close', async (code, signal) => {
    clearTimeout(timer);
    output.end();
    job.status = code === 0 && !timedOut && !spawnFailed ? 'success' : 'failed';
    job.exitCode = code;
    job.signal = signal;
    job.finishedAt = new Date().toISOString();
    persist();
    try {
      await queue;
      await auditEvent('install', job.status === 'success' ? 'completed' : 'failed');
      await lock.close();
      await unlink(lockFile);
    } catch {
      await lock.close().catch(() => {}); /* Keep lock file on evidence write failure; manual review required. */
    }
  });
  return structuredClone(job);
}
