// Integrity-checked dynamic modules keep their actual TypeScript contracts.
declare const fs:typeof import('node:fs');
declare const __dirname:string;
declare const require:NodeRequire;
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
function helperRuntimeHashes(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
export const mariaModules:readonly string[] = [
  'error-code.mjs',
  'database-config-backup.mjs',
  'postgresql-data-backup.mjs',
  'postgresql-data-context.mjs',
  'postgresql-data-operation.mjs',
  'postgresql-config-backup.mjs',
  'postgresql-backup-request.mjs',
  'postgresql-cluster-status.mjs',
  'postgresql-archive-candidate.mjs',
  'postgresql-graph-archive.mjs',
  'postgresql-code-restore.mjs',
  'postgresql-code-recovery.mjs',
  'postgresql-recovery-service.mjs',
  'postgresql-recovery-backup.mjs',
  'postgresql-code-request.mjs',
  'postgresql-code-operation.mjs',
  'postgresql-config-service.mjs',
  'postgresql-config-inspect.mjs',
  'postgresql-config-validation.mjs',
  'postgresql-config-candidate.mjs','postgresql-work-directory.mjs',
  'postgresql-config-graph.mjs',
  'postgresql-settings-text.mjs',
  'admin-native-exec.mjs',
  'postgresql-hba-journal.mjs',
  'postgresql-hba-operation.mjs',
  'postgresql-hba-service.mjs',
  'postgresql-hba-validate.mjs',
  'postgresql-hba-sandbox.mjs',
  'postgresql-hba-validation.mjs',
  'postgresql-hba-candidate.mjs',
  'postgresql-hba-graph.mjs',
  'postgresql-hba-links.mjs',
  'redis-recovery.mjs',
  'redis-apply.mjs',
  'redis-code-request.mjs',
  'redis-code-operation.mjs',
  'redis-config-hooks.mjs',
  'redis-restore-request.mjs',
  'redis-restore.mjs',
  'redis-reviewed-apply.mjs',
  'redis-reviewed-validation.mjs',
  'redis-apply-request.mjs',
  'redis-candidate.mjs',
  'redis-work-directory.mjs',
  'redis-sandbox-validation.mjs',
  'redis-sandbox-plan.mjs',
  'redis-sandbox-process.mjs',
  'redis-sandbox-executables.mjs',
  'redis-sandbox-review.mjs',
  'redis-validation-error.mjs',
  'redis-candidate-validation.mjs',
  'redis-candidate-resources.mjs',
  'redis-resource-review.mjs',
  'redis-validation-runtime.mjs',
  'redis-validation-process.mjs',
  'redis-validation-probe.mjs',
  'redis-validation-plan.mjs',
  'redis-validation-binary.mjs',
  'validation-identity-binary.mjs',
  'redis-context-inspect.mjs',
  'redis-service-inspect.mjs',
  'redis-service-scope.mjs',
  'nginx-recovery.mjs',
  'nginx-config-restore-plan.mjs',
  'config-diff.mjs',
  'nginx-config-backups.mjs',
  'nginx-config-restore.mjs',
  'nginx-apply.mjs',
  'nginx-candidate-validation.mjs',
  'nginx-candidate.mjs',
  'nginx-work-directory.mjs',
  'nginx-context-review.mjs',
  'nginx-file-update.mjs',
  'nginx-config-paths.mjs',
  'nginx-isolate-output.mjs',
  'nginx-locale.mjs',
  'nginx-operation-hooks.mjs',
  'nginx-reviewed-apply.mjs',
  'nginx-context-inspect.mjs',
  'nginx-sites.mjs',
  'nginx-site-request.mjs',
  'nginx-site-operation.mjs',
  'nginx-topology.mjs',
  'nginx-include-links.mjs',
  'nginx-syntax.mjs','nginx-server-presets.mjs','nginx-setting-name.mjs',
  'nginx-service-inspect.mjs',
  'nginx-service-scope.mjs',
  'sudo-policy-inspect.mjs',
  'sudo-policy-hooks.mjs',
  'helper-actions.mjs',
  'sudo-policy.mjs',
  'sudo-policy-update.mjs',
  'node-app-service-restore.mjs',
  'node-app-service-recovery.mjs',
  'node-app-service-backups.mjs',
  'node-app-service-update.mjs',
  'node-app-service-control.mjs',
  'node-app-service-install.mjs',
  'node-app-service-context.mjs',
  'node-app-service-hooks.mjs',
  'node-app-runtime.mjs',
  'node-app-unit.mjs',
  'node-app-profile.mjs',
  'redis-topology.mjs',
  'redis-backups.mjs',
  'mariadb-recovery.mjs',
  'mariadb-recovery-backup.mjs',
  'mariadb-service-scope.mjs',
  'mariadb-apply.mjs',
  'mariadb-topology.mjs',
  'mariadb-candidate.mjs',
  'mariadb-config-hooks.mjs',
  'mariadb-sandbox-validation.mjs',
  'mariadb-code-request.mjs',
  'mariadb-code-operation.mjs',
  'config-transaction.mjs',
  'config-operation-lease.mjs',
  'config-journal.mjs',
  'config-patch.mjs',
  'config-live.mjs',
  'mariadb-setting-groups.mjs',
  'postgresql-hba-source.mjs',
  'postgresql-hba-backups.mjs',
  'config-value-parser.mjs',
  'database-config-profile.mjs',
  'config-schema.mjs',
  'certificate-command.mjs',
  'certificate-failure.mjs','certificate-execution.mjs',
  'certificate-nginx-backup.mjs',
  'nginx-config.mjs',
  'postgresql-completed-restore.mjs',
  'postgresql-graph-restore-journal.mjs',
  'postgresql-graph-restore-review.mjs',
  'postgresql-graph-restore-snapshot.mjs',
  'postgresql-graph-restore-stages.mjs',
  'postgresql-graph-swap-progress.mjs',
  'postgresql-graph-swap.mjs',
  'postgresql-restore-before-graph.mjs',
  'postgresql-restore-service-context.mjs',
  'postgresql-reviewed-graph-restore.mjs',
  'postgresql-stage-directory.mjs',
  'postgresql-graph-code-recovery.mjs',
  'postgresql-graph-swap-recovery.mjs',
  'postgresql-original-config-validation.mjs',
  'postgresql-reviewed-graph-recovery.mjs',
  'postgresql-restore-undo-backup.mjs',
  'postgresql-completed-history.mjs',
];
export async function mariaRuntime() {
  // This action is available only from the reviewed packaged helper, never a checkout.
  const home = '/usr/lib/tastedev-linux/scripts/admin';
  if (__dirname !== home) fail('MariaDB requires the packaged root-owned helper');
  for (const dir of [
    '/usr',
    '/usr/lib',
    '/usr/lib/tastedev-linux',
    '/usr/lib/tastedev-linux/scripts',
    home,
    home + '/runtime',
  ])
    rootDir(dir);
  const manifest = home + '/runtime/manifest.json';
  function trusted(file:string):Buffer {
    const st = fs.lstatSync(file);
    if (!st.isFile() || st.isSymbolicLink() || st.uid !== 0 || st.nlink !== 1 || st.mode & 0o022 || st.size > 262144)
      fail('Unsafe admin runtime');
    return fs.readFileSync(file);
  }
  const hashes:unknown = JSON.parse(trusted(manifest).toString('utf8'));
  if (!helperRuntimeHashes(hashes)) fail('Invalid admin runtime manifest');
  if (JSON.stringify(Object.keys(hashes).sort()) !== JSON.stringify([...mariaModules].sort()))
    fail('Invalid admin runtime manifest');
  for (const name of mariaModules)
    if (hash(trusted(home + '/runtime/' + name)) !== hashes[name]) fail('Admin runtime checksum mismatch');
  const { pathToFileURL }:typeof import('node:url') = require('node:url');
  const { mariadbTopology }:typeof import('../../lib/mariadb-topology.ts') = await import(pathToFileURL(home + '/runtime/mariadb-topology.mjs').href);
  const { mariaDBRecoveryPlan, recoverMariaDBConfiguration }:typeof import('../../lib/mariadb-recovery.ts') = await import(
    pathToFileURL(home + '/runtime/mariadb-recovery.mjs').href
  );
  const { mariadbServiceScope }:typeof import('../../lib/mariadb-service-scope.ts') = await import(pathToFileURL(home + '/runtime/mariadb-service-scope.mjs').href);
  const { parseLiveConfig, readRedisConfigSource }:typeof import('../../lib/config-live.ts') = await import(pathToFileURL(home + '/runtime/config-live.mjs').href);
  const { redisCodeOperationPlan, applyRedisCodeOperation }:typeof import('../../lib/redis-code-operation.ts') = await import(
    pathToFileURL(home + '/runtime/redis-code-operation.mjs').href
  );
  const { postgresqlRecoveryBackup }:typeof import('../../lib/postgresql-recovery-backup.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-recovery-backup.mjs').href
  );
  const { preparePostgresqlHistory, postgresqlCompletedHistory, importPostgresqlCompletedBackup }:typeof import('../../lib/postgresql-completed-history.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-completed-history.mjs').href
  );
  const { preparePostgresqlCodeRestore, postgresqlCodeRestorePlan, restorePostgresqlCode }:typeof import('../../lib/postgresql-code-restore.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-code-restore.mjs').href
  );
  const { preparePostgresqlCodeRecovery, postgresqlCodeRecoveryPlan, recoverPostgresqlCode }:typeof import('../../lib/postgresql-code-recovery.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-code-recovery.mjs').href
  );
  const { preparePostgresqlCode }:typeof import('../../lib/postgresql-code-request.ts') = await import(pathToFileURL(home + '/runtime/postgresql-code-request.mjs').href);
  const { postgresqlCodeOperationPlan, applyPostgresqlCodeOperation }:typeof import('../../lib/postgresql-code-operation.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-code-operation.mjs').href
  );
  const { prepareMariaDBCode }:typeof import('../../lib/mariadb-code-request.ts') = await import(pathToFileURL(home + '/runtime/mariadb-code-request.mjs').href);
  const { mariadbCodeOperationPlan, applyMariaDBCodeOperation }:typeof import('../../lib/mariadb-code-operation.ts') = await import(
    pathToFileURL(home + '/runtime/mariadb-code-operation.mjs').href
  );
  const { inspectMariaDBSandboxCandidate }:typeof import('../../lib/mariadb-sandbox-validation.ts') = await import(
    pathToFileURL(home + '/runtime/mariadb-sandbox-validation.mjs').href
  );
  const { applyMariaDBConfig }:typeof import('../../lib/mariadb-apply.ts') = await import(pathToFileURL(home + '/runtime/mariadb-apply.mjs').href);
  const { redisTopology }:typeof import('../../lib/redis-topology.ts') = await import(pathToFileURL(home + '/runtime/redis-topology.mjs').href);
  const { redisBackups, redisBackupRecord }:typeof import('../../lib/redis-backups.ts') = await import(pathToFileURL(home + '/runtime/redis-backups.mjs').href);
  const { inspectSudoPolicy }:typeof import('../../lib/sudo-policy-inspect.ts') = await import(pathToFileURL(home + '/runtime/sudo-policy-inspect.mjs').href);
  const { sudoPolicyHooks }:typeof import('../../lib/sudo-policy-hooks.ts') = await import(pathToFileURL(home + '/runtime/sudo-policy-hooks.mjs').href);
  const { updateSudoPolicy }:typeof import('../../lib/sudo-policy-update.ts') = await import(pathToFileURL(home + '/runtime/sudo-policy-update.mjs').href);
  const { parseSudoPolicy }:typeof import('../../lib/sudo-policy.ts') = await import(pathToFileURL(home + '/runtime/sudo-policy.mjs').href);
  const { nodeServiceRecoveryPlan, recoverNodeAppService }:typeof import('../../lib/node-app-service-recovery.ts') = await import(
    pathToFileURL(home + '/runtime/node-app-service-recovery.mjs').href
  );
  const { nodeServiceRestorePlan, restoreNodeAppService }:typeof import('../../lib/node-app-service-restore.ts') = await import(
    pathToFileURL(home + '/runtime/node-app-service-restore.mjs').href
  );
  const { nodeServiceBackups, nodeServiceBackupRecord }:typeof import('../../lib/node-app-service-backups.ts') = await import(
    pathToFileURL(home + '/runtime/node-app-service-backups.mjs').href
  );
  const { updateNodeAppService }:typeof import('../../lib/node-app-service-update.ts') = await import(pathToFileURL(home + '/runtime/node-app-service-update.mjs').href);
  const { installNodeAppService }:typeof import('../../lib/node-app-service-install.ts') = await import(pathToFileURL(home + '/runtime/node-app-service-install.mjs').href);
  const { nodeServiceCaller }:typeof import('../../lib/node-app-service-context.ts') = await import(pathToFileURL(home + '/runtime/node-app-service-context.mjs').href);
  const { controlNodeAppService, inspectNodeAppService }:typeof import('../../lib/node-app-service-control.ts') = await import(
    pathToFileURL(home + '/runtime/node-app-service-control.mjs').href
  );
  const { nodeAppServiceHooks, nodeAppServiceControlHooks }:typeof import('../../lib/node-app-service-hooks.ts') = await import(
    pathToFileURL(home + '/runtime/node-app-service-hooks.mjs').href
  );
  const { createDatabaseConfigBackup }:typeof import('../../lib/database-config-backup.ts') = await import(pathToFileURL(home + '/runtime/database-config-backup.mjs').href);
  const { postgresqlDataOperation }:typeof import('../../lib/postgresql-data-operation.ts') = await import(pathToFileURL(home + '/runtime/postgresql-data-operation.mjs').href);
  const { createPostgresqlConfigBackup }:typeof import('../../lib/postgresql-config-backup.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-config-backup.mjs').href
  );
  const { createPostgresqlHbaBackup, postgresqlHbaBackups, postgresqlHbaRestoreDraft }:typeof import('../../lib/postgresql-hba-backups.ts') = await import(
    pathToFileURL(home + '/runtime/postgresql-hba-backups.mjs').href
  );
  const {
    postgresqlHbaOperationPlan,
    applyPostgresqlHbaOperation,
    recoverPostgresqlHbaOperation,
    postgresqlHbaRecoveryStatus,
  }:typeof import('../../lib/postgresql-hba-operation.ts') = await import(pathToFileURL(home + '/runtime/postgresql-hba-operation.mjs').href);
  const { validatePostgresqlHba }:typeof import('../../lib/postgresql-hba-validate.ts') = await import(pathToFileURL(home + '/runtime/postgresql-hba-validate.mjs').href);
  const { readPostgresqlHba }:typeof import('../../lib/postgresql-hba-source.ts') = await import(pathToFileURL(home + '/runtime/postgresql-hba-source.mjs').href);
  const { inspectNginxContext }:typeof import('../../lib/nginx-context-inspect.ts') = await import(pathToFileURL(home + '/runtime/nginx-context-inspect.mjs').href);
  const { nginxSitePlan, applyNginxSite, nginxSiteRecoveryPlan, recoverNginxSite }:typeof import('../../lib/nginx-site-operation.ts') = await import(
    pathToFileURL(home + '/runtime/nginx-site-operation.mjs').href
  );
  const { applyReviewedNginx }:typeof import('../../lib/nginx-reviewed-apply.ts') = await import(pathToFileURL(home + '/runtime/nginx-reviewed-apply.mjs').href);
  const { nginxConfigBackups, prepareNginxBackupLookup, createNginxConfigBackup }:typeof import('../../lib/nginx-config-backups.ts') = await import(
    pathToFileURL(home + '/runtime/nginx-config-backups.mjs').href
  );
  const { restoreNginxConfiguration }:typeof import('../../lib/nginx-config-restore.ts') = await import(pathToFileURL(home + '/runtime/nginx-config-restore.mjs').href);
  const { nginxRecoveryPlan, recoverNginxConfiguration }:typeof import('../../lib/nginx-recovery.ts') = await import(
    pathToFileURL(home + '/runtime/nginx-recovery.mjs').href
  );
  const { nginxConfigRestorePlan }:typeof import('../../lib/nginx-config-restore-plan.ts') = await import(pathToFileURL(home + '/runtime/nginx-config-restore-plan.mjs').href);
  const { redisRecoveryPlan, recoverRedisConfiguration }:typeof import('../../lib/redis-recovery.ts') = await import(
    pathToFileURL(home + '/runtime/redis-recovery.mjs').href
  );
  const { redisConfigHooks }:typeof import('../../lib/redis-config-hooks.ts') = await import(pathToFileURL(home + '/runtime/redis-config-hooks.mjs').href);
  const { applyReviewedRedis }:typeof import('../../lib/redis-reviewed-apply.ts') = await import(pathToFileURL(home + '/runtime/redis-reviewed-apply.mjs').href);
  const { restoreRedisConfig }:typeof import('../../lib/redis-restore.ts') = await import(pathToFileURL(home + '/runtime/redis-restore.mjs').href);
  const { redisBackupRecord: readRedisRestoreRecord }:typeof import('../../lib/redis-backups.ts') = await import(
    pathToFileURL(home + '/runtime/redis-backups.mjs').href
  );
  const { validateReviewedRedis }:typeof import('../../lib/redis-reviewed-validation.ts') = await import(pathToFileURL(home + '/runtime/redis-reviewed-validation.mjs').href);
  const { inspectRedisContext }:typeof import('../../lib/redis-context-inspect.ts') = await import(pathToFileURL(home + '/runtime/redis-context-inspect.mjs').href);
  const { backupCertificateNginx }:typeof import('../../lib/certificate-nginx-backup.ts') = await import(pathToFileURL(home + '/runtime/certificate-nginx-backup.mjs').href);
  const { certificateExecution }:typeof import('../../lib/certificate-execution.ts') = await import(pathToFileURL(home + '/runtime/certificate-execution.mjs').href);
  return {
    nginxSitePlan,
    applyNginxSite,
    nginxSiteRecoveryPlan,
    recoverNginxSite,
    createDatabaseConfigBackup,
    createPostgresqlConfigBackup,
    postgresqlDataOperation,
    postgresqlRecoveryBackup,
    preparePostgresqlHistory,
    postgresqlCompletedHistory,
    importPostgresqlCompletedBackup,
    preparePostgresqlCodeRestore,
    postgresqlCodeRestorePlan,
    restorePostgresqlCode,
    preparePostgresqlCodeRecovery,
    postgresqlCodeRecoveryPlan,
    recoverPostgresqlCode,
    preparePostgresqlCode,
    postgresqlCodeOperationPlan,
    applyPostgresqlCodeOperation,
    prepareMariaDBCode,
    mariadbCodeOperationPlan,
    applyMariaDBCodeOperation,
    inspectMariaDBSandboxCandidate,
    redisCodeOperationPlan,
    applyRedisCodeOperation,
    certificateExecution,
    backupCertificateNginx,
    mariaDBRecoveryPlan,
    recoverMariaDBConfiguration,
    nginxRecoveryPlan,
    recoverNginxConfiguration,
    redisRecoveryPlan,
    recoverRedisConfiguration,
    nodeServiceRecoveryPlan,
    recoverNodeAppService,
    postgresqlHbaOperationPlan,
    applyPostgresqlHbaOperation,
    recoverPostgresqlHbaOperation,
    postgresqlHbaRecoveryStatus,
    validatePostgresqlHba,
    createPostgresqlHbaBackup,
    postgresqlHbaBackups,
    postgresqlHbaRestoreDraft,
    readPostgresqlHba,
    readRedisConfigSource,
    redisConfigHooks,
    applyReviewedRedis,
    restoreRedisConfig,
    readRedisRestoreRecord,
    validateReviewedRedis,
    inspectRedisContext,
    nginxConfigRestorePlan,
    nginxConfigBackups,
    prepareNginxBackupLookup,
    createNginxConfigBackup,
    restoreNginxConfiguration,
    applyReviewedNginx,
    inspectNginxContext,
    inspectSudoPolicy,
    sudoPolicyHooks,
    updateSudoPolicy,
    parseSudoPolicy,
    nodeServiceBackupRecord,
    nodeServiceRestorePlan,
    restoreNodeAppService,
    nodeServiceBackups,
    updateNodeAppService,
    inspectNodeAppService,
    controlNodeAppService,
    nodeAppServiceControlHooks,
    installNodeAppService,
    nodeServiceCaller,
    nodeAppServiceHooks,
    redisTopology,
    redisBackupRecord,
    redisBackups,
    mariadbServiceScope,
    mariadbTopology,
    parseLiveConfig,
    applyMariaDBConfig,
    trusted,
  };
}

export type AdminRuntime=Awaited<ReturnType<typeof mariaRuntime>>;
