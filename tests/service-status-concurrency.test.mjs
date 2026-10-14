import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

async function loadStatus(exec, discover, clusters) {
  const source = await readFile(new URL('../lib/operations.ts', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export async function serviceStatus('), source.indexOf('export function permissions()'));
  await loadBindings();const {code}=await transform(body.replace('export ',''),{filename:'service-status.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'es6'}});
  return new Function('exec', 'discoverPostgresqlClusters', 'postgresqlClusterStatuses', 'SERVICES', 'fail', 'nodeAppServiceInventory', code + '\nreturn serviceStatus;')(
    exec, discover, clusters, ['nginx.service', 'postgresql.service'], message=>new Error(message), async()=>({services:[],warnings:[]}),
  );
}

test('cluster discovery and status finish while standard service reads are still pending', async () => {
  const pending = [];
  let clusterRead = false;
  const status = await loadStatus(
    (_command, args) => new Promise(resolve => pending.push(() => resolve({stdout: 'ActiveState=active\nDescription=' + args[1]}))),
    async () => [{path: '/etc/postgresql/18/main/postgresql.conf'}],
    async () => {clusterRead = true; return [{unit: 'postgresql@18-main.service', ActiveState: 'inactive'}];},
  );
  const result = status();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(clusterRead, true, 'cluster lookup must not wait for systemctl standard reads');
  assert.equal(pending.length, 2);
  pending.forEach(resolve => resolve());
  const rows = await result;
  assert.deepEqual(rows.map(row => row.unit), ['nginx.service', 'postgresql.service', 'postgresql@18-main.service']);
  assert.equal(rows[2].configPath, '/etc/postgresql/18/main/postgresql.conf');
});

test('early discovery failure preserves standard rows and annotates the PostgreSQL parent', async () => {
  const status = await loadStatus(
    async (_command, args) => {if(args[1] === 'nginx.service') throw {stderr: 'unavailable'}; return {stdout: 'ActiveState=active'};},
    async () => {throw Error('unsafe directory');},
    async () => {throw Error('must not run');},
  );
  const rows = await status();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].ActiveState, 'unknown');
  assert.equal(rows[0].error, '서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.');
  assert.equal(rows[1].ActiveState, 'active');
  assert.equal(rows[1].error, 'PostgreSQL 설정 목록을 읽을 수 없습니다.');
});


test('single package reads only its service and skips unrelated PostgreSQL discovery', async () => {
  const calls=[];
  const status=await loadStatus(async (command,args,options)=>{
    calls.push(args[1]);assert.equal(command,'/usr/bin/systemctl');assert.equal(args[0],'show');assert.equal(options.timeout,5000);
    return {stdout:'ActiveState=active\nSubState=running'};
  },async()=>{throw Error('unrelated discovery must not run');},async()=>{throw Error('unrelated clusters must not run');});
  const rows=await status({unit:'nginx.service'});assert.deepEqual([...rows],[{unit:'nginx.service',ActiveState:'active',SubState:'running'}]);assert.deepEqual(rows.warnings,[]);
  assert.deepEqual(calls,['nginx.service']);
  await assert.rejects(status({unit:'arbitrary.service'}),/허용된 서비스/);
  assert.equal(calls.length,1,'invalid units must never reach systemctl');
});

test('scoped PostgreSQL read retains cluster mapping and failure semantics', async () => {
  const calls=[];
  const status=await loadStatus(async(_command,args)=>{calls.push(args[1]);throw {stderr:'systemctl unavailable'};},
    async()=>[{path:'/etc/postgresql/18/main/postgresql.conf'}],
    async()=>[{unit:'postgresql@18-main.service',ActiveState:'active'}]);
  const rows=await status({unit:'postgresql.service'});
  assert.deepEqual(calls,['postgresql.service']);assert.equal(rows.length,2);
  assert.equal(rows[0].ActiveState,'unknown');assert.equal(rows[0].error,'서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.');
  assert.equal(rows[1].configPath,'/etc/postgresql/18/main/postgresql.conf');
  const failed=await loadStatus(async()=>({stdout:'ActiveState=active'}),async()=>{throw Error('unreadable');},async()=>[]);
  assert.equal((await failed({unit:'postgresql.service'}))[0].error,'PostgreSQL 설정 목록을 읽을 수 없습니다.');
});

test('failed service reads provide actionable Korean messages without exposing process diagnostics, and a refresh can recover',async()=>{
 const failures=[
  [{code:'ETIMEDOUT'},'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'],
  [{code:1,killed:true,signal:'SIGTERM'},'서비스 상태 조회 시간이 초과되었습니다. 잠시 후 다시 갱신하세요.'],
  [{signal:'SIGABRT'},'서비스 상태 조회가 중단되었습니다. 잠시 후 다시 갱신하세요.'],
  [{code:'EACCES'},'서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.'],
  [{code:'EPERM'},'서비스 상태를 조회할 권한이 없습니다. 서버 실행 계정의 권한을 확인하세요.'],
  [{code:1},'서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.'],
  [{code:'ENOENT'},'서비스 상태를 조회할 수 없습니다. 서버의 systemd 실행 상태를 확인한 뒤 다시 갱신하세요.'],
 ];
 for(const [failure,message] of failures){
  let failed=true;
  const status=await loadStatus(async()=>{if(failed)throw {...failure,stderr:'private system path diagnostic',stdout:'ActiveState=active',message:'private command diagnostic'};return {stdout:'ActiveState=active\nSubState=running\nLoadState=loaded'};},async()=>[],async()=>[]);
  const rows=await status({unit:'nginx.service'});
  assert.equal(rows[0].unit,'nginx.service');assert.equal(rows[0].ActiveState,'unknown');assert.equal(rows[0].error,message);
  assert.equal(rows[0].LoadState,undefined,'a failed read cannot infer installation or report its partial active output');
  assert(!JSON.stringify(rows).includes('private'));
  failed=false;const recovered=await status({unit:'nginx.service'});
  assert.equal(recovered[0].ActiveState,'active');assert.equal(recovered[0].LoadState,'loaded');assert.equal(recovered[0].error,undefined);
 }
});
