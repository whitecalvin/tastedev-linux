import type {ChildProcess} from 'node:child_process';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord,recordField,listField,textField} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
const responseRecord=async(response:Response)=>{const value:unknown=await response.json();return jsonRecord(value);};
function stringList(value:unknown):string[]{assert(Array.isArray(value));return value.map(item=>{assert(typeof item==='string');return item;});}
function cookieValue(response:Response){const value=response.headers.get('set-cookie');assert(value);return value;}
function htmlText(text:string){const escapes:Readonly<Record<string,string>>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'};return text.replace(/[&<>"']/g,char=>escapes[char]??char);}
import {buildWorkspace} from '../build-workspace.ts';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {assertPageRedirect} from './page-redirect.ts';
import {translate} from '../../lib/i18n.ts';
import {languageDirection} from '../../lib/language-preference.ts';
import {installProcessIdentity} from '../../lib/install-job-monitor.ts';
const project = process.cwd(),
  build = process.argv[2];
if (!build || !path.isAbsolute(build)) throw Error('Pass an absolute compiled source snapshot directory.');
const sourceFiles=await assertCurrentCompiledSource(build,project);
const verifyCurrentSource=()=>assertCurrentCompiledSource(build,project);
await verifyCurrentSource();
const evidence=path.join(buildWorkspace,'production-http-'+new Date().toISOString().replaceAll(':','-'));
await mkdir(evidence,{recursive:true,mode:0o700});
const fixture = await mkdtemp(path.join(buildWorkspace, 'tastedev-production-http-'));
let child:ChildProcess|null=null,
  closed:Promise<unknown>|undefined,
  logs = '';
const listener = createServer();
await new Promise<void>((resolve,reject) => {listener.once('error',reject);listener.listen(0, '127.0.0.1', resolve);});
const address=listener.address();assert(address&&typeof address==='object');const port=address.port;
await new Promise<void>((resolve) => listener.close(()=>resolve()));
const base = 'http://127.0.0.1:' + port;
const routeTimings: {route:string;round:number;headersMs:number;fullBodyMs:number;bodyBytes:number}[] = [];
const checks:string[] = [],
  routes = [
    '/overview',
    '/daemon',
    '/logs',
    '/recovery',
    '/security',
    '/audit',
    '/packages',
    '/settings',
    '/terminal',
    '/ide/packages/nginx',
    '/ide/packages/certbot',
    '/ide/packages/postgresql',
    '/ide/packages/mariadb',
    '/ide/packages/redis',
    '/ide/packages/nodejs',
  ];
process.env.LINUX_AUTH_ROOT = path.join(fixture, 'auth');
process.env.LINUX_STATE_ROOT = path.join(fixture, 'state');
const { passwordHash } = await import('../../lib/auth-password.ts');
const { storeCredentials } = await import('../../lib/auth-store.ts');
const username = 'production-fixture',
  password = randomBytes(24).toString('base64url');
storeCredentials(username, await passwordHash(password));
const request = (url:string, options:RequestInit = {}) =>
  fetch(base + url, { redirect: 'manual', signal: AbortSignal.timeout(20000), ...options });
async function start() {
  const env:NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    BETTER_AUTH_URL: base,
    LINUX_WORKSPACE_ROOT: path.join(fixture, 'workspace'),
    LINUX_PACKAGED: 'false',
    LINUX_ENABLE_ADMIN: 'false',
    LINUX_ENABLE_CRON: 'false',
    LINUX_ENABLE_TERMINAL: 'true',
    LINUX_ENABLE_INSTALL: 'false',
    LINUX_ENABLE_AI: 'false',
  };
  delete env.LINUX_LOGIN_USERNAME;
  delete env.LINUX_LOGIN_PASSWORD_HASH;
  delete env.OPENAI_API_KEY;
  child = spawn(
    process.execPath,
    [path.join(project, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    { cwd: build, env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  closed = once(child, 'close');assert(child.stdout&&child.stderr);
  child.stdout.on('data', (data) => {
    logs += data;
  });
  child.stderr.on('data', (data) => {
    logs += data;
  });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error('Production server exited');
    try {
      const response = await request('/login');
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error('Production server readiness timeout');
}
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await closed;
  }
  child = null;
}
try {
  await start();
  console.log(JSON.stringify({ status: 'RUNNING', scope: 'isolated production HTTP', port }));
  for (const route of routes) {
    const response = await request(route);
    await assertPageRedirect(response, '/login?next=' + encodeURIComponent(route));
  }
  checks.push(routes.length+' protected pages redirect unauthenticated requests to separate login');
  const auth = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(auth.status, 200);
  let cookie = cookieValue(auth).split(';')[0];
  assert(cookie.startsWith('linux_session='));
  assert(cookieValue(auth).includes('HttpOnly'));
  assert(cookieValue(auth).includes('SameSite=Strict'));
  checks.push('Better Auth login issues private same-site session cookie');
  const installFolder=path.join(fixture,'auth','install-jobs');
  await mkdir(installFolder,{mode:0o700});
  const installRecord=path.join(installFolder,'job.json'),installLock=path.join(installFolder,'install.lock');
  const installJob={id:'12345678-1234-1234-1234-123456789012',status:'running',startedAt:'2026-10-10T00:00:00Z',command:['/usr/bin/apt-get','install','--yes','--no-remove','--no-upgrade','nginx'],logs:['전용 HTTP 테스트 설치 기록'],exitCode:null};
  const installText=JSON.stringify(installJob);
  await writeFile(installRecord,installText,{mode:0o600});
  const owner={pid:process.pid,jobId:installJob.id,identity:await installProcessIdentity(process.pid)};
  await writeFile(installLock,JSON.stringify(owner),{mode:0o600});
  const observedJob=async()=>{
    const response=await request('/api/job',{headers:{Cookie:cookie}});
    assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
    return recordField(await responseRecord(response),'job');
  };
  assert.equal((await observedJob()).monitoringUnavailable,undefined,'live installation owner should remain observed');
  const mismatchedLock=JSON.stringify({...owner,identity:owner.identity+'0'});
  await writeFile(installLock,mismatchedLock);
  const interrupted=await observedJob();assert.equal(interrupted.monitoringUnavailable,true);assert.equal(interrupted.status,'running');
  const installHtml=await (await request('/packages',{headers:{Cookie:cookie,'Accept-Language':'ko'}})).text();
  assert(installHtml.includes('<span>결과 확인 필요</span>'),'initial SSR must show the review state');
  assert(installHtml.includes('<p role="alert" class="hint">'+interrupted.monitoringMessage+'</p>'),'initial SSR must render Korean review guidance');
  assert.equal(await readFile(installRecord,'utf8'),installText);assert.equal(await readFile(installLock,'utf8'),mismatchedLock);
  assert.equal((await request('/api/job')).status,401);
  await writeFile(installRecord,JSON.stringify({...installJob,status:'success',exitCode:0,finishedAt:'2026-10-10T00:01:00Z'}));
  await rm(installLock);
  assert.equal((await observedJob()).monitoringUnavailable,undefined);
  checks.push('compiled installation job API and initial Korean SSR preserve unobserved owner records/locks, distinguish real owner identity, retain authentication and render review guidance without executing apt');
  const treePreferencePost=(data:unknown,headers:Record<string,string>={})=>request('/api/nginx-tree-preferences',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  const treePreference={userId:'tastedev-administrator',expansion:{defaultOpen:false,nodes:{'folder:conf.d':false}}};
  assert.equal((await treePreferencePost({...treePreference,userId:'other-account'})).status,409);
  assert.equal((await treePreferencePost(treePreference,{Origin:'https://external.invalid'})).status,403);
  assert.equal((await treePreferencePost(treePreference)).status,200);
  const treeHtml=await (await request('/ide/packages/nginx',{headers:{Cookie:cookie}})).text();
  assert(treeHtml.includes('aria-label="nginx 설정 트리"'),'Actual SSR tree missing');
  assert(treeHtml.includes('왼쪽 노드를 선택하세요.'),'Initial node selection guidance missing');
  const folder=treeHtml.match(/<details([^>]*)><summary[^>]*>▱ conf\.d\/<\/summary>/);
  assert(folder,'SSR conf.d folder missing');assert(!/\bopen(?:=|\s|$)/.test(folder[1]),'Saved collapsed folder reopened in server HTML');
  checks.push('compiled tree preference API isolates account and origin; actual SSR HTML includes tree, selection guidance and saved collapsed conf.d before JavaScript');
  for (let round=0;round<3;round++)for (const route of routes) {
    const started=performance.now();
    const response = await request(route, { headers: { Cookie: cookie } });
    const headersMs=performance.now()-started;
    assert.equal(response.status, 200, route);
    const html = await response.text();
    const fullBodyMs=performance.now()-started;
    assert(html.includes('LINUX'));
    routeTimings.push({route,round:round+1,headersMs,fullBodyMs,bodyBytes:Buffer.byteLength(html)});
  }
  checks.push(routes.length+' protected pages render with current compiled source and valid session');
  const settingsHtml=await (await request('/settings',{headers:{Cookie:cookie}})).text();
  assert(settingsHtml.includes('관리 앱 접속')&&settingsHtml.includes('서버 재시작'),'Network controls missing from SSR settings');
  const network=await responseRecord(await request('/api/network-settings',{headers:{Cookie:cookie}}));
  for(const action of ['network-settings','app-restart']){
    const denied=await request('/api/'+action,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({confirm:true,version:network.version})});
    assert.equal(denied.status,401,'Unauthenticated '+action);
  }
  const savedDenied=await request('/api/network-settings',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({...network,port:54321})});
  assert.equal(savedDenied.status,403,'Read-only network mutation must be denied');
  const unchanged=await responseRecord(await request('/api/network-settings',{headers:{Cookie:cookie}}));
  assert.equal(unchanged.version,network.version);
  const restartDenied=await request('/api/app-restart',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({confirm:true,version:network.version})});
  assert.equal(restartDenied.status,403,'Unpackaged app must not schedule systemd restart');
  assert.equal((await responseRecord(await request('/api/auth/status',{headers:{Cookie:cookie}}))).authenticated,true);
  checks.push('SSR settings controls and compiled network/restart APIs enforce authentication, read-only policy and unpackaged restart denial without service mutations');
  const malformedHeaders={Cookie:cookie,Origin:base,'Content-Type':'application/json'};
  for(const body of ['null','[]','true','42','"text"']){
    const rejected=await request('/api/network-settings',{method:'POST',headers:malformedHeaders,body});
    assert.equal(rejected.status,400);assert.equal((await responseRecord(rejected)).error,'설정 값을 확인하세요.');
  }
  const unauthenticatedMalformed=await request('/api/network-settings',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'[]'});assert.equal(unauthenticatedMalformed.status,401);
  const foreignMalformed=await request('/api/network-settings',{method:'POST',headers:{...malformedHeaders,Origin:'https://foreign.invalid'},body:'[]'});assert.equal(foreignMalformed.status,403);
  assert.equal((await responseRecord(await request('/api/network-settings',{headers:{Cookie:cookie}}))).version,network.version);
  checks.push('compiled API rejects non-object JSON after authentication and origin checks without changing network settings');
  // Compare raw server HTML, before any client hydration, with the authenticated inventory.
  const serviceResponse = await request('/api/operations', { headers: { Cookie: cookie } });
  assert.equal(serviceResponse.status, 200);
  const serviceInventory = await responseRecord(serviceResponse);
  const daemonHtml = await (await request('/daemon', { headers: { Cookie: cookie } })).text();
  for (const service of listField(serviceInventory,'services'))
    assert(daemonHtml.includes('<strong>' + service.unit + '</strong>'), 'SSR daemon row missing: ' + service.unit);
  checks.push('raw daemon HTML already contains every discovered service row before hydration');
  for (const authenticator of ['nginx', 'webroot', 'standalone']) {
    const preview = await request('/api/certbot-plan', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'issue',
        domain: 'fixture.example.invalid',
        email: 'fixture@example.invalid',
        staging: true,
        authenticator,
        webroot: '/srv/fixture-public',
      }),
    });
    assert.equal(preview.status, 200);
    const command = stringList((await responseRecord(preview)).command);
    assert(command.includes('--' + authenticator));
    assert.equal(command.includes('--webroot-path'), authenticator === 'webroot');
    assert.equal(command.includes('--redirect'), authenticator === 'nginx');
  }
  checks.push(
    'compiled Certbot preview API retains the selected nginx webroot or standalone method without issuing certificates',
  );
  const installerInput = {
    operation: 'issue', domain: 'fixture.example.invalid', email: 'fixture@example.invalid',
    staging: true, authenticator: 'webroot', webroot: '/srv/fixture-public', installNginx: true,
  };
  const installerPreview = (input:unknown) => request('/api/certbot-plan', {
    method: 'POST', headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const combinedPreview = await installerPreview(installerInput);
  assert.equal(combinedPreview.status, 200);
  const combinedCommand = stringList((await responseRecord(combinedPreview)).command);
  assert.deepEqual(combinedCommand.slice(0, 8), [
    '/usr/bin/certbot', 'run', '--authenticator', 'webroot', '--installer', 'nginx',
    '--webroot-path', '/srv/fixture-public',
  ]);
  assert(combinedCommand.includes('--redirect'));
  assert(combinedCommand.includes('--staging'));
  assert(!combinedCommand.includes('certonly'));
  const certificateOnly = await installerPreview({ ...installerInput, installNginx: false });
  assert.equal(certificateOnly.status, 200);
  const certificateOnlyCommand = stringList((await responseRecord(certificateOnly)).command);
  assert.deepEqual(certificateOnlyCommand.slice(0, 3), ['/usr/bin/certbot', 'certonly', '--webroot']);
  assert(!certificateOnlyCommand.includes('--installer'));
  assert(!certificateOnlyCommand.includes('--redirect'));
  for (const invalid of [{ installNginx: 'true' }, { authenticator: 'nginx' }, { authenticator: 'standalone' }])
    assert.equal((await installerPreview({ ...installerInput, ...invalid })).status, 400);
  checks.push('compiled authenticated Certbot preview binds optional nginx installation to webroot and rejects invalid combinations without ACME execution');
  const policyResponse = await request('/api/security', { headers: { Cookie: cookie } });
  assert.equal(policyResponse.status, 200);
  const policy = await responseRecord(policyResponse);
  const post = (action:string, data:unknown) =>
    request('/api/' + action, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  const enabledPolicy = await post('security', {
    version: policy.version,
    settings: { ...recordField(policy,'settings'), readOnly: false, terminal: true },
  });
  assert.equal(enabledPolicy.status, 200);
  const generalInitial=await responseRecord(await request('/api/system-settings',{headers:{Cookie:cookie}}));
  const generalSave=await post('system-settings',{...generalInitial,logLines:300,logRefreshSeconds:10});
  assert.equal(generalSave.status,200);
  const generalSaved=await responseRecord(generalSave);
  assert.equal(generalSaved.logLines,300);assert.equal(generalSaved.logRefreshSeconds,10);
  assert.equal((await post('system-settings',{...generalInitial,logLines:500})).status,409);
  const holder=spawn(process.execPath,['--input-type=module','-e',"const {withSystemSettingsLock}=await import(process.argv[1]);await withSystemSettingsLock(process.argv[2],async()=>{setInterval(()=>{},1000);process.stdout.write('held\\n');await new Promise(()=>{});});",fileURLToPath(new URL('../../lib/system-settings.'+(import.meta.url.endsWith('.ts')?'ts':'mjs'),import.meta.url)),process.env.LINUX_STATE_ROOT],{env:process.env,stdio:['ignore','pipe','pipe']});
  const holderClosed=once(holder,'close');let holderErrors='';holder.stderr.on('data',bytes=>{holderErrors+=bytes;logs+=bytes;});
  try{
    await new Promise<void>((resolve,reject)=>{
      let output='';const timer=setTimeout(()=>reject(Error('Owned settings lock holder did not start')),5000);
      holder.stdout.on('data',bytes=>{output+=bytes;if(output.includes('held')){clearTimeout(timer);resolve();}});
      holder.once('error',error=>{clearTimeout(timer);reject(error);});
      holder.once('exit',()=>{clearTimeout(timer);if(!output.includes('held'))reject(Error('Owned holder exited before locking: '+holderErrors));});
    });
    assert.equal((await post('system-settings',{...generalSaved,logLines:500})).status,409);
    holder.kill('SIGKILL');await holderClosed;
    const recoveredResponse=await post('system-settings',{...generalSaved,logLines:500,logRefreshSeconds:30});
    assert.equal(recoveredResponse.status,200);
    const recovered=await responseRecord(recoveredResponse);assert.equal(recovered.logLines,500);
    const restored=await post('system-settings',{...recovered,logLines:generalInitial.logLines,logRefreshSeconds:generalInitial.logRefreshSeconds});
    assert.equal(restored.status,200);
    const persisted=await responseRecord(await request('/api/system-settings',{headers:{Cookie:cookie}}));
    assert.equal(persisted.logLines,generalInitial.logLines);assert.equal(persisted.logRefreshSeconds,generalInitial.logRefreshSeconds);
  }finally{if(holder.exitCode===null&&holder.signalCode===null){holder.kill('SIGKILL');await holderClosed;}}
  checks.push('compiled authenticated general settings save rejects stale and overlapping writes; actual owned holder SIGKILL permits a fresh save and original value restoration');
  const launch = await post('terminal', {
    command: 'read -r line; printf "RESULT:%s" "$line"',
    pty: true,
    timeoutSeconds: 5,
  });
  assert.equal(launch.status, 202);
  const terminalJob = recordField(await responseRecord(launch),'job');assert(typeof terminalJob.id==='string');
  const stream = await request('/api/terminal-events?job=' + encodeURIComponent(terminalJob.id), {
    headers: { Cookie: cookie },
  });
  assert.equal(stream.status, 200);
  assert.match(stream.headers.get('content-type')||'', /text\/event-stream/);assert(stream.body);
  const reader = stream.body.getReader(),
    decoder = new TextDecoder();
  let output = '',
    lastStatus = '',
    buffer = '';
  const collect = (async () => {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = frame.match(/^data: (.+)$/m);
        if (!data) continue;
        const value:Record<string,unknown> = jsonRecord(JSON.parse(data[1]));
        assert(!value.error, typeof value.error==='string'?value.error:'Unexpected SSE error');
        if (value.job) {
          const job=jsonRecord(value.job);output += listField(job,'logs').map(item=>textField(item,'text')).join('');
          lastStatus = textField(job,'status');
        }
      }
    }
  })();
  try {
    const input = await post('terminal-input', { id: terminalJob.id, text: '한글😀-production-fixture\n', end: true });
    assert.equal(input.status, 200);
    await collect;
    assert.equal(output, 'RESULT:한글😀-production-fixture');
    assert.equal(lastStatus, 'success');
  } finally {
    await reader.cancel();
    await post('stop', { id: terminalJob.id });
  }
  const auditResponse = await request('/api/audit', { headers: { Cookie: cookie } });
  assert.equal(auditResponse.status, 200);
  const audit = listField(await responseRecord(auditResponse),'events');
  assert.deepEqual(
    audit.filter((event) => event.action === 'terminal').map((event) => event.result),
    ['requested', 'completed'],
  );
  for (const event of audit) assert.deepEqual(Object.keys(event).sort(), ['action', 'at', 'result']);
  assert(!JSON.stringify(audit).includes('production-fixture'));
  assert(!JSON.stringify(audit).includes('RESULT:'));
  checks.push(
    'compiled terminal audit contains one request and one actual completion without early duplicate completion or shell input command or output',
  );
  const deniedCheck = await post('nginx-check', {});
  assert.equal(deniedCheck.status, 403);
  const blockedAudit = listField(await responseRecord(await request('/api/audit',{headers:{Cookie:cookie}})),'events');
  assert(blockedAudit.some((event) => event.action === 'nginx-check' && event.result === 'blocked'));
  checks.push('compiled nginx policy rejection reaches audit API without invoking operating helper');
  const resetPolicy = await post('security', {
    version: (await responseRecord(enabledPolicy)).version,
    settings: policy.settings,
  });
  assert.equal(resetPolicy.status, 200);
  checks.push(
    'authenticated compiled Next.js API sends Korean and emoji through a real PTY to subscribed SSE and receives final exit status',
  );
  for (const locale of ['ko', 'en-US', 'ja-JP', 'zh-CN', 'de-DE', 'fr-CA', 'es-MX', 'it-IT', 'pt-BR', 'ru-RU', 'ar-EG', 'tr-TR', 'uk-UA', 'vi-VN', 'id-ID', 'nl-NL', 'pl-PL', 'cs-CZ', 'sv-SE', 'da-DK', 'fi-FI', 'ro-RO', 'hu-HU', 'el-GR','bg-BG','nb-NO','sk-SK','ca-ES','hi-IN']) {
    const response = await request('/login', { headers: { 'Accept-Language': locale } });
    assert.equal(response.status, 200);
    const html=await response.text();
    assert(html.includes('lang="' + locale + '"'),locale+' SSR language');
    assert(html.includes('dir="'+languageDirection(locale)+'"'),locale+' SSR direction');
    assert(html.includes(htmlText(translate(locale,'관리자 로그인'))),locale+' translated login title in initial HTML');
    if(locale==='ca-ES'||locale==='hi-IN')assert(html.includes('<h2>'+htmlText(translate(locale,'관리자 로그인'))+'</h2>'),locale+' login title must be rendered, not only serialized');
  }
  checks.push('Korean and all configured translated catalogs, including Catalan and Hindi, render translated login titles and correct HTML language/direction in initial SSR; catalog translation coverage is verified separately');
  for (const locale of ['vi-VN','id-ID','nl-NL','pl-PL','cs-CZ','sv-SE','da-DK','fi-FI','ro-RO','hu-HU','el-GR','bg-BG','nb-NO','sk-SK','ca-ES','hi-IN']) {
    const headers={Cookie:cookie+'; linux-language='+locale,'Accept-Language':'ko'};
    const settings=await request('/settings',{headers});
    assert.equal(settings.status,200);
    const settingsHtml=await settings.text();
    assert(settingsHtml.includes('lang="'+locale+'"'),locale+' saved cookie must override Korean browser preference');
    assert(settingsHtml.includes('<h2>'+htmlText(translate(locale,'관리 앱 접속'))+'</h2>'),locale+' network title must be rendered, not only serialized');
    const tree=await request('/ide/packages/nginx',{headers});
    assert.equal(tree.status,200);
    const treeHtml=await tree.text();
    assert(treeHtml.includes('<p>'+htmlText(translate(locale,'왼쪽 노드를 선택하세요.'))+'</p>'),locale+' node-selection guidance must be rendered before hydration');
    checks.push(locale+' saved cookie overrides Korean browser preference and compiled authenticated settings/nginx pages render translated headings and node-selection guidance before hydration');
  }
  const status = await request('/api/auth/status', { headers: { Cookie: cookie } });
  assert.equal((await responseRecord(status)).authenticated, true);
  await stop();
  await start();
  const retained = await request('/api/auth/status', { headers: { Cookie: cookie } });
  assert.equal((await responseRecord(retained)).authenticated, true);
  checks.push('session survives actual production process restart');
  const foreignLogout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookie, Origin: 'https://fixture.example.invalid' },
  });
  assert.equal(foreignLogout.status, 403);
  const stillValid = await request('/api/auth/status', { headers: { Cookie: cookie } });
  assert.equal((await responseRecord(stillValid)).authenticated, true);
  checks.push('foreign-origin mutation rejected while session remains valid');
  const externalNext = await request('/login?next=' + encodeURIComponent('https://fixture.example.invalid'), {
    headers: { Cookie: cookie },
  });
  assert.equal(externalNext.status, 307);
  assert.equal(externalNext.headers.get('location'), '/overview');
  checks.push('external login return destination sanitized');
  const settingsReturn='/settings?section=ai&filter=one&filter=two';
  const settingsNext=await request('/login?next='+encodeURIComponent(settingsReturn+'#legacy'),{headers:{Cookie:cookie}});
  assert.equal(settingsNext.status,307);assert.equal(settingsNext.headers.get('location'),settingsReturn);
  checks.push('compiled authenticated login returns to system settings with repeated local filters and strips legacy fragments');
  const { default: Database } = await import('better-sqlite3');
  const database = new Database(path.join(fixture, 'auth/better-auth/auth.sqlite'));
  const beforeExpiry = await request('/api/auth/status', { headers: { Cookie: cookie } });
  assert.equal((await responseRecord(beforeExpiry)).authenticated, true);
  const expireAt = Date.now() + 1500;
  try {
    assert.equal(
      database.prepare('UPDATE session SET expiresAt=? WHERE userId=?').run(expireAt, 'tastedev-administrator').changes,
      1,
    );
  } finally {
    database.close();
  }
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, expireAt - Date.now() + 250)));
  const expiredStatus = await request('/api/auth/status', { headers: { Cookie: cookie } });
  assert.equal((await responseRecord(expiredStatus)).authenticated, false);
  for (const route of routes) {
    for (const target of [route, route + '?filter=error&filter=warning']) {
      const response = await request(target, { headers: { Cookie: cookie } });
      await assertPageRedirect(response, '/login?next=' + encodeURIComponent(target));
    }
  }
  const target = '/ide/packages/nginx?view=code',
    expiredTarget = await request(target, { headers: { Cookie: cookie } });
  await assertPageRedirect(expiredTarget, '/login?next=' + encodeURIComponent(target));
  const expiredApi = await request('/api/cron', { headers: { Cookie: cookie } });
  assert.equal(expiredApi.status, 401);
  checks.push(
    'time-expired stored session rejects API and redirects all ' + routes.length + ' protected pages preserving query return path',
  );
  const relogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(relogin.status, 200);
  const nextCookie = cookieValue(relogin).split(';')[0];
  assert.notEqual(nextCookie, cookie);
  cookie = nextCookie;
  const resumed = await request('/login?next=' + encodeURIComponent(target), { headers: { Cookie: cookie } });
  assert.equal(resumed.status, 307);
  assert.equal(resumed.headers.get('location'), target);
  assert.equal((await request(target, { headers: { Cookie: cookie } })).status, 200);
  checks.push('fresh login after time expiry creates a new session and returns to the original nginx code route');
  const logout = await request('/api/auth/logout', { method: 'POST', headers: { Cookie: cookie, Origin: base } });
  assert.equal(logout.status, 200);
  const expired = await request('/overview', { headers: { Cookie: cookie } });
  await assertPageRedirect(expired, '/login?next=' + encodeURIComponent('/overview'));
  checks.push('logout invalidates stored session and returns old-cookie requests to login');
  await stop();
  await verifyCurrentSource();
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      {
        status: 'PASS',
        build,
        currentSourceVerified: true,
        sourceFiles: sourceFiles,
        checks,
        performanceMeasurement:{scope:'Local production HTTP SSR response, three sequential rounds per route; not browser navigation or before/after comparison',routes:routeTimings},
        hostAccountsChanged: false,
        operatingMutationsEnabled: false,
        fixtureTerminalEnabled: true,
        temporaryServerStopped: true,
      },
      null,
      2,
    ) + '\n',
    { mode: 0o600 },
  );
  console.log(JSON.stringify({ status: 'PASS', checks, evidence: path.join(evidence, 'result.json') }));
} catch (error) {
  console.error(diagnostic(error));
  console.error(JSON.stringify({ completedChecks: checks }));await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:'FAIL',build,completedChecks:checks,error:diagnostic(error)},null,2)+'\n',{mode:0o600});
  process.exitCode = 1;
} finally {
  await stop();
  await writeFile(path.join(evidence, 'production-http.log'), logs, { mode: 0o600 });
  await rm(fixture, { recursive: true, force: true });
}
