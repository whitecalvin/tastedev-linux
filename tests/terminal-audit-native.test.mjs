import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand, terminalJob, stopCommand } from '../lib/workspace.ts';
test('real local shell writes bounded audit outcomes without its command or output', async () => {
  assert(process.env.LINUX_STATE_ROOT, 'Run native audit verification with a temporary LINUX_STATE_ROOT');
  const file = join(process.env.LINUX_STATE_ROOT, 'audit.jsonl'),
    events = async () => {
      try {
        return (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
      } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
      }
    };
  const before = (await events()).length,
    previous = process.env.LINUX_ENABLE_TERMINAL,
    jobs = [];
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  try {
    for (const [command, result, stop] of [
      ["printf 'private-terminal-fixture 한글😀'", 'completed', false],
      ['exit 7', 'failed', false],
      ['read -r line', 'cancelled', true],
    ]) {
      const job = await runCommand(command, false, 120, 'tab');
      jobs.push(job);
      if (stop) stopCommand(job.id);
      const limit = Date.now() + 2000;
      let rows;
      do {
        rows = (await events()).slice(before);
        if (rows.length >= jobs.length) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      } while (Date.now() < limit);
      assert.equal(rows.length, jobs.length);
      assert.equal(rows.at(-1).result, result);
      assert.equal(rows.at(-1).action, 'terminal');
      assert.deepEqual(Object.keys(rows.at(-1)).sort(), ['action', 'at', 'result']);
      assert(!JSON.stringify(rows).includes('private-terminal-fixture'));
      assert.equal(terminalJob(job.id).stdinOpen, false);
    }
  } finally {
    for (const job of jobs) if (terminalJob(job.id).status === 'running') stopCommand(job.id);
    if (previous === undefined) delete process.env.LINUX_ENABLE_TERMINAL;
    else process.env.LINUX_ENABLE_TERMINAL = previous;
  }
});
