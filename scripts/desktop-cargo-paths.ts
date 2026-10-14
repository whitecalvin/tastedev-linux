import {buildWorkspace} from './build-workspace.ts';
import {mkdir,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';

export const desktopTargetDirectory=path.join(buildWorkspace,'tauri-target');
await mkdir(desktopTargetDirectory,{recursive:true,mode:0o700});
const stat=await lstat(desktopTargetDirectory);
if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o077)||await realpath(desktopTargetDirectory)!==desktopTargetDirectory)throw Error('데스크톱 빌드 경로의 소유자와 권한을 확인하세요.');
process.env.CARGO_TARGET_DIR=desktopTargetDirectory;
export const desktopReleaseBinary=path.join(desktopTargetDirectory,'release','tastedev-linux');
