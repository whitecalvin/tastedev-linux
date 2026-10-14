// Standalone service operations, embedded with the privileged helper bindings.
type Input=Readonly<Record<string,unknown>>;
type AdminRuntime=import('./helper-runtime.mts').AdminRuntime;
declare const fs:typeof import('node:fs'),path:typeof import('node:path'),BASE:string;
declare const require:NodeRequire;
declare function fail(message:string,status?:number):never;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
declare const execFileSync:typeof import('./helper-native-exec.mts').execFileSync;
declare const mariaRuntime:typeof import('./helper-runtime.mts').mariaRuntime;
declare const mariaBackupRoot:typeof import('./helper-database-backups.mts').mariaBackupRoot;
declare const mariaBackupRecord:typeof import('./helper-database-backups.mts').mariaBackupRecord;
const {TextDecoder:helperDatabaseTextDecoder}:typeof import('node:util')=require('node:util');
function helperServiceErrorCode(error:unknown,code:string):boolean{return error!==null&&typeof error==='object'&&'code' in error&&error.code===code;}
export async function mariaInspect(root:unknown, runtime:AdminRuntime, overrides:ReadonlyMap<string,string> = new Map()) {
  if(typeof root!=='string')fail('Invalid MariaDB main configuration');
  const graph = await runtime.mariadbTopology(root, '/etc/mysql', overrides);
  if (!graph.complete) fail('Inspect a complete MariaDB include graph');
  const contents = new Map<string,string>();
  for (const file of graph.files) {
    let dir = path.dirname(file.path);
    while (dir !== '/') {
      rootDir(dir);
      dir = path.dirname(dir);
    }
    const original = runtime.trusted(file.path),override=overrides.get(file.path);
    if(overrides.has(file.path)&&typeof override!=='string')fail('Invalid MariaDB include override');
    const bytes = override===undefined?original:Buffer.from(override);
    if (hash(bytes) !== file.version) fail('MariaDB include graph changed');
    contents.set(
      file.path,
      new helperDatabaseTextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes),
    );
  }
  return { graph, contents };
}
export function mariaServiceSnapshot() {
  function pid() {
    const output = execFileSync('/usr/bin/systemctl', ['show', '--property=MainPID', '--value', 'mariadb.service'], {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 16384,
      env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', NODE_ENV:'production' },
    });
    const value=typeof output==='string'?output.trim():output.toString('utf8').trim();
    if (!/^[1-9][0-9]{0,9}$/.test(value) || Number(value) > 2147483647) fail('MariaDB service process is unavailable');
    return value;
  }
  function processIdentity(value:string) {
    function readProc(leaf:string) {
      const fd = fs.openSync('/proc/' + value + '/' + leaf, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      try {
        const buffer = Buffer.alloc(16385),
          size = fs.readSync(fd, buffer, 0, buffer.length, 0);
        if (size > 16384) fail('MariaDB process metadata exceeds limit');
        return new helperDatabaseTextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size));
      } finally {
        fs.closeSync(fd);
      }
    }
    const stat = readProc('stat'),
      close = stat.lastIndexOf(')'),
      start = stat
        .slice(close + 2)
        .trim()
        .split(/\s+/)[19],
      uid = /^Uid:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/m.exec(readProc('status'));
    if (close < 0 || !/^\d+$/.test(start || '') || !uid || uid.slice(1).some((value) => value !== uid[1]))
      fail('MariaDB process metadata changed');
    return { start, uid: Number(uid[1]) };
  }
  const before = pid(),
    identity = processIdentity(before);
  const executable = fs.readlinkSync('/proc/' + before + '/exe'),
    native = fs.realpathSync('/usr/sbin/mariadbd');
  if (executable !== native || !native.startsWith('/usr/sbin/'))
    fail('MariaDB service executable differs from the validation binary');
  let binaryParent = path.dirname(native);
  while (binaryParent !== '/') {
    rootDir(binaryParent);
    binaryParent = path.dirname(binaryParent);
  }
  const binaryStat = fs.lstatSync(native);
  if (!binaryStat.isFile() || binaryStat.uid !== 0 || binaryStat.mode & 0o022 || !(binaryStat.mode & 0o111))
    fail('Unsafe MariaDB service executable');
  const fd = fs.openSync('/proc/' + before + '/cmdline', fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  let bytes:Buffer;
  try {
    const buffer = Buffer.alloc(16385),
      count = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (count > 16384) fail('MariaDB service arguments exceed limit');
    bytes = buffer.subarray(0, count);
  } finally {
    fs.closeSync(fd);
  }
  if (pid() !== before) fail('MariaDB service process changed');
  const argv = new helperDatabaseTextDecoder('utf-8', { fatal: true }).decode(bytes).split('\0');
  if (argv.at(-1) === '') argv.pop();
  function canonical(file:string):string {
    let current = file;
    for (let depth = 0; depth < 16; depth++) {
      let parent = path.dirname(current);
      while (parent !== '/') {
        rootDir(parent);
        parent = path.dirname(parent);
      }
      const stat = fs.lstatSync(current);
      if (stat.uid !== 0 || stat.nlink !== 1) fail('Unsafe MariaDB main path');
      if (stat.isSymbolicLink()) {
        current = path.resolve(path.dirname(current), fs.readlinkSync(current));
        if (!current.startsWith('/etc/')) fail('Unsafe MariaDB main link');
        continue;
      }
      if (!stat.isFile() || stat.mode & 0o022 || !['/etc/mysql/my.cnf', '/etc/mysql/mariadb.cnf'].includes(current))
        fail('Unsafe MariaDB main file');
      return current;
    }
    fail('MariaDB main link depth exceeded');
  }
  const final = processIdentity(before);
  if (pid() !== before || JSON.stringify(final) !== JSON.stringify(identity)) fail('MariaDB process identity changed');
  return { argv, canonical, pid: Number(before), ...identity, identityVerified: true };
}
export async function mariaApply(input:Input) {
  if (input.confirm !== true) fail('MariaDB restart confirmation required');
  const runtime = await mariaRuntime(),
    { graph } = await mariaInspect(input.root, runtime);
  if (graph.version !== input.version) fail('MariaDB include graph changed');
  return runtime.applyMariaDBConfig(input, {
    candidateInspector: runtime.inspectMariaDBSandboxCandidate,
    backupRoot: mariaBackupRoot(),
    inspectService: async () => mariaServiceSnapshot(),
    run: async (binary, args) => {
      try {
        return execFileSync(binary, args, {
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 2097152,
          env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', NODE_ENV:'production' },
        });
      } catch {
        fail('MariaDB command failed');
      }
    },
  });
}
export async function mariaRestore(input:Input) {
  if (input.confirm !== true) fail('MariaDB restore and restart confirmation required');
  const record = mariaBackupRecord(input.id);
  if (record.version !== input.backupVersion) fail('MariaDB backup changed');
  const runtime = await mariaRuntime(),
    { graph } = await mariaInspect(input.root, runtime);
  const selected = graph.files.find((file) => file.path === record.target);
  if (!selected || selected.version !== input.version || graph.version !== input.graphVersion)
    fail('MariaDB configuration changed');
  await mariaInspect(input.root, runtime, new Map([[record.target, record.text]]));
  return runtime.applyMariaDBConfig(
    { root: input.root, target: record.target, version: input.graphVersion, changes: {}, confirm: true },
    {
      candidateInspector: runtime.inspectMariaDBSandboxCandidate,
      restoreText: record.text,
      backupRoot: BASE + '/mariadb',
      inspectService: async () => mariaServiceSnapshot(),
      run: async (binary, args) => {
        try {
          return execFileSync(binary, args, {
            encoding: 'utf8',
            timeout: 60000,
            maxBuffer: 2097152,
            env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', NODE_ENV:'production' },
          });
        } catch {
          fail('MariaDB command failed');
        }
      },
    },
  );
}
export async function mariaRestorePlan(input:Input) {
  if(typeof input.root!=='string')fail('Invalid MariaDB main configuration');
  const record = mariaBackupRecord(input.id),
    runtime = await mariaRuntime(),
    { graph, contents } = await mariaInspect(input.root, runtime);
  const currentText=contents.get(record.target),selected=graph.files.find(file=>file.path===record.target);
  if (currentText===undefined||!selected) fail('Backup target is not included by the selected main');
  const before = runtime.parseLiveConfig('mariadb', currentText),
    after = runtime.parseLiveConfig('mariadb', record.text);
  const latest = await runtime.mariadbTopology(input.root);
  if (!latest.complete || latest.version !== graph.version) fail('MariaDB include graph changed');
  return {
    id: record.id,
    root: graph.root,
    target: record.target,
    version: selected.version,
    graphVersion: graph.version,
    backupVersion: record.version,
    createdAt: record.createdAt,
    changed: hash(currentText) !== record.version,
    fields: [...new Set([...Object.keys(before.values), ...Object.keys(after.values)])].map((key) => ({
      key,
      before: before.values[key] ?? null,
      after: after.values[key] ?? null,
    })),
    warnings: [...before.warnings, ...after.warnings],
    notice:
      '지원 항목만 비교합니다. 전체 파일 복원에는 include 연결과 지원 외 설정도 포함되므로 별도 후보 검사와 재시작 확인이 필요합니다.',
  };
}

export async function redisRestorePlan(input:Input) {
  for (const dir of ['/var', '/var/lib', '/var/lib/linux', '/var/lib/linux/admin', '/etc', '/etc/redis']) rootDir(dir);
  const runtime = await mariaRuntime(),
    record = await runtime.redisBackupRecord(input.id),
    graph = await runtime.redisTopology();
  if (!graph.complete) fail('Inspect a complete Redis include graph');
  for (const file of graph.files) {
    let parent = path.dirname(file.path);
    while (parent !== '/') {
      rootDir(parent);
      parent = path.dirname(parent);
    }
    if (hash(runtime.trusted(file.path)) !== file.version) fail('Redis include graph changed');
  }
  const current = runtime.trusted(record.target),
    text = new helperDatabaseTextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(current);
  const restored = await runtime.redisTopology(record.target, '/etc/redis', new Map([[record.target, record.text]]));
  if (!restored.complete) fail('Resolve restored Redis include connections');
  for (const file of restored.files) {
    let parent = path.dirname(file.path);
    while (parent !== '/') {
      rootDir(parent);
      parent = path.dirname(parent);
    }
    const bytes = runtime.trusted(file.path);
    if (file.path !== record.target && hash(bytes) !== file.version) fail('Restored Redis include graph changed');
  }
  if (hash(current) !== graph.files.find((file) => file.path === record.target)?.version) fail('Redis main changed');
  const checkedRestore = await runtime.redisTopology(
    record.target,
    '/etc/redis',
    new Map([[record.target, record.text]]),
  );
  if (!checkedRestore.complete || checkedRestore.version !== restored.version)
    fail('Restored Redis include graph changed');
  const before = runtime.parseLiveConfig('redis', text),
    after = runtime.parseLiveConfig('redis', record.text);
  const latest = await runtime.redisTopology();
  if (!latest.complete || latest.version !== graph.version) fail('Redis include graph changed');
  return {
    id: record.id,
    target: record.target,
    version: hash(current),
    graphVersion: graph.version,
    restoreGraphVersion: restored.version,
    backupVersion: record.version,
    createdAt: record.createdAt,
    changed: hash(current) !== record.version,
    fields: [...new Set([...Object.keys(before.values), ...Object.keys(after.values)])].map((key) => ({
      key,
      before: before.values[key] ?? null,
      after: after.values[key] ?? null,
    })),
    warnings: [...before.warnings, ...after.warnings],
    notice:
      '지원 항목만 비교합니다. 전체 파일 복원에는 인증과 include 설정도 포함됩니다. 복원 전에 현재 전체 설정을 백업하고 Redis 서비스를 재시작합니다.',
  };
}
// Runs while main() holds the shared kernel lease. Read-only inspection stays
// available, but one recovery record cannot be superseded by another mutation.
export function nginxMutationStateGuard(action:string, input:Input|null|undefined) {
  const configRecovery = action === 'nginx-recover',
    siteRecovery = action === 'nginx-site-recover';
  const mutation =
    [
      'nginx-apply',
      'nginx-toggle',
      'nginx-restore',
      'nginx-config-apply',
      'nginx-config-restore',
      'nginx-site-apply',
    ].includes(action) ||
    configRecovery ||
    siteRecovery ||
    action === 'certificate' ||
    (action === 'service' &&
      (input?.unit === 'nginx.service' ||
        (input?.unit === 'certbot.timer' && typeof input?.action==='string' && ['start', 'restart', 'enable'].includes(input.action)))) ||
    (action === 'install' &&
      Array.isArray(input?.packages) &&
      input.packages.some((name:unknown) => typeof name==='string' && ['nginx', 'certbot', 'python3-certbot-nginx'].includes(name)));
  if (!mutation) return;
  function privateDirectory(directory:string):boolean {
    try {
      rootDir(directory);
      if (fs.lstatSync(directory).mode & 0o077) fail('Nginx recovery record directory must be private', 409);
      return true;
    } catch (error) {
      if (helperServiceErrorCode(error,'ENOENT')) return false;
      throw error;
    }
  }
  if (!siteRecovery) {
    const directory = BASE + '/nginx-sites';
    if (privateDirectory(directory)) {
      try {
        fs.lstatSync(directory + '/pending.json');
        fail('중단된 nginx 사이트 연결을 먼저 복구하세요.', 409);
      } catch (error) {
        if (!helperServiceErrorCode(error,'ENOENT')) throw error;
      }
    }
  }
  if (!configRecovery) {
    const directory = BASE + '/nginx-config/transactions';
    // A symlink at either private parent is never treated as an empty inventory.
    const parent = BASE + '/nginx-config';
    if (privateDirectory(parent) && privateDirectory(directory)) {
      const names = fs.readdirSync(directory);
      if (names.length > 1000) fail('Nginx recovery record inventory requires review', 409);
      if (names.some((name) => name.endsWith('.json'))) fail('중단된 nginx 설정 변경을 먼저 복구하세요.', 409);
    }
  }
}
