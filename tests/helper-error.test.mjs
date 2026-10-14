import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { helperErrorFromStderr, helperErrorCollector } from '../lib/helper-error.ts';
const file = new URL('../scripts/admin/linux-admin', import.meta.url),
  source = readFileSync(file, 'utf8'),
  context = vm.createContext({ require: createRequire(import.meta.url), process, Buffer });
vm.runInContext(source.replace(/^#!.*\n/, '').split('main().catch')[0], context);
const output = (error, action = 'redis-code-plan') => context.helperErrorOutput(error, action);
test('helper error protocol preserves application errors rather than reporting sudo permission failures', () => {
  for (const status of [400, 403, 404, 409, 422, 500, 503]) {
    const stderr = output({ status, message: 'fixture validation failure' });
    const result = helperErrorFromStderr('redis-code-plan', stderr);
    assert.equal(result.status, status);
    assert.equal(result.message, 'fixture validation failure');
    assert(!result.message.includes('NOPASSWD'));
  }
  const stderr = output({ status: 1, message: 'Command failed --password=fixture-private\nprivate native output' });
  const result = helperErrorFromStderr('redis-code-plan', stderr);
  assert.equal(result.status, 500);
  assert.equal(result.message, '관리 작업을 완료하지 못했습니다.');
  assert(!stderr.includes('fixture-private'));
  const control = output({ status: 400, message: 'private detail\nsecond line' });
  assert(!control.includes('private detail'));
});
test('helper transport rejects mismatched actions, malformed/oversized envelopes and extra fields', () => {
  const valid = output({ status: 409, message: 'reload fixture' }),
    record = JSON.parse(valid);
  assert.equal(helperErrorFromStderr('nginx-config-apply', valid), null);
  for (const changed of [
    { protocol: 'other' },
    { status: 200 },
    { message: '' },
    { message: 'x'.repeat(2001) },
    { message: 'x\ny' },
    { password: 'private' },
    { action: 'bash' },
  ])
    assert.equal(helperErrorFromStderr('redis-code-plan', JSON.stringify({ ...record, ...changed })), null);
  for (const invalid of ['not json', '[]', valid + '\nprivate detail', ' '.repeat(4097) + valid])
    assert.equal(helperErrorFromStderr('redis-code-plan', invalid), null);
});
test('helper runtime contains the complete local module dependency graph', async () => {
  const { adminRuntimeFiles } = await import('../scripts/admin/runtime-files.mts');
  const names = vm.runInContext('mariaModules', context),
    registered = new Set(names);
  assert.deepEqual(
    [...names].sort(),
    [...adminRuntimeFiles].sort(),
    'helper allowlist and source install runtime list must match',
  );
  assert.equal(registered.size, names.length);
  for (const name of names) {
    const moduleSource = (await readAdminRuntimeModule(name)).toString('utf8');
    for (const match of moduleSource.matchAll(/(?:from|import)\s*['"]\.\/([^'"]+\.mjs)['"]/g))
      assert(registered.has(match[1]), name + ' imports missing installed runtime dependency ' + match[1]);
  }
});
test('real unprivileged helper rejection produces an error envelope without touching system state', async (t) => {
  if (process.getuid() === 0) {
    t.skip('requires a non-root verification account');
    return;
  }
  const result = await promisify(execFile)(process.execPath, [file.pathname, 'service'], { timeout: 5000 }).catch(
    (error) => error,
  );
  assert.equal(result.code, 1);
  assert.equal(result.stdout, '');
  const error = helperErrorFromStderr('service', result.stderr);
  assert(error);
  assert.equal(error.status, 403);
  assert.equal(error.message, '이 작업은 root 권한으로 실행해야 합니다.');
});
test('fragmented UTF-8 helper errors retain Korean text and oversized stderr is rejected', () => {
  const message = '설정이 변경되었습니다. 다시 확인하세요.',
    bytes = Buffer.from(output({ status: 409, message })),
    collector = helperErrorCollector();
  for (const byte of bytes) collector.write(Buffer.from([byte]));
  const error = helperErrorFromStderr('redis-code-plan', collector.finish());
  assert.equal(error.message, message);
  assert.equal(error.status, 409);
  const oversized = helperErrorCollector();
  oversized.write(Buffer.alloc(4096));
  assert.throws(
    () => oversized.write(Buffer.from('x')),
    (error) => error.status === 502,
  );
  const long = output({ status: 400, message: '가'.repeat(700) });
  assert.equal(helperErrorFromStderr('redis-code-plan', long).message, '관리 작업을 완료하지 못했습니다.');
});
test('actual runHelper transport receives fragmented child errors with the original status', async () => {
  const { spawn } = await import('node:child_process'),
    { createHash } = await import('node:crypto'),
    { default: path } = await import('node:path');
  const { helperActions } = await import('../lib/helper-actions.ts'),
    { helperJsonOutput } = await import('../lib/helper-json-output.ts'),
    { redisSandboxFailureFromStderr } = await import('../lib/redis-validation-error.ts');
  const typedClient = readFileSync(new URL('../lib/privilege.ts', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '')
    .replace(/const exec\s*=\s*promisify\(execFile\);/, '')
    .replace(/^export \{\s*helperActions\s*\};$/gm, '')
    .replace(/export /g, '');
  await loadBindings();const client=(await transform(typedClient,{filename:'privilege.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'es6'}})).code;
  const helper = '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
    manifest = '/usr/lib/tastedev-linux/admin-helper.sha256',
    content = Buffer.from('owned transport fixture'),
    hash = createHash('sha256').update(content).digest('hex');
  const lstat = (name) => ({
    uid: 0,
    mode: 0o755,
    isFile: () => ['/usr/bin/node', helper, manifest].includes(name),
    isDirectory: () => !['/usr/bin/node', helper, manifest].includes(name),
    isSymbolicLink: () => false,
  });
  let bytes, termination, successMode=false, successfulOutput;
  const fixtureSpawn = (binary, args, options) => {
    assert.equal(binary, '/usr/bin/sudo');
    assert.deepEqual(args, ['-n', '--', helper, 'redis-code-plan']);
    assert.equal(options.shell, false);
    return spawn(
      process.execPath,
      [
        '-e',
        successMode ? `process.stdin.resume();process.stdout.write(${JSON.stringify(JSON.stringify(successfulOutput))});` : termination === 'SIGKILL' ? "process.kill(process.pid,'SIGKILL');" : termination === 137 ? 'process.exit(137);' : `process.stdin.resume();const bytes=Buffer.from(${JSON.stringify(bytes.toString('base64'))},'base64');let i=0;function write(){if(i===bytes.length){process.exitCode=1;return;}process.stderr.write(bytes.subarray(i,i+1));i++;setImmediate(write);}write();`,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
  };
  const module = new Function(
    'helperActions',
    'helperJsonOutput',
    'helperErrorFromStderr',
    'helperErrorCollector',
    'redisSandboxFailureFromStderr',
    'lstatSync',
    'readFileSync',
    'path',
    'createHash',
    'process',
    'spawn',
    client + ';return {runHelper};',
  )(
    helperActions,
    helperJsonOutput,
    helperErrorFromStderr,
    helperErrorCollector,
    redisSandboxFailureFromStderr,
    lstat,
    (name) => (name === manifest ? hash : content),
    path,
    createHash,
    { env: { LINUX_PACKAGED: 'true', LINUX_ENABLE_ADMIN: 'true' }, cwd: () => '/unrelated' },
    fixtureSpawn,
  );
  for (const status of [409, 503]) {
    bytes = Buffer.from(output({ status, message: '설정 검수를 다시 확인하세요.' }));
    await assert.rejects(
      module.runHelper('redis-code-plan', {}),
      (error) => error.status === status && error.message === '설정 검수를 다시 확인하세요.',
    );
  }
  bytes = Buffer.from(output({status:409,message:'Redis include graph changed'}));
  await assert.rejects(module.runHelper('redis-code-plan',{}),error=>error.status===409&&error.message==='Redis include 연결이 변경되었습니다. 다시 조회하세요.');
  bytes = Buffer.from('legacy permission fixture');
  await assert.rejects(
    module.runHelper('redis-code-plan', {}),
    (error) => error.status === 403 && error.message.includes('NOPASSWD'),
  );
  for (const mode of ['SIGKILL', 137]) {
    termination = mode;
    await assert.rejects(module.runHelper('redis-code-plan', {}), error => error.status === 503 && error.message.includes('적용 결과를 확인할 수 없습니다.') && !error.message.includes('NOPASSWD'));
  }
  termination=undefined;successMode=true;
  for(const value of [null,[],false,123,'unexpected']){successfulOutput=value;await assert.rejects(module.runHelper('redis-code-plan',{}),error=>error.message==='관리 응답을 읽을 수 없습니다.');}
  successfulOutput={changed:false,logs:'한글 😀'};assert.deepEqual(await module.runHelper('redis-code-plan',{}),successfulOutput);

});
