import {readRuntimeModule} from '../runtime-source.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './work-directory.ts';
import {assertCurrentCompiledSource} from './compiled-source-check.ts';
import {jsonRecord} from './http-json.ts';
import {diagnostic} from './nginx-native-report.ts';
import {hasErrorCode} from '../../lib/error-code.ts';
import assert from 'node:assert/strict';
import {readAdminRuntimeModule} from '../admin/runtime-source.mts';
import { adminRuntimeFiles } from '../admin/runtime-files.mts';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, copyFile, chmod, rm, lstat, readdir, symlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:net';
const exec = promisify(execFile);
const buildOption = process.argv.indexOf('--next-build'),
  build = buildOption >= 0 ? process.argv[buildOption + 1] : null;
if (buildOption >= 0 && (!build || !path.isAbsolute(build))) throw Error('Pass an absolute source build directory.');
const apiMode = Boolean(build) || process.argv.includes('--api');
const crossGuard = process.argv.includes('--site-cross-guard'),
  interruptionsMode = process.argv.includes('--site-interruptions'),
  recoveryGui = process.argv.includes('--site-recovery-gui');
const sitesMode = process.argv.includes('--sites') || interruptionsMode || recoveryGui || crossGuard;
const guiMode = process.argv.includes('--gui');
const configRestoreGui = process.argv.includes('--config-restore-gui');
if(configRestoreGui&&!guiMode)throw Error('Configuration restore GUI requires --gui.');
if (guiMode && !build) throw Error('GUI verification requires --next-build.');
const fixture=await verificationWorkDirectory('linux-nginx-isolated-');
async function freePort() {
  const socket = createServer();
  await new Promise<void>((resolve,reject) => {socket.once("error",reject);socket.listen(0, '127.0.0.1', resolve);});
  const address=socket.address();assert(address&&typeof address==='object');const port = address.port;
  await new Promise<void>((resolve) => socket.close(()=>resolve()));
  return port;
}
const nginxPort = guiMode ? await freePort() : 18081,
  webPort = guiMode ? await freePort() : 18082,
  sitePort = guiMode ? await freePort() : 18083;
const project = process.cwd(),
  evidence = path.join(
    verificationWorkRoot,
    (build ? 'nginx-next-isolated-' : apiMode ? 'nginx-api-isolated-' : 'nginx-helper-isolated-') +
      new Date().toISOString().replaceAll(':', '-'),
  );

try {
  if (build) {
    await assertCurrentCompiledSource(build);
    await readFile(path.join(build, '.next/BUILD_ID'));
  }
  const nginx = path.join(fixture, 'nginx');
  await mkdir(path.join(nginx, 'conf.d'), { recursive: true });
  await chmod(nginx, 0o755);
  await chmod(path.join(nginx, 'conf.d'), 0o755);
  if (sitesMode) {
    for (const group of ['sites-available', 'sites-enabled']) await mkdir(path.join(nginx, group), { mode: 0o755 });
    await writeFile(
      path.join(nginx, 'sites-available/site-fixture'),
      'server { listen ' +
        (guiMode ? '127.0.0.2' : '127.0.0.1') +
        ':' +
        sitePort +
        '; location / { return 200 \"site-active\"; } }',
      { mode: 0o600 },
    );
  }
  await writeFile(
    path.join(nginx, 'nginx.conf'),
    'user root;\nworker_processes 1;\nerror_log stderr;\npid /mnt/data/build/tastedev-linux/nginx-fixture.pid;\nevents { worker_connections 64; }\nhttp { client_body_temp_path /mnt/data/build/tastedev-linux/body; proxy_temp_path /mnt/data/build/tastedev-linux/proxy; fastcgi_temp_path /mnt/data/build/tastedev-linux/fastcgi; uwsgi_temp_path /mnt/data/build/tastedev-linux/uwsgi; scgi_temp_path /mnt/data/build/tastedev-linux/scgi; access_log off; include /etc/nginx/conf.d/*.conf; }\n',
    { mode: 0o600 },
  );
  if (sitesMode) {
    const main = path.join(nginx, 'nginx.conf');
    await writeFile(
      main,
      (await readFile(main, 'utf8')).replace(
        'include /etc/nginx/conf.d/*.conf;',
        'include /etc/nginx/conf.d/*.conf; include /etc/nginx/sites-enabled/*;',
      ),
    );
  }
  // Private namespace binaries and configuration; host files remain read-only.
  await mkdir(path.join(fixture, 'usr-bin'), { mode: 0o755 });
  for (const [name, source] of [
    ['flock', '/usr/bin/flock'],
  ] as const) {
    await copyFile(source, path.join(fixture, 'usr-bin', name));
    await chmod(path.join(fixture, 'usr-bin', name), 0o755);
  }
  if (guiMode) {
    await copyFile('/usr/bin/dpkg-query', path.join(fixture, 'usr-bin/dpkg-query'));
    await chmod(path.join(fixture, 'usr-bin/dpkg-query'), 0o755);
  }
  // Bind the same native executable read-only instead of duplicating 242 MB.
  await writeFile(path.join(fixture,'node'),'');
  await writeFile(path.join(fixture,'usr-bin/node'),'');

  const runtime=path.join(fixture,'runtime'),worker='scripts/fixtures/nginx-helper-worker.mjs',allowed=[worker,'scripts/verification/http-json.mjs'];
  async function collect(dir:string):Promise<void>{for(const item of await readdir(path.join(project,dir),{withFileTypes:true})){const name=dir+'/'+item.name;if(item.isDirectory())await collect(name);else if(/\.(ts|mts)$/.test(name))allowed.push(name.replace(/\.(ts|mts)$/,'.mjs'));}}
  await collect('lib');
  for(const name of allowed){await mkdir(path.dirname(path.join(runtime,name)),{recursive:true});let bytes=await readRuntimeModule(name,allowed,project);if(name===worker)bytes=Buffer.from((guiMode?bytes.toString('utf8').replaceAll('127.0.0.1','127.0.0.2'):bytes.toString('utf8')).replaceAll('18081',String(nginxPort)).replaceAll('18082',String(webPort)).replaceAll('18083',String(sitePort)));await writeFile(path.join(runtime,name),bytes);}
  await symlink(apiMode?'/mnt/source/node_modules':path.join(project,'node_modules'),path.join(runtime,'node_modules'),'dir');
  const usrLib = path.join(fixture, 'usr-lib'),
    admin = path.join(usrLib, 'tastedev-linux/scripts/admin');
  await mkdir(path.join(admin, 'runtime'), { recursive: true, mode: 0o755 });
  for (const name of ['linux-admin', 'package.json']) {
    await copyFile(path.join(project, 'scripts/admin', name), path.join(admin, name));
    await chmod(path.join(admin, name), name === 'linux-admin' ? 0o755 : 0o644);
  }
  const hashes:Record<string,string> = {};
  for (const name of adminRuntimeFiles) {
    let bytes = await readAdminRuntimeModule(name,project);
    if (name === 'nginx-site-operation.mjs' && (interruptionsMode || recoveryGui || crossGuard)) {
      const originalHash = createHash('sha256').update(bytes).digest('hex');
      let text = bytes.toString('utf8');
      const edits:[RegExp,string][] = [
        [
          /await writeRecord\(backupRoot,\s*record,\s*true\);/g,
          "await writeRecord(backupRoot,record,true);await fixtureCheckpoint('prepared');",
        ],
        [
          /record\.phase\s*=\s*['"]changed['"];\s*await writeRecord\(backupRoot,\s*record\);/g,
          "record.phase='changed';await writeRecord(backupRoot,record);await fixtureCheckpoint('changed');",
        ],
        [
          /record\.phase\s*=\s*['"]reloading['"];\s*await writeRecord\(backupRoot,\s*record\);\s*reloading\s*=\s*true;\s*await hooks\.activate\(\);/g,
          "record.phase='reloading';await writeRecord(backupRoot,record);await fixtureCheckpoint('reloading');reloading=true;await hooks.activate();await fixtureCheckpoint('reload-completed');",
        ],
      ];
      for (const [before, after] of edits) {
        if ((text.match(before)??[]).length !== 1) throw Error('Checkpoint insertion differs from current operation source');
        text = text.replace(before, after);
      }
      const checkpoint='scripts/fixtures/nginx-site-checkpoint.mjs';
      text+='\n'+(await readRuntimeModule(checkpoint,[checkpoint],project)).toString('utf8');
      bytes = Buffer.from(text);
      await writeFile(
        path.join(fixture, 'site-instrumentation.json'),
        JSON.stringify({
          sourceSha256: originalHash,
          instrumentedSha256: createHash('sha256').update(bytes).digest('hex'),
          phases: ['prepared', 'changed', 'reloading', 'reload-completed'],
          onlyNamespaceCopyChanged: true,
        }),
        { mode: 0o600 },
      );
    }
    await writeFile(path.join(admin, 'runtime', name), bytes, { mode: 0o644 });
    hashes[name] = createHash('sha256').update(bytes).digest('hex');
  }
  await writeFile(path.join(admin, 'runtime/manifest.json'), JSON.stringify(hashes), { mode: 0o644 });
  await writeFile(
    path.join(usrLib, 'tastedev-linux/admin-helper.sha256'),
    createHash('sha256')
      .update(await readFile(path.join(admin, 'linux-admin')))
      .digest('hex') + '\n',
    { mode: 0o644 },
  );
  const command='scripts/fixtures/nginx-helper-command.mjs';
  const commandBytes=Buffer.concat([Buffer.from('#!/usr/bin/node\n'),await readRuntimeModule(command,[command],project)]);
  await writeFile(path.join(fixture,'usr-bin/package.json'),JSON.stringify({type:'module'}),{mode:0o644});
  if(apiMode)await writeFile(path.join(fixture,'usr-bin/sudo'),commandBytes,{mode:0o755});
  const usrSbin = path.join(fixture, 'usr-sbin');
  await mkdir(usrSbin, { mode: 0o755 });
  await copyFile('/usr/sbin/nginx', path.join(usrSbin, 'nginx'));
  await chmod(path.join(usrSbin, 'nginx'), 0o755);
  await writeFile(path.join(fixture,'usr-bin/systemctl'),commandBytes,{mode:0o755});
  const args = [
    '--cap-add',
    'CAP_SETGID',
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
    '--bind',
    usrLib,
    '/usr/lib',
    '--ro-bind',
    '/usr/lib/x86_64-linux-gnu',
    '/usr/lib/x86_64-linux-gnu',
    '--ro-bind',
    '/usr/lib64',
    '/usr/lib64',
    '--ro-bind',
    usrSbin,
    '/usr/sbin',
    '--ro-bind',
    path.join(fixture, 'usr-bin'),
    '/usr/bin',
    '--tmpfs',
    '/var',
    '--tmpfs',
    '/var/lib',
    '--tmpfs',
    '/var/log',
    '--bind',
    nginx,
    '/etc/nginx',
    '--bind',
    fixture,
    '/mnt',
    '--proc',
    '/proc',
    '--dev',
    '/dev',
    '--',
    '/mnt/node',
    '/mnt/runtime/scripts/fixtures/nginx-helper-worker.mjs',
  ];
  args.splice(args.indexOf('--proc'),0,'--perms','0700','--tmpfs',verificationWorkRoot);
  try{await lstat('/usr/share/nodejs');args.splice(args.indexOf('--proc'),0,'--ro-bind','/usr/share/nodejs','/usr/share/nodejs');}catch{}
  args.splice(args.indexOf('--proc'),0,'--ro-bind',process.execPath,'/usr/bin/node','--ro-bind',process.execPath,'/mnt/node');
  if (configRestoreGui) args.push('--config-restore-gui');
  if (crossGuard) args.push('--site-cross-guard');
  if (sitesMode) args.push('--sites');
  if (interruptionsMode) args.push('--site-interruptions');
  if (recoveryGui) args.push('--site-recovery-gui');
  if (apiMode) {
    args.splice(args.indexOf('--proc'), 0, '--ro-bind', project, '/mnt/source');
    args.push('--api');
  }
  if (build) {
    args.splice(args.indexOf('--proc'), 0, '--ro-bind', project, project, '--ro-bind', build, '/mnt/build');
    args.push('--next');
  }
  if (guiMode) {
    args.splice(args.indexOf('--unshare-net'), 1);
    args.splice(args.indexOf('--proc'), 0, '--ro-bind', '/var/lib/dpkg', '/var/lib/dpkg');
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
    maxBuffer: 2 * 1048576,
    env: { NODE_ENV:'test',PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8',TMPDIR:verificationWorkRoot,TMP:verificationWorkRoot,TEMP:verificationWorkRoot },
  });
  const result = jsonRecord(JSON.parse(await readFile(path.join(fixture, 'result.json'), 'utf8')));
  if (build) result.build = build;
  if (recoveryGui)
    result.checkpointInstrumentation = jsonRecord(JSON.parse(
      await readFile(path.join(fixture, 'site-instrumentation.json'), 'utf8'),
    ));
  await mkdir(evidence, { recursive: true, mode: 0o700 });
  await writeFile(path.join(evidence, 'result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  if(configRestoreGui)await copyFile(path.join(fixture,'gui-native-proof.json'),path.join(evidence,'gui-native-proof.json'));
  if (guiMode)
    try {
      await copyFile(path.join(fixture, 'gui-workflow.json'), path.join(evidence, 'gui-workflow.json'));
    } catch (error) {
      if (!hasErrorCode(error,'ENOENT')) throw error;
    }
  console.log(
    JSON.stringify({ status: result.status, checks: result.checks, evidence: path.join(evidence, 'result.json') }),
  );
} catch (error) {
  await mkdir(evidence,{recursive:true,mode:0o700});await writeFile(path.join(evidence,'result.json'),JSON.stringify({status:'FAIL',diagnostic:diagnostic(error),hostOperationalChanges:false},null,2)+'\n',{mode:0o600});console.error(JSON.stringify({status:'FAIL',evidence:path.join(evidence,'result.json')}));
  process.exitCode = 1;
} finally {
  await rm(fixture, { recursive: true, force: true });
}
