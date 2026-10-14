export type TerminalLaunch = {binary: '/usr/bin/script' | '/bin/bash'; args: string[]};
export function terminalPresetCommand(command: string): string{
 return command==='codex'||command==='claude'?"/bin/bash -ic 'exec "+command+"'":command;
}

export function terminalLaunch(command: unknown,pty: unknown=false,accountShell: unknown='/bin/bash'): TerminalLaunch{
 if(typeof pty!=='boolean')throw Object.assign(new Error('PTY 옵션을 확인하세요.'),{status:400});
 if(typeof command!=='string'||!command.trim()||command.length>4096||command.includes('\0'))throw Object.assign(new Error('명령은 4096자 이하로 입력하세요.'),{status:400});
 let launchCommand: string=command;
 const interactive=['account-shell','bash -i','codex','claude'].includes(command);
 if(command==='account-shell'){
  if(!pty||typeof accountShell!=='string'||!accountShell.startsWith('/')||/[\0\r\n]/.test(accountShell)||/(?:^|\/)(?:nologin|false)$/.test(accountShell))throw Object.assign(new Error('기본 셸을 확인하세요.'),{status:400});
  launchCommand="exec '"+accountShell.replaceAll("'","'\\''")+"' -i";
 }
 // A piped script stdin otherwise disables the slave's ECHO, including readline
 // redisplay. Interactive shells need normal terminal echo; password readers
 // still turn ECHO off themselves. Command/output jobs retain suppressed echo.
 return pty?{binary:'/usr/bin/script',args:['--quiet','--return','--flush','--echo',interactive?'always':'never','--command',terminalPresetCommand(launchCommand),'/dev/null']}:{binary:'/bin/bash',args:['--noprofile','--norc','-c',launchCommand]};
}

export function terminalTimeout(value: unknown=120): number{
 if(typeof value!=='number'||!Number.isInteger(value)||value<1||value>3600)throw Object.assign(new Error('실행 제한 시간은 1~3600초 정수로 입력하세요.'),{status:400});
 return value;
}
