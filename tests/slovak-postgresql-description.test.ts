import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Slovak settings cover canonical descriptions and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.sk),...Object.keys(overrides.sk)]);
 assert.equal(keys.size,351);
 for(const key of keys){const result=describe(key,'sk_SK.UTF-8');assert(result.translated,key);assert.equal(result.language,'sk');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','sk-SK').paragraphs,describe('port','sk-SK').paragraphs);
 const gap=describe('wal_level','is-IS');assert.equal(gap.translated,false);assert.equal(gap.language,'en');assert.deepEqual(gap.paragraphs,descriptions.en.wal_level);
 assert.equal(describe('unknown.extension','sk-SK').unavailable,'Preložený popis tohto nastavenia zatiaľ nie je k dispozícii.');
 for(const key of ['unknown.extension','__proto__','constructor'])assert.deepEqual(describe(key,'sk-SK').paragraphs,[]);
});

test('Slovak connection rules preserve first-match failure and identity boundaries',()=>{
 assert.equal(Object.keys(hbaCatalog.sk).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'sk_SK.UTF-8');assert(result.translated,key);assert.equal(result.language,'sk');assert.notEqual(result.text,english);}
 const method=hba('method','sk-SK').text;assert(method.includes('Prvé zodpovedajúce pravidlo')&&method.includes('ďalšie pravidlá neskúšajú'));
 assert(hba('password','sk-SK').text.includes('nešifrovane')&&hba('password','sk-SK').text.includes('je potrebné TLS'));
 assert(hba('sspi','sk-SK').text.includes('v Linuxe nie je dostupné'));
 assert(hba('ident','sk-SK').text.includes('local namiesto toho používa peer'));
 assert(hba('peer','sk-SK').text.includes('poskytnuté operačným systémom'));
});

test('Slovak core help retains per-operation memory, include rules and row-security failure',()=>{
 const memory=describe('work_mem','sk-SK').paragraphs[1];assert(memory.includes('Každá interná operácia')&&memory.includes('dočasné súbory na disku'));
 const include=describe('include_dir','sk-SK').paragraphs[0];assert(include.includes('neskryté')&&include.includes('.conf')&&include.includes('národného prostredia C'));
 assert(describe('include_if_exists','sk-SK').paragraphs[0].includes('ostatné chyby čítania sa stále hlásia'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','sk-SK').paragraphs[0].includes('nezmrazených stránok'));
 const policy=describe('row_security','sk-SK').paragraphs[0];assert(policy.includes('zlyhajú')&&policy.includes('neposkytuje neobmedzený prístup')&&policy.includes('BYPASSRLS'));
});

test('Slovak maintenance help distinguishes inheritance, disabling and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'sk-SK').paragraphs.join(' ');assert(text.includes('-1 znamená použiť')&&text.includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','sk-SK').paragraphs[1].includes('-1 vypína VACUUM vyvolaný vkladaním'));assert(describe('autovacuum_vacuum_max_threshold','sk-SK').paragraphs[1].includes('-1 vypína maximálny prah'));
 assert(describe('autovacuum_vacuum_cost_delay','sk-SK').paragraphs[0].includes('milisekundách'));assert(describe('commit_delay','sk-SK').paragraphs[0].includes('mikrosekundách'));
 assert(describe('archive_command','sk-SK').paragraphs[1].includes('archive_library'));assert(describe('archive_library','sk-SK').paragraphs[1].includes('archive_command'));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert.equal(describe(key,'sk-SK').paragraphs[1],'0 vypína vynútený zápis na disk.');
 assert(describe('commit_timestamp_buffers','sk-SK').paragraphs[1].includes('0 znamená použiť časť shared_buffers'));assert(describe('checkpoint_warning','sk-SK').paragraphs[1].includes('0 vypína varovanie'));
 assert.deepEqual(describe('datestyle','sk-SK').paragraphs,describe('DateStyle','sk-SK').paragraphs);
});

test('Slovak planner and I/O help preserves estimates, durability and distinct zero semantics',()=>{
 const cache=describe('effective_cache_size','sk-SK').paragraphs.join(' ');assert(cache.includes('predpoklad plánovača')&&cache.includes('pamäte jadra')&&cache.includes('8 kB'));
 assert(describe('fsync','sk-SK').paragraphs[1].includes('fyzický zápis')&&describe('fsync','sk-SK').paragraphs[1].includes('konzistentného stavu'));
 const page=describe('full_page_writes','sk-SK').paragraphs.join(' ');assert(page.includes('prvej zmene po kontrolnom bode')&&page.includes('iba čiastočne')&&page.includes('zmeny riadkov')&&page.includes('nestačia'));
 for(const key of ['idle_in_transaction_session_timeout','idle_session_timeout','lock_timeout'])assert.equal(describe(key,'sk-SK').paragraphs[1],'0 vypína časový limit.');
 assert(describe('idle_in_transaction_session_timeout','sk-SK').paragraphs[0].includes('vnútri transakcie'));assert(describe('idle_session_timeout','sk-SK').paragraphs[0].includes('mimo transakcie'));
 assert.equal(describe('effective_io_concurrency','sk-SK').paragraphs[1],'0 vypína súbežné požiadavky.');assert.equal(describe('gin_fuzzy_search_limit','sk-SK').paragraphs[1],'0 znamená bez obmedzenia.');
 for(const key of ['geqo_generations','geqo_pool_size'])assert.equal(describe(key,'sk-SK').paragraphs[1],'0 znamená použiť vhodnú predvolenú hodnotu.');
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'sk-SK').paragraphs[1].startsWith('-1 vypína'));
 for(const key of ['lc_messages','lc_monetary','lc_numeric','lc_time'])assert.equal(describe(key,'sk-SK').paragraphs[1],'Prázdny reťazec znamená použiť nastavenie operačného systému.');
 assert(describe('enable_presorted_aggregate','sk-SK').paragraphs[1].includes('vždy vykonáva implicitné triedenie'));assert(describe('io_workers','sk-SK').paragraphs[0].includes('io_method=worker'));
});

test('Slovak logging and replication help retains sampling, rotation and WAL retention',()=>{
 assert(describe('log_min_duration_sample','sk-SK').paragraphs[0].includes('log_statement_sample_rate'));assert(describe('log_min_duration_sample','sk-SK').paragraphs[1].includes('zahrnúť do vzorkovania'));
 assert(describe('log_min_duration_statement','sk-SK').paragraphs[1].includes('protokolovať trvanie všetkých'));
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error'])assert.equal(describe(key,'sk-SK').paragraphs[1],'-1 znamená protokolovať celé hodnoty.');
 assert(describe('log_file_mode','sk-SK').paragraphs[1].includes('osmičkovom')&&describe('log_file_mode','sk-SK').paragraphs[1].includes('začínať nulou'));
 assert(describe('log_rotation_age','sk-SK').paragraphs[1].includes('podľa času'));assert(describe('log_rotation_size','sk-SK').paragraphs[1].includes('podľa veľkosti'));
 const slot=describe('max_slot_wal_keep_size','sk-SK').paragraphs[1];assert(slot.includes('zlyhané')&&slot.includes('odstránenie alebo recykláciu')&&slot.includes('-1 znamená bez maxima'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay'])assert.equal(describe(key,'sk-SK').paragraphs[1],'-1 znamená čakať neobmedzene.');
 assert(describe('logical_decoding_work_mem','sk-SK').paragraphs[1].includes('každý interný buffer'));
 assert(describe('output_plugin_libraries','sk-SK').paragraphs[1].includes('REPLICATION')&&describe('output_plugin_libraries','sk-SK').paragraphs[1].includes('iba moduly'));
 assert(describe('max_pred_locks_per_page','sk-SK').paragraphs[1].includes('zámkom celej stránky'));assert(describe('max_pred_locks_per_relation','sk-SK').paragraphs[1].includes('zámkom celej relácie'));
});

test('Slovak final help retains TLS defaults, synchronization ordering and maintenance limits',()=>{
 assert(describe('ssl_ciphers','sk-SK').paragraphs[0].includes('TLSv1.2'));assert(describe('ssl_tls13_ciphers','sk-SK').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_dh_params_file','sk-SK').paragraphs[1].includes('zabudované pri kompilácii'));assert(describe('ssl_passphrase_command','sk-SK').paragraphs[1].includes('výzvy na zadanie hesla'));
 const wait=describe('synchronized_standby_slots','sk-SK').paragraphs[1];assert(wait.includes('až po tom')&&wait.includes('potvrdia prijatie WAL'));
 assert(describe('transaction_timeout','sk-SK').paragraphs[0].includes('okrem pripravenej transakcie'));
 for(const key of ['statement_timeout','transaction_timeout','wal_receiver_timeout'])assert.equal(describe(key,'sk-SK').paragraphs[1],'0 vypína časový limit.');
 for(const key of ['tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert.equal(describe(key,'sk-SK').paragraphs[1],'0 znamená použiť predvolenú hodnotu systému.');
 assert(describe('subtransaction_buffers','sk-SK').paragraphs[1].includes('0 znamená použiť časť shared_buffers'));assert(describe('wal_buffers','sk-SK').paragraphs[1].includes('-1 znamená použiť časť shared_buffers'));
 assert(describe('wal_summary_keep_time','sk-SK').paragraphs[1].includes('vypína automatické odstraňovanie'));
 const eager=describe('vacuum_max_eager_freeze_failure_rate','sk-SK').paragraphs[1];assert(eager.includes('0.0 vypína')&&eager.includes('až 100 percent')&&eager.includes('nižší než 100 percent'));
 assert(describe('transform_null_equals','sk-SK').paragraphs[1].includes('Správne správanie')&&describe('transform_null_equals','sk-SK').paragraphs[1].includes('neznámu hodnotu'));
 assert.deepEqual(describe('timezone','sk-SK').paragraphs,describe('TimeZone','sk-SK').paragraphs);
});
