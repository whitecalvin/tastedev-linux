import {passwordHash} from '../lib/auth-password.ts';
process.stdin.setEncoding('utf8');
let password='';
try{for await(const chunk of process.stdin){password+=chunk;if(password.length>257)throw Error('입력 길이를 확인하세요.');}console.log(await passwordHash(password.replace(/\r?\n$/,'')));}finally{password='';}
