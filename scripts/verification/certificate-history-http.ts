import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import type {ChildProcess} from 'node:child_process';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord,recordField,listField,successfulJson} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import type {CompletedAdminJob,PendingAdminJob} from '../../lib/admin-job-record.ts';
import type {StoredInstallJob} from '../../lib/install-job-record.ts';
import {saveCompletedAdminJob,savePendingAdminJob} from '../../lib/admin-job-record.ts';
import {saveInstallJob} from '../../lib/install-job-record.ts';
import { mkdtemp, mkdir, writeFile, readFile, rm, chmod } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
const project = process.cwd(),
  build = process.argv[2];
const guiMode=process.argv.includes('--gui'),fixtureHost=guiMode?'127.0.0.2':'127.0.0.1';
if (!build || !path.isAbsolute(build)) throw Error('Pass an absolute compiled source snapshot directory.');
const fixture = await verificationWorkDirectory('tastedev-certificate-history-http-');
let child:ChildProcess|null=null,
  closed:Promise<unknown[]>|undefined,
  logs = '';
const checks:string[] = [];
let guiEvidence:Record<string,unknown>|null=null;
function currentChild():ChildProcess{assert(child);return child;}
async function portNumber() {
  const socket = createServer();
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once('error', reject);
      socket.listen(0, fixtureHost, resolve);
    });
    const address=socket.address();assert(address&&typeof address==='object');return address.port;
  } finally {
    if (socket.listening) await new Promise<void>((resolve) => socket.close(()=>resolve()));
  }
}
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await closed;
  }
  child = null;
}
try {
  await assertCurrentCompiledSource(build,project);
  const port = await portNumber(),
    base = 'http://'+fixtureHost+':' + port;
  process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
  process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
  const { passwordHash } = await import('../../lib/auth-password.ts');
  const { storeCredentials } = await import('../../lib/auth-store.ts');
  const username = 'certificate-history-fixture',
    password = randomBytes(24).toString('base64url');
  storeCredentials(username, await passwordHash(password));
  const installFile = path.join(fixture, 'auth/install-jobs/job.json');
  const installation:StoredInstallJob = {
    id: randomUUID(),
    command: ['/usr/bin/apt-get', 'install', '--yes', '--no-remove', '--no-upgrade', 'nginx'],
    status: 'success',
    logs: ['설치 완료 fixture'],
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T00:00:01Z',
    exitCode: 0,
    signal: null,
  };
  await saveInstallJob(installFile, installation);
  const folder = path.join(fixture, 'auth/certificate-jobs');
  const successful:CompletedAdminJob = {
    id: randomUUID(),
    command: ['/usr/bin/certbot', 'renew', '--dry-run'],
    status: 'success',
    logs: ['fixture completed — 한글'],
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T00:00:01Z',
    exitCode: 0,
    signal: null,
  };
  const failed:CompletedAdminJob = {
    ...successful,
    id: randomUUID(),
    status: 'failed',
    logs: ['fixture failure'],
    finishedAt: '2026-01-02T00:00:01Z',
    exitCode: 1,
  };
  await saveCompletedAdminJob(folder, successful);
  await saveCompletedAdminJob(folder, failed);
  const unfinished:PendingAdminJob={id:randomUUID(),command:['/usr/bin/certbot','renew','--dry-run'],status:'running',logs:[],startedAt:'2026-01-03T00:00:00Z',exitCode:null};
  await savePendingAdminJob(folder,unfinished);
  await savePendingAdminJob(folder,{id:successful.id,command:successful.command,status:'running',logs:[],startedAt:successful.startedAt,exitCode:null});
  const operationLock=path.join(fixture,'state/server-tools/admin.lock');await mkdir(path.dirname(operationLock),{recursive:true,mode:0o700});await writeFile(operationLock,'interrupted fixture lock',{mode:0o600});

  const corrupt = randomUUID();
  await writeFile(path.join(folder, corrupt + '.log.json'), '{broken', { mode: 0o600 });
  const unsafe = randomUUID();
  await writeFile(path.join(folder, unsafe + '.log.json'), JSON.stringify({ ...successful, id: unsafe }), {
    mode: 0o644,
  });
  const request = (url:string, headers:HeadersInit = {}) =>
    fetch(base + url, { redirect: 'manual', headers, signal: AbortSignal.timeout(20000) });
  async function start() {
    const env:NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'production' as const,
      NEXT_TELEMETRY_DISABLED: '1',
      BETTER_AUTH_URL: base,
      LINUX_ENABLE_ADMIN: 'false',
      LINUX_ENABLE_INSTALL: 'false',
      LINUX_ENABLE_TERMINAL: 'false',
      LINUX_ENABLE_CRON: 'false',
      LINUX_ENABLE_AI: 'false',
    };
    delete env.LINUX_LOGIN_USERNAME;
    delete env.LINUX_LOGIN_PASSWORD_HASH;
    delete env.OPENAI_API_KEY;
    child = spawn(
      process.execPath,
      [
        path.join(project, 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        fixtureHost,
        '--port',
        String(port),
      ],
      { cwd: build, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    closed = once(child, 'close');
    assert(child.stdout&&child.stderr);child.stdout.on('data', (data) => {
      logs += data;
    });
    child.stderr.on('data', (data) => {
      logs += data;
    });
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw Error('Server exited before readiness');
      try {
        if ((await request('/login')).status === 200) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error('Server readiness timeout');
  }
  await start();
  for (const route of ['/api/status', '/api/admin-jobs', '/api/admin-job?id=' + successful.id,'/api/admin-job?id='+unfinished.id])
    assert.equal((await request(route)).status, 401);
  checks.push('package status and both certificate history endpoints reject unauthenticated requests');
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(login.status, 200);
  const token=login.headers.get('set-cookie');assert(token);const headers={Cookie:token.split(';')[0]};
  async function checkInstallation(expected:unknown) {
    const response = await request('/api/status', headers);
    assert.equal(response.status, 200);
    assert.deepEqual(jsonRecord(await response.json()).job, expected);
  }
  await checkInstallation(installation);
  checks.push('authenticated package status reads safely published installation result and Unicode logs');
  await chmod(installFile, 0o644);
  assert.equal((await request('/api/status', headers)).status, 403);
  await chmod(installFile, 0o600);
  await writeFile(installFile, '{broken');
  assert.equal((await request('/api/status', headers)).status, 409);
  await rm(installFile);
  await checkInstallation(null);
  const legacyFile = path.join(fixture, 'state/job.json');
  await mkdir(path.dirname(legacyFile), { recursive: true, mode: 0o700 });
  await writeFile(legacyFile, JSON.stringify(installation), { mode: 0o600 });
  await checkInstallation(installation);
  await chmod(legacyFile, 0o644);
  await checkInstallation(null);
  const installFailure:StoredInstallJob = { ...installation, status: 'failed', exitCode: 1, logs: ['설치 실패 fixture'] };
  await saveInstallJob(installFile, installFailure);
  await checkInstallation(installFailure);
  checks.push(
    'package status rejects unsafe/corrupt current records, safely handles absent and legacy records, and reads failure state',
  );
  async function checkHistory() {
    const response = await request('/api/admin-jobs', headers);
    assert.equal(response.status, 200);
    const catalog=jsonRecord(await response.json());
    assert.deepEqual(
      listField(catalog,'jobs').map((item) => item.id),
      [unfinished.id, failed.id, successful.id],
    );
    assert.equal(catalog.warnings, 2);
    assert.equal(catalog.truncated, false);
    for (const item of listField(catalog,'jobs'))
      assert.deepEqual(Object.keys(item).sort(), item.id===unfinished.id?['id','startedAt','status']:['finishedAt', 'id', 'startedAt', 'status']);
    assert.equal(listField(catalog,'jobs')[0].status,'recovery-required');
    const pendingDetail=await request('/api/admin-job?id='+unfinished.id,headers);assert.equal(pendingDetail.status,200);const unknown=recordField(jsonRecord(await pendingDetail.json()),'job');
    assert.equal(unknown.status,'recovery-required');assert.equal(unknown.exitCode,null);assert.equal(unknown.finishedAt,undefined);assert.deepEqual(unknown.command,unfinished.command);assert(typeof unknown.notice==='string');assert.match(unknown.notice,/종료 결과/);assert(typeof unknown.notice==='string');assert.match(unknown.notice,/자동 재실행하지 않습니다/);
    assert.equal(await readFile(operationLock,'utf8'),'interrupted fixture lock');assert.equal(JSON.parse(await readFile(path.join(folder,unfinished.id+'.pending.json'),'utf8')).status,'running');
    for (const expected of [successful, failed]) {
      const detail = await request('/api/admin-job?id=' + expected.id, headers);
      assert.equal(detail.status, 200);
      assert.deepEqual(jsonRecord(await detail.json()).job, expected);
    }
  }
  await checkHistory();
  checks.push('authenticated catalog sorts completed work, excludes unsafe/corrupt records, and omits commands/logs');
  checks.push('selected success and failure records return exact command and Unicode logs');
  checks.push('unfinished intent returns recovery-required without an invented exit code, leaves the operation lock intact, and completed records win over pending duplicates');
  for (const [id, status] of [
    [corrupt, 409],
    [unsafe, 403],
    [randomUUID(), 404],
    ['../secret', 404],
  ])
    assert.equal((await request('/api/admin-job?id=' + encodeURIComponent(String(id)), headers)).status, status);
  checks.push('unsafe, corrupt, absent and traversal record requests retain explicit error statuses');
  if(guiMode){
    await writeFile(path.join(fixture,'gui-login.json'),JSON.stringify({username,password}),{mode:0o600});
    console.log(JSON.stringify({status:'GUI_READY',fixture,url:base+'/ide/packages/certbot',unfinishedId:unfinished.id,successfulId:successful.id}));
    const deadline=Date.now()+300000;let gui:Record<string,unknown>|undefined;
    while(!gui){assert(currentChild().exitCode===null,'Fixture server exited');assert(Date.now()<deadline,'GUI timeout');try{gui=jsonRecord(JSON.parse(await readFile(path.join(fixture,'gui-result.json'),'utf8')));}catch(error){if(!hasErrorCode(error,'ENOENT'))throw error;}if(!gui)await new Promise(resolve=>setTimeout(resolve,100));}
    guiEvidence=gui;assert.equal(gui.status,'PASS');for(const key of ['unfinishedVisible','reviewNoticeVisible','completedSelectionVisible','loggedOut','listFitsWidth','iconsVisible'])assert.equal(gui[key],true,key);
    checks.push('actual browser certificate popup selects unfinished review and completed Unicode logs, then logs out');
  }
  await stop();
  await start();
  await checkHistory();
  await checkInstallation(installFailure);
  checks.push('same session reads persisted certificate and installation records after actual server process restart');
  await stop();
  const evidence = path.join(
    verificationWorkRoot,
    'certificate-history-http-' + new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  const result = {
    status: 'PASS',
    build,
    ...(guiEvidence?{gui:guiEvidence}:{}),
    checks,
    certificateCommandsExecuted: false,
    installationCommandsExecuted: false,
    operatingMutationsEnabled: false,
    temporaryServerStopped: true,
  };
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ ...result, evidence: path.join(evidence, 'result.json') }));
} catch (error) {
  console.error(diagnostic(error));
  console.error(JSON.stringify({ completedChecks: checks }));
  process.exitCode = 1;
} finally {
  await stop();
  await writeFile(path.join(verificationWorkRoot,'certificate-history-http-'+new Date().toISOString().replaceAll(':','-')+'.log'),logs,{mode:0o600});
  await rm(fixture, { recursive: true, force: true });
}
