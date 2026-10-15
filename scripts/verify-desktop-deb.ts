import {jsonRecord,textField} from './verification/http-json.ts';
import {buildWorkspace} from './build-workspace.ts';
import {desktopReleaseBinary} from './desktop-cargo-paths.ts';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm,readFile,lstat,mkdir,writeFile} from 'node:fs/promises';

import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const exec=promisify(execFile),metadata=jsonRecord(JSON.parse(await readFile('package.json','utf8'))),version=textField(metadata,'version'),architecture=process.arch==='x64'?'amd64':process.arch==='arm64'?'arm64':null;assert(architecture,'Unsupported desktop architecture');
if(!/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.]+)?$/.test(version))throw Error('Unsupported desktop package version');
const file=path.resolve(process.argv[2]||path.join('dist',`tastedev-linux-desktop_${version}_${architecture}.deb`)),root=await mkdtemp(path.join(buildWorkspace,'linux-desktop-verify-'));
try{
 const fields=(await exec('/usr/bin/dpkg-deb',['--field',file,'Package','Version','Architecture','Depends'])).stdout;
 assert(fields.includes('Package: tastedev-linux-desktop'));assert(fields.includes('Version: '+version));assert(fields.includes('Architecture: '+architecture));assert(fields.includes(`tastedev-linux (= ${version})`));
 await exec('/usr/bin/dpkg-deb',['-x',file,root]);
 const binary=path.join(root,'usr/bin/tastedev-linux-desktop'),desktop=path.join(root,'usr/share/applications/tastedev-linux.desktop');
 assert.equal((await lstat(binary)).mode&0o777,0o755);assert.equal((await lstat(desktop)).mode&0o777,0o644);
 await exec('/usr/bin/desktop-file-validate',[desktop]);assert((await readFile(desktop,'utf8')).includes('Exec=/usr/bin/tastedev-linux-desktop'));
 assert(!(await exec('/usr/bin/ldd',[binary])).stdout.includes('not found'));
 const packagedBinary=await readFile(binary),currentBinary=await readFile(desktopReleaseBinary);assert.equal(createHash('sha256').update(packagedBinary).digest('hex'),createHash('sha256').update(currentBinary).digest('hex'),'Desktop package must contain the current release binary');
 const binarySha256=createHash('sha256').update(packagedBinary).digest('hex');
 const elf=(await exec('/usr/bin/readelf',['-h',binary])).stdout;assert(elf.includes('ELF64'));assert(elf.includes(process.arch==='x64'?'X86-64':'AArch64'));
 const iconSource=await readFile('src-tauri/icons/icon.png'),size=iconSource.readUInt32BE(16);assert.deepEqual(await readFile(path.join(root,`usr/share/icons/hicolor/${size}x${size}/apps/tastedev-linux.png`)),iconSource);
 assert.deepEqual(await readFile(path.join(root,'usr/share/icons/hicolor/scalable/apps/tastedev-linux.svg')),await readFile('src-tauri/icons/icon.svg'));
 const sha256=createHash('sha256').update(await readFile(file)).digest('hex');assert((await readFile(file+'.sha256','utf8')).startsWith(sha256));
 const result={status:'PASS',package:path.basename(file),sha256,binarySha256,installed:false,guiLaunched:false,checks:['current release binary identity','package metadata','server dependency','desktop entry validation','ELF architecture','runtime shared libraries','file permissions','icon','checksum']};
 const evidence=path.join(buildWorkspace,'desktop-package-verification-'+new Date().toISOString().replaceAll(':','-')+'.json');await writeFile(evidence,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await rm(root,{recursive:true,force:true});}
