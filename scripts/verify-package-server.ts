import {jsonRecord,recordField,listField,textField} from './verification/http-json.ts';
import {createPackageServerHarness} from './verification/package-server-harness.ts';
import {verifyPackageTerminalStream,verifyPackageStreamRevocation} from './verification/package-terminal-events.ts';
import {verifyPackagedCatalog,packageAccountSetup} from './verification/package-assets.ts';
import { translate } from '../lib/i18n.ts';
import { verifyAuditPagination } from './verification/audit-pagination.ts';
import { assertPageRedirect } from './verification/page-redirect.ts';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { userInfo } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
export async function verifyPackageServer(app:string, root:string, { terminal = false }:{terminal?:boolean} = {}) {
  const harness=await createPackageServerHarness(app,root,{terminal});
  const {port,env,cliFile,fixtureHome,packageFetch}=harness;
  try {
    await harness.waitReady();
    const get = (route:string) =>
      packageFetch(`http://127.0.0.1:${port}${route}`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const login = await get('/login');
    assert.equal(login.status, 200);
    const html = await login.text();
    assert(
      html.includes('type="password"') && html.includes('autoComplete="current-password"'),
      'Missing packaged login form',
    );
    assert(html.includes('src="/theme-init.js"'), 'Missing external theme bootstrap');
    const theme = await get('/theme-init.js');
    assert.equal(theme.status, 200);
    assert.equal(await theme.text(), await readFile(path.join(app, 'public/theme-init.js'), 'utf8'));
    assert(
      Boolean(login.headers.get('content-security-policy'))&&!login.headers.get('content-security-policy')?.includes('unsafe-eval'),
      'Development CSP leaked into production',
    );
    // The unopened picker intentionally omits the complete option list.
    // Select this locale server-side to test its fixed label on the trigger.
    const afar = await packageFetch(`http://127.0.0.1:${port}/login`, {
      headers: { Cookie: 'linux-language=aa-DJ' },
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(afar.status, 200);
    const afarHtml = await afar.text();
    assert(afarHtml.includes('<html lang="aa-DJ" dir="ltr"'), 'Selected Afar locale differs');
    assert(afarHtml.includes('Afar (Djibouti)'), 'Server login language labels differ from the fixed catalog');
    for (const [cookieValue, browserLanguages, locale, direction] of [
      ['ka-GE', 'ja-JP', 'ka-GE', 'ltr'],
      ['ar-SA', 'en-US', 'ar-SA', 'rtl'],
      ['ja-JP', 'en-US', 'ja-JP', 'ltr'],
      [null, 'en-US;q=0.4,ja-JP;q=0.9', 'ja-JP', 'ltr'],
      ['not-a-locale', 'de;q=0.8,en;q=0.4', 'de', 'ltr'],
      [null, 'en', 'en', 'ltr'],
    ]) {
      const headers:Record<string,string> = { 'Accept-Language': browserLanguages??'' };
      if (cookieValue) headers.Cookie = 'linux-language=' + cookieValue;
      const localized = await packageFetch(`http://127.0.0.1:${port}/login`, { headers, signal: AbortSignal.timeout(5000) });
      assert.equal(localized.status, 200);
      const localizedHtml = await localized.text();
      assert(
        localizedHtml.includes('<html lang="' + locale + '" dir="' + direction + '"'),
        'Initial HTML locale differs: ' + locale,
      );
      assert(
        localizedHtml.includes('<h2>' + translate(locale, '관리자 로그인') + '</h2>'),
        'Initial login translation differs: ' + locale,
      );
    }
    const scriptPaths = [
      ...new Set(
        [...html.matchAll(/<script\b[^>]*\bsrc="(\/_next\/static\/[^"?]+\.js(?:\?[^" ]*)?)"/g)].map(
          (match) => match[1],
        ),
      ),
    ];
    assert(scriptPaths.length > 0, 'Missing login client scripts');
    const clientScripts = await Promise.all(
      scriptPaths.map(async (route:string) => {
        const response = await get(route);
        assert.equal(response.status, 200, 'Missing packaged client script');
        return response.text();
      }),
    );
    assert(
      clientScripts.some((source) => source.includes('Afar (Djibouti)')),
      'Client login language labels differ from the fixed catalog',
    );
    // Non-selected catalogs are lazy chunks, rather than initial login scripts.
    const servedCatalog=(phrases:readonly string[])=>verifyPackagedCatalog(app,phrases,get);
    await servedCatalog(['Selecionar idioma']);
    await servedCatalog(['接続規則の復旧確認', '現在のページの最大 100 件']);
    const status = await get('/api/auth/status');
    assert.equal(status.status, 200);
    const state = jsonRecord(await status.json());
    assert.equal(state.configured, false);
    assert.equal(state.authenticated, false);
    for (const route of [
      ...['nginx', 'certbot', 'nodejs', 'postgresql', 'mariadb', 'redis'].map((kind) => '/ide/packages/' + kind),
      '/terminal',
    ]) {
      const response = await get(route);
      await assertPageRedirect(response, '/login?next=' + encodeURIComponent(route));
    }
    const denied = await get('/api/status');
    assert.equal(denied.status, 401);
    for (const route of [
      '/api/config-source?kind=postgresql&path=%2Fetc%2Fpostgresql%2F16%2Fmain%2Fpostgresql.conf',
      '/api/node-app-env?id=fixture-app',
      '/api/node-app-service-status?id=fixture-app',
      '/api/mariadb-recovery-plan?root=%2Fetc%2Fmysql%2Fmy.cnf&target=%2Fetc%2Fmysql%2Fconf.d%2Fserver.cnf',
      '/api/nginx-recovery-plan?path=%2Fetc%2Fnginx%2Fnginx.conf',
      '/api/redis-recovery-plan',
      '/api/node-app-service-recovery-plan?id=fixture-app',
      '/api/node-app-logs?id=fixture-app',
    ])
      assert.equal((await get(route)).status, 401);
    const username = 'package-fixture',
      password = 'Fixture-' + randomUUID();
    const setup = packageAccountSetup(app,username,password);
    await promisify(execFile)(process.execPath, ['--input-type=module', '-e', setup], {
      cwd: app,
      env: { ...env, LINUX_AUTH_ROOT: path.join(root, 'isolated-auth') },
      timeout: 10000,
    });
    const base = `http://127.0.0.1:${port}`;
    const signIn = await packageFetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(signIn.status, 200);
    let cookie = signIn.headers.get('set-cookie')?.split(';')[0]??'';
    assert(cookie?.startsWith('linux_session='));
    const authGet = (route:string) =>
      packageFetch(base + route, { headers: { Cookie: cookie }, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const post = (route:string, body:unknown) =>
      packageFetch(base + route, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
    assert.equal((await packageFetch(base + '/api/terminal-context', { signal: AbortSignal.timeout(5000) })).status, 401);
    const context = jsonRecord(await (await authGet('/api/terminal-context')).json());
    assert.equal(typeof context.username, 'string');
    assert.equal(context.shell, userInfo().shell || '/bin/bash');
    assert(Array.isArray(context.sessions));
    assert.equal(recordField(recordField(context,'commands'),'codex').available, true);
    assert.equal(recordField(recordField(context,'commands'),'codex').path, cliFile);
    for (const command of ['codex', 'claude']) {
      assert.equal(typeof recordField(recordField(context,'commands'),command).available, 'boolean');
      const commandPath=recordField(recordField(context,'commands'),command).path;assert(commandPath===null||typeof commandPath==='string'&&path.isAbsolute(commandPath));
    }
    const logged = jsonRecord(await (await authGet('/api/auth/status')).json());
    assert.equal(logged.authenticated, true);
    assert.equal(logged.username, username);
    const auditCheck = await verifyAuditPagination({
      file: path.join(root, 'isolated-state/audit.jsonl'),
      authGet,
      get,
    });
    for (const action of [
      'postgresql-code-restore-plan',
      'postgresql-code-restore',
      'postgresql-code-recovery-plan',
      'postgresql-code-recover',
      'postgresql-code-plan',
      'postgresql-code-apply',
      'mariadb-code-plan',
      'mariadb-code-apply',
      'redis-code-plan',
      'redis-code-apply',
      'mariadb-recover',
      'nginx-recover',
      'redis-recover',
      'node-app-service-recover',
      'postgresql-hba-recover',
      'postgresql-hba-operation-plan',
      'postgresql-hba-operation',
      'postgresql-hba-validate',
      'postgresql-hba-backup',
      'nginx-config-backup',
      'nginx-check',
      'redis-config-validate',
      'redis-config-apply',
      'redis-config-restore',
      'nginx-config-apply',
      'nginx-config-restore',
      'nginx-config-restore-plan',
    ]) {
      assert.equal((await post('/api/' + action, {})).status, 403);
      assert.equal(
        (
          await packageFetch(base + '/api/' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
            signal: AbortSignal.timeout(5000),
          })
        ).status,
        401,
      );
    }
    for (const action of [
      'postgresql-code-restore-plan',
      'postgresql-code-restore',
      'postgresql-code-recovery-plan',
      'postgresql-code-recover',
    ]) {
      const payload = { path: '/etc/postgresql/16/main/postgresql.conf' };
      assert.equal((await post('/api/' + action, payload)).status, 403);
      const crossed = await packageFetch(base + '/api/' + action, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(crossed.status, 403);
    }
    for (const action of [
      'postgresql-code-plan',
      'postgresql-code-apply',
      'mariadb-code-plan',
      'mariadb-code-apply',
      'redis-code-plan',
      'redis-code-apply',
    ]) {
      const payload = {
        ...(action.startsWith('mariadb-')
          ? { root: '/etc/mysql/my.cnf', path: '/etc/mysql/conf.d/server.cnf' }
          : {
              path: action.startsWith('postgresql-')
                ? '/etc/postgresql/16/main/postgresql.conf'
                : '/etc/redis/redis.conf',
            }),
        version: 'a'.repeat(64),
        text: '# ' + 'x'.repeat(20000) + '\nsave 300 10\n',
      };
      assert.equal(
        (await post('/api/' + action, payload)).status,
        403,
        'complete code body must reach permission gating without an old 8KiB limit',
      );
      const crossed = await packageFetch(base + '/api/' + action, {
        method: 'POST',
        headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(crossed.status, 403);
    }
    for (const action of [
      'postgresql-hba-backups',
      'postgresql-hba-restore-draft',
      'redis-context',
      'nginx-context',
      'nginx-config-backups',
    ]) {
      assert.equal((await authGet('/api/' + action)).status, 403);
      assert.equal((await packageFetch(base + '/api/' + action, { signal: AbortSignal.timeout(5000) })).status, 401);
    }
    const policyInput = { passwordless: true, actions: ['nginx-apply', 'node-service-inspect'] };
    assert.equal((await packageFetch(base + '/api/sudo-policy-actions', { signal: AbortSignal.timeout(5000) })).status, 401);
    assert(stringArray(jsonRecord(await (await authGet('/api/sudo-policy-actions')).json()).actions).includes('nginx-apply'));
    const policyResponse = await post('/api/sudo-policy-plan', policyInput);
    assert.equal(policyResponse.status, 200);
    const policyDraft = jsonRecord(await policyResponse.json());
    assert.equal(policyDraft.uid, process.getuid?.());
    assert.equal(policyDraft.applied, false);
    assert.equal(stringArray(policyDraft.actions).length, 2);
    assert(textField(policyDraft,'text').includes('NOPASSWD: /usr/lib/tastedev-linux/scripts/admin/linux-admin nginx-apply'));
    assert(!textField(policyDraft,'text').includes('NOPASSWD: ALL'));
    assert.equal((await post('/api/sudo-policy-plan', { ...policyInput, username: 'root' })).status, 400);
    assert.equal(
      (
        await packageFetch(base + '/api/sudo-policy-plan', {
          method: 'POST',
          headers: { Origin: base, 'Content-Type': 'application/json' },
          body: JSON.stringify(policyInput),
          signal: AbortSignal.timeout(5000),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await packageFetch(base + '/api/sudo-policy-plan', {
          method: 'POST',
          headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
          body: JSON.stringify(policyInput),
          signal: AbortSignal.timeout(5000),
        })
      ).status,
      403,
    );
    for (const kind of ['nginx', 'certbot', 'nodejs', 'postgresql', 'mariadb', 'redis']) {
      const response = await authGet('/ide/packages/' + kind);
      assert.equal(response.status, 200);
      if (['certbot', 'postgresql'].includes(kind)) {
        const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        const inventory = jsonRecord(await (await authGet('/api/status')).json());
        if (listField(inventory,'packages').some((item) => item.id === kind && item.installed)) {
          const response = await authGet(kind === 'certbot' ? '/api/certificates' : '/api/config-live?kind=postgresql');
          assert.equal(response.status, 200);
          const data = jsonRecord(await response.json()),
            files = listField(data,kind === 'certbot'?'certificates':'configs');
          assert(html.includes('왼쪽 노드를 선택하세요.'), 'Initial package inspector must not preselect a file');
          const escape = (value:string) =>
            value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
          for (const file of files)
            assert(
              html.includes('title="' + escape(typeof file.path==='string'?file.path:textField(file,'name')) + '"'),
              'A discovered package file is missing from the initial HTTP HTML',
            );
        }
      }
      if (kind === 'nginx') {
        // Inspect the actual HTTP HTML without executing client scripts.
        const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        const inventory = jsonRecord(await (await authGet('/api/status')).json());
        if (listField(inventory,'packages').some((item) => item.id === 'nginx' && item.installed)) {
          const tree = jsonRecord(await (await authGet('/api/nginx-tree')).json());
          assert(
            html.includes('nginx-tree-empty') && html.includes('왼쪽 노드를 선택하세요.'),
            'Initial nginx inspector must be server-rendered without selecting a node',
          );
          const treeHtml = /<nav\b[^>]*aria-label="nginx 설정 트리"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1];
          assert(treeHtml, 'Missing SSR nginx tree container');
          assert(!treeHtml.includes('불러오는 중'), 'SSR nginx tree must not render its client loading placeholder');
          const escape = (value:string) =>
            value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
          for (const file of listField(tree,'files'))
            assert(
              html.includes('title="' + escape(typeof file.linkTarget==='string'?file.linkTarget:textField(file,'path')) + '"'),
              'A discovered config file is missing from the initial HTTP HTML',
            );
        }
      }
    }
    const missingPackage = await authGet('/ide/packages/unsupported-package');
    assert([200, 404].includes(missingPackage.status));
    const missingHtml = await missingPackage.text();
    assert(/<h1\b[^>]*>404<\/h1>/.test(missingHtml) ||
      /<template\b[^>]*data-dgst="NEXT_HTTP_ERROR_FALLBACK;404"/.test(missingHtml),
      'Unsupported package must carry the exact 404 boundary');
    assert(/<meta\b[^>]*name="robots"[^>]*content="noindex"/.test(missingHtml),
      'Unsupported package must carry the not-found noindex marker');
    const draft = { kind: 'nodejs', port: 3145, host: '::1', memory: 128, environment: 'production', logLevel: 'warn' };
    assert.equal((await post('/api/config-save', draft)).status, 403);
    assert.equal((await post('/api/node-app-env', { id: 'fixture-app', confirm: true })).status, 403);
    const security = jsonRecord(await (await authGet('/api/security')).json());
    assert.equal(
      (
        await post('/api/security', {
          version: security.version,
          settings: {
            ...recordField(security,'settings'),
            readOnly: false,
            fileEditing: true,
            ...(terminal ? { terminal: true } : {}),
          },
        })
      ).status,
      200,
    );
    const saved = await post('/api/config-save', draft);
    assert.equal(saved.status, 200);
    const record = jsonRecord(await saved.json());
    assert(/^nodejs-draft-[a-f0-9-]+\.env$/.test(textField(record,'name')));
    assert(textField(record,'text').includes('HOST=::1\n'));
    if (terminal) {
      assert.equal(
        (
          await packageFetch(base + '/api/terminal', {
            method: 'POST',
            headers: { Origin: base, 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'true', pty: true }),
          })
        ).status,
        401,
      );
      const foreign = await packageFetch(base + '/api/terminal', {
        method: 'POST',
        headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'true', pty: true }),
      });
      assert.equal(foreign.status, 403);
      assert.equal((await post('/api/terminal', { command: 'true', pty: 'true' })).status, 400);
      for (const timeoutSeconds of [null, '120', 0, 3601, 1.5])
        assert.equal((await post('/api/terminal', { command: 'true', pty: true, timeoutSeconds })).status, 400);
      const started = await post('/api/terminal', {
        command: 'test -t 0 && read -r line && printf "HTTP_INPUT_BYTES:%s\\n" "${#line}" && stty size',
        pty: true,
      });
      assert.equal(started.status, 202);
      const job=packageJobPayload(jsonRecord(await started.json()));
      assert.equal(job.pty, true);
      assert.equal(job.timeoutSeconds, 120);
      let resized;
      for (let attempt = 0; attempt < 20; attempt++) {
        resized = await post('/api/terminal-resize', { id: job.id, cols: 100, rows: 30 });
        if (resized.status === 200) break;
        assert.equal(resized.status, 409);
        await delay(20);
      }
      assert(resized);assert.equal(resized.status, 200);
      assert.equal((await post('/api/terminal-resize', { id: job.id, cols: '100', rows: 30 })).status, 400);
      assert.equal((await post('/api/terminal-input', { id: job.id, text: 'private-fixture-input\n' })).status, 200);
      let completed;
      for (let count = 0; count < 100; count++) {
        completed = packageJobPayload((jsonRecord(await (await authGet('/api/terminal?job=' + job.id)).json())));
        if (completed.status !== 'running') break;
        await delay(20);
      }
      assert(completed);assert.equal(completed.status, 'success');
      assert.equal(completed.exitCode, 0);
      const output = completed.logs.map((item) => item.text).join('');
      assert(output.includes('HTTP_INPUT_BYTES:21'));
      assert(output.includes('30 100'));
      assert.equal((await post('/api/terminal-resize', { id: job.id, cols: 80, rows: 24 })).status, 409);
      assert(!output.includes('private-fixture-input'));
      assert.equal((await post('/api/terminal-input', { id: job.id, text: 'late' })).status, 409);
    }
    if (terminal) {
      const response = await post('/api/terminal', {
        command: 'account-shell',
        pty: true,
        sessionMode: 'tab',
        timeoutSeconds: 30,
      });
      assert.equal(response.status, 202);
      const shell = packageJobPayload((jsonRecord(await response.json()))),
        ready = 'HTTP_SHELL_READY_' + randomUUID(),
        typed = 'HTTP_ECHO_' + randomUUID() + '_abc한글';
      const output = async () => {
        const current = packageJobPayload((jsonRecord(await (await authGet('/api/terminal?job=' + shell.id)).json())));
        assert.equal(current.status, 'running', 'Packaged default account shell exited before input verification');
        return current.logs
          .map((entry) => entry.text)
          .join('')
          .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
          .replaceAll('\r', '');
      };
      // The installing account's interactive profile can take several seconds to
      // initialize (for example a Conda environment). Keep verifying its live job
      // and actual output; a fixed 100 x 20ms loop rejects healthy default shells.
      async function waitFor(check:(text:string)=>boolean, phase:string) {
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          const text = await output();
          if (check(text)) return text;
          await delay(20);
        }
        assert.fail('Packaged interactive shell timed out: ' + phase);
      }
      try {
        assert.equal(shell.username, userInfo().username);
        assert.equal(
          (await post('/api/terminal-input', { id: shell.id, text: "printf '\\n%s\\n' '" + ready + "'\r" })).status,
          200,
        );
        await waitFor((text) => text.includes('\n' + ready + '\n'), 'default account profile readiness');
        assert.equal(
          (await post('/api/terminal-input', { id: shell.id, text: "printf '\\n%s\\n' '" + typed + "'" })).status,
          200,
        );
        const pending = await waitFor((text) => text.includes(typed), 'English/Korean echo before Enter');
        assert(!pending.includes('\n' + typed + '\n'), 'Packaged shell executed incomplete input before Enter');
        assert.equal((await post('/api/terminal-input', { id: shell.id, text: '\r' })).status, 200);
        const executed = await waitFor((text) => text.includes('\n' + typed + '\n'), 'single execution after Enter');
        assert.equal(executed.split('\n' + typed + '\n').length - 1, 1, 'Packaged shell executed input more than once');
      } finally {
        await post('/api/stop', { id: shell.id });
      }
    }
    if (terminal) {
      assert.equal(
        (await packageFetch(base + '/api/terminal-events?job=missing', { signal: AbortSignal.timeout(5000) })).status,
        401,
      );
      assert.equal((await authGet('/api/terminal-events?job=missing')).status, 404);
      const started = await post('/api/terminal', {
        command: "/bin/bash -c 'printf SSE_READY; read -t 20 -r line; printf SSE_DONE'",
        pty: true,
      });
      assert.equal(started.status, 202);
      const job = packageJobPayload((jsonRecord(await started.json())));
      const response = await packageFetch(base + '/api/terminal-events?job=' + job.id + '&since=0', {
        headers: { Cookie: cookie },
        redirect: 'manual',
        signal: AbortSignal.timeout(30000),
      });
      await verifyPackageTerminalStream(response,async()=>{assert.equal((await post('/api/terminal-input',{id:job.id,text:'stream-private-input\n'})).status,200);});
    }
    if (terminal) {
      const expected = 'a'.repeat(7999) + '😀한글'.repeat(12000) + 'HTTP_OUTPUT_TAIL',
        file = path.join(root, 'isolated-workspace', 'large-output.mjs'),
        quote = (value:string) => "'" + value.replaceAll("'", "'\\''") + "'";
      await writeFile(file, 'process.stdout.write(' + JSON.stringify(expected) + ');', { mode: 0o600 });
      const response = await post('/api/terminal', { command: quote(process.execPath) + ' ' + quote(file), pty: true });
      assert.equal(response.status, 202);
      const started = packageJobPayload((jsonRecord(await response.json())));
      let finished;
      for (let attempt = 0; attempt < 100; attempt++) {
        finished = packageJobPayload((jsonRecord(await (await authGet('/api/terminal?job=' + started.id)).json())));
        if (finished.status !== 'running') break;
        await delay(20);
      }
      assert(finished);assert.equal(finished.status, 'success');
      assert.equal(
        finished.logs.map((entry) => entry.text).join(''),
        expected,
        'packaged PTY dropped large Unicode output',
      );
      assert(
        finished.logs.every(
          (entry) =>
            entry.text.length <= 8000 && !/[\uD800-\uDBFF]$/.test(entry.text) && !/^[\uDC00-\uDFFF]/.test(entry.text),
        ),
      );
    }
    if (terminal) {
      const quote = (value:string) => "'" + value.replaceAll("'", "'\\''") + "'";
      // Explicit fixture rcfile avoids executing the real user's startup files or AI CLI.
      const command =
        '/bin/bash --noprofile --rcfile ' +
        quote(path.join(fixtureHome, '.bashrc')) +
        ' -ic \'printf "ACCOUNT:%s:%s:%s\\n" "$HOME" "$USER" "$LOGNAME"; exec tastedev-cli-fixture\'';
      const response = await post('/api/terminal', { command, pty: true, sessionMode: 'tab' });
      assert.equal(response.status, 202);
      const launched = packageJobPayload((jsonRecord(await response.json())));
      assert.equal(launched.command, command);
      assert.equal(launched.pty, true);
      let finished;
      for (let attempt = 0; attempt < 100; attempt++) {
        finished = packageJobPayload((jsonRecord(await (await authGet('/api/terminal?job=' + launched.id)).json())));
        if (finished.status !== 'running') break;
        await delay(20);
      }
      assert(finished);assert.equal(finished.status, 'success');
      assert.equal(finished.exitCode, 0);
      assert(
        finished.logs.some((entry) => entry.text.includes('HTTP_CLI_PROFILE_READY')),
        'Custom shell did not load the isolated Bash rcfile',
      );
      const account = userInfo();
      assert(
        finished.logs
          .map((entry) => entry.text)
          .join('')
          .includes('ACCOUNT:' + account.homedir + ':' + account.username + ':' + account.username),
        'Packaged terminal inherited a different launcher account',
      );
    }
    if (terminal) {
      const limitedResponse = await post('/api/terminal', { command: 'sleep 30', pty: true, timeoutSeconds: 1 });
      assert.equal(limitedResponse.status, 202);
      const limited = packageJobPayload((jsonRecord(await limitedResponse.json())));
      assert.equal(limited.timeoutSeconds, 1);
      let expired;
      for (let count = 0; count < 150; count++) {
        expired = packageJobPayload((jsonRecord(await (await authGet('/api/terminal?job=' + limited.id)).json())));
        if (expired.status !== 'running') break;
        await delay(20);
      }
      assert(expired);assert.equal(expired.status, 'failed');
      assert(expired.logs.some((entry) => entry.text.includes('1초 실행 제한')));
    }
    const certDraft = await post('/api/config-plan', {
      kind: 'certbot',
      operation: 'renew-check',
      certName: 'fixture.example.com-0001',
    });
    assert.equal(certDraft.status, 200);
    assert.equal(
      (jsonRecord(await certDraft.json())).text,
      '/usr/bin/certbot renew --dry-run --non-interactive --no-random-sleep-on-renew --cert-name fixture.example.com-0001\n',
    );
    const allCertDraft = await post('/api/config-plan', { kind: 'certbot', operation: 'renew-check' });
    assert.equal(allCertDraft.status, 200);
    assert.equal((jsonRecord(await allCertDraft.json())).text, '/usr/bin/certbot renew --dry-run --non-interactive --no-random-sleep-on-renew\n');
    for (const certName of [null, '../bad', '--force-renewal', 'a;id'])
      assert.equal(
        (await post('/api/config-plan', { kind: 'certbot', operation: 'renew-check', certName })).status,
        400,
      );
    for (const authenticator of ['nginx', 'webroot', 'standalone']) {
      const plan = await post('/api/certbot-plan', {
        domain: 'fixture.example.com',
        email: 'admin@example.com',
        authenticator,
        webroot: '/var/www/html',
        staging: true,
      });
      assert.equal(plan.status, 200);
      const command=stringArray(jsonRecord(await plan.json()).command);
      assert(command.includes('--' + authenticator));
      assert.equal(command.includes('--redirect'), authenticator === 'nginx');
      assert.equal(command.includes('certonly'), authenticator !== 'nginx');
    }
    assert.equal(
      (
        await post('/api/certbot-plan', {
          domain: 'fixture.example.com',
          email: 'admin@example.com',
          authenticator: 'webroot',
          webroot: '/etc',
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post('/api/certbot-issue', {
          domain: 'fixture.example.com',
          email: 'admin@example.com',
          authenticator: 'standalone',
          confirm: true,
          agree: true,
        })
      ).status,
      403,
    );
    const renewPlan = await post('/api/certbot-plan', {
      operation: 'renew-check',
      certName: 'fixture.example.com-0001',
    });
    assert.equal(renewPlan.status, 200);
    assert.deepEqual((jsonRecord(await renewPlan.json())).command, [
      '/usr/bin/certbot',
      'renew',
      '--dry-run',
      '--non-interactive',
      '--no-random-sleep-on-renew',
      '--cert-name',
      'fixture.example.com-0001',
    ]);
    assert.equal((await post('/api/certbot-plan', { operation: 'renew-check', certName: '../bad' })).status, 400);
    const nginxDraft = {
      domain: 'verify-' + randomUUID() + '.invalid',
      port: 8080,
      mode: 'proxy',
      upstreamPort: 3145,
      root: '/var/www/html',
      bodySize: 64,
      connectTimeout: 10,
      readTimeout: 120,
    };
    const nginxPreviewResponse = await post('/api/nginx-plan', nginxDraft);
    assert.equal(nginxPreviewResponse.status, 200);
    const nginxPreview = jsonRecord(await nginxPreviewResponse.json());
    assert(textField(nginxPreview,'config').includes('listen 8080;'));
    assert(textField(nginxPreview,'config').includes('proxy_pass http://127.0.0.1:3145;'));
    assert(textField(nginxPreview,'config').includes('client_max_body_size 64m;'));
    assert(textField(nginxPreview,'config').includes('proxy_connect_timeout 10s;'));
    assert(textField(nginxPreview,'config').includes('proxy_read_timeout 120s;'));
    assert.equal((await post('/api/nginx-plan', { ...nginxDraft, bodySize: true })).status, 400);
    assert.equal((await post('/api/nginx-plan', { ...nginxDraft, readTimeout: 0 })).status, 400);
    assert.equal((await post('/api/nginx-plan', { ...nginxDraft, port: true })).status, 400);
    assert.equal((await post('/api/nginx-plan', { ...nginxDraft, upstreamPort: [3145] })).status, 400);
    assert.equal((await post('/api/nginx-apply', { ...nginxDraft, confirm: true })).status, 403);
    const anonymousValidation = await packageFetch(base + '/api/nginx-validate', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(nginxDraft),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(anonymousValidation.status, 401);
    const crossOriginValidation = await packageFetch(base + '/api/nginx-validate', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify(nginxDraft),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(crossOriginValidation.status, 403);
    const validationResponse = await post('/api/nginx-validate', nginxDraft);
    assert.equal(validationResponse.status, 200);
    const validation = jsonRecord(await validationResponse.json());
    assert.equal(validation.scope, 'isolated-http-draft');
    assert.equal(validation.serviceChanged, false);
    assert.equal(validation.valid, true, 'Native nginx draft validation failed');
    assert.equal((await post('/api/nginx-validate', { ...nginxDraft, version: 'existing' })).status, 400);
    const content = jsonRecord(await (await authGet('/api/file?name=' + encodeURIComponent(textField(record,'name')))).json());
    assert.equal(content.text, record.text);
    assert.equal(content.version, record.version);
    assert.equal(await readFile(path.join(root, 'isolated-workspace', textField(record,'name')), 'utf8'), record.text);
    const marker = 'fixture-backup-secret',
      seed = record.text + 'API_KEY=' + marker + '\n';
    const seeded = await post('/api/file', { name: record.name, version: record.version, text: seed });
    assert.equal(seeded.status, 200);
    const snapshot = jsonRecord(await (await authGet('/api/node-env?name=' + encodeURIComponent(textField(record,'name')))).json());
    assert(!JSON.stringify(snapshot).includes(marker));
    assert.equal(snapshot.skipped, 1);
    const updated = await post('/api/node-env', {
      name: record.name,
      version: snapshot.version,
      changes: { port: 3200 },
      confirm: true,
    });
    assert.equal(updated.status, 200);
    const updatedRecord = jsonRecord(await updated.json());
    assert(updatedRecord.backupId);
    assert.equal(recordField(updatedRecord,'values').port, 3200);
    assert(!JSON.stringify(updatedRecord).includes(marker));
    assert.equal(
      (
        await post('/api/node-env', {
          name: record.name,
          version: snapshot.version,
          changes: { port: 3300 },
          confirm: true,
        })
      ).status,
      409,
    );
    const backupList = jsonRecord(await (await authGet('/api/node-env-backups')).json());
    assert(listField(backupList,'backups').some((item) => item.id === updatedRecord.backupId));
    assert(!JSON.stringify(backupList).includes(marker));
    const restorePlan = jsonRecord(await (await authGet('/api/node-env-restore-plan?id=' + updatedRecord.backupId)).json());
    assert(!JSON.stringify(restorePlan).includes(marker));
    assert.equal(findRecord(restorePlan,'fields','key','port').after, 3145);
    const restoredResponse = await post('/api/node-env-restore', { ...restorePlan, confirm: true });
    assert.equal(restoredResponse.status, 200);
    const restoredRecord = jsonRecord(await restoredResponse.json());
    assert(restoredRecord.backupId);
    assert.equal(recordField(restoredRecord,'values').port, 3145);
    assert(!JSON.stringify(restoredRecord).includes(marker));
    const restoredFile = jsonRecord(await (await authGet('/api/file?name=' + encodeURIComponent(textField(record,'name')))).json());
    assert.equal(restoredFile.text, seed);
    assert.equal(restoredFile.version, snapshot.version);
    assert.equal(await readFile(path.join(root, 'isolated-workspace', textField(record,'name')), 'utf8'), seed);
    assert.equal((await post('/api/node-env-restore', { ...restorePlan, confirm: true })).status, 409);
    const appDirectory = path.join(root, 'isolated-node-app');
    await mkdir(appDirectory, { mode: 0o700 });
    await writeFile(path.join(appDirectory, 'server.js'), "throw Error('App must not execute during inspection');\n", {
      mode: 0o600,
    });
    await writeFile(path.join(appDirectory, '.env'), 'PORT=3145\nAPI_KEY=' + marker + '\n', { mode: 0o600 });
    const appRegistry = jsonRecord(await (await authGet('/api/node-apps')).json());
    assert.deepEqual(appRegistry.apps, []);
    const profile = {
      id: 'fixture-app',
      label: 'Fixture app',
      directory: appDirectory,
      entry: 'server.js',
      environmentFile: '.env',
    };
    assert.equal((await post('/api/node-apps', { version: appRegistry.version, profile })).status, 200);
    assert.equal((await post('/api/node-apps', { version: appRegistry.version, profile })).status, 409);
    const appFilesResponse = await authGet('/api/node-app-files?id=fixture-app');
    assert.equal(appFilesResponse.status, 200);
    const appFiles = jsonRecord(await appFilesResponse.json());
    assert.equal(appFiles.ready, true);
    assert(!JSON.stringify(appFiles).includes(marker));
    assert.equal(recordField(findRecord(appFiles,'files','name','.env'),'values').port, 3145);
    const servicePlanResponse = await authGet('/api/node-app-service-plan?id=fixture-app');
    assert.equal(servicePlanResponse.status, 200);
    const servicePlan = jsonRecord(await servicePlanResponse.json());
    assert.equal(servicePlan.unit, 'tastedev-node-fixture-app.service');
    assert.equal(servicePlan.registryVersion, appFiles.registryVersion);
    assert.equal(recordField(servicePlan,'runtime').executable, '/usr/bin/node');
    assert(textField(servicePlan,'text').includes('ExecStart=:/usr/bin/node'));
    assert(!JSON.stringify(servicePlan).includes(marker));
    const restartPlanResponse = await authGet(
      '/api/node-app-service-plan?id=fixture-app&restart=always&restartSeconds=30',
    );
    assert.equal(restartPlanResponse.status, 200);
    const restartPlan = jsonRecord(await restartPlanResponse.json());
    assert.deepEqual(restartPlan.serviceOptions, { restart: 'always', restartSeconds: 30, stopSeconds: null });
    assert(textField(restartPlan,'text').includes('Restart=always\nRestartSec=30\n'));
    assert(!JSON.stringify(restartPlan).includes(marker));
    for (const query of ['restart=always%0AUser%3D0', 'restartSeconds=0', 'restartSeconds=301', 'restartSeconds=1e2'])
      assert.equal((await authGet('/api/node-app-service-plan?id=fixture-app&' + query)).status, 400);
    const stopPlanResponse = await authGet('/api/node-app-service-plan?id=fixture-app&stopSeconds=60');
    assert.equal(stopPlanResponse.status, 200);
    const stopPlan = jsonRecord(await stopPlanResponse.json());
    assert.equal(recordField(stopPlan,'serviceOptions').stopSeconds, 60);
    assert(textField(stopPlan,'text').includes('TimeoutStopSec=60\n'));
    assert(!textField(servicePlan,'text').includes('TimeoutStopSec='));
    for (const stop of ['0', '301', 'infinity', '60%0AUser%3D0'])
      assert.equal((await authGet('/api/node-app-service-plan?id=fixture-app&stopSeconds=' + stop)).status, 400);
    const installPayload = {
      id: profile.id,
      registryVersion: servicePlan.registryVersion,
      files: servicePlan.files,
      options: servicePlan.serviceOptions,
      confirm: true,
    };
    assert.equal((await post('/api/node-app-service-install', installPayload)).status, 403);
    const anonymousServiceInstall = await packageFetch(base + '/api/node-app-service-install', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(installPayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(anonymousServiceInstall.status, 401);
    const crossServiceInstall = await packageFetch(base + '/api/node-app-service-install', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify(installPayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(crossServiceInstall.status, 403);
    const controlPayload = { ...installPayload, operation: 'restart' };
    assert.equal((await post('/api/node-app-service-control', controlPayload)).status, 403);
    const updatePayload = { ...installPayload, unitVersion: 'a'.repeat(64) };
    assert.equal((await post('/api/node-app-service-update', updatePayload)).status, 403);
    const anonymousUpdate = await packageFetch(base + '/api/node-app-service-update', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(anonymousUpdate.status, 401);
    const crossUpdate = await packageFetch(base + '/api/node-app-service-update', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(crossUpdate.status, 403);
    const anonymousControl = await packageFetch(base + '/api/node-app-service-control', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(controlPayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(anonymousControl.status, 401);
    const crossControl = await packageFetch(base + '/api/node-app-service-control', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify(controlPayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(crossControl.status, 403);
    assert.equal((await authGet('/api/nginx-recovery-plan?path=%2Fetc%2Fnginx%2Fnginx.conf')).status, 403);
    assert.equal(
      (
        await authGet(
          '/api/mariadb-recovery-plan?root=%2Fetc%2Fmysql%2Fmy.cnf&target=%2Fetc%2Fmysql%2Fconf.d%2Fserver.cnf',
        )
      ).status,
      403,
    );
    assert.equal((await authGet('/api/redis-recovery-plan')).status, 403);
    assert.equal((await authGet('/api/node-app-service-recovery-plan?id=fixture-app')).status, 403);
    assert.equal((await authGet('/api/node-app-service-settings?id=fixture-app')).status, 403);
    assert.equal((await authGet('/api/node-app-service-backups?id=fixture-app')).status, 403);
    assert.equal(
      (await authGet('/api/node-app-service-restore-plan?id=fixture-app&backupId=12345678-1234-1234-1234-123456789abc'))
        .status,
      403,
    );
    assert.equal(
      (await packageFetch(base + '/api/node-app-service-restore-plan?id=fixture-app', { signal: AbortSignal.timeout(5000) }))
        .status,
      401,
    );
    const restorePayload = {
      ...updatePayload,
      backupId: '12345678-1234-1234-1234-123456789abc',
      backupVersion: 'b'.repeat(64),
    };
    assert.equal((await post('/api/node-app-service-restore', restorePayload)).status, 403);
    const anonymousRestore = await packageFetch(base + '/api/node-app-service-restore', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(restorePayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(anonymousRestore.status, 401);
    const crossRestore = await packageFetch(base + '/api/node-app-service-restore', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify(restorePayload),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(crossRestore.status, 403);
    assert.equal(
      (await packageFetch(base + '/api/node-app-service-backups?id=fixture-app', { signal: AbortSignal.timeout(5000) }))
        .status,
      401,
    );
    assert.equal(
      (await packageFetch(base + '/api/node-app-service-settings?id=fixture-app', { signal: AbortSignal.timeout(5000) }))
        .status,
      401,
    );
    const appEnvResponse = await authGet('/api/node-app-env?id=fixture-app');
    assert.equal(appEnvResponse.status, 200);
    const appEnv = jsonRecord(await appEnvResponse.json());
    assert.equal(recordField(appEnv,'values').port, 3145);
    assert(!JSON.stringify(appEnv).includes(marker));
    assert.equal(
      (
        await post('/api/node-app-env', {
          id: profile.id,
          version: appEnv.version,
          registryVersion: appEnv.registryVersion,
          changes: { port: 3200 },
        })
      ).status,
      400,
    );
    const appEnvSavedResponse = await post('/api/node-app-env', {
      id: profile.id,
      version: appEnv.version,
      registryVersion: appEnv.registryVersion,
      changes: { port: 3200 },
      confirm: true,
    });
    assert.equal(appEnvSavedResponse.status, 200);
    const appEnvSaved = jsonRecord(await appEnvSavedResponse.json());
    assert.equal(appEnvSaved.saved, true);
    assert.equal(recordField(appEnvSaved,'values').port, 3200);
    assert(appEnvSaved.backupId);
    assert(!JSON.stringify(appEnvSaved).includes(marker));
    assert.equal(await readFile(path.join(appDirectory, '.env'), 'utf8'), 'PORT=3200\nAPI_KEY=' + marker + '\n');
    const appEnvBackup = jsonRecord(JSON.parse(
      await readFile(path.join(root, 'isolated-state', 'node-app-env-backups', appEnvSaved.backupId + '.json'), 'utf8'),
    ));
    assert.equal(appEnvBackup.text, 'PORT=3145\nAPI_KEY=' + marker + '\n');
    assert.equal(
      (
        await post('/api/node-app-env', {
          id: profile.id,
          version: appEnv.version,
          registryVersion: appEnv.registryVersion,
          changes: { port: 3300 },
          confirm: true,
        })
      ).status,
      409,
    );
    const appBackups = jsonRecord(await (await authGet('/api/node-app-env-backups?id=fixture-app')).json());
    assert(listField(appBackups,'backups').some((item) => item.id === appEnvSaved.backupId));
    assert(!JSON.stringify(appBackups).includes(marker));
    assert(!JSON.stringify(appBackups).includes(appDirectory));
    const appRestorePlanResponse = await authGet(
      '/api/node-app-env-restore-plan?id=fixture-app&backupId=' + appEnvSaved.backupId,
    );
    assert.equal(appRestorePlanResponse.status, 200);
    const appRestorePlan = jsonRecord(await appRestorePlanResponse.json());
    assert(!JSON.stringify(appRestorePlan).includes(marker));
    assert.equal(findRecord(appRestorePlan,'fields','key','port').after, 3145);
    assert.equal((await post('/api/node-app-env-restore', appRestorePlan)).status, 400);
    const appRestoredResponse = await post('/api/node-app-env-restore', { ...appRestorePlan, confirm: true });
    assert.equal(appRestoredResponse.status, 200);
    const appRestored = jsonRecord(await appRestoredResponse.json());
    assert.equal(recordField(appRestored,'values').port, 3145);
    assert(appRestored.backupId);
    assert(!JSON.stringify(appRestored).includes(marker));
    assert.equal(await readFile(path.join(appDirectory, '.env'), 'utf8'), 'PORT=3145\nAPI_KEY=' + marker + '\n');
    const appUndo = jsonRecord(JSON.parse(
      await readFile(path.join(root, 'isolated-state', 'node-app-env-backups', appRestored.backupId + '.json'), 'utf8'),
    ));
    assert.equal(appUndo.text, 'PORT=3200\nAPI_KEY=' + marker + '\n');
    assert.equal((await post('/api/node-app-env-restore', { ...appRestorePlan, confirm: true })).status, 409);
    assert.equal((await authGet('/api/node-app-files?id=unknown')).status, 404);
    assert.equal(
      (await post('/api/node-app-remove', { id: profile.id, version: appFiles.registryVersion })).status,
      400,
    );
    assert.equal(
      (await post('/api/node-app-remove', { id: profile.id, version: appRegistry.version, confirm: true })).status,
      409,
    );
    const removedResponse = await post('/api/node-app-remove', {
      id: profile.id,
      version: appFiles.registryVersion,
      confirm: true,
    });
    assert.equal(removedResponse.status, 200);
    assert.deepEqual((jsonRecord(await removedResponse.json())).apps, []);
    assert.equal((await authGet('/api/node-app-files?id=fixture-app')).status, 404);
    assert.equal(await readFile(path.join(appDirectory, '.env'), 'utf8'), 'PORT=3145\nAPI_KEY=' + marker + '\n');
    const audit = await readFile(path.join(root, 'isolated-state', 'audit.jsonl'), 'utf8');
    assert(!audit.includes(password));
    assert(audit.includes('config-save'));
    assert(audit.includes('node-env-restore'));
    assert(!audit.includes(marker));
    const replacement = 'Replacement-' + randomUUID();
    assert.equal(
      (await post('/api/auth/password', { currentPassword: password, newPassword: replacement })).status,
      200,
    );
    assert.equal((await authGet('/api/security')).status, 401);
    const attempt = (secret:string) =>
      packageFetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: base },
        body: JSON.stringify({ username, password: secret }),
        signal: AbortSignal.timeout(5000),
      });
    assert.equal((await attempt(password)).status, 401);
    const renewed = await attempt(replacement);
    assert.equal(renewed.status, 200);
    cookie = renewed.headers.get('set-cookie')?.split(';')[0]??'';
    assert(cookie?.startsWith('linux_session='));
    assert.equal((await authGet('/api/security')).status, 200);
    let revocationReader, revocationJob;
    if (terminal) {
      const launched = await post('/api/terminal', {
        command: "/bin/bash -c 'printf AUTH_STREAM_READY; read -t 4 -r line'",
        pty: true,
        timeoutSeconds: 5,
        sessionMode: 'tab',
      });
      assert.equal(launched.status, 202);
      revocationJob = packageJobPayload((jsonRecord(await launched.json())));
      const response = await authGet('/api/terminal-events?job=' + revocationJob.id + '&since=0');
      assert.equal(response.status, 200);
      assert(response.body);revocationReader = response.body.getReader();
      assert.equal((await revocationReader.read()).done, false);
    }
    assert.equal((await post('/api/auth/logout', {})).status, 200);
    assert.equal((await authGet('/api/security')).status, 401);
    if (terminal) {
      assert(revocationReader&&revocationJob);await verifyPackageStreamRevocation(revocationReader);
      const cleanupLogin = await attempt(replacement);
      assert.equal(cleanupLogin.status, 200);
      cookie = cleanupLogin.headers.get('set-cookie')?.split(';')[0]??'';
      assert.equal((await post('/api/stop', { id: revocationJob.id })).status, 200);
      assert.equal((await post('/api/auth/logout', {})).status, 200);
    }
    return [
      'initial localized login SSR honors saved country language over weighted Accept-Language, rejects malformed preferences, and isolates languages between requests',
      auditCheck,
      ...(terminal
        ? [
            'authenticated packaged default-account shell echoes English and Korean before Enter and executes input exactly once',
          ]
        : []),
      'PostgreSQL backup restore and interrupted recovery plan/recover HTTP unauthenticated, cross-origin and disabled database-permission denial using canonical cluster paths; no root/native execution',
      'PostgreSQL/MariaDB/Redis complete-code plan/apply HTTP authentication, cross-origin and disabled-permission denial with a body over 8KiB; no root/native execution',
      'authenticated Certbot/PostgreSQL initial HTTP HTML includes discovered file nodes and empty inspector without client JavaScript when the package is installed',
      'authenticated nginx initial HTTP HTML includes discovered config nodes and empty inspector without executing client JavaScript when nginx is installed',
      'Portuguese and completed Japanese catalog markers served in packaged login client assets',
      'authenticated terminal CLI PATH inspection without CLI execution',
      'Redis context/isolated validation and nginx reviewed context/apply/backup/restore/plan HTTP authentication and disabled-permission rejection without root execution',
      'Certbot HTTP nginx/webroot/standalone issuance and named/all renewal previews, invalid-path/name rejection and disabled execution denial without ACME execution',
      ...(terminal
        ? [
            'logout revokes an already open terminal SSE stream before further output',
            'authenticated incremental terminal SSE output, idle heartbeat without cursor advance and final exit with no input echo; unauthenticated and missing-session rejection',
            'large Korean/emoji PTY output retained exactly across bounded records through authenticated HTTP',
            'execution-account HOME/USER/LOGNAME and explicit isolated Bash rcfile PATH through authenticated PTY HTTP without real startup-file or AI CLI execution',
            'isolated authenticated PTY HTTP configurable deadline/invalid-timeout rejection/launch/input/resize/closed-session, secret input echo absence and unauthorized/cross-origin/invalid-mode rejection',
          ]
        : []),
      'nginx native draft validation HTTP succeeds without service changes and rejects unauthenticated/cross-origin/operational scope requests',
      'nginx plan HTTP renders fixed proxy configuration, rejects numeric coercion and denies disabled operational apply',
      'registered app backup catalog and full-byte restore HTTP roundtrip with undo backup and stale-plan rejection',
      'registered Node app environment HTTP edit with confirmation, private backup, secret preservation and stale-file rejection',
      'registered Node app HTTP save and conflict, unregister with confirmation and original file preservation, private file inspection and bounded service options and unauthenticated/cross-origin/disabled service installation/control/settings rejection without app execution',
      'workspace environment secret preservation and private backup metadata',
      'environment restore HTTP roundtrip including original bytes, undo backup and stale-version rejection',
      'password change revokes existing cookie and rejects old password before successful new login',
      'isolated fixture account login and logout session revocation',
      'all six canonical package routes require login and serve authenticated pages; unsupported package route carries the exact 404 boundary and noindex',
      'default file-edit denial then isolated security permission and draft readback',
      terminal
        ? 'packaged server startup with isolated state and fixture-only terminal permission'
        : 'packaged server startup with isolated state and all operation flags off',
      'standard npm start CLI with custom port, production CSP, external theme bootstrap, login HTML and unconfigured auth status',
      'protected IDE and terminal redirects',
      'unauthenticated API rejection',
    ];
  } catch(error){await harness.recordFailure(error);throw error;}finally{await harness.close();}
}

type PackageJob=Record<string,unknown>&{id:string;status:string;logs:{text:string;kind?:unknown}[]};
export function packageJobPayload(value:Record<string,unknown>):PackageJob{const job=recordField(value,'job'),id=textField(job,'id'),status=textField(job,'status');assert(id.length>0&&status.length>0);return {...job,id,status,logs:job.logs===undefined?[]:listField(job,'logs').map(entry=>{assert(entry.kind===undefined||typeof entry.kind==='string');return {...entry,text:textField(entry,'text'),kind:entry.kind};})};}

export function stringArray(value:unknown):string[]{assert(Array.isArray(value));return value.map((item:unknown)=>{assert(typeof item==='string');return item;});}
export function findRecord(value:Record<string,unknown>,array:string,key:string,expected:string){const row=listField(value,array).find(item=>item[key]===expected);assert(row,'Missing package verification record');return row;}
