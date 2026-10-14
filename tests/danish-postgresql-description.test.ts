import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Danish PostgreSQL descriptions cover every canonical setting and resolve regional preferences',()=>{
  const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);
  const translated=new Set([...Object.keys(descriptions.da),...Object.keys(overrides.da)]);
  assert.equal(canonical.size,351);assert.deepEqual(translated,canonical);
  for(const key of [...Object.keys(descriptions.da),...Object.keys(overrides.da)]){
    const result=describe(key,'da_DK.UTF-8');
    assert(result.translated,key);assert.equal(result.language,'da',key);
    assert(result.paragraphs.every(text=>text.trim()&&!/[가-힣]/.test(text)),key);
    assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs,key);
  }
  assert.deepEqual(describe('PORT','da-DK').paragraphs,describe('port','da-DK').paragraphs);
  const unknown=describe('unknown.extension','da-DK');
  assert.deepEqual(unknown.paragraphs,[]);
  assert.equal(unknown.translated,false);
  assert.equal(unknown.fallbackLabel,'Supplerende engelsk beskrivelse');
  assert.equal(unknown.unavailable,'Der findes endnu ikke en oversat beskrivelse af denne indstilling.');
});

test('Danish TLS, TCP, transaction and WAL help keeps distinct protocol and zero-value semantics',()=>{
  assert(describe('ssl_ciphers','da-DK').paragraphs[0].includes('TLSv1.2 og tidligere'));
  assert(describe('ssl_tls13_ciphers','da-DK').paragraphs[0].includes('TLSv1.3'));
  assert(describe('ssl_tls13_ciphers','da-DK').paragraphs[1].includes('tom streng'));
  for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout']){
    assert(describe(key,'da-DK').paragraphs[1].includes('0 betyder, at systemets standardværdi bruges'),key);
  }
  assert(describe('transaction_timeout','da-DK').paragraphs[0].includes('forberedte transaktioner er ikke omfattet'));
  assert(describe('transaction_timeout','da-DK').paragraphs[1].includes('0 deaktiverer tidsgrænsen'));
  assert(describe('wal_summary_keep_time','da-DK').paragraphs[1].includes('0 deaktiverer automatisk sletning'));
  assert(describe('wal_buffers','da-DK').paragraphs[1].includes('-1 betyder, at en andel af shared_buffers bruges'));
  assert(describe('synchronized_standby_slots','da-DK').paragraphs[1].includes('bekræftet modtagelsen af WAL'));
});

test('Danish logs and replication help distinguishes full values, disabled logs and unlimited waits',()=>{
  for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){
    const text=describe(key,'da-DK').paragraphs.join(' ');
    assert(text.includes('i bytes')&&text.includes('-1')&&text.includes('værdier logges fuldt ud'),key);
  }
  const temp=describe('log_temp_files','da-DK').paragraphs.join(' ');
  assert(temp.includes('kilobytes')&&temp.includes('-1 deaktiverer')&&temp.includes('0 logger alle'));
  for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){
    const text=describe(key,'da-DK').paragraphs.join(' ');
    assert(text.includes('annullering af forespørgsler')&&text.includes('-1 betyder ubegrænset ventetid'),key);
  }
  assert(describe('max_pred_locks_per_page','da-DK').paragraphs[1].includes('lås på sideniveau'));
  assert(describe('max_pred_locks_per_relation','da-DK').paragraphs[1].includes('lås på relationsniveau'));
  assert(describe('max_slot_wal_keep_size','da-DK').paragraphs[1].includes('replikeringspladser som fejlede'));
});

test('Danish planner, durability and idle help retains estimates and transaction boundaries',()=>{
  const cache=describe('effective_cache_size','da-DK').paragraphs.join(' ');
  assert(cache.includes('planlæggerens antagelse')&&cache.includes('8 kB')&&cache.includes('delte buffere'));
  const sync=describe('fsync','da-DK').paragraphs.join(' ');
  assert(sync.includes('fsync()')&&sync.includes('fysisk til disk')&&sync.includes('konsistent tilstand'));
  const pages=describe('full_page_writes','da-DK').paragraphs.join(' ');
  assert(pages.includes('delvist til disk')&&pages.includes('ikke tilstrækkelige')&&pages.includes('første ændring efter et checkpoint'));
  assert(describe('idle_in_transaction_session_timeout','da-DK').paragraphs[0].includes('inden for en transaktion'));
  assert(describe('idle_session_timeout','da-DK').paragraphs[0].includes('uden for en transaktion'));
  assert(describe('io_workers','da-DK').paragraphs[0].includes('io_method=worker'));
  for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'da-DK').paragraphs[1].startsWith('-1 deaktiverer'),key);
});

test('Danish maintenance help preserves inherited defaults, disabled triggers and time units',()=>{
  for(const [name,reference] of [
    ['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],
    ['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],
    ['autovacuum_work_mem','maintenance_work_mem'],
  ]){
    const text=describe(name,'da-DK').paragraphs.join(' ');
    assert(text.includes('-1')&&text.includes('bruges')&&text.includes(reference),name);
  }
  assert(describe('autovacuum_vacuum_insert_threshold','da-DK').paragraphs[1].includes('-1 deaktiverer VACUUM udløst af indsættelser'));
  assert(describe('autovacuum_vacuum_max_threshold','da-DK').paragraphs[1].includes('-1 deaktiverer den maksimale tærskel'));
  assert(describe('commit_delay','da-DK').paragraphs[0].includes('mikrosekunder'));
  assert(describe('autovacuum_vacuum_cost_delay','da-DK').paragraphs[0].includes('millisekunder'));
  assert(describe('archive_command','da-DK').paragraphs[1].includes('archive_library'));
  assert(describe('archive_library','da-DK').paragraphs[1].includes('archive_command'));
  assert(describe('backslash_quote','da-DK').paragraphs[0].includes("\\'"));
});

test('Danish authentication and setting help preserves first-match and row-security safeguards',()=>{
  const method=hba('method','da-DK').text;
  assert(method.includes('første matchende regel')&&method.includes('senere regler ikke'));
  assert(hba('password','da-DK').text.includes('ukrypteret')&&hba('password','da-DK').text.includes('TLS er nødvendigt'));
  const row=describe('row_security','da-DK').paragraphs[0];
  assert(row.includes('off')&&row.includes('fejler')&&row.includes('ikke ubegrænset adgang')&&row.includes('BYPASSRLS'));
  assert(describe('autovacuum_vacuum_insert_scale_factor','da-DK').paragraphs[0].includes('ikke-frosne sider'));
  const include=describe('include_dir','da-DK').paragraphs[0];
  assert(include.includes('ikke-skjulte')&&include.includes('.conf')&&include.includes('C-lokalets'));
  const memory=describe('work_mem','da-DK').paragraphs[1];
  assert(memory.includes('Hver intern sorteringsoperation og hashtabel')&&memory.includes('midlertidige filer på disk'));
});
