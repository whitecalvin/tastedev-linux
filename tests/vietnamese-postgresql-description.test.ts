import test from 'node:test';
import assert from 'node:assert/strict';
import descriptions from '../lib/locales/postgresql-descriptions.json' with {type:'json'};
import overrides from '../lib/locales/postgresql-description-overrides.json' with {type:'json'};
import hbaCatalog from '../lib/locales/postgresql-hba-descriptions.json' with {type:'json'};
import {postgresqlSettingDescription as describe} from '../lib/postgresql-setting-description.ts';
import {postgresqlHbaDescription as hba} from '../lib/postgresql-hba-description.ts';

test('Vietnamese settings cover canonical keys and resolve regional locales',()=>{
 const keys=new Set([...Object.keys(descriptions.vi),...Object.keys(overrides.vi)]);
 const canonical=new Set([...Object.keys(descriptions.en),...Object.keys(overrides.en)]);assert.equal(keys.size,351);assert.deepEqual(keys,canonical);
 for(const key of keys){const result=describe(key,'vi_VN.UTF-8');assert(result.translated,key);assert.equal(result.language,'vi');assert.notDeepEqual(result.paragraphs,describe(key,'en').paragraphs);}
 assert.deepEqual(describe('PORT','vi-VN').paragraphs,describe('port','vi-VN').paragraphs);
 const unknown=describe('unknown.extension','vi-VN');assert.deepEqual(unknown.paragraphs,[]);assert.equal(unknown.translated,false);assert.equal(unknown.fallbackLabel,'Mô tả bổ sung bằng tiếng Anh');assert.equal(unknown.unavailable,'Chưa có bản dịch mô tả cho thiết lập này.');
 for(const key of ['__proto__','constructor'])assert.deepEqual(describe(key,'vi-VN').paragraphs,[]);
});

test('Vietnamese TLS and timeout help preserves protocol ranges, prepared transactions and WAL retention',()=>{
 assert(describe('ssl_ciphers','vi-VN').paragraphs[0].includes('TLSv1.2 và các phiên bản trước'));
 assert(describe('ssl_tls13_ciphers','vi-VN').paragraphs[0].includes('TLSv1.3'));
 assert(describe('ssl_tls13_ciphers','vi-VN').paragraphs[1].includes('Chuỗi rỗng'));
 for(const key of ['tcp_keepalives_count','tcp_keepalives_idle','tcp_keepalives_interval','tcp_user_timeout'])assert(describe(key,'vi-VN').paragraphs[1].includes('0 có nghĩa là dùng giá trị mặc định của hệ thống'),key);
 assert(describe('transaction_timeout','vi-VN').paragraphs[0].includes('không bao gồm giao dịch đã chuẩn bị'));
 assert(describe('transaction_timeout','vi-VN').paragraphs[1].includes('0 vô hiệu hóa giới hạn thời gian'));
 assert(describe('wal_summary_keep_time','vi-VN').paragraphs[1].includes('0 vô hiệu hóa tự động xóa'));
 assert(describe('wal_buffers','vi-VN').paragraphs[1].includes('-1 có nghĩa là dùng một phần của shared_buffers'));
 assert(describe('synchronized_standby_slots','vi-VN').paragraphs[1].includes('đã xác nhận nhận WAL'));
});

test('Vietnamese logs and replication help distinguishes full values, disabled logs and unlimited standby waits',()=>{
 for(const key of ['log_parameter_max_length','log_parameter_max_length_on_error']){const text=describe(key,'vi-VN').paragraphs.join(' ');assert(text.includes('tính bằng byte')&&text.includes('-1')&&text.includes('ghi toàn bộ giá trị'),key);}
 const temp=describe('log_temp_files','vi-VN').paragraphs.join(' ');assert(temp.includes('kilobyte')&&temp.includes('-1 vô hiệu hóa')&&temp.includes('0 ghi mọi'));
 for(const key of ['max_standby_archive_delay','max_standby_streaming_delay']){const text=describe(key,'vi-VN').paragraphs.join(' ');assert(text.includes('hủy truy vấn')&&text.includes('-1 có nghĩa là chờ không giới hạn'),key);}
 assert(describe('max_pred_locks_per_page','vi-VN').paragraphs[1].includes('khóa mức trang'));
 assert(describe('max_pred_locks_per_relation','vi-VN').paragraphs[1].includes('khóa mức quan hệ'));
 assert(describe('max_slot_wal_keep_size','vi-VN').paragraphs[1].includes('các khe sao chép được đánh dấu thất bại'));
});

test('Vietnamese planner and durability help retains cache assumptions, partial-page recovery and transaction boundaries',()=>{
 const cache=describe('effective_cache_size','vi-VN').paragraphs.join(' ');assert(cache.includes('giả định của bộ lập kế hoạch')&&cache.includes('8 kB')&&cache.includes('bộ đệm dùng chung'));
 const sync=describe('fsync','vi-VN').paragraphs.join(' ');assert(sync.includes('fsync()')&&sync.includes('ghi vật lý xuống đĩa')&&sync.includes('trạng thái nhất quán'));
 const pages=describe('full_page_writes','vi-VN').paragraphs.join(' ');assert(pages.includes('một phần xuống đĩa')&&pages.includes('không đủ')&&pages.includes('lần thay đổi đầu tiên sau điểm kiểm tra'));
 assert(describe('idle_in_transaction_session_timeout','vi-VN').paragraphs[0].includes('khi đang trong giao dịch'));
 assert(describe('idle_session_timeout','vi-VN').paragraphs[0].includes('khi không ở trong giao dịch'));
 assert(describe('io_workers','vi-VN').paragraphs[0].includes('io_method=worker'));
 for(const key of ['jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost'])assert(describe(key,'vi-VN').paragraphs[1].startsWith('-1 vô hiệu hóa'),key);
});

test('Vietnamese maintenance help distinguishes inherited defaults, disabled thresholds and time units',()=>{
 for(const [key,reference] of [['autovacuum_vacuum_cost_delay','vacuum_cost_delay'],['autovacuum_vacuum_cost_limit','vacuum_cost_limit'],['autovacuum_work_mem','maintenance_work_mem']]){const text=describe(key,'vi-VN').paragraphs.join(' ');assert(text.includes('-1 có nghĩa là dùng')&&text.includes(reference),key);}
 assert(describe('autovacuum_vacuum_insert_threshold','vi-VN').paragraphs[1].includes('-1 vô hiệu hóa VACUUM do thao tác chèn kích hoạt'));
 assert(describe('autovacuum_vacuum_max_threshold','vi-VN').paragraphs[1].includes('-1 vô hiệu hóa ngưỡng tối đa'));
 assert(describe('autovacuum_vacuum_cost_delay','vi-VN').paragraphs[0].includes('mili giây'));
 assert(describe('commit_delay','vi-VN').paragraphs[0].includes('micro giây'));
 assert(describe('archive_command','vi-VN').paragraphs[1].includes('archive_library'));
 assert(describe('archive_library','vi-VN').paragraphs[1].includes('archive_command'));
 assert(describe('backslash_quote','vi-VN').paragraphs[0].includes("\\'"));
 for(const key of ['backend_flush_after','bgwriter_flush_after','checkpoint_flush_after'])assert(describe(key,'vi-VN').paragraphs[1].includes('0 vô hiệu hóa việc buộc ghi xuống đĩa'),key);
});

test('Vietnamese connection help preserves first-match failure, TLS and operating-system identity rules',()=>{
 assert.equal(Object.keys(hbaCatalog.vi).length,27);
 for(const [key,english] of Object.entries(hbaCatalog.en)){const result=hba(key,'vi_VN.UTF-8');assert(result.translated,key);assert.equal(result.language,'vi');assert.notEqual(result.text,english);}
 const method=hba('method','vi-VN').text;assert(method.includes('khớp đầu tiên')&&method.includes('các quy tắc sau không được thử'));
 const password=hba('password','vi-VN').text;assert(password.includes('không mã hóa')&&password.includes('cần TLS'));
 assert(hba('sspi','vi-VN').text.includes('không khả dụng trên Linux'));
 assert(hba('ident','vi-VN').text.includes('local dùng peer thay thế'));
 assert(hba('peer','vi-VN').text.includes('hệ điều hành cung cấp'));
});

test('Vietnamese common settings retain row-policy failure, unfrozen pages, include ordering and per-operation memory',()=>{
 const row=describe('row_security','vi-VN').paragraphs[0];assert(row.includes('off')&&row.includes('thất bại')&&row.includes('không cấp quyền truy cập hàng không giới hạn')&&row.includes('BYPASSRLS'));
 assert(describe('autovacuum_vacuum_insert_scale_factor','vi-VN').paragraphs[0].includes('trang bảng chưa đóng băng'));
 const include=describe('include_dir','vi-VN').paragraphs[0];assert(include.includes('không ẩn')&&include.includes('.conf')&&include.includes('miền địa phương C'));
 assert(describe('include_if_exists','vi-VN').paragraphs[0].includes('các lỗi đọc khác vẫn được báo cáo'));
 const memory=describe('work_mem','vi-VN').paragraphs[1];assert(memory.includes('Mỗi thao tác sắp xếp nội bộ')&&memory.includes('tệp tạm trên đĩa'));
});
