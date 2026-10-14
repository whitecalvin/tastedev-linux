import type {TerminalReport} from '../components/console-types';
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const actions=new Set(['install','job','certbot-issue','admin-job','service','nginx-check','nginx-apply','nginx-config-apply','postgresql-apply','postgresql-restore','mariadb-apply','mariadb-restore','postgresql-code-plan','postgresql-code-apply','mariadb-code-plan','mariadb-code-apply','redis-code-plan','redis-code-apply','redis-config-apply','redis-config-restore']);
export function operationTerminalReport(action:unknown,data:unknown):TerminalReport|null{
 if(typeof action!=='string'||!object(data))return null;
 const name=action.split('?')[0];
 if(['postgresql-code-restore-plan','postgresql-code-restore','postgresql-code-plan','postgresql-code-apply','mariadb-code-plan','mariadb-code-apply','redis-code-plan','redis-code-apply'].includes(name)){
  if(!data||typeof data.changed!=='boolean')return null;
  const backup=typeof data.backupId==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(data.backupId)?data.backupId:null;
  const maria=name.startsWith('mariadb-'),label=maria?'MariaDB':name.startsWith('postgresql-')?'PostgreSQL':'Redis',planning=name.endsWith('-plan');
  const lines=[label+(planning?' code isolated validation\n':' complete configuration application\n')];
  for(const [key,label] of [['changed','Configuration differs'],['failed','Operation failed'],['restored','Original file restored'],['recovered','Service recovered'],['journalCleanupVerified','Journal cleanup verified']])if(typeof data[key]==='boolean')lines.push(label+': '+data[key]+'\n');
  if(planning&&object(data.validation)&&data.validation.valid===true)lines.push(((maria||name.startsWith('postgresql-'))?'Isolated options validation: true':'Isolated startup validation: true')+'\nOperating service changed: false\n');
  if(backup)lines.push('Backup ID: '+backup+'\n');
  return {id:'operation:'+name+':'+(backup||'latest'),command:label+' configuration',status:data.failed===true?'failed':'completed',exitCode:data.failed===true?1:0,logs:[{text:lines.join('')}],pollAction:null};
 }
 if(['postgresql-code-recovery-plan','postgresql-code-recover'].includes(name)){
  if(!data||!(typeof data.recoveryRequired==='boolean'||typeof data.recovered==='boolean'))return null;
  const cancellation=data.kind==='postgresql-stage-cancellation',lines=[cancellation?'PostgreSQL preparation cancellation\n':'PostgreSQL interrupted configuration recovery\n'];for(const [key,label] of [['recoveryRequired','Recovery required'],['restored','Original file restored'],['recovered',cancellation?'Preparation recovered':'Service recovered'],['preparationCancelled','Preparation cancelled'],['serviceRestarted','Service restarted'],['operatingConfigurationChanged','Operating configuration changed'],['failed','Operation failed'],['journalCleanupVerified','Journal cleanup verified']])if(typeof data[key]==='boolean')lines.push(label+': '+data[key]+'\n');
  const backup=typeof data.backupId==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(data.backupId)?data.backupId:null;if(backup)lines.push('Backup ID: '+backup+'\n');const failed=data.failed===true||name.endsWith('-recover')&&data.recovered!==true&&data.recoveryRequired!==false;
  return {id:'operation:'+name+':'+(backup||'latest'),command:'PostgreSQL recovery',status:failed?'failed':'completed',exitCode:failed?1:0,logs:[{text:lines.join('')}],pollAction:null};
 }
 if(['postgresql-hba-operation','postgresql-hba-recover'].includes(name)){
  if(!data||typeof data.changed!=='boolean')return null;
  const backup=typeof data.backupId==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(data.backupId)?data.backupId:null;
  const lines=['PostgreSQL HBA operation\n'];
  // Persist only structured results. HBA drafts, differences, options and raw
  // native messages may contain credentials and must never become terminal logs.
  for(const [key,label] of [['journalCleanupVerified','Journal cleanup verified'],['changed','File changed'],['reloadRequested','Reload requested'],['managementConnectionVerified','Management connection verified'],['failed','Operation failed'],['restored','Original file restored'],['recovered','Management connection recovered'],['reloadAcceptanceVerified','Rule load acceptance verified']])if(typeof data[key]==='boolean')lines.push(label+': '+data[key]+'\n');
  if(backup)lines.push('Backup ID: '+backup+'\n');
  return {id:'operation:postgresql-hba:'+(backup||'latest'),command:'PostgreSQL HBA',status:data.failed===true?'failed':'completed',exitCode:data.failed===true?1:0,logs:[{text:lines.join('')}],pollAction:null};
 }
 if(!actions.has(name))return null;
 const source=data.job||data;if(!object(source)||!source.logs)return null;
 const logs=typeof source.logs==='string'?[source.logs]:Array.isArray(source.logs)?source.logs.map(entry=>typeof entry==='string'?entry:object(entry)&&typeof entry.text==='string'?entry.text:''):[];
 const text=logs.join('').slice(-262144),command=Array.isArray(source.command)&&source.command.every(value=>typeof value==='string')?source.command.join(' '):typeof source.command==='string'?source.command:name;
 const id=typeof source.id==='string'?source.id:null;
 return {id:id?'operation:'+id:'operation:'+name,command,status:typeof source.status==='string'?source.status:'completed',exitCode:typeof source.exitCode==='number'&&Number.isInteger(source.exitCode)?source.exitCode:null,logs:[{text}],pollAction:id&&source.status==='running'?(name==='job'||name==='install'?'job':'admin-job?id='+encodeURIComponent(id)):null};
}
