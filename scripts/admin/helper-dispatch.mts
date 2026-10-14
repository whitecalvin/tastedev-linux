// Standalone privilege dispatch, using the actual TypeScript executor contracts.
declare const fs:typeof import('node:fs'),BASE:string;
declare const units:readonly string[];
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
declare const execFileSync:typeof import('./helper-native-exec.mts').execFileSync;
declare const run:typeof import('./helper-native-exec.mts').run;
declare const mariaRuntime:typeof import('./helper-runtime.mts').mariaRuntime;
declare const mariaInspect:typeof import('./helper-service-operations.mts').mariaInspect;
declare const mariaServiceSnapshot:typeof import('./helper-service-operations.mts').mariaServiceSnapshot;
declare const mariaApply:typeof import('./helper-service-operations.mts').mariaApply;
declare const mariaRestore:typeof import('./helper-service-operations.mts').mariaRestore;
declare const mariaRestorePlan:typeof import('./helper-service-operations.mts').mariaRestorePlan;
declare const redisRestorePlan:typeof import('./helper-service-operations.mts').redisRestorePlan;
declare const nginxMutationStateGuard:typeof import('./helper-service-operations.mts').nginxMutationStateGuard;
declare const mariaBackupRoot:typeof import('./helper-database-backups.mts').mariaBackupRoot;
declare const redisBackupRoot:typeof import('./helper-database-backups.mts').redisBackupRoot;
declare const mariaBackups:typeof import('./helper-database-backups.mts').mariaBackups;
declare const pgOwner:typeof import('./helper-postgresql-files.mts').pgOwner;
declare const pgService:typeof import('./helper-postgresql-files.mts').pgService;
declare const pgApply:typeof import('./helper-postgresql-files.mts').pgApply;
declare const pgRestorePlan:typeof import('./helper-postgresql-backups.mts').pgRestorePlan;
declare const pgRestore:typeof import('./helper-postgresql-backups.mts').pgRestore;
declare const pgBackups:typeof import('./helper-postgresql-backups.mts').pgBackups;
declare const record:typeof import('./helper-nginx-files.mts').record;
declare const target:typeof import('./helper-nginx-files.mts').target;
declare const current:typeof import('./helper-nginx-files.mts').current;
declare const backup:typeof import('./helper-nginx-files.mts').backup;
declare const writeConfig:typeof import('./helper-nginx-files.mts').writeConfig;
declare const updateConfig:typeof import('./helper-nginx-config.mts').updateConfig;
function helperDispatchObject(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function helperDispatchErrorCode(error:unknown,code:string):boolean{return helperDispatchObject(error)&&error.code===code;}
function helperDispatchErrorText(error:unknown):string{
 if(helperDispatchObject(error)){if((typeof error.stderr==='string'||Buffer.isBuffer(error.stderr))&&error.stderr)return error.stderr.toString();if(typeof error.message==='string')return error.message;}
 return 'Native command failed';
}
export function apply(file:string,text:string,previous:string|null):string {
  if (previous !== null) backup(file, previous);
  writeConfig(file, text);
  try {
    return run('/usr/sbin/nginx', ['-t']) + run('/usr/sbin/nginx', ['-s', 'reload']);
  } catch (e) {
    if (previous === null) fs.unlinkSync(file);
    else writeConfig(file, previous);
    fail('Apply failed, previous file restored: ' + helperDispatchErrorText(e));
  }
}
export function dispatch(action:string,value:unknown):unknown|Promise<unknown> {
  if(!helperDispatchObject(value))fail('Invalid action payload');
  const input=value;
  nginxMutationStateGuard(action, input);
  if (action === 'nginx-recovery-plan')
    return (async () => {
      return (await mariaRuntime()).nginxRecoveryPlan(input);
    })();
  if (action === 'nginx-recover')
    return (async () => {
      return (await mariaRuntime()).recoverNginxConfiguration(input);
    })();
  if (action === 'redis-recovery-plan')
    return (async () => {
      const runtime = await mariaRuntime();
      return runtime.redisRecoveryPlan(runtime.redisConfigHooks({}, run));
    })();
  if (action === 'redis-recover')
    return (async () => {
      const runtime = await mariaRuntime(),
        plan = await runtime.redisRecoveryPlan(runtime.redisConfigHooks({}, run));
      return runtime.recoverRedisConfiguration(
        input,
        runtime.redisConfigHooks({}, run, { restoreVersion: plan.backupVersion ?? null }),
      );
    })();
  if (['postgresql-restore-history', 'postgresql-history-backup'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime();
      const prepared = action === 'postgresql-history-backup'
        ? runtime.preparePostgresqlHistory(input,true)
        : runtime.preparePostgresqlHistory(input,false);
      const options = { ownerUid: pgOwner(), backupRoot: BASE + '/postgresql' };
      return action === 'postgresql-restore-history'
        ? runtime.postgresqlCompletedHistory(prepared, options)
        : runtime.importPostgresqlCompletedBackup(prepared, options);
    })();
  if (['postgresql-code-restore-plan', 'postgresql-code-restore'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime();
      const prepared = runtime.preparePostgresqlCodeRestore(input, action === 'postgresql-code-restore');
      const options = { ownerUid: pgOwner(), backupRoot: BASE + '/postgresql' };
      return action === 'postgresql-code-restore-plan'
        ? runtime.postgresqlCodeRestorePlan(prepared, options)
        : runtime.restorePostgresqlCode(prepared, options);
    })();
  if (['postgresql-code-recovery-plan', 'postgresql-code-recover'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime();
      const prepared = runtime.preparePostgresqlCodeRecovery(input, action === 'postgresql-code-recover');
      const options = { ownerUid: pgOwner(), backupRoot: BASE + '/postgresql' };
      return action === 'postgresql-code-recovery-plan'
        ? runtime.postgresqlCodeRecoveryPlan(prepared, options)
        : runtime.recoverPostgresqlCode(prepared, options);
    })();
  if (['postgresql-code-plan', 'postgresql-code-apply'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime();
      const prepared = runtime.preparePostgresqlCode(input, action === 'postgresql-code-apply');
      const options = { ownerUid: pgOwner(), backupRoot: BASE + '/postgresql' };
      return action === 'postgresql-code-plan'
        ? runtime.postgresqlCodeOperationPlan(prepared, options)
        : runtime.applyPostgresqlCodeOperation(prepared, options);
    })();
  if (['postgresql-code-plan', 'postgresql-code-apply', 'mariadb-code-plan', 'mariadb-code-apply'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime();
      const prepared = runtime.prepareMariaDBCode(input, action === 'mariadb-code-apply');
      await mariaInspect(prepared.root, runtime);
      await mariaInspect(prepared.root, runtime, new Map([[prepared.path, prepared.text]]));
      return action === 'mariadb-code-plan'
        ? runtime.mariadbCodeOperationPlan(prepared)
        : runtime.applyMariaDBCodeOperation(prepared, {
            backupRoot: mariaBackupRoot(),
            inspectService: async () => mariaServiceSnapshot(),
            run: async (binary, args) => {
              try {
                return execFileSync(binary, args, {
                  encoding: 'utf8',
                  timeout: 60000,
                  maxBuffer: 2097152,
                  env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', NODE_ENV:'production' },
                });
              } catch {
                fail('MariaDB command failed');
              }
            },
          });
    })();
  if (action === 'redis-code-plan')
    return (async () => {
      return (await mariaRuntime()).redisCodeOperationPlan(input);
    })();
  if (action === 'redis-code-apply')
    return (async () => {
      return (await mariaRuntime()).applyRedisCodeOperation(input, { backupRoot: redisBackupRoot(), run });
    })();
  if (action === 'redis-config-apply')
    return (async () => {
      const runtime = await mariaRuntime();
      return runtime.applyReviewedRedis(input, {
        backupRoot: redisBackupRoot(),
        ...runtime.redisConfigHooks(input.changes, run),
      });
    })();
  if (action === 'redis-config-restore')
    return (async () => {
      const runtime = await mariaRuntime(),
        record = await runtime.readRedisRestoreRecord(input.id);
      return runtime.restoreRedisConfig(input, runtime.redisConfigHooks({}, run, { restoreVersion: record.version }));
    })();
  if (action === 'redis-config-validate')
    return (async () => {
      return (await mariaRuntime()).validateReviewedRedis(input);
    })();
  if (action === 'redis-config-source')
    return (async () => (await mariaRuntime()).readRedisConfigSource(input))();
  if (action === 'redis-context-inspect')
    return (async () => {
      if (Object.keys(input).length) fail('Redis inspection accepts no path or command input');
      return (await mariaRuntime()).inspectRedisContext();
    })();
  if (action === 'nginx-config-restore-plan')
    return (async () => {
      return (await mariaRuntime()).nginxConfigRestorePlan(input);
    })();
  if (action === 'nginx-config-backup')
    return (async () => {
      return (await mariaRuntime()).createNginxConfigBackup(input);
    })();
  if (action === 'nginx-config-backups')
    return (async () => {
      const runtime=await mariaRuntime();
      return runtime.nginxConfigBackups(runtime.prepareNginxBackupLookup(input));
    })();
  if (action === 'nginx-config-restore')
    return (async () => {
      if (input.confirm !== true) fail('Nginx restore confirmation required');
      return (await mariaRuntime()).restoreNginxConfiguration(input);
    })();
  if (action === 'nginx-config-apply')
    return (async () => {
      if (input.confirm !== true) fail('Nginx apply confirmation required');
      const runtime = await mariaRuntime(),
        backupRoot = BASE + '/nginx-config';
      try {
        fs.mkdirSync(backupRoot, { mode: 0o700 });
      } catch (error) {
        if (!helperDispatchErrorCode(error,'EEXIST')) throw error;
      }
      rootDir(backupRoot);
      if (fs.lstatSync(backupRoot).mode & 0o077) fail('Nginx backups must be private');
      return runtime.applyReviewedNginx(input, { backupRoot });
    })();
  if (action === 'postgresql-hba-recovery-status')
    return (async () => {
      return (await mariaRuntime()).postgresqlHbaRecoveryStatus(input);
    })();
  if (action === 'postgresql-hba-recover')
    return (async () => {
      return (await mariaRuntime()).recoverPostgresqlHbaOperation(input);
    })();
  if (action === 'postgresql-hba-operation-plan')
    return (async () => {
      return (await mariaRuntime()).postgresqlHbaOperationPlan(input);
    })();
  if (action === 'postgresql-hba-operation')
    return (async () => {
      return (await mariaRuntime()).applyPostgresqlHbaOperation(input);
    })();
  if (action === 'postgresql-hba-validate')
    return (async () => {
      return (await mariaRuntime()).validatePostgresqlHba(input);
    })();
  if (action === 'postgresql-hba-backup')
    return (async () => {
      return (await mariaRuntime()).createPostgresqlHbaBackup(input);
    })();
  if (action === 'postgresql-hba-backups')
    return (async () => {
      return (await mariaRuntime()).postgresqlHbaBackups(input);
    })();
  if (action === 'postgresql-hba-restore-draft')
    return (async () => {
      return (await mariaRuntime()).postgresqlHbaRestoreDraft(input);
    })();
  if (action === 'postgresql-hba-source')
    return (async () => {
      return (await mariaRuntime()).readPostgresqlHba(input);
    })();
  if (action === 'nginx-site-plan') return (async () => (await mariaRuntime()).nginxSitePlan(input))();
  if (action === 'nginx-site-apply') return (async () => (await mariaRuntime()).applyNginxSite(input))();
  if (action === 'nginx-site-recovery')
    return (async () => {
      if (Object.keys(input).length) fail('Site recovery lookup accepts no input');
      return (await mariaRuntime()).nginxSiteRecoveryPlan();
    })();
  if (action === 'nginx-site-recover') return (async () => (await mariaRuntime()).recoverNginxSite(input))();
  if (action === 'nginx-context-inspect')
    return (async () => {
      if (Object.keys(input).length) fail('Nginx inspection accepts no path or command input');
      return (await mariaRuntime()).inspectNginxContext();
    })();
  if (action === 'sudo-policy-inspect')
    return (async () => {
      const runtime = await mariaRuntime(),
        account = { uid: runtime.nodeServiceCaller(process.env.SUDO_UID), username: process.env.SUDO_USER };
      return runtime.inspectSudoPolicy({ account, verifyAccount: runtime.sudoPolicyHooks(account).verifyAccount });
    })();
  if (action === 'sudo-policy-update')
    return (async () => {
      if (input.confirm !== true) fail('Sudo rule update confirmation required');
      const runtime = await mariaRuntime(),
        account = { uid: runtime.nodeServiceCaller(process.env.SUDO_UID), username: process.env.SUDO_USER },
        hooks = runtime.sudoPolicyHooks(account);
      await hooks.verifyAccount();
      const backupRoot = BASE + '/sudo-policy';
      try {
        fs.mkdirSync(backupRoot, { mode: 0o700 });
      } catch (error) {
        if (!helperDispatchErrorCode(error,'EEXIST')) throw error;
      }
      rootDir(backupRoot);
      if (fs.lstatSync(backupRoot).mode & 0o077) fail('Sudo backups must be private');
      return runtime.updateSudoPolicy(input, { account, backupRoot, ...hooks });
    })();
  if (['node-service-recovery-plan', 'node-service-recover'].includes(action))
    return (async () => {
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      const hooks = {
        callerUid: uid,
        backupRoot: BASE + '/node-services',
        ...runtime.nodeAppServiceControlHooks(input, uid),
        ...runtime.nodeAppServiceHooks(input, uid),
      };
      return action === 'node-service-recover'
        ? runtime.recoverNodeAppService(input, hooks)
        : runtime.nodeServiceRecoveryPlan(input, hooks);
    })();
  if (action === 'node-service-restore')
    return (async () => {
      if (input.confirm !== true) fail('Service restore confirmation required');
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      const backupRoot = BASE + '/node-services',
        record = await runtime.nodeServiceBackupRecord(input.backupId, input, { callerUid: uid, root: backupRoot }),
        prepared = { ...input, options: record.serviceOptions };
      return runtime.restoreNodeAppService(prepared, {
        callerUid: uid,
        backupRoot,
        ...runtime.nodeAppServiceHooks(prepared, uid),
      });
    })();
  if (action === 'node-service-restore-plan')
    return (async () => {
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      return runtime.nodeServiceRestorePlan(input, {
        callerUid: uid,
        backupRoot: BASE + '/node-services',
        readUnit: runtime.nodeAppServiceControlHooks(input, uid).readUnit,
      });
    })();
  if (action === 'node-service-backups')
    return (async () => {
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      return runtime.nodeServiceBackups(input, { callerUid: uid, root: BASE + '/node-services' });
    })();
  if (action === 'node-service-update')
    return (async () => {
      if (input.confirm !== true) fail('Service update confirmation required');
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      const backupRoot = BASE + '/node-services';
      try {
        fs.mkdirSync(backupRoot, { mode: 0o700 });
      } catch (error) {
        if (!helperDispatchErrorCode(error,'EEXIST')) throw error;
      }
      rootDir(backupRoot);
      if (fs.lstatSync(backupRoot).mode & 0o077) fail('Service backups must be private');
      return runtime.updateNodeAppService(input, {
        callerUid: uid,
        backupRoot,
        ...runtime.nodeAppServiceHooks(input, uid),
      });
    })();
  if (action === 'node-service-inspect')
    return (async () => {
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      return runtime.inspectNodeAppService(input, {
        callerUid: uid,
        readUnit: runtime.nodeAppServiceControlHooks(input, uid).readUnit,
      });
    })();
  if (action === 'node-service-control')
    return (async () => {
      if (input.confirm !== true || typeof input.operation!=='string' || !['start', 'stop', 'restart', 'enable', 'disable'].includes(input.operation))
        fail('Invalid Node service control');
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      return runtime.controlNodeAppService(input, {
        callerUid: uid,
        ...runtime.nodeAppServiceControlHooks(input, uid),
      });
    })();
  if (action === 'node-service-install')
    return (async () => {
      if (input.confirm !== true) fail('Service installation confirmation required');
      const runtime = await mariaRuntime(),
        uid = runtime.nodeServiceCaller(process.env.SUDO_UID);
      if (input.uid !== uid) fail('Service account must match caller');
      return runtime.installNodeAppService(input, runtime.nodeAppServiceHooks(input, uid));
    })();
  if (action === 'redis-restore-plan') return redisRestorePlan(input);
  if (action === 'mariadb-recovery-plan')
    return (async () => {
      return (await mariaRuntime()).mariaDBRecoveryPlan(input, { inspectService: async () => mariaServiceSnapshot() });
    })();
  if (action === 'mariadb-recover')
    return (async () => {
      return (await mariaRuntime()).recoverMariaDBConfiguration(input, {
        inspectService: async () => mariaServiceSnapshot(),
        run: async (binary, args) => {
          try {
            return execFileSync(binary, args, {
              encoding: 'utf8',
              timeout: 60000,
              maxBuffer: 2097152,
              env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', NODE_ENV:'production' },
            });
          } catch {
            fail('MariaDB command failed');
          }
        },
      });
    })();
  if (action === 'mariadb-service-scope')
    return (async () => {
      const runtime = await mariaRuntime(),
        snapshot = mariaServiceSnapshot();
      return runtime.mariadbServiceScope(input.root, snapshot.argv, snapshot.canonical);
    })();
  if (action === 'mariadb-restore') return mariaRestore(input);
  if (action === 'mariadb-restore-plan') return mariaRestorePlan(input);
  if (action === 'redis-backups')
    return (async () => {
      for (const dir of ['/var', '/var/lib', '/var/lib/linux', '/var/lib/linux/admin']) rootDir(dir);
      const runtime = await mariaRuntime();
      return runtime.redisBackups();
    })();
  if (action === 'mariadb-backups') return mariaBackups();
  if (action === 'mariadb-apply') return mariaApply(input);
  if (action === 'postgresql-restore-plan') return pgRestorePlan(input);
  if (action === 'postgresql-restore') return pgRestore(input);
  if (['redis-config-backup', 'mariadb-config-backup'].includes(action))
    return (async () => {
      return (await mariaRuntime()).createDatabaseConfigBackup(action.startsWith('redis') ? 'redis' : 'mariadb', input);
    })();
  if (action.startsWith('postgresql-data-')) return (async()=>{ for(const directory of ['/var','/var/lib','/var/lib/linux',BASE])rootDir(directory);return (await mariaRuntime()).postgresqlDataOperation(action.slice('postgresql-data-'.length),input);})();
  if (action === 'postgresql-config-backup')
    return (async () => {
      return (await mariaRuntime()).createPostgresqlConfigBackup(input, {
        ownerUid: pgOwner(),
        backupRoot: BASE + '/postgresql',
      });
    })();
  if (action === 'postgresql-backups') return pgBackups(input);
  if (action === 'postgresql-apply') return pgApply(input);
  if (action === 'nginx-backups')
    return {
      backups: fs
        .readdirSync(BASE)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const { text, ...data } = record(f.slice(0, -5));
          return { ...data, bytes: Buffer.byteLength(text) };
        }),
    };
  if (action === 'nginx-backup') {
    const file = target(input.domain),
      text = current(file);
    if (text === null) fail('No managed config');
    const { text: _, ...data } = backup(file, text);
    return { backup: data };
  }
  if (action === 'nginx-restore-plan') {
    const data = record(input.id),
      text = current(data.target);
    if (text === null) fail('Current config missing');
    return { record: data, current: text, version: hash(text) };
  }
  if (action === 'nginx-apply') {
    if (input.confirm !== true) fail('Confirmation required');
    const file = target(input.domain);
    if (current(file + '.disabled') !== null) fail('Enable the existing disabled site before applying changes');
    const previous = current(file),
      text = updateConfig(input, previous);
    return { applied: true, target: file, logs: apply(file, text, previous) };
  }
  if (action === 'nginx-toggle') {
    if (input.confirm !== true || typeof input.enabled !== 'boolean') fail('Toggle confirmation required');
    if (typeof input.version !== 'string' || !/^[a-f0-9]{64}$/.test(input.version))
      fail('Toggle configuration version required');
    const active = target(input.domain),
      disabled = active + '.disabled';
    const activeText = current(active),
      disabledText = current(disabled);
    if (activeText !== null && disabledText !== null) fail('Both active and disabled files exist');
    const before = input.enabled ? disabledText : activeText;
    if (before === null) fail('Source configuration missing or already in requested state');
    if (input.version !== hash(before)) fail('Current config changed; reload the live site before toggling', 409);
    backup(active, before);
    const from = input.enabled ? disabled : active,
      to = input.enabled ? active : disabled;
    fs.renameSync(from, to);
    try {
      const logs = run('/usr/sbin/nginx', ['-t']) + run('/usr/sbin/nginx', ['-s', 'reload']);
      return { changed: true, enabled: input.enabled, logs };
    } catch (e) {
      fs.renameSync(to, from);
      fail('Toggle failed, previous filename restored: ' + helperDispatchErrorText(e));
    }
  }
  if (action === 'nginx-restore') {
    if (input.confirm !== true) fail('Confirmation required');
    const data = record(input.id),
      before = current(data.target);
    if (before === null || input.version !== hash(before)) fail('Current config changed');
    return { restored: true, logs: apply(data.target, data.text, before) };
  }
  if (action === 'nginx-check') {
    if (Object.keys(input).length) fail('Invalid nginx check');
    return { valid: true, logs: run('/usr/sbin/nginx', ['-t']) };
  }
  if (action === 'service' && input.unit === 'tastedev-linux.service') {
    if (input.action !== 'restart' || input.confirm !== true ||
        Object.keys(input).some(key => !['unit', 'action', 'confirm'].includes(key)))
      fail('Invalid app restart');
    // A fixed systemd timer survives this HTTP process and lets its response finish.
    const logs = run('/usr/bin/systemd-run', ['--quiet', '--collect',
      '--unit=tastedev-linux-app-restart', '--on-active=3s', '--timer-property=AccuracySec=1s',
      '/usr/bin/systemctl', '--no-ask-password', 'restart', 'tastedev-linux.service'], 10000);
    return { scheduled: true, delaySeconds: 3, logs };
  }
  if (action === 'service') {
    if (input.path !== undefined) return pgService(input);
    if (
      typeof input.unit!=='string' || !units.includes(input.unit) ||
      typeof input.action!=='string' || !['start', 'stop', 'restart', 'reload', 'enable', 'disable'].includes(input.action) ||
      (input.action === 'reload' && input.unit !== 'nginx.service') ||
      input.confirm !== true
    )
      fail('Invalid service operation');
    const loaded = run('/usr/bin/systemctl', ['show', input.unit, '--property=LoadState', '--value', '--no-pager', '--no-ask-password'], 5000).trim();
    if (loaded !== 'loaded') fail('선택한 서비스가 로드되지 않았습니다. 설치 상태를 확인한 뒤 다시 조회하세요.', 409);
    let logs = '';
    if (input.unit === 'nginx.service' && ['start', 'restart', 'reload'].includes(input.action))
      logs += run('/usr/sbin/nginx', ['-t']);
    logs += run('/usr/bin/systemctl', ['--no-ask-password', input.action, input.unit]);
    return { changed: true, logs };
  }
  if (action === 'certificate') {
    if (input.confirm !== true || input.agree !== true) fail('Certificate confirmation required');
    return (async () => {
      const runtime = await mariaRuntime();
      return runtime.certificateExecution(input, {
        backupNginx: (name, onBackup) => runtime.backupCertificateNginx(name, { onBackup }),
        reportBackup: (record) => process.stdout.write(JSON.stringify({ logs: 'nginx 설정 백업 · ' + record.path + ' · ' + record.id + '\n' }) + '\n'),
        inspectDirectory: (name) => fs.lstatSync(name),
        run:async(binary,args)=>run(binary,args),
      });
    })();
  }
  if (action === 'install') {
    if (
      input.confirm !== true ||
      !Array.isArray(input.packages) ||
      !input.packages.length ||
      input.packages.length > 6 ||
      new Set(input.packages).size !== input.packages.length
    )
      fail('Invalid packages');
    const packages:unknown[]=input.packages;
    const allowed:Record<string,string[]> = {
      nginx: ['nginx'],
      certbot: ['certbot', 'python3-certbot-nginx'],
      nodejs: ['nodejs', 'npm'],
      postgresql: ['postgresql'],
      mariadb: ['mariadb-server'],
      redis: ['redis-server'],
    };
    if (!packages.every((n):n is string => typeof n === 'string' && Object.hasOwn(allowed,n))) fail('Invalid packages');
    return {
      logs: run('/usr/bin/apt-get', [
        'install',
        '--yes',
        '--no-remove',
        '--no-upgrade',
        ...packages.flatMap((n) => allowed[n]),
      ]),
    };
  }
  fail('Unsupported action');
}
