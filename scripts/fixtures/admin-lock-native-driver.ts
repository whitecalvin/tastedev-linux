import type {RedisCandidate} from '../../lib/redis-candidate.ts';
import type {NginxOperationDependencies} from '../../lib/nginx-operation-hooks.ts';
import assertGuard from 'node:assert/strict';
assertGuard.equal(process.getuid?.(),0);assertGuard.equal(process.env.TASTEDEV_LOCK_FIXTURE,'1');
import assert from 'node:assert/strict';
import fs from 'node:fs';
const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n');
for(const path of ['/etc/postgresql','/mnt/data/build/tastedev-linux'])assertGuard(mounts.some(line=>line.split(' ')[4]===path&&line.includes(' - tmpfs ')),'검수 전용 tmpfs가 필요합니다.');
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
assert.equal(process.getuid?.(), 0);
const exec = promisify(execFile),
  helper = '/usr/lib/tastedev-linux/scripts/admin/linux-admin',
  target = '/etc/postgresql/16/main/pg_hba.conf',
  text = 'local all all peer\n',
  hash = (value:string|Buffer) => createHash('sha256').update(value).digest('hex'),
  checks:string[] = [];
fs.mkdirSync('/etc/postgresql/16/main', { recursive: true, mode: 0o700 });
fs.writeFileSync(target, text, { mode: 0o600 });
const source = fs
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
async function readSource() {
  const pending = exec('/usr/bin/node', [helper, 'postgresql-hba-source'], { timeout: 10000 });
  assert(pending.child.stdin);pending.child.stdin.end(JSON.stringify({ path: target }));
  const result:unknown = JSON.parse((await pending).stdout);assert(result!==null&&typeof result==='object'&&'text' in result&&'version' in result);
  assert.equal(result.text, text);
  assert.equal(result.version, hash(text));
}
await readSource();
const before = fs.lstatSync('/var/lib/linux/admin/operation.lock');
await readSource();
assert.equal(fs.lstatSync('/var/lib/linux/admin/operation.lock').ino, before.ino);
checks.push(
  'actual UID0 helper dispatch, audited runtime manifest and root native supervisor perform the fixed postgres account lookup and read only the fixture HBA',
);
const child = spawn('/usr/bin/node', [new URL('./admin-lock-native-parent.mjs', import.meta.url).pathname], {
    stdio: ['pipe', 'pipe', 'pipe'],
  }),
  closed = once(child, 'close');
let error = '';
child.stderr.on('data', (value) => (error += value));
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Root parent fixture did not become ready: ' + error)), 5000);
    child.stdout.once('data', (value) => {
      clearTimeout(timer);
      assert.equal(value.toString(), 'ready\n');
      resolve();
    });
    child.once('error', (reason) => {
      clearTimeout(timer);
      reject(reason);
    });
  });
  child.kill('SIGKILL');
  await closed;
  assert.throws(() => vm.runInContext('acquireAdminLock()', context), /Another admin operation is active/);
  const began = Date.now();
  let recovered = false;
  for (let retry = 0; retry < 60; retry++) {
    try {
      const fd:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof fd==='number'&&Number.isSafeInteger(fd)&&fd>=0);
      fs.closeSync(fd);
      recovered = true;
      break;
    } catch (reason) {
      assert(reason!==null&&typeof reason==='object'&&'message' in reason&&typeof reason.message==='string');assert.match(reason.message, /Another admin operation is active/);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(recovered);
  assert(Date.now() - began >= 500);
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-common-crash/config.tastedev-lock'));
  checks.push(
    'actual UID0 parent SIGKILL keeps the real flock held by the production supervisor until its native sleep completes, then permits the next helper on the same inode',
  );
} finally {
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  await closed;
}
const redisChild = spawn(
    '/usr/bin/node',
    [new URL('./admin-lock-native-parent.mjs', import.meta.url).pathname, 'redis'],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  ),
  redisClosed = once(redisChild, 'close');
let redisError = '';
redisChild.stderr.on('data', (value) => (redisError += value));
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Redis parent did not become ready: ' + redisError)), 5000);
    redisChild.stdout.once('data', (value) => {
      clearTimeout(timer);
      assert.equal(value.toString(), 'ready\n');
      resolve();
    });
    redisChild.once('error', (reason) => {
      clearTimeout(timer);
      reject(reason);
    });
  });
  redisChild.kill('SIGKILL');
  await redisClosed;
  assert.throws(() => vm.runInContext('acquireAdminLock()', context), /Another admin operation is active/);
  let released = false;
  for (let retry = 0; retry < 60; retry++) {
    try {
      const held:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof held==='number'&&Number.isSafeInteger(held)&&held>=0);
      fs.closeSync(held);
      released = true;
      break;
    } catch (reason) {
      assert(reason!==null&&typeof reason==='object'&&'message' in reason&&typeof reason.message==='string');assert.match(reason.message, /Another admin operation is active/);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(released);
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-redis-crash/conf/.tastedev-redis-graph-lock'));
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-redis-crash/conf/redis.conf.tastedev-lock'));
  checks.push(
    'actual root Redis graph apply SIGKILL leaves no filesystem graph or file lease while the native supervisor retains the global kernel lock',
  );
} finally {
  if (redisChild.exitCode === null && redisChild.signalCode === null) redisChild.kill('SIGKILL');
  await redisClosed;
}
const nginxChild = spawn(
    '/usr/bin/node',
    [new URL('./admin-lock-native-parent.mjs', import.meta.url).pathname, 'nginx'],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  ),
  nginxClosed = once(nginxChild, 'close');
let nginxError = '';
nginxChild.stderr.on('data', (value) => (nginxError += value));
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Nginx parent did not become ready: ' + nginxError)), 5000);
    nginxChild.stdout.once('data', (value) => {
      clearTimeout(timer);
      assert.equal(value.toString(), 'ready\n');
      resolve();
    });
    nginxChild.once('error', (reason) => {
      clearTimeout(timer);
      reject(reason);
    });
  });
  nginxChild.kill('SIGKILL');
  await nginxClosed;
  assert.throws(() => vm.runInContext('acquireAdminLock()', context), /Another admin operation is active/);
  let released = false;
  for (let retry = 0; retry < 60; retry++) {
    try {
      const held:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof held==='number'&&Number.isSafeInteger(held)&&held>=0);
      fs.closeSync(held);
      released = true;
      break;
    } catch (reason) {
      assert(reason!==null&&typeof reason==='object'&&'message' in reason&&typeof reason.message==='string');assert.match(reason.message, /Another admin operation is active/);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(released);
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-nginx-crash/conf/.tastedev-nginx-graph-lock'));
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-nginx-crash/conf/nginx.conf.tastedev-lock'));
  checks.push(
    'actual root Nginx graph apply SIGKILL leaves no filesystem graph or file lease while the native supervisor retains the global kernel lock',
  );
} finally {
  if (nginxChild.exitCode === null && nginxChild.signalCode === null) nginxChild.kill('SIGKILL');
  await nginxClosed;
}
const mariaChild = spawn(
    '/usr/bin/node',
    [new URL('./admin-lock-native-parent.mjs', import.meta.url).pathname, 'maria'],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  ),
  mariaClosed = once(mariaChild, 'close');
let mariaError = '';
mariaChild.stderr.on('data', (value) => (mariaError += value));
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('MariaDB parent did not become ready: ' + mariaError)), 5000);
    mariaChild.stdout.once('data', (value) => {
      clearTimeout(timer);
      assert.equal(value.toString(), 'ready\n');
      resolve();
    });
    mariaChild.once('error', (reason) => {
      clearTimeout(timer);
      reject(reason);
    });
  });
  mariaChild.kill('SIGKILL');
  await mariaClosed;
  assert.throws(() => vm.runInContext('acquireAdminLock()', context), /Another admin operation is active/);
  let released = false;
  for (let retry = 0; retry < 60; retry++) {
    try {
      const held:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof held==='number'&&Number.isSafeInteger(held)&&held>=0);
      fs.closeSync(held);
      released = true;
      break;
    } catch (reason) {
      assert(reason!==null&&typeof reason==='object'&&'message' in reason&&typeof reason.message==='string');assert.match(reason.message, /Another admin operation is active/);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(released);
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-maria-crash/conf/.tastedev-mariadb-graph-lock'));
  assert(!fs.existsSync('/mnt/data/build/tastedev-linux/tastedev-maria-crash/conf/conf.d/server.cnf.tastedev-lock'));
  checks.push(
    'actual root MariaDB graph apply SIGKILL leaves no filesystem graph or file lease while the native supervisor retains the global kernel lock',
  );
} finally {
  if (mariaChild.exitCode === null && mariaChild.signalCode === null) mariaChild.kill('SIGKILL');
  await mariaClosed;
}
const fd:unknown = vm.runInContext('acquireAdminLock()', context);assertGuard(typeof fd==='number'&&Number.isSafeInteger(fd)&&fd>=0);
Object.defineProperty(globalThis, Symbol.for('tastedev.admin-native-lock'), { value: Object.freeze({ fd, helper }) });
const native = await import('../../lib/admin-native-exec.ts');
try {
  const run = promisify(native.execFile);
  assert.equal(native.execFileSync('/usr/bin/printf', ['sync'], { encoding: 'utf8' }), 'sync');
  assert.equal((await run('/usr/bin/printf', ['한글 😀'])).stdout, '한글 😀');
  await assert.rejects(run('/usr/bin/readlink', ['/proc/self/fd/3']), (reason:unknown) => reason!==null&&typeof reason==='object'&&'code' in reason&&reason.code===1);
  await assert.rejects(run('/usr/bin/sleep', ['10'], { timeout: 200 }), (reason:unknown) => reason!==null&&typeof reason==='object'&&'killed' in reason&&reason.killed===true);
  checks.push(
    'production root sync/async supervisor preserves Unicode and output, bounds timeout, and never passes the root lock descriptor to native programs',
  );
  context.fixtureFd = fd;
  context.outputArgs = ['-e', 'process.stdout.write("out 한글\\n");process.stderr.write("err 😀\\n")'];
  vm.runInContext('adminNativeContext=Object.freeze({fd:fixtureFd,helper:__filename})', context);
  try {
    assert.equal(vm.runInContext('run("/usr/bin/node",outputArgs)', context), 'out 한글\nerr 😀\n');
    assert.throws(
      () => vm.runInContext('run("/usr/bin/readlink",["/proc/self/fd/3"])', context),
      /Native command failed/,
    );
    checks.push(
      'production helper command output retains successful Unicode stdout and stderr through the root supervisor without exposing FD3 to native code',
    );
  } finally {
    vm.runInContext('adminNativeContext=null', context);
  }
  const lease = await import('../../lib/config-operation-lease.ts'),
    lock = '/mnt/data/build/tastedev-linux/tastedev-common-managed-lease';
  const release = await lease.acquireConfigOperationLease(lock);
  assert(!fs.existsSync(lock));
  await assert.rejects(lease.acquireConfigOperationLease(lock), (reason:unknown) => reason!==null&&typeof reason==='object'&&'status' in reason&&reason.status===409);
  await release();
  await release();
  const again = await lease.acquireConfigOperationLease(lock);
  await again();
  fs.mkdirSync(lock, { mode: 0o700 });
  await assert.rejects(lease.acquireConfigOperationLease(lock), (reason:unknown) => reason!==null&&typeof reason==='object'&&'status' in reason&&reason.status===409);
  assert(fs.lstatSync(lock).isDirectory());
  fs.rmdirSync(lock);
  checks.push(
    'actual root managed leases exclude in-process overlap, create no filesystem lease, survive parent SIGKILL without stale directories, permit the next operation, and preserve unknown legacy leases',
  );
  const folder = '/mnt/data/build/tastedev-linux/tastedev-managed-config';
  fs.mkdirSync(folder, { mode: 0o700 });
  fs.mkdirSync(folder + '/backups', { mode: 0o700 });
  fs.writeFileSync(folder + '/config', 'port 6379\n', { mode: 0o600 });
  const transaction = await import('../../lib/config-transaction.ts');
  let recovered = false;
  const result = await transaction.configTransaction({
    file: folder + '/config',
    backupRoot: folder + '/backups',
    version: hash('port 6379\n'),
    transform: () => 'port 6380\n',
    validate: async (candidate) => assert.equal(fs.readFileSync(candidate, 'utf8'), 'port 6380\n'),
    activate: async () => {
      throw Error('fixture activation failure');
    },
    recover: async () => {
      recovered = true;
    },
  });
  assert(result.restored && result.recovered && recovered);
  assert.equal(fs.readFileSync(folder + '/config', 'utf8'), 'port 6379\n');
  assert(!fs.existsSync(folder + '/config.tastedev-lock'));
  checks.push(
    'actual root common configuration transaction retains private backup, validation and byte rollback under the helper kernel lock without creating a directory lease',
  );
  const crashed = '/mnt/data/build/tastedev-linux/tastedev-common-crash',
    journal = await import('../../lib/config-journal.ts');
  assert.equal(fs.readFileSync(crashed + '/config', 'utf8'), 'port 6380\n');
  assert(await journal.readConfigJournal(crashed + '/config', crashed + '/backups'));
  await assert.rejects(
    transaction.configTransaction({
      file: crashed + '/config',
      backupRoot: crashed + '/backups',
      version: hash('port 6380\n'),
      transform: () => 'port 6390\n',
      validate: async () => {},
      activate: async () => {},
      recover: async () => {},
    }),
    (reason:unknown) => reason!==null&&typeof reason==='object'&&'status' in reason&&reason.status===409,
  );
  let crashRecovered = false;
  const recovery = await transaction.recoverConfigTransaction({
    file: crashed + '/config',
    backupRoot: crashed + '/backups',
    confirm: true,
    beforeRecovery: async (record) => assert.equal(record.target, crashed + '/config'),
    validate: async (candidate) => assert.equal(fs.readFileSync(candidate, 'utf8'), 'port 6379\n'),
    recover: async () => {
      crashRecovered = true;
    },
  });
  assert(recovery.restored && recovery.recovered && crashRecovered);
  assert.equal(fs.readFileSync(crashed + '/config', 'utf8'), 'port 6379\n');
  assert.equal(await journal.readConfigJournal(crashed + '/config', crashed + '/backups'), null);
  checks.push(
    'actual root SIGKILL after configuration rename preserves private journal and backup, blocks a new transaction and permits explicit original-byte recovery with independently supplied scope/validation/service fixture hooks',
  );
  const redisRecovery = await import('../../lib/redis-recovery.ts'),
    redisBase = '/mnt/data/build/tastedev-linux/tastedev-redis-crash/conf',
    redisRoot = '/mnt/data/build/tastedev-linux/tastedev-redis-crash/backups',
    redisOptions = {
      base: redisBase,
      backupRoot: redisRoot,
      uid: 0,
      inspectService: async () => ({
        identityVerified: true,
        startupMainVerified: true,
        pid: 123,
        start: '42',
        uid: 111,
        service: 'redis-server.service',
        main: '/etc/redis/redis.conf',
      }),
      validatePrepared: async (candidate:RedisCandidate) => assert.equal(fs.readFileSync(candidate.main, 'utf8'), 'port 6379\n'),
      recover: async () => {},
    };
  const redisPlan = await redisRecovery.redisRecoveryPlan(redisOptions);
  assert(redisPlan.recoveryRequired);
  assert.equal(fs.readFileSync(redisBase + '/redis.conf', 'utf8'), 'port 6380\n');
  const redisResult = await redisRecovery.recoverRedisConfiguration(
    { confirm: true, reviewVersion: redisPlan.reviewVersion },
    redisOptions,
  );
  assert(redisResult.recovered);
  assert.equal(fs.readFileSync(redisBase + '/redis.conf', 'utf8'), 'port 6379\n');
  assert.equal(await journal.readConfigJournal(redisBase + '/redis.conf', redisRoot), null);
  checks.push(
    'actual root interrupted Redis controller reviews journal and include graphs, restores original bytes and clears journal using fixture service identity/validation/restart hooks; operating Redis and systemd are not used',
  );
  const nginxRecovery = await import('../../lib/nginx-recovery.ts'),
    nginxHooks = await import('../../lib/nginx-operation-hooks.ts'),
    nginxBase = '/mnt/data/build/tastedev-linux/tastedev-nginx-crash/conf',
    nginxRoot = '/mnt/data/build/tastedev-linux/tastedev-nginx-crash/backups',
    nginxOptions = {
      base: nginxBase,
      backupRoot: nginxRoot,
      ownerUid: 0,
      inspect: async () => ({
        identityVerified: true,
        pid: 123,
        start: '42',
        service: 'nginx.service',
        main: '/etc/nginx/nginx.conf',
        prefix: '/usr/share/nginx',
        locale: { LC_ALL: 'C' },
      }),
      makeHooks: ({ inspect }:NginxOperationDependencies) => nginxHooks.nginxOperationHooks({ inspect, runCommand: async () => {} }),
    };
  const nginxPlan = await nginxRecovery.nginxRecoveryPlan({ path: '/etc/nginx/nginx.conf' }, nginxOptions);
  assert(nginxPlan.recoveryRequired);
  assert.equal(fs.readFileSync(nginxBase + '/nginx.conf', 'utf8'), 'events { worker_connections 100; } http {}\n');
  const nginxResult = await nginxRecovery.recoverNginxConfiguration(
    { path: '/etc/nginx/nginx.conf', confirm: true, locale: { LC_ALL: 'C' }, reviewVersion: nginxPlan.reviewVersion },
    nginxOptions,
  );
  assert(nginxResult.recovered);
  assert.equal(fs.readFileSync(nginxBase + '/nginx.conf', 'utf8'), 'events {} http {}\n');
  assert.equal(await journal.readConfigJournal(nginxBase + '/nginx.conf', nginxRoot), null);
  checks.push(
    'actual root interrupted nginx controller restores original bytes and clears journal after reviewed full graph and fixture native command hooks; operating nginx and systemd are not used',
  );
  const mariaRecovery = await import('../../lib/mariadb-recovery.ts'),
    mariaBase = '/mnt/data/build/tastedev-linux/tastedev-maria-crash/conf',
    mariaRoot = '/mnt/data/build/tastedev-linux/tastedev-maria-crash/backups',
    mariaOptions = {
      base: mariaBase,
      backupRoot: mariaRoot,
      ownerUid: 0,
      inspectService: async () => ({
        identityVerified: true,
        pid: 123,
        start: '42',
        uid: 111,
        argv: ['/usr/sbin/mariadbd', '--defaults-file=/etc/mysql/my.cnf'],
        canonical: (value:string) => value,
      }),
      run: async (binary:string, args:string[]) => {
        if (args[0] === '--no-defaults') return '--validate-config';
        if (binary === '/usr/bin/my_print_defaults') return '--port=3306\n';
        return '';
      },
    };
  const mariaPlan = await mariaRecovery.mariaDBRecoveryPlan(
    { root: '/etc/mysql/my.cnf', target: '/etc/mysql/conf.d/server.cnf' },
    mariaOptions,
  );
  assert(mariaPlan.recoveryRequired);
  assert.equal(fs.readFileSync(mariaBase + '/conf.d/server.cnf', 'utf8'), '[mariadbd]\nport = 3307\n');
  const mariaResult = await mariaRecovery.recoverMariaDBConfiguration(
    {
      root: '/etc/mysql/my.cnf',
      target: '/etc/mysql/conf.d/server.cnf',
      confirm: true,
      reviewVersion: mariaPlan.reviewVersion,
    },
    mariaOptions,
  );
  assert(mariaResult.recovered);
  assert.equal(fs.readFileSync(mariaBase + '/conf.d/server.cnf', 'utf8'), '[mariadbd]\nport=3306\n');
  assert.equal(await journal.readConfigJournal(mariaBase + '/conf.d/server.cnf', mariaRoot), null);
  checks.push(
    'actual root interrupted MariaDB controller reviews original include graph and immutable private candidate, restores bytes and clears journal with fixture process/validation/restart hooks; operating MariaDB and systemd are not used',
  );
} finally {
  fs.closeSync(fd);
}
assert.equal(fs.readFileSync(target, 'utf8'), text);
const ending = fs.lstatSync('/var/lib/linux/admin/operation.lock');
assert.equal(ending.uid, 0);
assert.equal(ending.mode & 0o777, 0o600);
assert.equal(ending.nlink, 1);
assert.equal(ending.ino, before.ino);
console.log(
  JSON.stringify({
    status: 'PASS',
    uid: 0,
    nodeVersion: process.version,
    helperSha256: hash(fs.readFileSync(helper)),
    runtimeSha256: hash(fs.readFileSync('/usr/lib/tastedev-linux/scripts/admin/runtime/admin-native-exec.mjs')),
    flockSha256: hash(fs.readFileSync('/usr/bin/flock')),
    checks,
    operatingClusterAccess: false,
    databaseConnections: false,
    postmasterStarted: false,
    fixtureHbaPreserved: true,
    kernelLockMode: 600,
    kernelLockLinkCount: 1,
    ownershipAdaptersUsed: false,
  }),
);
