import assert from 'node:assert/strict';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {readRuntimeModule} from '../runtime-source.ts';
import {adminRuntimeFiles} from '../admin/runtime-files.mts';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdir, writeFile, readFile, copyFile, chmod, rm,lstat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
const exec = promisify(execFile),
  fixture = await verificationWorkDirectory('linux-nginx-isolated-');
const project = process.cwd(),
  evidence = path.join(
    verificationWorkRoot,
    'nginx-isolated-' + new Date().toISOString().replaceAll(':', '-'),
  );
const runner=(await readRuntimeModule('scripts/fixtures/nginx-isolated-worker.mjs',['scripts/fixtures/nginx-isolated-worker.mjs'])).toString('utf8');
try {
  assert((await lstat('/usr/sbin/nginx')).isFile(),'설치된 nginx 실행 파일이 필요합니다.');
  const nginx = path.join(fixture, 'nginx'),
    certs = path.join(fixture, 'letsencrypt/live/fixture.example.invalid');
  await mkdir(path.join(nginx, 'conf.d'), { recursive: true });
  await mkdir(certs, { recursive: true });
  await chmod(nginx, 0o755);
  await chmod(path.join(nginx, 'conf.d'), 0o755);
  await writeFile(
    path.join(nginx, 'nginx.conf'),
    'user root;\nworker_processes 1;\nerror_log stderr;\npid /mnt/data/build/tastedev-linux/nginx-fixture.pid;\nevents { worker_connections 64; }\nhttp { client_body_temp_path /mnt/data/build/tastedev-linux/body; proxy_temp_path /mnt/data/build/tastedev-linux/proxy; fastcgi_temp_path /mnt/data/build/tastedev-linux/fastcgi; uwsgi_temp_path /mnt/data/build/tastedev-linux/uwsgi; scgi_temp_path /mnt/data/build/tastedev-linux/scgi; access_log off; include /etc/nginx/conf.d/*.conf; }\n',
  );
  await exec(
    '/usr/bin/openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      path.join(certs, 'privkey.pem'),
      '-out',
      path.join(certs, 'fullchain.pem'),
      '-days',
      '2',
      '-subj',
      '/CN=fixture.example.invalid',
    ],
    { timeout: 10000 },
  );
  await chmod(path.join(certs, 'privkey.pem'), 0o600);
  // Namespace-owned copies preserve the helper's root ownership checks without changing host files.
  await mkdir(path.join(fixture, 'usr-bin'), { mode: 0o755 });
  for (const [name, source] of [
    ['node', process.execPath],
    ['flock', '/usr/bin/flock'],
  ]) {
    await copyFile(source, path.join(fixture, 'usr-bin', name));
    await chmod(path.join(fixture, 'usr-bin', name), 0o755);
  }
  await copyFile(process.execPath, path.join(fixture, 'node'));
  await chmod(path.join(fixture, 'node'), 0o755);
  await copyFile(path.join(project, 'scripts/admin/linux-admin'), path.join(fixture, 'helper'));
  await chmod(path.join(fixture, 'helper'), 0o755);
  await writeFile(path.join(fixture, 'runner.mjs'), runner);
  await copyFile(path.join(project,'scripts/admin/package.json'),path.join(fixture,'package.json'));await mkdir(path.join(fixture,'runtime'),{mode:0o755});const hashes:Record<string,string>={};for(const name of adminRuntimeFiles){const bytes=await readAdminRuntimeModule(name);await writeFile(path.join(fixture,'runtime',name),bytes,{mode:0o644});hashes[name]=createHash('sha256').update(bytes).digest('hex');}await writeFile(path.join(fixture,'runtime/manifest.json'),JSON.stringify(hashes));
  const args = [
    '--unshare-user',
    '--uid',
    '0',
    '--gid',
    '0',
    '--unshare-pid',
    '--unshare-net',
    '--die-with-parent',
    '--new-session',
    '--ro-bind',
    '/',
    '/',
    '--tmpfs',
    '/usr',
    '--ro-bind',
    '/usr/lib',
    '/usr/lib',
    '--ro-bind',
    '/usr/lib64',
    '/usr/lib64',
    '--ro-bind',
    '/usr/sbin',
    '/usr/sbin',
    '--ro-bind',
    path.join(fixture, 'usr-bin'),
    '/usr/bin',
    '--tmpfs',
    '/var/lib',
    '--tmpfs',
    '/var/log',
    '--bind',
    nginx,
    '/etc/nginx',
    '--bind',
    path.join(fixture, 'letsencrypt'),
    '/etc/letsencrypt',
    '--bind',
    fixture,
    '/mnt',
    '--tmpfs',
    '/mnt/data/build/tastedev-linux',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    '/mnt/node',
    '/mnt/runner.mjs',
  ];
  try{await lstat('/usr/share/nodejs');args.splice(args.indexOf('--'),0,'--ro-bind','/usr/share/nodejs','/usr/share/nodejs');}catch(error){if(error===null||typeof error!=='object'||!('code' in error)||error.code!=='ENOENT')throw error;}
  await exec('/usr/bin/bwrap', args, {
    timeout: 60000,
    maxBuffer: 2 * 1048576,
    env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8',NODE_ENV:'test',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot },
  });
  const result = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'result.json'), 'utf8')));
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(
    JSON.stringify({ status: result.status, checks: result.checks, evidence: path.join(evidence, 'result.json') }),
  );
} catch (error) {
  await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:'FAIL',error:diagnostic(error),nativeRuntimeCompleted:false,hostOperationalChanges:false},null,2)+'\n');console.error('Isolated nginx verification failed: '+diagnostic(error));
  process.exitCode = 1;
} finally {
  await rm(fixture, { recursive: true, force: true });
}
