import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transform,loadBindings} from 'next/dist/build/swc/index.js';
import {terminalCompositionVisibility} from '../lib/terminal-composition-visibility.ts';
import {terminalKeyEvent} from '../lib/terminal-key-event.ts';
import {terminalInputQueue} from '../lib/terminal-input-queue.ts';
async function fixture(withVisibility=false){
 await loadBindings();const native=createRequire(import.meta.url),source=await readFile(new URL('../node_modules/@xterm/xterm/src/browser/input/CompositionHelper.ts',import.meta.url),'utf8');
 const compiled=await transform(source,{filename:'CompositionHelper.ts',jsc:{parser:{syntax:'typescript',decorators:true},transform:{legacyDecorator:true}},module:{type:'commonjs'}});
 const module={exports:{}},tasks=[],events=[],textarea={value:'',style:{}},active=new Set(),view={textContent:'',style:{},classList:{add:name=>active.add(name),remove:name=>active.delete(name)},getBoundingClientRect:()=>({width:16,height:18})};
 let visible=true,current=true;const visibility=terminalCompositionVisibility(()=>visible,()=>current,{schedule:fn=>{tasks.push(fn);return fn;},cancel:fn=>{const index=tasks.indexOf(fn);if(index>=0)tasks.splice(index,1);}});const queue=terminalInputQueue(async text=>events.push(text));
 const require=name=>name==='common/data/EscapeSequences'?{C0:{DEL:'\x7f'}}:name.includes('services/Services')?{IRenderService:()=>{},IBufferService:()=>{},ICoreService:()=>{},IOptionsService:()=>{}}:native(name);
 new Function('require','module','exports','setTimeout',compiled.code)(require,module,module.exports,fn=>tasks.push(fn));
 const helper=new module.exports.CompositionHelper(textarea,view,{buffer:{isCursorInViewport:true,x:2,y:1},cols:80},{rawOptions:{fontFamily:'monospace',fontSize:13}},{triggerDataEvent:text=>{if(withVisibility==='legacy'?visible:!withVisibility||visibility.accepts())queue.push(text);}},{dimensions:{css:{cell:{height:18,width:8}}}});
 const flush=async()=>{while(tasks.length)tasks.shift()();await new Promise(resolve=>setImmediate(resolve));};
 const update=async(text,value=text)=>{helper.compositionupdate({data:text});textarea.value=value;await flush();};
 return {helper,textarea,view,active,events,queue,flush,update,visibility,hide:()=>{visible=false;},invalidate:()=>{current=false;},start:()=>{helper.compositionstart();visibility.start();},end:()=>{helper.compositionend();visibility.end();}};
}
test('real xterm Hangul composition sends completed syllables through the app queue, never intermediate jamo',async()=>{
 const f=await fixture();try{
 f.helper.compositionstart();await f.update('ㅎ');await f.update('하');await f.update('한');assert.deepEqual(f.events,[]);assert(f.active.has('active'));
 f.helper.compositionend();await f.flush();assert.equal(f.events.join(''),'한');assert(!f.active.has('active'));assert.equal(f.view.style.fontSize,'13px');assert.equal(f.textarea.style.width,'16px');
 }finally{f.queue.dispose();}
});
test('final consonant relocation uses textarea commits rather than stale composition event text',async()=>{
 const f=await fixture();try{
 f.helper.compositionstart();await f.update('ㄱ');await f.update('가');await f.update('각');
 f.helper.compositionend();f.textarea.value='가';f.helper.compositionstart();f.helper.compositionupdate({data:'가'});f.textarea.value='가가';await f.flush();
 assert.equal(f.events.join(''),'가');f.helper.compositionend();await f.flush();assert.equal(f.events.join(''),'가가');
 }finally{f.queue.dispose();}
});
test('IME punctuation and backspace retain byte order after a committed Hangul syllable',async()=>{
 const f=await fixture();try{
 f.helper.compositionstart();await f.update('한');f.helper.compositionend();await f.flush();f.textarea.value='';
 const event={key:'Process',keyCode:229};assert(terminalKeyEvent(event));assert.equal(f.helper.keydown(event),false);f.textarea.value='1';await f.flush();
 assert.equal(f.events.join(''),'한1');assert.equal(f.helper.keydown(event),false);f.textarea.value='';await f.flush();assert.equal(f.events.join(''),'한1\x7f');
 }finally{f.queue.dispose();}
});
test('composition commits before Enter and a late compositionend does not resend the syllable',async()=>{
 const f=await fixture();try{
 f.helper.compositionstart();await f.update('한');const enter={key:'Enter',keyCode:13,isComposing:true};
 assert(terminalKeyEvent(enter));assert.equal(f.helper.keydown(enter),true);
 // CoreBrowserTerminal clears the helper textarea before emitting CR.
 f.textarea.value='';f.queue.push('\r');f.helper.compositionend();await f.flush();
 assert.equal(f.events.join(''),'한\r');
 }finally{f.queue.dispose();}
});


test('tab switch preserves the delayed final Hangul commit on its original session exactly once',async()=>{
 const f=await fixture(true);try{f.start();await f.update('한');f.hide();assert.equal(f.visibility.accepts(),false,'hidden key input stays blocked before compositionend');f.end();await f.flush();assert.equal(f.events.join(''),'한');assert.equal(f.visibility.accepts(),false);f.helper.compositionend();await f.flush();assert.equal(f.events.join(''),'한');}finally{f.visibility.dispose();f.queue.dispose();}
});
test('a hidden terminal without an in-flight composition never receives input',async()=>{
 const f=await fixture(true);try{f.hide();assert.equal(f.visibility.accepts(),false);f.start();await f.update('한');f.end();await f.flush();assert.deepEqual(f.events,[]);}finally{f.visibility.dispose();f.queue.dispose();}
});
test('pending Hangul commit is dropped when its session ends or its input subscription is disposed',async()=>{
 for(const dispose of [false,true]){const f=await fixture(true);try{f.start();await f.update('한');f.end();f.hide();if(dispose)f.visibility.dispose();else f.invalidate();await f.flush();assert.deepEqual(f.events,[]);}finally{f.visibility.dispose();f.queue.dispose();}}
});


test('the legacy visibility-only callback reproduces the lost final Hangul syllable',async()=>{
 const f=await fixture('legacy');try{f.start();await f.update('한');f.end();f.hide();await f.flush();assert.deepEqual(f.events,[],'the old onData visibility guard drops the delayed compositionend commit');}finally{f.visibility.dispose();f.queue.dispose();}
});
