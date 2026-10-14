import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { nodeServiceCaller } from '../lib/node-app-service-context.ts';
const require = createRequire(import.meta.url);
const source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0];
test('Node helper dispatch binds sudo caller and rejects missing confirmation or mismatched account', async () => {
  const calls = [],
    context = vm.createContext({ require, Buffer, process: { env: { SUDO_UID: '1000' } } });
  vm.runInContext(source, context);
  context.runtime = {
    nodeServiceCaller,
    nodeAppServiceHooks: (input, uid) => ({ caller: uid }),
    installNodeAppService: async (input, hooks) => {
      calls.push({ input, hooks });
      return { installed: true };
    },
  };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  context.input = { confirm: true, uid: 1000 };
  assert.equal((await vm.runInContext("dispatch('node-service-install',input)", context)).installed, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].hooks.caller, 1000);
  context.input = { confirm: false, uid: 1000 };
  await assert.rejects(vm.runInContext("dispatch('node-service-install',input)", context), /confirmation/);
  context.input = { confirm: true, uid: 0 };
  await assert.rejects(vm.runInContext("dispatch('node-service-install',input)", context), /account/);
  context.process.env.SUDO_UID = '0';
  context.input = { confirm: true, uid: 1000 };
  await assert.rejects(vm.runInContext("dispatch('node-service-install',input)", context), /caller/);
  assert.equal(calls.length, 1);
});
test('Node service helper refuses writable checkout before loading its native runtime', async () => {
  const context = vm.createContext({ require, Buffer, process, __dirname: '/tmp/untrusted-checkout' });
  vm.runInContext(source, context);
  await assert.rejects(
    vm.runInContext("dispatch('node-service-install',{confirm:true,uid:1000})", context),
    /packaged/,
  );
});

test('Node control helper allowlists operation and binds caller before trusted hooks', async () => {
  const calls = [],
    context = vm.createContext({ require, Buffer, process: { env: { SUDO_UID: '1000' } } });
  vm.runInContext(source, context);
  context.runtime = {
    nodeServiceCaller,
    nodeAppServiceControlHooks: () => ({}),
    controlNodeAppService: async (input, hooks) => {
      calls.push({ input, hooks });
      return { changed: true };
    },
  };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  context.input = { uid: 1000, confirm: true, operation: 'restart' };
  assert.equal((await vm.runInContext("dispatch('node-service-control',input)", context)).changed, true);
  assert.equal(calls[0].hooks.callerUid, 1000);
  for (const patch of [{ uid: 0 }, { confirm: false }, { operation: 'reload' }, { operation: 'restart;id' }]) {
    context.input = { uid: 1000, confirm: true, operation: 'restart', ...patch };
    await assert.rejects(vm.runInContext("dispatch('node-service-control',input)", context));
  }
  assert.equal(calls.length, 1);
});

test('Node update helper refuses unconfirmed, mismatched and checkout execution before writes', async () => {
  const context = vm.createContext({
    require,
    Buffer,
    process: { env: { SUDO_UID: '1000' } },
    __dirname: '/tmp/untrusted-checkout',
  });
  vm.runInContext(source, context);
  await assert.rejects(
    vm.runInContext("dispatch('node-service-update',{confirm:false,uid:1000})", context),
    /confirmation/,
  );
  await assert.rejects(vm.runInContext("dispatch('node-service-update',{confirm:true,uid:1000})", context), /packaged/);
  context.runtime = { nodeServiceCaller };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  await assert.rejects(vm.runInContext("dispatch('node-service-update',{confirm:true,uid:0})", context), /account/);
});

test('Node backup helper derives caller and fixed backup root before listing', async () => {
  const calls = [],
    context = vm.createContext({ require, Buffer, process: { env: { SUDO_UID: '1000' } } });
  vm.runInContext(source, context);
  context.runtime = {
    nodeServiceCaller,
    nodeServiceBackups: async (input, options) => {
      calls.push({ input, options });
      return { backups: [] };
    },
  };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  context.input = { uid: 1000 };
  await vm.runInContext("dispatch('node-service-backups',input)", context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.callerUid, 1000);
  assert.equal(calls[0].options.root, '/var/lib/linux/admin/node-services');
  context.input = { uid: 0 };
  await assert.rejects(vm.runInContext("dispatch('node-service-backups',input)", context), /account/);
  assert.equal(calls.length, 1);
});

test('Node restore helper uses backup options for context hooks and binds caller', async () => {
  const calls = [],
    options = { restart: 'no', restartSeconds: 5, stopSeconds: null },
    context = vm.createContext({ require, Buffer, process: { env: { SUDO_UID: '1000' } } });
  vm.runInContext(source, context);
  context.runtime = {
    nodeServiceCaller,
    nodeServiceBackupRecord: async () => ({ serviceOptions: options }),
    nodeAppServiceHooks: (input, uid) => ({ reviewed: input.options, callerUid: uid }),
    restoreNodeAppService: async (input, hooks) => {
      calls.push({ input, hooks });
      return { changed: true };
    },
  };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  context.input = { uid: 1000, confirm: true, options: { restart: 'always' } };
  await vm.runInContext("dispatch('node-service-restore',input)", context);
  assert.equal(calls[0].input.options, options);
  assert.equal(calls[0].hooks.reviewed, options);
  assert.equal(calls[0].hooks.callerUid, 1000);
  context.input = { uid: 0, confirm: true };
  await assert.rejects(vm.runInContext("dispatch('node-service-restore',input)", context), /account/);
  context.input = { uid: 1000, confirm: false };
  await assert.rejects(vm.runInContext("dispatch('node-service-restore',input)", context), /confirmation/);
  assert.equal(calls.length, 1);
});
