import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {certificateSummary} from '../lib/site-status.ts';

test('public certificate summary distinguishes validity windows without exposing the synthetic private key',async()=>{
 const root=await mkdtemp(join('/mnt/data/build/tastedev-linux','tastedev-public-certificate-'));
 try{
  const result=spawnSync('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-subj','/CN=fixture.invalid','-days','90','-keyout',join(root,'key.pem'),'-out',join(root,'cert.pem')],{encoding:'utf8',env:process.env});assert.equal(result.status,0,result.stderr);
  const pem=await readFile(join(root,'cert.pem'),'utf8'),summary=certificateSummary(pem,'fixture.invalid'),start=Date.parse(summary.validFrom!),end=Date.parse(summary.expiresAt!);
  assert.equal(certificateSummary(pem,'fixture.invalid',start-1).status,'pending');assert.equal(certificateSummary(pem,'fixture.invalid',start+60000).status,'valid');assert.equal(certificateSummary(pem,'fixture.invalid',end-86400000).status,'expiring');assert.equal(certificateSummary(pem,'fixture.invalid',end).status,'expired');assert(summary.fingerprint);assert(!JSON.stringify(summary).includes('PRIVATE KEY'));assert.throws(()=>certificateSummary('invalid','fixture.invalid'));
 }finally{await rm(root,{recursive:true,force:true});}
});
