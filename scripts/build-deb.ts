import assert from 'node:assert/strict';
import {jsonRecord} from './verification/http-json.ts';
import {hasErrorCode} from '../lib/error-code.ts';
import {startupRuntimeFiles,readStartupRuntimeModule} from './startup-runtime-source.ts';
import {readAdminRuntimeModule} from './admin/runtime-source.mts';
import {assertAdminHelperCurrent} from './admin/error-output-source.mts';
import {buildWorkspace} from './build-workspace.ts';
import { adminRuntimeFiles } from './admin/runtime-files.mts';
import { mkdtemp, mkdir, cp, copyFile, writeFile, chmod, rm, readdir, readFile } from 'node:fs/promises';

import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const exec=promisify(execFile);
const architectures:Record<string,string>={x64:'amd64',arm64:'arm64'};const architecture=architectures[process.arch];if(!architecture)throw Error('Unsupported package build architecture: '+process.arch);
const project=process.cwd(),metadata=jsonRecord(JSON.parse(await readFile('package.json','utf8')));
assert.equal(metadata.name,'tastedev-linux','서버 관리 앱 프로젝트를 확인하세요.');
assert(typeof metadata.version==='string'&&/^\d+(?:\.\d+)*(?:[-+~][a-zA-Z0-9.+~-]+)?$/.test(metadata.version),'패키지 버전을 확인하세요.');
const version=metadata.version;
function dependencies(value:unknown):Record<string,unknown>{if(value===undefined)return {};const result=jsonRecord(value);for(const [name,spec] of Object.entries(result))assert(/^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/i.test(name)&&typeof spec==='string','패키지 의존성을 확인하세요.');return result;}
const productionDependencies=dependencies(metadata.dependencies);
await assertAdminHelperCurrent(project);
const root=await mkdtemp(path.join(buildWorkspace,'tastedev-linux-deb-')),app=path.join(root,'usr/lib/tastedev-linux');
try {
  await mkdir(app, { recursive: true });
  await cp('.next', path.join(app, '.next'), {
    recursive: true,
    filter: (source) => !['cache', 'standalone', 'dev'].includes(path.relative('.next', source).split(path.sep)[0]),
  });
  await copyFile('package.json', path.join(app, 'package.json'));
  await copyFile('next.config.mjs', path.join(app, 'next.config.mjs'));
  // Resolve the installed production dependency graph without shipping unrelated development tools.
  const copied = new Set<string>();
  async function dependency(name:string, from = project, optional = false):Promise<void> {
    let dir = from,
      source:string|undefined;
    while (true) {
      const candidate = path.join(dir, 'node_modules', name);
      try {
        await readFile(path.join(candidate, 'package.json'));
        source = candidate;
        break;
      } catch {}
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (!source) {
      if (optional) return;
      throw new Error('Missing production dependency: ' + name);
    }
    const data = jsonRecord(JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8')));const required=dependencies(data.dependencies),optionalDependencies=dependencies(data.optionalDependencies);
    for(const field of ['os','cpu'])if(data[field]!==undefined)assert(Array.isArray(data[field])&&data[field].every(value=>typeof value==='string'));
    if ((Array.isArray(data.os) && !data.os.includes(process.platform)) || (Array.isArray(data.cpu) && !data.cpu.includes(process.arch))) return;
    const relative = path.relative(project, source);
    if (relative.startsWith('..')) throw new Error('Dependency outside project: ' + name);
    if (copied.has(relative)) return;
    copied.add(relative);
    await cp(source, path.join(app, relative), { recursive: true, dereference: true });
    for (const dep of Object.keys(required))
      await dependency(dep, source, Boolean(optionalDependencies[dep]));
    for (const dep of Object.keys(optionalDependencies)) await dependency(dep, source, true);
  }
  for (const name of Object.keys(productionDependencies)) await dependency(name);
  try {
    await cp('public', path.join(app, 'public'), { recursive: true });
  } catch (error) {
    if (!hasErrorCode(error,'ENOENT')) throw error;
  }
  // Never distribute local secrets, accounts, cached jobs, or development workspace files.
  async function strip(dir:string):Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.name.startsWith('.env') || entry.name === '.runtime') await rm(file, { recursive: true, force: true });
      else if (entry.isDirectory()) await strip(file);
    }
  }
  await strip(app);
  await mkdir(path.join(app, '.next'), { recursive: true });
  await cp('.next/static', path.join(app, '.next/static'), { recursive: true });
  for (const dir of ['scripts/admin', 'lib']) await mkdir(path.join(app, dir), { recursive: true });
  for (const file of [
    'scripts/configure-service-account.mjs',
    'lib/service-account.mjs',
    'scripts/start-server.mjs',
    'scripts/prepare-next-cli.mjs',
    'scripts/setup-admin.mjs',
    'scripts/admin/linux-admin',
    'scripts/admin/package.json',
    'lib/auth.mjs',
    'lib/better-auth.mjs',
    'lib/auth-password.mjs',
    'lib/auth-store.mjs',
    'lib/runtime-paths.mjs',
    'lib/network-settings.mjs',
    'lib/error-code.mjs',
    'lib/app-restart.ts',
  ])
    if(startupRuntimeFiles.includes(file))await writeFile(path.join(app,file),await readStartupRuntimeModule(file));else await copyFile(file,path.join(app,file));
  // Retain the description source data and its upstream license in addition to
  // the compiled client bundle, so package verification can prove provenance.
  for (const file of [
    'lib/postgresql-hba-description.ts',
    'lib/locales/postgresql-hba-descriptions.json',
    'lib/postgresql-setting-description.ts',
    'lib/locales/postgresql-descriptions.json',
    'lib/locales/postgresql-description-overrides.json',
    'lib/locales/postgresql-descriptions.sources.json',
    'lib/locales/POSTGRESQL-LICENSE.txt',
    'lib/terminal-launch.ts',
    'lib/terminal-key-event.ts',
  ]) {
    const destination = path.join(app, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(file, destination);
  }
  await exec(process.execPath, [path.join(app, 'scripts/prepare-next-cli.mjs')]);
  const runtime = path.join(app, 'scripts/admin/runtime');
  await mkdir(runtime, { recursive: true });
  const hashes:Record<string,string> = {};
  for (const name of adminRuntimeFiles) {
    const bytes = await readAdminRuntimeModule(name);
    await writeFile(path.join(runtime, name), bytes);
    hashes[name] = createHash('sha256').update(bytes).digest('hex');
  }
  await writeFile(path.join(runtime, 'manifest.json'), JSON.stringify(hashes) + '\n');
  await chmod(path.join(app, 'scripts/admin/linux-admin'), 0o755);
  await writeFile(
    path.join(app, 'admin-helper.sha256'),
    createHash('sha256')
      .update(await readFile('scripts/admin/linux-admin'))
      .digest('hex') + '\n',
  );
  for (const dir of ['DEBIAN', 'usr/bin', 'lib/systemd/system']) await mkdir(path.join(root, dir), { recursive: true });
  await copyFile('scripts/bin/tastedev-linux', path.join(root, 'usr/bin/tastedev-linux'));
  await chmod(path.join(root, 'usr/bin/tastedev-linux'), 0o755);
  await copyFile('packaging/tastedev-linux.service', path.join(root, 'lib/systemd/system/tastedev-linux.service'));
  for (const file of ['postinst', 'prerm']) {
    await copyFile('packaging/' + file, path.join(root, 'DEBIAN', file));
    await chmod(path.join(root, 'DEBIAN', file), 0o755);
  }
  await writeFile(
    path.join(root, 'DEBIAN/control'),
    `Package: tastedev-linux\nVersion: ${version}\nArchitecture: ${architecture}\nMaintainer: GXSOFT\nDepends: nodejs (>= 22), adduser, util-linux, bubblewrap, init-system-helpers\nSection: admin\nPriority: optional\nDescription: Linux server management web console\n GUI for package configuration, services, logs, backups and terminal.\n`,
  );
  async function normalize(dir:string):Promise<void> {
    await chmod(dir, 0o755);
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await normalize(file);
      else if (entry.isFile()) await chmod(file, 0o644);
    }
  }
  await normalize(root);
  for (const name of [
    'usr/bin/tastedev-linux',
    'usr/lib/tastedev-linux/node_modules/.bin/next',
    'usr/lib/tastedev-linux/scripts/admin/linux-admin',
    'DEBIAN/postinst',
    'DEBIAN/prerm',
  ])
    await chmod(path.join(root, name), 0o755);
  const out = await mkdtemp(path.join(buildWorkspace,'tastedev-linux-package-'));
  const file = path.join(out, `tastedev-linux_${version}_${architecture}.deb`);
  await exec('/usr/bin/dpkg-deb', ['--root-owner-group', '--build', root, file]);
  const sha256 = createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
  await writeFile(file + '.sha256', sha256 + '  ' + path.basename(file) + '\n');
  console.log(JSON.stringify({ package: file, sha256, installed: false }));
} finally {
  await rm(root, { recursive: true, force: true });
}
