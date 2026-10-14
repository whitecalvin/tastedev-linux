import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Romanian settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.ro),...Object.keys(overrides.ro)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'ro_RO.UTF-8');assert(result.translated,key);assert.equal(result.language,'ro');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','ro-RO').paragraphs,describe('port','ro-RO').paragraphs);
 const unknown=describe('unknown.extension','ro-RO');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Descriere suplimentară în engleză');assert.equal(unknown.unavailable,'O descriere tradusă a acestei setări nu este încă disponibilă.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'ro-RO').paragraphs,[]);
});

test('Romanian TLS and timeout help distinguishes protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','ro-RO').paragraphs[0].includes('TLSv1.2 și versiunile anterioare'));
 assert(describe('ssl_tls13_ciphers','ro-RO').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','ro-RO').paragraphs[1].includes('șir gol'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'ro-RO').paragraphs[1].includes('0 înseamnă că se folosește valoarea implicită a sistemului'),key);
 assert(describe('transaction_timeout','ro-RO').paragraphs[0].includes('tranzacțiile pregătite nu sunt incluse'));
 assert(describe('transaction_timeout','ro-RO').paragraphs[1].includes('0 dezactivează limita de timp'));
 assert(describe('wal_summary_keep_time','ro-RO').paragraphs[1].includes('0 dezactivează ștergerea automată'));
 assert(describe('wal_buffers','ro-RO').paragraphs[1].includes('-1 înseamnă că se folosește o fracțiune din shared_buffers'));
 assert(describe('synchronized_standby_slots','ro-RO').paragraphs[1].includes('au confirmat primirea WAL'));
});

test('Romanian logs and replication help distinguishes complete parameter values, disabled logs and unlimited waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){const text=describe(key,'ro-RO').paragraphs.join(' ');assert(text.includes('în octeți')&&text.includes('-1')&&text.includes('valorile sunt înregistrate integral'),key);}
 const temp=describe('log_temp_files','ro-RO').paragraphs.join(' ');assert(temp.includes('kiloocteți')&&temp.includes('-1 dezactivează')&&temp.includes('0 înregistrează toate'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'ro-RO').paragraphs.join(' ');assert(text.includes('anularea interogărilor')&&text.includes('-1 înseamnă așteptare nelimitată'),key);}
 assert(describe('max_pred_locks_per_page','ro-RO').paragraphs[1].includes('blocaj la nivel de pagină'));
 assert(describe('max_pred_locks_per_relation','ro-RO').paragraphs[1].includes('blocaj la nivel de relație'));
 assert(describe('max_slot_wal_keep_size','ro-RO').paragraphs[1].includes('sloturile de replicare sunt marcate ca eșuate'));
});

test('Romanian planner and I/O help retains cache assumptions, crash recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','ro-RO').paragraphs.join(' ');assert(cache.includes('ipoteza planificatorului')&&cache.includes('8 kB')&&cache.includes('bufferele partajate'));
 const sync=describe('fsync','ro-RO').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('scrierea fizică')&&sync.includes('stare consistentă'));
 const pages=describe('full_page_writes','ro-RO').paragraphs.join(' ');assert(pages.includes('parțial pe disc')&&pages.includes('nu sunt suficiente')&&pages.includes('prima modificare după un punct de control'));
 assert(describe('idle_in_transaction_session_timeout','ro-RO').paragraphs[0].includes('în interiorul unei tranzacții'));
 assert(describe('idle_session_timeout','ro-RO').paragraphs[0].includes('în afara unei tranzacții'));
 assert(describe('io_workers','ro-RO').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'ro-RO').paragraphs[1].startsWith('-1 dezactivează'),key);
});

test('Romanian authentication help retains first-match failure and transport safeguards',()=>{
 assert.equal(Object.keys(hbaCatalog.ro).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'ro_RO.UTF-8');assert(result.translated,key);assert.equal(result.language,'ro');assert.notEqual(result.text,english);}
 const method=hba('method','ro-RO').text;assert(method.includes('Prima regulă')&&method.includes('regulile următoare nu sunt încercate'));
 assert(hba('password','ro-RO').text.includes('necriptată')&&hba('password','ro-RO').text.includes('TLS este necesar'));
 assert(hba('sspi','ro-RO').text.includes('indisponibilă pe Linux'));
 const row=describe('row_security','ro-RO').paragraphs[0];assert(row.includes('off')&&row.includes('eșuează')&&row.includes('nu acordă acces nelimitat')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','ro-RO').paragraphs[0].includes('paginile neînghețate'));
 const include=describe('include_dir','ro-RO').paragraphs[0];assert(include.includes('neascunse')&&include.includes('.conf')&&include.includes('localizarea C'));
 assert(describe('work_mem','ro-RO').paragraphs[1].includes('Fiecare operație internă')&&describe('work_mem','ro-RO').paragraphs[1].includes('fișiere temporare pe disc'));
});

test('Romanian maintenance help distinguishes inherited defaults from disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){
  const text=describe(key,'ro-RO').paragraphs.join(' ');assert(text.includes('-1 înseamnă că se folosește')&&text.includes(reference),key);
 }
 assert(describe('autovacuum_vacuum_insert_threshold','ro-RO').paragraphs[1].includes('-1 dezactivează VACUUM declanșat de inserări'));
 assert(describe('autovacuum_vacuum_max_threshold','ro-RO').paragraphs[1].includes('-1 dezactivează pragul maxim'));
 assert(describe('autovacuum_vacuum_cost_delay','ro-RO').paragraphs[0].includes('milisecunde'));
 assert(describe('commit_delay','ro-RO').paragraphs[0].includes('microsecunde'));
 assert(describe('archive_command','ro-RO').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','ro-RO').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','ro-RO').paragraphs[0].includes("\\'"));
});
