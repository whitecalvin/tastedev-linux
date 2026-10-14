import {hasErrorCode} from '../lib/error-code.ts';
import {access,mkdir,writeFile} from 'node:fs/promises';
// npm bin-links is disabled on this workspace. Supply the same CLI entries
// with a regular executable file; ordinary npm-created entries stay untouched.
const directory=new URL('../node_modules/.bin/',import.meta.url);
await mkdir(directory,{recursive:true});
for(const [name,entry] of [['next','../next/dist/bin/next'],['tsc','../typescript/bin/tsc']] as const){
 try{await access(new URL(entry,directory));}catch(error){if(hasErrorCode(error,'ENOENT'))continue;throw error;}
 try{await writeFile(new URL(name,directory),`#!/usr/bin/env node\nimport '${entry}';\n`,{flag:'wx',mode:0o755});}catch(error){if(!hasErrorCode(error,'EEXIST'))throw error;}
}
