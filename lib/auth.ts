type LoginAttempt = {count: number; start: number};
declare global {var __linuxLoginAttempts: Map<string,LoginAttempt> | undefined;}
type AuthRequest = {headers: Headers};
import { credentials, storeCredentials } from './auth-store.ts';
import { getBetterAuth, sessionCookieBaseName } from './better-auth.ts';
import { passwordHash, verifyPassword } from './auth-password.ts';
export { passwordHash };
const attempts = (globalThis.__linuxLoginAttempts ??= new Map<string,LoginAttempt>());
const fail = (message: string, status: number) => Object.assign(Error(message), { status });
export function loginConfigured() {
  const data = credentials();
  return Boolean(data.username && /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(data.passwordHash || ''));
}
export function sessionCookieName() {
  return (process.env.LINUX_COOKIE_SECURE === 'true' ? '__Secure-' : '') + sessionCookieBaseName();
}
export function sessionToken(request: AuthRequest) {
  const prefix = sessionCookieName() + '=';
  const tokens = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith(prefix));
  return tokens.length === 1 ? tokens[0].slice(prefix.length) || null : null;
}
export async function cookieSession(request: AuthRequest) {
  if (!sessionToken(request)) return null;
  const { auth } = await getBetterAuth();
  const result = await auth.api.getSession({ headers: request.headers });
  return result
    ? {
        username: result.user.username || result.user.name,
        userId: result.user.id,
        expires: result.session.expiresAt,
        session: result.session,
      }
    : null;
}
export async function logoutSession(request: AuthRequest) {
  const { auth } = await getBetterAuth();
  await auth.api.signOut({ headers: request.headers });
}
export async function login(username: unknown, password: unknown) {
  if (!loginConfigured()) throw fail('서버의 로그인 계정 설정이 필요합니다.', 503);
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 256)
    throw fail('로그인 정보를 확인하세요.', 400);
  const record = attempts.get('global') || { count: 0, start: Date.now() };
  if (Date.now() - record.start > 60000) {
    record.count = 0;
    record.start = Date.now();
  }
  if (record.count >= 10) throw fail('로그인 요청이 너무 많습니다. 1분 후 다시 시도하세요.', 429);
  record.count++;
  attempts.set('global', record);
  const { auth } = await getBetterAuth();
  try {
    const response = await auth.api.signInUsername({ body: { username, password }, asResponse: true });
    if (!response.ok) throw fail('사용자명 또는 비밀번호를 확인하세요.', 401);
    const cookies = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
    const cookiePattern = new RegExp('(?:^|,\\s*)' + sessionCookieName() + '=([^;]+)');
    const token = cookies.map(value => value.match(cookiePattern)?.[1]).find(Boolean);
    if (!token) throw Error('Missing session cookie');
    return token;
  } catch (error) {
    if(error!==null&&typeof error==='object'&&'status' in error&&error.status) throw fail('사용자명 또는 비밀번호를 확인하세요.', 401);
    throw error;
  }
}
export function sessionCookie(request: {url: string}, id = '') {
  const secure = process.env.LINUX_COOKIE_SECURE === 'true' || new URL(request.url).protocol === 'https:';
  return `${sessionCookieName()}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${id ? 604800 : 0}${secure ? '; Secure' : ''}`;
}
let changing = false;
export async function changePassword(request: AuthRequest,currentPassword: unknown,newPassword: unknown) {
  const session = await cookieSession(request);
  if (!session) throw Object.assign(fail('로그인이 필요합니다.', 401), { code: 'SESSION_EXPIRED' });
  if (changing) throw fail('비밀번호 변경을 처리 중입니다.', 409);
  changing = true;
  try {
    const data = credentials();
    if (!(await verifyPassword({ password: currentPassword, hash: data.passwordHash })))
      throw fail('사용자명 또는 비밀번호를 확인하세요.', 401);
    if (currentPassword === newPassword) throw fail('현재 비밀번호와 다른 비밀번호를 설정하세요.', 400);
    const next = await passwordHash(newPassword);
    storeCredentials(session.username, next);
    await getBetterAuth();
  } finally {
    changing = false;
  }
}
