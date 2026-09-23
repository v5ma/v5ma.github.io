/* Read-only source/model/DOM fixtures, not physical-device or campaign QA. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,checkpoint} from '../model.mjs';
import {LEVELS} from '../world.mjs';
import {expeditionBrief,routeOpportunities,createPlaceBriefing} from '../place-briefing.mjs';

test('Every existing chapter has a briefing, only the three rebuilt chapters claim updates',()=>{
 for(const id of Object.keys(LEVELS)){const text=expeditionBrief(id);assert.ok(text.length>50);assert.equal(text.startsWith('UPDATED'),['district','conservatory','terminus'].includes(id));}
 for(const id of ['missing','__proto__','constructor',null])assert.equal(expeditionBrief(id),null);
});
test('Freight passage advice follows the existing battery prerequisite and earned radio task',()=>{
 const s=createGame('district');let r=routeOpportunities(s);assert.equal(r[0].state,'OPEN');assert.equal(r[1].state,'CLOSED');s.objectives.cell=true;assert.equal(routeOpportunities(s)[1].state,'AVAILABLE TO OPEN');s.completedTasks.push('ward-radio');r=routeOpportunities(s);assert.equal(r[1].state,'OPEN');assert.match(r[1].text,/pursuit/);
});
test('Station advice distinguishes available dispatch release from the power-dependent radio',()=>{
 const s=createGame('terminus');assert.deepEqual(routeOpportunities(s).map(r=>r.state),['AVAILABLE TO OPEN','CLOSED']);s.puzzle.solved=true;assert.deepEqual(routeOpportunities(s).map(r=>r.state),['AVAILABLE TO OPEN','AVAILABLE TO OPEN']);s.completedTasks.push('last-dispatch','station-radio');assert.deepEqual(routeOpportunities(s).map(r=>r.state),['OPEN','OPEN']);
 const fresh=createGame('terminus');assert.equal(routeOpportunities(fresh)[1].state,'CLOSED');
});
test('Briefings do not mutate checkpoints or claim connections in the other four chapters',()=>{
 for(const id of Object.keys(LEVELS)){const s=createGame(id),saved=checkpoint(s),copy=JSON.stringify(s);for(let i=0;i<5;i++){expeditionBrief(id);routeOpportunities(s);}assert.equal(checkpoint(s),saved);assert.equal(JSON.stringify(s),copy);if(!['district','conservatory','terminus'].includes(id))assert.deepEqual(routeOpportunities(s),[]);}
 assert.deepEqual(routeOpportunities(null),[]);assert.deepEqual(routeOpportunities({level:'unknown'}),[]);
});
class Element{
 constructor(tag,doc){this.tagName=tag;this.doc=doc;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.textContent='';this.hidden=false;this.writes=0;}
 append(...children){for(const c of children){this.children.push(c);c.parent=this;}}
 after(c){const a=this.parent.children;a.splice(a.indexOf(this)+1,0,c);c.parent=this.parent;}
 remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}
 replaceChildren(...c){this.writes++;this.children=[];this.append(...c);}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
 addEventListener(k,v){this.listeners[k]=v;}removeEventListener(k,v){if(this.listeners[k]===v)delete this.listeners[k];}
 querySelector(selector){return selector==='.intro'?this.children.find(c=>c.className==='intro'):null;}
}
function dom(){const elements=[],doc={createElement(tag){const e=new Element(tag,doc);elements.push(e);return e;},getElementById(id){return elements.find(e=>e.id===id);}},title=doc.createElement('section'),intro=doc.createElement('p'),select=doc.createElement('select'),host=doc.createElement('section');title.id='title';intro.className='intro';title.append(intro);select.id='chapter-select';select.value='district';select.options=Object.keys(LEVELS).map(value=>({value,textContent:LEVELS[value].title}));select.setAttribute('aria-describedby','old-hint');return {doc,title,select,host,elements};}
test('Native title browsing leaves selection, focus and start/continue actions alone; journal redraw is state-driven',()=>{
 const f=dom();let s=createGame('district');const focus={id:'start'};f.doc.activeElement=focus;const nativeChange=()=>{};f.select.onchange=nativeChange;const b=createPlaceBriefing(()=>s,f.host,f.doc);assert.equal(f.select.onchange,nativeChange);assert.equal(f.doc.activeElement,focus);assert.equal(f.select.options.length,7);assert.equal(f.select.value,'district');assert.match(f.doc.getElementById('expedition-briefing').textContent,/RECLAIMED|FLOODGATE/);assert.equal(f.select.getAttribute('aria-describedby'),'old-hint expedition-briefing');
 f.select.value='terminus';f.select.listeners.change();assert.match(f.doc.getElementById('expedition-briefing').textContent,/BELLWEATHER/);assert.equal(s.level,'district');
 const body=f.doc.getElementById('route-opportunities').children[1],n=body.writes;for(let i=0;i<20;i++)b.update();assert.equal(body.writes,n);s.objectives.cell=true;b.update();assert.equal(body.writes,n+1);
 s=createGame('natatorium');b.update();assert.equal(f.doc.getElementById('route-opportunities').hidden,true);assert.equal(f.elements.filter(e=>e.tagName==='button'||e.tagName==='input').length,0);b.dispose();assert.equal(f.select.listeners.change,undefined);
});
test('The existing journal owns the briefing and retains complete route-opening feedback after a task',()=>{
 const text=fs.readFileSync(new URL('../field-journal.mjs',import.meta.url),'utf8');assert.match(text,/createPlaceBriefing\(getState,panel\)/);assert.match(text,/routes\.update\(\)/);assert.match(text,/t\.completionHint/);
});
