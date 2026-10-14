import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSudoPolicy, sudoPolicyPlan } from '../lib/sudo-policy.ts';
const account = { username: 'fixture-admin', uid: 1000 };
test('sudo policy limits root permission to exact reviewed helper actions', () => {
  const input = { passwordless: true, actions: ['node-service-inspect', 'nginx-apply'] },
    plan = sudoPolicyPlan(input, account);
  assert.equal(plan.applied, false);
  assert.equal(plan.actions.length, 2);
  assert(
    plan.text.includes(
      'fixture-admin ALL=(root) NOPASSWD: /usr/lib/tastedev-linux/scripts/admin/linux-admin nginx-apply\n',
    ),
  );
  assert(!plan.text.includes('*'));
  assert(!plan.text.includes('NOPASSWD: ALL'));
  assert.equal(plan.version, sudoPolicyPlan({ ...input, actions: [...input.actions].reverse() }, account).version);
  const password = sudoPolicyPlan({ ...input, passwordless: false }, account);
  assert(password.text.includes('PASSWD:'));
  assert(!password.text.includes('NOPASSWD:'));
});
test('sudo policy rejects injected accounts, commands, privilege fields and coercion', () => {
  const input = { passwordless: true, actions: ['service'] };
  for (const patch of [
    { actions: [] },
    { actions: ['service', 'service'] },
    { actions: ['service;id'] },
    { actions: ['ALL'] },
    { passwordless: 1 },
    { username: 'root' },
    { helper: '/bin/bash' },
  ])
    assert.throws(() => sudoPolicyPlan({ ...input, ...patch }, account), { status: 400 });
  for (const patch of [{ uid: 0 }, { username: 'root\nALL' }, { username: '%sudo' }, { username: 'admin ALL=(ALL)' }])
    assert.throws(() => sudoPolicyPlan(input, { ...account, ...patch }), { status: 400 });
});

test('every permitted helper action has a browser label without adding new permissions', async () => {
  const { helperActionLabels } = await import('../lib/helper-action-labels.ts'),
    { helperActions } = await import('../lib/privilege.ts');
  assert.deepEqual(Object.keys(helperActionLabels).sort(), helperActions);
});

test('managed sudo rule parser accepts exact account/action policy without source text', () => {
  for (const passwordless of [true, false]) {
    const plan = sudoPolicyPlan({ passwordless, actions: ['nginx-apply', 'service'] }, account),
      parsed = parseSudoPolicy(plan.text, account);
    assert.equal(parsed.version, plan.version);
    assert.equal(parsed.passwordless, passwordless);
    assert.deepEqual(parsed.actions, plan.actions);
    assert(!Object.hasOwn(parsed, 'text'));
  }
});
test('managed sudo parser refuses foreign accounts, broad commands, mixed tags and noncanonical edits', () => {
  const plan = sudoPolicyPlan({ passwordless: true, actions: ['nginx-apply', 'service'] }, account);
  for (const text of [
    plan.text.replace('fixture-admin', 'other-user'),
    plan.text.replace('nginx-apply', 'nginx-apply *'),
    plan.text.replace('/usr/lib/tastedev-linux/scripts/admin/linux-admin nginx-apply', 'ALL'),
    plan.text.replace('NOPASSWD', 'PASSWD'),
    plan.text + '# edited\n',
    plan.text.replace('nginx-apply', 'service'),
    plan.text.replace('ALL=(root)', 'ALL=(ALL)'),
    plan.text.slice(0, -1),
  ])
    assert.throws(() => parseSudoPolicy(text, account), { status: 400 });
});

test('sudo update request requires confirmed version and rejects client account or target fields', async () => {
  const { prepareSudoPolicyUpdate } = await import('../lib/sudo-policy-request.ts'),
    input = { confirm: true, version: 'a'.repeat(64), passwordless: true, actions: ['service'] };
  assert.deepEqual(prepareSudoPolicyUpdate(input, account), input);
  for (const patch of [
    { confirm: false },
    { version: null },
    { version: 'invalid' },
    { username: 'root' },
    { uid: 0 },
    { directory: '/etc' },
    { actions: ['ALL'] },
    { passwordless: 1 },
  ])
    assert.throws(() => prepareSudoPolicyUpdate({ ...input, ...patch }, account), { status: 400 });
});
