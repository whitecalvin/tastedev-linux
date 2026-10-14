import {verificationWorkDirectory} from './work-directory.ts';
import {jsonRecord,textField} from './http-json.ts';
// Disposable local Docker Desktop VM cluster. No host files, ports or services.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {patchConfig} from '../../lib/config-patch.ts';
const exec=promisify(execFile),docker='/usr/local/bin/docker',context='desktop-linux',runId=randomUUID(),name='tastedev-pg-lifecycle-'+runId;
const call=async(args:string[],input?:string)=>{const running=exec(docker,['--context',context,...args],{timeout:90000,maxBuffer:2097152});if(input){assert(running.child.stdin);running.child.stdin.on('error',()=>{});running.child.stdin.end(input);}return(await running).stdout;};
const evidenceRoot=await verificationWorkDirectory('postgresql-lifecycle-controller-');
let created=false,phase='context';
function stderr(error:unknown):string{const value:unknown=error!==null&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'stderr')?.value:undefined;return typeof value==='string'?value:'';}
function errorCode(error:unknown):string|number|null{const value:unknown=error!==null&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,'code')?.value:undefined;return typeof value==='string'||typeof value==='number'?value:null;}
async function record(result:Record<string,unknown>){const evidence=path.join(evidenceRoot,'postgresql-lifecycle-'+new Date().toISOString().replaceAll(':','-')+'.json');await mkdir(path.dirname(evidence),{recursive:true,mode:0o700});await writeFile(evidence,JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({...result,evidence}));}
try{
 assert.equal((await call(['context','inspect',context,'--format','{{.Endpoints.docker.Host}}'])).trim(),'unix://'+path.join(process.env.HOME||'', '.docker/desktop/docker.sock'));
 phase='image-inspect';const image=jsonRecord(JSON.parse(await call(['image','inspect','postgres:16','--format','{{json .}}'])));assert.equal(image.Os,'linux');const imageId=textField(image,'Id');assert.match(imageId,/^sha256:[a-f0-9]{64}$/);const imageDigests=image.RepoDigests;assert(Array.isArray(imageDigests)&&imageDigests.every(value=>typeof value==='string'));
 const original="listen_addresses = ''\nunix_socket_directories = '/mnt/data/build/tastedev-linux/pg-lifecycle/socket'\nport = 55432\nmax_connections = 20\nshared_buffers = '64MB'\nwork_mem = '4MB'\nlogging_collector = off\n";
 const candidate=patchConfig('postgresql',original,{connections:60,sharedBuffers:32,workMem:8,logging:true});
 const script=`set -eu
umask 077
export PATH=/usr/lib/postgresql/16/bin:/usr/bin:/bin
export TMPDIR=/mnt/data/build/tastedev-linux/pg-lifecycle TMP=/mnt/data/build/tastedev-linux/pg-lifecycle TEMP=/mnt/data/build/tastedev-linux/pg-lifecycle
mkdir /mnt/data/build/tastedev-linux/pg-lifecycle/socket
initdb -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -U fixture --auth-local=trust --auth-host=reject --no-locale -E UTF8 > /mnt/data/build/tastedev-linux/pg-lifecycle/init.log 2>&1
cat > /mnt/data/build/tastedev-linux/pg-lifecycle/original.conf <<'ORIGINAL'
${original}ORIGINAL
cat > /mnt/data/build/tastedev-linux/pg-lifecycle/candidate.conf <<'CANDIDATE'
${candidate}CANDIDATE
cp /mnt/data/build/tastedev-linux/pg-lifecycle/original.conf /mnt/data/build/tastedev-linux/pg-lifecycle/data/postgresql.conf
trap 'pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -m fast -w stop >/dev/null 2>&1 || true' EXIT
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -l /mnt/data/build/tastedev-linux/pg-lifecycle/server.log -w start >/mnt/data/build/tastedev-linux/pg-lifecycle/start.log 2>&1
psql -X -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c 'CREATE TABLE fixture(value text); INSERT INTO fixture VALUES ($$한글 데이터$$);' >/mnt/data/build/tastedev-linux/pg-lifecycle/sql.log 2>&1
echo START
psql -XAt -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c "SELECT current_setting('max_connections'),current_setting('shared_buffers'),current_setting('work_mem'),current_setting('logging_collector'),inet_server_addr() IS NULL;"
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -m fast -w stop >/mnt/data/build/tastedev-linux/pg-lifecycle/stop.log 2>&1
cp /mnt/data/build/tastedev-linux/pg-lifecycle/candidate.conf /mnt/data/build/tastedev-linux/pg-lifecycle/data/postgresql.conf
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -l /mnt/data/build/tastedev-linux/pg-lifecycle/server.log -w start >/mnt/data/build/tastedev-linux/pg-lifecycle/start.log 2>&1
echo APPLIED
psql -XAt -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c "SELECT current_setting('max_connections'),current_setting('shared_buffers'),current_setting('work_mem'),current_setting('logging_collector'),inet_server_addr() IS NULL;"
psql -XAt -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c 'SELECT value FROM fixture;'
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -m fast -w stop >/mnt/data/build/tastedev-linux/pg-lifecycle/stop.log 2>&1
printf 'tastedev_unknown_option = on\n' >> /mnt/data/build/tastedev-linux/pg-lifecycle/data/postgresql.conf
if pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -l /mnt/data/build/tastedev-linux/pg-lifecycle/invalid.log -w start >/mnt/data/build/tastedev-linux/pg-lifecycle/invalid-start.log 2>&1; then echo UNEXPECTED_START; exit 1; fi
echo INVALID_REJECTED
cp /mnt/data/build/tastedev-linux/pg-lifecycle/original.conf /mnt/data/build/tastedev-linux/pg-lifecycle/data/postgresql.conf
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -l /mnt/data/build/tastedev-linux/pg-lifecycle/server.log -w start >/mnt/data/build/tastedev-linux/pg-lifecycle/start.log 2>&1
echo RESTORED
psql -XAt -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c "SELECT current_setting('max_connections'),current_setting('shared_buffers'),current_setting('work_mem'),current_setting('logging_collector'),inet_server_addr() IS NULL;"
psql -XAt -v ON_ERROR_STOP=1 -h /mnt/data/build/tastedev-linux/pg-lifecycle/socket -p 55432 -U fixture -d postgres -c 'SELECT value FROM fixture;'
pg_ctl -D /mnt/data/build/tastedev-linux/pg-lifecycle/data -m fast -w stop >/mnt/data/build/tastedev-linux/pg-lifecycle/stop.log 2>&1
trap - EXIT
echo STOPPED
postgres --version
sha256sum /usr/lib/postgresql/16/bin/postgres
`;
 phase='cluster-lifecycle';created=true;
 const output=await call(['run','--rm','--pull','never','--name',name,'--label','tastedev.verification='+runId,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges=true','--pids-limit','64','--memory','512m','--cpus','1','--user','postgres','--tmpfs','/mnt/data/build/tastedev-linux/pg-lifecycle:rw,noexec,nosuid,nodev,size=256m,uid=999,gid=999,mode=0700','-i','--entrypoint','/bin/sh',imageId],script);
 const lines=output.trim().split('\n');assert.deepEqual(lines.slice(0,10),['START','20|64MB|4MB|off|t','APPLIED','60|32MB|8MB|on|t','한글 데이터','INVALID_REJECTED','RESTORED','20|64MB|4MB|off|t','한글 데이터','STOPPED']);assert.match(lines[10],/^postgres \(PostgreSQL\) 16\./);assert.match(lines[11],/^[a-f0-9]{64}  \/usr\/lib\/postgresql\/16\/bin\/postgres$/);
 const result={status:'PASS',context,imageId,imageDigests,version:lines[10],binarySha256:lines[11].split(' ')[0],checks:['private cluster starts with original settings over Unix socket only','app-generated candidate takes effect after restart','fixture Unicode data survives configuration restart','invalid setting prevents startup','original configuration restores startup and fixture data','cluster stops cleanly'],hostBindMounts:false,publishedPorts:false,network:'none',hostPackageOrServiceChanges:false,installedGuiOrRootHelperTested:false};await record(result);
}catch(error){const unavailable=phase!=='cluster-lifecycle'&&/failed to connect|Cannot connect|permission denied|No such image|no such file or directory/i.test(stderr(error));await record({status:unavailable?'BLOCKED':'FAIL',phase,reason:unavailable?'Local Docker Desktop daemon or pinned image is unavailable':'Local isolated PostgreSQL lifecycle failed',code:errorCode(error),clusterExecutionAttempted:created,hostPackageOrServiceChanges:false});process.exitCode=unavailable?2:1;}
finally{if(created){try{const owner=(await call(['container','inspect',name,'--format','{{index .Config.Labels "tastedev.verification"}}'])).trim();assert.equal(owner,runId);await call(['rm','--force',name]);}catch(error){if(!/No such (?:container|object)/i.test(stderr(error))){console.error('Temporary container cleanup requires review');process.exitCode=1;}}}}
