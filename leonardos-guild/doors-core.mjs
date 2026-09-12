import {safeTown} from './frontier-core.mjs';
/* Open Doors: additive house commissions, actual floors and walkable city networks.
 * Renderer-independent. All interactions validate floor, proximity and progression.
 * No map action moves the player. The original save and missions remain intact. */
import {storyState,saveStories,makeStories,storySites,storyOptions,useStory,storyTarget,STORY_IDS} from './stories-core.mjs';
import {notify,stats,roomAt,done} from './life-core.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const FLOOR_NAMES={'-2':'Undercity passages','-1':'Cellar',0:'Ground floor',1:'Upper workshop',2:'Attic',3:'Rooftop walks'};
export const TRADES=[
 {name:'Bookbinder',job:'A book that will last',clue:'Fold the leaves, sew the spine, then press the cover.',choices:['Fold, sew, press','Press, cut, soak','Soak, paint, tear'],object:'Binding press',result:'A bound neighborhood history'},
 {name:'Clockmaker',job:'A clock for the square',clue:'Seat the axle before the gear; fit the hand last.',choices:['Hand, gear, axle','Axle, gear, hand','Gear, hand, axle'],object:'Brass escapement',result:'A calibrated clock hand'},
 {name:'Weaver',job:'Cloth for the winter',clue:'The sample alternates over, under, over.',choices:['Under, under, over','Over, over, under','Over, under, over'],object:'Oak handloom',result:'A length of patterned sailcloth'},
 {name:'Luthier',job:'The missing harmony',clue:'The notation reads LOW, MIDDLE, HIGH. Sound is optional.',choices:['Low, middle, high','High, low, middle','Middle, high, low'],object:'String instrument bench',result:'A tuned neighborhood viol'},
 {name:'Herbalist',job:'A remedy for weary feet',clue:'Crush mint, add warm water, then strain the leaves.',choices:['Strain, boil, crush','Crush, steep, strain','Burn, dry, seal'],object:'Mortar and kettle',result:'A sealed restorative sachet'},
 {name:'Potter',job:'Vessels for the inn',clue:'Center the clay, raise the sides, then fire the pot.',choices:['Fire, center, raise','Raise, fire, center','Center, raise, fire'],object:'Potter wheel',result:'A fired blue-glazed cup'},
 {name:'Cartographer',job:'The road not yet drawn',clue:'Find north, measure the distance, then ink the route.',choices:['Orient, measure, ink','Ink, guess, fold','Fold, erase, orient'],object:'Survey drawing table',result:'An annotated city map'},
 {name:'Lens Grinder',job:'Light through clear glass',clue:'Shape the blank, polish the lens, then test the focus.',choices:['Test, shape, polish','Shape, polish, test','Polish, test, shape'],object:'Lens grinding bench',result:'A tested observation lens'}
];
const NAMES=['Alessia','Pietro','Giulia','Matteo','Caterina','Tomaso','Renata','Lorenzo','Bianca','Silvio','Elena','Marco','Diana','Paolo','Rosa','Carlo'];
const keepIds=(a,valid,max=256)=>Array.isArray(a)?[...new Set(a.filter(v=>typeof v==='string'&&valid(v)))].slice(0,max):[];
export function freshDoors(raw=null){
 const d={version:1,stories:storyState(raw?.stories),level:0,room:null,homes:{},adventures:{},defeated:[],visits:[],tracked:null,enemies:[],rest:0,dodge:0,dodgeCD:0};
 if(!raw||raw.version!==1)return d;
 const home=id=>/^(workshop|apothecary|inn|hall|smith|observatory|residence-home-\d+|residence-garden-home-\d+)$/.test(id);
 for(const [id,n]of Object.entries(raw.homes||{}).slice(0,64))if(home(id)&&Number.isInteger(n)&&n>=0&&n<=4)d.homes[id]=n;
 for(const [id,n]of Object.entries(raw.adventures||{}).slice(0,8))if(ADVENTURE_IDS.includes(id)&&Number.isInteger(n)&&n>=0&&n<=6)d.adventures[id]=n;
 d.defeated=keepIds(raw.defeated,id=>/^guild-rival-\d+$/.test(id),32);
 d.visits=keepIds(raw.visits,id=>/^.+:(-2|-1|0|1|2|3)$/.test(id)&&id.length<70,256);
 if(raw.tracked&&((raw.tracked.kind==='home'&&home(raw.tracked.id))||(raw.tracked.kind==='adventure'&&ADVENTURE_IDS.includes(raw.tracked.id))||(raw.tracked.kind==='story'&&STORY_IDS.includes(raw.tracked.id))))d.tracked={kind:raw.tracked.kind,id:raw.tracked.id};
 return d;
}
export function saveDoors(d){return {version:1,stories:saveStories(d.stories),homes:{...d.homes},adventures:{...d.adventures},defeated:[...d.defeated],visits:[...d.visits],tracked:d.tracked?{...d.tracked}:null};}
export function doorLevel(s){return s.doors?.level|| (s.life?.inside?-1:0);}
export function doorElevation(s){const n=doorLevel(s);return n===3?15:n<0?n*5:n*3.8;}
export function doorLocation(s,w){const level=doorLevel(s),room=s.doors?.room||s.life?.inside||roomAt(s,w)?.id||null;return {level,room};}
export function expandDoors(w){
 for(const h of w.houses){
  if(h.room)continue;
  h.room='residence-'+h.id;
  const r={id:h.room,name:NAMES[Number(h.id.match(/\d+/)?.[0]||0)%NAMES.length]+"'s "+TRADES[w.rooms.length%8].name+' House',x:h.x,z:h.z,side:h.side,kind:'residence',hx:h.w/2,hz:h.d/2,door:{x:h.x-h.side*(h.w/2+.7),z:h.z},stairs:{x:h.x+h.side*(h.w/2-2),z:h.z-4}};
  w.rooms.push(r);w.colliders=w.colliders.filter(c=>c.id!==h.id);
  const front=h.x-h.side*(r.hx-.2),back=h.x+h.side*(r.hx-.2);
  w.colliders.push({id:h.id,x:back,z:h.z,hx:.25,hz:r.hz},{id:r.id+'-north',x:h.x,z:h.z-r.hz+.2,hx:r.hx,hz:.25},{id:r.id+'-south',x:h.x,z:h.z+r.hz-.2,hx:r.hx,hz:.25});
  for(const sign of [-1,1])w.colliders.push({id:r.id+'-door-wall',x:front,z:h.z+sign*(r.hz+1.6)/2,hx:.25,hz:(r.hz-1.6)/2});
  w.colliders.push({id:r.id+'-counter',x:h.x,z:h.z+r.hz-1.1,hx:2.7,hz:.55});
 }
 w.doorHomes=w.rooms.map((r,i)=>({...r,index:i,resident:NAMES[i%NAMES.length],trade:TRADES[i%TRADES.length],upperStair:{x:r.x+r.side*(r.hx-2),z:r.z+2},desk:{x:r.x-r.side*1.5,z:r.z+1.5},station:{x:r.x,z:r.z-2},hatch:{x:r.x,z:r.z}}));
 // Broad deck strips meet every rooftop and every cellar. Walking the graph is
 // intentional: no menu teleportation, invisible gaps or mission-gate bypass.
 const rows=[...new Set(w.houses.map(h=>h.z))].sort((a,b)=>a-b),cols=[...new Set(w.houses.map(h=>h.x))].sort((a,b)=>a-b);
 w.doorPaths=[];
 for(const z of rows)w.doorPaths.push({x:(cols[0]+cols.at(-1))/2,z,hx:(cols.at(-1)-cols[0])/2+2,hz:2});
 for(const x of cols)w.doorPaths.push({x,z:(rows[0]+rows.at(-1))/2,hx:2,hz:(rows.at(-1)-rows[0])/2+2});
 w.doorPaths.push(...w.rooms.map(r=>({x:r.x,z:r.z,hx:r.hx-.4,hz:r.hz-.4,roof:true})));
 w.doorAdventures=makeAdventures(w);w.stories=makeStories(w);
 w.doorEnemies=[];
 const rowsCombat=[98,215,293];
 for(const layer of [-2,3])for(let i=0;i<6;i++){const home=w.doorHomes.filter(r=>r.z===rowsCombat[i%3])[i%2]||w.doorHomes[8+i];w.doorEnemies.push({id:'guild-rival-'+w.doorEnemies.length,name:['Brass Mask Scout','Canal Brigand','Rooftop Duelist'][i%3],role:i%3,level:layer,room:null,x:home.x,z:home.z+4,hp:[60,110,80][i%3]});}
 for(const home of w.doorHomes.filter(r=>r.kind==='residence'&&r.z<400).slice(-6))w.doorEnemies.push({id:'guild-rival-'+w.doorEnemies.length,name:'Attic Intruder',role:0,level:2,room:home.id,x:home.x,z:home.z-3,hp:60});
 return w;
}
export const ADVENTURE_IDS=['survey','beacons','water','masks','crafts','stars'];
function makeAdventures(w){
 const home=(i,l=1)=>{const h=w.doorHomes[i];return {x:h.station.x,z:h.station.z,room:h.id,level:l};};
 const net=(i,l)=>{const h=w.doorHomes[i];return {x:h.x,z:h.z,room:null,level:l};};
 const start={...home(0,0),x:w.doorHomes[0].x,z:w.doorHomes[0].z-2};
 const task=(name,p,text,extra={})=>({name,...p,text,...extra});
 return [
 {id:'survey',name:'The Missing Survey Pages',intro:'A wind scattered a survey through the houses. Read the upper room notes and assemble a new route.',xp:160,florins:65,stages:[task('Workshop commission board',start,'Accept Leonardo\'s survey recovery.'),task('Bookbinder\'s survey note',home(6,1),'Recover the north-facing survey page.'),task('Clockmaker\'s attic cabinet',home(9,2),'Recover the page describing the cross-streets.'),task('Workshop commission board',start,'Return both pages and complete the survey.')]},
 {id:'beacons',name:'Signals Above the Streets',intro:'Restore three roof signals. Climb any house, then follow the connected plank bridges.',xp:180,florins:70,stages:[task('Workshop commission board',start,'Accept the rooftop signal repair.'),task('Western roof signal',net(8,3),'Fit the western reflector.'),task('Central roof signal',net(1,3),'Align the central reflector.'),task('Eastern roof signal',net(2,3),'Light the eastern signal.'),task('Workshop commission board',start,'Report the working rooftop signal line.')]},
 {id:'water',name:'The Water Under Vinci',intro:'A second water system links the cellars. Reach the valves on foot; no boat or payment is required.',xp:180,florins:70,stages:[task('Workshop commission board',start,'Accept the undercity water survey.'),task('Western sluice',net(7,-2),'Clear the western drain grate.'),task('Central sluice',net(4,-2),'Turn the central brass valve.'),task('Eastern sluice',net(2,-2),'Restore the eastern water pressure.'),task('Workshop commission board',start,'Return the completed water survey.')]},
 {id:'masks',name:'The Brass Mask Trail',intro:'Rivals hide in the connected passages. Defend yourself, find their marked cache, and bring back evidence.',xp:220,florins:90,stages:[task('Workshop commission board',start,'Accept the Brass Mask investigation.'),task('Abandoned cache',net(10,-2),'Recover a mask and the smuggler\'s manifest.',{wins:2}),task('Roof lookout notebook',net(7,3),'Collect the lookout\'s notebook.',{wins:4}),task('Workshop commission board',start,'Deliver the evidence, not an accusation.')]},
 {id:'crafts',name:'A Guild in Every Street',intro:'Finish household commissions rather than collecting empty map markers. Each home has its own work upstairs.',xp:240,florins:100,stages:[task('Workshop commission board',start,'Accept the neighborhood guild charter.'),task('Workshop commission board',start,'Report three completed household commissions.',{homes:3}),task('Workshop commission board',start,'Report eight completed household commissions.',{homes:8}),task('Workshop commission board',start,'Bring the completed neighborhood charter.',{homes:12})]},
 {id:'stars',name:'The Astronomer\'s Correspondence',intro:'The northern conservatory remains behind its original charter and pump quest. Its upstairs records finish this new research.',xp:210,florins:85,stages:[task('Workshop commission board',start,'Accept the astronomer\'s correspondence.'),task('Upper lens notebook',home(1,1),'Copy Ada\'s notes about glass and light.'),task('Conservatory correspondence',home(5,1),'Study Sofia\'s upper-room correspondence.'),task('Conservatory attic chart',home(5,2),'Complete the chart in the observatory attic.'),task('Workshop commission board',start,'Return the correspondence to Leonardo.')]} 
 ];
}
export function inDoorSpace(s,p,w){
 const l=doorLocation(s,w);return l.level===p.level&&(p.level===3||p.level===-2||l.room===p.room)&&(!(p.z>407)||s.life.flags.garden);
}
export function networkContains(w,x,z,r=.33){return w.doorPaths.some(p=>Math.abs(x-p.x)<=p.hx-r&&Math.abs(z-p.z)<=p.hz-r);}
export function doorsBlocked(s,w,x,z,r){
 const level=doorLevel(s);if(level===3||level===-2){if(!s.life.flags.garden&&z>404.5)return true;return !networkContains(w,x,z,r);}
 const room=w.rooms.find(r=>r.id===(s.doors.room||s.life.inside));return !room||Math.abs(x-room.x)>room.hx-r-.4||Math.abs(z-room.z)>room.hz-r-.4;
}
function site(id,name,pos,action,detail=''){return {id,name,...pos,action,detail};}
export function doorSites(s,w){
 const out=[],l=doorLocation(s,w);
 for(const h of w.doorHomes){
  const base={room:h.id,level:l.level};
  if(l.room===h.id&&![3,-2].includes(l.level)){
   if(l.level===0){
    out.push(site('desk:'+h.id,h.name+' / '+h.trade.job,{...base,...h.desk},'home',h.trade.result));
    out.push(site('up:'+h.id,'Staircase to the upper workshop',{...base,...h.upperStair},'up','Climb to a real furnished upper floor.'));
    if(!h.cellar)out.push(site('down:'+h.id,'Staircase to the cellar',{...base,...h.stairs},'down','A cellar and a passage into the undercity.'));
   }else if(l.level===1||l.level===2){
    out.push(site('work:'+h.id,l.level===1?h.trade.object:'Attic finishing cabinet',{...base,...h.station},'home',h.trade.clue));
    out.push(site('up:'+h.id,l.level===1?'Staircase to the attic':'Roof access ladder',{...base,...h.upperStair},'up'));
    out.push(site('down:'+h.id,l.level===1?'Staircase to the ground floor':'Staircase to the upper workshop',{...base,...h.stairs},'down'));
   }else if(l.level===-1){
    if(!s.life.inside)out.push(site('up:'+h.id,'Staircase back to the ground floor',{...base,...h.stairs},'up'));
    out.push(site('tunnel:'+h.id,'Open the undercity passage',{...base,...h.hatch},'tunnel','A continuous walk beneath the same city.'));
    out.push(site('cellar:'+h.id,'Read the cellar route ledger',{...base,x:h.x,z:h.z-2},'read','The roof bridges follow the same connected routes as these passages. The northern gate still needs its charter and pump.'));
   }
  }
  if(l.level===3)out.push(site('roofexit:'+h.id,'Descend into '+h.name,{level:3,room:null,...h.upperStair},'roofexit'));
  if(l.level===-2)out.push(site('cellexit:'+h.id,'Climb into '+h.name+' cellar',{level:-2,room:null,...h.hatch},'cellexit'));
 }
 for(const q of w.doorAdventures){const n=s.doors.adventures[q.id]||0;if(n>=q.stages.length)continue;const p=q.stages[n];out.push(site('adventure:'+q.id,q.name+' / '+p.name,p,'adventure',p.text));}
 out.push(...storySites(s,w));
 return out.filter(p=>inDoorSpace(s,p,w));
}
export function nearbyDoors(s,w){if(s.mode!=='foot'||Math.abs(s.speed)>1.7)return [];return doorSites(s,w).filter(p=>dist(s,p)<3.2).sort((a,b)=>dist(s,a)-dist(s,b));}
export function doorOptions(s,w,p){
 if(p.action==='story')return storyOptions(s,w,p);
 if(p.action==='home'){
  const h=w.doorHomes.find(h=>h.id===p.room),n=s.doors.homes[h.id]||0,l=doorLevel(s);
  if(l===0&&n===0)return [{id:'accept',text:'Accept household commission'}];
  if(l===1&&n===1)return h.trade.choices.map((text,i)=>({id:'choice:'+i,text}));
  if(l===2&&n===2)return [{id:'finish',text:'Inspect and finish '+h.trade.result.toLowerCase()}];
  if(l===0&&n===3)return [{id:'report',text:'Deliver the finished work (+60 XP / +25 florins)'}];
  if(l===0&&n===4)return [{id:'rest',text:'Rest with your neighbor (health and focus)'}];
  return [{id:'read',text:n===1?'Read the instructions; work upstairs':n===2?'The work is ready for finishing in the attic':n===3?'Return to the household desk on the ground floor':'Read the household workshop notes'}];
 }
 return [{id:'use',text:p.action==='adventure'?p.detail:p.name}];
}
export function homeInstruction(h,n){return n===0?'Meet the resident at the ground-floor desk.':n===1?'Use the workbench upstairs. '+h.trade.clue:n===2?'Finish the work at the attic cabinet.':n===3?'Return to the ground-floor desk for your reward.':'Completed. This household offers a place to rest.';}
function transition(s,w,h,level){
 s.life.inside=null;s.doors.room=[-2,3,0].includes(level)?null:h.id;s.doors.level=level;
 if(level===-1&&h.cellar){s.life.inside=h.id;s.doors.room=null;s.doors.level=0;}
 const p=level===3?h.upperStair:level===-2?h.hatch:level===0?h.upperStair:level===-1?h.hatch:h.stairs;
 s.x=p.x;s.z=p.z+.7;s.yaw=0;s.speed=s.lift=s.vy=0;
 notify(s,h.name+' / '+FLOOR_NAMES[level]+'; X on controller or G shows nearby actions.','doors-transition',{room:h.id,level});
 return {ok:true,close:true,text:s.toast};
}
export function useDoor(s,w,id,action){
 const p=nearbyDoors(s,w).find(p=>p.id===id);if(!p||!doorOptions(s,w,p).some(a=>a.id===action))return {ok:false,text:'Stop on foot beside this interaction, on its correct floor.'};
 if(p.action==='story')return useStory(s,w,id,action);
 const h=w.doorHomes.find(h=>h.id===(p.room||id.split(':')[1]));
 if(p.action==='up')return transition(s,w,h,doorLevel(s)+1);
 if(p.action==='down')return transition(s,w,h,doorLevel(s)-1);
 if(p.action==='roofexit')return transition(s,w,h,2);
 if(p.action==='tunnel')return transition(s,w,h,-2);
 if(p.action==='cellexit'){
  if(h.id==='inn'&&!done(s.life,'cat'))return {ok:false,text:'Beatrice keeps this cellar locked until The Missing Copper Cat is complete. Use another exit.'};
  return transition(s,w,h,-1);
 }
 if(p.action==='read')return {ok:true,text:p.detail};
 if(p.action==='adventure'){
  const q=w.doorAdventures.find(q=>q.id===id.split(':')[1]),n=s.doors.adventures[q.id]||0,stage=q.stages[n];
  if(stage.wins&&s.doors.defeated.length<stage.wins)return {ok:false,text:'Defend yourself against '+stage.wins+' rivals first. Current rivals yielding: '+s.doors.defeated.length+'. You may retreat and return.'};
  const completed=Object.values(s.doors.homes).filter(n=>n===4).length;
  if(stage.homes&&completed<stage.homes)return {ok:false,text:'Complete '+stage.homes+' household commissions first. Completed: '+completed+'.'};
  s.doors.adventures[q.id]=n+1;s.doors.tracked={kind:'adventure',id:q.id};
  if(n+1===q.stages.length){s.life.xp=Math.min(50000,s.life.xp+q.xp);s.credits+=q.florins;notify(s,q.name+' complete / +'+q.xp+' XP / +'+q.florins+' florins','doors-adventure-complete',{id:q.id});}
  else notify(s,q.name+' / '+q.stages[n+1].text,'doors-adventure-stage',{id:q.id,stage:n+1});
  return {ok:true,text:s.toast};
 }
 if(p.action==='home'){
  const n=s.doors.homes[h.id]||0;
  if(action==='read')return {ok:true,text:homeInstruction(h,n)};
  if(action==='rest'){
   if(s.doors.rest>0)return {ok:false,text:'Your next rest is available after '+Math.ceil(s.doors.rest)+' seconds of active play.'};
   s.health=stats(s).maxHealth;s.life.focus=stats(s).maxFocus;s.doors.rest=60;return {ok:true,text:'Your neighbor shares a meal. Health and focus restored.'};
  }
  if(action.startsWith('choice:')&&Number(action.slice(7))!==(h.index%8)%3)return {ok:false,text:'Read the workshop note: '+h.trade.clue+' No ingredients or money were lost.'};
  if(action==='finish'&&w.doorEnemies.some(e=>e.room===h.id&&e.level===2&&!s.doors.defeated.includes(e.id)))return {ok:false,text:'An intruder is guarding this attic. Brace with LT, strike with RT, or retreat downstairs.'};
  s.doors.homes[h.id]=n+1;s.doors.tracked={kind:'home',id:h.id};
  if(n===3){s.life.xp=Math.min(50000,s.life.xp+60);s.credits+=25;notify(s,h.trade.job+' complete at '+h.name+' / +60 XP / +25 florins','doors-home-complete',{id:h.id});}
  else notify(s,homeInstruction(h,n+1),'doors-home-stage',{id:h.id,stage:n+1});
  return {ok:true,text:s.toast};
 }
 return {ok:false,text:'That action is not available.'};
}
export function trackDoor(s,w,kind,id){if(kind==='story'){if(!STORY_IDS.includes(id))return false;s.doors.tracked={kind,id};return true;}if(kind==='home'&&!w.doorHomes.some(h=>h.id===id)||kind==='adventure'&&!w.doorAdventures.some(q=>q.id===id)||!['home','adventure'].includes(kind))return false;s.doors.tracked={kind,id};return true;}
export function doorTarget(s,w){
 const t=s.doors.tracked;if(!t)return null;let p,name;
 if(t.kind==='story'){p=storyTarget(s,w,t.id);if(!p)return null;name=p.name;}else if(t.kind==='home'){
  const h=w.doorHomes.find(h=>h.id===t.id);if(!h)return null;const n=s.doors.homes[h.id]||0;if(n===4)return null;
  const l=n===1?1:n===2?2:0;p={...(l?h.station:h.desk),room:h.id,level:l};name=h.trade.job+' / '+h.name;
 }else{const q=w.doorAdventures.find(q=>q.id===t.id),n=s.doors.adventures[t.id]||0;if(!q||n>=q.stages.length)return null;p=q.stages[n];name=q.name;}
 const l=doorLocation(s,w);let dest={...p};
 if(l.level!==p.level||p.room&&l.room!==p.room){
  const current=w.doorHomes.find(h=>h.id===l.room),target=w.doorHomes.find(h=>h.id===p.room)||w.doorHomes.reduce((a,h)=>dist(h,p)<dist(a,p)?h:a,w.doorHomes[0]);
  if(l.level===0){const h=p.level===0?target:current||target;dest={...(current&&current.id===h.id?(p.level<0?h.stairs:h.upperStair):h.door)};}
  else if(l.level===3||l.level===-2)dest={...(l.level===3?target.upperStair:target.hatch)};
  else if(current){
   // Network destinations have no room ID. Choose the next real transition
   // rather than sending the player downstairs and back up indefinitely.
   if(p.level===-2)dest={...(l.level===-1?current.hatch:current.stairs)};
   else if(p.level===3)dest={...(l.level<0?current.stairs:current.upperStair)};
   else dest={...(p.room===l.room&&p.level>l.level&&l.level>=0?current.upperStair:current.stairs)};
  }
 }
 return {...dest,name,level:p.level,room:p.room,hint:'Destination: '+FLOOR_NAMES[p.level]+(p.z>407&&!s.life.flags.garden?' / north garden charter and pump required':'')};
}
export function dodgeDoor(s){if(s.mode!=='foot'||s.doors.dodgeCD>0)return false;s.doors.dodge=.22;s.doors.dodgeCD=1.2;s.inv=Math.max(s.inv,.3);return true;}
export function hitDoorEnemy(s,w){
 const targets=s.doors.enemies.filter(e=>e.hp>0&&inDoorSpace(s,e,w)&&dist(s,e)<3.5).sort((a,b)=>dist(s,a)-dist(s,b));
 const e=targets[0];if(!e)return false;s.yaw=Math.atan2(e.x-s.x,e.z-s.z);e.hp=Math.max(0,e.hp-(s.upgraded?40:28));e.flash=.2;e.phase='stagger';e.timer=.45;
 if(!e.hp){if(!s.doors.defeated.includes(e.id)){s.doors.defeated.push(e.id);s.credits+=12;s.life.xp=Math.min(50000,s.life.xp+25);}notify(s,e.name+' yields. +25 XP / +12 florins.','doors-rival-yields',{id:e.id});}
 else notify(s,e.name+' / '+e.hp+' vitality. Watch for the raised staff.','doors-rival-hit',{id:e.id});
 return true;
}
export function doorsStep(s,w,dt){
 const d=s.doors;for(const key of ['rest','dodge','dodgeCD'])d[key]=Math.max(0,d[key]-dt);
 if(!d.enemies.length)d.enemies=w.doorEnemies.map(e=>({...e,homeX:e.x,homeZ:e.z,hp:d.defeated.includes(e.id)?0:e.hp,phase:'patrol',timer:0,flash:0}));
 const l=doorLocation(s,w),visit=(l.room||'network')+':'+l.level;if((l.room||l.level)&&!d.visits.includes(visit))d.visits.push(visit);
 if(safeTown(s)){for(const e of d.enemies){if(e.hp>0){e.phase='patrol';e.timer=0;e.x=e.homeX;e.z=e.homeZ;}}return;}
 for(const e of d.enemies){
  e.flash=Math.max(0,e.flash-dt);if(e.hp<=0||!inDoorSpace(s,e,w))continue;
  e.timer=Math.max(0,e.timer-dt);const near=dist(s,e);if(near>35)continue;
  if(e.phase==='windup'){
   if(e.timer===0){if(near<3&&s.inv<=0){const damage=s.guarding?2:e.role===1?18:10;s.health=Math.max(0,s.health-damage);s.inv=.65;notify(s,s.guarding?'Braced. Counter with RT / J.':'Rival strike! LT braces; B dodges.','doors-rival-strike',{id:e.id,damage});}e.phase='recover';e.timer=e.role===1?1.8:1.1;}
   continue;
  }
  if(e.timer>0)continue;
  if(near<2.8&&s.mode==='foot'){e.phase='windup';e.timer=e.role===1?1.1:.8;continue;}
  let tx=near<11?s.x:e.homeX+Math.sin(s.time*.4+e.homeZ)*1.5,tz=near<11?s.z:e.homeZ+Math.cos(s.time*.4)*1.5;
  const length=Math.hypot(tx-e.x,tz-e.z)||1,pace=dt*(near<11?(e.role===0?2.7:1.9):.8),dx=(tx-e.x)/length*pace,dz=(tz-e.z)/length*pace;
  const state={...s,doors:{...d,level:e.level,room:e.room},life:{...s.life,inside:null}};
  if(!doorsBlocked(state,w,e.x+dx,e.z,.35))e.x+=dx;if(!doorsBlocked(state,w,e.x,e.z+dz,.35))e.z+=dz;
  e.yaw=Math.atan2(tx-e.x,tz-e.z);e.phase=near<11?'chase':'patrol';
 }
}
