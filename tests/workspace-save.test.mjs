import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { saveCode, readCode, createFolder, listFiles } from '../lib/workspace.ts';
test('IDE saves and detects external edits without overwriting content', async () => {
  const previous = process.env.LINUX_WORKSPACE_ROOT;
  process.env.LINUX_WORKSPACE_ROOT = await mkdtemp('/mnt/data/build/tastedev-linux/linux-editor-check-');
  try {
    await createFolder('config');
    await saveCode('config/nested.conf', 'enabled=true\n');
    assert.ok((await listFiles()).directories.includes('config'));
    await assert.rejects(createFolder('../escape'));
    await saveCode('fixture.conf', 'port=5432\n');
    const snapshot = await readCode('fixture.conf');
    await saveCode('fixture.conf', 'port=5433\n', snapshot.version);
    await assert.rejects(saveCode('fixture.conf', 'stale\n', snapshot.version), (e) => e.status === 409);
    await assert.rejects(saveCode('fixture.conf', 'new\n'), (e) => e.status === 409);
    assert.equal(await readFile(process.env.LINUX_WORKSPACE_ROOT + '/fixture.conf', 'utf8'), 'port=5433\n');
  } finally {
    if (previous === undefined) delete process.env.LINUX_WORKSPACE_ROOT;
    else process.env.LINUX_WORKSPACE_ROOT = previous;
  }
});

test('concurrent IDE saves produce one complete winner and a conflict', async () => {
  const previous = process.env.LINUX_WORKSPACE_ROOT;
  const folder = await mkdtemp('/mnt/data/build/tastedev-linux/linux-editor-concurrency-');
  process.env.LINUX_WORKSPACE_ROOT = folder;
  try {
    await saveCode('shared.conf', 'initial\n');
    const snapshot = await readCode('shared.conf');
    const contents = ['A'.repeat(200000), 'B'.repeat(180000)];
    const results = await Promise.allSettled(contents.map((text) => saveCode('shared.conf', text, snapshot.version)));
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.find((result) => result.status === 'rejected').reason.status, 409);
    const winner = results.findIndex((result) => result.status === 'fulfilled');
    assert.equal(await readFile(folder + '/shared.conf', 'utf8'), contents[winner]);
    const latest = await readCode('shared.conf');
    await saveCode('shared.conf', 'short\n', latest.version);
    assert.equal(await readFile(folder + '/shared.conf', 'utf8'), 'short\n');
  } finally {
    if (previous === undefined) delete process.env.LINUX_WORKSPACE_ROOT;
    else process.env.LINUX_WORKSPACE_ROOT = previous;
    await rm(folder, { recursive: true, force: true });
  }
});

test('rebasing onto an inspected disk version still rejects a later external edit', async () => {
  const previous = process.env.LINUX_WORKSPACE_ROOT;
  const folder = await mkdtemp('/mnt/data/build/tastedev-linux/linux-editor-rebase-');
  process.env.LINUX_WORKSPACE_ROOT = folder;
  try {
    await saveCode('redis.conf', 'port 6379\n');
    const original = await readCode('redis.conf');
    await saveCode('redis.conf', 'port 6380\n', original.version);
    const inspected = await readCode('redis.conf');
    await saveCode('redis.conf', 'port 6381\n', inspected.version);
    await assert.rejects(saveCode('redis.conf', 'port 6390\n', inspected.version), (error) => error.status === 409);
    assert.equal((await readCode('redis.conf')).text, 'port 6381\n');
    const refreshed = await readCode('redis.conf');
    await saveCode('redis.conf', 'port 6390\n', refreshed.version);
    assert.equal((await readCode('redis.conf')).text, 'port 6390\n');
  } finally {
    if (previous === undefined) delete process.env.LINUX_WORKSPACE_ROOT;
    else process.env.LINUX_WORKSPACE_ROOT = previous;
    await rm(folder, { recursive: true, force: true });
  }
});

test('invalid text cannot replace an inspected file while Korean and emoji remain exact',async()=>{
 const previous=process.env.LINUX_WORKSPACE_ROOT,folder=await mkdtemp('/mnt/data/build/tastedev-linux/linux-editor-unicode-');process.env.LINUX_WORKSPACE_ROOT=folder;
 try{const original='한국어 😀\n';await saveCode('unicode.conf',original);const record=await readCode('unicode.conf');
  for(const text of ['bad\0text','bad\uFFFDtext','bad\uD800text']){await assert.rejects(saveCode('unicode.conf',text,record.version),error=>error.status===400);assert.equal(await readFile(folder+'/unicode.conf','utf8'),original);}
  const saved=await saveCode('unicode.conf','변경 😀\n',record.version);assert.equal((await readCode('unicode.conf')).version,saved.version);
 }finally{if(previous===undefined)delete process.env.LINUX_WORKSPACE_ROOT;else process.env.LINUX_WORKSPACE_ROOT=previous;await rm(folder,{recursive:true,force:true});}
});
