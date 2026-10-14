import type {SudoAccount} from './sudo-policy.ts';
type UpdateOptions={account?:SudoAccount;directory?:string;backupRoot?:string;verifyAccount?:()=>unknown|Promise<unknown>;validateCandidate?:(file:string)=>unknown|Promise<unknown>;validatePolicy?:()=>unknown|Promise<unknown>};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { sudoPolicyPlan, parseSudoPolicy } from './sudo-policy.ts';
import { configTransaction } from './config-transaction.ts';
const hash = (value:string|Buffer) => createHash('sha256').update(value).digest('hex');
const fail: (message:string,status?:number)=>never = (message, status = 409) => {
  throw Object.assign(Error(message), { status });
};
async function snapshot(file:string) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.uid !== process.getuid?.() || stat.nlink !== 1 || stat.mode & 0o022 || stat.size > 16384)
      fail('Unsafe sudo rule file', 403);
    const buffer = Buffer.alloc(16385),
      { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 16384) fail('Oversized sudo rule file', 403);
    const after = await handle.stat();
    if (
      after.size !== stat.size ||
      after.mtimeMs !== stat.mtimeMs ||
      after.mode !== stat.mode ||
      after.uid !== stat.uid ||
      after.nlink !== 1
    )
      fail('Sudo rule file changed during inspection');
    return { version: hash(buffer.subarray(0, bytesRead)), ino: stat.ino, dev: stat.dev };
  } finally {
    await handle.close();
  }
}
// Internal trusted administrator primitive, never exposed directly to HTTP.
// Only updates an existing canonical managed rule. Initial provisioning is separate.
export async function updateSudoPolicy(
  input:unknown,
  {
    account={},
    directory = '/etc/sudoers.d',
    backupRoot = '/var/lib/linux/admin/sudo-policy',
    verifyAccount,
    validateCandidate,
    validatePolicy,
  }:UpdateOptions = {},
) {
  if (
    !object(input) ||
    input.confirm !== true ||
    typeof input.version!=='string'||! /^[a-f0-9]{64}$/.test(input.version) ||
    typeof verifyAccount!=='function'||typeof validateCandidate!=='function'||typeof validatePolicy!=='function' ||
    Object.keys(input).some((key) => !['confirm', 'version', 'passwordless', 'actions'].includes(key))
  )
    fail('Reviewed sudo rules and native validation are required', 400);
  const plan = sudoPolicyPlan({ passwordless: input.passwordless, actions: input.actions }, account),
    file = path.join(directory, plan.filename);
  const result = await configTransaction({
    file,
    backupRoot,
    version: input.version,
    transform: async (text) => {
      parseSudoPolicy(text, account);
      await verifyAccount();
      return plan.text;
    },
    validate: async (temporary) => {
      const before = await snapshot(temporary);
      if (before.version !== plan.version) fail('Sudo candidate differs from reviewed rules');
      await validateCandidate(temporary);
      const after = await snapshot(temporary);
      if (after.version !== before.version || after.ino !== before.ino || after.dev !== before.dev)
        fail('Sudo candidate changed during validation');
    },
    beforeCommit: verifyAccount,
    activate: async () => {
      await validatePolicy();
      await verifyAccount();
      if ((await snapshot(file)).version !== plan.version) fail('Sudo rules changed after replacement');
    },
    recover: validatePolicy,
  });
  return { ...result, passwordless: plan.passwordless, effectiveAuthorizationVerified: false };
}
