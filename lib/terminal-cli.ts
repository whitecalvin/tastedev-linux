export type TerminalCliCommand = {available: boolean; path: string | null};
export type TerminalCliCommands = Record<'codex' | 'claude',TerminalCliCommand>;
import {access,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
// Inspect only the terminal process environment; never execute a CLI or read credentials.
export async function terminalCliCommands(searchPath=process.env.PATH||'',cwd=process.cwd()): Promise<TerminalCliCommands>{
 const commands: TerminalCliCommands={codex:{available:false,path:null},claude:{available:false,path:null}};
 for(const name of ['codex','claude'] as const){
  let executable: string | null=null;
  for(const directory of searchPath.split(path.delimiter)){
   const candidate=path.resolve(cwd,directory||'.',name);
   try{if(!(await stat(candidate)).isFile())continue;await access(candidate,constants.X_OK);executable=candidate;break;}catch{}
  }
  commands[name]={available:executable!==null,path:executable};
 }
 return commands;
}
