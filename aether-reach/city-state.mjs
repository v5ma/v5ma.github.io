/* Deterministic missions, civilian interaction and character growth.
 * No UI, renderer, random loot, backend or private narrative dependencies. */
import {PEOPLE,CITIZENS,CATS,THINGS,ATTRIBUTES,catPosition,citizenPose,DOCKS} from './city-world.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const MISSIONS=[
 {id:'cat',title:'A small missing citizen',giver:'mara',xp:70,credits:45,description:'Speak with Mara in the Copper Cup. Find Pip in Lantern Commons, then return.'},
 {id:'pumps',title:'Under the copper floor',giver:'nora',xp:100,credits:80,description:'Get Nora’s service key, descend the café stairs, recover a fuse and repair the pump.'},
 {id:'cargo',title:'The missing consignment',giver:'ada',xp:110,credits:100,description:'Ask Constable Ada about the missing cargo. Inspect the basement ledger and speak with Rook at Old Customs.'},
 {id:'permit',title:'An open sky',giver:'mayor',xp:80,credits:50,description:'Resolve the pump and cargo problems. Ask the mayor to open the Skywright hangar.'},
 {id:'resonance',title:'Roots, tide, then stars',giver:'sel',xp:110,credits:55,description:'Study with Sel in the conservatory. Touch its three glyphs in the order of the riddle, then return.'},
 {id:'airmail',title:'The first airmail',giver:'ivo',xp:150,credits:120,description:'After getting a permit, speak to Ivo. Fly the skiff to the Garden pad, deliver the parcel and return to him.'},
 {id:'company',title:'A table for two',giver:'mara',xp:0,credits:0,description:'After helping Mara and Nora, choose whether to share a friendly coffee or accept Mara’s optional date invitation. Both characters are adults.'},
 {id:'voices',title:'A city worth hearing',giver:'mayor',xp:140,credits:110,description:'Restore the original three district relays, then report to the mayor. The original broadcast ending remains.'}
];
const VALID_FLAGS=['cat-found','cellar-key','fuse','pump-fixed','ledger','coil-returned','permit','glyph-solved','mend','parcel','delivered','coffee','dating','friends'];
const strings=(v,allowed)=>[...new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'&&allowed.includes(x)):[])];
export function cleanCity(v){
 if(!v||typeof v!=='object'||Array.isArray(v))v={};
 const done=strings(v.done,MISSIONS.map(x=>x.id)),active=strings(v.active,MISSIONS.map(x=>x.id)).filter(x=>!done.includes(x));
 const flags=strings(v.flags,VALID_FLAGS),xp=Number.isFinite(v.xp)?clamp(Math.floor(v.xp),0,2000):0,skills={vigor:0,aviation:0,resonance:0};
 let remaining=Math.min(9,Math.floor(xp/100));
 for(const k of Object.keys(skills)){skills[k]=Number.isInteger(v.skills?.[k])?clamp(v.skills[k],0,Math.min(3,remaining)):0;remaining-=skills[k];}
 return {version:1,done,active,flags,xp,skills,glyphStep:Number.isInteger(v.glyphStep)?clamp(v.glyphStep,0,3):0,tracked:typeof v.tracked==='string'&&MISSIONS.some(m=>m.id===v.tracked)?v.tracked:null};
}
export function initCity(value){return cleanCity(value);}
export function levelInfo(s){const level=1+Math.min(9,Math.floor(s.city.xp/100)),spent=Object.values(s.city.skills).reduce((a,b)=>a+b,0);return {level,xp:s.city.xp,progress:s.city.xp%100,next:level>=10?null:level*100,points:level-1-spent};}
export const maxHealth=s=>100+(s.city?.skills.vigor||0)*10;
const has=(s,f)=>s.city.flags.includes(f),active=(s,id)=>s.city.active.includes(id),done=(s,id)=>s.city.done.includes(id);
function event(s,type,data={}){s.events.push({type,...data});}
function flag(s,f){if(!has(s,f))s.city.flags.push(f);}
function notify(s,text){event(s,'city-message',{text});}
function persist(s){event(s,'save');}
function begin(s,id){if(!done(s,id)&&!active(s,id)){s.city.active.push(id);s.city.tracked=id;notify(s,'Mission started: '+MISSIONS.find(m=>m.id===id).title);persist(s);}return true;}
function finish(s,id){
 if(done(s,id))return false;const m=MISSIONS.find(m=>m.id===id),old=levelInfo(s).level;
 s.city.done.push(id);s.city.active=s.city.active.filter(v=>v!==id);s.city.xp+=m.xp;s.kit.credits=Math.min(99999,s.kit.credits+m.credits);s.city.tracked=s.city.active[0]||null;
 event(s,'city-complete',{id,title:m.title,xp:m.xp,credits:m.credits});if(levelInfo(s).level>old)event(s,'level-up',{level:levelInfo(s).level});persist(s);return true;
}
export function trainAttribute(s,key){
 if(!Object.hasOwn(ATTRIBUTES,key)||levelInfo(s).points<1||s.city.skills[key]>=3)return false;
 s.city.skills[key]++;if(key==='vigor')s.p.health=Math.min(maxHealth(s),s.p.health+10);notify(s,ATTRIBUTES[key].name+' increased.');persist(s);return true;
}
export function castMend(s){
 if(!has(s,'mend')||s.won||s.p.energy<30||(s.cityMendCooldown||0)>0||s.p.health>=maxHealth(s))return false;
 s.p.energy-=30;s.p.health=Math.min(maxHealth(s),s.p.health+30+s.city.skills.resonance*5);s.cityMendCooldown=8;
 event(s,'city-spell',{name:'Mend'});return true;
}
export function missionHint(s,id=s.city.tracked){
 if(!id)return 'Meet Mara and Nora inside the Copper Cup, just west of the quay.';
 if(id==='cat')return has(s,'cat-found')?'Return to Mara at the Copper Cup.':'Find Pip behind the Lantern Commons buildings.';
 if(id==='pumps')return !has(s,'fuse')?'Down the café stairs: recover the ceramic fuse.':!has(s,'pump-fixed')?'Fit the fuse at the basement pump console.':'Report the repaired pump to Nora.';
 if(id==='cargo')return !has(s,'ledger')?'Inspect the cargo ledger in the café basement.':!has(s,'coil-returned')?'Speak with Rook inside Old Customs at the quay.':'Return the recovered coil to Constable Ada.';
 if(id==='permit')return 'Help Nora and Constable Ada, then speak to the mayor in Civic Hall.';
 if(id==='resonance')return has(s,'glyph-solved')?'Return to Sel to learn Mend.':'Conservatory glyphs: ROOT → TIDE → STAR.';
 if(id==='airmail')return has(s,'delivered')?'Return to Ivo in the Skywright hangar.':'Board the skiff at Skywright Yard. Land at the Garden pad and deliver to its receptacle.';
 if(id==='voices')return s.relays.size<3?'Restore the three original district relays.':'Return to Mayor Orin in Civic Hall.';
 return 'Speak with Mara about sharing a coffee.';
}
export function conversation(s,id){
 const n=PEOPLE.find(n=>n.id===id);if(!n)return null;const choices=[],add=(id,label)=>choices.push({id,label});let text='';
 if(id==='mara'){
  text=done(s,'cat')?'Pip has claimed the warmest chair. A place feels different when somebody comes back for you.':'Welcome to the Copper Cup. I used to count customers; lately I count who makes it home. Pip, my ginger cat, followed a delivery across the south bridge.';
  if(!done(s,'cat')){if(has(s,'cat-found'))add('finish-cat','Tell Mara that Pip is safe');else if(!active(s,'cat'))add('start-cat','I’ll look for Pip');else text+=' Try the quiet lane behind the Commons buildings.';}
  add('coffee','Buy restorative coffee · 15 credits');
  if(done(s,'cat')&&done(s,'pumps')&&!done(s,'company')){text+=' I close early today. We are both adults with a free evening. Would you like to share coffee—as friends, or as a date? No pressure either way.';add('friends','Coffee as friends sounds good');add('date','I would enjoy a date with you');}
  if(done(s,'company'))text+=has(s,'dating')?' Our date is still on. I’m glad we chose to make time for each other.':' There is always a place for a friend here.';
 }else if(id==='nora'){
  text=done(s,'pumps')?'Listen to that steady hum. You repaired the pump, not just its warning light.':'The café sits above a pump vault. I can unlock the service stair, but I need someone to fit a ceramic fuse below. Walk down carefully; the flight canopy does not belong indoors.';
  if(!done(s,'pumps')){if(has(s,'pump-fixed'))add('finish-pumps','The pump is running again');else if(!active(s,'pumps'))add('start-pumps','Take the service key and help');else text+=' The spare fuse is on the back worktable. The console is beside the north pipe.';}
 }else if(id==='ada'){
  text=done(s,'cargo')?'Cargo recovered; no one had to be hurt. The Watch serves the district, not the loudest person in it.':'A shipment of power coils vanished. There is a ledger in the pump vault beneath the café. Rook at Old Customs knows the salvage routes. Bring facts, not gunfire.';
  if(!done(s,'cargo')){if(has(s,'coil-returned'))add('finish-cargo','Return the coil and give your statement');else if(!active(s,'cargo'))add('start-cargo','Investigate the missing consignment');}
 }else if(id==='rook'){
  text='Salvage is not theft—unless the owner is still looking. Are you buying a story, or asking for one?';
  if(active(s,'cargo')&&has(s,'ledger')&&!has(s,'coil-returned')){text='That ledger has my mark. I took the coil because the hangar was going cold. I can return it. Tell Ada I came forward; do not turn this into a fight.';add('recover-coil','Accept the returned coil without a fight');}
  if(has(s,'coil-returned'))text='You have the coil. Let Ada decide what happens next.';
 }else if(id==='mayor'){
  text='Lantern Commons belongs to the same city as those five old platforms. Its bridges are public. The hangar is closed until the power and missing-cargo problems are settled.';
  if(!done(s,'permit')){if(done(s,'pumps')&&done(s,'cargo'))add('finish-permit','Request the Skywright permit');else add('start-permit','Ask how to reopen the hangar');}
  else text='The hangar is open. Ivo has a working courier skiff and a job for you. A licence should create a route, not a wall.';
  if(!done(s,'voices')){if(s.relays.size===3)add('finish-voices','Report that all three relays are restored');else if(!active(s,'voices'))add('start-voices','Help reconnect the original districts');}
 }else if(id==='sel'){
  text=has(s,'mend')?'Resonance is not endless energy. Mend spends suit energy to restore health. Use V on desktop, or the Mend button; let it recover between casts.':'I study how this city answers a careful touch. Try the three glyphs in the order of a seed’s journey: roots before rainwater, then stars above the leaves.';
  if(!done(s,'resonance')){if(has(s,'glyph-solved'))add('finish-resonance','Show Sel the completed pattern');else if(!active(s,'resonance'))add('start-resonance','Study the resonance glyphs');}
  add('tonic','Buy a restoring tonic · 25 credits');
 }else if(id==='ivo'){
  text=has(s,'parcel')?'Fly the courier skiff to the Garden landing pad. Space rises, C descends, movement steers, E parks only on a pad. Other devices use jump to rise and reverse to descend.':'You have a permit, so let’s use it. The Kestrel skiff is parked outside. This is a flying vehicle, not a fast-travel menu. Take a parcel to the Gardens and come back.';
  if(!done(s,'airmail')){if(has(s,'delivered'))add('finish-airmail','Report the successful airmail delivery');else if(has(s,'permit')&&!active(s,'airmail'))add('start-airmail','Take the airmail parcel');}
  if(done(s,'airmail'))text='A proper delivery, and you brought yourself back. The skiff stays available for free exploration.';
 }else if(id==='delivery'){
  text=has(s,'delivered')?'The parcel arrived in one piece. Ivo will want to hear you made it.':'Our airmail receptacle is beside the marked Garden landing pad. The quickest route is not always a straight line through a building.';
 }
 return {...n,text,choices};
}
export function cityChoice(s,id,choice,clear=()=>true){
 const n=PEOPLE.find(n=>n.id===id);
 if(!n||dist(s.p,n)>3.35||!clear({x:s.p.x,y:s.p.y+1.25,z:s.p.z},{x:n.x,y:n.y+1.25,z:n.z}))return false;
 if(!conversation(s,id)?.choices.some(c=>c.id===choice))return false;
 if(choice.startsWith('start-')){const m=choice.slice(6);begin(s,m);if(m==='pumps')flag(s,'cellar-key');if(m==='airmail')flag(s,'parcel');persist(s);return true;}
 if(choice==='finish-cat'){flag(s,'cat-found');return finish(s,'cat');}
 if(choice==='finish-pumps')return finish(s,'pumps');
 if(choice==='finish-cargo')return finish(s,'cargo');
 if(choice==='finish-permit'){flag(s,'permit');return finish(s,'permit');}
 if(choice==='finish-resonance'){flag(s,'mend');return finish(s,'resonance');}
 if(choice==='finish-airmail')return finish(s,'airmail');
 if(choice==='finish-voices')return finish(s,'voices');
 if(choice==='recover-coil'){flag(s,'coil-returned');notify(s,'The coil is returned voluntarily. Bring it to Constable Ada.');persist(s);return true;}
 if(choice==='friends'||choice==='date'){flag(s,choice==='date'?'dating':'friends');flag(s,'coffee');finish(s,'company');notify(s,choice==='date'?'Mara smiles: “Then it’s a date.”':'A friendship, and a warm place to return.');return true;}
 if(choice==='coffee'||choice==='tonic'){const price=choice==='coffee'?15:25;if(s.kit.credits<price)return false;s.kit.credits-=price;s.p.health=Math.min(maxHealth(s),s.p.health+(choice==='coffee'?25:50));if(choice==='tonic')s.p.energy=100;notify(s,choice==='coffee'?'Warm coffee. Health restored.':'A restoring tonic. Health and energy replenished.');persist(s);return true;}
 return false;
}
export function cityNearby(s,clear=()=>true){
 if(s.p.rail||s.p.gliding)return null;
 if(s.p.vehicle)return {type:'city-vehicle',id:'skiff',label:'E · Park at a landing pad / SPACE rise / C descend'};
 const entries=[
  ...PEOPLE.map(n=>({...n,type:'city-person',label:'E · Talk to '+n.name})),
  ...CATS.map(n=>({...n,...catPosition(n,s),type:'city-cat',label:'E · '+(n.id==='pip'&&active(s,'cat')&&!has(s,'cat-found')?'Find Pip':'Pet '+n.name)})),
  ...CITIZENS.map(n=>({...n,...citizenPose(n,s.time),type:'city-citizen',label:'E · Greet '+n.name})),
  ...THINGS.filter(n=>n.id==='pump-fuse'?!has(s,'fuse'):true).map(n=>({...n,type:'city-object',label:'E · '+n.name})),
  {...s.skiff,type:'city-vehicle',id:'skiff',label:has(s,'permit')?'E · Pilot the Kestrel courier skiff':'Kestrel skiff · a Skywright permit is required'}
 ];
 let nearest=null;for(const n of entries){const d=dist(s.p,n);if(d>2.65||nearest&&nearest.distance<=d)continue;if(!clear({x:s.p.x,y:s.p.y+1.1,z:s.p.z},{x:n.x,y:n.y+1.1,z:n.z}))continue;nearest={...n,distance:d};}return nearest;
}
export function cityInteract(s,n){
 if(n.type==='city-person'){event(s,'city-talk',{id:n.id});return true;}
 if(n.type==='city-citizen'){notify(s,n.id==='watch-patrol'?'The Watch: “Follow the evidence. Help your neighbours.”':'“The south bridge is open. Try the café, the Watch or Civic Hall.”');return true;}
 if(n.type==='city-cat'){
  if(n.id==='pip'&&active(s,'cat')&&!has(s,'cat-found')){flag(s,'cat-found');notify(s,'Pip is safe. A porter takes him home while you return to Mara.');persist(s);}else notify(s,n.name+' leans into your hand and purrs.');event(s,'cat-pet',{id:n.id});return true;
 }
 if(n.type!=='city-object')return false;
 if(n.id==='pump-fuse'){if(!active(s,'pumps')){notify(s,'Ask Nora before removing a service fuse.');return true;}flag(s,'fuse');notify(s,'Ceramic fuse collected. Fit it at the main pump console.');}
 else if(n.id==='pump-valve'){if(!has(s,'fuse')){notify(s,'The pump needs its ceramic fuse.');return true;}flag(s,'pump-fixed');notify(s,'The pump comes back to life. Return to Nora.');}
 else if(n.id==='cargo-ledger'){if(!active(s,'cargo')){notify(s,'The ledger records a missing consignment. Constable Ada should hear about this.');return true;}flag(s,'ledger');notify(s,'The ledger carries Rook’s salvage mark. Ask him at Old Customs.');}
 else if(n.id.startsWith('glyph-')){
  if(!active(s,'resonance')){notify(s,has(s,'mend')?'The glyph answers your touch.':'Ask Sel to teach you the pattern first.');return true;}
  const order=['glyph-root','glyph-tide','glyph-star'];s.city.glyphStep=n.id===order[s.city.glyphStep]?s.city.glyphStep+1:(n.id===order[0]?1:0);
  if(s.city.glyphStep===3){flag(s,'glyph-solved');notify(s,'The three glyphs resonate together. Return to Sel.');}else notify(s,'Resonance pattern '+s.city.glyphStep+'/3. Roots, tide, then stars.');
 }else if(n.id==='mailbox-garden'){
  if(!has(s,'parcel')){notify(s,'Ivo handles airmail parcels at the Skywright hangar.');return true;}
  if(!s.cityFlightArrived&&!has(s,'delivered')){notify(s,'This delivery needs an actual skiff arrival at the Garden pad.');return true;}
  flag(s,'delivered');notify(s,'Garden airmail delivered. Return to Ivo.');
 }else return false;
 persist(s);return true;
}
export function cityTick(s,dt){s.cityMendCooldown=Math.max(0,(s.cityMendCooldown||0)-dt);}
export function skiffDock(p){return DOCKS.find(d=>Math.hypot(d.x-p.x,d.z-p.z)<4.2&&Math.abs(d.y-p.y)<.45)||null;}
