import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const base = process.env.TASTEDEV_ADMIN_LOCK_FIXTURE_ROOT;
if (!/^\/mnt\/data\/build\/tastedev-linux\/tastedev-admin-lock-[a-zA-Z0-9_-]+$/.test(base || '')) throw Error('Fixture root required');
const native = createRequire(import.meta.url),
  statProxy = (stat) =>
    new Proxy(stat, {
      get(target, key) {
        if (key === 'uid') return 0;
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    }),
  fake = { ...fs, lstatSync: (file) => statProxy(fs.lstatSync(file)), fstatSync: (fd) => statProxy(fs.fstatSync(fd)) },
  processProxy = new Proxy(process, {
    get(target, key) {
      if (key === 'getuid') return () => 0;
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
const source = fs
  .readFileSync(new URL('../../scripts/admin/linux-admin', import.meta.url), 'utf8')
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0]
  .replace(/const BASE\s*=\s*(['"])\/var\/lib\/linux\/admin\1;/, 'const BASE=' + JSON.stringify(base) + ';');
if (!source.includes('const BASE=' + JSON.stringify(base) + ';')) throw Error('관리자 잠금 검사 경로를 격리하지 못했습니다.');
const context = vm.createContext({
  process: processProxy,
  Buffer,
  require: (name) => (name === 'node:fs' ? fake : native(name)),
  setTimeout,
  clearTimeout,
});
vm.runInContext(source, context);
await vm.runInContext('runNativeLockSupervisor()', context);
