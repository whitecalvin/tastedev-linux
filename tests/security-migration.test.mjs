import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { stateRoot } from '../lib/runtime-paths.ts';
import { defaultSecurity, securitySettings } from '../lib/security.ts';
test('existing security settings migrate new permissions to disabled without widening prior permissions', async (context) => {
  const root = stateRoot();
  if (!path.basename(root).startsWith('tastedev-linux-tests-')) {
    context.skip('Requires the isolated npm test state directory');
    return;
  }
  const file = path.join(root, 'security.json');
  let previous;
  try {
    previous = await readFile(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await mkdir(root, { recursive: true });
    const legacy = { ...defaultSecurity, readOnly: false, fileEditing: true };
    delete legacy.databaseChanges;
    delete legacy.sudoPolicyChanges;
    await writeFile(file, JSON.stringify(legacy), { mode: 0o600 });
    const result = await securitySettings();
    assert.equal(result.settings.databaseChanges, false);
    assert.equal(result.settings.sudoPolicyChanges, false);
    assert.equal(result.requirements.sudoPolicyChanges, 'LINUX_ENABLE_SUDO_POLICY');
    assert.equal(result.settings.fileEditing, true);
    assert.equal(result.settings.readOnly, false);
  } finally {
    if (previous) await writeFile(file, previous, { mode: 0o600 });
    else await unlink(file);
  }
});

test('security migration refuses a corrupted core permission instead of filling it from defaults', async (context) => {
  const root = stateRoot();
  if (!path.basename(root).startsWith('tastedev-linux-tests-')) {
    context.skip('Requires isolated state');
    return;
  }
  const file = path.join(root, 'security.json');
  let previous;
  try {
    previous = await readFile(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await mkdir(root, { recursive: true });
    const broken = { ...defaultSecurity };
    delete broken.readOnly;
    await writeFile(file, JSON.stringify(broken), { mode: 0o600 });
    await assert.rejects(securitySettings(), (error) => error.status === 403);
  } finally {
    if (previous) await writeFile(file, previous, { mode: 0o600 });
    else await unlink(file);
  }
});
