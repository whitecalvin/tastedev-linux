import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCommand, terminalInput, terminalJob, subscribeTerminalJob, stopCommand } from '../lib/workspace.ts';
import { terminalEventResponse } from '../lib/terminal-events.ts';

for (const pty of [false, true])
  test(
    (pty ? 'PTY' : 'pipe') + ' local shell output and completion reach subscribed SSE without a polling tick',
    async () => {
      const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'tastedev-terminal-events-'));
      const saved = Object.fromEntries(
        ['LINUX_WORKSPACE_ROOT', 'LINUX_ENABLE_TERMINAL'].map((key) => [key, process.env[key]]),
      );
      process.env.LINUX_WORKSPACE_ROOT = root;
      process.env.LINUX_ENABLE_TERMINAL = 'true';
      let job, reader, timer;
      try {
        job = await runCommand('read -r line; printf "RESULT:%s" "$line"', pty);
        const response = await terminalEventResponse(
          new Request('http://localhost/api/terminal-events?job=' + job.id),
          {
            readJob: terminalJob,
            subscribe: subscribeTerminalJob,
            authorize: async () => true,
            authInterval: 60000,
            heartbeatInterval: 60000,
          },
        );
        reader = response.body.getReader();
        await reader.read();
        const collect = (async () => {
          let output = '',
            status;
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) return { output, status };
            const data = JSON.parse(new TextDecoder().decode(chunk.value).match(/^data: (.+)$/m)[1]);
            assert(data.job);
            output += (data.job.logs || []).map((item) => item.text).join('');
            status = data.job.status;
          }
        })();
        await terminalInput(job.id, '한글😀-event-fixture\n', true);
        const completed = await Promise.race([
          collect,
          new Promise((_resolve, reject) => {
            timer = setTimeout(() => reject(Error('live shell stream did not wake')), 2000);
          }),
        ]);
        assert.deepEqual(completed, { output: 'RESULT:한글😀-event-fixture', status: 'success' });
      } finally {
        clearTimeout(timer);
        await reader?.cancel();
        if (job && terminalJob(job.id).status === 'running') stopCommand(job.id);
        for (const [key, value] of Object.entries(saved)) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
        await rm(root, { recursive: true, force: true });
      }
    },
  );
