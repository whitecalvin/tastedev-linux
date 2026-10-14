import {jsonRecord,recordField,textField} from './verification/http-json.ts';
import {hbaTypes,hbaMethods} from '../lib/postgresql-hba.ts';
import {startupRuntimeFiles,readStartupRuntimeModule} from './startup-runtime-source.ts';
import {readAdminRuntimeModule} from './admin/runtime-source.mts';
import {buildWorkspace} from './build-workspace.ts';
import { verifyPackageServer } from './verify-package-server.ts';
import { adminRuntimeFiles } from './admin/runtime-files.mts';
import { mkdtemp, rm, readdir, lstat, readFile, mkdir, writeFile, readlink, chmod } from 'node:fs/promises';

import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const exec=promisify(execFile),project=process.cwd(),metadata=jsonRecord(JSON.parse(await readFile('package.json','utf8')));
assert.equal(metadata.name,'tastedev-linux','서버 관리 앱 프로젝트를 확인하세요.');const version=textField(metadata,'version');assert(/^\d+(?:\.\d+)*(?:[-+~][a-zA-Z0-9.+~-]+)?$/.test(version),'패키지 버전을 확인하세요.');
const root=await mkdtemp(path.join(buildWorkspace,'linux-package-verify-'));
function errorText(error:unknown,key:string):string{const value:unknown=error!==null&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,key)?.value:undefined;assert(typeof value==='string','검증 명령 오류 출력을 확인하세요.');return value;}
async function paragraphs(module:unknown,locale:string){const value=(await inspectDescription(module,'postgresqlSettingDescription','row_security',locale)).paragraphs;assert(Array.isArray(value)&&value.every(item=>typeof item==='string'));return value.join(' ');}
async function inspectDescription(module:unknown,name:string,key:string,locale:string):Promise<Record<string,unknown>>{const fn=jsonRecord(module)[name];assert(typeof fn==='function');const value:unknown=await Reflect.apply(fn,undefined,[key,locale]);return jsonRecord(value);}
try {
  const architectures:Record<string,string>={x64:'amd64',arm64:'arm64'};const architecture=architectures[process.arch];
  assert(architecture);
  const selectedFile=process.argv.slice(2).find(value=>value.endsWith('.deb'));
  const file=selectedFile?path.resolve(selectedFile):path.join(project,'dist',`tastedev-linux_${version}_${architecture}.deb`);
  const description = (await exec('/usr/bin/dpkg-deb', ['--field', file, 'Package', 'Version', 'Architecture'])).stdout;
  assert(description.includes('Package: tastedev-linux'));
  assert(description.includes('Version: ' + version));
  assert(description.includes('Architecture: ' + architecture));
  const dependencies = (await exec('/usr/bin/dpkg-deb', ['--field', file, 'Depends'])).stdout;
  assert(
    dependencies.split(',').some((value) => /^\s*bubblewrap(?:\s|$)/.test(value)),
    'Missing candidate namespace dependency',
  );
  await exec('/usr/bin/dpkg-deb', ['-x', file, root]);
  // Extraction adopts the package root's public mode; keep fixture accounts private.
  await chmod(root, 0o700);
  await exec('/usr/bin/dpkg-deb', ['-e', file, path.join(root, 'DEBIAN')]);
  for (const name of ['postinst', 'prerm']) {
    const script = path.join(root, 'DEBIAN', name);
    assert.equal((await lstat(script)).mode & 0o777, 0o755);
    await exec('/bin/sh', ['-n', script]);
  }
  assert(
    (await readFile(path.join(root, 'DEBIAN/postinst'), 'utf8')).includes(
      'deb-systemd-invoke restart tastedev-linux.service',
    ),
  );
  let files = 0;
  async function walk(dir:string):Promise<void> {
    assert.equal((await lstat(dir)).mode & 0o022, 0);
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const name = path.join(dir, entry.name);
      assert(!entry.name.startsWith('.env') && entry.name !== '.runtime', 'Private development artifact in package');
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) {
        assert.equal((await lstat(name)).mode & 0o022, 0, 'Writable code file');
        files++;
      } else if (entry.isSymbolicLink()) {
        const target = path.resolve(path.dirname(name), await readlink(name));
        assert(target.startsWith(root + path.sep), 'External package symlink');
      }
    }
  }
  await walk(path.join(root, 'usr'));
  const app = path.join(root, 'usr/lib/tastedev-linux'),
    helper = path.join(app, 'scripts/admin/linux-admin');
  assert.equal((await lstat(helper)).mode & 0o777, 0o755);
  assert.equal(
    (await readFile(path.join(app, 'admin-helper.sha256'), 'utf8')).trim(),
    createHash('sha256')
      .update(await readFile(helper))
      .digest('hex'),
  );
  assert.equal(jsonRecord(JSON.parse(await readFile(path.join(app, 'scripts/admin/package.json'), 'utf8'))).type, 'commonjs');
  let refused = false;
  try {
    await exec(process.execPath, ['-e', 'process.getuid=()=>1000;require(process.argv[1]);', helper]);
  } catch (error) {
    assert(error!==null&&typeof error==='object'&&'code' in error&&error.code===1);
    assert.equal(errorText(error,'stdout'), '');
    assert.deepEqual(JSON.parse(errorText(error,'stderr').trim()), {
      protocol: 'tastedev-helper-error-v1',
      status: 403,
      message: 'Root required',
    });
    refused = true;
  }
  assert(refused);
  const runtime = path.join(app, 'scripts/admin/runtime'),
    hashes = jsonRecord(JSON.parse(await readFile(path.join(runtime, 'manifest.json'), 'utf8')));
  assert.deepEqual(Object.keys(hashes).sort(), [...adminRuntimeFiles].sort());
  for (const name of adminRuntimeFiles) {
    const bytes = await readFile(path.join(runtime, name));
    assert.equal(hashes[name], createHash('sha256').update(bytes).digest('hex'));
    assert.deepEqual(bytes, await readAdminRuntimeModule(name,project), 'Stale packaged admin module: ' + name);
  }
  assert.deepEqual(
    await readFile(helper),
    await readFile(path.join(project, 'scripts/admin/linux-admin')),
    'Stale packaged admin helper',
  );
  const loaded = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.applyMariaDBConfig!=='function')process.exit(1);",
    path.join(runtime, 'mariadb-apply.mjs'),
  ]);
  assert.equal(loaded.stderr, '');
  const pgRestore = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.postgresqlCodeRestorePlan!=='function'||typeof module.restorePostgresqlCode!=='function')process.exit(1);",
    path.join(runtime, 'postgresql-code-restore.mjs'),
  ]);
  assert.equal(pgRestore.stderr, '');
  const pgRecovery = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.postgresqlCodeRecoveryPlan!=='function'||typeof module.recoverPostgresqlCode!=='function')process.exit(1);",
    path.join(runtime, 'postgresql-code-recovery.mjs'),
  ]);
  assert.equal(pgRecovery.stderr, '');
  const pgCodeOperation = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.postgresqlCodeOperationPlan!=='function'||typeof module.applyPostgresqlCodeOperation!=='function')process.exit(1);",
    path.join(runtime, 'postgresql-code-operation.mjs'),
  ]);
  assert.equal(pgCodeOperation.stderr, '');
  const codeOperation = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.mariadbCodeOperationPlan!=='function'||typeof module.applyMariaDBCodeOperation!=='function')process.exit(1);",
    path.join(runtime, 'mariadb-code-operation.mjs'),
  ]);
  assert.equal(codeOperation.stderr, '');
  const sandbox = await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "const module=await import(process.argv[1]);if(typeof module.inspectMariaDBSandboxCandidate!=='function'||typeof module.mariadbNamespacePlan!=='function')process.exit(1);",
    path.join(runtime, 'mariadb-sandbox-validation.mjs'),
  ]);
  assert.equal(sandbox.stderr, '');
  for (const [name, exports] of [
    ['certificate-execution.mjs', ['certificateExecution', 'inspectCertificateWebroot']],
    [
      'postgresql-hba-operation.mjs',
      [
        'preparePostgresqlHbaOperation',
        'postgresqlHbaOperationPlan',
        'applyPostgresqlHbaOperation',
        'recoverPostgresqlHbaOperation',
        'postgresqlHbaRecoveryStatus',
      ],
    ],
    [
      'postgresql-hba-service.mjs',
      ['inspectPostgresqlHbaService', 'inspectPostgresqlHbaIdentity', 'postgresqlHbaServiceHooks'],
    ],
    ['postgresql-hba-validate.mjs', ['preparePostgresqlHbaValidation', 'validatePostgresqlHba']],
    ['postgresql-hba-source.mjs', ['readPostgresqlHba']],
    ['postgresql-hba-backups.mjs', ['createPostgresqlHbaBackup', 'postgresqlHbaBackups', 'postgresqlHbaRestoreDraft']],
    ['redis-reviewed-apply.mjs', ['applyReviewedRedis']],
    ['redis-config-hooks.mjs', ['redisConfigHooks']],
    ['redis-restore.mjs', ['restoreRedisConfig']],
    ['redis-reviewed-validation.mjs', ['validateReviewedRedis']],
    ['redis-context-inspect.mjs', ['inspectRedisContext']],
    ['redis-service-inspect.mjs', ['inspectRedisService', 'inspectRedisIdentity']],
    ['nginx-config-restore-plan.mjs', ['nginxConfigRestorePlan']],
    ['nginx-config-backups.mjs', ['nginxConfigBackupRecord', 'nginxConfigBackups', 'createNginxConfigBackup']],
    ['nginx-config-restore.mjs', ['restoreNginxConfiguration']],
    ['nginx-reviewed-apply.mjs', ['applyReviewedNginx']],
    ['nginx-context-inspect.mjs', ['inspectNginxContext']],
    ['nginx-topology.mjs', ['nginxTopology', 'assertNginxGraphVersion']],
    ['nginx-service-inspect.mjs', ['inspectNginxService']],
    ['sudo-policy-inspect.mjs', ['inspectSudoPolicy']],
    ['sudo-policy-hooks.mjs', ['sudoPolicyHooks', 'sudoAccountRecord']],
    ['sudo-policy-update.mjs', ['updateSudoPolicy']],
    ['sudo-policy.mjs', ['sudoPolicyPlan', 'parseSudoPolicy']],
    ['helper-actions.mjs', ['helperActions']],
    ['node-app-service-restore.mjs', ['nodeServiceRestorePlan', 'restoreNodeAppService']],
    ['node-app-service-backups.mjs', ['nodeServiceBackups', 'nodeServiceBackupRecord']],
    ['node-app-service-update.mjs', ['updateNodeAppService']],
    ['node-app-service-control.mjs', ['controlNodeAppService', 'nodeAppInstalledOptions', 'inspectNodeAppService']],
    ['node-app-service-install.mjs', ['installNodeAppService']],
    ['node-app-service-context.mjs', ['nodeServiceCaller', 'verifyNodeServiceContext']],
    ['node-app-service-hooks.mjs', ['nodeAppServiceHooks', 'nodeAppServiceControlHooks', 'nodeAppManagerValues']],
    ['redis-backups.mjs', ['redisBackups', 'redisBackupRecord']],
    ['redis-topology.mjs', ['redisTopology', 'assertRedisGraphVersion']],
  ] as const) {
    const imported = await exec(process.execPath, [
      '--input-type=module',
      '-e',
      "const module=await import(process.argv[1]);for(const name of JSON.parse(process.argv[2]))if(name==='helperActions'?(!Array.isArray(module[name])||!module[name].length||module[name].some(action=>typeof action!=='string')||new Set(module[name]).size!==module[name].length):typeof module[name]!=='function')process.exit(1);",
      path.join(runtime, name),
      JSON.stringify(exports),
    ]);
    assert.equal(imported.stderr, '');
  }
  const cli = await readFile(path.join(root, 'usr/bin/tastedev-linux'), 'utf8'),
    service = await readFile(path.join(root, 'lib/systemd/system/tastedev-linux.service'), 'utf8');
  assert(cli.includes('configure-service-account.mjs --account'));
  assert(service.includes('LINUX_AUTH_ROOT=/var/lib/tastedev-linux'));
  const accountScript = await readFile(path.join(app, 'scripts/configure-service-account.mjs'), 'utf8');
  assert(accountScript.includes("'/usr/sbin/runuser'"));
  assert.match(accountScript, /\bidentity\s*=\s*directory\s*\+\s*'\/service-user'/);
  assert(service.includes('HOSTNAME=127.0.0.1'));
  assert(service.includes('/scripts/start-server.mjs'));
  assert.equal(
    await readFile(path.join(app, '.next/BUILD_ID'), 'utf8'),
    await readFile(path.join(project, '.next/BUILD_ID'), 'utf8'),
    'Package does not contain the current production build',
  );
  for (const name of [
    'scripts/configure-service-account.mjs',
    'lib/service-account.mjs',
    'scripts/start-server.mjs',
    'scripts/prepare-next-cli.mjs',
    'scripts/setup-admin.mjs',
    'lib/auth.mjs',
    'lib/better-auth.mjs',
    'lib/auth-password.mjs',
    'lib/auth-store.mjs',
    'lib/runtime-paths.mjs',
    'lib/network-settings.mjs',
    'lib/error-code.mjs',
    'lib/app-restart.ts',
  ])
    assert.deepEqual(
      await readFile(path.join(app, name)),
      startupRuntimeFiles.includes(name)?await readStartupRuntimeModule(name,project):await readFile(path.join(project,name)),
      'Stale packaged runtime: ' + name,
    );
  for (const name of [
    'lib/postgresql-hba-description.ts',
    'lib/locales/postgresql-hba-descriptions.json',
    'lib/postgresql-setting-description.ts',
    'lib/locales/postgresql-descriptions.json',
    'lib/locales/postgresql-description-overrides.json',
    'lib/locales/postgresql-descriptions.sources.json',
    'lib/locales/POSTGRESQL-LICENSE.txt',
    'lib/terminal-launch.ts',
    'lib/terminal-key-event.ts',
  ])
    assert.deepEqual(
      await readFile(path.join(app, name)),
      await readFile(path.join(project, name)),
      'Stale packaged descriptions or terminal runtime: ' + name,
    );
  const descriptionModule:unknown = await import(path.join(app, 'lib/postgresql-setting-description.ts'));
  const packagedDescriptionLocales = ['ko', 'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hi', 'hu', 'id', 'it', 'ja', 'nb', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'tr', 'uk', 'vi', 'zh', 'ka'];
  const descriptions = jsonRecord(JSON.parse(await readFile(path.join(app, 'lib/locales/postgresql-descriptions.json'), 'utf8')));
  for (const locale of packagedDescriptionLocales)
    for (const name of [...Object.keys(recordField(descriptions,'en')), 'include', 'include_if_exists', 'include_dir'])
      assert(
        (await inspectDescription(descriptionModule,'postgresqlSettingDescription',name,locale)).translated,
        'Missing packaged setting explanation: ' + locale + '/' + name,
      );
  for (const locale of packagedDescriptionLocales)
    assert(
      (await paragraphs(descriptionModule,locale)).includes('BYPASSRLS'),
      'Missing packaged row-security exception: ' + locale,
    );
  const hbaHelp:unknown = await import(path.join(app, 'lib/postgresql-hba-description.ts'));
  for (const locale of packagedDescriptionLocales)
    for (const key of ['type', 'database', 'user', 'address', 'method', 'options', ...hbaTypes, ...hbaMethods])
      assert(
        (await inspectDescription(hbaHelp,'postgresqlHbaDescription',key,locale)).translated,
        'Missing packaged HBA explanation: ' + locale + '/' + key,
      );
  await lstat(path.join(app, 'node_modules/next/dist/bin/next'));
  assert.equal((await lstat(path.join(app, 'node_modules/.bin/next'))).mode & 0o777, 0o755);
  assert.deepEqual(
    await readFile(path.join(app, 'public/theme-init.js')),
    await readFile(path.join(project, 'public/theme-init.js')),
  );
  await assert.rejects(lstat(path.join(app, '.next/dev')), { code: 'ENOENT' });
  assert(!(await readFile(path.join(app, 'next.config.mjs'), 'utf8')).includes("output: 'standalone'"));
  await exec(process.execPath, [path.join(app, 'node_modules/next/dist/bin/next'), '--version'], { cwd: app });
  const digest = createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
  assert((await readFile(file + '.sha256', 'utf8')).startsWith(digest));
  const serverResult:unknown = await verifyPackageServer(app, root, { terminal: process.argv.includes('--terminal') });
  assert(Array.isArray(serverResult)&&serverResult.every(value=>typeof value==='string'));const serverChecks=serverResult;
  const record = {
    status: 'PASS',
    package: path.basename(file),
    sha256: digest,
    files,
    installed: false,
    checks: [
      ...serverChecks,
      'all 351 PostgreSQL explanations for 28 supplied non-Korean languages, Korean and existing Georgian descriptions',
      'all 27 HBA field/type/method explanations for the same packaged description languages',
      'PostgreSQL description source identity, provenance and upstream license',
      'terminal launch and native language-key runtime source identity',
      'current production build ID and runtime source identity',
      'metadata',
      'no .env/runtime files',
      'code permissions',
      'contained symlinks',
      'helper manifest',
      'admin runtime closure checksums and import',
      'CLI and service shared account path',
      'loopback service',
      'package checksum',
      'maintainer script syntax and permissions',
      'upgrade restarts through policy-aware invoker',
    ],
  };
  const evidence = path.join(
    buildWorkspace,
    'package-' + new Date().toISOString().replaceAll(':', '-') + '.json',
  );
  await mkdir(path.dirname(evidence), { recursive: true, mode: 0o700 });
  await writeFile(evidence, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ ...record, evidence }));
} finally {
  await rm(root, { recursive: true, force: true });
}
