import assertGuard from 'node:assert/strict';
assertGuard.equal(process.getuid?.(),0);assertGuard.equal(process.env.TASTEDEV_LOCK_FIXTURE,'1');
import fs from 'node:fs';
const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n');
for(const path of ['/etc/postgresql','/mnt/data/build/tastedev-linux'])assertGuard(mounts.some(line=>line.split(' ')[4]===path&&line.includes(' - tmpfs ')),'검수 전용 tmpfs가 필요합니다.');
import vm from 'node:vm';
import { createRequire } from 'node:module';
const helper = '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
  source = fs
    .readFileSync(helper, 'utf8')
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0],
  context = vm.createContext({
    process,
    Buffer,
    require: createRequire(import.meta.url),
    __filename: helper,
    setTimeout,
    clearTimeout,
  });
vm.runInContext(source, context);
const fd:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof fd==='number'&&Number.isSafeInteger(fd)&&fd>=0);
Object.defineProperty(globalThis, Symbol.for('tastedev.admin-native-lock'), { value: Object.freeze({ fd, helper }) });
const native = await import('../../lib/admin-native-exec.ts'),
  transaction = await import('../../lib/config-transaction.ts'),
  crypto = await import('node:crypto');
const redis = process.argv[2] === 'redis',
  nginx = process.argv[2] === 'nginx',
  maria = process.argv[2] === 'maria',
  folder = redis
    ? '/mnt/data/build/tastedev-linux/tastedev-redis-crash'
    : nginx
      ? '/mnt/data/build/tastedev-linux/tastedev-nginx-crash'
      : maria
        ? '/mnt/data/build/tastedev-linux/tastedev-maria-crash'
        : '/mnt/data/build/tastedev-linux/tastedev-common-crash';
fs.mkdirSync(folder, { mode: 0o700 });
fs.mkdirSync(folder + '/backups', { mode: 0o700 });
const activate = async () => {
  native.execFile('/usr/bin/sleep', ['1.2'], { timeout: 5000 }, () => {});
  process.stdout.write('ready\n');
  process.stdin.resume();
  await new Promise(() => {});
};
if (redis) {
  fs.mkdirSync(folder + '/conf', { mode: 0o700 });
  fs.writeFileSync(folder + '/conf/redis.conf', 'port 6379\n', { mode: 0o600 });
  const topology = await import('../../lib/redis-topology.ts'),
    apply = await import('../../lib/redis-apply.ts'),
    graph = await topology.redisTopology(undefined, folder + '/conf');
  await apply.applyRedisConfig(
    { confirm: true, version: graph.version, changes: { port: 6380 } },
    {
      base: folder + '/conf',
      backupRoot: folder + '/backups',
      validatePrepared: async () => {},
      inspectService: async () => {},
      activate,
      recover: async () => {},
    },
  );
} else if (nginx) {
  fs.mkdirSync(folder + '/conf', { mode: 0o700 });
  fs.writeFileSync(folder + '/conf/nginx.conf', 'events {} http {}\n', { mode: 0o600 });
  const topology = await import('../../lib/nginx-topology.ts'),
    apply = await import('../../lib/nginx-apply.ts'),
    graph = await topology.nginxTopology(folder + '/conf');
  await apply.applyNginxConfiguration(
    {
      path: '/etc/nginx/nginx.conf',
      text: 'events { worker_connections 100; } http {}\n',
      version: crypto.createHash('sha256').update('events {} http {}\n').digest('hex'),
      graphVersion: graph.version,
      confirm: true,
    },
    {
      base: folder + '/conf',
      backupRoot: folder + '/backups',
      inspectService: async () => {},
      validateOperational: async () => {},
      validatePrepared: async () => {},
      activate,
      recover: async () => {},
    },
  );
} else if (maria) {
  fs.mkdirSync(folder + '/conf', { mode: 0o700 });
  fs.mkdirSync(folder + '/conf/conf.d', { mode: 0o700 });
  fs.writeFileSync(folder + '/conf/my.cnf', '!includedir /etc/mysql/conf.d\n', { mode: 0o600 });
  fs.writeFileSync(folder + '/conf/conf.d/server.cnf', '[mariadbd]\nport=3306\n', { mode: 0o600 });
  const topology = await import('../../lib/mariadb-topology.ts'),
    apply = await import('../../lib/mariadb-apply.ts'),
    graph = await topology.mariadbTopology('/etc/mysql/my.cnf', folder + '/conf');
  await apply.applyMariaDBConfig(
    {
      root: '/etc/mysql/my.cnf',
      target: '/etc/mysql/conf.d/server.cnf',
      version: graph.version,
      changes: { port: 3307 },
      confirm: true,
    },
    {
      base: folder + '/conf',
      backupRoot: folder + '/backups',
      inspectService: async () => ({
        argv: ['/usr/sbin/mariadbd', '--defaults-file=/etc/mysql/my.cnf'],
        canonical: (value:string) => value,
      }),
      run: async (binary:string, args:string[]) => {
        if (args[0] === '--no-defaults') return '--validate-config';
        if (binary === '/usr/bin/my_print_defaults') return '--port=3307\n';
        if (args.includes('restart')) await activate();
        return '';
      },
    },
  );
} else {
  fs.writeFileSync(folder + '/config', 'port 6379\n', { mode: 0o600 });
  await transaction.configTransaction({
    file: folder + '/config',
    backupRoot: folder + '/backups',
    version: crypto.createHash('sha256').update('port 6379\n').digest('hex'),
    transform: () => 'port 6380\n',
    validate: async () => {},
    activate,
    recover: async () => {},
  });
}
