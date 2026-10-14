import type {RestoreOptions} from '../../lib/postgresql-code-restore.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
// Run the application's transaction primitive against a disposable local cluster.
// This does not certify the privileged helper, systemd transport, or GUI.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import { patchConfig } from '../../lib/config-patch.ts';
import { configTransaction } from '../../lib/config-transaction.ts';
import { postgresqlCodeOperationPlan, applyPostgresqlCodeOperation } from '../../lib/postgresql-code-operation.ts';
import { inspectPostgresqlConfiguration } from '../../lib/postgresql-config-inspect.ts';
import { inspectPostgresqlConfigCandidate } from '../../lib/postgresql-config-validation.ts';
import { postgresqlAutoConfigVersion } from '../../lib/postgresql-config-service.ts';
import { postgresqlCodeRestorePlan, restorePostgresqlCode } from '../../lib/postgresql-code-restore.ts';
import { inspectPostgresqlGraphArchive } from '../../lib/postgresql-archive-candidate.ts';

assert(process.getuid?.() !== 0, 'A disposable cluster must run as a regular account');
const exec = promisify(execFile),
  bin = '/usr/lib/postgresql/18/bin';
const apiMode = process.argv.includes('--api'),
  reviewed = apiMode || process.argv.includes('--reviewed');
assert(
  process.argv.slice(2).every((value) => ['--reviewed', '--api'].includes(value)),
  'Usage: postgresql-local-lifecycle.ts [--reviewed] [--api]',
);
const root = await verificationWorkDirectory('tastedev-pg-local-'),
  data = path.join(root, 'data'),
  socket = path.join(root, 'socket'),
  backups = path.join(root, 'backups'),
  base = path.join(root, 'etc'),
  target = '/etc/postgresql/18/fixture/postgresql.conf',
  cluster = path.join(base, 'postgresql/18/fixture'),
  file = reviewed ? path.join(cluster, 'postgresql.conf') : path.join(data, 'postgresql.conf');
const hash = (value:string|Buffer) => createHash('sha256').update(value).digest('hex'),
  checks:string[] = [];
let phase = 'initialize',
  cleaned = false,
  result:Record<string,unknown>={},
  bridge:Awaited<ReturnType<typeof import('./postgresql-local-api.ts').postgresqlLocalApi>>|undefined,
  activeDependencies:RestoreOptions|undefined;
const call = async (name:string, args:readonly string[]) =>
  (
    await exec(path.join(bin, name), args, {
      timeout: 30000,
      maxBuffer: 1048576,
      env: { NODE_ENV:'test', PATH: bin + ':/usr/bin:/bin', LANG: 'C.UTF-8', TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot },
    })
  ).stdout.trim();
const sql = (statement:string) =>
  call('psql', [
    '-XAt',
    '-v',
    'ON_ERROR_STOP=1',
    '-h',
    socket,
    '-p',
    '55432',
    '-U',
    'fixture',
    '-d',
    'postgres',
    '-c',
    statement,
  ]);
const values = () =>
  sql(
    "SELECT current_setting('max_connections'),current_setting('shared_buffers'),current_setting('work_mem'),current_setting('logging_collector'),inet_server_addr() IS NULL",
  );
const start = () =>
  call('pg_ctl', ['-D', data, '-l', path.join(root, 'server.log'), '-o', '-c config_file=' + file, '-w', 'start']);
const stop = () => call('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
const restart = async () => {
  let running = true;
  try {
    await call('pg_ctl', ['-D', data, 'status']);
  } catch (error) {
    if (!(error!==null&&typeof error==='object'&&'code' in error&&error.code===3)) throw error;
    running = false;
  }
  if (running) await stop();
  await start();
};
async function validate(candidate:string) {
  for (const key of ['port', 'max_connections', 'shared_buffers', 'work_mem', 'logging_collector'])
    await call('postgres', ['-D', data, '-c', 'config_file=' + candidate, '-C', key]);
}
const validation = {
  validationUid: process.getuid?.(),
  validationGid: process.getgid?.(),
  validate: (candidate:Parameters<typeof inspectPostgresqlConfigCandidate>[0]) =>
    inspectPostgresqlConfigCandidate(candidate, { validationUid: process.getuid?.(), validationGid: process.getgid?.() }),
};
async function inspectService(requested:string) {
  assert.equal(requested, target);
  const identity = jsonRecord(JSON.parse(
    await sql(
      "SELECT json_build_object('config',current_setting('config_file'),'data',current_setting('data_directory'),'hba',current_setting('hba_file'),'port',current_setting('port'),'max_connections',current_setting('max_connections'),'shared_buffers',(SELECT setting FROM pg_settings WHERE name='shared_buffers'),'work_mem',(SELECT setting FROM pg_settings WHERE name='work_mem'),'logging_collector',current_setting('logging_collector'),'errors',(SELECT count(*)::int FROM pg_file_settings WHERE error IS NOT NULL))",
    ),
  ));
  assert.equal(identity.config, file);
  assert.equal(identity.data, data);
  assert.equal(identity.hba, path.join(cluster, 'pg_hba.conf'));
  const postmaster = (await readFile(path.join(data, 'postmaster.pid'), 'utf8')).split('\n');
  assert(Number(postmaster[0]) > 0);
  assert.equal(postmaster[1], data);
  return {
    identityVerified: true,
    settingsSource: 'running-server',
    config: target,
    data,
    hba: '/etc/postgresql/18/fixture/pg_hba.conf',
    unit: 'postgresql@18-fixture.service',
    major: 18,
    pid: Number(postmaster[0]),
    start: postmaster[2],
    values: Object.fromEntries(
      ['port', 'max_connections', 'shared_buffers', 'work_mem', 'logging_collector'].map((key) => [key, identity[key]]),
    ),
    autoConfiguration: await postgresqlAutoConfigVersion(data, process.getuid?.()),
    configurationErrors: identity.errors,
  };
}
const dependencies:RestoreOptions = {
  base,
  backupRoot: backups,
  ownerUid: process.getuid?.(),
  inspectService,
  validate: (requested:string, text:string) =>
    inspectPostgresqlConfiguration(requested, {
      base,
      ownerUid: process.getuid?.(),
      overrides: new Map([[requested, text]]),
      ...validation,
    }),
  validateArchive: (archive) => inspectPostgresqlGraphArchive(archive, validation),
  control: async (unit, action) => {
    assert.equal(unit, 'postgresql@18-fixture.service');
    assert.equal(action, 'restart');
    await restart();
  },
};
async function operation(action:string, input:unknown, options:RestoreOptions = dependencies) {
  if (bridge) {
    activeDependencies = options;
    return bridge.execute(action, input);
  }
  return jsonRecord(await dispatch(action, input, options));
}
async function dispatch(action:string, input:unknown, options:RestoreOptions = dependencies) {
  switch (action) {
    case 'postgresql-code-plan':
      return postgresqlCodeOperationPlan(input, options);
    case 'postgresql-code-apply':
      return applyPostgresqlCodeOperation(input, options);
    case 'postgresql-code-restore-plan':
      return postgresqlCodeRestorePlan(input, options);
    case 'postgresql-code-restore':
      return restorePostgresqlCode(input, options);
    default:
      throw Error('Unexpected local PostgreSQL action');
  }
}
function commit(input:Record<string,unknown>, plan:Record<string,unknown>) {
  return {
    ...input,
    ...Object.fromEntries(
      ['graphVersion', 'candidateGraphVersion', 'serviceVersion', 'reviewVersion'].map((key) => [key, plan[key]]),
    ),
    confirm: true,
  };
}
async function transact(text:string, activate:()=>Promise<unknown> = restart) {
  if (!reviewed)
    return configTransaction({
      file,
      backupRoot: backups,
      version: hash(await readFile(file)),
      backupKind: 'postgresql',
      transform: async () => text,
      validate,
      activate,
      recover: restart,
    });
  const input = { path: target, version: hash(await readFile(file)), text },
    plan = await operation('postgresql-code-plan', input);
  assert.equal((await readFile(file, 'utf8')) === text, !plan.changed);
  let attempts = 0;
  return operation('postgresql-code-apply', commit(input, plan), {
    ...dependencies,
    control: async (unit, action) => {
      assert.equal(unit, 'postgresql@18-fixture.service');
      assert.equal(action, 'restart');
      if (++attempts === 1) await activate();
      else await restart();
    },
  });
}
try {
  await mkdir(socket, { mode: 0o700 });
  await mkdir(backups, { mode: 0o700 });
  const version = await call('postgres', ['--version']);
  assert.match(version, /PostgreSQL\) 18\./);
  const binarySha256 = hash(await readFile(path.join(bin, 'postgres')));
  await call('initdb', [
    '-D',
    data,
    '-U',
    'fixture',
    '--auth-local=trust',
    '--auth-host=reject',
    '--no-locale',
    '-E',
    'UTF8',
  ]);
  if (reviewed) {
    await mkdir(cluster, { recursive: true, mode: 0o700 });
    await writeFile(path.join(cluster, 'pg_hba.conf'), await readFile(path.join(data, 'pg_hba.conf')), { mode: 0o600 });
  }
  const original =
    "listen_addresses = ''\nunix_socket_directories = '" +
    socket +
    "'\n" +
    (reviewed ? "data_directory = '" + data + "'\nhba_file = '" + path.join(cluster, 'pg_hba.conf') + "'\n" : '') +
    "port = 55432\nmax_connections = 20\nshared_buffers = '64MB'\nwork_mem = '4MB'\nlogging_collector = off\n";
  await writeFile(file, original, { mode: 0o600 });
  phase = 'start';
  await start();
  assert.equal(await values(), '20|64MB|4MB|off|t');
  await sql('CREATE TABLE fixture(value text); INSERT INTO fixture VALUES ($$한글 데이터$$)');
  checks.push('private Unix-socket cluster starts with original settings');
  phase = 'apply';
  const candidate = patchConfig('postgresql', original, {
    connections: 60,
    sharedBuffers: 32,
    workMem: 8,
    logging: true,
  });
  if (apiMode) {
    phase = 'http-api';
    const { postgresqlLocalApi } = await import('./postgresql-local-api.ts');
    bridge = await postgresqlLocalApi(root, (action, input) =>
      dispatch(action, input, activeDependencies ?? dependencies),
    );
    const input = { path: target, version: hash(original), text: candidate };
    assert.equal((await bridge.post('postgresql-code-plan', input, { Cookie: '' })).status, 401);
    assert.equal((await bridge.post('postgresql-code-plan', input, { Cookie: 'linux_session=invalid' })).status, 401);
    assert.equal(
      (await bridge.post('postgresql-code-plan', input, { Origin: 'https://untrusted.example' })).status,
      403,
    );
    bridge.policy.readOnly = true;
    await bridge.savePolicy();
    assert.equal((await bridge.post('postgresql-code-plan', input)).status, 403);
    bridge.policy.readOnly = false;
    bridge.policy.databaseChanges = false;
    await bridge.savePolicy();
    assert.equal((await bridge.post('postgresql-code-plan', input)).status, 403);
    bridge.policy.databaseChanges = true;
    bridge.policy.sudoWithoutPrompt = false;
    await bridge.savePolicy();
    assert.equal((await bridge.post('postgresql-code-plan', input)).status, 403);
    bridge.policy.sudoWithoutPrompt = true;
    await bridge.savePolicy();
    assert.deepEqual(
      (await bridge.audits()).map((item) => [item.action, item.result]),
      Array.from({ length: 3 }, () => ['postgresql-code-plan', 'blocked']),
    );
    assert.equal(bridge.helperCalls.length, 0);
    assert.equal(await readFile(file, 'utf8'), original);
    checks.push(
      'real Better Auth session and HTTP API reject missing/invalid session, foreign Origin, read-only, disabled database and sudo policy before transport',
    );
  }
  if (reviewed) {
    phase = 'review-conflicts';
    const input = { path: target, version: hash(original), text: candidate },
      plan = await operation('postgresql-code-plan', input),
      request = commit(input, plan);
    assert.equal(await readFile(file, 'utf8'), original);
    assert.equal(await values(), '20|64MB|4MB|off|t');
    await assert.rejects(
      operation('postgresql-code-apply', { ...request, confirm: false }),
      (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 400,
    );
    await assert.rejects(
      operation('postgresql-code-apply', { ...request, text: candidate + '# changed after review\n' }),
      (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 400,
    );
    await restart();
    await assert.rejects(operation('postgresql-code-apply', request), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 409);
    assert.equal(await readFile(file, 'utf8'), original);
    assert.equal(await values(), '20|64MB|4MB|off|t');
    assert.equal(await sql('SELECT value FROM fixture'), '한글 데이터');
    checks.push(
      'review is read-only; unconfirmed, altered draft, and pre-restart service proof are rejected without replacement',
    );
    phase = 'apply';
  }
  const applied = await transact(candidate);
  assert.equal(applied.changed, true);
  assert.equal(applied.journalCleanupVerified, true);
  assert.equal(await values(), '60|32MB|8MB|on|t');
  assert.equal(await sql('SELECT value FROM fixture'), '한글 데이터');
  assert(typeof applied.backupId==='string');
  const archive = jsonRecord(JSON.parse(await readFile(path.join(backups, applied.backupId + '.json'), 'utf8')));
  assert(typeof archive.text==='string');
  assert.equal(archive.text, original);
  assert.equal(archive.version, hash(original));
  checks.push('app transaction applies generated settings, publishes original backup, and preserves data');
  phase = 'invalid-candidate';
  await assert.rejects(transact(candidate + 'tastedev_unknown_option = on\n'), (error:unknown) =>
    reviewed ? error!==null&&typeof error==='object'&&'status' in error&&error.status === 400 : error instanceof Error&&/Configuration validation failed/.test(error.message),
  );
  assert.equal(await readFile(file, 'utf8'), candidate);
  assert.equal(await values(), '60|32MB|8MB|on|t');
  checks.push('native validation rejects unknown settings before operational replacement');
  phase = 'activation-failure';
  const impossible = patchConfig('postgresql', candidate, { sharedBuffers: 64 });
  const recovered = await transact(impossible, async () => {
    await stop();
    throw Error('Injected service activation failure');
  });
  assert.deepEqual(
    [recovered.failed, recovered.restored, recovered.recovered, recovered.journalCleanupVerified],
    [true, true, true, true],
  );
  assert.equal(await readFile(file, 'utf8'), candidate);
  assert.equal(await values(), '60|32MB|8MB|on|t');
  assert.equal(await sql('SELECT value FROM fixture'), '한글 데이터');
  checks.push('activation failure rolls back original bytes and recovers the actual DB');
  phase = 'restore';
  let restored;
  if (reviewed) {
    const input = { path: target, id: applied.backupId },
      plan = await operation('postgresql-code-restore-plan', input);
    restored = await operation('postgresql-code-restore', {
      ...input,
      ...Object.fromEntries(
        [
          'version',
          'graphVersion',
          'candidateGraphVersion',
          'serviceVersion',
          'backupVersion',
          'backupIdentity',
          'reviewVersion',
        ].map((key) => [key, plan[key]]),
      ),
      confirm: true,
    });
  } else restored = await transact(archive.text);
  assert.equal(restored.changed, true);
  assert.equal(restored.journalCleanupVerified, true);
  assert.equal(await readFile(file, 'utf8'), original);
  assert.equal(await values(), '20|64MB|4MB|off|t');
  assert.equal(await sql('SELECT value FROM fixture'), '한글 데이터');
  checks.push('backup content restoration recovers original settings and fixture data');
  await stop();
  checks.push('temporary cluster stops cleanly');
  if (apiMode) {
    assert(bridge);
    const audits = await bridge.audits();
    assert(audits.some((item) => item.action === 'postgresql-code-apply' && item.result === 'rolled-back'));
    assert(audits.some((item) => item.action === 'postgresql-code-restore' && item.result === 'completed'));
    assert(audits.every((item) => Object.keys(item).sort().join(',') === 'action,at,result'));
    checks.push('HTTP API records rollback and restoration outcomes without code or data in audit');
  }
  result = {
    status: 'PASS',
    version,
    binarySha256,
    uid: process.getuid?.(),
    checks,
    hostPackageOrServiceChanges: false,
    networkListenAddresses: '',
    applicationTransactionTested: true,
    reviewedCodeCoordinatorTested: reviewed,
    nativeNamespaceValidationTested: reviewed,
    reviewedGraphRestoreTested: reviewed,
    httpApiBridgeTested: apiMode,
    betterAuthTested: apiMode,
    nextServerTested: false,
    privilegedHelperTested: false,
    systemdTested: false,
    guiTested: false,
  };
} catch (error) {
  result = { status: 'FAIL', phase, checks, reason: diagnostic(error), hostPackageOrServiceChanges: false };
  process.exitCode = 1;
} finally {
  await bridge?.close();
  try {
    await call('pg_ctl', ['-D', data, 'status']);
    await stop();
  } catch (error) {
    if (!(error!==null&&typeof error==='object'&&'code' in error&&typeof error.code==='number'&&[3,4].includes(error.code))) {
      result = { ...result, status: 'FAIL', cleanupError: 'Temporary cluster stop could not be confirmed' };
      process.exitCode = 1;
    }
  }
  if (!result.cleanupError) {
    await rm(root, { recursive: true, force: true });
    cleaned = true;
  }
  const evidence = path.resolve(
    verificationWorkRoot,
    'postgresql-local-lifecycle-' + new Date().toISOString().replaceAll(':', '-') + '.json',
  );
  await mkdir(path.dirname(evidence), { recursive: true });
  await writeFile(evidence, JSON.stringify({ ...result, fixtureRemoved: cleaned }, null, 2) + '\n');
  console.log(JSON.stringify({ ...result, fixtureRemoved: cleaned, evidence }));
}
