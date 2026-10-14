import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Czech settings cover canonical descriptions and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.cs),...Object.keys(overrides.cs)]);assert.equal(keys.size,351);
 for(const key of keys){const result=describe(key,'cs_CZ.UTF-8');assert(result.translated,key);assert.equal(result.language,'cs');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','cs-CZ').paragraphs,describe('port','cs-CZ').paragraphs);
 const gap=describe('wal_level','is-IS');assert.equal(gap.translated,false);assert.equal(gap.language,'en');assert.deepEqual(gap.paragraphs,descriptions.en.wal_level);
 const unknown=describe('unknown.extension','cs-CZ');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.unavailable,'Přeložený popis tohoto nastavení zatím není k dispozici.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'cs-CZ').paragraphs,[]);
});

test('Czech maintenance help distinguishes inherited defaults, disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'cs-CZ').paragraphs.join(' ');assert(text.includes('-1 znamená použití')&&text.includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','cs-CZ').paragraphs[1].includes('-1 vypíná VACUUM vyvolaný vkládáním'));
 assert(describe('autovacuum_vacuum_max_threshold','cs-CZ').paragraphs[1].includes('-1 vypíná maximální práh'));
 assert(describe('autovacuum_vacuum_cost_delay','cs-CZ').paragraphs[0].includes('milisekundách'));
 assert(describe('commit_delay','cs-CZ').paragraphs[0].includes('mikrosekundách'));
 assert(describe('archive_command','cs-CZ').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','cs-CZ').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','cs-CZ').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'cs-CZ').paragraphs[1].includes('0 vypíná vynucený zápis na disk'),key);
});

test('Czech connection help preserves first-match failure, transport and operating-system identity',()=>{
 assert.equal(Object.keys(hbaCatalog.cs).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'cs_CZ.UTF-8');assert(result.translated,key);assert.equal(result.language,'cs');assert.notEqual(result.text,english);}
 const method=hba('method','cs-CZ').text;assert(method.includes('První odpovídající pravidlo')&&method.includes('další pravidla nezkoušejí'));
 const password=hba('password','cs-CZ').text;assert(password.includes('nešifrovaně')&&password.includes('je nutné TLS'));
 assert(hba('sspi','cs-CZ').text.includes('v Linuxu není dostupné'));
 assert(hba('ident','cs-CZ').text.includes('local místo toho používá peer'));
 assert(hba('peer','cs-CZ').text.includes('poskytnuté operačním systémem'));
});

test('Czech setting help retains policy failure, unfrozen pages, include ordering and per-operation memory',()=>{
 const row=describe('row_security','cs-CZ').paragraphs[0];assert(row.includes('off')&&row.includes('selžou')&&row.includes('nedává neomezený přístup')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','cs-CZ').paragraphs[0].includes('nezmrazených stránek'));
 const include=describe('include_dir','cs-CZ').paragraphs[0];assert(include.includes('neskryté')&&include.includes('.conf')&&include.includes('národního prostředí C'));
 assert(describe('include_if_exists','cs-CZ').paragraphs[0].includes('jiné chyby čtení se hlásí'));
 const memory=describe('work_mem','cs-CZ').paragraphs[1];assert(memory.includes('Každá interní operace řazení')&&memory.includes('dočasné soubory na disku'));
});

test('Czech planner and I/O help preserves estimate, durability and distinct zero semantics',()=>{
 const cache=describe('effective_cache_size','cs-CZ').paragraphs.join(' ');assert(cache.includes('odhad plánovače')&&cache.includes('paměti jádra')&&cache.includes('8 kB'));
 assert(describe('fsync','cs-CZ').paragraphs[1].includes('fyzický zápis')&&describe('fsync','cs-CZ').paragraphs[1].includes('konzistentního stavu'));
 const page=describe('full_page_writes','cs-CZ').paragraphs.join(' ');assert(page.includes('první změně po kontrolním bodu')&&page.includes('jen částečně')&&page.includes('změny řádků')&&page.includes('nestačí'));
 for(const key of ['idle_in_transaction_session_timeout','idle_session_timeout','lock_timeout'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'0 vypíná časový limit.');
 assert(describe('idle_in_transaction_session_timeout','cs-CZ').paragraphs[0].includes('uvnitř transakce'));assert(describe('idle_session_timeout','cs-CZ').paragraphs[0].includes('mimo transakci'));
 assert.equal(describe('effective_io_concurrency','cs-CZ').paragraphs[1],'0 vypíná souběžné požadavky.');assert.equal(describe('gin_fuzzy_search_limit','cs-CZ').paragraphs[1],'0 znamená bez omezení.');
 for(const key of ['geqo_generations','geqo_pool_size'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'0 znamená použití vhodné výchozí hodnoty.');
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'cs-CZ').paragraphs[1].startsWith('-1 vypíná'));
 for(const key of ['lc_messages','lc_monetary','lc_numeric','lc_time'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'Prázdný řetězec znamená použití nastavení operačního systému.');
 assert(describe('enable_presorted_aggregate','cs-CZ').paragraphs[1].includes('vždy provádí implicitní řazení'));assert(describe('io_workers','cs-CZ').paragraphs[0].includes('io_method=worker'));
});

test('Czech logging and replication help preserves sampling, rotation and WAL retention meanings',()=>{
 assert(describe('log_min_duration_sample','cs-CZ').paragraphs[0].includes('log_statement_sample_rate'));assert(describe('log_min_duration_sample','cs-CZ').paragraphs[1].includes('zahrnout do vzorkování'));
 assert(describe('log_min_duration_statement','cs-CZ').paragraphs[1].includes('protokolovat dobu trvání všech'));
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'-1 znamená protokolovat celé hodnoty.');
 assert(describe('log_file_mode','cs-CZ').paragraphs[1].includes('osmičkový')&&describe('log_file_mode','cs-CZ').paragraphs[1].includes('začínat nulou'));
 assert(describe('log_rotation_age','cs-CZ').paragraphs[1].includes('podle času'));assert(describe('log_rotation_size','cs-CZ').paragraphs[1].includes('podle velikosti'));
 const slot=describe('max_slot_wal_keep_size','cs-CZ').paragraphs[1];assert(slot.includes('selhané')&&slot.includes('smazání nebo recyklaci')&&slot.includes('-1 znamená bez maxima'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'-1 znamená čekat neomezeně.');
 assert(describe('logical_decoding_work_mem','cs-CZ').paragraphs[1].includes('každý interní buffer'));
 assert(describe('output_plugin_libraries','cs-CZ').paragraphs[1].includes('REPLICATION')&&describe('output_plugin_libraries','cs-CZ').paragraphs[1].includes('pouze moduly'));
 assert(describe('max_pred_locks_per_page','cs-CZ').paragraphs[1].includes('zámkem celé stránky'));assert(describe('max_pred_locks_per_relation','cs-CZ').paragraphs[1].includes('zámkem celé relace'));
});

test('Czech final help keeps TLS defaults, synchronization ordering and maintenance boundaries',()=>{
 assert(describe('ssl_ciphers','cs-CZ').paragraphs[0].includes('TLSv1.2'));assert(describe('ssl_tls13_ciphers','cs-CZ').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_dh_params_file','cs-CZ').paragraphs[1].includes('zabudovaných při kompilaci'));assert(describe('ssl_passphrase_command','cs-CZ').paragraphs[1].includes('dotazu na heslo'));
 const wait=describe('synchronized_standby_slots','cs-CZ').paragraphs[1];assert(wait.includes('teprve poté')&&wait.includes('potvrdí přijetí WAL'));
 assert(describe('transaction_timeout','cs-CZ').paragraphs[0].includes('kromě připravené transakce'));
 for(const key of ['statement_timeout','transaction_timeout','wal_receiver_timeout'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'0 vypíná časový limit.');
 for(const key of ['tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert.equal(describe(key,'cs-CZ').paragraphs[1],'0 znamená použití výchozí hodnoty systému.');
 assert(describe('subtransaction_buffers','cs-CZ').paragraphs[1].includes('0 znamená použít část shared_buffers'));assert(describe('wal_buffers','cs-CZ').paragraphs[1].includes('-1 znamená použít část shared_buffers'));
 assert(describe('wal_summary_keep_time','cs-CZ').paragraphs[1].includes('vypíná automatické mazání'));
 const eager=describe('vacuum_max_eager_freeze_failure_rate','cs-CZ').paragraphs[1];assert(eager.includes('0.0 vypíná')&&eager.includes('až 100 procent')&&eager.includes('nižší než 100 procent'));
 assert(describe('transform_null_equals','cs-CZ').paragraphs[1].includes('Správné chování')&&describe('transform_null_equals','cs-CZ').paragraphs[1].includes('neznámou hodnotu'));
 assert.deepEqual(describe('timezone','cs-CZ').paragraphs,describe('TimeZone','cs-CZ').paragraphs);
});
