import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import { mkdtemp, mkdir, readFile, realpath, writeFile, rm } from 'node:fs/promises';
import { userInfo } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { terminalCliCommands } from '../lib/terminal-cli.ts';
const root = await verificationWorkDirectory('tastedev-cli-pty-');
const original = { ...process.env };
const quote = (value:string) => "'" + value.replace(/'/g, "'\\''") + "'";
let workspace:typeof import('../lib/workspace.ts')|undefined;
type CliRecord={name:string;status:'NOT_INSTALLED'|'PASS'|'FAIL';path?:string;resolved?:string;sha256?:string;exitCode?:number|null;pty?:boolean;username?:string;versionOutput?:string};
const records:CliRecord[]=[];
try {
  process.env.LINUX_STATE_ROOT = root;
  process.env.LINUX_WORKSPACE_ROOT = path.join(root, 'workspace');
  process.env.LINUX_ENABLE_TERMINAL = 'true';
  workspace = await import('../lib/workspace.ts');
  const commands = await terminalCliCommands();
  for (const name of ['codex', 'claude'] as const) {
    const found = commands[name];
    if (!found.available||!found.path) {
      records.push({ name, status: 'NOT_INSTALLED' });
      continue;
    }
    const resolved = await realpath(found.path),
      sha256 = createHash('sha256')
        .update(await readFile(resolved))
        .digest('hex');
    let job = await workspace.runCommand(quote(found.path) + ' --version', true, 30, 'tab');
    const deadline = Date.now() + 35000;
    while (job.status === 'running' && Date.now() < deadline) {
      await delay(100);
      job = workspace.terminalJob(job.id);
    }
    if (job.status === 'running') {
      workspace.stopCommand(job.id);
      throw Error('CLI version check exceeded its deadline');
    }
    records.push({
      name,
      path: found.path,
      resolved,
      sha256,
      status: job.status === 'success' ? 'PASS' : 'FAIL',
      exitCode: job.exitCode,
      pty: job.pty,
      username: job.username,
      versionOutput: job.logs
        .map((item) => item.text)
        .join('')
        .slice(0, 4096),
    });
  }
  const record = {
    status: records.some((item) => item.status === 'FAIL')
      ? 'FAIL'
      : records.some((item) => item.status === 'NOT_INSTALLED')
        ? 'PARTIAL'
        : 'PASS',
    scope: 'Installed CLI --version through isolated PTY only; no login or AI request',
    observedAt: new Date().toISOString(),
    username: userInfo().username,
    records,
    authenticationAttempted: false,
    aiRequestSent: false,
    hostServiceChanged: false,
  };
  const folder = path.join(verificationWorkRoot,'evidence');
  await mkdir(folder, { recursive: true });
  const evidence = path.join(folder, 'terminal-cli-' + record.observedAt.replaceAll(':', '-') + '.json');
  await writeFile(evidence, JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify({ ...record, evidence }));
  if (record.status === 'FAIL') process.exitCode = 1;
} finally {
  const current=workspace;
  if(current)for(const session of current.terminalContext().sessions)if(session.status==='running')current.stopCommand(session.id);
  for (const key of ['LINUX_STATE_ROOT', 'LINUX_WORKSPACE_ROOT', 'LINUX_ENABLE_TERMINAL'])
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  await rm(root, { recursive: true, force: true });
}
