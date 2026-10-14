import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
// Test-only ownership adapter: exercises real files, descriptors and flock as
// the development account. Production acquireAdminLock accepts root only.
export async function adminLockFixture(base, { unsafeExecutable = false } = {}) {
  const native = createRequire(import.meta.url),
    proxyStat = (stat, file) =>
      new Proxy(stat, {
        get(target, key) {
          if (key === 'uid') return unsafeExecutable && file === '/usr/bin/flock' ? 65534 : 0;
          const value = Reflect.get(target, key);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
  const fake = {
    ...fs,
    lstatSync: (file) => proxyStat(fs.lstatSync(file), file),
    fstatSync: (fd) => proxyStat(fs.fstatSync(fd)),
  };
  const source = (await readFile(new URL('../../scripts/admin/linux-admin', import.meta.url), 'utf8'))
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0]
    .replace(/const BASE\s*=\s*(['"])\/var\/lib\/linux\/admin\1;/, 'const BASE=' + JSON.stringify(base) + ';');
  if (!source.includes('const BASE=' + JSON.stringify(base) + ';')) throw Error('관리자 잠금 검사 경로를 격리하지 못했습니다.');
  const context = vm.createContext({ process, Buffer, require: (name) => (name === 'node:fs' ? fake : native(name)) });
  vm.runInContext(source, context);
  return { acquire: () => vm.runInContext('acquireAdminLock()', context) };
}
