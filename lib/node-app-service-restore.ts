import type {NodeServiceDependencies} from './node-app-service-control.ts';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { nodeServiceBackupRecord } from './node-app-service-backups.ts';
import { updateNodeAppService } from './node-app-service-update.ts';
import { inspectNodeAppService } from './node-app-service-control.ts';
const fail: (message:string,status?:number)=>never = (message, status = 409) => {
  throw Object.assign(Error(message), { status });
};
export async function nodeServiceRestorePlan(
  input: unknown,
  { callerUid, backupRoot = '/var/lib/linux/admin/node-services', ownerUid = 0, readUnit }: NodeServiceDependencies = {},
) {
  if(!object(input))fail('Reviewed backup and native checks are required',400);
  const options = { callerUid, root: backupRoot, ownerUid },
    selected = await nodeServiceBackupRecord(input.backupId, input, options);
  const current = await inspectNodeAppService(input, { callerUid, readUnit });
  if (!current.registered) fail('Registered service is required for restoration');
  const checked = await nodeServiceBackupRecord(input.backupId, input, options);
  if (checked.version !== selected.version || checked.createdAt !== selected.createdAt)
    fail('Service backup changed during review');
  const final = await inspectNodeAppService(input, { callerUid, readUnit });
  if (!final.registered || final.unitVersion !== current.unitVersion) fail('Service changed during restoration review');
  return {
    unit: current.unit,
    unitVersion: current.unitVersion,
    backupId: selected.id,
    backupVersion: selected.version,
    createdAt: selected.createdAt,
    currentOptions: current.serviceOptions,
    serviceOptions: selected.serviceOptions,
  };
}
// Trusted helper primitive. Restoring options still requires an exact managed unit
// for this profile/account. Source text and filesystem roots never come from HTTP.
export async function restoreNodeAppService(
  input: unknown,
  {
    callerUid,
    directory = '/etc/systemd/system',
    backupRoot = '/var/lib/linux/admin/node-services',
    ownerUid = 0,
    verifyContext,
    validateUnit,
    reloadManager,
  }: NodeServiceDependencies = {},
) {
  if (
    !object(input) || input.confirm !== true || typeof input.backupVersion !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.backupVersion) ||
    typeof verifyContext !== 'function' || typeof validateUnit !== 'function' || typeof reloadManager !== 'function'
  )
    fail('Reviewed backup and native checks are required', 400);
  const options = { callerUid, root: backupRoot, ownerUid };
  const selected = await nodeServiceBackupRecord(input.backupId, input, options);
  if (selected.version !== input.backupVersion) fail('Service backup changed; inspect it again');
  const checkBackup = async () => {
    const current = await nodeServiceBackupRecord(input.backupId, input, options);
    if (
      current.version !== selected.version ||
      current.text !== selected.text ||
      current.createdAt !== selected.createdAt
    )
      fail('Service backup changed during restoration');
  }
  const result = await updateNodeAppService(
    { ...input, options: selected.serviceOptions },
    {
      callerUid,
      directory,
      backupRoot,
      verifyContext: async () => {
        await checkBackup();
        await verifyContext();
        await checkBackup();
      },
      validateUnit,
      reloadManager,
    },
  );
  return { ...result, restoredBackupId: input.backupId };
}
