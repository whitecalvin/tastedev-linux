import {hasErrorCode} from './error-code.ts';
export type Credentials = {username?: string; passwordHash?: string};
import { readFileSync, lstatSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { stateRoot } from './runtime-paths.ts';
const validHash = (value: unknown): value is string => typeof value==='string'&& /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(value || '');
export function credentials(): Credentials {
  const root = resolve(process.env.LINUX_AUTH_ROOT || stateRoot());
  try {
    if (lstatSync(root).isSymbolicLink()) throw new Error('계정 저장 경로를 확인하세요.');
    const path = join(root, 'auth.json');
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) throw new Error('계정 설정 파일을 확인하세요.');
    let input: unknown;
    try {
      input = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('계정 설정 파일을 확인하세요.');
      throw error;
    }
    const data=input&&typeof input==='object'?input as Record<string,unknown>:{};
    if (
      !input ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      !validHash(data.passwordHash) ||
      typeof data.username !== 'string' ||
      !data.username
    )
      throw new Error('계정 설정 파일을 확인하세요.');
    return data as Credentials;
  } catch (e) {
    if (!hasErrorCode(e,'ENOENT')) throw e;
  }
  return { username: process.env.LINUX_LOGIN_USERNAME, passwordHash: process.env.LINUX_LOGIN_PASSWORD_HASH };
}
export function storeCredentials(username: unknown, passwordHash: unknown): void {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9._-]{1,64}$/.test(username) || !validHash(passwordHash))
    throw new Error('사용자명은 영문·숫자·점·밑줄·하이픈 1~64자로 설정하세요.');
  const root = resolve(process.env.LINUX_AUTH_ROOT || stateRoot());
  mkdirSync(root, { recursive: true, mode: 0o700 });
  if (lstatSync(root).isSymbolicLink()) throw new Error('계정 저장 경로를 확인하세요.');
  const temporary = join(root, '.auth-' + randomUUID());
  try {
    writeFileSync(temporary, JSON.stringify({ username, passwordHash }) + '\n', { mode: 0o600, flag: 'wx' });
    renameSync(temporary, join(root, 'auth.json'));
  } finally {
    try {
      unlinkSync(temporary);
    } catch (e) {
      if (!hasErrorCode(e,'ENOENT')) throw e;
    }
  }
}
