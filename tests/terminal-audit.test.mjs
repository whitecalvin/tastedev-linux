import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { transform, loadBindings } from 'next/dist/build/swc/index.js';
import { terminalLaunch, terminalTimeout } from '../lib/terminal-launch.ts';
async function fixture(auditFails = false) {
  await loadBindings();
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'terminal-audit-')),
    events = [],
    timers = [],
    kills = [],
    native = createRequire(import.meta.url),
    module = { exports: {} },
    child = new EventEmitter();
  child.pid = 4321;
  for (const stream of ['stdin', 'stdout', 'stderr']) child[stream] = new EventEmitter();
  const compiled = await transform(await readFile(new URL('../lib/workspace.ts', import.meta.url), 'utf8'), {
    filename: 'workspace.ts',
    jsc: { parser: { syntax: 'typescript' } },
    module: { type: 'commonjs' },
  });
  const require = (name) =>
    name === 'node:child_process'
      ? { spawn: () => child }
      : name === 'node:os'
        ? { userInfo: () => ({ username: 'fixture', homedir: root, shell: '/bin/bash' }) }
        : name.startsWith('node:')
          ? native(name)
          : name === './terminal-launch.ts'
            ? { terminalLaunch, terminalTimeout }
            : name === './runtime-paths.ts'
              ? { stateRoot: () => root }
              : name === './security.ts'
                ? {
                    auditEvent: async (...args) => {
                      events.push(args);
                      if (auditFails) throw Error('audit unavailable');
                    },
                  }
                : {};
  new Function('require', 'module', 'exports', 'process', 'globalThis', 'setTimeout', 'clearTimeout', compiled.code)(
    require,
    module,
    module.exports,
    { env: { LINUX_ENABLE_TERMINAL: 'true' }, getuid: () => 1000, kill: (...args) => kills.push(args) },
    {},
    (callback) => {
      timers.push(callback);
      return timers.length;
    },
    () => {},
  );
  return {
    api: module.exports,
    events,
    timers,
    kills,
    child,
    close: async (code, signal) => {
      const callback = child.listeners('close')[0];
      child.removeAllListeners('close');
      await callback(code, signal);
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
test('terminal audits completion failure cancellation and timeout without command or output', async () => {
  for (const mode of ['success', 'exit-failure', 'spawn-error', 'user', 'timeout']) {
    const f = await fixture();
    try {
      const job = await f.api.runCommand('printf private-command');
      assert.deepEqual(f.events, []);
      f.child.stdout.emit('data', Buffer.from('private output'));
      if (mode === 'spawn-error') f.child.emit('error', Error('private error'));
      if (mode === 'user') f.api.stopCommand(job.id);
      if (mode === 'timeout') {
        f.timers[0]();
        f.api.stopCommand(job.id);
      }
      await f.close(mode === 'exit-failure' ? 1 : 0, mode === 'user' || mode === 'timeout' ? 'SIGKILL' : null);
      assert.deepEqual(f.events, [
        ['terminal', mode === 'success' ? 'completed' : mode === 'user' ? 'cancelled' : 'failed'],
      ]);
      const saved = f.api.terminalJob(job.id);
      assert.equal(saved.status, mode === 'success' ? 'success' : 'failed');
      assert(saved.finishedAt);
      assert.equal(saved.stdinOpen, false);
      if (mode === 'user' || mode === 'timeout') {
        assert.equal(saved.terminationReason, mode);
        assert(f.kills.length);
      }
      f.child.emit('close', 0);
      assert.equal(f.events.length, 1);
    } finally {
      await f.cleanup();
    }
  }
});
test('terminal notifies subscribers of closed shell even if audit persistence fails', async () => {
  const f = await fixture(true);
  try {
    const job = await f.api.runCommand('true');
    let notified = 0;
    const unsubscribe = f.api.subscribeTerminalJob(job.id, () => notified++);
    await f.close(0);
    assert.equal(notified, 1);
    assert.equal(f.api.terminalJob(job.id).auditError, true);
    assert.equal(f.api.terminalJob(job.id).status, 'success');
    unsubscribe();
  } finally {
    await f.cleanup();
  }
});
