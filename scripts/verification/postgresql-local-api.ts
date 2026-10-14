// Real application API/auth/security over local HTTP; privileged transport is
// an explicit fixture adapter into the disposable PostgreSQL coordinator.
import assert from 'node:assert/strict';
import {jsonRecord} from './http-json.ts';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { transform, loadBindings } from 'next/dist/build/swc/index.js';

export async function postgresqlLocalApi(root:string, dispatch:(action:string,data:unknown)=>unknown|Promise<unknown>) {
  const stateRoot=path.join(root,'state');process.env.LINUX_STATE_ROOT=stateRoot;
  process.env.LINUX_AUTH_ROOT = path.join(root, 'auth');
  process.env.LINUX_ENABLE_ADMIN = 'true';
  await mkdir(process.env.LINUX_STATE_ROOT, { mode: 0o700 });
  const sourceUrl = new URL('../../lib/api.ts', import.meta.url),
    securityUrl = new URL('../../lib/security.ts', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8'),
    securitySource = await readFile(securityUrl, 'utf8'),
    modules = new Map<string,unknown>();
  const imports = [...new Set([...source.matchAll(/from\s*['"](\.\/[^'"]+)['"]/g)].map((match) => match[1]))];
  for (const name of imports) modules.set(name, await import(new URL(name, sourceUrl).href));
  const native = createRequire(sourceUrl),
    helperCalls:string[] = [],
    transport = {
      ...jsonRecord(modules.get('./privilege.ts')),
      helperStatus: () => ({ ready: true, fixtureAdapter: true }),
      runHelper: async (action:string, data:unknown) => {
        helperCalls.push(action);
        return dispatch(action, data);
      },
    };
  await loadBindings();
  async function compile(text:string, filename:string, require:(name:string)=>unknown) {
    const module:{exports:unknown} = { exports: {} };
    const output = await transform(text, {
      filename,
      jsc: { parser: { syntax: 'typescript' } },
      module: { type: 'commonjs' },
    });
    new Function('require', 'module', 'exports', output.code)(require, module, module.exports);
    return jsonRecord(module.exports);
  }
  const security = await compile(securitySource, 'security.ts', (name) =>
    name === './privilege.ts' ? transport : (modules.get(name) ?? native(name)),
  );
  const api = await compile(source, 'api.mjs', (name) =>
    name === './privilege.ts' ? transport : name === './security.ts' ? security : (modules.get(name) ?? native(name)),
  );
  const policy = { ...jsonRecord(security.defaultSecurity), readOnly: false, databaseChanges: true, sudoWithoutPrompt: true };
  const savePolicy = () =>
    writeFile(path.join(stateRoot,'security.json'), JSON.stringify(policy), { mode: 0o600 });
  await savePolicy();
  let base='';
  const server = createServer(async (req, res) => {
    try {
      const chunks:Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
      const incomingHeaders=new Headers();for(const [name,value] of Object.entries(req.headers)){for(const item of Array.isArray(value)?value:[value])if(typeof item==='string')incomingHeaders.append(name,item);}
      const request = new Request(base + req.url, {
        method: req.method,
        headers: incomingHeaders,
        ...(req.method === 'GET' ? {} : { body: Uint8Array.from(Buffer.concat(chunks)) }),
      });
      assert(typeof api.handle==='function');const response:unknown = await api.handle(request, new URL(request.url).pathname.split('/').at(-1));
      assert(response instanceof Response);res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'fixture bridge failure' }));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.2', resolve);
  });
  const address=server.address();assert(address&&typeof address==='object');base='http://127.0.0.2:'+address.port;
  process.env.BETTER_AUTH_URL = base;
  const { storeCredentials } = await import('../../lib/auth-store.ts');
  const { login, passwordHash } = await import('../../lib/auth.ts');
  try {
    // Read the generated fixture credential only through the app's setup/sign-in
    // path. Keep the plaintext password transient and never publish it.
    const password = randomBytes(24).toString('hex');
    storeCredentials('pg-fixture', await passwordHash(password));
    const cookie = 'linux_session=' + (await login('pg-fixture', password));
    const post = async (action:string, data:unknown, headers:Record<string,string> = {}) => {
      const response = await fetch(base + '/api/' + action, {
        method: 'POST',
        headers: { Cookie: cookie, 'Content-Type': 'application/json', Origin: base, ...headers },
        body: JSON.stringify(data),
      });
      return { status: response.status, data: jsonRecord(await response.json()) };
    };
    return {
      post,
      get: async (action:string, headers:Record<string,string> = {}) => {
        const response = await fetch(base + '/api/' + action, {headers: {Cookie: cookie, ...headers}});
        return {status: response.status, data: jsonRecord(await response.json())};
      },
      helperCalls,
      policy,
      savePolicy,
      audits: async()=>{assert(typeof security.auditEvents==='function');const rows:unknown=await security.auditEvents();assert(Array.isArray(rows));return rows.map(jsonRecord);},
      execute: async (action:string, data:unknown) => {
        const result = await post(action, data);
        if (result.status !== 200)
          throw Object.assign(Error(typeof result.data.error==='string'?result.data.error:'API request failed'), { status: result.status });
        return result.data;
      },
      close: async () => {
        server.closeAllConnections();
        await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
        const { getBetterAuth } = await import('../../lib/better-auth.ts');
        (await getBetterAuth()).db.close();
      },
    };
  } catch (error) {
    server.closeAllConnections();
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    throw error;
  }
}
