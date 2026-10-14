import type {RedisCandidate} from './redis-candidate.ts';
type RecoveryOptions={base?:string;backupRoot?:string;uid?:number;inspectService?:()=>unknown|Promise<unknown>;validatePrepared?:(bundle:RedisCandidate)=>unknown|Promise<unknown>;recover?:()=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readConfigJournal } from './config-journal.ts';
import { recoverConfigTransaction } from './config-transaction.ts';
import { acquireConfigOperationLease } from './config-operation-lease.ts';
import { redisBackupRecord } from './redis-backups.ts';
import { redisTopology } from './redis-topology.ts';
import { redisCandidate, assertRedisCandidate } from './redis-candidate.ts';
const logical = '/etc/redis/redis.conf',
  hash = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  fail:(message:string,status?:number)=>never = (message, status = 409) => {
    throw Object.assign(Error(message), { status });
  };
export function prepareRedisRecovery(input:unknown) {
  if (
    !object(input) ||
    input.confirm !== true ||
    Object.keys(input).some((key) => !['confirm', 'reviewVersion'].includes(key)) ||
    typeof input.reviewVersion!=='string' || !/^[a-f0-9]{64}$/.test(input.reviewVersion)
  )
    fail('중단된 Redis 작업의 복구 내용을 다시 검토하고 확인하세요.', 400);
  return Object.freeze({ confirm: true, reviewVersion: input.reviewVersion });
}
function identity(scope:unknown) {
  if (
    !object(scope) || scope.identityVerified !== true ||
    scope.startupMainVerified !== true ||
    scope.service !== 'redis-server.service' ||
    scope.main !== logical ||
    typeof scope.pid!=='number' || !Number.isInteger(scope.pid) ||
    scope.pid <= 0 ||
    typeof scope.uid!=='number' || !Number.isInteger(scope.uid) ||
    scope.uid < 0 ||
    typeof scope.start!=='string' || !/^\d+$/.test(scope.start)
  )
    fail('복구 대상 Redis 서비스의 계정과 실행 정보를 확인하세요.');
  return { pid: scope.pid, start: scope.start, uid: scope.uid, service: scope.service, main: scope.main };
}
// Trusted roots/hooks are helper dependencies, never HTTP inputs. No raw config,
// process arguments or credentials leave this module's public review result.
export async function redisRecoveryPlan({
  base = '/etc/redis',
  backupRoot = '/var/lib/linux/admin/redis',
  uid = 0,
  inspectService,
}:RecoveryOptions = {}) {
  if (typeof inspectService !== 'function') fail('Redis 복구 대상 서비스 조회 기능이 필요합니다.', 400);
  const file = path.join(base, 'redis.conf'),
    journal = await readConfigJournal(file, backupRoot);
  if (!journal) return { recoveryRequired: false as const, path: logical };
  const backup = await redisBackupRecord(journal.record.backupId, backupRoot, uid, file);
  if (backup.version !== journal.record.originalVersion) fail('중단된 작업의 Redis 백업이 변경되었습니다. 백업을 다시 확인하세요.');
  const graph = await redisTopology(undefined, base),
    main = graph.files.find((item) => item.path === logical);
  if (!graph.complete || !main || ![journal.record.originalVersion, journal.record.draftVersion].includes(main.version))
    fail('작업 중단 이후 Redis 설정이 변경되었습니다. 최신 설정으로 복구를 다시 검토하세요.');
  const restored = await redisTopology(undefined, base, new Map([[logical, backup.text]]));
  if (!restored.complete) fail('원본 Redis 설정의 include 파일 연결을 확인한 후 복구하세요.');
  const service = identity(await inspectService()),
    latest = await redisTopology(undefined, base),
    original = await redisTopology(undefined, base, new Map([[logical, backup.text]]));
  const finalBackup = await redisBackupRecord(backup.id, backupRoot, uid, file);
  if (
    latest.version !== graph.version ||
    original.version !== restored.version ||
    finalBackup.version !== backup.version ||
    JSON.stringify(await readConfigJournal(file, backupRoot)) !== JSON.stringify(journal) ||
    JSON.stringify(identity(await inspectService())) !== JSON.stringify(service)
  )
    fail('Redis 복구 검토 이후 설정·백업 또는 서비스가 변경되었습니다. 다시 검토하세요.');
  return {
    recoveryRequired: true as const,
    path: logical,
    backupId: backup.id,
    backupVersion: backup.version,
    version: main.version,
    graphVersion: graph.version,
    restoreGraphVersion: restored.version,
    currentFiles: graph.files,
    originalFiles: restored.files,
    service,
    reviewVersion: hash({ journal, graphVersion: graph.version, restoreGraphVersion: restored.version, service }),
  };
}
export async function recoverRedisConfiguration(value:unknown, options:RecoveryOptions = {}) {
  const input = prepareRedisRecovery(value);
  const {
    base = '/etc/redis',
    backupRoot = '/var/lib/linux/admin/redis',
    uid = 0,
    inspectService,
    validatePrepared,
    recover,
  } = options;
  if (typeof inspectService!=='function'||typeof validatePrepared!=='function'||typeof recover!=='function')
    fail('Redis 복구 검수와 서비스 실행 기능이 필요합니다.', 400);
  const release = await acquireConfigOperationLease(path.join(base, '.tastedev-redis-graph-lock'));
  let bundle:RedisCandidate|undefined;
  try {
    const plan = await redisRecoveryPlan(options);
    if (!plan.recoveryRequired || plan.reviewVersion !== input.reviewVersion) fail('Redis 복구 검토가 만료되었습니다. 중단 작업을 다시 조회하세요.');
    const file = path.join(base, 'redis.conf'),
      backup = await redisBackupRecord(plan.backupId, backupRoot, uid, file);
    const verify=async()=>{
      const graph = await redisTopology(undefined, base),
        restored = await redisTopology(undefined, base, new Map([[logical, backup.text]]));
      if (
        !graph.complete ||
        ![plan.graphVersion, plan.restoreGraphVersion].includes(graph.version) ||
        !restored.complete ||
        restored.version !== plan.restoreGraphVersion ||
        (await redisBackupRecord(plan.backupId, backupRoot, uid, file)).version !== plan.backupVersion ||
        JSON.stringify(identity(await inspectService())) !== JSON.stringify(plan.service)
      )
        fail('Redis 복구 중 대상 설정·백업 또는 서비스가 변경되었습니다. 다시 조회하세요.');
    }
    return await recoverConfigTransaction({
      file,
      backupRoot,
      confirm: true,
      beforeRecovery: verify,
      validate: async () => {
        const graph = await redisTopology(undefined, base);
        bundle = await redisCandidate({ version: graph.version, changes: {}, restoreText: backup.text }, base);
        if (bundle.candidateVersion !== plan.restoreGraphVersion || bundle.restoreVersion !== plan.backupVersion)
          fail('Redis 복구 후보 설정이 변경되었습니다. 다시 검토하세요.');
        await assertRedisCandidate(bundle);
        await validatePrepared(bundle);
        await assertRedisCandidate(bundle);
        await verify();
      },
      recover: async () => {
        const graph = await redisTopology(undefined, base);
        if (!graph.complete || graph.version !== plan.restoreGraphVersion) fail('원본 Redis 설정 파일 연결이 변경되었습니다. 복구를 다시 검토하세요.');
        await recover();
        if (identity(await inspectService()).uid !== plan.service.uid)
          fail('복구 중 Redis 실행 계정이 변경되었습니다. 서비스 계정을 확인하세요.');
        const final = await redisTopology(undefined, base);
        if (!final.complete || final.version !== plan.restoreGraphVersion)
          fail('서비스 복구 중 Redis 설정 파일 연결이 변경되었습니다. 설정을 다시 조회하세요.');
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
