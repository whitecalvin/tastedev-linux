import {mkdir, lstat} from 'node:fs/promises';

// Development/verification storage: never fall back to the system temp directory.
export const buildWorkspace = '/mnt/data/build/tastedev-linux';
await mkdir(buildWorkspace, {recursive: true, mode: 0o700});
const stat = await lstat(buildWorkspace);
if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o077)) {
  throw Error('빌드 작업 경로의 소유자와 권한을 확인하세요: ' + buildWorkspace);
}
process.env.TMPDIR = buildWorkspace;
process.env.TMP = buildWorkspace;
process.env.TEMP = buildWorkspace;
