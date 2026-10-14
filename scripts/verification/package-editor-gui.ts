import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord} from './http-json.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const project = process.cwd(),
  build = process.argv[2];
assert(build && path.isAbsolute(build));
const scenario = process.argv[3] || 'postgresql',
  kind = ['mariadb-operational','mariadb-addition','mariadb-completion','mariadb-korean'].includes(scenario)?'mariadb':['redis-addition','redis-public-help','redis-replication','redis-secrets','redis-completion','redis-korean'].includes(scenario)?'redis':scenario==='certbot-scroll'?'certbot':[
    'postgresql-addition',
    'postgresql-hba-move',
    'postgresql-hba-pending',
    'postgresql-editor-smoke',
    'postgresql-code-reorder',
    'postgresql-scroll',
    'postgresql-completion-layout',
    'postgresql-completion',
    'postgresql-unload',
    'postgresql-pending',
    'postgresql-source-import',
    'postgresql-groups',
    'postgresql-file-pending',
    'ukrainian-login',
  ].includes(scenario)
    ? 'postgresql'
    : scenario;
assert(['postgresql', 'certbot','redis','mariadb'].includes(kind));
const sourceFiles=await assertCurrentCompiledSource(build,project);
const fixture=await verificationWorkDirectory('tastedev-package-editor-gui-');
let child:ChildProcess|undefined,
  closed:Promise<unknown>|undefined,
  logs = '',
  status = 'FAIL',
  gui:Record<string,unknown>|undefined;
const socket = createServer();
await new Promise<void>((resolve,reject) => {socket.once('error',reject);socket.listen(0, '127.0.0.2', resolve);});
const address=socket.address();assert(address&&typeof address==='object');const port=address.port;
await new Promise<void>((resolve) => socket.close(()=>resolve()));
const base = 'http://127.0.0.2:' + port;
process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
const { passwordHash } = await import('../../lib/auth-password.ts'),
  { storeCredentials } = await import('../../lib/auth-store.ts');
const username = 'package-editor-fixture',
  password = randomBytes(24).toString('base64url');
storeCredentials(username, await passwordHash(password));
const source =
  'port = 5432\nmax_connections = 100\n' + (scenario==='postgresql-scroll'?'shared_buffers = 128MB\nwork_mem = 4MB\nmaintenance_work_mem = 64MB\neffective_cache_size = 4GB\nlog_min_duration_statement = -1\nlogging_collector = on\nlog_directory = \'log\'\nlog_filename = \'postgresql-%Y-%m-%d.log\'\n':'' )+
  Array.from({ length: 65 }, (_, i) => '# fixture line ' + i + ' ' + '.'.repeat(180)).join('\n') +
  '\n';
const redisSource='bind 127.0.0.1\nport 6379\nprotected-mode yes\nmaxmemory 256mb\nmaxmemory-policy noeviction\nsave 900 1\nsave 300 10\nappendonly yes\nappendfsync everysec\nrequirepass \"fixture-only-secret\"\n'+(scenario==='redis-completion'?'# hide-user-data-from-log yes\n# no changes should run\n':'');
const publicHelpSource='aof-load-truncated yes\nslowlog-log-slower-than 10000\nlatency-monitor-threshold 0\nclient-output-buffer-limit pubsub 32mb 8mb 60\nlist-max-listpack-size -2\n# io-threads-do-reads yes\n';
const replicationSource='replicaof replica.example.invalid 6380\nmasterauth "fixture-only-replication-password"\nslave-priority 100\ncluster-node-timeout 15000\ncluster-announce-tls-port 6379\n';
const secretSource='tls-key-file-pass \"fixture-tls-secret\"\n'+'tls-client-key-file-pass \"fixture-client-secret\"\n'+'user fixture on >fixture-acl-secret ~* +@all\n';
const mariaSource='[client]\nport = 3306\npassword = "fixture-only-secret"\n[mariadbd]\nbind-address = 127.0.0.1\nport = 3307\nmax_connections = 100\nmax_connections = 200\ninnodb_buffer_pool_size = 128M\nskip-networking\n'+(scenario==='mariadb-operational'?'require-secure-transport = ON\nssl_ca = /fixture/ca.pem\nbinlog_expire_logs_seconds = 604800\ninnodb_flush_method = O_DIRECT\n':'');
try {
  await mkdir(path.join(fixture,'mysql'),{mode:0o700});
  await writeFile(path.join(fixture,'mysql/my.cnf'),mariaSource,{mode:0o600});
  await mkdir(path.join(fixture,'redis'),{mode:0o700});
  await writeFile(path.join(fixture,'redis/redis.conf'),redisSource+(scenario==='redis-secrets'?secretSource:scenario==='redis-replication'?replicationSource:scenario==='redis-public-help'?publicHelpSource:''),{mode:0o600});
  for (const cluster of ['main', 'other']) {
    await mkdir(path.join(fixture, 'postgresql/18', cluster), { recursive: true, mode: 0o700 });
    await writeFile(path.join(fixture, 'postgresql/18', cluster, 'postgresql.conf'), source, { mode: 0o600 });
    if(['postgresql-hba-pending','postgresql-hba-move'].includes(scenario))await writeFile(path.join(fixture,'postgresql/18',cluster,'pg_hba.conf'),'local all all peer\n',{mode:0o600});
  }
  await mkdir(path.join(fixture, 'letsencrypt/live'), { recursive: true, mode: 0o700 });
  await mkdir(path.join(fixture, 'letsencrypt/renewal'), { recursive: true, mode: 0o700 });
  const env:NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    BETTER_AUTH_URL: base,
    LINUX_WORKSPACE_ROOT: path.join(fixture, 'workspace'),
    LINUX_ENABLE_TERMINAL: 'false',
    LINUX_ENABLE_ADMIN: 'false',
    LINUX_ENABLE_CRON: 'false',
    LINUX_ENABLE_INSTALL: 'false',
    LINUX_ENABLE_AI: 'false',
  };
  delete env.OPENAI_API_KEY;
  delete env.LINUX_LOGIN_USERNAME;
  delete env.LINUX_LOGIN_PASSWORD_HASH;
  if(kind==='redis')await writeFile(path.join(fixture,'dpkg-status'),(await readFile('/var/lib/dpkg/status','utf8'))+'\nPackage: redis-server\nStatus: install ok installed\nPriority: optional\nSection: database\nArchitecture: amd64\nVersion: 5:8.0.5-1\nDescription: isolated GUI inventory fixture, not a host installation\n\n',{mode:0o600});
  if(kind==='mariadb')await writeFile(path.join(fixture,'dpkg-status'),(await readFile('/var/lib/dpkg/status','utf8')).replace(/(?:^|\n)Package: mariadb-server\n[\s\S]*?(?=\n\n|$)/g,'')+'\n\nPackage: mariadb-server\nStatus: install ok installed\nPriority: optional\nSection: database\nArchitecture: amd64\nVersion: 1:11.8.6-1\nDescription: isolated GUI inventory fixture, not a host installation\n\n',{mode:0o600});
  const args = [
    '--unshare-user',
    '--uid',
    '0',
    '--gid',
    '0',
    '--unshare-pid',
    '--die-with-parent',
    '--new-session',
    '--ro-bind',
    '/',
    '/',
    '--bind',
    fixture,
    fixture,
    '--tmpfs',
    '/etc',
    '--ro-bind',
    '/etc/passwd',
    '/etc/passwd',
    '--ro-bind',
    '/etc/group',
    '/etc/group',
    '--ro-bind',
    path.join(fixture,'redis'),
    '/etc/redis',
    '--ro-bind',
    path.join(fixture, 'postgresql'),
    '/etc/postgresql',
    '--ro-bind',
    path.join(fixture, 'letsencrypt'),
    '/etc/letsencrypt',
    '--tmpfs',
    '/run',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    process.execPath,
    path.join(project, 'node_modules/next/dist/bin/next'),
    'start',
    '--hostname',
    '127.0.0.2',
    '--port',
    String(port),
  ];
  if(['redis','mariadb'].includes(kind))args.splice(args.indexOf('--'),0,'--ro-bind',path.join(fixture,'dpkg-status'),'/var/lib/dpkg/status');
  if(kind==='mariadb')args.splice(args.indexOf('--'),0,'--ro-bind',path.join(fixture,'mysql'),'/etc/mysql');
  child = spawn('/usr/bin/bwrap', args, { cwd: build, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  closed = once(child, 'close');assert(child.stdout&&child.stderr);
  child.stdout.on('data', (data) => (logs += data));
  child.stderr.on('data', (data) => (logs += data));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error('Fixture server exited: ' + logs.slice(-2000));
    try {
      if ((await fetch(base + '/login')).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready);
  await writeFile(path.join(fixture, 'gui-login.json'), JSON.stringify({ username, password }), { mode: 0o600 });
  console.log(JSON.stringify({ status: 'GUI_READY', fixture, url: base + '/ide/packages/' + kind }));
  const deadline = Date.now() + 300000;
  for (;;) {
    assert(child.exitCode === null, 'Fixture server exited');
    assert(Date.now() < deadline, 'GUI timeout');
    try {
      gui = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'gui-result.json'), 'utf8')));
      break;
    } catch (error) {
      if (!hasErrorCode(error,'ENOENT')) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(gui.status, 'PASS');
  if (scenario==='mariadb-operational') {
    for(const key of ['koreanSearch','tlsHelp','binlogUnits','deprecatedExcluded','aliasesHelp','codePreserved','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario.endsWith('-addition')) {
    for(const key of ['formRestored','codeUnchangedBeforeAdd','addedCode','formCleared','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-hba-move') {
    for(const key of ['movePreservesPending','codeOrderUpdated','applyOnlyOne','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-hba-pending') {
    for(const key of ['existingInputPreserved','newInputPreserved','fileSwitchProtected','codeUnchangedBeforeApply','newRuleAdded','onlyAppliedInputCleared','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-editor-smoke') {
    for(const key of ['koreanCodeEdited','guiUpdated','otherFileUnchanged','draftPreserved','codeFillsPanel','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-code-reorder') {
    for(const key of ['pendingMoved','orderUpdated','pendingClearedAfterCorrection','codePreserved','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'redis-public-help') {
    for(const key of ['koreanSearch','unitsDistinct','deprecatedNotice','catalogAllKorean','multipleArgumentsEdited','codePreserved','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'redis-replication') {
    for(const key of ['koreanSearch','legacyHelp','passwordMasked','multipleArgumentsEdited','codePreserved','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'redis-secrets') {
    for(const key of ['existingMasked','newValueMasked','normalValueVisible','editCodeSync','clearKeepsRow','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'redis-completion') {
    for(const key of ['catalogBound','newSettingAdded','commentOptionEditable','proseAbsent','codePreserved','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'mariadb-completion') {
    for(const key of ['catalogBound','clientSuggestionsAbsent','serverSuggestionsRestored','newSettingAdded','codePreserved','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'mariadb-korean') {
    for(const key of ['koreanSearch','clientHelpAbsent','passwordMasked','duplicateEdited','clearKeepsRow','codeSync','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'redis-korean') {
    for(const key of ['koreanSearch','passwordMasked','duplicateEdited','clearKeepsRow','codeSync','tabsFixed','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'certbot-scroll') {
    for(const key of ['tabsFixed','treeFixed','onlyPanelScrolled','methodsDynamic','previewInvalidated','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-scroll') {
    for(const key of ['tabsFixed','treeFixed','onlyPanelScrolled','codeFillsPanel','outerScrollAbsent','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-completion-layout') {
    for(const key of ['catalogBound','helpBelowInputs','helpFullWidth','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'postgresql-completion') {
    for(const key of ['catalogBound','koreanHelp','newSettingAdded','extensionAdded','codePreserved','loggedOut']) assert.equal(gui[key],true,key);
  } else if (scenario === 'ukrainian-login') {
    assert.equal(gui.translatedLoginVisible, true);
    assert.equal(gui.translationPersisted, true);
    assert.equal(gui.partialCoverageReported, true);
  } else if (scenario === 'postgresql-file-pending') {
    assert.equal(gui.pendingInputsRestored, true);
    assert.equal(gui.correctingOneKeepsOther, true);
    assert.equal(gui.replacementConfirmationShown, true);
    assert.equal(gui.codeUnchanged, true);
  } else if (scenario === 'postgresql-groups') {
    assert.equal(gui.groupDescriptionsVisible, true);
    assert.equal(gui.duplicateBackupAbsent, true);
    assert.equal(gui.duplicateModeNoticeAbsent, true);
    assert.equal(gui.headerBackupPreserved, true);
  } else if (scenario === 'postgresql-source-import') {
    assert.equal(gui.duplicateImportAbsent, true);
    assert.equal(gui.selectedValuesVisible, true);
    assert.equal(gui.guiEditsUpdateCode, true);
  } else if (scenario === 'postgresql-pending') {
    assert.equal(gui.pendingInputsPreserved, true);
    assert.equal(gui.correctingOneKeepsOther, true);
    assert.equal(gui.replacementConfirmationShown, true);
  } else if (scenario === 'postgresql-unload') {
    assert.equal(gui.unloadDialogShown, true);
    assert.equal(gui.cancelKeepsDraft, true);
  } else if (kind === 'postgresql') {
    assert.equal(gui.selectionRestored, true);
    assert.equal(gui.scrollRestored, true);
    assert.equal(gui.filePositionsSeparate, true);
  } else {
    assert.equal(gui.methodsDynamic, true);
    assert.equal(gui.previewInvalidated, true);
    assert.equal(gui.codePositionRestored, true);
  }
  for (const cluster of ['main', 'other'])
    assert.equal(
      await readFile(path.join(fixture, 'postgresql/18', cluster, 'postgresql.conf'), 'utf8'),
      source,
      'Operating fixture changed',
    );
  assert.equal(await readFile(path.join(fixture,'redis/redis.conf'),'utf8'),redisSource+(scenario==='redis-secrets'?secretSource:scenario==='redis-replication'?replicationSource:scenario==='redis-public-help'?publicHelpSource:''),'Redis original fixture changed');
  assert.equal(await readFile(path.join(fixture,'mysql/my.cnf'),'utf8'),mariaSource,'MariaDB original fixture changed');
  if(['postgresql-hba-pending','postgresql-hba-move'].includes(scenario))for(const cluster of ['main','other'])assert.equal(await readFile(path.join(fixture,'postgresql/18',cluster,'pg_hba.conf'),'utf8'),'local all all peer\n','HBA original fixture changed');
  status = 'PASS';
} catch (error) {
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  if (child?.exitCode === null) {
    const owned=child;assert(typeof owned.pid==='number');const pid=owned.pid;const ownedClosed=closed;assert(ownedClosed);
    let timer:NodeJS.Timeout|undefined;
    const stopped = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {}
        resolve();
      }, 10000);
      ownedClosed.finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {}
    await stopped;
  }
  const evidence = path.join(
    verificationWorkRoot,
    'package-editor-gui-' + new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      {
        status,
        kind,
        scenario,
        build,
        sourceFiles,
        gui,
        sourceSnapshot: path.join(build, 'source-snapshot.json'),
        hostSettingsChanged: false,
        configurationMountedReadOnly: true,
        liveAiRequest: false,
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(path.join(evidence, 'server.log'), logs);
  await rm(fixture, { recursive: true, force: true });
  console.log(JSON.stringify({ status, evidence: path.join(evidence, 'result.json') }));
}
