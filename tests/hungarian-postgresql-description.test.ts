import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Hungarian settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.hu),...Object.keys(overrides.hu)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'hu_HU.UTF-8');assert(result.translated,key);assert.equal(result.language,'hu');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','hu-HU').paragraphs,describe('port','hu-HU').paragraphs);
 const unknown=describe('unknown.extension','hu-HU');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Kiegészítő angol leírás');assert.equal(unknown.unavailable,'Ehhez a beállításhoz még nem érhető el lefordított leírás.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'hu-HU').paragraphs,[]);
});

test('Hungarian TLS and timeout help preserves protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','hu-HU').paragraphs[0].includes('TLSv1.2 és korábbi verziók'));
 assert(describe('ssl_tls13_ciphers','hu-HU').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','hu-HU').paragraphs[1].includes('üres karakterlánc'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'hu-HU').paragraphs[1].includes('A 0 a rendszer alapértelmezett értékét használja'),key);
 assert(describe('transaction_timeout','hu-HU').paragraphs[0].includes('előkészített tranzakciókra nem vonatkozik'));
 assert(describe('transaction_timeout','hu-HU').paragraphs[1].includes('A 0 kikapcsolja az időkorlátot'));
 assert(describe('wal_summary_keep_time','hu-HU').paragraphs[1].includes('automatikus törlését'));
 assert(describe('wal_buffers','hu-HU').paragraphs[1].includes('A -1 a shared_buffers egy részének használatát jelenti'));
 assert(describe('synchronized_standby_slots','hu-HU').paragraphs[1].includes('visszaigazolták a WAL fogadását'));
});

test('Hungarian logs and replication help distinguishes full parameter values, disabled logs and unlimited waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){const text=describe(key,'hu-HU').paragraphs.join(' ');assert(text.includes('bájtban')&&text.includes('A -1')&&text.includes('teljes értékek naplózását'),key);}
 const temp=describe('log_temp_files','hu-HU').paragraphs.join(' ');assert(temp.includes('kilobájtos')&&temp.includes('A -1 kikapcsolja')&&temp.includes('A 0 minden'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'hu-HU').paragraphs.join(' ');assert(text.includes('lekérdezések megszakítása')&&text.includes('A -1 korlátlan várakozást jelent'),key);}
 assert(describe('max_pred_locks_per_page','hu-HU').paragraphs[1].includes('lapszintű zárolás'));
 assert(describe('max_pred_locks_per_relation','hu-HU').paragraphs[1].includes('relációszintű zárolás'));
 assert(describe('max_slot_wal_keep_size','hu-HU').paragraphs[1].includes('replikációs helyeket hibásnak jelöli'));
});

test('Hungarian planner and durability help retains cache assumptions, crash recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','hu-HU').paragraphs.join(' ');assert(cache.includes('tervező feltételezését')&&cache.includes('8 kB')&&cache.includes('megosztott puffereket'));
 const sync=describe('fsync','hu-HU').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('fizikailag lemezre')&&sync.includes('konzisztens állapotba'));
 const pages=describe('full_page_writes','hu-HU').paragraphs.join(' ');assert(pages.includes('csak részben kerülhet lemezre')&&pages.includes('nem elegendők')&&pages.includes('ellenőrzőpont utáni első módosításkor'));
 assert(describe('idle_in_transaction_session_timeout','hu-HU').paragraphs[0].includes('tranzakción belül'));
 assert(describe('idle_session_timeout','hu-HU').paragraphs[0].includes('tranzakción kívül'));
 assert(describe('io_workers','hu-HU').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'hu-HU').paragraphs[1].startsWith('A -1 kikapcsolja'),key);
});

test('Hungarian maintenance help distinguishes inherited defaults, disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'hu-HU').paragraphs.join(' ');assert(text.includes('A -1')&&text.includes(reference)&&text.includes('használatát jelenti'),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','hu-HU').paragraphs[1].includes('kikapcsolja a beszúrások által kiváltott VACUUM-ot'));
 assert(describe('autovacuum_vacuum_max_threshold','hu-HU').paragraphs[1].includes('kikapcsolja a maximális küszöböt'));
 assert(describe('autovacuum_vacuum_cost_delay','hu-HU').paragraphs[0].includes('ezredmásodpercben'));
 assert(describe('commit_delay','hu-HU').paragraphs[0].includes('mikromásodpercben'));
 assert(describe('archive_command','hu-HU').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','hu-HU').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','hu-HU').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'hu-HU').paragraphs[1].includes('A 0 kikapcsolja a kényszerített visszaírást'),key);
});

test('Hungarian connection help preserves first-match failure, transport and operating-system identity',()=>{
 assert.equal(Object.keys(hbaCatalog.hu).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'hu_HU.UTF-8');assert(result.translated,key);assert.equal(result.language,'hu');assert.notEqual(result.text,english);}
 const method=hba('method','hu-HU').text;assert(method.includes('első illeszkedő szabály')&&method.includes('későbbi szabályokat nem próbálja meg'));
 const password=hba('password','hu-HU').text;assert(password.includes('Titkosítás nélkül')&&password.includes('TLS szükséges'));
 assert(hba('sspi','hu-HU').text.includes('Linuxon nem érhető el'));
 assert(hba('ident','hu-HU').text.includes('local helyette peer'));
 assert(hba('peer','hu-HU').text.includes('operációs rendszer által megadott'));
});

test('Hungarian settings retain policy failure, unfrozen pages, include order and per-operation memory',()=>{
 const row=describe('row_security','hu-HU').paragraphs[0];assert(row.includes('off')&&row.includes('hibával leállnak')&&row.includes('nem ad korlátlan hozzáférést')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','hu-HU').paragraphs[0].includes('nem fagyasztott táblalapok'));
 const include=describe('include_dir','hu-HU').paragraphs[0];assert(include.includes('nem rejtett')&&include.includes('.conf')&&include.includes('C területi beállítás'));
 assert(describe('include_if_exists','hu-HU').paragraphs[0].includes('egyéb olvasási hibákat jelzi'));
 const memory=describe('work_mem','hu-HU').paragraphs[1];assert(memory.includes('Minden belső rendezési művelet')&&memory.includes('ideiglenes lemezfájlokra'));
});
