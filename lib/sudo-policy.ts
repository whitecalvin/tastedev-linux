export type SudoAccount = {username?: unknown;uid?: unknown};
const object=(value: unknown): value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
import { createHash } from 'node:crypto';
import { helperActions } from './helper-actions.ts';
const helper = '/usr/lib/tastedev-linux/scripts/admin/linux-admin';
const fail: ()=>never = () => {
  throw Object.assign(Error('sudo 권한 규칙을 확인하세요.'), { status: 400 });
};
// Generates reviewable text only. It never writes sudoers or executes sudo.
// Account identity is a trusted server/CLI dependency, never a request field.
export function sudoPolicyPlan(input: unknown, { username, uid }: SudoAccount = {}) {
  if (typeof uid!=='number'||!Number.isInteger(uid) || uid <= 0 || typeof username !== 'string' || !/^[a-z_][a-z0-9_-]{0,31}$/i.test(username))
    fail();
  if (
    !object(input) ||
    Object.keys(input).some((key) => !['passwordless', 'actions'].includes(key)) ||
    typeof input.passwordless !== 'boolean' ||
    !Array.isArray(input.actions) ||
    !input.actions.length ||
    input.actions.length > helperActions.length ||
    new Set(input.actions).size !== input.actions.length ||
    !input.actions.every((action: unknown): action is string => typeof action==='string'&&helperActions.includes(action))
  )
    fail();
  const actions = [...input.actions].sort(),
    tag = input.passwordless ? 'NOPASSWD' : 'PASSWD';
  const text =
    '# Tastedev Linux: reviewed helper actions only\n' +
    actions.map((action) => `${username} ALL=(root) ${tag}: ${helper} ${action}\n`).join('');
  return {
    username,
    uid,
    passwordless: input.passwordless,
    actions,
    text,
    version: createHash('sha256').update(text).digest('hex'),
    filename: 'tastedev-linux-helper',
    applied: false,
  };
}

// Accepts only this app's canonical rule file for the specified server account.
// This describes a managed draft; it does not establish effective OS permission.
export function parseSudoPolicy(text: unknown, account: SudoAccount) {
  if (
    typeof text !== 'string' ||
    Buffer.byteLength(text) > 16384 ||
    !text.startsWith('# Tastedev Linux: reviewed helper actions only\n') ||
    !text.endsWith('\n')
  )
    fail();
  const rows = text.split('\n').slice(1, -1),
    actions: string[] = [];
  let passwordless: boolean|undefined;
  for (const row of rows) {
    const match =
      /^([a-z_][a-z0-9_-]{0,31}) ALL=\(root\) (NOPASSWD|PASSWD): \/usr\/lib\/tastedev-linux\/scripts\/admin\/linux-admin ([a-z-]+)$/i.exec(
        row,
      );
    if (!match || match[1] !== account?.username) fail();
    const current = match[2] === 'NOPASSWD';
    if (passwordless !== undefined && passwordless !== current) fail();
    passwordless = current;
    actions.push(match[3]);
  }
  const plan = sudoPolicyPlan({ passwordless, actions }, account);
  if (plan.text !== text) fail();
  return {
    username: plan.username,
    uid: plan.uid,
    passwordless: plan.passwordless,
    actions: plan.actions,
    version: plan.version,
  };
}
