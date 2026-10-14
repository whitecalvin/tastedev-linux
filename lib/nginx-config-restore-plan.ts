type RestorePlanOptions={base?:string;backupRoot?:string;ownerUid?:number};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { nginxConfigBackupRecord } from './nginx-config-backups.ts';
import { nginxTopology, assertNginxGraphVersion } from './nginx-topology.ts';
import { nginxEditableFile } from './nginx-file-update.ts';
import { configDiff } from './config-diff.ts';
const fail: (status?:number)=>never = (status = 400) => {
  throw Object.assign(Error('Review current nginx configuration and backup'), { status });
};
export async function nginxConfigRestorePlan(
  input:unknown,
  { base = '/etc/nginx', backupRoot = '/var/lib/linux/admin/nginx-config', ownerUid = 0 }:RestorePlanOptions = {},
) {
  if (!object(input) || typeof input.path!=='string' || Object.keys(input).some((key) => !['backupId', 'path', 'includeDiff'].includes(key))) fail();
  if (input.includeDiff !== undefined && typeof input.includeDiff !== 'boolean') fail();
  nginxEditableFile(input.path);
  const record = await nginxConfigBackupRecord(input.backupId, { root: backupRoot, ownerUid });
  if (record.target !== input.path) fail();
  const sources = new Map<string,string>(),
    graph = await nginxTopology(base, new Map(), sources),
    selected = graph.files.find((file) => file.path === input.path || file.resolved === input.path);
  if (!graph.complete || !selected || !sources.has(selected.path)) fail(409);
  const candidate = await nginxTopology(base, new Map([[input.path, record.text]]));
  await assertNginxGraphVersion(graph.version, base);
  const current=sources.get(selected.path);if(typeof current!=='string')fail(409);
  const difference = configDiff(current, record.text);
  // Raw differences are optional; callers must explicitly authorize their display.
  // By default return counts and hashes only. The full bytes are reloaded privately during restoration.
  return {
    ...(input.includeDiff ? { difference } : {}),
    backupId: record.id,
    path: record.target,
    createdAt: record.createdAt,
    version: selected.version,
    graphVersion: graph.version,
    backupVersion: record.version,
    restoreGraphVersion: candidate.version,
    changed: difference.changed,
    startLine: difference.startLine,
    currentChangedLines: difference.before.length,
    restoredChangedLines: difference.after.length,
    includeComplete: candidate.complete,
    warnings: candidate.warnings,
    operatingConfigurationChanged: false,
  };
}
