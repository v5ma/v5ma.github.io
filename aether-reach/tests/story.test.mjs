/* Isolated model fixtures, never evidence of a native player journey. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,saveState,interact,RECORDS} from '../model.mjs';
import {TASKS} from '../expedition-world.mjs';
import {storyEntries,storyChapters,storyAssignment,storyPurpose,storyPage,createStoryObserver,STORY_OPENING} from '../story-core.mjs';
const ids=s=>storyEntries(s).map(e=>e.id);
const withFlags=(...flags)=>createState({version:1,expedition:{flags}});
const frozen=o=>{if(o&&typeof o==='object'){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))frozen(v);}return o;};
test('Opening establishes the public courier, Iona and Registry without an invented personal backstory',()=>{
 for(const term of ['engineer-courier','Registry','Iona'])assert(STORY_OPENING.includes(term));
 assert.match(storyAssignment(createState()).text,/noticeboard/);assert.match(storyAssignment(createState()).text,/no purchase/i);
});
test('New expeditions cannot read or announce outcomes they have not earned',()=>{
 const s=createState();assert.deepEqual(ids(s),['assignment','arrival','city','iona','relays']);const o=createStoryObserver();o.reset(s);assert.equal(o.poll(s),null);
});
test('All actual adventures have a distinct purpose in the story',()=>{
 assert.equal(TASKS.length,14);for(const t of TASKS)assert.notEqual(storyPurpose(t.id),'Reconnect the city through the work you do here.',t.id);assert.equal(new Set(TASKS.map(t=>storyPurpose(t.id))).size,14);
});
test('Model fixture: the guarded noticeboard interaction unlocks the accepted-dispatch chapter',()=>{
 const s=createState();Object.assign(s.p,{x:5,y:.02,z:0});assert(interact(s));assert(ids(s).includes('dispatch-taken'));assert(!ids(s).includes('dispatch-delivered'));assert(!ids(s).includes('open-sky'));
});
test('Possessing the regulator is not confused with restoring the ferry',()=>{
 const s=withFlags('regulator');assert(ids(s).includes('regulator'));assert(!ids(s).includes('ferry'));assert.match(storyChapters(s).find(e=>e.id==='regulator').text,/not repaired yet/);s.expedition.flags.push('ferry-online');assert(ids(s).includes('ferry'));
});
test('Finding Lio is not reported as completing the rescue',()=>{
 const s=withFlags('surveyor-found');assert(ids(s).includes('lio-found'));assert(!ids(s).includes('lio-safe'));s.expedition.flags.push('surveyor-safe');assert(ids(s).includes('lio-safe'));
});
test('Bellwether chapters follow each real stage, with synchronized receiver separate from paid report',()=>{
 const ordered=['bell-start','bell-street','bell-circuit','bell-roof','bell-signal'];
 for(let stage=0;stage<=5;stage++){const s=createState({version:1,bellwether:{stage}});for(let i=0;i<ordered.length;i++)assert.equal(ids(s).includes(ordered[i]),stage>=i+1,stage+': '+ordered[i]);assert(!ids(s).includes('bell-restored'));}
 const s=withFlags('bellwether-restored');assert(ids(s).includes('bell-restored'));assert.match(storyChapters(s).find(e=>e.id==='bell-restored').text,/recorded once/);
});
test('Pending and interrupted Bellwether work does not invent a repaired market',()=>{
 for(const stage of [1,3,4]){const s=createState({version:1,bellwether:{stage}});assert(!ids(s).includes('bell-signal'));assert(!ids(s).includes('bell-restored'));}
});
test('Collected charter fragments count correctly without claiming the original charter',()=>{
 const s=withFlags('charter-market','charter-academy');assert.match(storyChapters(s).find(e=>e.id==='charter-leaves').text,/2 of the 3/);assert(!ids(s).includes('charter'));s.expedition.flags.push('charter');assert(ids(s).includes('charter'));
});
test('Independent mission orders reconstruct independent earned chapters',()=>{
 const s=withFlags('beacon-secure');assert(ids(s).includes('beacon'));assert(!ids(s).includes('weather'));assert(!ids(s).includes('lio-safe'));assert(!ids(s).includes('open-sky'));s.expedition.flags.push('open-sky');assert(ids(s).includes('open-sky'));
});
test('Repaired relays are not falsely equated with performing the final broadcast',()=>{
 const s=createState({version:1,relays:['garden','foundry','spire']});for(const id of ['garden','foundry','spire'])assert(ids(s).includes('relay-'+id));assert(!ids(s).includes('broadcast'));s.won=true;assert(ids(s).includes('broadcast'));
});
test('Recovered archive text is available verbatim, never from unread records',()=>{
 const r=RECORDS[0],s=createState({version:1,records:[r.id]});const entries=storyEntries(s).filter(e=>e.id.startsWith('archive-'));assert.equal(entries.length,1);assert.equal(entries[0].text,r.text);
});
test('Bounded XR pages preserve all words including long recovered archive notes',()=>{
 const s=createState({version:1,relays:['garden','foundry','spire'],records:RECORDS.map(r=>r.id),expedition:{flags:TASKS.map(t=>t.flag)},bellwether:{stage:6}});
 for(const e of storyEntries(s)){const pages=Array.from({length:storyPage(e).count},(_,i)=>storyPage(e,i));assert.equal(pages.map(p=>p.text).join(' '),e.text.trim().replace(/\s+/g,' '));assert(pages.every(p=>p.description.length<=270));assert.equal(storyPage(e,999).page,pages.length-1);assert.equal(storyPage(e,-5).page,0);}
});
test('Old version-1 save roundtrip restores story without adding keys, credits or completion',()=>{
 const s=createState({version:1,expedition:{flags:['dispatch-started','ferry-online'],tracked:'ferry'},bellwether:{stage:3},relays:['garden']});const saved=saveState(s),names=ids(s);for(let i=0;i<50;i++)storyEntries(s);assert.equal(saveState(s),saved);const restored=createState(saved);assert.deepEqual(ids(restored),names);assert.equal(saveState(restored),saved);
});
test('Story queries are read-only even against deeply frozen simulation objects',()=>{
 const s=createState();const before=JSON.stringify(s);frozen(s);for(let i=0;i<10;i++){storyEntries(s);storyAssignment(s);storyChapters(s);}assert.equal(JSON.stringify(s),before);
});
test('Continue primes existing chapters without announcing old achievements as new',()=>{
 const s=withFlags('dispatch-delivered','ferry-online','weather-open','surveyor-safe'),o=createStoryObserver();o.reset(s);for(let i=0;i<10;i++)assert.equal(o.poll(s),null);s.expedition.flags.push('beacon-secure');assert.equal(o.poll(s).id,'beacon');assert.equal(o.poll(s),null);
});
test('One real milestone batch produces at most one bounded notice and never writes game events',()=>{
 const s=createState(),o=createStoryObserver();o.reset(s);s.expedition.flags.push('surveyor-found','surveyor-safe');const before=JSON.stringify(s),n=o.poll(s);assert.equal(n.id,'lio-safe');assert(n.notice.length<170);assert.equal(o.poll(s),null);assert.equal(JSON.stringify(s),before);
});
test('Reset to a different expedition cannot carry another save\'s story forward',()=>{
 const o=createStoryObserver(),old=withFlags('open-sky','charter');o.reset(old);const fresh=createState();o.reset(fresh);assert.equal(o.poll(fresh),null);assert(!ids(fresh).includes('open-sky'));
});
test('Story entry identifiers are unique and all completion notices stay brief',()=>{
 const s=createState({version:1,relays:['garden','foundry','spire'],records:RECORDS.map(r=>r.id),expedition:{flags:[...TASKS.map(t=>t.flag),'dispatch-started','regulator','surveyor-found','charter-market']},bellwether:{stage:6}});s.won=true;const entries=storyEntries(s);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);for(const e of entries)assert(e.notice.length<170,e.id);
});
test('Reader uses the existing modal path and safe text, without new storage or automatic pauses',()=>{
 const ui=readFileSync(new URL('../story-ui.mjs',import.meta.url),'utf8');assert(ui.includes("api.show('story-dialog')"));assert(ui.includes("api.show('story-index-dialog')"));assert(ui.includes('textContent=e.title'));assert(!ui.includes('localStorage'));assert(!ui.includes('api.pause('));assert(!ui.includes('saveState'));assert(!ui.includes('api.action('));
});
