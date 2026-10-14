import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Norwegian Bokmal settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.nb),...Object.keys(overrides.nb)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);
 assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'nb_NO.UTF-8');assert(result.translated,key);assert.equal(result.language,'nb');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','nb-NO').paragraphs,describe('port','nb-NO').paragraphs);
 const unknown=describe('unknown.extension','nb-NO');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Supplerende engelsk beskrivelse');assert.equal(unknown.unavailable,'En oversatt beskrivelse av denne innstillingen er ikke tilgjengelig ennå.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'nb-NO').paragraphs,[]);
});

test('Norwegian TLS and timeout descriptions preserve protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','nb-NO').paragraphs[0].includes('TLSv1.2 og tidligere'));
 assert(describe('ssl_tls13_ciphers','nb-NO').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','nb-NO').paragraphs[1].includes('tom streng'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'nb-NO').paragraphs[1].includes('0 betyr at systemets standardverdi brukes'),key);
 assert(describe('transaction_timeout','nb-NO').paragraphs[0].includes('forberedte transaksjoner omfattes ikke'));
 assert(describe('transaction_timeout','nb-NO').paragraphs[1].includes('0 deaktiverer tidsgrensen'));
 assert(describe('wal_summary_keep_time','nb-NO').paragraphs[1].includes('0 deaktiverer automatisk sletting'));
 assert(describe('wal_buffers','nb-NO').paragraphs[1].includes('-1 betyr at en andel av shared_buffers brukes'));
 assert(describe('synchronized_standby_slots','nb-NO').paragraphs[1].includes('bekreftet mottak av WAL'));
});

test('Norwegian log and replication help distinguishes complete values, disabled logs and unlimited standby waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){
  const text=describe(key,'nb-NO').paragraphs.join(' ');assert(text.includes('i bytes')&&text.includes('-1')&&text.includes('verdiene logges i sin helhet'),key);
 }
 const temp=describe('log_temp_files','nb-NO').paragraphs.join(' ');assert(temp.includes('kilobytes')&&temp.includes('-1 deaktiverer')&&temp.includes('0 logger alle'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'nb-NO').paragraphs.join(' ');assert(text.includes('spørringer avbrytes')&&text.includes('-1 betyr ubegrenset ventetid'),key);}
 assert(describe('max_pred_locks_per_page','nb-NO').paragraphs[1].includes('lås på sidenivå'));
 assert(describe('max_pred_locks_per_relation','nb-NO').paragraphs[1].includes('lås på relasjonsnivå'));
 assert(describe('max_slot_wal_keep_size','nb-NO').paragraphs[1].includes('replikeringsplassene som mislykkede'));
});

test('Norwegian planner and durability help preserves estimates, crash recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','nb-NO').paragraphs.join(' ');assert(cache.includes('planleggerens antakelse')&&cache.includes('8 kB')&&cache.includes('delte buffere'));
 const sync=describe('fsync','nb-NO').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('fysisk til disk')&&sync.includes('konsistent tilstand'));
 const pages=describe('full_page_writes','nb-NO').paragraphs.join(' ');assert(pages.includes('delvis skrevet til disk')&&pages.includes('ikke tilstrekkelige')&&pages.includes('første endring etter et kontrollpunkt'));
 assert(describe('idle_in_transaction_session_timeout','nb-NO').paragraphs[0].includes('innenfor en transaksjon'));
 assert(describe('idle_session_timeout','nb-NO').paragraphs[0].includes('utenfor en transaksjon'));
 assert(describe('io_workers','nb-NO').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'nb-NO').paragraphs[1].startsWith('-1 deaktiverer'),key);
});

test('Norwegian maintenance explanations distinguish inherited defaults from disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){
  const text=describe(key,'nb-NO').paragraphs.join(' ');assert(text.includes('-1 betyr at')&&text.includes(reference)&&text.includes('brukes'),key);
 }
 assert(describe('autovacuum_vacuum_insert_threshold','nb-NO').paragraphs[1].includes('-1 deaktiverer VACUUM utløst av innsettinger'));
 assert(describe('autovacuum_vacuum_max_threshold','nb-NO').paragraphs[1].includes('-1 deaktiverer den maksimale terskelen'));
 assert(describe('autovacuum_vacuum_cost_delay','nb-NO').paragraphs[0].includes('millisekunder'));
 assert(describe('commit_delay','nb-NO').paragraphs[0].includes('mikrosekunder'));
 assert(describe('archive_command','nb-NO').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','nb-NO').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','nb-NO').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'nb-NO').paragraphs[1].includes('0 deaktiverer tvungen tilbakeskriving'),key);
});

test('Norwegian connection-rule help preserves first-match failure, transport and identity differences',()=>{
 assert.equal(Object.keys(hbaCatalog.nb).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'nb_NO.UTF-8');assert(result.translated,key);assert.equal(result.language,'nb');assert.notEqual(result.text,english);}
 assert(hba('method','nb-NO').text.includes('første samsvarende regel'));assert(hba('method','nb-NO').text.includes('ikke senere regler'));
 assert(hba('password','nb-NO').text.includes('ukryptert')&&hba('password','nb-NO').text.includes('TLS er nødvendig'));
 assert(hba('sspi','nb-NO').text.includes('ikke tilgjengelig på Linux'));
 assert(hba('ident','nb-NO').text.includes('local bruker peer'));
 assert(hba('peer','nb-NO').text.includes('operativsystemet'));
});

test('Norwegian setting explanations retain policy failure, unfrozen pages and per-operation memory limits',()=>{
 const row=describe('row_security','nb-NO').paragraphs[0];assert(row.includes('off')&&row.includes('feiler')&&row.includes('ikke ubegrenset')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','nb-NO').paragraphs[0].includes('ikke-fryste tabellsider'));
 const include=describe('include_dir','nb-NO').paragraphs[0];assert(include.includes('ikke-skjulte')&&include.includes('.conf')&&include.includes('C-lokalets'));
 assert(describe('include_if_exists','nb-NO').paragraphs[0].includes('andre lesefeil rapporteres'));
 assert(describe('work_mem','nb-NO').paragraphs[1].includes('Hver intern sorteringsoperasjon')&&describe('work_mem','nb-NO').paragraphs[1].includes('midlertidige filer på disk'));
});
