import {jsonRecord,recordField,textField} from './http-json.ts';
import {verificationWorkRoot} from './work-directory.ts';
import {verificationWorkDirectory} from './work-directory.ts';
import {readFile,writeFile,mkdir,copyFile,chmod,rm,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';

// Final local installation preparation: reuse the proven unchanged release
// binary, preserving earlier artifacts rather than rebuilding identical Rust.
const exec=promisify(execFile),sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const proof=jsonRecord(JSON.parse(await readFile('.runtime/verification/tauri-build-20261010/result.json','utf8'))),binaryFile=textField(proof,'binary');
assert.equal(proof.status,'PASS_BUILD_SCOPE');
for(const [file,digest] of Object.entries(recordField(proof,'sourceSha256')))assert.equal(sha(await readFile(file)),digest,file);
const binary=await readFile(binaryFile);assert.equal(sha(binary),proof.binarySha256);
const meta=jsonRecord(JSON.parse(await readFile('package.json','utf8'))),version=textField(meta,'version');
assert(/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.]+)?$/.test(version),'Invalid package version');
assert.equal(process.arch,'x64','This verified binary is amd64 only');
const root=await verificationWorkDirectory('desktop-final-install-'),stage=join(root,'stage');
const dependencies=new Set([`tastedev-linux (= ${version})`]);
try{
 const libraries=(await exec('/usr/bin/ldd',[binaryFile])).stdout;assert(!libraries.includes('not found'));
 for(const line of libraries.split('\n')){
  const file=/=>\s+(\/\S+)/.exec(line)?.[1]||/^\s*(\/\S+)\s+\(/.exec(line)?.[1];if(!file)continue;
  let owner:string|undefined;
  for(const path of new Set([await realpath(file),file,file.replace(/^\/lib\//,'/usr/lib/')])){
   try{owner=(await exec('/usr/bin/dpkg-query',['-S',path])).stdout.split('\n').map(row=>/^([a-z0-9][a-z0-9+.-]*)(?::[a-z0-9-]+)?: /.exec(row)?.[1]).find(Boolean);if(owner)break;}catch{}
  }
  assert(owner,'Unowned library: '+file);dependencies.add(owner);
 }
 const icon=await readFile('src-tauri/icons/icon.png'),size=icon.readUInt32BE(16);assert.equal(icon.readUInt32BE(20),size);
 const iconDir=`usr/share/icons/hicolor/${size}x${size}/apps`;
 for(const dir of ['DEBIAN','usr/bin','usr/share/applications',iconDir])await mkdir(join(stage,dir),{recursive:true,mode:0o755});
 await writeFile(join(stage,'usr/bin/tastedev-linux-desktop'),binary,{mode:0o755});
 await copyFile('packaging/com.gxsoft.linux.desktop',join(stage,'usr/share/applications/com.gxsoft.linux.desktop'));
 await chmod(join(stage,'usr/share/applications/com.gxsoft.linux.desktop'),0o644);
 await exec('/usr/bin/desktop-file-validate',[join(stage,'usr/share/applications/com.gxsoft.linux.desktop')]);
 await writeFile(join(stage,iconDir,'tastedev-linux.png'),icon,{mode:0o644});
 await writeFile(join(stage,'DEBIAN/control'),`Package: tastedev-linux-desktop\nVersion: ${version}\nArchitecture: amd64\nMaintainer: GXSOFT\nDepends: ${[...dependencies].sort().join(', ')}\nSection: admin\nPriority: optional\nDescription: Tastedev Linux Tauri desktop console\n Native desktop window for the local Tastedev Linux server.\n`,{mode:0o644});
 const file=join(root,`tastedev-linux-desktop_${version}_amd64.deb`);
 await exec('/usr/bin/dpkg-deb',['--root-owner-group','--build',stage,file]);
 const extracted=join(root,'extracted');await exec('/usr/bin/dpkg-deb',['-x',file,extracted]);
 assert.equal(sha(await readFile(join(extracted,'usr/bin/tastedev-linux-desktop'))),proof.binarySha256);
 const result={status:'READY_FOR_LOCAL_FINAL_INSTALL',package:file,sha256:sha(await readFile(file)),binarySha256:proof.binarySha256,sourceSha256:proof.sourceSha256,sourceUnchanged:true,dependencies:[...dependencies].sort(),installed:false,nativeGuiVerified:false,previousArtifactsPreserved:true};
 await writeFile(join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 await writeFile(join(root,'local-install-prepared.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
}finally{await rm(stage,{recursive:true,force:true});await rm(join(root,'extracted'),{recursive:true,force:true});}
