import {hasErrorCode} from './error-code.ts';
import type {NginxOperationDependencies} from './nginx-operation-hooks.ts';
type SiteOptions=NginxOperationDependencies&{base?:string;backupRoot?:string};
type SitePending={kind:'nginx-site-v1';id:string;path:string;link:string;enabled:boolean;sourceVersion:string;graphVersion:string;beforeTarget:string|null;phase:'prepared'|'changed'|'reloading'};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { mkdir, lstat, open, rename, unlink, symlink, readlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { prepareNginxSite, prepareNginxSiteRecovery } from './nginx-site-request.ts';
import { nginxTopology, assertNginxGraphVersion } from './nginx-topology.ts';
import { inspectNginxSites } from './nginx-sites.ts';
import { nginxIncludeLinks } from './nginx-include-links.ts';
import { nginxContextReview } from './nginx-context-review.ts';
import { inspectNginxService } from './nginx-service-inspect.ts';
import { nginxOperationHooks } from './nginx-operation-hooks.ts';
import { acquireConfigOperationLease } from './config-operation-lease.ts';
const fail:(message:string,status?:number)=>never = (message, status = 409) => {
  throw Object.assign(Error(message), { status });
};
const site = /^\/etc\/nginx\/sites-available\/([a-zA-Z0-9][a-zA-Z0-9_.-]*)$/;
const alias = /^\/etc\/nginx\/sites-enabled\/([a-zA-Z0-9][a-zA-Z0-9_.-]*)$/;
const version = (value:unknown):value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
async function privateRoot(root:string, create = false) {
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
      ![0, process.getuid?.()].includes(stat.uid) ||
      (stat.mode & 0o022 && !(stat.uid === 0 && stat.mode & 0o1000))
    )
      fail('사이트 변경 기록 경로를 확인하세요.');
  }
  const stat = await lstat(root);
  if (stat.uid !== process.getuid?.() || stat.mode & 0o077) fail('사이트 변경 기록 권한을 확인하세요.');
}
async function syncDirectory(directory:string) {
  const fd = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    await fd.sync();
  } finally {
    await fd.close();
  }
}
async function readPending(root:string):Promise<SitePending|null> {
  try {
    await privateRoot(root);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
  let fd;
  try {
    fd = await open(path.join(root, 'pending.json'), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.uid !== process.getuid?.() || stat.nlink !== 1 || stat.mode & 0o077 || stat.size > 8192)
      fail('사이트 변경 기록을 확인하세요.');
    const bytes = Buffer.alloc(8193),
      { bytesRead } = await fd.read(bytes, 0, bytes.length, 0);
    if (bytesRead > 8192) fail('사이트 변경 기록을 확인하세요.');
    const after = await fd.stat(),
      named = await lstat(path.join(root, 'pending.json'));
    if (
      (['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs'] as const).some((key) => stat[key] !== after[key] || stat[key] !== named[key])
    )
      fail('사이트 변경 기록이 변경되었습니다.');
    let record:unknown;
    try {
      record = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, bytesRead)));
    } catch {
      fail('사이트 변경 기록을 확인하세요.');
    }
    if (
      !object(record)||record.kind !== 'nginx-site-v1' ||
      typeof record.path!=='string'||!site.test(record.path) ||
      typeof record.link!=='string'||!alias.test(record.link) ||
      typeof record.enabled !== 'boolean' ||
      !version(record.sourceVersion) ||
      !version(record.graphVersion) ||
      (typeof record.beforeTarget !== 'string' && record.beforeTarget !== null) ||
      (record.phase!=='prepared'&&record.phase!=='changed'&&record.phase!=='reloading') ||
      typeof record.id!=='string' || !record.id ||
      !/^[a-f0-9-]{36}$/.test(record.id)
    )
      fail('사이트 변경 기록을 확인하세요.');
    return {kind:record.kind,id:record.id,path:record.path,link:record.link,enabled:record.enabled,sourceVersion:record.sourceVersion,graphVersion:record.graphVersion,beforeTarget:record.beforeTarget,phase:record.phase};
  } finally {
    await fd.close();
  }
}
async function writeRecord(root:string, record:SitePending, first = false) {
  await privateRoot(root, true);
  const temporary = path.join(root, '.pending-' + randomUUID()),
    fd = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    await fd.writeFile(JSON.stringify(record));
    await fd.sync();
  } finally {
    await fd.close();
  }
  try {
    if (first && (await readPending(root))) fail('중단된 사이트 변경을 먼저 복구하세요.');
    await rename(temporary, path.join(root, 'pending.json'));
    await syncDirectory(root);
  } finally {
    try {
      await unlink(temporary);
    } catch (error) {
      if (!hasErrorCode(error,'ENOENT')) throw error;
    }
  }
}
async function currentTarget(file:string) {
  try {
    const stat = await lstat(file);
    if (!stat.isSymbolicLink() || stat.uid !== process.getuid?.()) fail('연결 경로에 다른 파일이 있습니다.');
    return await readlink(file);
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
}
const physical = (base:string, target:string) => path.join(base, target.slice('/etc/nginx/'.length));
async function clear(root:string) {
  await unlink(path.join(root, 'pending.json'));
  await syncDirectory(root);
}
export async function nginxSitePlan(value:unknown, { base = '/etc/nginx' }:SiteOptions = {}) {
  const input = prepareNginxSite(value);
  const graph = await assertNginxGraphVersion(input.graphVersion, base),
    sites = await inspectNginxSites(graph, { base });
  if (sites.version !== input.sitesVersion) fail('사이트 파일과 연결 목록이 변경되었습니다. 다시 조회하세요.');
  const source = sites.available.entries.find((entry) => entry.path === input.path),
    link = sites.enabled.entries.find((entry) => entry.path === input.link);
  if (!sites.enabled.exists || source?.kind !== 'file'||typeof source.version!=='string')
    fail('안전한 사이트 파일과 sites-enabled 디렉터리를 선택하세요.');
  if (link && (link.status !== 'linked' || link.target !== input.path)) fail('연결 이름이 다른 파일과 충돌합니다.');
  const included = graph.edges.some(
    (edge) =>
      nginxIncludeLinks({ kind: 'directive', label: 'include ' + edge.resolved }, [{ path: input.link }])?.files.length,
  );
  if (input.enabled && !included) fail('이 연결 경로를 포함하는 nginx include 설정이 없습니다.');
  const beforeTarget = await currentTarget(physical(base, input.link));
  if (Boolean(beforeTarget) !== Boolean(link)) fail('연결 상태가 변경되었습니다.');
  await assertNginxGraphVersion(graph.version, base);
  if ((await inspectNginxSites(graph, { base })).version !== sites.version) fail('사이트 목록이 변경되었습니다.');
  return {
    path: input.path,
    link: input.link,
    enabled: input.enabled,
    sourceVersion: source.version,
    graphVersion: graph.version,
    sitesVersion: sites.version,
    beforeTarget,
    changed: input.enabled ? !link : Boolean(link),
    included: link?.included ?? false,
    operatingConfigurationChanged: false,
  };
}
// Native validation/reload hooks are mandatory. The write-ahead link record is
// preserved whenever rollback cannot prove restoration; no conflicting file is overwritten.
export async function applyNginxSite(
  value:unknown,
  {
    base = '/etc/nginx',
    backupRoot = '/var/lib/linux/admin/nginx-sites',
    inspect = inspectNginxService,
    runCommand,
  }:SiteOptions = {},
) {
  const input = prepareNginxSite(value, true);
  const release = await acquireConfigOperationLease(path.join(base, '.tastedev-nginx-graph-lock'));
  try {
    if (await readPending(backupRoot)) fail('중단된 사이트 변경을 먼저 복구하세요.');
    const plan = await nginxSitePlan(
      Object.fromEntries(Object.entries(input).filter(([key]) => !['confirm', 'review'].includes(key))),
      { base },
    );
    const hooks = nginxOperationHooks({
      inspect: async () => nginxContextReview(input.review, await inspect(), input.graphVersion),
      ...(runCommand ? { runCommand } : {}),
    });
    await hooks.inspectService();
    await hooks.validateOperational();
    await assertNginxGraphVersion(input.graphVersion, base);
    if ((await inspectNginxSites(await nginxTopology(base), { base })).version !== input.sitesVersion)
      fail('사이트 목록이 변경되었습니다.');
    if (!plan.changed) return { changed: false };
    const record:SitePending = {
      kind: 'nginx-site-v1',
      id: randomUUID(),
      path: plan.path,
      link: plan.link,
      enabled: plan.enabled,
      sourceVersion: plan.sourceVersion,
      graphVersion: plan.graphVersion,
      beforeTarget: plan.beforeTarget,
      phase: 'prepared',
    };
    await writeRecord(backupRoot, record, true);
    const file = physical(base, record.link),
      desired = '../sites-available/' + path.basename(record.path);
    let changed = false,
      reloading = false;
    try {
      await assertNginxGraphVersion(input.graphVersion, base);
      if ((await inspectNginxSites(await nginxTopology(base), { base })).version !== input.sitesVersion)
        fail('사이트 목록이 변경되었습니다.');
      if ((await currentTarget(file)) !== record.beforeTarget) fail('연결 상태가 변경되었습니다.');
      if (record.enabled) await symlink(desired, file);
      else await unlink(file);
      changed = true;
      await syncDirectory(path.dirname(file));
      record.phase = 'changed';
      await writeRecord(backupRoot, record);
      const candidate = await nginxTopology(base);
      if (
        !candidate.complete ||
        (record.enabled &&
          !candidate.files.some(
            (entry) =>
              entry.path === record.link && entry.resolved === record.path && entry.version === record.sourceVersion,
          ))
      )
        fail('변경한 연결을 nginx 설정에서 확인할 수 없습니다.');
      if (
        (await inspectNginxSites(candidate, { base })).available.entries.find((entry) => entry.path === record.path)
          ?.version !== record.sourceVersion
      )
        fail('사이트 원본 파일이 변경되었습니다.');
      await hooks.validateOperational();
      await assertNginxGraphVersion(candidate.version, base);
      if ((await currentTarget(file)) !== (record.enabled ? desired : null)) fail('변경한 연결이 다시 변경되었습니다.');
      record.phase = 'reloading';
      await writeRecord(backupRoot, record);
      reloading = true;
      await hooks.activate();
      await assertNginxGraphVersion(candidate.version, base);
      if ((await currentTarget(file)) !== (record.enabled ? desired : null)) fail('변경한 연결이 다시 변경되었습니다.');
      if (
        (await inspectNginxSites(candidate, { base })).available.entries.find((entry) => entry.path === record.path)
          ?.version !== record.sourceVersion
      )
        fail('사이트 원본 파일이 변경되었습니다.');
      const backup = await open(
        path.join(backupRoot, record.id + '.json'),
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
        0o600,
      );
      try {
        await backup.writeFile(JSON.stringify(record));
        await backup.sync();
      } finally {
        await backup.close();
      }
      await clear(backupRoot);
      return { changed: true, backupId: record.id, graphVersion: candidate.version };
    } catch (error) {
      try {
        if (changed) {
          if ((await currentTarget(file)) !== (record.enabled ? desired : null))
            fail('연결 경로가 외부에서 변경되어 자동 복구할 수 없습니다.');
          if (record.beforeTarget === null) await unlink(file);
          else await symlink(record.beforeTarget, file);
          await syncDirectory(path.dirname(file));
        }
        await assertNginxGraphVersion(record.graphVersion, base);
        await hooks.validateOperational();
        if (reloading) await hooks.recover();
        await assertNginxGraphVersion(record.graphVersion, base);
        await clear(backupRoot);
        return { failed: true, restored: true, recovered: true };
      } catch {
        return { failed: true, restored: false, recovered: false, recoveryRequired: true };
      }
    }
  } finally {
    await release();
  }
}
export async function nginxSiteRecoveryPlan({ backupRoot = '/var/lib/linux/admin/nginx-sites' }:Pick<SiteOptions,'backupRoot'> = {}) {
  const record = await readPending(backupRoot);
  return record
    ? {
        recoveryRequired: true,
        path: record.path,
        link: record.link,
        enabled: record.enabled,
        phase: record.phase,
        backupId: record.id,
      }
    : { recoveryRequired: false };
}
export async function recoverNginxSite(
  value:unknown,
  {
    base = '/etc/nginx',
    backupRoot = '/var/lib/linux/admin/nginx-sites',
    inspect = inspectNginxService,
    runCommand,
  }:SiteOptions = {},
) {
  const input = prepareNginxSiteRecovery(value);
  const release = await acquireConfigOperationLease(path.join(base, '.tastedev-nginx-graph-lock'));
  try {
    const record = await readPending(backupRoot);
    if (!record) return { recoveryRequired: false, changed: false };
    const graph = await nginxTopology(base);
    if (graph.version !== input.graphVersion) fail('nginx 설정이 변경되었습니다. 다시 조회하세요.');
    const sites = await inspectNginxSites(graph, { base });
    if (
      !sites.enabled.exists ||
      sites.available.entries.find((entry) => entry.path === record.path)?.version !== record.sourceVersion
    )
      fail('복구할 사이트 원본 파일을 확인하세요.');
    const file = physical(base, record.link),
      desired = '../sites-available/' + path.basename(record.path),
      current = await currentTarget(file),
      candidate = record.enabled ? desired : null;
    if (current !== candidate && current !== record.beforeTarget) fail('연결 경로가 다른 파일과 충돌합니다.');
    if (
      record.beforeTarget !== null &&
      !path.resolve(path.dirname(file), record.beforeTarget).startsWith(path.resolve(base) + path.sep)
    )
      fail('원본 연결 경로를 확인하세요.');
    const hooks = nginxOperationHooks({
      inspect: async () => nginxContextReview(input.review, await inspect(), input.graphVersion),
      ...(runCommand ? { runCommand } : {}),
    });
    await hooks.inspectService();
    if ((await nginxTopology(base)).version !== input.graphVersion || (await currentTarget(file)) !== current)
      fail('복구 대상이 변경되었습니다.');
    if (current !== record.beforeTarget) {
      if (record.beforeTarget === null) await unlink(file);
      else await symlink(record.beforeTarget, file);
      await syncDirectory(path.dirname(file));
    }
    await assertNginxGraphVersion(record.graphVersion, base);
    await hooks.validateOperational();
    await hooks.recover();
    await assertNginxGraphVersion(record.graphVersion, base);
    if ((await currentTarget(file)) !== record.beforeTarget) fail('복구한 연결이 다시 변경되었습니다.');
    await clear(backupRoot);
    return { restored: true, recovered: true, recoveryRequired: false };
  } finally {
    await release();
  }
}
