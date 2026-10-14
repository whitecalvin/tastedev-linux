import {hasErrorCode} from '../lib/error-code.ts';
import {installProcessIdentity,observeInstallJob} from '../lib/install-job-monitor.ts';
import { prepareAdminJobDirectory, saveCompletedAdminJob, savePendingAdminJob } from '../lib/admin-job-record.ts';
import { readInstallJob, saveInstallJob } from '../lib/install-job-record.ts';
import {installProcessOutput} from '../lib/install-process-output.ts';
import { processLogLines } from '../lib/process-log-lines.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { transform, loadBindings } from 'next/dist/build/swc/index.js';
import {certificateProcessOutput,appendCertificateLogRows} from '../lib/certificate-process-output.ts';
import {adminJobProgressWriter} from '../lib/admin-job-progress.ts';
import { certificateCommand } from '../lib/certificate-command.ts';

async function fixture(kind, { spawnThrows = false, auditThrows = false, intentThrows = false } = {}) {
  await loadBindings();
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'async-audit-')),
    events = [],
    timers = [],
    native = createRequire(import.meta.url);
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = (signal) => {
    child.killed = signal;
  };
  const compiled = await transform(
      await readFile(
        new URL('../lib/' + (kind === 'install' ? 'packages.ts' : 'server-tools.ts'), import.meta.url),
        'utf8',
      ),
      { filename: 'operation.mjs', jsc: { parser: { syntax: 'typescript' } }, module: { type: 'commonjs' } },
    ),
    module = { exports: {} };
  const require = (name) =>
    name==='./error-code.ts'?{hasErrorCode}:name.startsWith('node:')
      ? native(name)
      : name === './certificate-process-output.ts'
        ? {certificateProcessOutput,appendCertificateLogRows}
        : name === './admin-job-progress.ts'
        ? {adminJobProgressWriter}
        : name === './install-job-monitor.ts'
        ? {installProcessIdentity,observeInstallJob}
        : name === './install-process-output.ts'
        ? {installProcessOutput}
        : name === './process-log-lines.ts'
        ? { processLogLines }
        : name === './install-job-record.ts'
          ? { readInstallJob, saveInstallJob }
          : name === './admin-job-record.ts'
            ? { prepareAdminJobDirectory, saveCompletedAdminJob, savePendingAdminJob: async (...args)=>{if(intentThrows)throw Error('intent storage unavailable');return savePendingAdminJob(...args);} }
            : name === './runtime-paths.ts'
              ? { stateRoot: () => root }
              : name === './security.ts'
                ? {
                    auditEvent: async (...args) => {
                      events.push(args);
                      if (auditThrows) throw Error('audit fixture failure');
                    },
                  }
                : name === './privilege.ts'
                  ? {
                      adminConfigured: () => true,
                      helperStatus: () => ({ ready: true }),
                      spawnHelper: () => {
                        child.started=true;
                        if (spawnThrows) throw Error('spawn fixture failure');
                        return child;
                      },
                    }
                  : name === './certificate-command.ts'
                    ? { certificateCommand }
                    : name === './inventory-snapshot.ts'
                      ? { inventorySnapshot: () => () => [] }
                      : {};
  const env = process.env.LINUX_ENABLE_INSTALL,
    authRoot = process.env.LINUX_AUTH_ROOT;
  process.env.LINUX_ENABLE_INSTALL = 'true';
  delete process.env.LINUX_AUTH_ROOT;
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', compiled.code)(
    require,
    module,
    module.exports,
    (callback) => {
      timers.push(callback);
      return timers.length;
    },
    () => {},
  );
  const start = () =>
    kind === 'install'
      ? module.exports.startInstall(['nginx'])
      : module.exports.startCertificate({
          domain: 'app.example.com',
          email: 'test@example.com',
          agree: true,
          confirm: true,
        });
  const lock = join(root, kind === 'install' ? 'install-jobs/install.lock' : 'server-tools/admin.lock');
  const cleanup = async () => {
    if (env === undefined) delete process.env.LINUX_ENABLE_INSTALL;
    else process.env.LINUX_ENABLE_INSTALL = env;
    if (authRoot === undefined) delete process.env.LINUX_AUTH_ROOT;
    else process.env.LINUX_AUTH_ROOT = authRoot;
    await rm(root, { recursive: true, force: true });
  };
  return {
    root,
    events,
    child,
    timers,
    start,
    lock,
    cleanup,
    read: async (id) =>
      JSON.parse(
        await readFile(
          join(root, kind === 'install' ? 'install-jobs/job.json' : 'certificate-jobs/' + id + '.log.json'),
          'utf8',
        ),
      ),
    close: async (code, signal) => {
      const callback = child.listeners('close')[0];
      child.removeAllListeners('close');
      await callback(code, signal);
    },
  };
}

for (const kind of ['install', 'certbot']) {
  test(kind + ' completed storage preserves byte-split Unicode stdout and stderr', async () => {
    const f = await fixture(kind);
    try {
      const job = await f.start();
      for (const byte of Buffer.from('설치 😀 확인\n')) f.child.stdout.emit('data', Buffer.from([byte]));
      for (const byte of Buffer.from('오류 없음')) f.child.stderr.emit('data', Buffer.from([byte]));
      await f.close(0, null);
      const saved = await f.read(job.id);
      const logs=kind==='certbot'?saved.logs.map(row=>{const envelope=JSON.parse(row);assert.deepEqual(Object.keys(envelope),['logs']);return envelope.logs;}):saved.logs;
      assert.deepEqual(logs, [kind === 'certbot' ? '설치 😀 확인\n' : '설치 😀 확인', '오류 없음']);
      if (kind === 'certbot') assert.equal(logs.join(''), '설치 😀 확인\n오류 없음');
    } finally {
      await f.cleanup();
    }
  });
  test(kind + ' completion audits actual child outcome once and stores terminal state', async () => {
    for (const mode of ['success', 'exit-failure', 'spawn-error', 'timeout']) {
      const f = await fixture(kind);
      try {
        const job = await f.start();
        assert.equal(job.status, 'running');
        if(kind==='certbot'){const intent=JSON.parse(await readFile(join(f.root,'certificate-jobs',job.id+'.pending.json'),'utf8'));assert.equal(intent.status,'running');assert.deepEqual(intent.command,job.command);}
        assert.deepEqual(f.events, []);
        f.child.stdout.emit('data', Buffer.from('private operation output'));
        if (mode === 'spawn-error') f.child.emit('error', Error('private spawn error'));
        if (mode === 'timeout') {
          if (kind === 'install')
            f.child.stdout.emit('data', Buffer.from(Array(1100).fill('private operation output').join('\n')));
          f.timers[0]();
          assert.equal(f.child.killed, 'SIGTERM');
        }
        await f.close(mode === 'exit-failure' ? 1 : 0, mode === 'timeout' ? 'SIGTERM' : null);
        assert.deepEqual(f.events, [
          [kind === 'install' ? 'install' : 'certbot-issue', mode === 'success' ? 'completed' : 'failed'],
        ]);
        const saved = await f.read(job.id);
        assert.equal(saved.status, mode === 'success' ? 'success' : 'failed');
        assert(saved.finishedAt);
        assert(saved.logs.some((line) => line.includes('private operation output')));
        await assert.rejects(stat(f.lock), (error) => error.code === 'ENOENT');
        f.child.emit('close', 0);
        assert.equal(f.events.length, 1);
      } finally {
        await f.cleanup();
      }
    }
  });
  test(kind + ' audit persistence failure retains the operation lock for review', async () => {
    const f = await fixture(kind, { auditThrows: true });
    try {
      const job = await f.start();
      await f.close(0);
      assert.equal((await f.read(job.id)).status, 'success');
      assert((await stat(f.lock)).isFile());
      assert.equal(f.events.length, 1);
    } finally {
      await f.cleanup();
    }
  });
  test(kind + ' synchronous spawn failure stores failure and releases the lock', async () => {
    const f = await fixture(kind, { spawnThrows: true });
    try {
      await assert.rejects(f.start(), /spawn fixture failure/);
      await assert.rejects(stat(f.lock), (error) => error.code === 'ENOENT');
      assert.deepEqual(f.events, []);
    } finally {
      await f.cleanup();
    }
  });
}
test('an installation lock from the previous storage location prevents another worker', async () => {
  const f = await fixture('install');
  try {
    await writeFile(join(f.root, 'install.lock'), 'old worker', { mode: 0o600 });
    await assert.rejects(f.start(), (error) => error.status === 409);
    assert.deepEqual(f.events, []);
    await assert.rejects(stat(f.lock), (error) => error.code === 'ENOENT');
  } finally {
    await f.cleanup();
  }
});

test('certificate helper cannot start when the initial durable intent cannot be saved',async()=>{
 const f=await fixture('certbot',{intentThrows:true});
 try{await assert.rejects(f.start(),/intent storage unavailable/);assert.equal(f.child.started,undefined);assert.deepEqual(f.events,[]);await assert.rejects(stat(f.lock),error=>error.code==='ENOENT');}
 finally{await f.cleanup();}
});
