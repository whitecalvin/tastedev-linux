import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Greek settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.el),...Object.keys(overrides.el)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'el_GR.UTF-8');assert(result.translated,key);assert.equal(result.language,'el');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','el-GR').paragraphs,describe('port','el-GR').paragraphs);
 const unknown=describe('unknown.extension','el-GR');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Συμπληρωματική περιγραφή στα αγγλικά');assert.equal(unknown.unavailable,'Δεν υπάρχει ακόμη μεταφρασμένη περιγραφή για αυτή τη ρύθμιση.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'el-GR').paragraphs,[]);
});

test('Greek TLS and timeout help preserves protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','el-GR').paragraphs[0].includes('TLSv1.2 και παλαιότερες εκδόσεις'));
 assert(describe('ssl_tls13_ciphers','el-GR').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','el-GR').paragraphs[1].includes('κενή συμβολοσειρά'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'el-GR').paragraphs[1].includes('Το 0 χρησιμοποιεί την προεπιλογή του συστήματος'),key);
 assert(describe('transaction_timeout','el-GR').paragraphs[0].includes('δεν περιλαμβάνει προετοιμασμένες συναλλαγές'));
 assert(describe('transaction_timeout','el-GR').paragraphs[1].includes('Το 0 απενεργοποιεί το χρονικό όριο'));
 assert(describe('wal_summary_keep_time','el-GR').paragraphs[1].includes('Το 0 απενεργοποιεί την αυτόματη διαγραφή'));
 assert(describe('wal_buffers','el-GR').paragraphs[1].includes('Το -1 σημαίνει χρήση μέρους του shared_buffers'));
 assert(describe('synchronized_standby_slots','el-GR').paragraphs[1].includes('επιβεβαιώσουν τη λήψη WAL'));
});

test('Greek logs and replication help distinguishes full parameter values, disabled logs and unlimited waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){const text=describe(key,'el-GR').paragraphs.join(' ');assert(text.includes('σε byte')&&text.includes('Το -1')&&text.includes('καταγραφή ολόκληρων των τιμών'),key);}
 const temp=describe('log_temp_files','el-GR').paragraphs.join(' ');assert(temp.includes('kilobyte')&&temp.includes('Το -1 απενεργοποιεί')&&temp.includes('Το 0 καταγράφει όλα'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'el-GR').paragraphs.join(' ');assert(text.includes('ακύρωση ερωτημάτων')&&text.includes('Το -1 σημαίνει απεριόριστη αναμονή'),key);}
 assert(describe('max_pred_locks_per_page','el-GR').paragraphs[1].includes('κλείδωμα σε επίπεδο σελίδας'));
 assert(describe('max_pred_locks_per_relation','el-GR').paragraphs[1].includes('κλείδωμα σε επίπεδο σχέσης'));
 assert(describe('max_slot_wal_keep_size','el-GR').paragraphs[1].includes('θέσεις αναπαραγωγής σημειώνονται ως αποτυχημένες'));
});

test('Greek planner and durability help retains cache assumptions, partial-page recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','el-GR').paragraphs.join(' ');assert(cache.includes('παραδοχή του σχεδιαστή')&&cache.includes('8 kB')&&cache.includes('κοινόχρηστων ενδιάμεσων περιοχών'));
 const sync=describe('fsync','el-GR').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('γράφονται φυσικά στον δίσκο')&&sync.includes('συνεπή κατάσταση'));
 const pages=describe('full_page_writes','el-GR').paragraphs.join(' ');assert(pages.includes('εν μέρει στον δίσκο')&&pages.includes('δεν επαρκούν')&&pages.includes('πρώτη τροποποίηση μετά από σημείο ελέγχου'));
 assert(describe('idle_in_transaction_session_timeout','el-GR').paragraphs[0].includes('εντός συναλλαγής'));
 assert(describe('idle_session_timeout','el-GR').paragraphs[0].includes('εκτός συναλλαγής'));
 assert(describe('io_workers','el-GR').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'el-GR').paragraphs[1].startsWith('Το -1 απενεργοποιεί'),key);
});

test('Greek maintenance help distinguishes inherited defaults, disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'el-GR').paragraphs.join(' ');assert(text.includes('Το -1 σημαίνει χρήση του')&&text.includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','el-GR').paragraphs[1].includes('Το -1 απενεργοποιεί το VACUUM που ενεργοποιείται από εισαγωγές'));
 assert(describe('autovacuum_vacuum_max_threshold','el-GR').paragraphs[1].includes('Το -1 απενεργοποιεί το μέγιστο όριο'));
 assert(describe('autovacuum_vacuum_cost_delay','el-GR').paragraphs[0].includes('χιλιοστά του δευτερολέπτου'));
 assert(describe('commit_delay','el-GR').paragraphs[0].includes('μικροδευτερόλεπτα'));
 assert(describe('archive_command','el-GR').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','el-GR').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','el-GR').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'el-GR').paragraphs[1].includes('Το 0 απενεργοποιεί την αναγκαστική εγγραφή στον δίσκο'),key);
});

test('Greek connection help preserves first-match failure, transport and operating-system identity',()=>{
 assert.equal(Object.keys(hbaCatalog.el).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'el_GR.UTF-8');assert(result.translated,key);assert.equal(result.language,'el');assert.notEqual(result.text,english);}
 const method=hba('method','el-GR').text;assert(method.includes('πρώτος κανόνας')&&method.includes('δεν δοκιμάζονται επόμενοι κανόνες'));
 const password=hba('password','el-GR').text;assert(password.includes('χωρίς κρυπτογράφηση')&&password.includes('απαιτείται TLS'));
 assert(hba('sspi','el-GR').text.includes('δεν είναι διαθέσιμος στο Linux'));
 assert(hba('ident','el-GR').text.includes('local χρησιμοποιεί peer'));
 assert(hba('peer','el-GR').text.includes('παρέχει το λειτουργικό σύστημα'));
});

test('Greek setting help retains policy failure, unfrozen pages, include ordering and per-operation memory',()=>{
 const row=describe('row_security','el-GR').paragraphs[0];assert(row.includes('off')&&row.includes('αποτυγχάνουν')&&row.includes('δεν παρέχει απεριόριστη πρόσβαση')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','el-GR').paragraphs[0].includes('μη παγωμένων σελίδων'));
 const include=describe('include_dir','el-GR').paragraphs[0];assert(include.includes('μη κρυφά')&&include.includes('.conf')&&include.includes('τοπικής ρύθμισης C'));
 assert(describe('include_if_exists','el-GR').paragraphs[0].includes('άλλα σφάλματα ανάγνωσης αναφέρονται'));
 const memory=describe('work_mem','el-GR').paragraphs[1];assert(memory.includes('Κάθε εσωτερική λειτουργία ταξινόμησης')&&memory.includes('προσωρινά αρχεία στον δίσκο'));
});
