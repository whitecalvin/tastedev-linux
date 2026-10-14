import type {ReviewedNginxOptions} from './nginx-reviewed-apply.ts';
type RestoreOptions=ReviewedNginxOptions&{ownerUid?:number};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { nginxConfigBackupRecord } from './nginx-config-backups.ts';
import { applyReviewedNginx } from './nginx-reviewed-apply.ts';
const fail: ()=>never = () => {
  throw Object.assign(Error('Review nginx backup restoration'), { status: 400 });
};
export async function restoreNginxConfiguration(
  input:unknown,
  { backupRoot = '/var/lib/linux/admin/nginx-config', ownerUid = 0, ...options }:RestoreOptions = {},
) {
  if (
    !object(input) ||
    input.confirm !== true ||
    Object.keys(input).some(
      (key) => !['backupId', 'path', 'version', 'graphVersion', 'confirm', 'review'].includes(key),
    )
  )
    fail();
  const record = await nginxConfigBackupRecord(input.backupId, { root: backupRoot, ownerUid });
  if (record.target !== input.path) fail();
  const { backupId, ...configuration } = input;
  const trustedOptions={...options,backupRoot};
  return applyReviewedNginx({ ...configuration, text: record.text }, trustedOptions);
}
