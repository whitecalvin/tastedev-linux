import assert from 'node:assert/strict';
import {readFile,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {jsonRecord,recordField} from './http-json.ts';
// Compilation/HTTP evidence must refer to the current complete product snapshot.
export async function assertCurrentCompiledSource(build:string,project=process.cwd()){
 assert(path.isAbsolute(build));
 const snapshot=jsonRecord(JSON.parse(await readFile(path.join(build,'source-snapshot.json'),'utf8')));
 assert.equal(snapshot.project,project,'Build snapshot belongs to another project');
 const hashes=recordField(snapshot,'files'),files:string[]=[];
 async function collect(relative:string){const source=path.join(project,relative),stat=await lstat(source);assert(!stat.isSymbolicLink(),'Source symlink: '+relative);if(stat.isDirectory()){for(const name of (await readdir(source)).sort())await collect(path.join(relative,name));}else{assert(stat.isFile());files.push(relative);}}
 for(const name of ['app','components','lib','public','types','package.json','next.config.mjs','tsconfig.json','next-env.d.ts'])await collect(name);
 assert.deepEqual(files.sort(),Object.keys(hashes).sort(),'Source file list differs from compilation');
 for(const file of files){const expected=hashes[file];assert(typeof expected==='string'&&/^[a-f0-9]{64}$/.test(expected));for(const root of [project,build])assert.equal(createHash('sha256').update(await readFile(path.join(root,file))).digest('hex'),expected,'Source differs: '+file);}
 return files.length;
}
