import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Finnish PostgreSQL descriptions resolve region and case with explicit local fallback notices',()=>{
  const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);
  const local=new Set([...Object.keys(descriptions.fi),...Object.keys(overrides.fi)]);
  assert.deepEqual([...local].sort(),[...canonical].sort());
  assert.equal(local.size,351);
  for(const key of [...Object.keys(descriptions.fi),...Object.keys(overrides.fi)]){
    const result=describe(key,'fi_FI.UTF-8');
    assert.equal(result.language,'fi',key);
    assert(result.translated,key);
    assert(result.paragraphs.every(text=>text.trim()&&!/[가-힣]/.test(text)),key);
    assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs,key);
  }
  assert.deepEqual(describe('PORT','fi-FI').paragraphs,describe('port','fi-FI').paragraphs);
  const unknown=describe('unknown.extension','fi-FI');
  assert.deepEqual(unknown.paragraphs,[]);
  assert.equal(unknown.translated,false);
  assert.equal(unknown.fallbackLabel,'Täydentävä englanninkielinen kuvaus');
  assert.equal(unknown.unavailable,'Tämän asetuksen käännetty kuvaus ei ole vielä saatavilla.');
});

test('Finnish TLS, transaction and WAL help preserves version scopes and special defaults',()=>{
  assert(describe('ssl_ciphers','fi-FI').paragraphs[0].includes('TLSv1.2:n ja vanhempien'));
  const tls13=describe('ssl_tls13_ciphers','fi-FI').paragraphs.join(' ');
  assert(tls13.includes('TLSv1.3')&&tls13.includes('Tyhjä merkkijono')&&tls13.includes('oletussalausyhdistelmiä'));
  for(const name of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout']){
    assert(describe(name,'fi-FI').paragraphs.join(' ').includes('0 tarkoittaa, että käytetään järjestelmän oletusarvoa'),name);
  }
  assert(describe('transaction_timeout','fi-FI').paragraphs[0].includes('lukuun ottamatta valmisteltuja transaktioita'));
  assert(describe('wal_summary_keep_time','fi-FI').paragraphs[1].includes('0 poistaa yhteenvetotiedostojen automaattisen poistamisen'));
  assert(describe('wal_buffers','fi-FI').paragraphs[1].includes('-1')&&describe('wal_buffers','fi-FI').paragraphs[1].includes('shared_buffers'));
  assert(hba('local','fi-FI').text.includes('Unix-soketti'));
  assert(hba('peer','fi-FI').text.includes('Unix-soketti'));
});

test('Finnish logs and replication help separates full values, disabled logging and unlimited waits',()=>{
  for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){
    const text=describe(key,'fi-FI').paragraphs.join(' ');
    assert(text.includes('tavuina')&&text.includes('-1')&&text.includes('arvot kirjataan kokonaan'),key);
  }
  const temp=describe('log_temp_files','fi-FI').paragraphs.join(' ');
  assert(temp.includes('kilotavumäärää')&&temp.includes('-1 poistaa')&&temp.includes('0 kirjaa kaikki'));
  for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){
    const text=describe(key,'fi-FI').paragraphs.join(' ');
    assert(text.includes('kyselyjen peruuttamista')&&text.includes('-1')&&text.includes('odotetaan rajattomasti'),key);
  }
  const page=describe('max_pred_locks_per_page','fi-FI').paragraphs.join(' ');
  const relation=describe('max_pred_locks_per_relation','fi-FI').paragraphs.join(' ');
  assert(page.includes('lukot korvataan sivutason lukolla'));
  assert(relation.includes('lukot korvataan relaatiotason lukolla'));
  assert(describe('max_slot_wal_keep_size','fi-FI').paragraphs.join(' ').includes('replikaatiopaikat merkitään epäonnistuneiksi'));
});

test('Finnish planner, durability and idle help retains estimates and operational conditions',()=>{
  const cache=describe('effective_cache_size','fi-FI').paragraphs.join(' ');
  assert(cache.includes('suunnittelijan oletuksen')&&cache.includes('8 kB')&&cache.includes('jaetut puskurit'));
  const sync=describe('fsync','fi-FI').paragraphs.join(' ');
  assert(sync.includes('fsync()')&&sync.includes('fyysisen tallentumisen levylle')&&sync.includes('yhtenäiseen tilaan'));
  const pages=describe('full_page_writes','fi-FI').paragraphs.join(' ');
  assert(pages.includes('vain osittain')&&pages.includes('eivät silloin riitä')&&pages.includes('tarkistuspisteen jälkeen'));
  assert(describe('idle_in_transaction_session_timeout','fi-FI').paragraphs[0].includes('transaktion sisällä'));
  assert(describe('idle_session_timeout','fi-FI').paragraphs[0].includes('transaktion ulkopuolella'));
  assert(describe('io_workers','fi-FI').paragraphs[0].includes('io_method=worker'));
  for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost']){
    assert(describe(key,'fi-FI').paragraphs[1].startsWith('-1 poistaa'),key);
  }
});

test('Finnish maintenance help preserves inherited settings, disabled triggers and timing units',()=>{
  for(const [name,reference] of [
    ['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],
    ['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],
    ['autovacuum_work_mem','maintenance_work_mem'],
  ]){
    const text=describe(name,'fi-FI').paragraphs.join(' ');
    assert(text.includes('-1')&&text.includes('käytetään')&&text.includes(reference),name);
  }
  const insert=describe('autovacuum_vacuum_insert_threshold','fi-FI').paragraphs.join(' ');
  assert(insert.includes('-1 poistaa')&&insert.includes('lisäysten käynnistämät'));
  const maximum=describe('autovacuum_vacuum_max_threshold','fi-FI').paragraphs.join(' ');
  assert(maximum.includes('-1 poistaa enimmäiskynnyksen'));
  assert(describe('commit_delay','fi-FI').paragraphs.join(' ').includes('mikrosekunteina'));
  assert(describe('autovacuum_vacuum_cost_delay','fi-FI').paragraphs.join(' ').includes('millisekunteina'));
  assert(describe('archive_command','fi-FI').paragraphs[1].includes('archive_library'));
  assert(describe('archive_library','fi-FI').paragraphs[1].includes('archive_command'));
  assert(describe('backslash_quote','fi-FI').paragraphs[0].includes("\\'"));
});

test('Finnish PostgreSQL help preserves authentication order, row-security failure and memory scope',()=>{
  const method=hba('method','fi-FI').text;
  assert(method.includes('Ensimmäinen täsmäävä')&&method.includes('myöhempiä sääntöjä ei kokeilla'));
  const password=hba('password','fi-FI').text;
  assert(password.includes('salaamattomana')&&password.includes('edellyttää TLS'));
  const row=describe('row_security','fi-FI').paragraphs.join(' ');
  assert(row.includes('off')&&row.includes('epäonnistuvat')&&row.includes('ei anna rajoittamatonta pääsyä')&&row.includes('BYPASSRLS'));
  const insert=describe('autovacuum_vacuum_insert_scale_factor','fi-FI').paragraphs.join(' ');
  assert(insert.includes('jäädyttämättömien sivujen')&&insert.includes('lisäysten'));
  const directory=describe('include_dir','fi-FI').paragraphs.join(' ');
  assert(directory.includes('muut kuin piilotetut')&&directory.includes('.conf')&&directory.includes('C-lokaalin'));
  const memory=describe('work_mem','fi-FI').paragraphs.join(' ');
  assert(memory.includes('Jokainen sisäinen lajitteluoperaatio')&&memory.includes('hajautustaulu')&&memory.includes('levytiedostoihin'));
});
