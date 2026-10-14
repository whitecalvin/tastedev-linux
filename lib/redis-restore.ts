import type {RedisApplyOptions} from './redis-apply.ts';
type RestoreOptions=RedisApplyOptions&{uid?:number};
import { redisBackupRecord } from './redis-backups.ts';
import { redisTopology } from './redis-topology.ts';
import { applyRedisConfig } from './redis-apply.ts';
import { prepareRedisRestore } from './redis-restore-request.ts';
const fail:(message:string,status?:number)=>never = (message, status = 409) => {
  throw Object.assign(new Error(message), { status });
};
// Internal orchestration; HTTP must never supply filesystem roots or native hooks.
export async function restoreRedisConfig(
  value:unknown,
  {
    base = '/etc/redis',
    backupRoot = '/var/lib/linux/admin/redis',
    uid = 0,
    validatePrepared,
    inspectService,
    activate,
    recover,
  }:RestoreOptions = {},
) {
  const input = prepareRedisRestore(value);
  if (input?.confirm !== true) fail('Redis restore confirmation required', 400);
  if (typeof validatePrepared!=='function'||typeof inspectService!=='function'||typeof activate!=='function'||typeof recover!=='function')
    fail('Redis native validation and service inspection are required', 400);
  for (const key of (['version', 'graphVersion', 'restoreGraphVersion', 'backupVersion'] as const))
    if (typeof input[key] !== 'string' || !/^[a-f0-9]{64}$/.test(input[key])) fail('Reload Redis restore plan', 400);
  const record = await redisBackupRecord(input.id, backupRoot, uid);
  if (record.version !== input.backupVersion) fail('Redis backup changed');
  const graph = await redisTopology(undefined, base),
    main = graph.files.find((file) => file.path === record.target);
  if (!graph.complete || graph.version !== input.graphVersion || main?.version !== input.version)
    fail('Redis configuration changed');
  async function checkRestore() {
    const checked = await redisBackupRecord(input.id, backupRoot, uid);
    if (checked.version !== record.version || checked.text !== record.text || checked.createdAt !== record.createdAt)
      fail('Redis backup changed');
    const restored = await redisTopology(record.target, base, new Map([[record.target, record.text]]));
    if (!restored.complete || restored.version !== input.restoreGraphVersion)
      fail('Redis restored include graph changed');
  }
  await checkRestore();
  return applyRedisConfig(
    { confirm: true, version: input.graphVersion, changes: {} },
    {
      base,
      backupRoot,
      restoreText: record.text,
      validatePrepared: async (candidate) => {
        await checkRestore();
        await validatePrepared(candidate);
        await checkRestore();
      },
      inspectService: async () => {
        await checkRestore();
        const result = await inspectService();
        await checkRestore();
        return result;
      },
      activate,
      recover,
    },
  );
}
