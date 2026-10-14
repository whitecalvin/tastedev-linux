import './build-workspace.ts';
import {lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function aptRepositoryPath(value:string){const root=path.resolve(value);assert(/^\/mnt\/data\/build\/tastedev-linux\/apt-(?:repository|signing-fixture)-[a-zA-Z0-9]+$/.test(root),'Select a generated repository in the designated build directory');const stat=await lstat(root);assert(stat.isDirectory()&&!stat.isSymbolicLink()&&stat.uid===process.getuid?.()&&!(stat.mode&0o077)&&await realpath(root)===root,'Repository directory identity or permissions differ');return root;}
