import { nodeAppEnvRestorePlan, restoreNodeAppEnv } from '../lib/node-app-env-restore.ts';
import { nodeAppEnvBackups, nodeAppEnvBackupRecord } from '../lib/node-app-env-backups.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { nodeApps, saveNodeApp } from '../lib/node-apps.ts';
import { nodeAppEnvSnapshot, updateNodeAppEnv } from '../lib/node-app-env.ts';
test('Registered app environment edits preserve private variables, back up bytes and reject stale versions', async () => {
  const directory = await mkdtemp('/mnt/data/build/tastedev-linux/tastedev-app-env-'),
    state = await mkdtemp('/mnt/data/build/tastedev-linux/tastedev-app-state-'),
    previous = process.env.LINUX_STATE_ROOT;
  process.env.LINUX_STATE_ROOT = state;
  try {
    const original = 'PORT=3145\nAPI_KEY=fixture-private\n';
    await writeFile(directory + '/.env', original, { mode: 0o600 });
    await writeFile(directory + '/server.js', 'throw Error("must not execute");', { mode: 0o600 });
    const registry = await nodeApps();
    await saveNodeApp({
      version: registry.version,
      profile: { id: 'env-edit-app', label: 'Env app', directory, entry: 'server.js', environmentFile: '.env' },
    });
    const snapshot = await nodeAppEnvSnapshot('env-edit-app');
    assert(!JSON.stringify(snapshot).includes('fixture-private'));
    await assert.rejects(updateNodeAppEnv({ ...snapshot, changes: { port: 3200 } }), (e) => e.status === 400);
    const saved = await updateNodeAppEnv({ ...snapshot, changes: { port: 3200 }, confirm: true });
    assert.equal(saved.values.port, 3200);
    assert(saved.backupId);
    assert.equal(await readFile(directory + '/.env', 'utf8'), 'PORT=3200\nAPI_KEY=fixture-private\n');
    assert(!JSON.stringify(saved).includes('fixture-private'));
    const backup = JSON.parse(
      await readFile(process.env.LINUX_STATE_ROOT + '/node-app-env-backups/' + saved.backupId + '.json', 'utf8'),
    );
    assert.equal(backup.text, original);
    const catalog = await nodeAppEnvBackups('env-edit-app');
    assert(catalog.backups.some((item) => item.id === saved.backupId));
    assert(!JSON.stringify(catalog).includes('fixture-private'));
    assert(!JSON.stringify(catalog).includes(directory));
    assert.equal((await nodeAppEnvBackupRecord('env-edit-app', saved.backupId)).text, original);
    await assert.rejects(nodeAppEnvBackupRecord('env-edit-app', '../invalid'));
    await assert.rejects(
      updateNodeAppEnv({ ...snapshot, changes: { port: 3300 }, confirm: true }),
      (e) => e.status === 409,
    );
    const plan = await nodeAppEnvRestorePlan('env-edit-app', saved.backupId);
    assert(!JSON.stringify(plan).includes('fixture-private'));
    assert.equal(plan.fields.find((field) => field.key === 'port').after, 3145);
    await assert.rejects(restoreNodeAppEnv(plan), (e) => e.status === 400);
    const restored = await restoreNodeAppEnv({ ...plan, confirm: true });
    assert.equal(restored.values.port, 3145);
    assert(restored.backupId);
    assert.equal(await readFile(directory + '/.env', 'utf8'), original);
    const undo = await nodeAppEnvBackupRecord('env-edit-app', restored.backupId);
    assert.equal(undo.text, 'PORT=3200\nAPI_KEY=fixture-private\n');
    await assert.rejects(restoreNodeAppEnv({ ...plan, confirm: true }), (e) => e.status === 409);
    const fresh = await nodeAppEnvSnapshot('env-edit-app');
    const current = await nodeApps();
    await saveNodeApp({
      version: current.version,
      profile: { id: 'env-edit-app', label: 'Changed', directory, entry: 'server.js', environmentFile: '.env' },
    });
    await assert.rejects(
      updateNodeAppEnv({ ...fresh, changes: { port: 3400 }, confirm: true }),
      (e) => e.status === 409,
    );
  } finally {
    if (previous === undefined) delete process.env.LINUX_STATE_ROOT;
    else process.env.LINUX_STATE_ROOT = previous;
    await rm(directory, { recursive: true, force: true });
    await rm(state, { recursive: true, force: true });
  }
});
