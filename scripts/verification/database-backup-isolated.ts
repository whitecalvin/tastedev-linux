import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {readRuntimeModule} from '../runtime-source.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import assert from 'node:assert/strict';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import { adminRuntimeFiles } from '../admin/runtime-files.mts';
import { mkdtemp, mkdir, writeFile, readFile, copyFile, chmod, rm, readdir, symlink, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:net';
const exec = promisify(execFile),
  hash = (bytes:string|Buffer) => createHash('sha256').update(bytes).digest('hex');
const project = process.cwd(),
  index = process.argv.indexOf('--next-build'),
  build = index < 0 ? null : process.argv[index + 1];
if (index >= 0 && (!build || !path.isAbsolute(build))) throw Error('Pass an absolute source build directory.');
const binaryIndex = process.argv.indexOf('--redis-binary'),
  redisBinary = binaryIndex < 0 ? null : process.argv[binaryIndex + 1];
if (binaryIndex >= 0 && (!redisBinary || !path.isAbsolute(redisBinary)))
  throw Error('Pass an absolute trusted Redis binary.');
const gui = process.argv.includes('--gui');
if (gui && !build) throw Error('GUI verification requires --next-build.');
let webPort = 18082;
if (gui) {
  const socket = createServer();
  await new Promise<void>((resolve,reject) => {socket.once("error",reject);socket.listen(0, '127.0.0.2', resolve);});
  const address=socket.address();assert(address&&typeof address==='object');webPort = address.port;
  await new Promise<void>((resolve) => socket.close(()=>resolve()));
}
const fixture = await verificationWorkDirectory('tastedev-db-backup-isolated-');
const evidence = path.join(
  verificationWorkRoot,
  'database-backup-isolated-' + new Date().toISOString().replaceAll(':', '-'),
);

try {
  if (build) {
    await assertCurrentCompiledSource(build);
    await readFile(path.join(build, '.next/BUILD_ID'));
  }
  const bins = path.join(fixture, 'bin'),
    libraries = path.join(fixture, 'lib'),
    admin = path.join(libraries, 'tastedev-linux/scripts/admin');
  await mkdir(bins, { mode: 0o755 });
  await mkdir(path.join(admin, 'runtime'), { recursive: true, mode: 0o755 });
  for (const [name, source] of [
    ['node', process.execPath],
    ['flock', '/usr/bin/flock'],
  ] as const) {
    await copyFile(source, path.join(bins, name));
    await chmod(path.join(bins, name), 0o755);
  }
  if (redisBinary) {
    const bytes = await readFile(redisBinary);
    if (hash(bytes) !== '7f9da8f483641605264bbcd60df40e14c5644bf786c462a29c4eef14976bc6da')
      throw Error('Redis fixture binary differs from reviewed official 8.0.5 asset');
    await writeFile(path.join(bins, 'redis-server'), bytes, { mode: 0o755 });
    for (const binary of ['bwrap', 'prlimit', 'true']) {
      await copyFile('/usr/bin/' + binary, path.join(bins, binary));
      await chmod(path.join(bins, binary), 0o755);
    }
  }
  for (const name of ['linux-admin', 'package.json']) {
    await copyFile(path.join(project, 'scripts/admin', name), path.join(admin, name));
    await chmod(path.join(admin, name), name === 'linux-admin' ? 0o755 : 0o644);
  }
  const hashes:Record<string,string> = {};
  for (const name of adminRuntimeFiles) {
    const bytes = await readAdminRuntimeModule(name,project);
    await writeFile(path.join(admin, 'runtime', name), bytes, { mode: 0o644 });
    hashes[name] = hash(bytes);
  }
  await writeFile(path.join(admin, 'runtime/manifest.json'), JSON.stringify(hashes), { mode: 0o644 });
  await writeFile(
    path.join(libraries, 'tastedev-linux/admin-helper.sha256'),
    hash(await readFile(path.join(admin, 'linux-admin'))) + '\n',
    { mode: 0o644 },
  );
  const command='scripts/fixtures/database-backup-command.mjs';
  const commandBytes=await readRuntimeModule(command,[command],project);
  await writeFile(path.join(bins,'package.json'),JSON.stringify({type:'module'}));
  for(const name of ['systemctl',...(gui?['dpkg-query']:[]),...(build?['sudo']:[])])await writeFile(path.join(bins,name),Buffer.concat([Buffer.from('#!/usr/bin/node\n'),commandBytes]),{mode:0o755});
  for (const directory of ['redis', 'mysql/mariadb.conf.d'])
    await mkdir(path.join(fixture, directory), { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(fixture, 'redis/redis.conf'),
    '# 한글 fixture\nport 6379\nrequirepass fixture-only-secret\n',
    { mode: 0o600 },
  );
  await writeFile(
    path.join(fixture, 'mysql/mariadb.conf.d/50-server.cnf'),
    '# 한글 fixture\n[mysqld]\nmax_connections=100\n',
    { mode: 0o600 },
  );
  const runtime=path.join(fixture,'runtime'),worker='scripts/fixtures/database-backup-worker.mjs';
  const allowed=[worker,'scripts/verification/http-json.mjs'];
  async function collect(dir:string):Promise<void>{for(const item of await readdir(path.join(project,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await collect(name);else if(/\.(ts|mts)$/.test(name))allowed.push(name.replace(/\.(ts|mts)$/,'.mjs'));}}
  await collect('lib');
  for(const name of allowed){await mkdir(path.dirname(path.join(runtime,name)),{recursive:true});const bytes=await readRuntimeModule(name,allowed,project);await writeFile(path.join(runtime,name),bytes);}
  await symlink(path.join(project,'node_modules'),path.join(runtime,'node_modules'),'dir');
  const args = [
    '--setenv','FIXTURE_WEB_ORIGIN',gui?'http://127.0.0.2:'+webPort:'http://127.0.0.1:18082',
    ...['TMPDIR','TMP','TEMP'].flatMap(name=>['--setenv',name,verificationWorkRoot]),
    '--unshare-user',
    '--uid',
    '0',
    '--gid',
    '0',
    '--unshare-pid',
    '--unshare-net',
    '--die-with-parent',
    '--new-session',
    '--tmpfs',
    '/',
    '--dir',
    '/usr',
    '--bind',
    libraries,
    '/usr/lib',
    '--ro-bind',
    '/usr/lib/x86_64-linux-gnu',
    '/usr/lib/x86_64-linux-gnu',
    '--ro-bind',
    '/usr/lib64',
    '/usr/lib64',
    '--ro-bind',
    bins,
    '/usr/bin',
    '--symlink',
    'usr/bin',
    '/bin',
    '--symlink',
    'usr/lib',
    '/lib',
    '--symlink',
    'usr/lib64',
    '/lib64',
    '--tmpfs',
    verificationWorkRoot,
    '--tmpfs',
    '/var',
    '--tmpfs',
    '/etc',
    '--ro-bind',
    '/etc/passwd',
    '/etc/passwd',
    '--ro-bind',
    '/etc/group',
    '/etc/group',
    '--bind',
    path.join(fixture, 'redis'),
    '/etc/redis',
    '--bind',
    path.join(fixture, 'mysql'),
    '/etc/mysql',
    '--bind',
    fixture,
    '/mnt',
    '--ro-bind',
    project,
    '/mnt/source',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    '/usr/bin/node',
    '/mnt/runtime/scripts/fixtures/database-backup-worker.mjs',
  ];
  try{await lstat('/usr/share/nodejs');args.splice(args.indexOf('--proc'),0,'--ro-bind','/usr/share/nodejs','/usr/share/nodejs');}catch{}
  if (build) {
    args.splice(args.indexOf('--proc'), 0, '--ro-bind', project, project, '--ro-bind', build, '/mnt/build');
    args.push('--next');
  }
  if (gui) {
    args.splice(args.indexOf('--unshare-net'), 1);
    args.push('--gui');
    console.log(
      JSON.stringify({
        status: 'GUI_STARTING',
        fixture,
        ready: path.join(fixture, 'gui-ready.json'),
        login: path.join(fixture, 'gui-login.json'),
        stop: path.join(fixture, 'gui-stop'),
      }),
    );
  }
  await exec('/usr/bin/bwrap', args, {
    timeout: gui ? 330000 : 60000,
    maxBuffer: 1048576,
    env: { NODE_ENV:'test',PATH: '/usr/bin:/usr/sbin', LANG: 'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot },
  });
  const result = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'result.json'), 'utf8')));
  if (build) result.build = build;
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(
    JSON.stringify({ status: result.status, checks: result.checks, evidence: path.join(evidence, 'result.json') }),
  );
} catch (error) {
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(
    path.join(evidence, 'result.json'),
    JSON.stringify(
      { status: 'FAIL', diagnostic: diagnostic(error), hostOperationalChanges: false },
      null,
      2,
    ) + '\n',
    { mode: 0o600 },
  );
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  await rm(fixture, { recursive: true, force: true });
}
