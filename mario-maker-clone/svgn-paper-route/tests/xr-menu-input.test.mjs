import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMenuInput,trackedController} from '../xr-menu-input.mjs';
import {sourcesNeutral,mappedPad} from '../xr-input-core.mjs';
function controller(hand='right',size=12) {
 const buttons=Array.from({length:size},()=>({pressed:false,touched:false,value:0}));
 // Native WebIDL values are getters, not enumerable own data properties.
 const gamepad=Object.create({get buttons(){return buttons;},get axes(){return [0,0,0,0];},get mapping(){return 'xr-standard';}});
 return {handedness:hand,hand:null,profiles:['meta-quest-touch-plus'],gamepad};
}
function down(s,i,on=true,value=1){s.gamepad.buttons[i]={pressed:on,touched:on,value:on?value:0};}
for(const hand of ['left','right'])for(const [i,command]of [[0,'select'],[1,hand==='left'?'previous':'next'],[4,'confirm'],[5,'back']])test(hand+' button '+i+' acts once per press regardless of passive sensors',()=>{
 const s=controller(hand);down(s,6);down(s,10);const input=createMenuInput();input.seed([s]);down(s,i);
 assert.deepEqual(input.sample([s],{menu:true}).map(e=>e.command),[command]);
 assert.deepEqual(input.sample([s],{menu:true}),[]);down(s,i,false);input.sample([s],{menu:true});down(s,i);assert.equal(input.sample([s],{menu:true}).length,1);
});
for(const size of [7,12])test('Contact/proximity slots do not hold the neutral gate ('+size+' buttons)',()=>{
 const s=controller('right',size);for(let i=6;i<size;i++)down(s,i);assert(sourcesNeutral([s],{panel:true}));assert(sourcesNeutral([s]));down(s,0);assert(!sourcesNeutral([s]));
});
test('Untouched menu raw input is neutral when direct session handling owns it',()=>{
 const s=controller();for(const i of [0,1,4,5])down(s,i);const p=mappedPad([s],{panel:true,directMenu:true,allowRecovery:true});assert(p.buttons.every(b=>!b.pressed));
});
test('Gameplay mappings stay unchanged apart from the session-owned B shortcut',()=>{
 const s=controller();down(s,0);down(s,1);down(s,4);const p=mappedPad([s],{directMenu:true});assert(p.buttons[0].pressed&&p.buttons[4].pressed&&p.buttons[5].pressed);
});
test('A grip already held on entry cannot jump focus or block B',()=>{
 const s=controller();down(s,1);const input=createMenuInput();input.seed([s]);assert.equal(input.sample([s],{menu:true}).length,0);down(s,5);assert.equal(input.sample([s],{menu:true})[0].command,'back');
});
test('Held B cannot cascade when a menu becomes gameplay',()=>{
 const s=controller();const input=createMenuInput();input.seed([s]);down(s,5);assert.equal(input.sample([s],{menu:true})[0].command,'back');assert.deepEqual(input.sample([s],{menu:false}),[]);
 down(s,5,false);input.sample([s]);down(s,5);assert.equal(input.sample([s])[0].command,'pause');
});
for(const eventFirst of [true,false])test('Event/poll trigger order deduplicates ('+eventFirst+')',()=>{
 const s=controller();const input=createMenuInput();input.seed([s]);down(s,0);let count=0;
 if(eventFirst){if(input.selectStart(s,{menu:true}))count++;count+=input.sample([s],{menu:true}).length;}
 else {count+=input.sample([s],{menu:true}).length;if(input.selectStart(s,{menu:true}))count++;}
 assert.equal(count,1);input.selectEnd(s);assert.equal(input.sample([s],{menu:true}).length,0);down(s,0,false);input.sample([s],{menu:true});down(s,0);assert.equal(input.sample([s],{menu:true}).length,1);
});
test('Short native trigger events still work between render polls',()=>{
 const s=controller();const input=createMenuInput();input.seed([s]);assert.equal(input.selectStart(s,{menu:true}).command,'select');input.selectEnd(s);assert.deepEqual(input.sample([s],{menu:true}),[]);assert.equal(input.selectStart(s,{menu:true}).command,'select');
});
test('Blur blocks buttons and held presses must release after visibility returns',()=>{
 const s=controller();const input=createMenuInput();input.seed([s]);down(s,5);assert.deepEqual(input.sample([s],{menu:true,visible:false}),[]);assert.deepEqual(input.sample([s],{menu:true}),[]);down(s,5,false);input.sample([s],{menu:true});down(s,5);assert.equal(input.sample([s],{menu:true})[0].command,'back');
});
test('Known empty-mapping Touch profile is accepted, unknown gamepads are not guessed',()=>{
 const make=(profiles)=>({handedness:'left',profiles,gamepad:{mapping:'',buttons:Array(6).fill({pressed:false}),axes:[]}});
 assert(trackedController(make(['meta-quest-touch-plus'])));assert(!trackedController(make(['unknown'])));assert(!trackedController({...controller(),hand:new Map()}));
});
test('Removal discards a source state and re-entry consumes an already-held trigger',()=>{
 const s=controller();const input=createMenuInput();input.seed([s]);input.sample([]);down(s,0);assert.deepEqual(input.sample([s],{menu:true}),[]);assert.equal(input.diagnostics.sources,1);
});
test('Direct input code does not depend on DOM focus or write game state',()=>{
 const s=readFileSync(new URL('../xr-menu-input.mjs',import.meta.url),'utf8');assert(!/document\.|localStorage|player\.|requestAnimationFrame/.test(s));
});
