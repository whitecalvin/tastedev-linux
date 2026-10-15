import {hasErrorCode} from './error-code.ts';
import {runtimeAuthOrigins} from './network-settings.ts';
import { betterAuth,type BetterAuthOptions } from 'better-auth';
import { username } from 'better-auth/plugins';
import { getMigrations } from 'better-auth/db/migration';
import Database from 'better-sqlite3';
import { mkdirSync, lstatSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { credentials } from './auth-store.ts';
import { stateRoot } from './runtime-paths.ts';
import { passwordHash, verifyPassword } from './auth-password.ts';
type AuthInstance = Awaited<ReturnType<typeof initialize>>;
declare global {var __tasteBetterAuthInstances: Map<string,Promise<AuthInstance>> | undefined;}
const instances = (globalThis.__tasteBetterAuthInstances ??= new Map<string,Promise<AuthInstance>>());
function privateFile(path: string) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.mode & 0o077)
    throw Error('인증 저장 파일 권한을 확인하세요.');
}
// Browser cookies are scoped by host, not port. Each installation needs its own name.
export function sessionCookieBaseName() {
  const file = join(resolve(process.env.LINUX_AUTH_ROOT || stateRoot()), 'better-auth', 'secret');
  try {
    privateFile(file);
    const secret = readFileSync(file, 'utf8');
    if (!/^[0-9a-f]{96}$/.test(secret)) throw Error('인증 키를 확인하세요.');
    return 'linux_session_' + createHash('sha256').update('session-cookie:' + secret).digest('hex').slice(0, 20);
  } catch (error) {
    // Before account initialization there is no session to isolate.
    if (hasErrorCode(error, 'ENOENT')) return 'linux_session';
    throw error;
  }
}
async function initialize(root: string) {
  const base = join(root, 'better-auth');
  mkdirSync(root, { recursive: true, mode: 0o700 });
  if (lstatSync(root).isSymbolicLink()) throw Error('계정 저장 경로를 확인하세요.');
  mkdirSync(base, { mode: 0o700, recursive: true });
  const stat = lstatSync(base);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.mode & 0o077)
    throw Error('인증 저장 경로 권한을 확인하세요.');
  const secretFile = join(base, 'secret');
  try {
    writeFileSync(secretFile, randomBytes(48).toString('hex'), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (!hasErrorCode(error,'EEXIST')) throw error;
  }
  privateFile(secretFile);
  const secret = readFileSync(secretFile, 'utf8');
  if (!/^[0-9a-f]{96}$/.test(secret)) throw Error('인증 키를 확인하세요.');
  const databaseFile = join(base, 'auth.sqlite');
  try {
    writeFileSync(databaseFile, '', { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (!hasErrorCode(error,'EEXIST')) throw error;
  }
  privateFile(databaseFile);
  const db = new Database(databaseFile);
  db.pragma('journal_mode = DELETE');
  db.pragma('busy_timeout = 5000');
  chmodSync(databaseFile, 0o600);
  const options = {
    database: db,
    secret,
    baseURL: process.env.BETTER_AUTH_URL || runtimeAuthOrigins()[0] || 'http://127.0.0.1:8791',
    ...(runtimeAuthOrigins().length?{trustedOrigins:runtimeAuthOrigins()}:{}),
    basePath: '/api/auth/better',
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 256,
      password: { hash: passwordHash, verify: verifyPassword },
    },
    session: { expiresIn: 7 * 24 * 3600, updateAge: 24 * 3600, cookieCache: { enabled: false } },
    advanced: {
      useSecureCookies: process.env.LINUX_COOKIE_SECURE === 'true',
      defaultCookieAttributes: { sameSite: 'strict', httpOnly: true },
      cookies: { session_token: { name: sessionCookieBaseName() } },
    },
    plugins: [
      username({
        minUsernameLength: 1,
        maxUsernameLength: 64,
        usernameNormalization: false,
        usernameValidator: (value: string) => /^[a-zA-Z0-9._-]{1,64}$/.test(value),
        immutableUsername: true,
      }),
    ],
  } satisfies BetterAuthOptions;
  const migrations = await getMigrations(options);
  await migrations.runMigrations();
  const auth = betterAuth(options);
  db.exec('CREATE TABLE IF NOT EXISTS taste_auth_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  return { auth, db };
}
function syncCredentials(db: Database.Database) {
  const data = credentials();
  if (!data.username || typeof data.passwordHash!=='string' || !/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(data.passwordHash || '')) return;
  const fingerprint = createHash('sha256')
    .update(data.username + '\0' + data.passwordHash)
    .digest('hex');
  if (db.prepare<[string],{value: string}>('SELECT value FROM taste_auth_meta WHERE key=?').get('legacy-credential')?.value === fingerprint)
    return;
  db.transaction(() => {
    const userId = 'tastedev-administrator',
      now = Date.now();
    db.prepare('DELETE FROM session WHERE userId=?').run(userId);
    db.prepare(
      'INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt,username,displayUsername) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username=excluded.username,displayUsername=excluded.displayUsername,updatedAt=excluded.updatedAt',
    ).run(userId, data.username, 'administrator@tastedev.local', 1, now, now, data.username, data.username);
    db.prepare(
      'INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET password=excluded.password,updatedAt=excluded.updatedAt',
    ).run('tastedev-credential', userId, 'credential', userId, data.passwordHash, now, now);
    db.prepare(
      'INSERT INTO taste_auth_meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    ).run('legacy-credential', fingerprint);
  })();
}
export async function getBetterAuth() {
  const root = resolve(process.env.LINUX_AUTH_ROOT || stateRoot());
  if (!instances.has(root))
    instances.set(
      root,
      initialize(root).catch((error) => {
        instances.delete(root);
        throw error;
      }),
    );
  const instance = await instances.get(root)!;
  syncCredentials(instance.db);
  return instance;
}
