import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink, link, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  readCompletedAdminJob,
  completedAdminJob,
  completedAdminJobs,
  saveCompletedAdminJob,
  prepareAdminJobDirectory,
} from '../lib/admin-job-record.ts';
const id = 'aacdab81-2019-4b5a-9c8c-419a8bc80562';
const record = {
  id,
  status: 'success',
  command: ['/usr/bin/certbot', 'renew'],
  logs: ['fixture output 한글'],
  startedAt: '2026-10-06T00:00:00Z',
  finishedAt: '2026-10-06T00:00:01Z',
  exitCode: 0,
  signal: null,
};
test('completed record publication is exclusive and preserves existing records', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'admin-publish-')),
    folder = join(root, 'jobs');
  try {
    const outcomes = await Promise.allSettled([
      saveCompletedAdminJob(folder, record),
      saveCompletedAdminJob(folder, { ...record, logs: ['alternative'] }),
    ]);
    assert.equal(outcomes.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find((item) => item.status === 'rejected').reason.status, 409);
    const saved = await readCompletedAdminJob(folder, id);
    await assert.rejects(saveCompletedAdminJob(folder, record), (error) => error.status === 409);
    assert.deepEqual(await readCompletedAdminJob(folder, id), saved);
    const unsafe = join(root, 'unsafe');
    await mkdir(unsafe, { mode: 0o777 });
    await chmod(unsafe, 0o777);
    await assert.rejects(prepareAdminJobDirectory(unsafe), (error) => error.status === 403);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('completed certificate record remains readable by a fresh server process and drops unknown fields', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'admin-job-')),
    folder = join(root, 'certificate-jobs');
  try {
    await mkdir(folder, { mode: 0o700 });
    await writeFile(join(folder, id + '.log.json'), JSON.stringify({ ...record, privateField: 'omit' }), {
      mode: 0o600,
    });
    assert.deepEqual(await readCompletedAdminJob(folder, id), record);
    const script =
      "import {operationJob} from './lib/server-tools.ts';process.stdout.write(JSON.stringify(await operationJob(process.argv[1])));";
    const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', script, id], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, LINUX_STATE_ROOT: root, LINUX_AUTH_ROOT: root },
      timeout: 10000,
    });
    assert.deepEqual(JSON.parse(stdout), record);
    const legacy = { ...record };
    delete legacy.finishedAt;
    delete legacy.signal;
    assert.deepEqual(completedAdminJob(legacy, id), legacy);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('completed job catalog hides commands and logs and skips damaged records', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'admin-history-'));
  try {
    await writeFile(join(root, id + '.log.json'), JSON.stringify(record), { mode: 0o600 });
    const corrupt = 'bbcdab81-2019-4b5a-9c8c-419a8bc80562';
    await writeFile(join(root, corrupt + '.log.json'), 'bad', { mode: 0o600 });
    const result = await completedAdminJobs(root);
    assert.deepEqual(result.jobs, [
      { id, status: 'success', startedAt: record.startedAt, finishedAt: record.finishedAt },
    ]);
    assert.equal(result.warnings, 1);
    assert(!JSON.stringify(result).includes('fixture output'));
    assert(!JSON.stringify(result).includes('certbot'));
    assert.deepEqual(await completedAdminJobs(join(root, 'missing')), { jobs: [], warnings: 0, truncated: false });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('certificate record rejects malformed terminal state, command, logs and mismatched identity', () => {
  for (const change of [
    { id: 'other' },
    { status: 'running' },
    { status: 'success', exitCode: 1 },
    { command: ['/bin/sh'] },
    { logs: ['x'.repeat(8001)] },
    { logs: Array(501).fill('') },
    { exitCode: 256 },
    { startedAt: 'bad' },
    { finishedAt: 'bad' },
    { signal: 'not a signal' },
  ])
    assert.throws(
      () => completedAdminJob({ ...record, ...change }, id),
      (error) => error.status === 409,
    );
});
test('certificate record reader rejects paths links unsafe permissions corrupt data and missing records', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'admin-job-')),
    folder = join(root, 'certificate-jobs'),
    file = join(folder, id + '.log.json');
  try {
    await mkdir(folder, { mode: 0o700 });
    for (const value of ['../secret', 'bad', null])
      await assert.rejects(readCompletedAdminJob(folder, value), (error) => error.status === 404);
    await assert.rejects(readCompletedAdminJob(folder, id), (error) => error.status === 404);
    await writeFile(file, '{broken', { mode: 0o600 });
    await assert.rejects(readCompletedAdminJob(folder, id), (error) => error.status === 409);
    await writeFile(file, JSON.stringify(record));
    await chmod(file, 0o644);
    await assert.rejects(readCompletedAdminJob(folder, id), (error) => error.status === 403);
    await chmod(file, 0o600);
    await link(file, join(root, 'hardlink'));
    await assert.rejects(readCompletedAdminJob(folder, id), (error) => error.status === 403);
    await rm(join(root, 'hardlink'));
    await symlink(folder, join(root, 'linked'));
    await assert.rejects(readCompletedAdminJob(join(root, 'linked'), id), (error) => error.status === 403);
    await rm(file);
    await writeFile(join(root, 'outside'), JSON.stringify(record), { mode: 0o600 });
    await symlink(join(root, 'outside'), file);
    await assert.rejects(readCompletedAdminJob(folder, id), (error) => error.status === 403);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('maximum validated escaped certificate logs remain readable after atomic publication',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','admin-job-escaped-'));
 try{const logs=Array.from({length:500},()=>"\0".repeat(8000)),snapshot={...record,logs};await saveCompletedAdminJob(root,snapshot);assert.deepEqual(await readCompletedAdminJob(root,id),snapshot);}
 finally{await rm(root,{recursive:true,force:true});}
});
