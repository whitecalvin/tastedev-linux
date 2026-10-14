import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {readRuntimeModule} from './runtime-source.ts';
import {jsonRecord} from './verification/http-json.ts';
import {diagnostic} from './verification/nginx-native-report.ts';
import {readAdminRuntimeModule} from './admin/runtime-source.mts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, copyFile, chmod, readFile, writeFile, rm, symlink, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { adminRuntimeFiles } from './admin/runtime-files.mts';
const exec = promisify(execFile),
  docker = '/usr/local/bin/docker',
  context = 'desktop-linux',
  id = randomUUID(),
  name = 'tastedev-admin-lock-' + id,
  hash = (value:string|Buffer) => createHash('sha256').update(value).digest('hex');
const nodeIndex=process.argv.indexOf('--node-binary'),executionNode=nodeIndex<0?process.execPath:process.argv[nodeIndex+1];
assert(executionNode&&path.isAbsolute(executionNode));assert(process.argv.length===2||(nodeIndex===2&&process.argv.length===4));
if(nodeIndex>=0){assert(executionNode.startsWith(verificationWorkRoot+'/'));const stat=await lstat(executionNode);assert(stat.isFile()&&!stat.isSymbolicLink()&&!(stat.mode&0o022)&&await realpath(executionNode)===executionNode);}
let active = false;
assert(process.getuid?.() !== 0);
const root=await verificationWorkDirectory('tastedev-admin-lock-native-');
const call = async (args:readonly string[]) =>
  (await exec(docker, ['--context', context, ...args], { timeout: 10000, maxBuffer: 1048576 })).stdout;
try {
  assert.equal(
    (await call(['context', 'inspect', context, '--format', '{{.Endpoints.docker.Host}}'])).trim(),
    'unix://' + path.join(process.env.HOME??'', '.docker/desktop/docker.sock'),
  );
  const image = jsonRecord(JSON.parse(await call(['image', 'inspect', 'postgres:16', '--format', '{{json .}}'])));
  assert.equal(image.Os, 'linux');
  assert.equal(image.Architecture, process.arch === 'x64' ? 'amd64' : 'arm64');
  assert(typeof image.Id==='string');assert.match(image.Id, /^sha256:[a-f0-9]{64}$/);
  for (const folder of ['scripts', 'scripts/fixtures', 'admin', 'admin/runtime'])
    await mkdir(root + '/' + folder, { mode: 0o700 });
  await copyFile(executionNode, root + '/node');
  await chmod(root + '/node', 0o700);
  for (const file of ['linux-admin', 'package.json']) await copyFile('scripts/admin/' + file, root + '/admin/' + file);
  const manifest:Record<string,string> = {};
  for (const file of adminRuntimeFiles) {
    const bytes = await readAdminRuntimeModule(file);
    assert(bytes.length < 1048576);
    manifest[file] = hash(bytes);
    await writeFile(root + '/admin/runtime/' + file, bytes, { mode: 0o600 });
  }
  await writeFile(root + '/admin/runtime/manifest.json', JSON.stringify(manifest), { mode: 0o600 });
  const fixtures=['scripts/fixtures/admin-lock-native-driver.mjs','scripts/fixtures/admin-lock-native-parent.mjs'];
  const allowed=[...fixtures,...adminRuntimeFiles.map(name=>'lib/'+name)];
  for(const file of fixtures)await writeFile(root+'/'+file,await readRuntimeModule(file,allowed));
  await symlink('/usr/lib/tastedev-linux/scripts/admin/runtime',root+'/lib','dir');
  const tar = (
    await exec('/usr/bin/tar', ['-cf', '-', '-C', path.dirname(root), path.basename(root)], {
      encoding: 'buffer',
      maxBuffer: 132 * 1024 * 1024,
      timeout: 15000,
    })
  ).stdout;
  assert(tar.length < 132 * 1024 * 1024);
  const script =
    'set -eu\numask 077\nmkdir -p '+verificationWorkRoot+'\ntar --no-same-owner -xf - -C '+verificationWorkRoot+'\ntest ! -e /usr/bin/node\ncp ' +
    root +
    '/node /usr/bin/node\nchmod 700 /usr/bin/node\nmkdir -p /usr/lib/tastedev-linux/scripts\ncp -R ' +
    root +
    '/admin /usr/lib/tastedev-linux/scripts/admin\nchmod -R go-w /usr/lib/tastedev-linux\nexec /usr/bin/node ' +
    root +
    '/scripts/fixtures/admin-lock-native-driver.mjs';
  active = true;
  const pending = exec(
    docker,
    [
      '--context',
      context,
      'run',
      '--rm',
      '--pull',
      'never',
      '--name',
      name,
      '--label',
      'tastedev.verification=' + id,
      '--network',
      'none',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges=true',
      '--pids-limit',
      '96',
      '--memory',
      '768m',
      '--cpus',
      '1',
      '--user',
      '0:0',
      '--tmpfs',
      verificationWorkRoot+':rw,exec,nosuid,nodev,uid=0,gid=0,mode=700,size=256m',
      '-e','TASTEDEV_LOCK_FIXTURE=1',
      ...['TMPDIR','TMP','TEMP'].flatMap(key=>['-e',key+'='+verificationWorkRoot]),
      '--tmpfs',
      '/etc/postgresql:rw,noexec,nosuid,nodev,uid=0,gid=0,mode=700,size=8m',
      '-i',
      '--entrypoint',
      '/bin/sh',
      image.Id,
      '-c',
      script,
    ],
    { timeout: 120000, maxBuffer: 1048576 },
  );
  assert(pending.child.stdin);pending.child.stdin.on('error', () => {});
  pending.child.stdin.end(tar);
  const native = jsonRecord(JSON.parse((await pending).stdout.trim()));
  assert.equal(native.status, 'PASS');
  assert.equal(native.uid, 0);
  assert.equal(native.helperSha256, hash(await readFile('scripts/admin/linux-admin')));
  assert.equal(native.runtimeSha256, manifest['admin-native-exec.mjs']);
  try {
    await call(['container', 'inspect', name]);
    assert.fail('Container still exists');
  } catch (error) {
    assert(/No such (?:container|object)/i.test(diagnostic(error)));
  }
  active = false;
  const evidence = {
    ...native,
    context,
    imageId: image.Id,
    imageDigests: image.RepoDigests,
    snapshotSha256: hash(tar),
    executionNodeSha256:hash(await readFile(executionNode)),
    hostBindMounts: false,
    network: 'none',
    imagePull: false,
    disposableWritableLayer: true,
    hostPackageOrServiceChanges: false,
    cleanupVerified: true,
  };
  const file = path.resolve(
    verificationWorkRoot,'admin-lock-native-' + new Date().toISOString().replaceAll(':', '-') + '.json',
  );
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ ...evidence, evidence: file }));
} catch(error){
  const failure=path.join(verificationWorkRoot,'admin-lock-native-failure-'+new Date().toISOString().replaceAll(':','-')+'.json');
  await writeFile(failure,JSON.stringify({status:'FAIL',diagnostic:diagnostic(error),hostPackageOrServiceChanges:false},null,2)+'\n',{mode:0o600});console.error(JSON.stringify({status:'FAIL',evidence:failure}));process.exitCode=1;
} finally {
  try {
    if (active) {
      try {
        assert.equal(
          (
            await call(['container', 'inspect', '--format', '{{index .Config.Labels "tastedev.verification"}}', name])
          ).trim(),
          id,
        );
        await call(['rm', '--force', name]);
      } catch (error) {
        if (!/No such (?:container|object)/i.test(diagnostic(error))) throw error;
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
