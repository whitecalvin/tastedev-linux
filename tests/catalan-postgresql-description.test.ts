import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Catalan PostgreSQL settings and overrides cover every parameter and regional locale',()=>{
  const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);
  const local=new Set([...Object.keys(descriptions.ca),...Object.keys(overrides.ca)]);
  assert.deepEqual([...local].sort(),[...canonical].sort());
  assert.equal(local.size,351);
  for(const key of [...Object.keys(descriptions.ca),...Object.keys(overrides.ca)]){
    const result=describe(key,'ca_ES.UTF-8');
    assert.equal(result.language,'ca');
    assert(result.translated,key);
    assert(result.paragraphs.every(text=>text.trim()&&!/[가-힣]/.test(text)),key);
    assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs,key);
  }
  assert.deepEqual(describe('PORT','ca-ES').paragraphs,describe('port','ca-ES').paragraphs);
  const unknown=describe('unknown.extension','ca-ES');
  assert.deepEqual(unknown.paragraphs,[]);
  assert.equal(unknown.translated,false);
  assert.equal(unknown.fallbackLabel,'Descripció complementària en anglès');
  assert.equal(unknown.unavailable,'Encara no hi ha una descripció traduïda d’aquest paràmetre.');
});

test('Catalan TLS, keepalive and transaction help retains version scopes and defaults',()=>{
  const older=describe('ssl_ciphers','ca-ES').paragraphs.join(' ');
  const newer=describe('ssl_tls13_ciphers','ca-ES').paragraphs.join(' ');
  assert(older.includes('TLSv1.2')&&older.includes('versions anteriors'));
  assert(newer.includes('TLSv1.3')&&newer.includes('cadena buida')&&newer.includes('predeterminats'));
  for(const name of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout']){
    const text=describe(name,'ca-ES').paragraphs.join(' ');
    assert(text.includes('0')&&text.includes('valor predeterminat del sistema'),name);
  }
  const transaction=describe('transaction_timeout','ca-ES').paragraphs.join(' ');
  assert(transaction.includes('excepte les transaccions preparades')&&transaction.includes('0 desactiva'));
  const wal=describe('wal_summary_keep_time','ca-ES').paragraphs.join(' ');
  assert(wal.includes('0 desactiva l’eliminació automàtica'));
  assert(describe('wal_buffers','ca-ES').paragraphs.join(' ').includes('-1 indica que s’utilitza una fracció de shared_buffers'));
});

test('Catalan log and standby descriptions distinguish full values, disabled logging and unlimited waits',()=>{
  for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){
    const text=describe(key,'ca-ES').paragraphs.join(' ');
    assert(text.includes('en bytes')&&text.includes('-1')&&text.includes('valors complets'),key);
  }
  const temp=describe('log_temp_files','ca-ES').paragraphs.join(' ');
  assert(temp.includes('kilobytes')&&temp.includes('-1 desactiva')&&temp.includes('0 registra tots'));
  for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){
    const text=describe(key,'ca-ES').paragraphs.join(' ');
    assert(text.includes('cancel·lar consultes')&&text.includes('-1')&&text.includes('indefinidament'),key);
  }
  const transaction=describe('idle_in_transaction_session_timeout','ca-ES').paragraphs.join(' ');
  const idle=describe('idle_session_timeout','ca-ES').paragraphs.join(' ');
  assert(transaction.includes('dins d’una transacció')&&idle.includes('fora d’una transacció'));
  assert(describe('io_workers','ca-ES').paragraphs.join(' ').includes('io_method=worker'));
  assert(describe('max_slot_wal_keep_size','ca-ES').paragraphs.join(' ').includes('ranures de replicació es marquen com a fallides'));
});

test('Catalan maintenance descriptions distinguish inherited limits, disabled triggers and time units',()=>{
  for(const [name,reference] of [
    ['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],
    ['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],
    ['autovacuum_work_mem','maintenance_work_mem'],
  ]){
    const text=describe(name,'ca-ES').paragraphs.join(' ');
    assert(text.includes('-1')&&text.includes('s’utilitza')&&text.includes(reference),name);
  }
  const insert=describe('autovacuum_vacuum_insert_threshold','ca-ES').paragraphs.join(' ');
  assert(insert.includes('-1 desactiva')&&insert.includes('insercions'));
  const maximum=describe('autovacuum_vacuum_max_threshold','ca-ES').paragraphs.join(' ');
  assert(maximum.includes('-1 desactiva el llindar màxim'));
  assert(describe('commit_delay','ca-ES').paragraphs.join(' ').includes('microsegons'));
  assert(describe('autovacuum_vacuum_cost_delay','ca-ES').paragraphs.join(' ').includes('mil·lisegons'));
  assert(describe('archive_command','ca-ES').paragraphs[1].includes('archive_library'));
  assert(describe('archive_library','ca-ES').paragraphs[1].includes('archive_command'));
});

test('Catalan planner and durability help retains estimates and crash-recovery conditions',()=>{
  const cache=describe('effective_cache_size','ca-ES').paragraphs.join(' ');
  assert(cache.includes('planificador pressuposa')&&cache.includes('8 kB')&&cache.includes('buffers compartits'));
  const sync=describe('fsync','ca-ES').paragraphs.join(' ');
  assert(sync.includes('fsync()')&&sync.includes('físicament al disc')&&sync.includes('estat coherent'));
  const pages=describe('full_page_writes','ca-ES').paragraphs.join(' ');
  assert(pages.includes('parcialment al disc')&&pages.includes('no són suficients')&&pages.includes('primer cop després d’un checkpoint'));
  assert(describe('backslash_quote','ca-ES').paragraphs.join(' ').includes("\\'"));
});

test('Catalan PostgreSQL security and include explanations retain ordering and failure behavior',()=>{
  const method=hba('method','ca-ES').text;
  assert(method.includes('primera regla')&&method.includes('no es proven les regles posteriors'));
  const password=hba('password','ca-ES').text;
  assert(password.includes('sense xifrar')&&password.includes('cal TLS'));
  const row=describe('row_security','ca-ES').paragraphs.join(' ');
  assert(row.includes('off')&&row.includes('fallen')&&row.includes('no concedeix accés sense restriccions')&&row.includes('BYPASSRLS'));
  const insert=describe('autovacuum_vacuum_insert_scale_factor','ca-ES').paragraphs.join(' ');
  assert(insert.includes('pàgines no congelades')&&insert.includes('insercions'));
  const include=describe('include_if_exists','ca-ES').paragraphs.join(' ');
  assert(include.includes('s’ignora')&&include.includes('altres errors de lectura'));
  const directory=describe('include_dir','ca-ES').paragraphs.join(' ');
  for(const part of ['no ocults','.conf','ordre de nom','regional C'])assert(directory.includes(part),part);
  const memory=describe('work_mem','ca-ES').paragraphs.join(' ');
  assert(memory.includes('Cada operació interna')&&memory.includes('cada taula hash')&&memory.includes('fitxers temporals'));
});
