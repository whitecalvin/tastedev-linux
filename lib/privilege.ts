export type HelperStatus = {ready: boolean; path: string; reason: string; sudoPermission: 'unchecked'; sha256?: string};
import { helperErrorFromStderr, helperErrorCollector } from './helper-error.ts';
import { redisSandboxFailureFromStderr } from './redis-validation-error.ts';
import { helperJsonOutput } from './helper-json-output.ts';
import { helperActions } from './helper-actions.ts';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile, spawn,type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const packaged = process.env.LINUX_PACKAGED === 'true';
export const HELPER = packaged ? '/usr/lib/tastedev-linux/scripts/admin/linux-admin' : '/usr/local/libexec/linux-admin';
const actions = new Set(helperActions);
export { helperActions };
export function helperStatus(): HelperStatus {
  try {
    let runtime;
    try {
      runtime = lstatSync('/usr/bin/node');
    } catch {
      return {
        ready: false,
        path: HELPER,
        reason:
          '관리자 helper 실행에는 시스템 Node.js(/usr/bin/node)가 필요합니다. 서버 관리자가 먼저 설치해야 합니다.',
        sudoPermission: 'unchecked',
      };
    }
    if (
      runtime.isSymbolicLink() ||
      !runtime.isFile() ||
      runtime.uid !== 0 ||
      runtime.mode & 0o022 ||
      !(runtime.mode & 0o111)
    )
      return {
        ready: false,
        path: HELPER,
        reason: '시스템 Node.js는 root 소유의 실행 파일이며 일반 사용자가 수정할 수 없어야 합니다.',
        sudoPermission: 'unchecked',
      };
    for (const name of packaged
      ? [
          '/usr',
          '/usr/lib',
          '/usr/lib/tastedev-linux',
          '/usr/lib/tastedev-linux/scripts',
          '/usr/lib/tastedev-linux/scripts/admin',
          HELPER,
        ]
      : ['/usr', '/usr/local', '/usr/local/libexec', HELPER]) {
      const stat = lstatSync(name),
        file = name === HELPER;
      if (
        stat.isSymbolicLink() ||
        stat.uid !== 0 ||
        stat.mode & 0o022 ||
        (file ? !stat.isFile() || !(stat.mode & 0o111) : !stat.isDirectory())
      )
        return {
          ready: false,
          path: HELPER,
          reason: '전용 helper와 부모 경로는 root 소유이며 일반 사용자가 수정할 수 없어야 합니다.',
          sudoPermission: 'unchecked',
        };
    }
    const digest = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
    const installedHash = digest(readFileSync(HELPER));
    const manifest = '/usr/lib/tastedev-linux/admin-helper.sha256';
    if (packaged) {
      const stat = lstatSync(manifest);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== 0 || stat.mode & 0o022)
        throw new Error('Invalid helper manifest');
    }
    const expectedHash = packaged
      ? readFileSync(manifest, 'utf8').trim()
      : digest(readFileSync(path.join(process.cwd(), 'scripts/admin/linux-admin')));
    if (!/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error('Invalid helper digest');
    if (installedHash !== expectedHash)
      return {
        ready: false,
        path: HELPER,
        reason: '설치된 관리자 helper가 현재 앱과 다릅니다. 검토한 최신 helper로 업데이트해야 합니다.',
        sudoPermission: 'unchecked',
      };
    return {
      ready: true,
      path: HELPER,
      sha256: installedHash,
      reason: '전용 helper 파일 확인 완료. sudo 허용 여부는 실제 작업 실행 시 OS에서 확인합니다.',
      sudoPermission: 'unchecked',
    };
  } catch (e) {
    return {
      ready: false,
      path: HELPER,
      reason:
        e!==null&&typeof e==='object'&&'code' in e&&e.code === 'ENOENT'
          ? '전용 관리자 helper가 설치되지 않았습니다.'
          : '전용 관리자 helper 경로를 확인할 수 없습니다.',
      sudoPermission: 'unchecked',
    };
  }
}
export function adminConfigured() {
  return process.env.LINUX_ENABLE_ADMIN === 'true';
}
export function helperCommand(action: unknown): [string,string,string,string,string] {
  if (typeof action!=='string'||!actions.has(action)) throw new Error('허용되지 않은 관리자 작업입니다.');
  return ['/usr/bin/sudo', '-n', '--', HELPER, action];
}
export function spawnHelper(action: string, payload: unknown): ChildProcessWithoutNullStreams {
  const command = helperCommand(action);
  const child = spawn(command[0], command.slice(1), {
    shell: false,
    env: { NODE_ENV: process.env.NODE_ENV, PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdin.on('error', () => {});
  child.stdin.end(JSON.stringify(payload));
  return child;
}
export async function runHelper(action: string, payload: unknown = {}): Promise<Record<string,unknown>> {
  if (!adminConfigured())
    throw Object.assign(
      new Error('관리 작업은 비활성입니다. LINUX_ENABLE_ADMIN 설정과 전용 helper 권한이 필요합니다.'),
      { status: 403 },
    );
  const readiness = helperStatus();
  if (!readiness.ready) throw Object.assign(new Error(readiness.reason), { status: 403 });
  const child = spawnHelper(action, payload);
  const timer = setTimeout(
    () => child.kill('SIGTERM'),
    ['postgresql-data-backup','postgresql-data-restore'].includes(action) ? 1300000 : [
      'postgresql-code-restore-plan',
      'postgresql-code-recovery-plan',
      'postgresql-code-plan',
      'nginx-recover',
      'redis-recover',
      'node-service-recover',
      'postgresql-hba-recover',
      'postgresql-hba-operation',
      'node-service-restore',
      'node-service-update',
      'node-service-install',
      'node-service-control',
    ].includes(action)
      ? 300000
      : ['postgresql-code-restore', 'postgresql-code-apply', 'postgresql-code-recover'].includes(action)
        ? 900000
        : [
              'service',
              'mariadb-code-plan',
              'redis-code-plan',
              'postgresql-hba-operation-plan',
              'postgresql-hba-validate',
              'nginx-config-apply',
              'nginx-config-restore',
            ].includes(action)
          ? 120000
          : [
                'mariadb-code-apply',
                'redis-code-apply',
                'mariadb-recover',
                'mariadb-restore',
                'mariadb-apply',
                'postgresql-apply',
                'postgresql-restore',
              ].includes(action)
            ? 750000
            : 30000,
  );
  const output = helperJsonOutput(action);
  const errors = helperErrorCollector();
  let outputError: unknown;
  try {
    return await new Promise<Record<string,unknown>>((resolve, reject) => {
      child.stdout.on('data', (data) => {
        if (outputError) return;
        try {
          output.write(data);
        } catch (error) {
          outputError = error;
          child.kill('SIGTERM');
        }
      });
      child.stderr.on('data', (data) => {
        if (outputError) return;
        try {
          errors.write(data);
        } catch (error) {
          outputError = error;
          child.kill('SIGTERM');
        }
      });
      child.on('error', reject);
      child.on('close', (code, signal) => {
        if (outputError) {
          reject(outputError);
          return;
        }
        if (code !== 0) {
          if (signal) {
            reject(Object.assign(new Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다. 상태와 중단 기록을 조회한 뒤 복구 여부를 확인하세요.'), { status: 503 }));
            return;
          }
          const stderr = errors.finish();
          // sudo can return 128 + signal instead of exposing a child signal.
          if (code!==null&&[137, 143].includes(code) && !stderr.trim()) {
            reject(Object.assign(new Error('관리 작업 실행이 중단되어 적용 결과를 확인할 수 없습니다. 상태와 중단 기록을 조회한 뒤 복구 여부를 확인하세요.'), { status: 503 }));
            return;
          }
          const helperFailure = helperErrorFromStderr(action, stderr);
          if (helperFailure) {
            reject(helperFailure);
            return;
          }
          const sandboxFailure = redisSandboxFailureFromStderr(action, stderr);
          if (sandboxFailure) {
            reject(sandboxFailure);
            return;
          }
          reject(
            Object.assign(
              new Error('관리 명령 실패. 전용 helper와 NOPASSWD 권한을 확인하세요. ' + stderr.slice(-2000)),
              { status: 403 },
            ),
          );
          return;
        }
        try {
          const result: unknown=JSON.parse(output.finish());if(result===null||typeof result!=='object'||Array.isArray(result))throw Error('관리 응답을 읽을 수 없습니다.');resolve(result as Record<string,unknown>);
        } catch {
          reject(new Error('관리 응답을 읽을 수 없습니다.'));
        }
      });
    });
  } finally {
    clearTimeout(timer);
  }
}
