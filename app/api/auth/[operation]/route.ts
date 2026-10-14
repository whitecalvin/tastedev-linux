import {
  login,
  loginConfigured,
  cookieSession,
  logoutSession,
  sessionCookie,
  sessionToken,
  changePassword,
} from '../../../../lib/auth.ts';
import { getBetterAuth } from '../../../../lib/better-auth.ts';
import { isAuthStorageError, authStorageMessage } from '../../../../lib/auth-storage-error.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export async function GET(request: Request, { params }: {params: Promise<{operation: string}>}) {
  if ((await params).operation !== 'status') return reply({ error: '잘못된 요청입니다.' }, 404);
  try {
    const configured = loginConfigured();
    if (configured) await getBetterAuth();
    const session = await cookieSession(request);
    const token = sessionToken(request);
    return reply(
      { configured, authenticated: Boolean(session), username: session?.username || null },
      200,
      session && token ? { 'Set-Cookie': sessionCookie(request, token) } : {},
    );
  } catch (error) {
    if (isAuthStorageError(error))
      return reply(
        { configured: null, authenticated: false, storageUnavailable: true, error: authStorageMessage },
        503,
      );
    throw error;
  }
}
export async function POST(request: Request, { params }: {params: Promise<{operation: string}>}) {
  try {
    const { operation } = await params;
    const url = new URL(request.url),
      origin = request.headers.get('origin');
    if (origin && origin !== url.protocol + '//' + (request.headers.get('host') || url.host))
      return reply({ error: '다른 사이트의 요청은 허용하지 않습니다.' }, 403);
    if (operation === 'logout') {
      await logoutSession(request);
      return reply({ loggedOut: true }, 200, { 'Set-Cookie': sessionCookie(request) });
    }
    if (!['login', 'password'].includes(operation)) return reply({ error: '잘못된 요청입니다.' }, 404);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return reply({ error: 'JSON 요청이 필요합니다.' }, 415);
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: '로그인 정보를 입력하세요.' }, 400);
    let size = 0;
    const parts = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2048) {
        await reader.cancel();
        return reply({ error: '로그인 요청이 너무 큽니다.' }, 413);
      }
      parts.push(Buffer.from(value));
    }
    const data = JSON.parse(Buffer.concat(parts).toString());
    if (operation === 'password') {
      await changePassword(request, data.currentPassword, data.newPassword);
      return reply({ changed: true }, 200, { 'Set-Cookie': sessionCookie(request) });
    }
    const id = await login(data.username, data.password);
    return reply({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(request, id) });
  } catch (error) {
    const e: Record<string, unknown> = error && typeof error === 'object' ? error as Record<string, unknown> : {};
    const status = typeof e.status === 'number' ? e.status : undefined;
    if (isAuthStorageError(error)) return reply({ error: authStorageMessage, storageUnavailable: true }, 503);
    return reply({ error: status && typeof e.message === 'string' ? e.message : '로그인 처리에 실패했습니다.', ...(e.code === 'SESSION_EXPIRED' ? { code: 'SESSION_EXPIRED' } : {}) }, status || 400);
  }
}
