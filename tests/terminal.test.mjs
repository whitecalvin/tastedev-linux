import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { runCommand, terminalInput, terminalJob, terminalContext, stopCommand } from '../lib/workspace.ts';
async function finish(id) {
  for (let count = 0; count < 100; count++) {
    const job = terminalJob(id);
    if (job.status !== 'running') return job;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('terminal fixture timeout');
}
test('terminal uses the execution account home and identity despite stale launcher environment', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-terminal-account-'));
  const saved = Object.fromEntries(
    ['LINUX_WORKSPACE_ROOT', 'LINUX_ENABLE_TERMINAL', 'HOME', 'USER', 'LOGNAME'].map((key) => [key, process.env[key]]),
  );
  process.env.LINUX_WORKSPACE_ROOT = root;
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  process.env.HOME = '/nonexistent/synthetic-other-home';
  process.env.USER = 'synthetic-other-account';
  process.env.LOGNAME = 'synthetic-other-login';
  let job;
  try {
    for (const pty of [false, true]) {
      job = await runCommand('printf "%s\\n%s\\n%s\\n" "$HOME" "$USER" "$LOGNAME"', pty);
      const result = await finish(job.id),
        account = userInfo();
      assert.equal(result.exitCode, 0);
      assert.equal(result.username, account.username);
      assert.equal(result.cwd, root);
      assert.equal(
        result.logs
          .map((item) => item.text)
          .join('')
          .replaceAll('\r\n', '\n'),
        [account.homedir, account.username, account.username, ''].join('\n'),
      );
    }
    assert.equal(terminalContext().shell, userInfo().shell || '/bin/bash');
    assert.equal(process.env.HOME, '/nonexistent/synthetic-other-home');
  } finally {
    if (job && terminalJob(job.id).status === 'running') {
      stopCommand(job.id);
      await finish(job.id);
    }
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
});
test('terminal captures output and exit status, removes secrets, and stops process groups', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-terminal-'));
  const saved = {};
  for (const key of ['LINUX_WORKSPACE_ROOT', 'LINUX_ENABLE_TERMINAL', 'OPENAI_API_KEY']) saved[key] = process.env[key];
  process.env.LINUX_WORKSPACE_ROOT = root;
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  process.env.OPENAI_API_KEY = 'synthetic-secret-fixture';
  try {
    const job = await runCommand(
      'printf "fixture-stdout\\n"; printf "fixture-stderr\\n" >&2; test -z "$OPENAI_API_KEY"',
    );
    const completed = await finish(job.id);
    assert.equal(completed.exitCode, 0);
    assert.equal(completed.status, 'success');
    assert(
      completed.logs.every(
        (entry, index) =>
          Number.isInteger(entry.sequence) && (index === 0 || entry.sequence > completed.logs[index - 1].sequence),
      ),
    );
    assert(completed.logs.some((entry) => entry.kind === 'stdout' && entry.text.includes('fixture-stdout')));
    assert(completed.logs.some((entry) => entry.kind === 'stderr' && entry.text.includes('fixture-stderr')));
    const unicode = await runCommand(
      String.raw`printf '\352'; sleep 0.04; printf '\260\200'; printf '\360\237' >&2; sleep 0.04; printf '\230\200' >&2`,
    );
    const decoded = await finish(unicode.id);
    assert.equal(
      decoded.logs
        .filter((entry) => entry.kind === 'stdout')
        .map((entry) => entry.text)
        .join(''),
      '가',
    );
    assert.equal(
      decoded.logs
        .filter((entry) => entry.kind === 'stderr')
        .map((entry) => entry.text)
        .join(''),
      '😀',
    );
    const input = await runCommand('read -r line; printf "%s" "$line"');
    await terminalInput(input.id, 'fixture-input\n');
    const inputResult = await finish(input.id);
    assert.equal(inputResult.logs.map((entry) => entry.text).join(''), 'fixture-input');
    await assert.rejects(terminalInput(input.id, 'late'), (error) => error.status === 409);
    const eof = await runCommand('cat');
    await terminalInput(eof.id, 'fixture-eof', true);
    assert.equal((await finish(eof.id)).logs.map((entry) => entry.text).join(''), 'fixture-eof');
    const running = await runCommand('sleep 30');
    await assert.rejects(runCommand('pwd'), (error) => error.status === 409);
    stopCommand(running.id);
    assert.equal((await finish(running.id)).status, 'failed');
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
});
test('tab sessions run independently under the default OS account and reserve at most four concurrent launches', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-terminal-tabs-')),
    savedRoot = process.env.LINUX_WORKSPACE_ROOT,
    savedEnabled = process.env.LINUX_ENABLE_TERMINAL,
    ids = [];
  process.env.LINUX_WORKSPACE_ROOT = root;
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  try {
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () => runCommand('read -r line; printf "%s" "$line"', false, 120, 'tab')),
    );
    const accepted = attempts.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    ids.push(...accepted.map((item) => item.id));
    assert.equal(accepted.length, 4);
    assert.equal(terminalContext().sessions.filter((item) => ids.includes(item.id)).length, 4);
    const copy = terminalContext();
    copy.sessions[0].status = 'mutated';
    assert.notEqual(terminalContext().sessions[0].status, 'mutated');
    assert.equal(attempts.filter((item) => item.status === 'rejected')[0].reason.status, 409);
    for (const [index, job] of accepted.entries()) {
      assert.equal(job.cwd, root);
      assert.equal(job.username, (await import('node:os')).userInfo().username);
      await terminalInput(job.id, 'tab-' + index + '\n');
    }
    for (const [index, job] of accepted.entries())
      assert.equal((await finish(job.id)).logs.map((item) => item.text).join(''), 'tab-' + index);
    await assert.rejects(runCommand('pwd', false, 120, 'invalid'), (error) => error.status === 400);
  } finally {
    for (const id of ids) {
      if (terminalJob(id).status === 'running') {
        stopCommand(id);
        await finish(id);
      }
    }
    if (savedRoot === undefined) delete process.env.LINUX_WORKSPACE_ROOT;
    else process.env.LINUX_WORKSPACE_ROOT = savedRoot;
    if (savedEnabled === undefined) delete process.env.LINUX_ENABLE_TERMINAL;
    else process.env.LINUX_ENABLE_TERMINAL = savedEnabled;
    await rm(root, { recursive: true, force: true });
  }
});

test('large Unicode stdout and stderr retain every character across bounded output records', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-terminal-output-')),
    savedRoot = process.env.LINUX_WORKSPACE_ROOT,
    savedEnabled = process.env.LINUX_ENABLE_TERMINAL;
  let job;
  process.env.LINUX_WORKSPACE_ROOT = root;
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'",
    expected = 'a'.repeat(7999) + '😀한글'.repeat(12000) + 'TAIL_MARKER';
  try {
    const { writeFile } = await import('node:fs/promises');
    const file = join(root, 'output.mjs');
    await writeFile(
      file,
      'process.stdout.write(' +
        JSON.stringify(expected) +
        ');process.stderr.write(' +
        JSON.stringify('STDERR:' + expected) +
        ');',
    );
    job = await runCommand(quote(process.execPath) + ' ' + quote(file));
    const completed = await finish(job.id);
    assert.equal(completed.exitCode, 0);
    assert.equal(
      completed.logs
        .filter((entry) => entry.kind === 'stdout')
        .map((entry) => entry.text)
        .join(''),
      expected,
    );
    assert.equal(
      completed.logs
        .filter((entry) => entry.kind === 'stderr')
        .map((entry) => entry.text)
        .join(''),
      'STDERR:' + expected,
    );
    assert(
      completed.logs.every(
        (entry) =>
          entry.text.length <= 8000 && !/[\uD800-\uDBFF]$/.test(entry.text) && !/^[\uDC00-\uDFFF]/.test(entry.text),
      ),
      'record boundaries must not split emoji',
    );
    assert.equal(completed.logSequence, completed.logs.length);
    assert.deepEqual(
      completed.logs.map((entry) => entry.sequence),
      completed.logs.map((_, index) => index + 1),
    );
  } finally {
    if (job && terminalJob(job.id).status === 'running') {
      stopCommand(job.id);
      await finish(job.id);
    }
    if (savedRoot === undefined) delete process.env.LINUX_WORKSPACE_ROOT;
    else process.env.LINUX_WORKSPACE_ROOT = savedRoot;
    if (savedEnabled === undefined) delete process.env.LINUX_ENABLE_TERMINAL;
    else process.env.LINUX_ENABLE_TERMINAL = savedEnabled;
    await rm(root, { recursive: true, force: true });
  }
});
