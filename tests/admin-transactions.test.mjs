import { certificateExecution } from '../lib/certificate-execution.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const originalRequire = createRequire(import.meta.url);
const source = fs
  .readFileSync(new URL('../scripts/admin/linux-admin', import.meta.url), 'utf8')
  .replace(/^#!.*\n/, '')
  .split('main().catch')[0];
function fixture({ failCheck = false, failReload = false } = {}) {
  const files = new Map(),
    calls = [];
  const dirs = new Set(['/etc/nginx', '/etc/nginx/conf.d', '/var/lib/linux/admin']);
  const missing = () => Object.assign(new Error('Fixture missing'), { code: 'ENOENT' });
  const fakeFs = {
    lstatSync(name) {
      if (dirs.has(name)) return { uid: 0, mode: 0o755, isDirectory: () => true, isSymbolicLink: () => false };
      if (!files.has(name)) throw missing();
      return {
        uid: 0,
        mode: 0o600,
        nlink: 1,
        size: Buffer.byteLength(files.get(name)),
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
      };
    },
    readFileSync(name) {
      if (!files.has(name)) throw missing();
      return files.get(name);
    },
    writeFileSync(name, text, options) {
      if (options?.flag === 'wx' && files.has(name)) throw new Error('Fixture exists');
      files.set(name, text);
    },
    renameSync(from, to) {
      if (!files.has(from)) throw missing();
      files.set(to, files.get(from));
      files.delete(from);
    },
    unlinkSync(name) {
      if (!files.delete(name)) throw missing();
    },
    readdirSync(dir) {
      return [...files.keys()].filter((name) => name.startsWith(dir + '/')).map((name) => name.slice(dir.length + 1));
    },
  };
  const context = vm.createContext({
    require(name) {
      if (name === 'node:fs') return fakeFs;
      if (name === 'node:child_process')
        return {
          spawnSync(binary, args) {
            return { status: 0, stdout: this.execFileSync(binary, args), stderr: '' };
          },
          execFileSync(binary, args) {
            calls.push([binary, ...args]);
            if(binary==='/usr/bin/systemctl'&&args[0]==='show')return args.includes('--value')?'loaded\n':'LoadState=loaded\n';
            if (binary === '/usr/sbin/nginx' && ((args[0] === '-t' && failCheck) || (args[0] === '-s' && failReload)))
              throw new Error('Fixture nginx failure');
            return 'fixture command success\n';
          },
        };
      return originalRequire(name);
    },
    process,
    Buffer,
    certificateExecution,
  });
  vm.runInContext(source, context);
  // The root-owned import boundary is separately checked by admin-runtime.test.mjs.
  vm.runInContext('mariaRuntime=async()=>({certificateExecution})', context);
  return {
    files,
    calls,
    dispatch: (action, input) =>
      vm.runInContext(`dispatch(${JSON.stringify(action)},${JSON.stringify(input)})`, context),
  };
}
const site = { domain: 'fixture.example.com', port: 80, mode: 'proxy', upstreamPort: 3000, confirm: true };
const file = '/etc/nginx/conf.d/linux-fixture.example.com.conf';
const old = '# Managed by LINUX\nserver { listen 8080; }\n';
test('nginx apply backs up then checks and reloads, restoring old content on either failure', () => {
  for (const options of [{}, { failCheck: true }, { failReload: true }]) {
    const f = fixture(options);
    f.files.set(file, old);
    if (options.failCheck || options.failReload) {
      assert.throws(
        () =>
          f.dispatch('nginx-apply', { ...site, version: createHash('sha256').update(f.files.get(file)).digest('hex') }),
        /previous file restored/,
      );
      assert.equal(f.files.get(file), old);
    } else {
      assert.equal(
        f.dispatch('nginx-apply', { ...site, version: createHash('sha256').update(f.files.get(file)).digest('hex') })
          .applied,
        true,
      );
      assert.match(f.files.get(file), /listen 80;/);
    }
    const backups = [...f.files].filter(([name]) => name.endsWith('.json'));
    assert.equal(backups.length, 1);
    assert.equal(JSON.parse(backups[0][1]).text, old);
    assert.deepEqual(f.calls[0], ['/usr/sbin/nginx', '-t']);
    if (!options.failCheck) assert.deepEqual(f.calls[1], ['/usr/sbin/nginx', '-s', 'reload']);
  }
  const fresh = fixture({ failCheck: true });
  assert.throws(() => fresh.dispatch('nginx-apply', site));
  assert.equal(fresh.files.has(file), false);
});
test('nginx toggle rollback and backup restore reject stale versions without changing configuration', () => {
  const f = fixture({ failCheck: true });
  f.files.set(file, old);
  assert.throws(
    () =>
      f.dispatch('nginx-toggle', {
        domain: site.domain,
        enabled: false,
        confirm: true,
        version: createHash('sha256').update(old).digest('hex'),
      }),
    /previous filename restored/,
  );
  assert.equal(f.files.get(file), old);
  assert.equal(f.files.has(file + '.disabled'), false);
  const good = fixture();
  good.files.set(file, old);
  const { backup } = good.dispatch('nginx-backup', { domain: site.domain });
  const plan = good.dispatch('nginx-restore-plan', { id: backup.id });
  good.files.set(file, old + '# external edit\n');
  assert.throws(
    () => good.dispatch('nginx-restore', { id: backup.id, version: plan.version, confirm: true }),
    /Current config changed/,
  );
  assert.equal(good.calls.length, 0);
});
test('certificate helper uses fixed dry-run argv and rejects unsupported operations', async () => {
  const f = fixture();
  assert.throws(() => f.dispatch('certificate', { operation: 'renew-check', confirm: false, agree: true }));
  await assert.rejects(f.dispatch('certificate', { operation: 'renew;shutdown', confirm: true, agree: true }));
  assert.equal(f.calls.length, 0);
  await f.dispatch('certificate', { operation: 'renew-check', confirm: true, agree: true });
  assert.deepEqual(f.calls, [['/usr/bin/certbot', 'renew', '--dry-run', '--non-interactive', '--no-random-sleep-on-renew']]);
});

test('successful nginx restore backs up current content before restoring the selected snapshot', () => {
  const f = fixture();
  f.files.set(file, old);
  const { backup } = f.dispatch('nginx-backup', { domain: site.domain });
  f.dispatch('nginx-apply', { ...site, version: createHash('sha256').update(f.files.get(file)).digest('hex') });
  const changed = f.files.get(file);
  const plan = f.dispatch('nginx-restore-plan', { id: backup.id });
  assert.equal(plan.current, changed);
  assert.equal(f.dispatch('nginx-restore', { id: backup.id, version: plan.version, confirm: true }).restored, true);
  assert.equal(f.files.get(file), old);
  const history = [...f.files].filter(([name]) => name.endsWith('.json')).map(([, text]) => JSON.parse(text));
  assert(history.some((record) => record.text === changed));
});
test('package and daemon helpers execute only the fixed reviewed targets', () => {
  const f = fixture();
  f.dispatch('install', { packages: ['nginx', 'certbot', 'nodejs', 'postgresql', 'mariadb', 'redis'], confirm: true });
  assert.deepEqual(f.calls[0], [
    '/usr/bin/apt-get',
    'install',
    '--yes',
    '--no-remove',
    '--no-upgrade',
    'nginx',
    'certbot',
    'python3-certbot-nginx',
    'nodejs',
    'npm',
    'postgresql',
    'mariadb-server',
    'redis-server',
  ]);
  f.dispatch('service', { unit: 'nginx.service', action: 'restart', confirm: true });
  assert.equal(f.calls[1][0],'/usr/bin/systemctl');assert.equal(f.calls[1][1],'show');assert.equal(f.calls[1][2],'nginx.service');
  assert.deepEqual(f.calls[2], ['/usr/sbin/nginx', '-t']);
  assert.deepEqual(f.calls[3], ['/usr/bin/systemctl', '--no-ask-password', 'restart', 'nginx.service']);
});

test('HTTPS app edits preserve certificate and redirect blocks and reject unreviewed or stale changes', () => {
  const f = fixture();
  const tls =
    '# Managed by LINUX\nserver {\n    listen 443 ssl;\n    server_name fixture.example.com;\n    ssl_certificate /etc/letsencrypt/live/fixture.example.com/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/fixture.example.com/privkey.pem;\n\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n    }\n}\nserver {\n    listen 80;\n    server_name fixture.example.com;\n    return 301 https://$host$request_uri;\n}\n';
  f.files.set(file, tls);
  assert.throws(() => f.dispatch('nginx-apply', { ...site, port: 443, upstreamPort: 4000 }), /Current config changed/);
  const version = createHash('sha256').update(tls).digest('hex');
  assert.throws(() => f.dispatch('nginx-apply', { ...site, port: 80, version }), /HTTPS listen port/);
  f.dispatch('nginx-apply', { ...site, port: 443, upstreamPort: 4000, version });
  const edited = f.files.get(file);
  assert(edited.includes('proxy_pass http://127.0.0.1:4000;'));
  assert(edited.includes('ssl_certificate /etc/letsencrypt/live/fixture.example.com/fullchain.pem;'));
  assert(edited.includes('ssl_certificate_key /etc/letsencrypt/live/fixture.example.com/privkey.pem;'));
  assert(
    edited.endsWith(
      'server {\n    listen 80;\n    server_name fixture.example.com;\n    return 301 https://$host$request_uri;\n}\n',
    ),
  );
  assert.throws(() => f.dispatch('nginx-apply', { ...site, port: 443, version }), /Current config changed/);
});
test('helper upload limit matches GUI rendering and rejects invalid input without mutation', () => {
  for (const bodySize of [0, '128', 65536]) {
    const f = fixture();
    f.dispatch('nginx-apply', { ...site, bodySize });
    assert(f.files.get(file).includes(`client_max_body_size ${Number(bodySize)}m;`));
  }
  for (const bodySize of [true, null, [], [1], '', '1e2', -1, 65537]) {
    const f = fixture();
    assert.throws(() => f.dispatch('nginx-apply', { ...site, bodySize }));
    assert.equal(f.files.size, 0);
    assert.equal(f.calls.length, 0);
  }
});
test('helper proxy timeouts render and reject invalid or static settings before mutation', () => {
  const f = fixture();
  f.dispatch('nginx-apply', { ...site, connectTimeout: 10, readTimeout: '120' });
  assert.match(f.files.get(file), /proxy_connect_timeout 10s;/);
  assert.match(f.files.get(file), /proxy_read_timeout 120s;/);
  for (const input of [
    { connectTimeout: true },
    { readTimeout: 0 },
    { readTimeout: 3601 },
    { mode: 'static', root: '/var/www/html', connectTimeout: 10 },
  ]) {
    const bad = fixture();
    assert.throws(() => bad.dispatch('nginx-apply', { ...site, ...input }));
    assert.equal(bad.files.size, 0);
    assert.equal(bad.calls.length, 0);
  }
});
test('GUI helper refuses to silently erase custom location directives', () => {
  const f = fixture();
  const previous =
    '# Managed by LINUX\nserver {\n listen 80;\n server_name fixture.example.com;\n location / {\n  proxy_pass http://127.0.0.1:3000;\n  add_header X-Custom preserved;\n }\n}\n';
  f.files.set(file, previous);
  assert.throws(
    () => f.dispatch('nginx-apply', { ...site, version: createHash('sha256').update(previous).digest('hex') }),
    /cannot preserve/,
  );
  assert.equal(f.files.get(file), previous);
  assert.equal(f.calls.length, 0);
  assert.equal(f.files.size, 1);
});
test('certificate helper validates targeted renewal independently', async () => {
  const f = fixture();
  await f.dispatch('certificate', {
    operation: 'renew-check',
    certName: 'example.com-0001',
    confirm: true,
    agree: true,
  });
  assert.deepEqual(f.calls, [['/usr/bin/certbot', 'renew', '--dry-run', '--non-interactive', '--no-random-sleep-on-renew', '--cert-name', 'example.com-0001']]);
  for (const certName of ['', null, true, '--evil', '../x', 'x;id']) {
    const bad = fixture();
    await assert.rejects(
      bad.dispatch('certificate', { operation: 'renew-check', certName, confirm: true, agree: true }),
    );
    assert.equal(bad.calls.length, 0);
  }
});

test('nginx toggles require the exact active or disabled source version before backup or rename', () => {
  const version = createHash('sha256').update(old).digest('hex');
  for (const enabled of [false, true]) {
    const original = enabled ? file + '.disabled' : file;
    for (const supplied of [undefined, 'invalid', '0'.repeat(64)]) {
      const f = fixture();
      f.files.set(original, old);
      assert.throws(
        () => f.dispatch('nginx-toggle', { domain: site.domain, enabled, confirm: true, version: supplied }),
        (error) => error.status === (supplied === '0'.repeat(64) ? 409 : 400),
      );
      assert.deepEqual([...f.files], [[original, old]]);
      assert.deepEqual(f.calls, []);
    }
    const f = fixture();
    f.files.set(original, old);
    assert.equal(f.dispatch('nginx-toggle', { domain: site.domain, enabled, confirm: true, version }).enabled, enabled);
    assert.equal(f.files.get(enabled ? file : file + '.disabled'), old);
    assert.equal([...f.files].filter(([name]) => name.endsWith('.json')).length, 1);
  }
});
