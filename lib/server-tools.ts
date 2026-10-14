import type {AdminJobSnapshot} from './admin-job-record.ts';
import type {FileHandle} from 'node:fs/promises';
import type {CertificateInput} from './certificate-command.ts';
import type {NginxConfigInput} from './nginx-config.ts';
import {hasErrorCode} from './error-code.ts';
export type CronInput = {name?: unknown;enabled?: unknown;schedule?: unknown;command?: unknown;confirm?: unknown;version?: unknown};
export type CronJob = {name: string;enabled: boolean;schedule: string;command: string};
type SiteInput = NginxConfigInput & {confirm?: unknown};
declare global {var __linuxAdminOperations: Map<string,AdminJobSnapshot>|undefined;}
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import {
  adminJobId,
  readCompletedAdminJob,
  completedAdminJobs,
  prepareAdminJobDirectory,
  saveCompletedAdminJob,
  savePendingAdminJob,
  readPendingAdminJob,
} from './admin-job-record.ts';
import { auditEvent } from './security.ts';
import { certificateProcessOutput, appendCertificateLogRows } from './certificate-process-output.ts';
import { adminJobProgressWriter } from './admin-job-progress.ts';
import { certificateCommand } from './certificate-command.ts';
export { certificateCommand } from './certificate-command.ts';
import { withCronLock } from './cron-lock.ts';
import { installCron } from './cron-install.ts';
import { userInfo } from 'node:os';
import { cronContext } from './cron-context.ts';
import { nginxConfig, domainName } from './nginx-config.ts';
export { nginxConfig, domainName } from './nginx-config.ts';
import { stateRoot } from './runtime-paths.ts';
import { managedSites } from './site-status.ts';
import { nginxExistingPlan } from './nginx-form-import.ts';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, readdir, open, unlink, lstat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { adminConfigured, runHelper, spawnHelper } from './privilege.ts';
import { createBackup } from './operations.ts';
const exec = promisify(execFile);
const folder = path.join(stateRoot(), 'server-tools');
const jobFolder = path.join(process.env.LINUX_AUTH_ROOT || stateRoot(), 'certificate-jobs');
const operations = (globalThis.__linuxAdminOperations ??= new Map());
const error = (message: string, status = 400) => Object.assign(new Error(message), { status });
export async function nginxPlan(input: SiteInput) {
  nginxConfig(input);
  const domain = domainName(input.domain),
    current = (await managedSites()).sites.find((site) => site.domain === domain);
  return nginxExistingPlan(input, current);
}
export async function nginxSites(): Promise<unknown[]> {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const files = (await readdir(folder)).filter((f) => f.endsWith('.site.json'));
  return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(folder, f), 'utf8'))));
}
export async function saveSite(input: SiteInput) {
  const config = nginxConfig(input),
    domain = domainName(input.domain);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(path.join(folder, domain + '.site.json'), JSON.stringify({ ...input, domain, config }), {
    mode: 0o600,
  });
  return { domain, config, saved: true };
}

async function adminAllowed() {
  if (!adminConfigured())
    throw error('이 작업에는 승인된 관리자 모드(LINUX_ENABLE_ADMIN=true)과 전용 sudo helper 권한이 필요합니다.', 403);
}
export async function operationHistory() {
  const current = await completedAdminJobs(jobFolder);
  let legacy;
  try {
    legacy = await completedAdminJobs(folder);
  } catch {
    legacy = { jobs: [], warnings: 1, truncated: false };
  }
  const live=[...operations.values()].map(({id,status,startedAt,finishedAt})=>({id,status,startedAt,...(finishedAt?{finishedAt}:{})}));
  const jobs = [...new Map([...legacy.jobs, ...current.jobs, ...live].map((job) => [job.id, job])).values()].sort(
    (a, b) => Date.parse(b.finishedAt || b.startedAt) - Date.parse(a.finishedAt || a.startedAt),
  );
  return {
    jobs: jobs.slice(0, 100),
    warnings: current.warnings + legacy.warnings,
    truncated: current.truncated || legacy.truncated || jobs.length > 100,
  };
}
export async function operationJob(id: unknown) {
  const validId=adminJobId(id);
  const record = operations.get(validId);
  if (record) return structuredClone(record);
  try {
    return await readCompletedAdminJob(jobFolder, id);
  } catch (error) {
    if ((!object(error)||error.status !== 404)) throw error;
    try{return await readPendingAdminJob(jobFolder,id);}catch(pendingError){if((!object(pendingError)||pendingError.status!==404))throw pendingError;}
    return readCompletedAdminJob(folder, id);
  }
}
export async function startCertificate(input: CertificateInput) {
  const command = certificateCommand(input);
  if (input.confirm !== true || input.agree !== true) throw error('서버 변경 및 ACME 이용 약관 동의를 확인하세요.');
  await adminAllowed();
  return startOperation(command, input);
}
async function startOperation(command: string[], input: CertificateInput) {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await prepareAdminJobDirectory(jobFolder);
  let lock: FileHandle;
  const lockPath = path.join(folder, 'admin.lock');
  try {
    lock = await open(lockPath, 'wx', 0o600);
  } catch (e) {
    if (hasErrorCode(e,'EEXIST')) throw error('관리 작업이 진행 중이거나 이전 작업 확인이 필요합니다.', 409);
    throw e;
  }
  const record: AdminJobSnapshot = {
    id: randomUUID(),
    command,
    status: 'running',
    logs: [],
    startedAt: new Date().toISOString(),
    exitCode: null,
  };
  try{await savePendingAdminJob(jobFolder,record);}catch(failure){await lock.close();await unlink(lockPath);throw failure;}
  operations.set(record.id, record);
  let child;
  try {
    child = spawnHelper('certificate', input);
  } catch (error) {
    record.status = 'failed';
    record.finishedAt = new Date().toISOString();
    try{await saveCompletedAdminJob(jobFolder, record);await unlink(lockPath);}finally{await lock.close();}
    throw error;
  }
  let timedOut = false,
    spawnFailed = false;
  const progress = adminJobProgressWriter(jobFolder);
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, 300000);
  const output = certificateProcessOutput(
    (lines) => {
      record.logs = appendCertificateLogRows(record.logs, lines);
      progress.write(record);
    },
  );
  child.stdout.on('data', output.stdout);
  child.stderr.on('data', output.stderr);
  child.on('error', (e) => {
    spawnFailed = true;
    record.logs = appendCertificateLogRows(record.logs, [e.message.slice(0, 7999) + '\n']);
    progress.write(record);
  });
  child.once('close', async (code, signal) => {
    clearTimeout(timer);
    output.end();
    const persisted = await progress.finish();
    if (persisted.failed) record.logs = appendCertificateLogRows(record.logs, [JSON.stringify({logs:'작업 도중 진행 로그 일부를 디스크에 저장하지 못했습니다. 중단 복구 시 백업 목록과 서버 상태를 확인하세요.\n'})]);
    record.status = code === 0 && !timedOut && !spawnFailed ? 'success' : 'failed';
    record.exitCode = code;
    record.signal = signal;
    record.finishedAt = new Date().toISOString();
    try {
      await saveCompletedAdminJob(jobFolder, record);
      await auditEvent('certbot-issue', record.status === 'success' ? 'completed' : 'failed');
      await lock.close();
      await unlink(lockPath);
    } catch {
      await lock.close().catch(() => {});
    }
  });
  return structuredClone(record);
}
export async function applySite(input: SiteInput) {
  nginxConfig(input);
  if (input.confirm !== true) throw error('설정 적용과 nginx 재로드 영향을 확인하세요.');
  await adminAllowed();
  await nginxPlan(input);
  return runHelper('nginx-apply', input);
}
const bounds = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];
export function cronSchedule(value: unknown) {
  if (typeof value !== 'string') throw error('cron 시간식을 입력하세요.');
  const fields = value.trim().split(/\s+/);
  if (fields.length !== 5) throw error('cron 시간식은 분·시·일·월·요일 5개 필드입니다.');
  fields.forEach((field, index) => {
    for (const part of field.split(',')) {
      const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
      if (!m) throw error('cron 시간식은 숫자, *, 쉼표, 범위, 간격을 사용하세요.');
      if (m[2] && (+m[2] < 1 || +m[2] > bounds[index][1] + 1)) throw error('cron 간격이 범위를 벗어났습니다.');
      if (m[1] !== '*') {
        const [a, b = a] = m[1].split('-').map(Number);
        if (a < bounds[index][0] || b > bounds[index][1] || a > b) throw error('cron 값이 허용 범위를 벗어났습니다.');
      }
    }
  });
  return fields.join(' ');
}
async function crontabText() {
  try {
    return (await exec('/usr/bin/crontab', ['-l'], { timeout: 5000, env: { ...process.env, LC_ALL: 'C' } })).stdout;
  } catch (e) {
    const stderr=object(e)&&typeof e.stderr==='string'?e.stderr:'';
    if(object(e)&&e.code===1&&/no crontab for/i.test(stderr))return '';
    throw error('현재 사용자 crontab을 읽을 수 없습니다: ' + (stderr || (e instanceof Error?e.message:String(e))));
  }
}
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export function cronJobs(text: string) {
  const lines = text.split('\n'),
    jobs: CronJob[] = [];
  for (let i = 0; i < lines.length; i++) {
    const marker = /^# (?:LINUX|LINEX): ([a-zA-Z0-9_-]{1,60})$/.exec(lines[i]);
    if (!marker) continue;
    const next = lines[i + 1] || '',
      enabled = !next.startsWith('# disabled: '),
      body = enabled ? next : next.slice(12);
    const entry = /^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/.exec(body);
    if (!entry || /^[#]/.test(body)) continue;
    try {
      const schedule = cronSchedule(entry[1]);
      jobs.push({ name: marker[1], schedule, command: entry[2], enabled });
    } catch {}
  }
  return jobs.filter((job) => jobs.filter((other) => other.name === job.name).length === 1);
}
export function cronAccount() {
  const account = userInfo();
  return { username: account.username, uid: account.uid, gid: account.gid };
}
function cronSnapshot(text: string) {
  return {
    text,
    account: cronAccount(),
    clock: cronContext(text),
    jobs: cronJobs(text),
    version: digest(text),
    canApply: process.env.LINUX_ENABLE_CRON === 'true' && process.getuid?.() !== 0,
  };
}
export async function cronStatus() {
  try {
    return cronSnapshot(await crontabText());
  } catch (error) {
    return {
      account: cronAccount(),
      error: error instanceof Error?error.message:String(error),
      text: null,
      clock: null,
      jobs: [],
      version: null,
      canApply: false,
    };
  }
}
export function cronEntry(input: CronInput) {
  if (typeof input.enabled !== 'boolean') throw error('예약 작업 활성화 옵션을 확인하세요.');
  const schedule = cronSchedule(input.schedule);
  if (
    typeof input.command !== 'string' ||
    !input.command.trim() ||
    input.command.length > 4096 ||
    /[\r\n\0]/.test(input.command)
  )
    throw error('cron 명령은 한 줄로 입력하세요.');
  if (typeof input.name !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(input.name))
    throw error('작업 이름은 영문·숫자·하이픈·밑줄로 입력하세요.');
  return `# LINUX: ${input.name}\n${input.enabled ? '' : '# disabled: '}${schedule} ${input.command}\n`;
}
export function updateCron(before: string, input: CronInput) {
  const entry = cronEntry(input),
    markers = ['# LINUX: ' + input.name, '# LINEX: ' + input.name],
    lines = before.split('\n');
  const found = lines.findIndex((line) => markers.includes(line));
  if (found >= 0) {
    if (
      lines.filter((line) => markers.includes(line)).length !== 1 ||
      !cronJobs(before).some((job) => job.name === input.name)
    )
      throw error('관리 작업 블록을 확인하세요.');
    lines.splice(found, 2, ...entry.slice(0, -1).split('\n'));
    return lines.join('\n').replace(/\n?$/, '\n');
  }
  return lines.join('\n').replace(/\n*$/, '') + '\n' + entry;
}
export function removeCron(before: string, name: unknown) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(name)) throw error('작업 이름을 확인하세요.');
  const lines = before.split('\n'),
    markers = ['# LINUX: ' + name, '# LINEX: ' + name];
  if (lines.filter((line) => markers.includes(line)).length !== 1 || !cronJobs(before).some((job) => job.name === name))
    throw error('삭제할 관리 작업을 최신 목록에서 선택하세요.', 409);
  lines.splice(
    lines.findIndex((line) => markers.includes(line)),
    2,
  );
  return lines.join('\n');
}
export async function deleteCron(input: CronInput) {
  return mutateCron(input, true);
}
export async function applyCron(input: CronInput) {
  return mutateCron(input, false);
}
async function mutateCron(input: CronInput, remove: boolean) {
  if (remove) {
    if (typeof input.name !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(input.name))
      throw error('작업 이름을 확인하세요.');
  } else cronEntry(input);
  if (process.env.LINUX_ENABLE_CRON !== 'true' || process.getuid?.() === 0)
    throw error('일반 사용자 권한 및 LINUX_ENABLE_CRON=true 설정이 필요합니다.', 403);
  if (input.confirm !== true)
    throw error(remove ? '예약 작업 삭제 영향을 확인하세요.' : '예약 작업 활성화 영향을 확인하세요.');
  return withCronLock(folder, async () => {
    const before = await crontabText();
    if (input.version !== digest(before)) throw error('crontab이 변경됐습니다. 최신 목록을 다시 조회하세요.', 409);
    const after = remove ? removeCron(before, input.name) : updateCron(before, input);
    await createBackup('cron', 'current-user', before);
    await installCron(after);
    return { applied: true, ...cronSnapshot(after) };
  });
}
