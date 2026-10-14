import {jsonRecord,textField} from './verification/http-json.ts';
import {buildWorkspace} from './build-workspace.ts';
import {desktopReleaseBinary} from './desktop-cargo-paths.ts';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,copyFile,readFile,writeFile,rm,chmod,realpath} from 'node:fs/promises';

import path from 'node:path';
import {createHash} from 'node:crypto';
const exec=promisify(execFile),project=process.cwd(),metadata=jsonRecord(JSON.parse(await readFile('package.json','utf8'))),version=textField(metadata,'version');
if(!/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.]+)?$/.test(version))throw Error('Unsupported desktop package version');
const architecture=process.arch==='x64'?'amd64':process.arch==='arm64'?'arm64':null;if(!architecture)throw Error('Unsupported desktop architecture');
await exec('cargo',['build','--offline','--locked','--release','--features','custom-protocol','--manifest-path','src-tauri/Cargo.toml'],{maxBuffer:4*1024*1024});
const binary=desktopReleaseBinary;
const {stdout:libraries}=await exec('/usr/bin/ldd',[binary]);if(libraries.includes('not found'))throw Error('Missing desktop runtime library');
const dependencies=new Set([`tastedev-linux (= ${version})`]);
for(const line of libraries.split('\n')){
 const file=/=>\s+(\/\S+)/.exec(line)?.[1]||/^\s*(\/\S+)\s+\(/.exec(line)?.[1];if(!file)continue;
 let packageName:string|undefined;
 for(const candidate of new Set([await realpath(file),file,file.replace(/^\/lib\//,'/usr/lib/')])){
  try{const owner=(await exec('/usr/bin/dpkg-query',['-S',candidate])).stdout;packageName=owner.split('\n').map(line=>/^([a-z0-9][a-z0-9+.-]*)(?::[a-z0-9-]+)?: /.exec(line)?.[1]).find(Boolean);if(packageName)break;}catch{}
 }
 if(!packageName)throw Error('Unowned desktop runtime library: '+file);dependencies.add(packageName);
}
const icon=await readFile('src-tauri/icons/icon.png');const iconSize=icon.readUInt32BE(16);if(icon.readUInt32BE(20)!==iconSize||iconSize<16)throw Error('Invalid square desktop icon');
const iconDirectory=`usr/share/icons/hicolor/${iconSize}x${iconSize}/apps`;
await exec('/usr/bin/desktop-file-validate',['packaging/tastedev-linux-desktop.desktop']);
const artifact=await mkdtemp(path.join(buildWorkspace,'desktop-package-')),root=path.join(artifact,'stage');await mkdir(root,{mode:0o700});
try{
 for(const dir of ['DEBIAN','usr/bin','usr/share/applications',iconDirectory])await mkdir(path.join(root,dir),{recursive:true,mode:0o755});
 await copyFile(binary,path.join(root,'usr/bin/tastedev-linux-desktop'));await chmod(path.join(root,'usr/bin/tastedev-linux-desktop'),0o755);
 await copyFile('packaging/tastedev-linux-desktop.desktop',path.join(root,'usr/share/applications/tastedev-linux.desktop'));await chmod(path.join(root,'usr/share/applications/tastedev-linux.desktop'),0o644);
 await copyFile('src-tauri/icons/icon.png',path.join(root,iconDirectory,'tastedev-linux.png'));await chmod(path.join(root,iconDirectory,'tastedev-linux.png'),0o644);
 await writeFile(path.join(root,'DEBIAN/control'),`Package: tastedev-linux-desktop\nVersion: ${version}\nArchitecture: ${architecture}\nMaintainer: GXSOFT\nDepends: ${[...dependencies].sort().join(', ')}\nSection: admin\nPriority: optional\nDescription: Tastedev Linux Tauri desktop console\n Native desktop window for the local Tastedev Linux server.\n`,{mode:0o644});
 const file=path.join(artifact,`tastedev-linux-desktop_${version}_${architecture}.deb`);await exec('/usr/bin/dpkg-deb',['--root-owner-group','--build',root,file]);
 const sha256=createHash('sha256').update(await readFile(file)).digest('hex');await writeFile(file+'.sha256',sha256+'  '+path.basename(file)+'\n');console.log(JSON.stringify({package:file,sha256,dependencies:[...dependencies],installed:false}));
}finally{await rm(root,{recursive:true,force:true});}
