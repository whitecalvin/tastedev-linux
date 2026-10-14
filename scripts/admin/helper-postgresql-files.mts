// Standalone code embedded in the privileged helper, using its checked runtime bindings.
declare const fs:typeof import('node:fs');
declare const path:typeof import('node:path');
declare const randomUUID:typeof import('node:crypto').randomUUID;
declare const BASE:string;
declare function fail(message:string,status?:number):never;
declare function run(binary:string,args:readonly string[],timeout:number):string;
declare function rootDir(dir:string):void;
declare function hash(text:string|Buffer):string;
type Input=Readonly<Record<string,unknown>>;
type Stat=import('node:fs').Stats;
type ReadResult={text:string;stat:Stat;version:string};
function helperPgObject(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}

export function pgSync(file:string):void{
 const fd=fs.openSync(file,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
export function pgRun(binary:string,args:readonly string[]):string{return run(binary,args,60000);}
export function pgInput(input:Input){
 if(input.confirm!==true||typeof input.path!=='string'||typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version))fail('PostgreSQL confirmation and version required');
 const match=/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/postgresql\.conf$/.exec(input.path);
 if(!match)fail('Invalid PostgreSQL target');
 const fields:Record<string,readonly [string,number,number]>={port:['port',1,65535],connections:['max_connections',1,10000],sharedBuffers:['shared_buffers',16,65536],workMem:['work_mem',1,4096]};
 if(!helperPgObject(input.changes)||!Object.keys(input.changes).length||Object.keys(input.changes).some(key=>key!=='logging'&&!Object.hasOwn(fields,key)))fail('Invalid PostgreSQL fields');
 const values:Record<string,string>={};
 for(const [key,value] of Object.entries(input.changes)){
  if(key==='logging'){
   if(typeof value!=='boolean')fail('Invalid PostgreSQL logging');
   values.logging_collector=value?'on':'off';
  }else{
   const [name,min,max]=fields[key],number=Number(value);
   if(!(typeof value==='number'||(typeof value==='string'&&/^\d+$/.test(value)))||!Number.isInteger(number)||number<min||number>max)fail('Invalid PostgreSQL numeric value');
   values[name]=String(number)+(key==='sharedBuffers'||key==='workMem'?'MB':'');
  }
 }
 return {version:match[1],cluster:match[2],file:input.path,values};
}
export function pgOwner():number{
 const stat=fs.lstatSync('/usr/bin/id');
 if(!stat.isFile()||stat.isSymbolicLink()||stat.uid!==0||(stat.mode&0o022))fail('Unsafe account lookup binary');
 const value=pgRun('/usr/bin/id',['-u','postgres']).trim();
 if(!/^[0-9]+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)===0)fail('Invalid PostgreSQL account');
 return Number(value);
}
export function pgDirectories(file:string,owner:number):void{
 rootDir('/etc');
 for(const dir of ['/etc/postgresql',path.dirname(path.dirname(file)),path.dirname(file)]){
  const stat=fs.lstatSync(dir);
  if(!stat.isDirectory()||stat.isSymbolicLink()||![0,owner].includes(stat.uid)||(stat.mode&0o022))fail('Unsafe PostgreSQL configuration directory');
 }
}
export function pgRead(file:string):ReadResult{
 const owner=pgOwner();pgDirectories(file,owner);
 const safe=(stat:Stat)=>stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&[0,owner].includes(stat.uid)&&!(stat.mode&0o022)&&stat.size<=262144;
 const metadataKeys=['dev','ino','uid','gid','mode','size','mtimeMs','ctimeMs'] as const;
 const same=(a:Stat,b:Stat)=>metadataKeys.every(key=>a[key]===b[key]);
 const before=fs.lstatSync(file);if(!safe(before))fail('Unsafe PostgreSQL configuration file');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
 try{
  const stat=fs.fstatSync(fd);if(!safe(stat)||!same(before,stat))fail('PostgreSQL configuration changed');
  const bytes=Buffer.alloc(262145);let length=0;
  while(length<bytes.length){const count=fs.readSync(fd,bytes,length,bytes.length-length,null);if(!count)break;length+=count;}
  if(length>262144)fail('PostgreSQL configuration too large');
  const content=bytes.subarray(0,length),text=content.toString('utf8');
  if(text.includes('\0')||!Buffer.from(text,'utf8').equals(content))fail('Invalid PostgreSQL configuration');
  pgDirectories(file,owner);
  if(!same(stat,fs.fstatSync(fd))||!same(stat,fs.lstatSync(file)))fail('PostgreSQL configuration changed');
  return {text,stat,version:hash(text)};
 }finally{fs.closeSync(fd);}
}
export function pgService(input:Input){
 const match=typeof input.path==='string'?/^\/etc\/postgresql\/([1-9][0-9]?)\/([a-zA-Z0-9][a-zA-Z0-9_-]{0,254})\/postgresql\.conf$/.exec(input.path):null;
 if(!match||typeof input.path!=='string'||input.unit!=='postgresql@'+match[1]+'-'+match[2]+'.service'||typeof input.action!=='string'||!['start','stop','restart','reload'].includes(input.action)||input.confirm!==true)fail('Invalid PostgreSQL service operation');
 pgRead(input.path);
 const logs=pgRun('/usr/bin/pg_ctlcluster',[match[1],match[2],input.action]);
 return {changed:true,unit:input.unit,logs};
}
export function pgStage(file:string,text:string,stat:Pick<Stat,'uid'|'gid'|'mode'>):string{
 const temp=path.join(path.dirname(file),'.tastedev-config-'+randomUUID());fs.writeFileSync(temp,text,{mode:0o600,flag:'wx'});
 try{
  fs.chownSync(temp,stat.uid,stat.gid);fs.chmodSync(temp,stat.mode&0o777);
  const fd=fs.openSync(temp,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  return temp;
 }catch(error){fs.unlinkSync(temp);throw error;}
}
export function pgReplace(file:string,text:string,expected:ReadResult):void{
 const temp=pgStage(file,text,expected.stat);
 try{
  const now=pgRead(file);
  if(now.version!==expected.version||now.stat.ino!==expected.stat.ino||now.stat.dev!==expected.stat.dev)fail('PostgreSQL configuration changed');
  fs.renameSync(temp,file);pgSync(path.dirname(file));
 }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}

export function pgApply(input:Input, restoreText:string|null = null) {
  const p = pgInput(input),
    dir = path.dirname(p.file);
  const original = pgRead(p.file);
  if (original.version !== input.version) fail('PostgreSQL configuration changed');
  try {
    pgRun('/usr/bin/pg_ctlcluster', [p.version, p.cluster, 'status']);
  } catch {
    fail('PostgreSQL cluster must be running');
  }
  const seen = new Set<string>();
  let text = original.text.replace(/^(\s*)([a-zA-Z_]+)\s*=\s*(.*)$/gm, (line:string, space:string, key:string, value:string) => {
    if (!Object.hasOwn(p.values, key)) return line;
    seen.add(key);
    const comment = /\s+#.*$/.exec(value)?.[0] || '';
    return space + key + ' = ' + (/MB$/.test(p.values[key]) ? "'" + p.values[key] + "'" : p.values[key]) + comment;
  });
  const missing = Object.keys(p.values).filter((key) => !seen.has(key));
  if (missing.length)
    text +=
      (text && !text.endsWith('\n') ? '\n' : '') +
      missing
        .map((key) => key + ' = ' + (/MB$/.test(p.values[key]) ? "'" + p.values[key] + "'" : p.values[key]) + '\n')
        .join('');
  if (restoreText !== null) text = restoreText;
  if (text === original.text) return { changed: false, version: original.version };
  if (Buffer.byteLength(text) > 262144) fail('PostgreSQL configuration too large');
  const staged = pgStage(p.file, text, original.stat);
  try {
    for (const [key, value] of Object.entries(p.values)) {
      const result = pgRun('/usr/sbin/runuser', [
        '-u',
        'postgres',
        '--',
        '/usr/lib/postgresql/' + p.version + '/bin/postgres',
        '-D',
        dir,
        '-c',
        'config_file=' + staged,
        '-C',
        key,
      ]).trim();
      const expected =
        key === 'shared_buffers'
          ? Number(value.slice(0, -2)) * 128
          : key === 'work_mem'
            ? Number(value.slice(0, -2)) * 1024
            : value;
      if (restoreText === null && String(expected) !== result)
        fail('PostgreSQL candidate resolves to a different value');
    }
  } catch {
    fail('PostgreSQL candidate validation failed');
  } finally {
    fs.unlinkSync(staged);
  }
  const backups = path.join(BASE, 'postgresql');
  fs.mkdirSync(backups, { mode: 0o700, recursive: true });
  rootDir(backups);
  if (fs.lstatSync(backups).mode & 0o077) fail('PostgreSQL backups must be private');
  const backupId = randomUUID();
  fs.writeFileSync(
    path.join(backups, backupId + '.json'),
    JSON.stringify({
      id: backupId,
      kind: 'postgresql',
      target: p.file,
      text: original.text,
      version: original.version,
      createdAt: new Date().toISOString(),
    }),
    { mode: 0o600, flag: 'wx' },
  );
  pgSync(path.join(backups, backupId + '.json'));
  pgSync(backups);
  pgReplace(p.file, text, original);
  const applied = pgRead(p.file);
  if (applied.version !== hash(text))
    return {
      changed: true,
      failed: true,
      restored: false,
      recovered: false,
      backupId,
      reason: 'Configuration changed after replacement',
    };
  try {
    pgRun('/usr/bin/pg_ctlcluster', [p.version, p.cluster, 'restart']);
    pgRun('/usr/bin/pg_ctlcluster', [p.version, p.cluster, 'status']);
    return { changed: true, version: applied.version, backupId };
  } catch {
    try {
      pgReplace(p.file, original.text, applied);
    } catch {
      return {
        changed: true,
        failed: true,
        restored: false,
        recovered: false,
        backupId,
        reason: 'Activation failed; manual configuration recovery required',
      };
    }
    try {
      pgRun('/usr/bin/pg_ctlcluster', [p.version, p.cluster, 'restart']);
      pgRun('/usr/bin/pg_ctlcluster', [p.version, p.cluster, 'status']);
      return { changed: false, failed: true, restored: true, recovered: true, version: original.version, backupId };
    } catch {
      return {
        changed: false,
        failed: true,
        restored: true,
        recovered: false,
        version: original.version,
        backupId,
        reason: 'Original configuration restored; cluster recovery failed',
      };
    }
  }
}

