import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { nodeServiceCaller } from '../lib/node-app-service-context.ts';
const require = createRequire(import.meta.url),
  source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
test('sudo update dispatch refuses unconfirmed and checkout use before filesystem changes', async () => {
  const context = vm.createContext({
    require,
    Buffer,
    process: { env: { SUDO_UID: '1000', SUDO_USER: 'fixture-admin' } },
    __dirname: '/tmp/untrusted-checkout',
  });
  vm.runInContext(source, context);
  await assert.rejects(vm.runInContext("dispatch('sudo-policy-update',{confirm:false})", context), /confirmation/);
  await assert.rejects(vm.runInContext("dispatch('sudo-policy-update',{confirm:true})", context), /packaged/);
});
test('sudo update dispatch binds native account and stops on failed identity before backup creation', async () => {
  const calls = [],
    context = vm.createContext({ require, Buffer, process: { env: { SUDO_UID: '1000', SUDO_USER: 'fixture-admin' } } });
  vm.runInContext(source, context);
  context.runtime = {
    nodeServiceCaller,
    sudoPolicyHooks: (account) => {
      calls.push(account);
      return {
        verifyAccount: async () => {
          throw Error('fixture identity mismatch');
        },
      };
    },
  };
  vm.runInContext('mariaRuntime=async()=>runtime;', context);
  await assert.rejects(
    vm.runInContext("dispatch('sudo-policy-update',{confirm:true,username:'root'})", context),
    /identity mismatch/,
  );
  assert.equal(calls[0].uid, 1000);
  assert.equal(calls[0].username, 'fixture-admin');
  context.process.env.SUDO_UID = '0';
  await assert.rejects(vm.runInContext("dispatch('sudo-policy-update',{confirm:true})", context), /caller/);
  assert.equal(calls.length, 1);
});
