import type {MariaDBCandidate} from './mariadb-candidate.ts';
import type {MariaDBApplyOptions} from './mariadb-apply.ts';
type RecoveryOptions=Pick<MariaDBApplyOptions,'base'|'backupRoot'|'inspectService'|'run'>&{ownerUid?:number};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readConfigJournal } from './config-journal.ts';
import { recoverConfigTransaction } from './config-transaction.ts';
import { acquireConfigOperationLease } from './config-operation-lease.ts';
import { mariadbTopology } from './mariadb-topology.ts';
import { mariadbCandidate, assertMariaDBCandidate } from './mariadb-candidate.ts';
import { mariadbConfigHooks } from './mariadb-config-hooks.ts';
import { mariadbServiceScope } from './mariadb-service-scope.ts';
import { mariadbRecoveryBackup } from './mariadb-recovery-backup.ts';
const hash = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  fail:(message:string,status?:number)=>never = (message, status = 409) => {
    throw Object.assign(Error(message), { status });
  };
export function mariaRecoveryTarget(input:unknown) {
  if (
    !object(input) || typeof input.root!=='string' ||
    !['/etc/mysql/my.cnf', '/etc/mysql/mariadb.cnf'].includes(input.root) ||
    typeof input.target !== 'string' ||
    !/^\/etc\/mysql\/(?:my\.cnf|mariadb\.cnf|(?:conf\.d|mariadb\.conf\.d)\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*\.cnf)$/.test(
      input.target,
    )
  )
    fail('복구할 MariaDB 기본 설정 파일과 대상 파일을 선택하세요.', 400);
  return { root: input.root, target: input.target };
}
export function prepareMariaDBRecovery(input:unknown) {
  const selected = mariaRecoveryTarget(input);
  if (
    !object(input) || input.confirm !== true ||
    Object.keys(input).some((key) => !['root', 'target', 'confirm', 'reviewVersion'].includes(key)) ||
    typeof input.reviewVersion!=='string' || !/^[a-f0-9]{64}$/.test(input.reviewVersion)
  )
    fail('중단된 MariaDB 작업의 복구 내용을 다시 검토하고 확인하세요.', 400);
  return Object.freeze({ ...selected, confirm: true, reviewVersion: input.reviewVersion });
}
function identity(root:string, snapshot:unknown) {
  if (
    !object(snapshot)||snapshot.identityVerified !== true ||
    typeof snapshot.pid!=='number'||!Number.isInteger(snapshot.pid) ||
    snapshot.pid <= 0 ||
    typeof snapshot.uid!=='number'||!Number.isInteger(snapshot.uid) ||
    snapshot.uid < 0 ||
    typeof snapshot.start!=='string'||!/^\d+$/.test(snapshot.start)
  )
    fail('복구 대상 MariaDB 프로세스의 계정과 실행 정보를 확인하세요.');
  const scope = mariadbServiceScope(root, snapshot.argv, snapshot.canonical);
  return { pid: snapshot.pid, start: snapshot.start, uid: snapshot.uid, service: 'mariadb.service', ...scope };
}
// Trusted roots, account and runners are helper dependencies. Output contains
// hashes and process identity only; argv/candidate text never leave the helper.
export async function mariaDBRecoveryPlan(
  input:unknown,
  { base = '/etc/mysql', backupRoot = '/var/lib/linux/admin/mariadb', ownerUid = 0, inspectService }:RecoveryOptions = {},
) {
  const selected = mariaRecoveryTarget(input);
  if (!object(input)||Object.keys(input).some((key) => !['root', 'target'].includes(key)) || typeof inspectService !== 'function')
    fail('MariaDB 복구 대상 서비스 조회 기능이 필요합니다.', 400);
  const file = path.join(base, selected.target.slice(11)),
    journal = await readConfigJournal(file, backupRoot);
  if (!journal) return { recoveryRequired: false as const, ...selected };
  const backup = await mariadbRecoveryBackup(journal.record.backupId, backupRoot, ownerUid, file);
  if (backup.version !== journal.record.originalVersion) fail('중단된 작업의 MariaDB 백업이 변경되었습니다. 백업을 다시 확인하세요.');
  const graph = await mariadbTopology(selected.root, base),
    current = graph.files.find((item) => item.path === selected.target);
  if (
    !graph.complete ||
    !current ||
    ![journal.record.originalVersion, journal.record.draftVersion].includes(current.version)
  )
    fail('작업 중단 이후 MariaDB 설정이 변경되었습니다. 최신 설정으로 복구를 다시 검토하세요.');
  const restored = await mariadbTopology(selected.root, base, new Map([[selected.target, backup.text]]));
  if (!restored.complete) fail('원본 MariaDB 설정의 include 파일 연결을 확인한 후 복구하세요.');
  const service = identity(selected.root, await inspectService()),
    latest = await mariadbTopology(selected.root, base),
    original = await mariadbTopology(selected.root, base, new Map([[selected.target, backup.text]]));
  if (
    latest.version !== graph.version ||
    original.version !== restored.version ||
    (await mariadbRecoveryBackup(backup.id, backupRoot, ownerUid, file)).version !== backup.version ||
    JSON.stringify(await readConfigJournal(file, backupRoot)) !== JSON.stringify(journal) ||
    JSON.stringify(identity(selected.root, await inspectService())) !== JSON.stringify(service)
  )
    fail('MariaDB 복구 검토 이후 설정·백업 또는 서비스가 변경되었습니다. 다시 검토하세요.');
  return {
    recoveryRequired: true as const,
    ...selected,
    backupId: backup.id,
    backupVersion: backup.version,
    graphVersion: graph.version,
    restoreGraphVersion: restored.version,
    currentFiles: graph.files,
    originalFiles: restored.files,
    service,
    reviewVersion: hash({
      journal,
      root: selected.root,
      graphVersion: graph.version,
      restoreGraphVersion: restored.version,
      service,
    }),
  };
}
export async function recoverMariaDBConfiguration(value:unknown, options:RecoveryOptions = {}) {
  const input = prepareMariaDBRecovery(value);
  const {
    base = '/etc/mysql',
    backupRoot = '/var/lib/linux/admin/mariadb',
    ownerUid = 0,
    inspectService,
    run,
  } = options;
  if (typeof inspectService !== 'function' || typeof run !== 'function')
    fail('MariaDB 복구 검수와 서비스 실행 기능이 필요합니다.', 400);
  const release = await acquireConfigOperationLease(path.join(base, '.tastedev-mariadb-graph-lock'));
  let bundle:MariaDBCandidate|undefined;
  try {
    const plan = await mariaDBRecoveryPlan({ root: input.root, target: input.target }, options);
    if (!plan.recoveryRequired || plan.reviewVersion !== input.reviewVersion) fail('MariaDB 복구 검토가 만료되었습니다. 중단 작업을 다시 조회하세요.');
    const file = path.join(base, input.target.slice(11)),
      backup = await mariadbRecoveryBackup(plan.backupId, backupRoot, ownerUid, file),
      hooks = mariadbConfigHooks(input.target, {}, run, plan.backupVersion);
    const verify=async()=>{
      const graph = await mariadbTopology(input.root, base),
        original = await mariadbTopology(input.root, base, new Map([[input.target, backup.text]]));
      if (
        !graph.complete ||
        ![plan.graphVersion, plan.restoreGraphVersion].includes(graph.version) ||
        !original.complete ||
        original.version !== plan.restoreGraphVersion ||
        (await mariadbRecoveryBackup(plan.backupId, backupRoot, ownerUid, file)).version !== plan.backupVersion ||
        JSON.stringify(identity(input.root, await inspectService())) !== JSON.stringify(plan.service)
      )
        fail('MariaDB 복구 중 대상 설정·백업 또는 서비스가 변경되었습니다. 다시 조회하세요.');
    }
    await verify();
    await hooks.preflight();
    await verify();
    const result = await recoverConfigTransaction({
      file,
      backupRoot,
      confirm: true,
      beforeRecovery: verify,
      validate: async () => {
        const graph = await mariadbTopology(input.root, base);
        bundle = await mariadbCandidate(
          { root: input.root, target: input.target, version: graph.version, changes: {}, restoreText: backup.text },
          base,
        );
        await assertMariaDBCandidate(bundle);
        await hooks.validatePrepared(bundle);
        await assertMariaDBCandidate(bundle);
        await verify();
      },
      recover: async () => {
        await verify();
        const original = await mariadbTopology(input.root, base);
        if (original.version !== plan.restoreGraphVersion) fail('원본 MariaDB 설정 파일 연결이 변경되었습니다. 복구를 다시 검토하세요.');
        await hooks.recover();
        const current = identity(input.root, await inspectService()),
          final = await mariadbTopology(input.root, base);
        if (
          current.uid !== plan.service.uid ||
          current.main !== plan.service.main ||
          !final.complete ||
          final.version !== plan.restoreGraphVersion
        )
          fail('복구 후 MariaDB 실행 계정 또는 설정 파일 연결이 예상과 다릅니다. 서비스와 설정을 확인하세요.');
      },
    });
    return { ...result, validationMode: hooks.validationMode };
  } finally {
    try {
      await bundle?.cleanup();
    } finally {
      await release();
    }
  }
}
