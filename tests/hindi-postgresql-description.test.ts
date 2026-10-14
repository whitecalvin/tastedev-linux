import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Hindi HBA help covers all methods and preserves first-match and identity semantics',()=>{
 assert.deepEqual(Object.keys(hbaCatalog.hi).sort(),Object.keys(hbaCatalog.en).sort());
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'hi_IN.UTF-8');assert(result.translated,key);assert.equal(result.language,'hi');assert.notEqual(result.text,english);}
 assert(hba('method','hi-IN').text.includes('बाद के नियम नहीं आज़माए'));
 assert(hba('password','hi-IN').text.includes('बिना एन्क्रिप्शन')&&hba('password','hi-IN').text.includes('TLS आवश्यक'));
 assert(hba('sspi','hi-IN').text.includes('Linux पर उपलब्ध नहीं'));
 assert(hba('ident','hi-IN').text.includes('local इसके बजाय peer'));
 assert(hba('peer','hi-IN').text.includes('ऑपरेटिंग सिस्टम द्वारा'));
});

test('Hindi initial setting help retains include paths, row policy failures and truthful fallback',()=>{
 const keys=new Set([...Object.keys(descriptions.hi),...Object.keys(overrides.hi)]);assert.equal(keys.size,351);
 for(const key of keys){const result=describe(key,'hi_IN.UTF-8');assert(result.translated,key);assert.equal(result.language,'hi');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert(describe('include_dir','hi-IN').paragraphs[0].includes('गैर-छिपी .conf')&&describe('include_dir','hi-IN').paragraphs[0].includes('C लोकेल'));
 assert(describe('include_if_exists','hi-IN').paragraphs[0].includes('अन्य त्रुटियाँ फिर भी'));
 const policy=describe('row_security','hi-IN').paragraphs[0];assert(policy.includes('वे विफल होती')&&policy.includes('असीमित पहुँच नहीं')&&policy.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','hi-IN').paragraphs[0].includes('अनफ़्रोज़न पृष्ठों'));
 const untranslated=describe('work_mem','is-IS');assert.equal(untranslated.translated,false);assert.equal(untranslated.language,'en');assert.equal(describe('work_mem','hi-IN').fallbackLabel,'अंग्रेज़ी में अतिरिक्त विवरण');
 assert.equal(describe('unknown.extension','hi-IN').unavailable,'इस सेटिंग का अनुवादित विवरण अभी उपलब्ध नहीं है।');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'hi-IN').paragraphs,[]);
});

test('Hindi WAL and array help keeps alternative archiving mechanisms and zero timeout',()=>{
 assert(describe('archive_command','hi-IN').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','hi-IN').paragraphs[1].includes('archive_command'));
 assert.equal(describe('archive_timeout','hi-IN').paragraphs[1],'0 टाइमआउट अक्षम करता है।');
 assert(describe('array_nulls','hi-IN').paragraphs[1].includes('बिना उद्धरण चिह्न')&&describe('array_nulls','hi-IN').paragraphs[1].includes('अक्षरशः'));
});

test('Hindi maintenance help distinguishes inherited defaults, disabling values and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const paragraphs=describe(key,'hi-IN').paragraphs;assert(paragraphs[1].includes('-1 का अर्थ')&&paragraphs[1].includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','hi-IN').paragraphs[1].includes('इन्सर्ट से सक्रिय'));
 assert(describe('autovacuum_vacuum_max_threshold','hi-IN').paragraphs[1].includes('अधिकतम सीमा अक्षम'));
 assert(describe('autovacuum_vacuum_cost_delay','hi-IN').paragraphs[0].includes('मिलीसेकंड'));assert(describe('commit_delay','hi-IN').paragraphs[0].includes('माइक्रोसेकंड'));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert.equal(describe(key,'hi-IN').paragraphs[1],'0 बाध्य राइटबैक अक्षम करता है।');
 assert(describe('commit_timestamp_buffers','hi-IN').paragraphs[1].includes('shared_buffers'));assert(describe('checkpoint_warning','hi-IN').paragraphs[1].includes('0 चेतावनी अक्षम'));
});

test('Hindi planner and defaults help preserves estimates, alias lookup and search conditions',()=>{
 const cache=describe('effective_cache_size','hi-IN').paragraphs.join(' ');assert(cache.includes('प्लानर की धारणा')&&cache.includes('कर्नेल कैश')&&cache.includes('8 kB'));
 assert.equal(describe('effective_io_concurrency','hi-IN').paragraphs[1],'0 समवर्ती अनुरोध अक्षम करता है।');
 assert.deepEqual(describe('datestyle','hi-IN').paragraphs,describe('DateStyle','hi-IN').paragraphs);
 assert(describe('default_statistics_target','hi-IN').paragraphs[1].includes('ALTER TABLE SET STATISTICS'));
 assert(describe('dynamic_library_path','hi-IN').paragraphs[1].includes('स्लैश नहीं'));
 assert(describe('createrole_self_grant','hi-IN').paragraphs[1].includes('खाली स्ट्रिंग'));
 for(const key of ['cpu_operator_cost','cpu_tuple_cost','cursor_tuple_fraction'])assert(describe(key,'hi-IN').paragraphs[0].includes('प्लानर अनुमान'),key);
});

test('Hindi durability, idle sessions and planner zero values remain distinct',()=>{
 assert(describe('fsync','hi-IN').paragraphs[1].includes('भौतिक रूप से डिस्क')&&describe('fsync','hi-IN').paragraphs[1].includes('सुसंगत स्थिति'));
 const pages=describe('full_page_writes','hi-IN').paragraphs.join(' ');assert(pages.includes('पहली बार')&&pages.includes('आंशिक रूप से')&&pages.includes('पंक्ति बदलाव पर्याप्त नहीं'));
 assert(describe('idle_in_transaction_session_timeout','hi-IN').paragraphs[0].includes('ट्रांज़ैक्शन के भीतर'));assert(describe('idle_session_timeout','hi-IN').paragraphs[0].includes('ट्रांज़ैक्शन के बाहर'));
 assert.equal(describe('gin_fuzzy_search_limit','hi-IN').paragraphs[1],'0 का अर्थ कोई सीमा नहीं है।');
 for(const key of ['geqo_generations','geqo_pool_size'])assert.equal(describe(key,'hi-IN').paragraphs[1],'0 का अर्थ उपयुक्त डिफ़ॉल्ट मान इस्तेमाल करना है।');
 assert(describe('enable_presorted_aggregate','hi-IN').paragraphs[1].includes('सॉर्ट हमेशा'));assert(describe('io_workers','hi-IN').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost'])assert(describe(key,'hi-IN').paragraphs[1].startsWith('-1'));
});

test('Hindi logging help preserves sampling, length bytes and rotation boundaries',()=>{
 assert(describe('log_min_duration_sample','hi-IN').paragraphs[0].includes('log_statement_sample_rate'));assert(describe('log_min_duration_sample','hi-IN').paragraphs[1].includes('सैंपलिंग में शामिल'));
 assert(describe('log_min_duration_statement','hi-IN').paragraphs[1].includes('सभी स्टेटमेंट की अवधि'));
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){assert(describe(key,'hi-IN').paragraphs[0].includes('बाइट'));assert.equal(describe(key,'hi-IN').paragraphs[1],'-1 का अर्थ पूरे मान लॉग करना है।');}
 assert(describe('log_file_mode','hi-IN').paragraphs[1].includes('अष्टाधारी')&&describe('log_file_mode','hi-IN').paragraphs[1].includes('0 (शून्य)'));
 assert(describe('log_rotation_age','hi-IN').paragraphs[1].includes('समय के आधार'));assert(describe('log_rotation_size','hi-IN').paragraphs[1].includes('आकार के आधार'));
 for(const key of ['lc_messages','lc_monetary','lc_numeric','lc_time'])assert.equal(describe(key,'hi-IN').paragraphs[1],'खाली स्ट्रिंग का अर्थ ऑपरेटिंग सिस्टम की सेटिंग इस्तेमाल करना है।');
 assert(describe('logical_decoding_work_mem','hi-IN').paragraphs[1].includes('हर आंतरिक reorder बफ़र'));
});

test('Hindi replication and parallel limits preserve failure and per-operation scope',()=>{
 const slot=describe('max_slot_wal_keep_size','hi-IN').paragraphs[1];assert(slot.includes('विफल चिह्नित')&&slot.includes('हटाने या पुनः इस्तेमाल')&&slot.includes('-1 का अर्थ कोई अधिकतम सीमा नहीं'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay'])assert.equal(describe(key,'hi-IN').paragraphs[1],'-1 का अर्थ अनिश्चित काल तक प्रतीक्षा करना है।');
 assert(describe('max_parallel_maintenance_workers','hi-IN').paragraphs[0].includes('प्रति रखरखाव कार्य'));assert(describe('max_parallel_workers_per_gather','hi-IN').paragraphs[0].includes('प्रति निष्पादक नोड'));
 assert(describe('max_pred_locks_per_page','hi-IN').paragraphs[1].includes('पृष्ठ-स्तरीय लॉक'));assert(describe('max_pred_locks_per_relation','hi-IN').paragraphs[1].includes('रिलेशन-स्तरीय लॉक'));
 const plugins=describe('output_plugin_libraries','hi-IN').paragraphs[1];assert(plugins.includes('REPLICATION')&&plugins.includes('केवल इस सूची'));
 assert(describe('recovery_target','hi-IN').paragraphs[0].includes('immediate'));
});

test('Hindi TLS and recovery help keeps protocol scope, key identity and acknowledgement order',()=>{
 assert(describe('ssl_ciphers','hi-IN').paragraphs[0].includes('TLSv1.2'));assert(describe('ssl_tls13_ciphers','hi-IN').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_key_file','hi-IN').paragraphs[0].includes('निजी कुंजी'));assert(describe('ssl_ca_file','hi-IN').paragraphs[0].includes('प्रमाणपत्र प्राधिकरण'));
 assert(describe('ssl_dh_params_file','hi-IN').paragraphs[1].includes('संकलन में शामिल'));assert(describe('ssl_passphrase_command','hi-IN').paragraphs[1].includes('पासफ़्रेज़ पूछने'));
 const wait=describe('synchronized_standby_slots','hi-IN').paragraphs[1];assert(wait.includes('प्राप्त होने की पुष्टि के बाद ही')&&wait.includes('आउटपुट प्लगइन'));
 for(const key of ['tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert.equal(describe(key,'hi-IN').paragraphs[1],'0 का अर्थ सिस्टम का डिफ़ॉल्ट इस्तेमाल करना है।');
 assert(describe('subtransaction_buffers','hi-IN').paragraphs[1].includes('shared_buffers'));assert(describe('temp_buffers','hi-IN').paragraphs[0].includes('हर सत्र'));
});

test('Hindi completed help preserves per-operation memory, prepared exclusions and cleanup semantics',()=>{
 const expected=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);const actual=new Set([...Object.keys(descriptions.hi),...Object.keys(overrides.hi)]);assert.deepEqual([...actual].sort(),[...expected].sort());
 const memory=describe('work_mem','hi-IN').paragraphs[1];assert(memory.includes('हर आंतरिक सॉर्ट कार्रवाई और हैश टेबल')&&memory.includes('अस्थायी डिस्क फ़ाइलों'));
 assert(describe('transaction_timeout','hi-IN').paragraphs[0].includes('तैयार ट्रांज़ैक्शन को छोड़कर'));
 assert(describe('wal_summary_keep_time','hi-IN').paragraphs[1].includes('स्वचालित हटाना अक्षम'));
 const eager=describe('vacuum_max_eager_freeze_failure_rate','hi-IN').paragraphs[1];assert(eager.includes('0.0')&&eager.includes('अधिकतम 100 प्रतिशत')&&eager.includes('100 प्रतिशत से कम'));
 assert(describe('transform_null_equals','hi-IN').paragraphs[1].includes('सही व्यवहार हमेशा null (अज्ञात)'));
 assert.deepEqual(describe('timezone','hi-IN').paragraphs,describe('TimeZone','hi-IN').paragraphs);
 assert.equal(describe('temp_file_limit','hi-IN').paragraphs[1],'-1 का अर्थ कोई सीमा नहीं है।');
});
