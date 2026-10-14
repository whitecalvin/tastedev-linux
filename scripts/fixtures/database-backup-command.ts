import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import {execFileSync} from 'node:child_process';

// Fixture-only commands: refuse the ordinary host before observing or writing state.
assert.equal(process.getuid?.(),0);
assert.match(readFileSync('/proc/self/uid_map','utf8').trim(),/^0\s+\d+\s+1$/);
const name=basename(process.argv[1]??''),args=process.argv.slice(2);
if(name==='dpkg-query'){
 if(args.length===3&&args[0]==='-W'&&args[1]==='-f=${Status}\t${Version}'&&['redis-server','mariadb-server'].includes(args[2]))process.stdout.write('install ok installed\tgui-fixture-only');
 else process.exit(1);
}else if(name==='systemctl'){
 if(args.some(arg=>['start','stop','restart','reload','enable','disable'].includes(arg)))writeFileSync('/mnt/data/build/tastedev-linux/service-control-called','');
 process.exit(2);
}else if(name==='sudo'){
 const helper='/usr/lib/tastedev-linux/scripts/admin/linux-admin';
 if(args.length!==4||args[0]!=='-n'||args[1]!=='--'||args[2]!==helper||!['redis-config-backup','mariadb-config-backup','redis-backups','mariadb-backups','redis-code-plan'].includes(args[3]))process.exit(2);
 try{execFileSync('/usr/bin/node',[helper,args[3]],{stdio:'inherit'});}
 catch(error){process.exit(error!==null&&typeof error==='object'&&'status' in error&&typeof error.status==='number'&&error.status>0?error.status:1);}
}else throw Error('지원하지 않는 검수 명령입니다.');
