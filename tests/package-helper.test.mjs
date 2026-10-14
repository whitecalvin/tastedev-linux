import {loadBindings,transform} from 'next/dist/build/swc/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { helperActions } from '../lib/helper-actions.ts';
const typedSource = readFileSync(new URL('../lib/privilege.ts', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace(/const exec\s*=\s*promisify\(execFile\);/, '')
  .replace(/^export \{\s*helperActions\s*\};$/gm, '')
  .replace(/export /g, '');
await loadBindings();const source=(await transform(typedSource,{filename:'privilege.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'es6'}})).code;
test('packaged helper uses its fixed path and validates root-owned digest manifest', () => {
  const helper = '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
    manifest = '/usr/lib/tastedev-linux/admin-helper.sha256';
  const content = Buffer.from('fixture helper');
  let digest = createHash('sha256').update(content).digest('hex'),
    writable = false;
  const lstat = (name) => ({
    uid: 0,
    mode: name === manifest ? (writable ? 0o664 : 0o644) : 0o755,
    isFile: () => ['/usr/bin/node', helper, manifest].includes(name),
    isDirectory: () => !['/usr/bin/node', helper, manifest].includes(name),
    isSymbolicLink: () => false,
  });
  const module = new Function(
    'helperActions',
    'lstatSync',
    'readFileSync',
    'path',
    'createHash',
    'process',
    source + ';return {HELPER,helperStatus,helperCommand};',
  )(helperActions, lstat, (name) => (name === manifest ? digest : content), path, createHash, {
    env: { LINUX_PACKAGED: 'true' },
    cwd: () => '/unrelated',
  });
  assert.equal(module.HELPER, helper);
  assert.deepEqual(module.helperCommand('certificate'), ['/usr/bin/sudo', '-n', '--', helper, 'certificate']);
  assert.equal(module.helperStatus().ready, true);
  digest = '0'.repeat(64);
  assert.equal(module.helperStatus().ready, false);
  digest = createHash('sha256').update(content).digest('hex');
  writable = true;
  assert.equal(module.helperStatus().ready, false);
});
