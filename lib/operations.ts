import type {FileHandle} from 'node:fs/promises';
import type {ServiceRecord} from '../components/console-types';
import {hasErrorCode} from './error-code.ts';
type LocalBackup={id:string;kind:'cron';target:'current-user';text:string;createdAt:string;sha256:string};
type BackupMetadata={id:string;kind:string;target:string;createdAt:string;sha256:string;bytes?:number;privileged?:boolean};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const errorDetail=(error:unknown)=>object(error)&&typeof error.stderr==='string'?error.stderr:object(error)&&typeof error.message==='string'?error.message:String(error);
import {systemSettings} from './system-settings.ts';
import {nodeAppServiceInventory} from './node-app-service-status.ts';
import { discoverPostgresqlClusters, postgresqlClusterStatuses } from './postgresql-cluster-status.ts';
import { postgresqlServiceRequest } from './postgresql-service-request.ts';
import { manualBackupRequest } from './manual-backup-request.ts';
import { assertFeature, auditEvent } from './security.ts';
import { withCronLock } from './cron-lock.ts';
import { installCron } from './cron-install.ts';
import { stateRoot } from './runtime-paths.ts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, readdir, mkdir, unlink, lstat, open, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { adminConfigured, runHelper, helperStatus } from './privilege.ts';
const exec = promisify(execFile);
const folder = path.join(stateRoot(), 'server-tools');
const fail = (message:string, status = 400) => Object.assign(new Error(message), { status });
const hash = (text:string) => createHash('sha256').update(text).digest('hex');
export const SERVICES = [
  'nginx.service',
  'cron.service',
  'certbot.timer',
  'postgresql.service',
  'mariadb.service',
  'redis-server.service',
];
export function serviceCommand(unit:unknown, action:unknown) {
  if ((typeof unit!=='string'||!SERVICES.includes(unit)) || (typeof action!=='string'||!['start', 'stop', 'restart', 'reload', 'enable', 'disable'].includes(action)))
    throw fail('허용된 서비스와 작업을 선택하세요.');
  if (action === 'reload' && unit !== 'nginx.service') throw fail('nginx만 재로드를 지원합니다.');
  return ['/usr/bin/systemctl', '--no-ask-password', action, unit];
}
export async function serviceStatus({unit: selectedUnit}:{unit?:unknown} = {}):Promise<ServiceRecord[]&{warnings:string[]}> {
  if (selectedUnit !== undefined && (typeof selectedUnit!=='string'||!SERVICES.includes(selectedUnit)))
    throw fail('허용된 서비스와 작업을 선택하세요.');
  const units = selectedUnit === undefined ? SERVICES : [selectedUnit];
  const nodeSnapshot=selectedUnit===undefined?nodeAppServiceInventory():Promise.resolve({services:[],warnings:[]});
  // Discovery does not depend on the standard services. Handle its rejection
  // immediately so a slow systemctl response cannot leave it unhandled.
  const clusterSnapshot = !units.includes('postgresql.service') ? Promise.resolve([]) : discoverPostgresqlClusters().then(async files => {
    const clusters = await postgresqlClusterStatuses(files);
    return clusters.map((service, index) => ({ ...service, configPath: files[index].path }));
  }).catch(() => null);
  const standard:ServiceRecord[] = await Promise.all(
    units.map(async (unit) => {
      try {
        const { stdout } = await exec('/usr/bin/systemctl',
          ['show', unit, '--property=ActiveState,SubState,LoadState,UnitFileState,Description', '--no-pager'], { timeout: 5000 });
        const values = Object.fromEntries(stdout.trim().split('\n').map(line => {
          const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)];
        }));
        return { unit, ...values };
      } catch (e) {
        const info=e!==null&&typeof e==='object'?e:{};
        const error = ('killed' in info&&info.killed)||('code' in info&&info.code === 'ETIMEDOUT')
          ? '서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'
          : 'signal' in info&&info.signal
            ? '서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.'
          : 'code' in info&&typeof info.code==='string'&&['EACCES', 'EPERM'].includes(info.code)
            ? '서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.'
            : '서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.';
        return { unit, ActiveState: 'unknown', error };
      }
    }),
  );
  const [clusters,nodeServices] = await Promise.all([clusterSnapshot,nodeSnapshot]);
  if (clusters === null) {
    const parent = standard.find((service) => service.unit === 'postgresql.service');
    if(parent)parent.error = 'PostgreSQL 설정 목록을 읽을 수 없습니다.';
    return Object.assign([...standard,...nodeServices.services],{warnings:nodeServices.warnings});
  }
  return Object.assign([...standard, ...clusters,...nodeServices.services],{warnings:nodeServices.warnings});
}
export function permissions() {
  return {
    admin: adminConfigured(),
    cron: process.env.LINUX_ENABLE_CRON === 'true' && process.getuid?.() !== 0,
    terminal: process.env.LINUX_ENABLE_TERMINAL === 'true' && process.getuid?.() !== 0,
  };
}
export async function controlService(input:unknown) {
  if(!object(input))throw fail('허용된 서비스와 작업을 선택하세요.');
  const target = input.path !== undefined ? postgresqlServiceRequest(input) : input;
  if (input.path === undefined) serviceCommand(input.unit, input.action);
  if (!permissions().admin) throw fail('서비스 제어는 승인된 관리자 모드에서만 실행할 수 있습니다.', 403);
  if (input.confirm !== true) throw fail('서비스 변경 영향을 확인하세요.');
  const result = await runHelper('service', target);
  const services = await serviceStatus();
  return { ...result, services, warnings: services.warnings || [] };
}
export function logCommand(source:unknown, configPath:unknown = null, logLines:unknown = 150) {
  if (typeof logLines!=='number'||![50,150,300,500,1000].includes(logLines)) throw fail('로그 조회 줄 수를 확인하세요.');
  if (configPath !== null) {
    const target = postgresqlServiceRequest({ path: configPath, unit: source, action: 'start' });
    return ['/usr/bin/journalctl', '--unit', target.unit, '--lines='+logLines, '--no-pager', '--output=short-iso'];
  }
  if (typeof source==='string'&&SERVICES.includes(source))
    return ['/usr/bin/journalctl', '--unit', source, '--lines='+logLines, '--no-pager', '--output=short-iso'];
  if (source === 'nginx-access') return ['/usr/bin/tail', '-n', String(logLines), '/var/log/nginx/access.log'];
  if (source === 'nginx-error') return ['/usr/bin/tail', '-n', String(logLines), '/var/log/nginx/error.log'];
  throw fail('허용된 로그를 선택하세요.');
}
export async function readLogs(source:unknown, filter:unknown = '', configPath:unknown = null) {
  const settings = systemSettings();
  const command = logCommand(source, configPath, settings.logLines);
  if (typeof filter !== 'string' || filter.length > 200) throw fail('로그 검색은 200자 이하로 입력하세요.');
  try {
    const result = await exec(command[0], command.slice(1), { timeout: 5000, maxBuffer: 1024 * 1024 });
    const lines = result.stdout.split('\n');
    return {
      source,
      logLines: settings.logLines,
      logRefreshSeconds: settings.logRefreshSeconds,
      text: lines.filter((line) => !filter || line.toLowerCase().includes(filter.toLowerCase())).join('\n'),
      warning: result.stderr,
      at: new Date().toISOString(),
    };
  } catch (e) {
    throw fail('로그 조회 권한 또는 서비스 상태를 확인하세요: ' + errorDetail(e), 403);
  }
}
export function backupId(value:unknown) {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) throw fail('백업 ID를 확인하세요.');
  return value;
}
export async function createBackup(kind:unknown, target:unknown, text:unknown) {
  if (kind !== 'cron' || target !== 'current-user' || typeof text !== 'string') throw fail('지원하지 않는 백업입니다.');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const record = { id: randomUUID(), kind, target, createdAt: new Date().toISOString(), sha256: hash(text), text };
  validateLocalBackup(record, record.id);
  const final = path.join(folder, record.id + '.backup.json'), temporary = path.join(folder, '.' + record.id + '.pending');
  let file:FileHandle|null=null;
  try {
    file = await open(temporary, 'wx', 0o600);
    await file.writeFile(JSON.stringify(record));
    await file.sync();
    await file.close();file = null;
    await rename(temporary, final);
    const directory = await open(folder, 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } finally {
    await file?.close();
    await unlink(temporary).catch(error => { if(!hasErrorCode(error,'ENOENT')) throw error; });
  }
  return record;
}
export function validateLocalBackup(record:unknown, id:unknown):LocalBackup {
  if (
    !object(record) ||
    typeof record.id!=='string'||record.id !== id ||
    record.kind !== 'cron' ||
    record.target !== 'current-user' ||
    typeof record.text !== 'string' ||
    Buffer.byteLength(record.text) > 1048576 ||
    typeof record.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(record.createdAt))
  )
    throw fail('현재 사용자 cron 백업만 이 저장소에서 복구할 수 있습니다.', 403);
  if (record.sha256 !== hash(record.text)) throw fail('백업 무결성 검사가 실패했습니다.');
  return {
    id: record.id,
    kind: 'cron',
    target: 'current-user',
    text: record.text,
    createdAt: record.createdAt,
    sha256: record.sha256,
  };
}
export async function backupPreview(id:unknown) {
  const key=backupId(id);
  const file = path.join(folder, key + '.backup.json'),
    stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 2 * 1048576)
    throw fail('백업 파일 경로 또는 크기를 확인하세요.', 403);
  return validateLocalBackup(JSON.parse(await readFile(file, 'utf8')), id);
}
export async function backupCatalog() {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const names = (await readdir(folder)).filter((name) => name.endsWith('.backup.json')),
    local:BackupMetadata[] = [],
    warnings:string[] = [];
  for (const name of names) {
    try {
      const { text, ...record } = await backupPreview(name.slice(0, -12));
      local.push({ ...record, bytes: Buffer.byteLength(text) });
    } catch {
      warnings.push('읽을 수 없거나 검증되지 않은 백업: ' + name);
    }
  }
  let remote:BackupMetadata[] = [];
  if (adminConfigured()) {
    const readiness = helperStatus();
    if (!readiness.ready) warnings.push(readiness.reason);
    else
      try {
        const result=await runHelper('nginx-backups');if(!Array.isArray(result.backups))throw Error('Invalid helper backup catalog');
        remote=result.backups.map((record:unknown)=>{if(!object(record)||typeof record.id!=='string'||typeof record.kind!=='string'||typeof record.target!=='string'||typeof record.createdAt!=='string'||typeof record.sha256!=='string')throw Error('Invalid helper backup catalog');return {id:record.id,kind:record.kind,target:record.target,createdAt:record.createdAt,sha256:record.sha256,...(typeof record.bytes==='number'?{bytes:record.bytes}:{}),privileged:true};});
      } catch {
        warnings.push('관리자 nginx 백업을 조회할 수 없습니다. 전용 helper와 sudo 권한을 확인하세요.');
      }
  }
  return { backups: [...local, ...remote].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), warnings };
}
export async function backups() {
  return (await backupCatalog()).backups;
}
export async function currentCron() {
  try {
    return (await exec('/usr/bin/crontab', ['-l'], { timeout: 5000, env: { ...process.env, LC_ALL: 'C' } })).stdout;
  } catch (e) {
    if (object(e)&&e.code===1&&/no crontab for/i.test(typeof e.stderr==='string'?e.stderr:'')) return '';
    throw fail('crontab 조회 실패: ' + errorDetail(e));
  }
}
export async function manualBackup(input:unknown) {
  if(!object(input))throw fail('백업 대상을 확인하세요.');
  const request = manualBackupRequest(input);
  await assertFeature(request.kind === 'nginx' ? 'nginxChanges' : 'cronChanges', { sudo: request.kind === 'nginx' });
  await auditEvent('backup', 'requested');
  try {
    const result =
      request.kind === 'cron'
        ? await createBackup('cron', 'current-user', await currentCron())
        : (await runHelper('nginx-backup', request)).backup;
    await auditEvent('backup', 'completed');
    return result;
  } catch (error) {
    await auditEvent('backup', 'failed');
    throw error;
  }
}
export async function restorePlan(id:unknown, privileged = false) {
  if (privileged) return runHelper('nginx-restore-plan', { id });
  const record = await backupPreview(id);
  const current = await currentCron();
  return { record, current, version: hash(current) };
}
export async function restoreBackup(input:unknown) {
  if(!object(input))throw fail('복구 영향을 확인하세요.');
  if (input.privileged === true) return runHelper('nginx-restore', input);
  const record = await backupPreview(input.id);
  if (input.confirm !== true) throw fail('복구 영향을 확인하세요.');
  if (!permissions().cron) throw fail('복구 권한 또는 기능 설정이 필요합니다.', 403);
  return withCronLock(folder, async () => {
    const reviewed = await backupPreview(input.id);
    if (
      typeof input.backupVersion !== 'string' ||
      !/^[a-f0-9]{64}$/.test(input.backupVersion) ||
      reviewed.sha256 !== input.backupVersion
    )
      throw fail('백업 내용이 변경되었습니다. 복구 내용을 다시 검토하세요.', 409);
    const before = await currentCron();
    if (input.version !== hash(before)) throw fail('현재 설정이 변경됐습니다. 복구 내용을 다시 검토하세요.', 409);
    await createBackup('cron', 'current-user', before);
    await installCron(reviewed.text);
    return { restored: true };
  });
}
