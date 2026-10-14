import {aptRepositoryPath} from './apt-repository-path.ts';
import {verificationWorkDirectory,verificationWorkRoot} from './verification/work-directory.ts';
import {jsonRecord,textField} from './verification/http-json.ts';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {userInfo} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const exec=promisify(execFile),source=await aptRepositoryPath(process.argv[2]||'');
const home=await verificationWorkDirectory('tastedev-gpg-fixture-'),repository=await verificationWorkDirectory('apt-signing-fixture-'),env={...process.env,GNUPGHOME:home};
try{
 await cp(source,repository,{recursive:true});
 await exec('/usr/bin/gpg',['--batch','--pinentry-mode','loopback','--passphrase','','--quick-generate-key','Tastedev repository fixture <fixture@invalid.example>','ed25519','sign','1d'],{env,timeout:20000,maxBuffer:1048576});
 const {stdout:keys}=await exec('/usr/bin/gpg',['--batch','--with-colons','--list-keys'],{env,timeout:10000});const keyRow=keys.split('\n').find(line=>line.startsWith('fpr:'));assert(keyRow);const fingerprint=keyRow.split(':')[9];assert(/^(?:[A-F0-9]{40}|[A-F0-9]{64})$/.test(fingerprint));
 const {stdout}=await exec(process.execPath,['scripts/sign-apt-repository.ts',repository,fingerprint],{env,timeout:90000,maxBuffer:1048576});assert.equal(JSON.parse(stdout).signatureVerified,true);
 const isolated=path.join(home,'apt');await mkdir(isolated,{mode:0o700});for(const folder of ['empty','lists/partial','cache/archives/partial','downloads','log'])await mkdir(path.join(isolated,folder),{recursive:true});
 const key=path.join(isolated,'fixture-keyring.gpg');const exported=await exec('/usr/bin/gpg',['--batch','--export',fingerprint],{env,encoding:'buffer',timeout:10000});await writeFile(key,exported.stdout);await writeFile(path.join(isolated,'sources.list'),`deb [signed-by=${key}] file:${repository} stable main\n`);await writeFile(path.join(isolated,'status'),'');await writeFile(path.join(isolated,'main.conf'),'');
 const config=path.join(isolated,'apt.conf');await writeFile(config,`Dir::Etc::parts "${isolated}/empty";\nDir::Etc::main "${isolated}/main.conf";\n`);
 const options=['-o','Dir::Etc::sourcelist='+path.join(isolated,'sources.list'),'-o','Dir::Etc::sourceparts='+path.join(isolated,'empty'),'-o','Dir::Etc::trusted='+key,'-o','Dir::Etc::trustedparts='+path.join(isolated,'empty'),'-o','Dir::State::status='+path.join(isolated,'status'),'-o','Dir::State::lists='+path.join(isolated,'lists'),'-o','Dir::Cache='+path.join(isolated,'cache'),'-o','Dir::Log='+path.join(isolated,'log'),'-o','APT::Sandbox::User='+userInfo().username];const aptEnv={...env,APT_CONFIG:config,LC_ALL:'C'};
 await exec('/usr/bin/apt-get',[...options,'update'],{env:aptEnv,cwd:isolated,timeout:30000,maxBuffer:4194304});const metadata=jsonRecord(JSON.parse(await readFile(path.join(repository,'manifest.json'),'utf8')));const version=textField(metadata,'version');
 const {stdout:policy}=await exec('/usr/bin/apt-cache',[...options,'policy','tastedev-linux'],{env:aptEnv,timeout:10000});assert(policy.includes('Candidate: '+version));
 const downloads=path.join(isolated,'downloads');await exec('/usr/bin/apt-get',[...options,'download','tastedev-linux='+version],{cwd:downloads,env:aptEnv,timeout:30000,maxBuffer:4194304});const files=await readdir(downloads);assert.equal(files.length,1);assert.equal(createHash('sha256').update(await readFile(path.join(downloads,files[0]))).digest('hex'),metadata.sha256);
 const release=path.join(repository,'dists/stable/Release');await writeFile(release,(await readFile(release,'utf8'))+'Tampered: true\n');await assert.rejects(exec('/usr/bin/gpg',['--batch','--verify',path.join(repository,'dists/stable/Release.gpg'),release],{env,timeout:10000}));
 const signed=path.join(repository,'dists/stable/InRelease'),signedText=await readFile(signed,'utf8');assert(signedText.includes('Origin: Tastedev'));await writeFile(signed,signedText.replace('Origin: Tastedev','Origin: Tampered'));await assert.rejects(exec('/usr/bin/apt-get',[...options,'-o','APT::Update::Error-Mode=any','update'],{env:aptEnv,cwd:isolated,timeout:30000,maxBuffer:4194304}));
 const folder=path.join(verificationWorkRoot,'evidence');await mkdir(folder,{recursive:true,mode:0o700});const evidence=path.join(folder,'apt-signing-'+new Date().toISOString().replaceAll(':','-')+'.json');const record={status:'PASS',checks:['isolated synthetic key signs InRelease and detached Release','signatures bind specified full fingerprint and exact Release bytes','tampered Release rejected by gpg','isolated apt authenticates file repository with synthetic signing key','apt candidate version and downloaded deb SHA-256 match repository','apt rejects tampered InRelease without accepting unauthenticated metadata'],productionKeyUsed:false,published:false,installed:false};await writeFile(evidence,JSON.stringify(record,null,2)+'\n',{mode:0o600});process.stdout.write(JSON.stringify({...record,evidence})+'\n');
}finally{
 try{await exec('/usr/bin/gpgconf',['--homedir',home,'--kill','gpg-agent'],{env,timeout:10000});}catch{}
 await rm(home,{recursive:true,force:true});await rm(repository,{recursive:true,force:true});
}
