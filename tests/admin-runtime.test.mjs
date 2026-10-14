import {readAdminRuntimeModule} from '../scripts/admin/runtime-source.mts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminRuntimeFiles } from '../scripts/admin/runtime-files.mts';
test('privileged MariaDB module closure has only audited local modules and Node builtins', async () => {
  const reached = new Set();
  async function visit(name) {
    if (reached.has(name)) return;
    assert(adminRuntimeFiles.includes(name), `관리자 실행 목록에 필요한 파일이 없습니다: ${name}`);
    reached.add(name);
    const source = (await readAdminRuntimeModule(name)).toString('utf8');
    assert(!/\b(?:import\s*\(|require\s*\(|eval\s*\(|new\s+Function\s*\()/.test(source), 'No indirect module loading');
    for (const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      if (specifier.startsWith('node:')) continue;
      assert(/^\.\/[a-z-]+\.mjs$/.test(specifier));
      await visit(specifier.slice(2));
    }
  }
  await visit('database-config-backup.mjs');
  await visit('postgresql-config-backup.mjs');
  await visit('postgresql-data-operation.mjs');
  await visit('postgresql-completed-history.mjs');
  await visit('postgresql-code-restore.mjs');
  await visit('postgresql-code-recovery.mjs');
  await visit('postgresql-code-operation.mjs');
  await visit('mariadb-sandbox-validation.mjs');
  await visit('mariadb-code-operation.mjs');
  await visit('redis-code-operation.mjs');
  await visit('certificate-execution.mjs');
  await visit('certificate-nginx-backup.mjs');
  await visit('postgresql-hba-operation.mjs');
  await visit('postgresql-hba-validate.mjs');
  await visit('postgresql-hba-backups.mjs');
  await visit('postgresql-hba-source.mjs');
  await visit('redis-recovery.mjs');
  await visit('redis-config-hooks.mjs');
  await visit('redis-reviewed-apply.mjs');
  await visit('redis-restore.mjs');
  await visit('redis-reviewed-validation.mjs');
  await visit('redis-context-inspect.mjs');
  await visit('nginx-recovery.mjs');
  await visit('nginx-config-restore-plan.mjs');
  await visit('nginx-config-restore.mjs');
  await visit('nginx-reviewed-apply.mjs');
  await visit('nginx-context-inspect.mjs');
  await visit('nginx-site-operation.mjs');
  await visit('sudo-policy-inspect.mjs');
  await visit('sudo-policy-hooks.mjs');
  await visit('sudo-policy-update.mjs');
  await visit('node-app-service-restore.mjs');
  await visit('node-app-service-recovery.mjs');
  await visit('node-app-service-backups.mjs');
  await visit('node-app-service-update.mjs');
  await visit('node-app-service-control.mjs');
  await visit('node-app-service-install.mjs');
  await visit('node-app-service-hooks.mjs');
  await visit('mariadb-recovery.mjs');
  await visit('mariadb-apply.mjs');
  await visit('redis-backups.mjs');
  await visit('redis-topology.mjs');
  assert.deepEqual([...reached].sort(), [...adminRuntimeFiles].sort());
});

test('MariaDB helper rejects checkout execution and unsafe or mismatched runtime before module loading', async () => {
  const vm = await import('node:vm'),
    { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
  const home = '/usr/lib/tastedev-linux/scripts/admin';
  for (const mode of ['checkout', 'writable', 'checksum', 'manifest']) {
    const context = vm.createContext({
      __dirname: mode === 'checkout' ? '/tmp/checkout' : home,
      process,
      Buffer,
      require(name) {
        if (name === 'node:fs')
          return {
            lstatSync(file) {
              return {
                isDirectory: () => !file.endsWith('.mjs') && !file.endsWith('.json'),
                isFile: () => true,
                isSymbolicLink: () => false,
                uid: 0,
                nlink: 1,
                mode: mode === 'writable' ? 0o777 : 0o755,
                size: 20,
              };
            },
            readFileSync(file) {
              if (file.endsWith('manifest.json'))
                return Buffer.from(
                  JSON.stringify(
                    mode === 'manifest'
                      ? { unexpected: 'x' }
                      : Object.fromEntries(adminRuntimeFiles.map((name) => [name, '0'.repeat(64)])),
                  ),
                );
              return Buffer.from('altered code');
            },
          };
        return require(name);
      },
    });
    vm.runInContext(source, context);
    await assert.rejects(
      vm.runInContext("dispatch('mariadb-apply',{confirm:true})", context),
      new RegExp(
        mode === 'checkout'
          ? 'packaged'
          : mode === 'writable'
            ? 'root-owned'
            : mode === 'manifest'
              ? 'manifest'
              : 'checksum',
      ),
    );
  }
});

test('helper module allowlist matches the packaged closure and uses CommonJS in the ESM app', async () => {
  const source = await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8');
  const literal = /const mariaModules\s*=\s*(\[[^;]+\]);/.exec(source)?.[1];
  assert(literal);
  assert.deepEqual(JSON.parse(literal.replaceAll("'", '"').replace(/,\s*\]$/, ']')).sort(), [...adminRuntimeFiles].sort());
  const metadata = JSON.parse(await readFile(new URL('../scripts/admin/package.json', import.meta.url), 'utf8'));
  assert.equal(metadata.type, 'commonjs');
});

test('MariaDB service snapshot bounds proc reads, rechecks PID and verifies root-owned main aliases and executable identity', async () => {
  const vm = await import('node:vm'),
    { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const source = (await readFile(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8'))
    .replace(/^#!.*\n/, '')
    .split('main().catch')[0];
  function snapshot(mode) {
    let calls = 0,
      closed = 0,
      procFile = '',
      statReads = 0;
    const data = Buffer.from('/usr/sbin/mariadbd\0--user=mysql\0');
    const fake = {
      constants: { O_RDONLY: 0, O_NOFOLLOW: 1 },
      realpathSync: () => '/usr/sbin/mariadbd',
      readlinkSync: (file) =>
        file.endsWith('/exe')
          ? mode === 'executable'
            ? '/tmp/mariadbd'
            : '/usr/sbin/mariadbd'
          : file === '/etc/mysql/my.cnf'
            ? '/etc/alternatives/my.cnf'
            : '/etc/mysql/mariadb.cnf',
      lstatSync: (file) => ({
        uid: mode === 'owner' && file === '/etc/alternatives/my.cnf' ? 99 : 0,
        nlink: 1,
        mode: mode === 'writable' && file === '/etc/alternatives' ? 0o777 : 0o755,
        isFile: () => file === '/usr/sbin/mariadbd' || file === '/etc/mysql/mariadb.cnf',
        isDirectory: () => !file.endsWith('.cnf') && file !== '/usr/sbin/mariadbd',
        isSymbolicLink: () => file === '/etc/mysql/my.cnf' || file === '/etc/alternatives/my.cnf',
      }),
      openSync: (file) => {
        assert.match(file, /^\/proc\/123\/(cmdline|stat|status)$/);
        procFile = file;
        return 10;
      },
      readSync: (fd, buffer) => {
        let bytes = data;
        if (procFile.endsWith('/stat'))
          bytes = Buffer.from(
            '123 (mariadbd) ' +
              ['S', ...Array(18).fill('0'), mode === 'start' && ++statReads > 1 ? '43' : '42'].join(' '),
          );
        if (procFile.endsWith('/status'))
          bytes = Buffer.from(mode === 'account' ? 'Uid:\t111 112 111 111\n' : 'Uid:\t111 111 111 111\n');
        bytes.copy(buffer);
        return mode === 'oversize' ? 16385 : bytes.length;
      },
      closeSync: () => {
        closed++;
      },
    };
    const context = vm.createContext({
      Buffer,
      process,
      require(name) {
        if (name === 'node:fs') return fake;
        if (name === 'node:child_process')
          return {
            execFileSync: (binary, args) => {
              assert.equal(binary, '/usr/bin/systemctl');
              assert.equal(args.at(-1), 'mariadb.service');
              calls++;
              return mode === 'pid' ? '../secret' : mode === 'changed' && calls > 1 ? '124' : '123';
            },
          };
        return require(name);
      },
    });
    vm.runInContext(source, context);
    return { context, closed: () => closed };
  }
  const valid = snapshot('valid'),
    result = vm.runInContext('mariaServiceSnapshot()', valid.context);
  assert.equal(result.canonical('/etc/mysql/my.cnf'), '/etc/mysql/mariadb.cnf');
  assert.equal(valid.closed(), 5);
  assert.equal(result.pid, 123);
  assert.equal(result.start, '42');
  assert.equal(result.uid, 111);
  assert.equal(result.identityVerified, true);
  for (const mode of ['pid', 'changed', 'executable', 'oversize', 'start', 'account']) {
    const fixture = snapshot(mode);
    assert.throws(() => vm.runInContext('mariaServiceSnapshot()', fixture.context));
  }
  for (const mode of ['owner', 'writable']) {
    const fixture = snapshot(mode),
      value = vm.runInContext('mariaServiceSnapshot()', fixture.context);
    assert.throws(() => value.canonical('/etc/mysql/my.cnf'));
  }
});

test('typed admin source emits deterministic plain JavaScript with the same diff behavior',async()=>{
 const bytes=await readAdminRuntimeModule('config-diff.mjs');assert.deepEqual(bytes,await readAdminRuntimeModule('config-diff.mjs'));
 const compiled=await import('data:text/javascript;base64,'+bytes.toString('base64'));const source=await import('../lib/config-diff.ts');
 for(const [before,after] of [['',''],['a\nb','a\nc'],['한국어\n둘째','한국어\n새 줄\n둘째']])assert.deepEqual(compiled.configDiff(before,after),source.configDiff(before,after));
 const consumer=(await readAdminRuntimeModule('nginx-config-restore-plan.mjs')).toString('utf8');assert(consumer.includes('./config-diff.mjs'));assert(!consumer.includes('./config-diff.ts'));
 await assert.rejects(readAdminRuntimeModule('../config-diff.mjs'),/Unapproved/);await assert.rejects(readAdminRuntimeModule('auth.ts'),/Unapproved/);
});
