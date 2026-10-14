import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {transform,loadBindings} from 'next/dist/build/swc/index.js';
test('hiding a terminal retains accepted input and targets its own session while ignoring hidden keystrokes',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/terminal-screen.tsx',import.meta.url),'utf8'),{filename:'terminal-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],states=[];let ri=0,si=0;const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 const require=name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:()=>null}:name.endsWith('.css')?{}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const sent=[],resolvers=[];let handler,disposed=0;const props={job:{id:'owned-session',status:'running'},inputEnabled:true,visible:true,onInput:(text,id)=>{sent.push({text,id});return new Promise(resolve=>resolvers.push(resolve));}};
 const render=()=>{ri=si=0;effects.length=0;return module.exports.default(props);};render();refs[2].current={options:{},onData:fn=>{handler=fn;return{dispose:()=>disposed++};}};
 const cleanup=effects[2]();handler('a');handler('b');props.visible=false;render();handler('hidden');resolvers.shift()();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(sent,[{text:'a',id:'owned-session'},{text:'b',id:'owned-session'}]);assert.equal(disposed,0);
 props.visible=true;render();handler('c');cleanup();resolvers.shift()();await new Promise(resolve=>setImmediate(resolve));assert.equal(disposed,1);assert.equal(sent.length,2,'actual session disposal still clears pending data');
});
test('activating a terminal fits the visible viewport and focuses only an interactive session',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/terminal-screen.tsx',import.meta.url),'utf8'),{filename:'terminal-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],states=[];let ri=0,si=0;const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 const require=name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:()=>null}:name.endsWith('.css')?{}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const pending=new Map();let serial=0,fits=0,focus=0;
 const saved={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 globalThis.requestAnimationFrame=fn=>{pending.set(++serial,fn);return serial;};globalThis.cancelAnimationFrame=id=>pending.delete(id);
 const props={visible:true,inputEnabled:true,job:{id:'shell',status:'running'}},render=()=>{ri=si=0;effects.length=0;module.exports.default(props);};
 const flush=()=>{for(const [id,fn] of pending){pending.delete(id);fn();}};
 try{
  render();refs[1].current={clientWidth:1200,clientHeight:700};refs[2].current={focus:()=>focus++};refs[4].current={fit:()=>fits++};
  effects[4]();flush();assert.equal(fits,1);assert.equal(focus,1,'new shell immediately accepts typing');
  props.visible=false;render();assert.equal(effects[4](),undefined);assert.equal(fits,1,'hidden tabs do not fit to zero width');
  props.visible=true;render();effects[4]();flush();assert.equal(fits,2);assert.equal(focus,2,'switching back restores size and keyboard focus');
  props.inputEnabled=false;render();effects[4]();flush();assert.equal(fits,3);assert.equal(focus,2,'history fits without stealing keyboard focus');
  props.inputEnabled=true;render();const cleanup=effects[4]();cleanup();flush();assert.equal(fits,3,'disposed animation cannot touch a closed terminal');
  render();effects[4]();props.visible=false;render();flush();assert.equal(fits,3,'visibility is rechecked after scheduling');
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
test('failed input pauses the screen until its live session is checked without replaying uncertain input',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/terminal-screen.tsx',import.meta.url),'utf8'),{filename:'terminal-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],states=[],sent=[];let ri=0,si=0,handler,reject,focus=0,checks=0;const native=createRequire(import.meta.url),module={exports:{}},Button=()=>null;
 const hooks={...React,useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=typeof next==='function'?next(states[i]):next];},useEffect:fn=>effects.push(fn)};
 const require=name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button}:name.endsWith('.css')?{}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 const props={job:{id:'owned',status:'running'},inputEnabled:true,onInput:(text,id)=>{sent.push({text,id});if(sent.length===1)return new Promise((_resolve,fail)=>reject=fail);return Promise.resolve();},onReconnect:async id=>{checks++;assert.equal(id,'owned');return true;}},render=()=>{ri=si=0;effects.length=0;return module.exports.default(props);};
 const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)],button=tree=>nodes(tree).find(node=>node.type===Button);
 render();const screen={options:{},onData:fn=>{handler=fn;return{dispose:()=>{}};},focus:()=>focus++};refs[2].current=screen;const cleanup=effects[2]();handler('uncertain');handler('discarded');reject(Error('network'));await new Promise(resolve=>setImmediate(resolve));let tree=render();assert.equal(screen.options.disableStdin,true);assert.equal(button(tree).props.children,'연결 확인');handler('blocked');assert.equal(sent.length,1);
 await button(tree).props.onClick();tree=render();assert.equal(checks,1);assert.equal(screen.options.disableStdin,false);assert.equal(focus,1);assert.equal(button(tree),undefined);handler('fresh');await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(sent,[{text:'uncertain',id:'owned'},{text:'fresh',id:'owned'}]);
 cleanup();props.onInput=async()=>{throw Error('network');};render();const pausedCleanup=effects[2]();handler('failed-again');await new Promise(resolve=>setImmediate(resolve));props.onReconnect=async()=>false;tree=render();await button(tree).props.onClick();assert.equal(screen.options.disableStdin,true,'a closed session never resumes');
 let resolveCheck;props.onReconnect=()=>new Promise(resolve=>resolveCheck=resolve);tree=render();const checking=button(tree).props.onClick();props.job={id:'replacement',status:'running'};render();resolveCheck(true);await checking;assert.equal(screen.options.disableStdin,true,'a late check cannot resume the previous session after replacement');assert.equal(focus,1);pausedCleanup();
});

test('appearance updates the existing emulator and fits only visible screens without resetting output',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/terminal-screen.tsx',import.meta.url),'utf8'),{filename:'terminal-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],states=[];let ri=0,si=0;const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 const require=name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:()=>null}:name.endsWith('.css')?{}:native(name);
 new Function('require','module','exports',compiled.code)(require,module,module.exports);
 let fits=0;const screen={options:{},reset:()=>assert.fail('appearance must not clear the terminal'),dispose:()=>assert.fail('appearance must not restart the screen')};
 const props={visible:true,appearance:{fontSize:18,cursorStyle:'bar',cursorBlink:true,scrollback:5000}},render=()=>{ri=si=0;effects.length=0;module.exports.default(props);};
 render();refs[1].current={clientWidth:900,clientHeight:600};refs[2].current=screen;refs[4].current={fit:()=>fits++};effects.at(-1)();assert.equal(fits,1);assert.equal(screen.options.fontSize,18);assert.equal(screen.options.cursorStyle,'bar');assert.equal(screen.options.scrollback,5000);
 props.visible=false;props.appearance={fontSize:20,cursorStyle:'underline',cursorBlink:false,scrollback:1000};render();effects.at(-1)();assert.equal(fits,1);assert.equal(screen.options.fontSize,20);assert.equal(screen.options.cursorBlink,false);assert.equal(refs[2].current,screen);
});

test('the screen wires composition events to its original input queue and removes them on disposal',async()=>{
 await loadBindings();const compiled=await transform(await readFile(new URL('../components/terminal-screen.tsx',import.meta.url),'utf8'),{filename:'terminal-screen.tsx',jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const refs=[],effects=[],states=[];let ri=0,si=0;const native=createRequire(import.meta.url),module={exports:{}};
 const hooks={...React,useRef:initial=>refs[ri++]??(refs[ri-1]={current:initial}),useState:initial=>{const i=si++;if(!(i in states))states[i]=initial;return[states[i],next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 new Function('require','module','exports',compiled.code)(name=>name==='react'?hooks:name==='./language-provider'?{useLanguage:()=>({t:text=>text})}:name==='./ui/controls'?{Button:()=>null}:name.endsWith('.css')?{}:native(name),module,module.exports);
 const sent=[],events=new Map();let handler;const props={job:{id:'original-shell',status:'running'},inputEnabled:true,visible:true,onInput:async(text,id)=>sent.push({text,id})},render=()=>{ri=si=0;effects.length=0;module.exports.default(props);};
 render();refs[2].current={options:{},textarea:{addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:(type,fn)=>{assert.equal(events.get(type),fn);events.delete(type);}},onData:fn=>{handler=fn;return {dispose:()=>{}};}};
 const cleanup=effects[2]();assert.equal(events.size,2);events.get('compositionstart')();events.get('compositionend')();props.visible=false;render();handler('한');await new Promise(resolve=>setTimeout(resolve,5));assert.deepEqual(sent,[{text:'한',id:'original-shell'}]);handler('hidden');assert.equal(sent.length,1);cleanup();assert.equal(events.size,0);handler('disposed');assert.equal(sent.length,1);
});
