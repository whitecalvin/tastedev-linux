import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Dutch PostgreSQL descriptions cover every parameter and resolve regional preferences',()=>{
  const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);
  const local=new Set([...Object.keys(descriptions.nl),...Object.keys(overrides.nl)]);
  assert.deepEqual([...local].sort(),[...canonical].sort());assert.equal(local.size,351);
  for(const key of [...Object.keys(descriptions.nl),...Object.keys(overrides.nl)]){
    const result=describe(key,'nl_NL.UTF-8');
    assert(result.translated,key);assert.equal(result.language,'nl',key);
    assert(result.paragraphs.every(text=>text.trim()&&!/[가-힣]/.test(text)),key);
    assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs,key);
  }
  assert.deepEqual(describe('PORT','nl-BE').paragraphs,describe('port','nl-NL').paragraphs);
  const unknown=describe('unknown.extension','nl-NL');
  assert.deepEqual(unknown.paragraphs,[]);
  assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Aanvullende Engelse beschrijving');
  assert.equal(unknown.unavailable,'Er is nog geen vertaalde beschrijving beschikbaar voor deze instelling.');
});

test('Dutch TLS and WAL help preserves protocol versions, OS defaults and transaction exclusions',()=>{
  assert(describe('ssl_ciphers','nl-BE').paragraphs[0].includes('TLSv1.2 en oudere versies'));
  const tls13=describe('ssl_tls13_ciphers','nl-BE').paragraphs.join(' ');
  assert(tls13.includes('TLSv1.3')&&tls13.includes('lege tekenreeks')&&tls13.includes('standaardciphersuites'));
  for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout']){
    assert(describe(key,'nl-BE').paragraphs.join(' ').includes('0 betekent dat de systeemstandaard wordt gebruikt'),key);
  }
  assert(describe('transaction_timeout','nl-BE').paragraphs[0].includes('behalve voorbereide transacties'));
  assert(describe('wal_summary_keep_time','nl-BE').paragraphs[1].includes('0 schakelt automatische verwijdering'));
  assert(describe('wal_buffers','nl-BE').paragraphs[1].includes('-1')&&describe('wal_buffers','nl-BE').paragraphs[1].includes('shared_buffers'));
});

test('Dutch log and replication help separates full values, disabled logs and unlimited waits',()=>{
  for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){
    const text=describe(key,'nl-BE').paragraphs.join(' ');
    assert(text.includes('in bytes')&&text.includes('-1')&&text.includes('waarden volledig worden gelogd'),key);
  }
  const temp=describe('log_temp_files','nl-BE').paragraphs.join(' ');
  assert(temp.includes('kilobytes')&&temp.includes('-1 schakelt')&&temp.includes('0 logt alle'));
  for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){
    const text=describe(key,'nl-BE').paragraphs.join(' ');
    assert(text.includes('annuleren van query’s')&&text.includes('-1 betekent onbeperkt wachten'),key);
  }
  assert(describe('max_pred_locks_per_page','nl-BE').paragraphs[1].includes('vergrendeling op paginaniveau'));
  assert(describe('max_pred_locks_per_relation','nl-BE').paragraphs[1].includes('vergrendeling op relatieniveau'));
  assert(describe('max_slot_wal_keep_size','nl-BE').paragraphs[1].includes('replicatieslots als mislukt gemarkeerd'));
});

test('Dutch planner and durability help retains estimates, crash conditions and transaction boundaries',()=>{
  const cache=describe('effective_cache_size','nl-BE').paragraphs.join(' ');
  assert(cache.includes('aanname van de planner')&&cache.includes('8 kB')&&cache.includes('gedeelde buffers'));
  const sync=describe('fsync','nl-BE').paragraphs.join(' ');
  assert(sync.includes('fsync()')&&sync.includes('fysiek naar schijf')&&sync.includes('consistente toestand'));
  const pages=describe('full_page_writes','nl-BE').paragraphs.join(' ');
  assert(pages.includes('slechts gedeeltelijk')&&pages.includes('niet voldoende')&&pages.includes('eerste wijziging na een checkpoint'));
  assert(describe('idle_in_transaction_session_timeout','nl-BE').paragraphs[0].includes('binnen een transactie'));
  assert(describe('idle_session_timeout','nl-BE').paragraphs[0].includes('buiten een transactie'));
  assert(describe('io_workers','nl-BE').paragraphs[0].includes('io_method=worker'));
  for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'nl-BE').paragraphs[1].startsWith('-1 schakelt'),key);
});

test('Dutch maintenance help distinguishes inherited values, disabled triggers and timing units',()=>{
  for(const [name,reference] of [
    ['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],
    ['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],
    ['autovacuum_work_mem','maintenance_work_mem'],
  ]){
    const text=describe(name,'nl-BE').paragraphs.join(' ');
    assert(text.includes('-1')&&text.includes('wordt gebruikt')&&text.includes(reference),name);
  }
  const insert=describe('autovacuum_vacuum_insert_threshold','nl-BE').paragraphs.join(' ');
  assert(insert.includes('-1 schakelt')&&insert.includes('door invoegingen geactiveerde'));
  assert(describe('autovacuum_vacuum_max_threshold','nl-BE').paragraphs[1].includes('-1 schakelt de maximumdrempel uit'));
  assert(describe('commit_delay','nl-BE').paragraphs[0].includes('microseconden'));
  assert(describe('autovacuum_vacuum_cost_delay','nl-BE').paragraphs[0].includes('milliseconden'));
  assert(describe('archive_command','nl-BE').paragraphs[1].includes('archive_library'));
  assert(describe('archive_library','nl-BE').paragraphs[1].includes('archive_command'));
  assert(describe('backslash_quote','nl-BE').paragraphs[0].includes("\\'"));
});

test('Dutch authentication, row-security and memory explanations preserve security conditions',()=>{
  const method=hba('method','nl-BE').text;
  assert(method.includes('eerste overeenkomende regel')&&method.includes('latere regels niet geprobeerd'));
  assert(hba('password','nl-BE').text.includes('zonder versleuteling'));
  assert(hba('password','nl-BE').text.includes('TLS is nodig'));
  const row=describe('row_security','nl-BE').paragraphs.join(' ');
  assert(row.includes('off')&&row.includes('mislukken')&&row.includes('geen onbeperkte toegang')&&row.includes('BYPASSRLS'));
  assert(describe('autovacuum_vacuum_insert_scale_factor','nl-BE').paragraphs[0].includes('niet-bevroren tabelpagina’s'));
  const directory=describe('include_dir','nl-BE').paragraphs.join(' ');
  assert(directory.includes('niet-verborgen')&&directory.includes('.conf')&&directory.includes('C-locale'));
  const memory=describe('work_mem','nl-BE').paragraphs.join(' ');
  assert(memory.includes('Elke interne sorteerbewerking en hashtabel')&&memory.includes('tijdelijke bestanden op schijf'));
});
