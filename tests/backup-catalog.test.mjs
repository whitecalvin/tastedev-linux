import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
test('backup catalog preserves valid entries while rejecting corrupt and symlinked fixtures', async () => {
  const root = await mkdtemp(join('/mnt/data/build/tastedev-linux', 'linux-backups-')),
    dir = join(root, '.runtime/server-tools'),
    id = '11111111-1111-4111-8111-111111111111';
  await mkdir(dir, { recursive: true });
  try {
    const text = 'fixture cron snapshot\n',
      record = {
        id,
        kind: 'cron',
        target: 'current-user',
        text,
        createdAt: new Date().toISOString(),
        sha256: createHash('sha256').update(text).digest('hex'),
      };
    const valid = join(dir, id + '.backup.json');
    await writeFile(valid, JSON.stringify(record));
    await writeFile(join(dir, '22222222-2222-4222-8222-222222222222.backup.json'), '{corrupt');
    await symlink(valid, join(dir, '33333333-3333-4333-8333-333333333333.backup.json'));
    const module = new URL('../lib/operations.ts', import.meta.url).href;
    const output = join(root, 'catalog.json');
    await promisify(execFile)(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import {backupCatalog} from ${JSON.stringify(module)};import {writeFile} from 'node:fs/promises';await writeFile(${JSON.stringify(output)},JSON.stringify(await backupCatalog()));`,
      ],
      {
        cwd: root,
        env: { ...process.env, LINUX_STATE_ROOT: join(root, '.runtime'), LINUX_ENABLE_ADMIN: 'false' },
        timeout: 5000,
      },
    );
    const catalog = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(catalog.backups.length, 1);
    assert.equal(catalog.backups[0].id, id);
    assert.equal(catalog.backups[0].text, undefined);
    assert.equal(catalog.warnings.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
