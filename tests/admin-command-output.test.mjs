import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0];
const native = createRequire(import.meta.url);
function context(childProcess) {
  const value = vm.createContext({
    require: (name) => (name === 'node:child_process' && childProcess ? childProcess : native(name)),
    process,
    Buffer,
    __filename: '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
  });
  vm.runInContext(source, value);
  return value;
}
test('admin command logs retain successful stdout and stderr including Unicode', () => {
  const value = context();
  value.binary = process.execPath;
  value.parameters = ['-e', 'process.stdout.write("out 한글\\n");process.stderr.write("err 😀\\n")'];
  assert.equal(vm.runInContext('run(binary,parameters)', value), 'out 한글\nerr 😀\n');
  value.parameters = ['-e', 'process.stderr.write("fixture failure");process.exit(7)'];
  assert.throws(
    () => vm.runInContext('run(binary,parameters)', value),
    (error) => error.status === 7 && error.message.includes('fixture failure'),
  );
  value.parameters = ['-e', 'setInterval(()=>{},1000)'];
  assert.throws(
    () => vm.runInContext('run(binary,parameters,100)', value),
    (error) => error.code === 'ETIMEDOUT',
  );
  value.parameters = ['-e', 'process.stdout.write("x".repeat(3*1024*1024))'];
  assert.throws(
    () => vm.runInContext('run(binary,parameters)', value),
    (error) => error.code === 'ENOBUFS',
  );
});
test('fixed nginx check returns stderr and supervised command retains lock fd only for supervisor', () => {
  const calls = [],
    value = context({
      spawnSync: (binary, args, options) => {
        calls.push({ binary, args, options });
        return { status: 0, stdout: '', stderr: 'nginx fixture syntax is ok\n' };
      },
    });
  assert.equal(vm.runInContext('dispatch("nginx-check",{})', value).logs, 'nginx fixture syntax is ok\n');
  assert.equal(calls[0].binary, '/usr/sbin/nginx');
  assert.deepEqual(Array.from(calls[0].args), ['-t']);
  assert.throws(() => vm.runInContext('dispatch("nginx-check",{command:"unreviewed"})', value), /Invalid nginx check/);
  assert.equal(calls.length, 1);
  vm.runInContext('adminNativeContext=Object.freeze({fd:9,helper:__filename})', value);
  assert.equal(vm.runInContext('run("/usr/sbin/nginx",["-t"],10000)', value), 'nginx fixture syntax is ok\n');
  const call = calls[1];
  assert.equal(call.binary, '/usr/bin/node');
  assert.deepEqual(Array.from(call.args), [
    '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
    '--native-lock-supervisor',
    '10000',
    '/usr/sbin/nginx',
    '-t',
  ]);
  assert.deepEqual(Array.from(call.options.stdio), ['pipe', 'pipe', 'pipe', 9]);
  assert.equal(call.options.maxBuffer, 2 * 1024 * 1024);
  assert.equal(call.options.env.PATH, '/usr/sbin:/usr/bin:/sbin:/bin');
  assert.equal(
    Object.keys(call.options.env).some((key) => /TOKEN|SECRET|PASSWORD|API_KEY/.test(key)),
    false,
  );
});
