import test from 'node:test';
import assert from 'node:assert/strict';
import {filterAuditEvents,auditExport,auditResults} from '../lib/audit-view.ts';
import {translate} from '../lib/i18n.ts';

test('localized audit search matches native labels without searching private fields or changing exported codes',()=>{
 const events=[{at:'2026-10-11T00:00:00Z',action:'nginx-check',result:'completed',privateFixtureField:'hidden-needle'},{at:'2026-10-11T00:01:00Z',action:'nginx-restore',result:'recovered'}];
 const options={locale:'vi-VN',resultLabel:value=>translate('vi-VN',value==='completed'?'완료':'복구 완료')};
 assert.deepEqual(filterAuditEvents(events,{...options,text:'HOÀN TẤT'}),events);
 assert.deepEqual(filterAuditEvents(events,{...options,text:'Khôi phục hoàn tất'}),[events[1]]);
 assert.deepEqual(filterAuditEvents(events,{...options,text:'completed'}),[events[0]]);
 assert.deepEqual(filterAuditEvents(events,{...options,text:'hidden-needle'}),[]);
 assert.equal(JSON.parse(auditExport(filterAuditEvents(events,{...options,text:'Khôi phục hoàn tất'}))).events[0].result,'recovered');
 assert.deepEqual(filterAuditEvents(events,{locale:'en',text:'Complete',resultLabel:()=> 'Complete'}),events);
});

test('audit searches respect Turkish casing for localized action text',()=>{
 const event={at:'2026-10-11T00:00:00Z',action:'İşlem',result:'completed'};
 assert.deepEqual(filterAuditEvents([event],{locale:'tr',text:'işlem'}),[event]);
});
test('audit filters preserve source records and use UTC date boundaries',()=>{
 const events=[{at:'2026-10-02T23:59:59.999Z',action:'nginx-apply',result:'completed'},{at:'2026-10-03T00:00:00Z',action:'nginx-apply',result:'failed'}];
 assert.deepEqual(filterAuditEvents(events,{from:'2026-10-03',to:'2026-10-03',text:'NGINX',result:'failed'}),[events[1]]);
 assert.deepEqual(filterAuditEvents(events,{to:'2026-10-02'}),[events[0]]);assert.equal(events.length,2);
 assert.equal(filterAuditEvents(events,{from:'invalid'}).length,0);assert.equal(filterAuditEvents(events,{from:'2026-10-04',to:'2026-10-01'}).length,0);
 const output=JSON.parse(auditExport([events[1]]));assert.deepEqual(output.events,[events[1]]);assert(output.scope.includes('bounded'));
});

test('audit outcome filters include rollback recovery and no-change results emitted by operating actions',()=>{
 const events=['rolled-back','recovery-required','unchanged'].map(result=>({at:'2026-10-03T00:00:00Z',action:'nginx-config-apply',result}));
 for(const event of events){assert(auditResults.includes(event.result));assert.deepEqual(filterAuditEvents(events,{result:event.result}),[event]);}
 assert(Object.isFrozen(auditResults));
});

test('Korean result searches match the displayed label while retaining raw result codes',()=>{
 const events=[{at:'2026-10-09T00:00:00Z',action:'nginx-check',result:'completed'},{at:'2026-10-09T00:01:00Z',action:'nginx-check',result:'failed'}];
 assert.deepEqual(filterAuditEvents(events,{text:'완료'}),[events[0]]);
 assert.deepEqual(filterAuditEvents(events,{text:'실패'}),[events[1]]);
 assert.deepEqual(filterAuditEvents(events,{text:'completed'}),[events[0]]);
 assert.equal(JSON.parse(auditExport(filterAuditEvents(events,{text:'완료'}))).events[0].result,'completed');
});

test('scheduled app restart is filterable and searchable with its Korean result label',()=>{
 const event={at:'2026-10-10T00:00:00Z',action:'app-restart',result:'scheduled'};
 assert(auditResults.includes('scheduled'));
 assert.deepEqual(filterAuditEvents([event],{result:'scheduled',text:'재시작 예약'}),[event]);
});
