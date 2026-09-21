// Isolated execution of the real card update function, not physical UI approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {entryGate} from '../route-entry-core.mjs';
const source=readFileSync(new URL('../route-entry.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function updateCards(){'),source.indexOf('\nfunction mount(){'));
function run({checked=true,supported={ar:false,vr:true},mode=null,saveOK=true}={}){
 const cards=['ar','vr','screen'].map(scMode=>({dataset:{scMode,scRoute:'first-neighborhood'},attributes:{'aria-disabled':'true'},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}}));
 const info={textContent:''};
 const routes=[{id:'first-neighborhood',name:'Sunrise Borough'}];
 const c=vm.createContext({checked,supported,pref:{mode},saveOK,window:{DeliveryCampaign:{routes}},document:{querySelectorAll:s=>s==='[data-sc-mode]'?cards:[info]}});
 vm.runInContext(fn+'\nupdateCards();',c);return {cards,info,routes};
}
test('Unavailable mode is a reachable explanatory action, not an inert advertised launch',()=>{
 const {cards,routes}=run();const ar=cards[0];
 assert.equal(ar.attributes['aria-disabled'],undefined);
 assert.equal(ar.dataset.unavailable,'true');
 assert.match(ar.attributes['aria-label'],/AR unavailable for Sunrise Borough: show explanation/);
 assert.equal(ar.textContent,'AR unavailable');
 const gate=entryGate({routes,id:'first-neighborhood',mode:'ar',ready:true,supported:{ar:false}});
 assert.equal(gate.ok,false);assert.match(gate.reason,/Choose Screen explicitly/);
});
test('Available modes retain explicit route labels and never launch from preference display',()=>{
 const {cards}=run({mode:'vr'});
 assert.equal(cards[1].attributes['aria-label'],'Play Sunrise Borough in VR');
 assert.equal(cards[1].dataset.preferred,'true');assert.equal(cards[0].dataset.preferred,'false');
 assert.equal(cards[2].attributes['aria-label'],'Play Sunrise Borough in Screen');
 assert.equal(cards[2].dataset.unavailable,'false');
});
test('Pending support is described as checking rather than unavailable',()=>{
 const {cards}=run({checked:false,supported:{ar:false,vr:false}});
 assert.equal(cards[0].textContent,'AR checking');assert.equal(cards[1].textContent,'VR checking');
 assert.equal(cards[2].textContent,'Screen');assert.equal(cards[0].dataset.unavailable,'false');
 assert(source.includes("if(mode!=='screen'&&!checked)return {ok:false"));
});
test('A failed new preference write is visibly session-only and does not clear prior storage',()=>{
 const {info}=run({mode:'ar',saveOK:false});
 assert.equal(info.textContent,'Last used: AR / this session only');
 assert(!source.includes('localStorage.clear'));
 assert(source.includes('Reloading ends the current unfinished run but preserves saved progress.'));
});
