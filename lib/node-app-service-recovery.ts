import type {NodeServiceDependencies} from './node-app-service-control.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readConfigJournal } from './config-journal.ts';
import { recoverConfigTransaction } from './config-transaction.ts';
import { nodeAppProfile } from './node-app-profile.ts';
import { nodeServiceBackupRecord } from './node-app-service-backups.ts';
import { inspectNodeAppService } from './node-app-service-control.ts';
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  fail: (message:string,status?:number)=>never = (message, status = 409) => {
    throw Object.assign(Error(message), { status });
  };
function target(input: unknown, options: NodeServiceDependencies) {
  if (typeof options.callerUid !== 'number' || !Number.isInteger(options.callerUid) || options.callerUid <= 0 || !object(input) || input.uid !== options.callerUid)
    fail('Service account must match caller', 403);
  const profile = nodeAppProfile(input.profile);
  return {
    profile,
    file: path.join(options.directory ?? '/etc/systemd/system', profile.unit),
    root: options.backupRoot ?? '/var/lib/linux/admin/node-services',
  };
}
function manager(value: unknown, unit: string, uid: number|undefined, required = false) {
  if (
    !object(value) ||
    value.DropInPaths !== '' ||
    (value.LoadState === 'loaded' &&
      (value.FragmentPath !== '/etc/systemd/system/' + unit || value.User !== String(uid))) ||
    (value.LoadState !== 'loaded' &&
      (required || value.LoadState !== 'not-found' || value.FragmentPath !== '' || value.User !== ''))
  )
    fail('Node service manager configuration requires review');
}
// Read-only review. Fresh registry/app-file snapshots are supplied by the server;
// native hooks independently validate their identity under the sudo caller UID.
export async function nodeServiceRecoveryPlan(input: unknown, options: NodeServiceDependencies = {}) {
  if(!object(input))fail('Service account must match caller',403);
  const { profile, file, root } = target(input, options);
  if (typeof options.verifyContext !== 'function' || typeof options.readUnit !== 'function' || typeof options.inspectManager !== 'function')
    fail('Native Node service recovery inspection is required', 400);
  const journal = await readConfigJournal(file, root);
  if (!journal) return { recoveryRequired: false, unit: profile.unit };
  const backup = await nodeServiceBackupRecord(journal.record.backupId, input, {
    callerUid: options.callerUid,
    ownerUid: options.ownerUid ?? 0,
    root,
    directory: options.directory,
  });
  if (backup.version !== journal.record.originalVersion) fail('Interrupted service backup changed');
  await options.verifyContext();
  const current = await inspectNodeAppService(input, options);
  if (
    !current.registered ||
    ![journal.record.originalVersion, journal.record.draftVersion].includes(current.unitVersion)
  )
    fail('Service changed after interruption; existing record preserved');
  const observed = await options.inspectManager(profile.unit);
  manager(observed, profile.unit, options.callerUid);
  const final = await inspectNodeAppService(input, options),
    latest = await readConfigJournal(file, root);
  if (!final.registered || final.unitVersion !== current.unitVersion || JSON.stringify(latest) !== JSON.stringify(journal))
    fail('Service recovery inspection changed');
  const binding = {
    profile,
    uid: input.uid,
    files: input.files,
    unitVersion: current.unitVersion,
    journal,
    manager: observed,
  };
  return {
    recoveryRequired: true,
    unit: profile.unit,
    unitVersion: current.unitVersion,
    backupId: backup.id,
    backupVersion: backup.version,
    currentOptions: current.serviceOptions,
    serviceOptions: backup.serviceOptions,
    reviewVersion: hash(binding),
    restarted: false,
  };
}
// Restores only an exactly managed registered unit and reloads systemd metadata.
// Running applications are never restarted by recovery.
export async function recoverNodeAppService(input: unknown, options: NodeServiceDependencies = {}) {
  if (
    !object(input) || input.confirm !== true || typeof input.reviewVersion !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.reviewVersion) ||
    typeof options.validateUnit !== 'function' || typeof options.reloadManager !== 'function' || typeof options.verifyContext !== 'function' || typeof options.inspectManager !== 'function'
  )
    fail('Reviewed Node service recovery confirmation required', 400);
  const {verifyContext,inspectManager,validateUnit,reloadManager}=options;
  const plan = await nodeServiceRecoveryPlan(input, options);
  if (!plan.recoveryRequired || plan.reviewVersion !== input.reviewVersion) fail('Service recovery review expired');
  const { profile, file, root } = target(input, options);
  async function verify() {
    await verifyContext();
    const current = await inspectNodeAppService(input, options);
    if (!current.registered || ![plan.unitVersion, plan.backupVersion].includes(current.unitVersion))
      fail('Service changed during recovery');
    manager(await inspectManager(profile.unit), profile.unit, options.callerUid);
    const backup = await nodeServiceBackupRecord(plan.backupId, input, {
      callerUid: options.callerUid,
      ownerUid: options.ownerUid ?? 0,
      root,
      directory: options.directory,
    });
    if (backup.version !== plan.backupVersion) fail('Service backup changed during recovery');
  }
  const result = await recoverConfigTransaction({
    file,
    backupRoot: root,
    confirm: true,
    validationSuffix: '.service',
    beforeRecovery: verify,
    validate: validateUnit,
    recover: async () => {
      await reloadManager();
      manager(await inspectManager(profile.unit), profile.unit, options.callerUid, true);
      await verifyContext();
    },
  });
  return { ...result, unit: profile.unit, restarted: false };
}
