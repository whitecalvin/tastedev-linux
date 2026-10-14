import {readFile as fixtureReadFile,writeFile as fixtureWriteFile} from 'node:fs/promises';
import {strict as fixtureAssert} from 'node:assert';

// Appended only to a checksummed private namespace copy of the operation module.
export async function fixtureCheckpoint(phase:string){
 fixtureAssert.equal(process.getuid?.(),0);
 fixtureAssert.match((await fixtureReadFile('/proc/self/uid_map','utf8')).trim(),/^0\s+\d+\s+1$/);
 fixtureAssert(['prepared','changed','reloading','reload-completed'].includes(phase));
 let expected:string;
 try{expected=await fixtureReadFile('/mnt/site-interrupt-phase','utf8');}
 catch(error){if(error!==null&&typeof error==='object'&&'code' in error&&error.code==='ENOENT')return;throw error;}
 if(expected!==phase)return;
 await fixtureWriteFile('/mnt/site-interrupt-ready.json',JSON.stringify({phase,pid:process.pid}),{mode:0o600});
 await new Promise<never>(()=>{setInterval(()=>{},1000);});
}
