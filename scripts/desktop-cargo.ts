import './desktop-cargo-paths.ts';
import {spawn} from 'node:child_process';

const mode=process.argv[2];
if(!['check','start'].includes(mode)||process.argv.length!==3)throw Error('데스크톱 실행 작업을 확인하세요.');
const child=spawn('cargo',[mode==='check'?'check':'run','--manifest-path','src-tauri/Cargo.toml'],{stdio:'inherit',env:process.env});
child.on('error',error=>{console.error('Cargo를 실행할 수 없습니다. Rust 설치와 실행 권한을 확인하세요.');process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=code??1;if(signal)console.error('데스크톱 작업이 중단되었습니다.');});
