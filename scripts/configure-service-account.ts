import {hasErrorCode} from '../lib/error-code.ts';
import type {Stats} from 'node:fs';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, lstat, readFile, writeFile, rename, unlink, readdir, open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { serviceAccountRecord, serviceAccountPlan } from '../lib/service-account.ts';
const exec = promisify(execFile),
  directory = '/etc/tastedev-linux',
  identity = directory + '/service-user',
  dropDirectory = '/etc/systemd/system/tastedev-linux.service.d',
  dropFile = dropDirectory + '/10-user.conf',
  state = '/var/lib/tastedev-linux';
async function rootDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o755 });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== 0 || stat.mode & 0o022)
    throw Error('서비스 설정 디렉터리의 소유자와 쓰기 권한을 확인하세요: ' + path);
}
async function systemdAvailable() {
  try {
    return (await lstat('/run/systemd/system')).isDirectory();
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return false;
    throw error;
  }
}
async function saved() {
  try {
    const stat = await lstat(identity);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== 0 || stat.mode & 0o022)
      throw Error('서비스 실행 계정 파일의 소유자와 권한을 확인하세요.');
    return (await readFile(identity, 'utf8')).trim();
  } catch (error) {
    if (hasErrorCode(error,'ENOENT')) return null;
    throw error;
  }
}
async function lookup(name: string) {
  if (!/^[a-z_][a-z0-9_-]{0,31}\$?$/.test(name || '')) throw Error('root나 시스템 계정이 아닌, 이 서버에 존재하는 일반 Linux 로그인 계정을 지정하세요.');
  let stdout;
  try { ({ stdout } = await exec('/usr/bin/getent', ['passwd', name])); }
  catch (error) {
    if (error!==null&&typeof error==='object'&&'code' in error&&error.code===2) throw Error('이 서버에 해당 Linux 계정이 없습니다. id USERNAME으로 계정명을 확인한 뒤 다시 실행하세요.');
    throw error;
  }
  const record = serviceAccountRecord(stdout);
  if (record.name !== name) throw Error('조회한 Linux 계정이 요청한 계정과 다릅니다. 계정 정보를 확인하세요.');
  return record;
}
async function writePrivate(path: string, text: string) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== 0 || stat.mode & 0o022)
      throw Error('서비스 설정 파일의 소유자와 쓰기 권한을 확인하세요.');
  } catch (error) {
    if (!hasErrorCode(error,'ENOENT')) throw error;
  }
  const temporary = path + '.' + randomUUID();
  try {
    await writeFile(temporary, text, { flag: 'wx', mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error) => {
      if (!hasErrorCode(error,'ENOENT')) throw error;
    });
  }
}
async function stateEntries(path: string, rows: {path: string; stat: Stats}[] = []) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()) || (stat.isFile() && stat.nlink !== 1))
    throw Error('계정 저장 경로에 지원하지 않는 파일이나 링크가 있습니다: ' + path);
  rows.push({ path, stat });
  if (stat.isDirectory()) for (const name of await readdir(path)) await stateEntries(path + '/' + name, rows);
  return rows;
}
async function selectAccount(name: string) {
  const account = await lookup(name),
    previous = await saved();
  if (previous && previous !== name)
    throw Error('서비스 실행 계정이 이미 설정되어 있습니다. 기존 데이터를 보존하기 위해 다른 계정으로 자동 변경하지 않습니다.');
  await rootDirectory(directory);
  await rootDirectory('/etc/systemd');
  await rootDirectory('/etc/systemd/system');
  await rootDirectory(dropDirectory);
  await mkdir(state, { recursive: true, mode: 0o700 });
  const entries = await stateEntries(state);
  if (entries.length > 1 && entries.some((entry) => entry.stat.uid !== account.uid) && (await systemdAvailable()))
    await exec('/usr/bin/deb-systemd-invoke', ['stop', 'tastedev-linux.service']);
  for (const entry of entries) {
    const handle = await open(entry.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const current = await handle.stat();
      if (current.ino !== entry.stat.ino || current.dev !== entry.stat.dev || (current.isFile() && current.nlink !== 1))
        throw Error('계정을 설정하는 동안 저장 파일이 변경됐습니다. 다른 작업을 마친 뒤 다시 시도하세요.');
      await handle.chown(account.uid, account.gid);
      if (entry.path === state) await handle.chmod(0o700);
    } finally {
      await handle.close();
    }
  }
  await mkdir(state + '/workspace', { recursive: true, mode: 0o700 });
  const workspace = await open(state + '/workspace', constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    await workspace.chown(account.uid, account.gid);
    await workspace.chmod(0o700);
  } finally {
    await workspace.close();
  }
  await writePrivate(dropFile, serviceAccountPlan(account).text);
  await writePrivate(identity, account.name + '\n');
  return account;
}
async function main() {
  if (process.getuid?.() !== 0) throw Error('sudo를 붙여 실행하세요: sudo tastedev-linux account setup');
  const [mode, name, ...extra] = process.argv.slice(2);
  if (mode === '--account') {
    const configured = await saved();
    if (!configured) throw Error('서비스 실행 계정이 아직 설정되지 않았습니다. 먼저 sudo tastedev-linux service setup USERNAME을 실행하세요.');
    const account = await lookup(configured);
    if ((name !== undefined && name !== '--replace') || extra.length) throw Error('계정 재설정 옵션은 --replace만 사용할 수 있습니다.');
    const child = spawn(
      '/usr/sbin/runuser',
      [
        '-u',
        account.name,
        '--',
        '/usr/bin/env',
        'LINUX_PACKAGED=true',
        'LINUX_STATE_ROOT=' + state,
        'LINUX_AUTH_ROOT=' + state,
        '/usr/bin/node',
        '/usr/lib/tastedev-linux/scripts/setup-admin.mjs',
        ...(name ? [name] : []),
      ],
      { stdio: 'inherit' },
    );
    process.exitCode = await new Promise<number>((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code) => resolve(code ?? 1));
    });
    return;
  }
  if (
    !['--install', '--setup'].includes(mode) ||
    extra.length ||
    (mode === '--setup' && !name) ||
    (mode === '--install' && name)
  )
    throw Error('사용법: sudo tastedev-linux service setup USERNAME');
  const previous = await saved(),
    chosen = mode === '--setup' ? name : previous || (process.env.SUDO_USER === 'root' ? null : process.env.SUDO_USER);
  if (!chosen) {
    console.error('먼저 Linux 실행 계정을 지정하세요: sudo tastedev-linux service setup USERNAME (USERNAME을 실제 계정명으로 바꾸세요)');
    process.exitCode = 3;
    return;
  }
  await selectAccount(chosen);
  if (mode === '--setup' && (await systemdAvailable())) {
    await exec('/usr/bin/systemctl', ['daemon-reload']);
    await exec('/usr/bin/deb-systemd-invoke', ['restart', 'tastedev-linux.service']);
  }
  console.log('서비스 실행 계정: ' + chosen);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : '서비스 계정 설정에 실패했습니다.');
  process.exitCode = 1;
});
