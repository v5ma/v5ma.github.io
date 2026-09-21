import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entryAvailability,CLASSIC_XR_ENTRY_BUILD} from '../classic-xr.js';
const supported={ready:true,secure:true,api:true,vr:true,ar:true};
test('Classic entry separately reports VR and AR without pretending support',()=>{
 assert.equal(entryAvailability(supported).vr,true);assert.equal(entryAvailability(supported).ar,true);
 const vr=entryAvailability({...supported,ar:false});assert.equal(vr.vr,true);assert.equal(vr.ar,false);
 const ar=entryAvailability({...supported,vr:false});assert.equal(ar.vr,false);assert.equal(ar.ar,true);
});
test('Absent WebXR explains the headset requirement instead of hiding choices',()=>{
 const s=entryAvailability({...supported,api:false});assert.equal(s.vr,false);assert.equal(s.ar,false);assert.match(s.message,/does not expose WebXR/);
});
test('Secure context and capability checks gate the session buttons',()=>{
 for(const change of [{secure:false},{ready:false},{vr:false,ar:false}]){const s=entryAvailability({...supported,...change});assert.equal(s.vr,false);assert.equal(s.ar,false);assert.ok(s.message.length>20);}
});
test('Pending or active sessions cannot be duplicated by launcher clicks',()=>{
 for(const change of [{pending:true},{active:true}]){const s=entryAvailability({...supported,...change});assert.equal(s.vr,false);assert.equal(s.ar,false);}
});
test('Classic includes all three choices in the static entry before the other district link',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const view of ['first-person-vr','diorama-vr','diorama-ar'])assert.ok(html.includes(`data-classic-xr-view="${view}"`));
 assert.ok(html.indexOf('id="classic-xr-entry"')<html.indexOf('id="tidegate-entry"'));
 assert.ok(html.includes('id="classic-xr-button"'));assert.ok(html.includes(CLASSIC_XR_ENTRY_BUILD));
 assert.ok(html.includes('"./diorama-xr.js?v=fieldops1":"./classic-xr.js?v=rotunda1"'));
});
test('Launcher retains shared portal implementation and never resets gameplay storage',()=>{
 const src=readFileSync(new URL('../classic-xr.js',import.meta.url),'utf8');
 assert.match(src,/extends SharedXR/);assert.match(src,/const request=this.enter\(\);/);
 assert.ok(!src.includes('localStorage.clear'));assert.ok(!src.includes('removeItem('));assert.ok(!src.includes('requestAnimationFrame('));
});
test('Tidegate does not inherit Classic-only entry mapping',()=>{
 const html=readFileSync(new URL('../tidegate.html',import.meta.url),'utf8');assert.ok(!html.includes('classic-xr.js'));
});
