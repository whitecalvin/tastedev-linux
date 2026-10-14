import type {NginxCandidate} from './nginx-candidate.ts';
import type {NginxOperationDependencies} from './nginx-operation-hooks.ts';
type RecoveryHooks={validatePrepared?:(bundle:NginxCandidate)=>unknown|Promise<unknown>;validateOperational?:()=>unknown|Promise<unknown>;recover?:()=>unknown|Promise<unknown>};
export type NginxRecoveryOptions={base?:string;backupRoot?:string;ownerUid?:number;inspect?:()=>unknown|Promise<unknown>;makeHooks?:(options:NginxOperationDependencies)=>RecoveryHooks};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readConfigJournal } from './config-journal.ts';
import { recoverConfigTransaction } from './config-transaction.ts';
import { acquireConfigOperationLease } from './config-operation-lease.ts';
import { nginxConfigBackupRecord } from './nginx-config-backups.ts';
import { nginxTopology } from './nginx-topology.ts';
import { nginxEditableFile } from './nginx-file-update.ts';
import { nginxCandidate, assertNginxCandidate } from './nginx-candidate.ts';
import { inspectNginxService } from './nginx-service-inspect.ts';
import { nginxOperationHooks } from './nginx-operation-hooks.ts';
import { nginxValidationLocale } from './nginx-locale.ts';
import { nginxContextReview } from './nginx-context-review.ts';
const hash = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  fail: (message:string,status?:number)=>never = (message, status = 409) => {
    throw Object.assign(Error(message), { status });
  };
export function prepareNginxRecovery(input:unknown) {
  if (
    !object(input) || typeof input.path!=='string' ||
    input.confirm !== true ||
    Object.keys(input).some((key) => !['path', 'confirm', 'reviewVersion', 'locale'].includes(key)) ||
    typeof input.reviewVersion!=='string' || !/^[a-f0-9]{64}$/.test(input.reviewVersion)
  )
    fail('Review and confirm interrupted nginx recovery', 400);
  nginxEditableFile(input.path);
  return Object.freeze({
    path: input.path,
    confirm: true,
    reviewVersion: input.reviewVersion,
    locale: nginxValidationLocale(input.locale),
  });
}
function identity(scope:unknown) {
  if (
    !object(scope) || scope.identityVerified !== true ||
    scope.service !== 'nginx.service' ||
    scope.main !== '/etc/nginx/nginx.conf' ||
    typeof scope.pid!=='number' || !Number.isInteger(scope.pid) ||
    scope.pid <= 0 ||
    typeof scope.start!=='string' || !/^\d+$/.test(scope.start) ||
    typeof scope.prefix !== 'string' ||
    !/^\/[a-zA-Z0-9_/-]+$/.test(scope.prefix) ||
    scope.prefix.split('/').some((part) => part === '.' || part === '..')
  )
    fail('Nginx recovery service identity requires review');
  return {
    pid: scope.pid,
    start: scope.start,
    service: scope.service,
    main: scope.main,
    prefix: scope.prefix,
    locale: nginxValidationLocale(scope.locale ?? {}),
  };
}
// Read-only review: paths and SHA metadata only, no configuration or credentials.
// Process locale is observed, not proof of live libc state. Commit attests it explicitly.
export async function nginxRecoveryPlan(
  input:unknown,
  {
    base = '/etc/nginx',
    backupRoot = '/var/lib/linux/admin/nginx-config',
    ownerUid = 0,
    inspect = inspectNginxService,
  }:NginxRecoveryOptions = {},
) {
  if (
    !object(input) || typeof input.path!=='string' ||
    Object.keys(input).some((key) => key !== 'path') ||
    typeof inspect !== 'function'
  )
    fail('Select nginx recovery target', 400);
  const file = path.join(base, nginxEditableFile(input.path)),
    journal = await readConfigJournal(file, backupRoot);
  if (!journal) return { recoveryRequired: false as const, path: input.path };
  const backup = await nginxConfigBackupRecord(journal.record.backupId, { root: backupRoot, ownerUid, base });
  if (backup.target !== file || backup.version !== journal.record.originalVersion)
    fail('Interrupted nginx backup changed');
  const graph = await nginxTopology(base),
    selected = graph.files.find((item) => item.path === input.path || item.resolved === input.path);
  if (
    !graph.complete ||
    !selected ||
    ![journal.record.originalVersion, journal.record.draftVersion].includes(selected.version)
  )
    fail('Nginx configuration changed after interruption');
  const restored = await nginxTopology(base, new Map([[input.path, backup.text]]));
  if (!restored.complete) fail('Resolve original nginx include graph before recovery');
  const service = identity(await inspect()),
    latest = await nginxTopology(base),
    original = await nginxTopology(base, new Map([[input.path, backup.text]])),
    checked = await nginxConfigBackupRecord(backup.id, { root: backupRoot, ownerUid, base });
  if (
    latest.version !== graph.version ||
    original.version !== restored.version ||
    checked.version !== backup.version ||
    JSON.stringify(await readConfigJournal(file, backupRoot)) !== JSON.stringify(journal) ||
    JSON.stringify(identity(await inspect())) !== JSON.stringify(service)
  )
    fail('Nginx recovery review changed');
  return {
    recoveryRequired: true as const,
    path: input.path,
    backupId: backup.id,
    backupVersion: backup.version,
    version: selected.version,
    graphVersion: graph.version,
    restoreGraphVersion: restored.version,
    currentFiles: graph.files,
    originalFiles: restored.files,
    service,
    reviewVersion: hash({ journal, graphVersion: graph.version, restoreGraphVersion: restored.version, service }),
    liveLibcLocaleVerified: false,
  };
}
// Roots/native hooks are trusted helper composition only; never client fields.
export async function recoverNginxConfiguration(value:unknown, options:NginxRecoveryOptions = {}) {
  const input = prepareNginxRecovery(value);
  const {
    base = '/etc/nginx',
    backupRoot = '/var/lib/linux/admin/nginx-config',
    ownerUid = 0,
    inspect = inspectNginxService,
    makeHooks = nginxOperationHooks,
  } = options;
  if (typeof inspect !== 'function' || typeof makeHooks !== 'function')
    fail('Nginx native recovery checks are required', 400);
  const release = await acquireConfigOperationLease(path.join(base, '.tastedev-nginx-graph-lock'));
  let bundle:NginxCandidate|undefined;
  try {
    const plan = await nginxRecoveryPlan({ path: input.path }, options);
    if (!plan.recoveryRequired || plan.reviewVersion !== input.reviewVersion) fail('Nginx recovery review expired');
    const file = path.join(base, nginxEditableFile(input.path)),
      backup = await nginxConfigBackupRecord(plan.backupId, { root: backupRoot, ownerUid, base });
    async function verify() {
      const graph = await nginxTopology(base),
        original = await nginxTopology(base, new Map([[input.path, backup.text]]));
      if (
        !graph.complete ||
        ![plan.graphVersion, plan.restoreGraphVersion].includes(graph.version) ||
        !original.complete ||
        original.version !== plan.restoreGraphVersion ||
        (await nginxConfigBackupRecord(plan.backupId, { root: backupRoot, ownerUid, base })).version !==
          plan.backupVersion ||
        JSON.stringify(identity(await inspect())) !== JSON.stringify(plan.service)
      )
        fail('Nginx recovery context changed');
    }
    const hooks = makeHooks({
      inspect: async () => {
        await verify();
        const scope = await inspect();
        if (JSON.stringify(identity(scope)) !== JSON.stringify(plan.service)) fail('Nginx recovery service changed');
        return nginxContextReview(
          {
            confirm: true,
            pid: plan.service.pid,
            start: plan.service.start,
            graphVersion: plan.graphVersion,
            locale: input.locale,
          },
          scope,
          plan.graphVersion,
        );
      },
    });
    if (
      typeof hooks?.validatePrepared!=='function'||typeof hooks?.validateOperational!=='function'||typeof hooks?.recover!=='function'
    )
      fail('Nginx native recovery checks are required', 400);
    const {validatePrepared,validateOperational,recover}=hooks;
    return await recoverConfigTransaction({
      file,
      backupRoot,
      confirm: true,
      beforeRecovery: verify,
      validate: async () => {
        const graph = await nginxTopology(base);
        bundle = await nginxCandidate({ version: graph.version, target: input.path, text: backup.text }, base);
        if (bundle.candidateVersion !== plan.restoreGraphVersion) fail('Nginx recovery candidate changed');
        await assertNginxCandidate(bundle);
        await validatePrepared(bundle);
        await assertNginxCandidate(bundle);
        await verify();
      },
      recover: async () => {
        await verify();
        const graph = await nginxTopology(base);
        if (graph.version !== plan.restoreGraphVersion) fail('Original nginx graph changed');
        await validateOperational();
        await verify();
        await recover();
        await verify();
      },
    });
  } finally {
    try {
      await bundle?.cleanup();
    } finally {
      await release();
    }
  }
}
