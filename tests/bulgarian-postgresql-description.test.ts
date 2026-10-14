import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Bulgarian settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.bg),...Object.keys(overrides.bg)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'bg_BG.UTF-8');assert(result.translated,key);assert.equal(result.language,'bg');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','bg-BG').paragraphs,describe('port','bg-BG').paragraphs);
 const unknown=describe('unknown.extension','bg-BG');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Допълнително описание на английски');assert.equal(unknown.unavailable,'Все още няма преведено описание за тази настройка.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'bg-BG').paragraphs,[]);
});

test('Bulgarian TLS and timeout help preserves protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','bg-BG').paragraphs[0].includes('TLSv1.2 и по-стари версии'));
 assert(describe('ssl_tls13_ciphers','bg-BG').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','bg-BG').paragraphs[1].includes('Празен низ'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'bg-BG').paragraphs[1].includes('0 използва системната стандартна стойност'),key);
 assert(describe('transaction_timeout','bg-BG').paragraphs[0].includes('подготвените транзакции не се включват'));
 assert(describe('transaction_timeout','bg-BG').paragraphs[1].includes('0 изключва времевото ограничение'));
 assert(describe('wal_summary_keep_time','bg-BG').paragraphs[1].includes('0 изключва автоматичното изтриване'));
 assert(describe('wal_buffers','bg-BG').paragraphs[1].includes('-1 означава използване на част от shared_buffers'));
 assert(describe('synchronized_standby_slots','bg-BG').paragraphs[1].includes('потвърдят получаването на WAL'));
});

test('Bulgarian logs and replication help distinguishes full parameter values, disabled logs and unlimited waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){const text=describe(key,'bg-BG').paragraphs.join(' ');assert(text.includes('в байтове')&&text.includes('-1')&&text.includes('записване на пълните стойности'),key);}
 const temp=describe('log_temp_files','bg-BG').paragraphs.join(' ');assert(temp.includes('килобайтове')&&temp.includes('-1 изключва')&&temp.includes('0 записва всички'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'bg-BG').paragraphs.join(' ');assert(text.includes('отмяна на заявки')&&text.includes('-1 означава неограничено изчакване'),key);}
 assert(describe('max_pred_locks_per_page','bg-BG').paragraphs[1].includes('заключване на ниво страница'));
 assert(describe('max_pred_locks_per_relation','bg-BG').paragraphs[1].includes('заключване на ниво релация'));
 assert(describe('max_slot_wal_keep_size','bg-BG').paragraphs[1].includes('репликационните слотове се маркират като неуспешни'));
});

test('Bulgarian planner and durability help retains cache assumptions, partial-page recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','bg-BG').paragraphs.join(' ');assert(cache.includes('предположението на планировчика')&&cache.includes('8 kB')&&cache.includes('споделените буфери'));
 const sync=describe('fsync','bg-BG').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('физическо записване')&&sync.includes('съгласувано състояние'));
 const pages=describe('full_page_writes','bg-BG').paragraphs.join(' ');assert(pages.includes('само частично на диска')&&pages.includes('не са достатъчни')&&pages.includes('първата промяна след контролна точка'));
 assert(describe('idle_in_transaction_session_timeout','bg-BG').paragraphs[0].includes('вътре в транзакция'));
 assert(describe('idle_session_timeout','bg-BG').paragraphs[0].includes('извън транзакция'));
 assert(describe('io_workers','bg-BG').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'bg-BG').paragraphs[1].startsWith('-1 изключва'),key);
});

test('Bulgarian maintenance help distinguishes inherited defaults, disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'bg-BG').paragraphs.join(' ');assert(text.includes('-1 означава използване на')&&text.includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','bg-BG').paragraphs[1].includes('-1 изключва VACUUM, задействан от вмъквания'));
 assert(describe('autovacuum_vacuum_max_threshold','bg-BG').paragraphs[1].includes('-1 изключва максималния праг'));
 assert(describe('autovacuum_vacuum_cost_delay','bg-BG').paragraphs[0].includes('милисекунди'));
 assert(describe('commit_delay','bg-BG').paragraphs[0].includes('микросекунди'));
 assert(describe('archive_command','bg-BG').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','bg-BG').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','bg-BG').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'bg-BG').paragraphs[1].includes('0 изключва принудителното записване на диска'),key);
});

test('Bulgarian connection help preserves first-match failure, transport and operating-system identity',()=>{
 assert.equal(Object.keys(hbaCatalog.bg).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'bg_BG.UTF-8');assert(result.translated,key);assert.equal(result.language,'bg');assert.notEqual(result.text,english);}
 const method=hba('method','bg-BG').text;assert(method.includes('Първото съвпадащо правило')&&method.includes('следващите правила не се изпробват'));
 const password=hba('password','bg-BG').text;assert(password.includes('без шифроване')&&password.includes('необходим е TLS'));
 assert(hba('sspi','bg-BG').text.includes('не е налично под Linux'));
 assert(hba('ident','bg-BG').text.includes('local използва peer'));
 assert(hba('peer','bg-BG').text.includes('предоставено от операционната система'));
});

test('Bulgarian setting help retains policy failure, unfrozen pages, include ordering and per-operation memory',()=>{
 const row=describe('row_security','bg-BG').paragraphs[0];assert(row.includes('off')&&row.includes('завършват с грешка')&&row.includes('не дава неограничен достъп')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','bg-BG').paragraphs[0].includes('незамразените страници'));
 const include=describe('include_dir','bg-BG').paragraphs[0];assert(include.includes('нескритите')&&include.includes('.conf')&&include.includes('локала C'));
 assert(describe('include_if_exists','bg-BG').paragraphs[0].includes('други грешки при четене се съобщават'));
 const memory=describe('work_mem','bg-BG').paragraphs[1];assert(memory.includes('Всяка вътрешна операция')&&memory.includes('временни файлове на диска'));
});
