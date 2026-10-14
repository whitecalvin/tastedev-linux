import {hasErrorCode} from './error-code.ts';
import type {FileHandle} from 'node:fs/promises';
import type {FeatureOptions} from './capabilities.ts';
import type {AuditEvent} from './audit-log-page.ts';
import { readAuditLogPage } from './audit-log-page.ts';
import { stateRoot } from './runtime-paths.ts';
import { helperStatus } from './privilege.ts';
import { readFile, writeFile, mkdir, rename, open, unlink, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { featureAllowed } from './capabilities.ts';
const dir = stateRoot();
const file = path.join(dir, 'security.json');
export const defaultSecurity = Object.freeze({
  readOnly: true,
  sudoWithoutPrompt: false,
  nginxChanges: false,
  databaseChanges: false,
  certificateChanges: false,
  serviceChanges: false,
  sudoPolicyChanges: false,
  cronChanges: false,
  packageInstall: false,
  fileEditing: false,
  terminal: false,
  audit: true,
});
export type SecurityKey = keyof typeof defaultSecurity;
export type SecuritySettings = Record<SecurityKey,boolean>;
const gates = {
  sudoPolicyChanges: 'LINUX_ENABLE_SUDO_POLICY',
  databaseChanges: 'LINUX_ENABLE_ADMIN',
  nginxChanges: 'LINUX_ENABLE_ADMIN',
  certificateChanges: 'LINUX_ENABLE_ADMIN',
  serviceChanges: 'LINUX_ENABLE_ADMIN',
  cronChanges: 'LINUX_ENABLE_CRON',
  packageInstall: 'LINUX_ENABLE_INSTALL',
  terminal: 'LINUX_ENABLE_TERMINAL',
} satisfies Partial<Record<SecurityKey,string>>;
const digest = (value: SecuritySettings) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateSecurity(input: unknown): SecuritySettings {
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!Object.hasOwn(defaultSecurity,key)))throw Object.assign(new Error('보안 옵션을 확인하세요.'),{status:400});
 const candidate=input as Record<string,unknown>,settings={} as SecuritySettings;
 for(const key of Object.keys(defaultSecurity) as SecurityKey[]){const option=candidate[key];if(!Object.hasOwn(candidate,key)||typeof option!=='boolean')throw Object.assign(new Error('보안 옵션을 확인하세요.'),{status:400});settings[key]=option;}
 return settings;
}
export async function securitySettings() {
  let settings: SecuritySettings;
  try {
    settings = validateSecurity({
      databaseChanges: false,
      sudoPolicyChanges: false,
      ...JSON.parse(await readFile(file, 'utf8')),
    });
  } catch (e) {
    if (hasErrorCode(e,'ENOENT')) settings = { ...defaultSecurity };
    else throw Object.assign(new Error('보안 설정을 읽을 수 없습니다. 기록을 확인하세요.'), { status: 403 });
  }
  return {
    settings,
    privilege: helperStatus(),
    version: digest(settings),
    available: Object.fromEntries(Object.entries(gates).map(([key, env]) => [key, process.env[env] === 'true'])),
    requirements: gates,
  };
}
export async function saveSecurity(input: unknown) {
  const request=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
  const settings = validateSecurity(request.settings);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  let lock: FileHandle;
  const lockPath = path.join(dir, 'security.lock');
  try {
    lock = await open(lockPath, 'wx', 0o600);
  } catch {
    throw Object.assign(new Error('다른 보안 설정 저장이 진행 중입니다.'), { status: 409 });
  }
  try {
    const current = await securitySettings();
    if (current.version !== request.version)
      throw Object.assign(new Error('보안 설정이 변경됐습니다. 다시 조회하세요.'), { status: 409 });
    const temp = file + '.' + randomUUID();
    await writeFile(temp, JSON.stringify(settings), { mode: 0o600 });
    await rename(temp, file);
    await auditEvent('security', 'saved', true);
    return securitySettings();
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
export async function assertFeature(key: string, options: FeatureOptions = {}): Promise<void> {
  if (!featureAllowed(await securitySettings(), key, options))
    throw Object.assign(
      new Error('보안 설정에서 이 작업이 차단되었습니다. 조회 전용, 기능 허용 및 sudo 옵션을 확인하세요.'),
      { status: 403 },
    );
}
export async function auditEvent(action: string, result: string, force = false): Promise<void> {
  const { settings } = await securitySettings();
  if (!force && !settings.audit) return;
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await appendFile(
    path.join(dir, 'audit.jsonl'),
    JSON.stringify({ at: new Date().toISOString(), action, result }) + '\n',
    { mode: 0o600 },
  );
}
export function parseAuditTail(text: string): AuditEvent[] {
  return text
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const value: unknown=JSON.parse(line);if(!value||typeof value!=='object')return [];const entry=value as Record<string,unknown>;
        return typeof entry.at === 'string' && typeof entry.action === 'string' && typeof entry.result === 'string'
          ? [{ at: entry.at, action: entry.action, result: entry.result }]
          : [];
      } catch {
        return [];
      }
    })
    .slice(-100);
}
export async function auditEvents(): Promise<AuditEvent[]> {
  let handle: FileHandle | undefined;
  try {
    handle = await open(path.join(dir, 'audit.jsonl'), 'r');
    const { size } = await handle.stat();
    const start = Math.max(0, size - 262144),
      buffer = Buffer.alloc(size - start);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, start);
    let text = buffer.subarray(0, bytesRead).toString('utf8');
    if (start > 0) text = text.slice(text.indexOf('\n') + 1);
    return parseAuditTail(text);
  } catch (e) {
    if (hasErrorCode(e,'ENOENT')) return [];
    throw e;
  } finally {
    await handle?.close();
  }
}

export const auditPage = (cursor: unknown) => readAuditLogPage(path.join(dir, 'audit.jsonl'), cursor);
