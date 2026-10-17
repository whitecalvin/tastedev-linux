import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,readFile,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectCertificates} from '../lib/certificate-inspect.ts';

test('inspection returns public metadata from Certbot archive links and refuses key and external targets',async()=>{
 const root=await mkdtemp('/mnt/data/build/tastedev-linux/certificate-inspect-');
 for(const dir of ['live','archive','live/valid.test','archive/valid.test','live/key.test','live/outside.test'])await mkdir(join(root,dir),{mode:0o700});
 execFileSync('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-subj','/CN=fixture.invalid','-days','90','-keyout',join(root,'key.pem'),'-out',join(root,'archive/valid.test/cert1.pem')],{stdio:'ignore'});
 await chmod(join(root,'archive/valid.test/cert1.pem'),0o644);
 await symlink('../../archive/valid.test/cert1.pem',join(root,'live/valid.test/cert.pem'));
 await symlink('../../key.pem',join(root,'live/key.test/cert.pem'));
 await symlink('/etc/passwd',join(root,'live/outside.test/cert.pem'));
 const result=await inspectCertificates(root,process.getuid!());
 assert.equal(result.certificates.length,3);assert.equal(result.certificates.find(item=>item.name==='valid.test')?.status,'valid');
 assert.equal(result.certificates.find(item=>item.name==='key.test')?.status,'unavailable');assert.equal(result.certificates.find(item=>item.name==='outside.test')?.status,'unavailable');
 assert(!JSON.stringify(result).includes('PRIVATE KEY'));assert(!JSON.stringify(result).includes(await readFile(join(root,'key.pem'),'utf8')));
 await chmod(join(root,'archive/valid.test'),0o777);assert.equal((await inspectCertificates(root,process.getuid!())).certificates.find(item=>item.name==='valid.test')?.status,'unavailable');
});
