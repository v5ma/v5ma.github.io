import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LIVING_KEY,ORIGIN,SCENES,CHAPTER_STEPS,emptyLiving,sanitizeLiving,readLiving,saveLiving,futureLiving,chapterComplete,corridorRestored,livingEligibility,advanceLiving} from '../living-reserve-core.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const animal={uid:'legacy-0',species:'diplodocus',mood:'roaming',x:-24,z:1};
const here=s=>({position:{...CHAPTER_STEPS[s.stage].target,y:.92},mode:'foot',speed:0,visible:true,animal});
test('Origin preserves the user fictional Singularity and fossil-fit premise without ancient-blood cloning',()=>{
 const text=ORIGIN.flat().join(' ');assert.match(text,/AI Singularity/);assert.match(text,/recombining DNA/);assert.match(text,/above the 99th percentile/);assert.match(text,/fictional world/);assert.match(text,/not clones recovered from ancient blood/);
});
test('Only the actual current ordered interaction progresses the opening chapter',()=>{
 const s=emptyLiving();s.active=true;assert.equal(advanceLiving(s,'recorder',here(s)),false);
 for(const step of CHAPTER_STEPS){assert.equal(advanceLiving(s,step.id,here(s)),true);assert.equal(advanceLiving(s,step.id,{}),false);}
 assert.ok(chapterComplete(s));assert.equal(s.active,false);assert.deepEqual(s.observation,animal);assert.ok(corridorRestored(s));
});
test('Remote, elevated, moving, wrong-mode and occluded interactions do not complete tasks',()=>{
 for(const change of [{position:{x:5,y:.9,z:70}},{position:{x:5,y:20,z:44}},{mode:'jeep'},{speed:2},{visible:false},{speed:NaN}]){const s=emptyLiving();s.active=true;assert.equal(advanceLiving(s,'mara',{...here(s),...change}),false);assert.equal(s.stage,0);}
});
test('A real visible animal is necessary for the observation and no tool hit is required',()=>{
 const s={...emptyLiving(),active:true,stage:1};assert.match(livingEligibility(s,{...here(s),animal:null}),/plant-eater/);assert.equal(advanceLiving(s,'watch',{...here(s),animal:null}),false);assert.equal(advanceLiving(s,'watch',here(s)),true);assert.equal(s.observation.uid,animal.uid);
});
test('Chapter has no progress or open-gate side effects until explicitly selected',()=>{
 const s=emptyLiving();assert.equal(s.active,false);assert.equal(corridorRestored(s),false);assert.equal(advanceLiving(s,'mara',here(s)),false);
});
test('Restore is durable through suspension and reload, without paying any legacy reward',()=>{
 const storage=memory(),old={'dino-atlas.frontier.v2':'{"credits":900,"active":"boat"}','dino-atlas.ranger.v1':'{"version":1,"stage":3}','dino-atlas.field-operations.classic.v1':'{"cargo":{"carrier":"boat"}}'};
 for(const [k,v] of Object.entries(old))storage.setItem(k,v);
 const s={...emptyLiving(),active:true,stage:5,observation:animal};assert.ok(saveLiving(storage,s));s.active=false;saveLiving(storage,s);const restored=readLiving(storage);assert.ok(corridorRestored(restored));assert.equal(restored.active,false);assert.equal(restored.stage,5);
 for(const [k,v] of Object.entries(old))assert.equal(storage.getItem(k),v);assert.deepEqual([...storage.data.keys()].sort(),[...Object.keys(old),LIVING_KEY].sort());
});
test('Future save version is not overwritten; blocked storage fails explicitly',()=>{
 const storage=memory(),raw='{"version":99,"stage":12,"future":"keep"}';storage.setItem(LIVING_KEY,raw);assert.ok(futureLiving(storage));assert.equal(saveLiving(storage,emptyLiving()),false);assert.equal(storage.getItem(LIVING_KEY),raw);assert.equal(saveLiving(null,emptyLiving()),false);assert.deepEqual(readLiving(null),emptyLiving());
});
test('Malformed saved data is bounded and completion cannot become armed again',()=>{
 assert.deepEqual(sanitizeLiving(null),emptyLiving());const s=sanitizeLiving({version:1,stage:99,active:true,observation:{x:NaN,z:0,species:'x',uid:'x'}});assert.equal(s.stage,7);assert.equal(s.active,false);assert.equal(s.observation,null);
});
test('Every completed field event has replayable authored dialogue and a reachable named next goal',()=>{
 assert.equal(CHAPTER_STEPS.length,7);for(const step of CHAPTER_STEPS){assert.ok(SCENES[step.id].length>=2);assert.ok(Object.values(step.target).every(Number.isFinite));assert.ok(step.detail.length>25);}
});
test('Main entry versions the actual boot module and preserves the regular XR entries',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/"\.\/ranger\.js\?v=fieldops1":"\.\/ranger\.js\?v=story1"/);for(const view of ['first-person-vr','diorama-vr','diorama-ar'])assert.ok(html.includes(`data-classic-xr-view="${view}"`));
});
test('Story uses existing interactions, shared spatial menus and an inclusive gate rule, not a replacement simulation',()=>{
 const source=fs.readFileSync(new URL('../living-reserve.js',import.meta.url),'utf8'),ranger=fs.readFileSync(new URL('../ranger.js',import.meta.url),'utf8');assert.doesNotMatch(source,/setAnimationLoop|setTranslation|setActive|localStorage\.clear|\.reset\(/);assert.match(source,/this\.ctx\.show\('living-dialog'\)/);assert.match(ranger,/living\?\.interact\(\)/);assert.match(ranger,/campaign\.stage>=3\|\|on/);
});
