/* Deterministic rule fixtures, not claims of native player movement. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,newState,step,readSave,saveData,blocked} from '../model.mjs';
import {cityState,saveCity,useCity,drinkTonic,clockInfo,lampMask,nearbyChoices,guideEntries,cityTarget,setTracked,LAMPS,SERVICES} from '../city-core.mjs';
import {poseAt} from '../character-motion.mjs';
const w=makeWorld();
function at(s,p){Object.assign(s,{mode:'foot',speed:0,x:p.x,z:p.z,health:100});s.life.inside=null;}
function service(s,id,action){const p=SERVICES.find(p=>p.id===id)||LAMPS.find(p=>p.id===id);at(s,p);return useCity(s,w,id,action);}
function ticks(s,n=60){for(let i=0;i<n;i++)step(s,w,{},1/60);}
test('A v0.4 save adds the city record without dropping old story, quest, street or equipment state',()=>{
 const s=newState();s.street.done=['bell','cart'];s.life.quests.ink=3;s.life.owned.push('cargo');s.life.bike='cargo';s.credits=123;
 const old=saveData(s);delete old.city;const r=newState(readSave(JSON.stringify(old),w));
 assert.equal(r.city.minute,480);assert.equal(r.credits,123);assert.deepEqual(r.street.done,['bell','cart']);assert.equal(r.life.quests.ink,3);assert.equal(r.life.bike,'cargo');
});
test('Malformed city records cannot inject targets, oversupply the satchel or infinite cooldown values',()=>{
 const c=cityState({version:1,minute:Infinity,tonics:999,switches:-1,mealCooldown:Infinity,restCooldown:500,tracked:{kind:'evil',id:'__proto__'},invited:['unknown','cart','cart']});
 assert.equal(c.minute,480);assert.equal(c.tonics,0);assert.equal(c.switches,0);assert.equal(c.mealCooldown,0);assert.equal(c.restCooldown,0);assert.equal(c.tracked,null);assert.deepEqual(c.invited,['cart']);
});
test('A full lamp circuit is solvable by its declared switch effects and pays only after reporting',()=>{
 const s=newState();s.street.done.push('bell');at(s,SERVICES.find(p=>p.id==='lamplighter'));
 assert.ok(useCity(s,w,'lamplighter','accept').ok);assert.equal(lampMask(s.city),2);
 assert.equal(service(s,'lamplighter','report').ok,false);assert.ok(service(s,'lane','toggle').ok);assert.equal(lampMask(s.city),1);
 assert.ok(service(s,'market','toggle').ok);assert.equal(lampMask(s.city),7);assert.equal(s.credits,0);assert.equal(s.city.circuit,2);
 assert.ok(service(s,'lamplighter','report').ok);assert.equal(s.credits,35);assert.equal(s.life.xp,90);
 assert.equal(service(s,'lamplighter','report').ok,false);assert.equal(service(s,'lane','toggle').ok,false);
 const r=newState(readSave(JSON.stringify(saveData(s)),w));assert.equal(service(r,'lamplighter','report').ok,false);assert.equal(r.credits,35);assert.equal(lampMask(r.city),7);
});
test('Wrong switches are reversible and the reset does not alter original missions or money',()=>{
 const s=newState();s.street.done.push('bell');s.life.quests.ink=3;service(s,'lamplighter','accept');
 service(s,'arch','toggle');assert.equal(lampMask(s.city),3);service(s,'arch','toggle');assert.equal(lampMask(s.city),2);
 service(s,'lane','toggle');service(s,'lamplighter','reset');assert.equal(lampMask(s.city),2);assert.equal(s.credits,0);assert.equal(s.life.quests.ink,3);assert.equal(s.mission,0);
});
test('Circuit acceptance requires the actual bell repair; remote, riding and wrong-floor actions fail',()=>{
 const s=newState();assert.equal(service(s,'lamplighter','accept').ok,false);s.street.done.push('bell');s.x=0;s.z=0;assert.equal(useCity(s,w,'lamplighter','accept').ok,false);
 at(s,SERVICES.find(p=>p.id==='lamplighter'));s.mode='bike';assert.equal(useCity(s,w,'lamplighter','accept').ok,false);s.mode='foot';s.life.inside='workshop';assert.equal(useCity(s,w,'lamplighter','accept').ok,false);
});
test('Wait changes only town lighting time, not cooldown, active time, parked vehicles or rewards',()=>{
 const s=newState();s.city.mealCooldown=120;s.city.restCooldown=30;const parked=JSON.stringify(s.vehicle),earned=s.credits;
 assert.ok(service(s,'hours','evening').ok);assert.equal(clockInfo(s.city).text,'19:30');assert.equal(s.city.activeSeconds,0);assert.equal(s.city.mealCooldown,120);assert.equal(s.city.restCooldown,30);assert.equal(s.credits,earned);assert.equal(JSON.stringify(s.vehicle),parked);
 s.life.inside='inn';assert.equal(useCity(s,w,'hours','morning').ok,false);
 service(s,'hours','morning');assert.equal(clockInfo(s.city).text,'08:00');
});
test('The clock and supply cooldowns advance through fixed simulation steps only and persist',()=>{
 const s=newState();s.city.mealCooldown=180;const before=s.city.minute;ticks(s,120);assert.ok(Math.abs(s.city.minute-before-4/3)<1e-8);assert.ok(Math.abs(s.city.mealCooldown-178)<1e-8);
 const r=newState(readSave(JSON.stringify(saveData(s)),w));assert.equal(r.city.minute,Math.floor(s.city.minute));assert.ok(r.city.mealCooldown>=178);assert.equal(clockInfo({...r.city,minute:5}).phase,'Night');
});
test('Emilia’s completed dinner unlocks renewable recovery, not renewable quest rewards',()=>{
 const s=newState();assert.equal(service(s,'meal','use').ok,false);s.street.done.push('dinner');at(s,SERVICES.find(p=>p.id==='meal'));s.health=40;s.life.focus=10;
 assert.ok(useCity(s,w,'meal','use').ok);assert.equal(s.health,80);assert.equal(s.life.focus,35);assert.equal(s.city.mealCooldown,180);assert.equal(s.life.xp,0);assert.equal(s.credits,0);
 assert.equal(useCity(s,w,'meal','use').ok,false);const r=newState(readSave(JSON.stringify(saveData(s)),w));assert.equal(service(r,'meal','use').ok,false);
});
test('A restored garden bench restores focus only after the garden gate and bench work',()=>{
 const s=newState();s.street.done.push('gardenbench');s.life.focus=10;assert.equal(service(s,'rest','use').ok,false);s.life.flags.garden=true;s.life.focus=10;
 assert.ok(service(s,'rest','use').ok);assert.equal(s.life.focus,40);assert.equal(s.city.restCooldown,60);assert.equal(s.city.servings,0);
});
test('Ada bottles a learned recipe for earned florins; full or unaffordable satchels never charge',()=>{
 const s=newState();s.credits=40;assert.equal(service(s,'brewing','brew').ok,false);s.street.done.push('tonic');
 for(let i=0;i<3;i++)assert.ok(service(s,'brewing','brew').ok);assert.equal(s.credits,4);assert.equal(s.city.tonics,3);assert.equal(service(s,'brewing','brew').ok,false);assert.equal(s.credits,4);
 s.city.tonics=0;assert.equal(service(s,'brewing','brew').ok,false);assert.equal(s.credits,4);
});
test('Packed tonics persist, restore actual attributes and are not wasted when fully restored',()=>{
 const s=newState();s.mode='foot';s.city.tonics=2;assert.equal(drinkTonic(s,w).ok,false);assert.equal(s.city.tonics,2);
 s.health=45;s.life.focus=20;assert.ok(drinkTonic(s,w).ok);assert.equal(s.health,80);assert.equal(s.life.focus,32);assert.equal(s.city.tonics,1);
 const r=newState(readSave(JSON.stringify(saveData(s)),w));assert.equal(r.city.tonics,1);
 r.mode='car';assert.equal(drinkTonic(r,w).ok,false);assert.equal(r.city.tonics,1);
});
test('The Nearby chooser includes conversations and work at the same location without discarding either',()=>{
 const s=newState();s.mode='foot';s.x=23;s.z=60;const entries=nearbyChoices(s,w);
 assert.ok(entries.some(p=>p.kind==='talk'&&p.id==='ada'));assert.ok(entries.some(p=>p.kind==='work'&&p.id==='tonic'));assert.ok(entries.some(p=>p.kind==='service'&&p.id==='brewing'));
 s.life.inside='workshop';assert.ok(!nearbyChoices(s,w).some(p=>p.id==='ada'||p.id==='tonic'));
});
test('Guide search and tracking are pure observation except for the requested marker, never actor movement',()=>{
 const s=newState(),before=JSON.stringify(s);const entries=guideEntries(s,w);assert.equal(JSON.stringify(s),before);assert.ok(entries.length>=36);
 assert.equal(setTracked(s,'evil','__proto__'),false);assert.ok(setTracked(s,'work','tonic'));const at=JSON.stringify([s.x,s.z,s.vehicle,s.life.quests,s.credits]);
 const target=cityTarget(s,w);assert.ok(target.hint.includes('doorway'));assert.equal(JSON.stringify([s.x,s.z,s.vehicle,s.life.quests,s.credits]),at);
});
test('Tracked basement and locked-garden destinations explain stairs and prerequisites',()=>{
 const s=newState();setTracked(s,'work','marks');const t=cityTarget(s,w);assert.ok(t.hint.includes('basement'));assert.equal(t.x,w.rooms[0].stairs.x);
 setTracked(s,'service','rest');assert.ok(cityTarget(s,w).hint.includes('gate'));
});
test('Each new lamppost and service has an actual unblocked foot approach within its allowed range',()=>{
 const s=newState();s.mode='foot';s.life.flags.garden=true;
 for(const p of [...LAMPS,...SERVICES]){let ok=false;for(let i=0;i<32;i++){const x=p.x+Math.cos(i*Math.PI/16)*1.5,z=p.z+Math.sin(i*Math.PI/16)*1.5;if(!blocked(x,z,.33,w,s))ok=true;}assert.ok(ok,p.id);}
});
test('A resident invitation never pauses, moves or pays the player, and is not repeated on reload',()=>{
 const s=newState();s.x=10;s.z=86;const before=s.credits;s.city.calloutDelay=0;ticks(s,1);assert.equal(s.city.callout?.name,'Tomas');assert.equal(s.credits,before);assert.ok(s.city.invited.includes('cart'));
 const r=newState(readSave(JSON.stringify(saveData(s)),w));r.x=10;r.z=86;r.city.calloutDelay=0;ticks(r,1);assert.equal(r.city.callout,null);
});
test('All authored gesture values are finite, deterministic and independent of render delta',()=>{
 for(const motion of ['idle','walk','ride','work','wave','guard','strike','listen'])for(const time of [0,4,1e6]){const p=poseAt(time,{motion,speed:6,phase:2});assert.deepEqual(p,poseAt(time,{motion,speed:6,phase:2}));assert.ok(Object.values(p).every(x=>Number.isFinite(x)&&Math.abs(x)<3));}
 assert.notEqual(poseAt(1,{motion:'wave'}).right,poseAt(1,{motion:'work'}).right);
});

test('Clock persistence is quantized so the game does not rewrite saves every rendered frame',()=>{const s=newState();let changes=0,old=JSON.stringify(saveCity(s.city));for(let i=0;i<120;i++){ticks(s,1);const next=JSON.stringify(saveCity(s.city));if(next!==old){changes++;old=next;}}assert.ok(changes<=5,'At most five clock-save changes in two simulated seconds, not 120');});
