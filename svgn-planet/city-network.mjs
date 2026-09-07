/* Fictional local game state only; no network or device access. */
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
import {log,say,focus} from './city-shared.mjs';
export function scan(s,c){c.scan=18;c.selected=0;c.targetId=candidates(s,c)[0]?.id||null;say(s,'NETWORK VISION / H links the nearest highlighted device. Z cycles targets.');log(c,s,'scan');}
export function candidates(s,c){const f=focus(s,c);return [...CITY.devices,...c.vehicles.map(v=>({...v,kind:'vehicle',time:.8}))].filter(d=>distance(f.n,d.n)<(c.drone.active?18:14)).sort((a,b)=>distance(f.n,a.n)-distance(f.n,b.n));}
export function selectedDevice(s,c){if(c.scan<=0)return null;const nodes=candidates(s,c);return nodes.find(d=>d.id===c.targetId)||null;}
export function cycleDevice(s,c){const nodes=candidates(s,c),current=nodes.findIndex(d=>d.id===c.targetId);c.selected=nodes.length?(current+1)%nodes.length:0;c.targetId=nodes[c.selected]?.id||null;c.progress=0;c.hacking=null;}
export function applyHack(s,c,d){const f=focus(s,c);if(d.requires&&!c.power){say(s,'Gate needs the power junction first — or find another route.');return false;}
 if(d.kind==='power')c.power=true;
 if(d.kind==='gate')c.gate=true;
 if(d.kind==='camera')c.loop=24;
 if(d.kind==='traffic')c.red=18;
 if(d.kind==='speaker'){c.distraction=16;c.guards[0].lastSeen=[...d.n];c.guards[0].search=16;}
 if(d.kind==='vehicle')c.vehicles.find(v=>v.id===d.id).stopped=18;
 if(d.kind==='evidence'){
  if(!c.active||c.stage!==2){say(s,'Take the Waterfront File assignment before accessing the records.');return false;}
  c.stage=3;c.approach=c.drone.active?'drone':'on foot';log(c,s,'evidence',{approach:c.approach});
 }
 log(c,s,'hack',{id:d.id,remote:c.drone.active});say(s,d.kind==='evidence'?'Evidence secured. Record the quay report, then publish.':d.name+' linked.');c.lastHacked=d.id;return true;}
