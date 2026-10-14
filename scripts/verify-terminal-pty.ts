import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import type {TerminalPublicJob} from '../lib/workspace.ts';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { terminalInputQueue } from '../lib/terminal-input-queue.ts';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { runCommand, terminalInput, terminalResize, terminalJob, stopCommand } from '../lib/workspace.ts';
const root = await verificationWorkDirectory('tastedev-pty-'),
  ids:string[] = [];
const saved = Object.fromEntries(
  ['LINUX_STATE_ROOT','LINUX_WORKSPACE_ROOT', 'LINUX_ENABLE_TERMINAL', 'OPENAI_API_KEY'].map((key) => [key, process.env[key]]),
);
process.env.LINUX_STATE_ROOT = root;
process.env.LINUX_WORKSPACE_ROOT = root;
process.env.LINUX_ENABLE_TERMINAL = 'true';
process.env.OPENAI_API_KEY = 'synthetic-pty-secret';
const pause = () => new Promise((resolve) => setTimeout(resolve, 20));
async function finish(id:string) {
  for (let count = 0; count < 200; count++) {
    const job = terminalJob(id);
    if (job.status !== 'running') return job;
    await pause();
  }
  throw Error('PTY fixture completion timed out');
}
async function start(command:string, timeout = 120) {
  const job = await runCommand(command, true, timeout);
  ids.push(job.id);
  return job;
}
try {
  const tty = await start('test -t 0 && test -t 1 && test -z "$OPENAI_API_KEY" && printf PTY_READY');
  const ready = await finish(tty.id);
  assert.equal(ready.exitCode, 0);
  assert.equal(ready.pty, true);
  assert(
    ready.logs
      .map((item) => item.text)
      .join('')
      .includes('PTY_READY'),
  );
  const input = await start('read -r line; printf "INPUT_BYTES:%s" "${#line}"');
  await terminalInput(input.id, 'synthetic-private-input\n');
  const received = await finish(input.id),
    output = received.logs.map((item) => item.text).join('');
  assert.equal(received.exitCode, 0);
  assert(output.includes('INPUT_BYTES:23'));
  assert(!output.includes('synthetic-private-input'));
  const unicode = await start('LC_ALL=C; read -r line; printf "%s" "$line" | sha256sum');
  const pasted = 'a'.repeat(1023) + '😀한글' + 'b'.repeat(2000);
  let inputErrors = 0;
  const queue = terminalInputQueue(
    (text) => terminalInput(unicode.id, text),
    () => inputErrors++,
  );
  queue.push(pasted + '\n');
  const decoded = await finish(unicode.id);
  queue.dispose();
  assert.equal(inputErrors, 0);
  assert.equal(decoded.exitCode, 0);
  assert(
    decoded.logs
      .map((item) => item.text)
      .join('')
      .includes(createHash('sha256').update(pasted).digest('hex')),
  );
  const largeExpected = 'a'.repeat(7999) + '😀한글'.repeat(12000) + 'PTY_TAIL_MARKER',
    largeFile = path.join(root, 'large-output.mjs');
  await writeFile(largeFile, 'process.stdout.write(' + JSON.stringify(largeExpected) + ');', { mode: 0o600 });
  const quote = (value:string) => "'" + value.replaceAll("'", "'\\''") + "'";
  const large = await start(quote(process.execPath) + ' ' + quote(largeFile)),
    largeResult = await finish(large.id);
  assert.equal(largeResult.exitCode, 0);
  assert.equal(largeResult.logs.map((item) => item.text).join(''), largeExpected);
  assert(
    largeResult.logs.every(
      (item) => item.text.length <= 8000 && !/[\uD800-\uDBFF]$/.test(item.text) && !/^[\uDC00-\uDFFF]/.test(item.text),
    ),
  );
  const rawPayload = 'a'.repeat(9000) + '😀한글'.repeat(16000),
    rawBytes = Buffer.byteLength(rawPayload),
    rawFile = path.join(root, 'raw-input.mjs');
  await writeFile(
    rawFile,
    'import {createHash} from "node:crypto";process.stdin.setRawMode(true);let bytes=0;const chunks=[];process.stdin.on("data",chunk=>{chunks.push(chunk);bytes+=chunk.length;if(bytes>=' +
      rawBytes +
      '){process.stdin.pause();process.stdout.write("RAW_SHA:"+createHash("sha256").update(Buffer.concat(chunks)).digest("hex"),()=>{process.stdin.setRawMode(false);process.exit(0);});}});process.stdout.write("RAW_READY");',
    { mode: 0o600 },
  );
  const raw = await start(quote(process.execPath) + ' ' + quote(rawFile));
  for (let count = 0; count < 100 && !terminalJob(raw.id).logs.some((item) => item.text.includes('RAW_READY')); count++)
    await pause();
  assert(terminalJob(raw.id).logs.some((item) => item.text.includes('RAW_READY')));
  let rawErrors = 0;
  const rawQueue = terminalInputQueue(
    (text) => terminalInput(raw.id, text),
    () => rawErrors++,
  );
  rawQueue.push(rawPayload);
  const rawResult = await finish(raw.id);
  rawQueue.dispose();
  assert.equal(rawErrors, 0);
  assert.equal(rawResult.exitCode, 0);
  assert(
    rawResult.logs
      .map((item) => item.text)
      .join('')
      .includes('RAW_SHA:' + createHash('sha256').update(rawPayload).digest('hex')),
  );
  assert(
    !rawResult.logs
      .map((item) => item.text)
      .join('')
      .includes('😀한글'),
  );
  await assert.rejects(terminalInput(raw.id, 'blocked\0value'), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 400);
  const resize = await start('printf SIZE_READY; read -r line; stty size');
  for (
    let count = 0;
    count < 100 && !terminalJob(resize.id).logs.some((item) => item.text.includes('SIZE_READY'));
    count++
  )
    await pause();
  assert.deepEqual(await terminalResize(resize.id, 100, 30), { resized: true, cols: 100, rows: 30 });
  await terminalInput(resize.id, '\n');
  const resized = await finish(resize.id);
  assert(
    resized.logs
      .map((item) => item.text)
      .join('')
      .includes('30 100'),
  );
  await assert.rejects(terminalResize(resize.id, 80, 24), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 409);
  const eof = await start('cat >/dev/null; printf EOF_READY');
  await terminalInput(eof.id, 'fixture-eof\n', true);
  const closed = await finish(eof.id);
  assert.equal(closed.stdinOpen, false);
  assert.equal(closed.exitCode, 0);
  assert(closed.logs.some((item) => item.text.includes('EOF_READY')));
  await assert.rejects(terminalInput(eof.id, 'late'), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 409);
  const interrupt = await start('printf INTERRUPT_READY; sleep 30');
  for (
    let count = 0;
    count < 100 && !terminalJob(interrupt.id).logs.some((item) => item.text.includes('INTERRUPT_READY'));
    count++
  )
    await pause();
  assert(terminalJob(interrupt.id).logs.some((item) => item.text.includes('INTERRUPT_READY')));
  await terminalInput(interrupt.id, '\u0003');
  assert.notEqual((await finish(interrupt.id)).exitCode, 0);
  const running = await start('sleep 30');
  await assert.rejects(runCommand('pwd', true), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 409);
  stopCommand(running.id);
  assert.equal((await finish(running.id)).status, 'failed');
  const tabs:TerminalPublicJob[] = [];
  for (let index = 0; index < 4; index++) {
    const tab = await runCommand(
      'printf TAB_READY; read -r line; printf "TAB_%s:%s\\n" ' + index + ' "$line"',
      true,
      120,
      'tab',
    );
    ids.push(tab.id);
    tabs.push(tab);
  }
  for (
    let count = 0;
    count < 100 && !tabs.every((tab) => terminalJob(tab.id).logs.some((item) => item.text.includes('TAB_READY')));
    count++
  )
    await pause();
  assert(tabs.every((tab) => terminalJob(tab.id).logs.some((item) => item.text.includes('TAB_READY'))));
  await assert.rejects(runCommand('pwd', true, 120, 'tab'), (error:unknown) => error!==null&&typeof error==='object'&&'status' in error&&error.status === 409);
  stopCommand(tabs[0].id);
  assert.equal((await finish(tabs[0].id)).status, 'failed');
  assert(
    tabs.slice(1).every((tab) => terminalJob(tab.id).status === 'running'),
    'closing one tab must retain other shells',
  );
  await Promise.all(tabs.slice(1).map((tab, index) => terminalInput(tab.id, 'input-' + (index + 1) + '\n')));
  for (let index = 1; index < tabs.length; index++) {
    const completed = await finish(tabs[index].id);
    assert.equal(completed.exitCode, 0);
    const text = completed.logs.map((item) => item.text).join('');
    assert(text.includes('TAB_' + index + ':input-' + index));
    for (let other = 1; other < tabs.length; other++)
      if (other !== index) assert(!text.includes('input-' + other), 'tab output must stay isolated');
  }
  const limited = await start('sleep 30', 1);
  assert.equal(limited.timeoutSeconds, 1);
  const expired = await finish(limited.id);
  assert.equal(expired.status, 'failed');
  assert(expired.logs.some((item) => item.text.includes('1초 실행 제한')));
  const record = {
    status: 'PASS',
    checks: [
      'large Unicode paste retains exact UTF-8 bytes through raw PTY without echo; NUL input remains rejected',
      'large PTY output preserves exact Korean/emoji text across bounded records',
      'four concurrent PTY tabs retain independent input and output; closing one preserves the others; fifth tab refused',
      'configured one-second deadline terminates only fixture command',
      'app PTY reports terminal stdin/stdout',
      'secret environment removed',
      'line input received without input echo',
      'single active command enforced',
      'PTY command stop reaches terminal state',
      'Ctrl+C interrupts the foreground command',
      'PTY EOF closes input and rejects late input',
      'PTY rows and columns update and closed resize is refused',
      'queued multi-chunk Korean/emoji paste preserves exact UTF-8 bytes',
    ],
    remoteConnection: false,
    serviceChanged: false,
    fixtureOnly: true,
  };
  const folder = path.join(verificationWorkRoot,'evidence');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const evidence = path.join(folder, 'terminal-pty-' + new Date().toISOString().replaceAll(':', '-') + '.json');
  await writeFile(evidence, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  process.stdout.write(JSON.stringify({ ...record, evidence }) + '\n');
} finally {
  for (const id of ids) if (terminalJob(id).status === 'running') stopCommand(id);
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(root, { recursive: true, force: true });
}
