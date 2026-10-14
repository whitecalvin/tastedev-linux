import {readRuntimeModule} from '../runtime-source.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {jsonRecord,recordField} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import { mkdir, writeFile, readFile, copyFile, chmod, rm, readdir, symlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const exec = promisify(execFile),
  project = process.cwd();
const buildIndex = process.argv.indexOf('--next-build'),
  build = buildIndex >= 0 ? process.argv[buildIndex + 1] : null;
if (buildIndex >= 0 && (!build || !path.isAbsolute(build))) throw Error('Pass an absolute source build directory.');
const guiMode = process.argv.includes('--gui');
if (guiMode && !build) throw Error('GUI verification requires --next-build.');
if(!process.getuid||!process.getgid)throw Error('Linux identity support required');const uid=process.getuid(),gid=process.getgid();
if (uid === 0) throw Error('Run this verification from an ordinary OS account.');
const fixture = await verificationWorkDirectory('tastedev-cron-user-isolated-');

try {
  if (build) {
    await assertCurrentCompiledSource(build);
    await readFile(path.join(build, '.next/BUILD_ID'));
  }
  await copyFile('/usr/bin/crontab', path.join(fixture, 'crontab'));
  await chmod(path.join(fixture, 'crontab'), 0o755);
  const runtime=path.join(fixture,'runtime'),worker='scripts/fixtures/cron-user-worker.mjs',allowed=[worker,'scripts/verification/http-json.mjs'];
  async function collect(dir:string):Promise<void>{for(const item of await readdir(path.join(project,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await collect(name);else if(/\.(ts|mts)$/.test(name))allowed.push(name.replace(/\.(ts|mts)$/,'.mjs'));}}
  await collect('lib');
  for(const name of allowed){await mkdir(path.dirname(path.join(runtime,name)),{recursive:true});const bytes=await readRuntimeModule(name,allowed,project);await writeFile(path.join(runtime,name),guiMode&&name===worker?bytes.toString('utf8').replaceAll('127.0.0.1','127.0.0.2'):bytes);}
  await symlink(path.join(project,'node_modules'),path.join(runtime,'node_modules'),'dir');
  const args = [
    '--unshare-user',
    '--uid',
    String(uid),
    '--gid',
    String(gid),
    '--unshare-pid',
    '--unshare-net',
    '--die-with-parent',
    '--new-session',
    '--ro-bind',
    '/',
    '/',
    '--tmpfs',
    '/var/spool',
    '--tmpfs',
    verificationWorkRoot,
    '--ro-bind',
    project,
    '/mnt/data/build/tastedev-linux/cron-source',
    '--ro-bind',
    path.join(fixture, 'crontab'),
    '/usr/bin/crontab',
    '--bind',
    fixture,
    '/mnt/data/build/tastedev-linux/cron-evidence',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    process.execPath,
    '/mnt/data/build/tastedev-linux/cron-evidence/runtime/scripts/fixtures/cron-user-worker.mjs',
  ];
  if (build) {
    args.splice(args.indexOf('--proc'), 0, '--ro-bind', project, project, '--ro-bind', build, '/mnt/data/build/tastedev-linux/cron-build');
    args.push('--next');
  }
  if (guiMode) {
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
    timeout: guiMode ? 330000 : 90000,
    maxBuffer: 1048576,
    env: {
      NODE_ENV: 'test',
      TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot,
      PATH: '/usr/bin:/bin',
      LANG: 'C.UTF-8',
      LINUX_ENABLE_CRON: 'true',
      LINUX_ENABLE_ADMIN: 'false',
      LINUX_STATE_ROOT: '/mnt/data/build/tastedev-linux/cron-evidence/state',
      LINUX_AUTH_ROOT: '/mnt/data/build/tastedev-linux/cron-evidence/auth',
      LINUX_WORKSPACE_ROOT: '/mnt/data/build/tastedev-linux/cron-evidence/workspace',
    },
  });
  const result = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'result.json'), 'utf8')));
  if (build) result.build = build;
  const evidence = path.join(
    verificationWorkRoot,
    (guiMode ? 'cron-gui-isolated-' : build ? 'cron-next-isolated-' : 'cron-user-isolated-') +
      new Date().toISOString().replaceAll(':', '-'),
  );
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(
    JSON.stringify({ status: result.status, checks: result.checks, evidence: path.join(evidence, 'result.json') }),
  );
} catch (error) {
  console.error(diagnostic(error));
  process.exitCode = 1;
} finally {
  await rm(fixture, { recursive: true, force: true });
}
