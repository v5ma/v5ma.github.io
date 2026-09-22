import {HIGHLINE_FLOORS,HIGHLINE_WALLS,HIGHLINE_MAX_Y} from './highline-layout.mjs';
import {freshWatch,parseWatch,watchRuntime,watchAction,advanceWatch,watchBlocks} from './watch.mjs';
import {freshCampaign,parseCampaign,campaignState,campaignRuntime,campaignAction,campaignInteract,advanceCampaign,campaignBlocks,campaignCanGlide} from './campaign.mjs';
import {freshCity,parseCity,cityInteract,missionGoal} from './city.mjs';
/* Lantern Ward: one metre-space simulation for desktop and native spatial XR. */
import {advanceMarket,marketActor,marketBlocks,marketState,requestPass,resetMarket} from './market.mjs';
export const VERSION='0.15.0', CHAPTER='lantern-ward-01', LAYOUT=1;
export const SAVE_KEY='svgn.lantern-ward.v1';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const inside=(x,z,r,p=0)=>x>=r.x-r.w/2-p&&x<=r.x+r.w/2+p&&z>=r.z-r.d/2-p&&z<=r.z+r.d/2+p;
export const canal={x:-.5,z:1,w:5,d:28};
// Floor definitions are used by BOTH collision and rendering. Ramps get visible treads.
export const floors=[
 {id:'west-bank',x:-13.5,z:0,w:21,d:42,y:0},
 {id:'east-bank',x:13,z:0,w:22,d:42,y:0},
 {id:'north-quay',x:0,z:-17,w:8,d:8,y:0},
 {id:'depot-quay',x:0,z:18,w:8,d:6,y:0},
 {id:'print-stair',x:-12.5,z:1,w:3,d:8,y:4.4,slope:-.55,stairs:true},
 {id:'drying-terrace',x:-11.5,z:-4.5,w:11,d:3,y:4.4},
 // Real shared landing closes the collision gap between the arcade stair and terrace.
 {id:'arcade-upper-landing',x:-17.7,z:-4.25,w:3.0,d:1.35,y:4.4},
 {id:'roof-bridge',x:2,z:-3.5,w:17,d:3,y:4.4},
 {id:'loading-loft',x:15,z:-1,w:12,d:8,y:4.4},
 {id:'hoist-landing',x:8.4,z:.5,w:1.8,d:2,y:4.4},
 {id:'workshop-stair',x:19.5,z:6.5,w:3,d:8,y:4.4,slope:-.55,stairs:true},
 {id:'arcade-stair',x:-18.5,z:-8,w:3,d:8,y:0,slope:.55,stairs:true},
 {id:'maintenance-bed',x:-.5,z:1,w:5,d:28,y:-2,low:true},
 {id:'south-channel-steps',x:-.5,z:13,w:3,d:4,y:-2,slope:.5,low:true,stairs:true},
 {id:'north-channel-steps',x:-.5,z:-11,w:3,d:4,y:0,slope:-.5,low:true,stairs:true}
];
export const floorHeight=(f,z)=>f.y+(f.slope||0)*(z-(f.z-f.d/2));
// Walls remain solid when observer-facing parts are hidden in a diorama.
export const walls=[
 {id:'blue-wall-north',x:3,z:3.75,w:.45,d:25.5,y:0,h:3.55,color:0xb4c4ba},
 {id:'blue-wall-south',x:3,z:20.25,w:.45,d:1.5,y:0,h:3.55,color:0xb4c4ba},
 {id:'blue-door',x:3,z:18,w:.48,d:3,y:0,h:3.15,gate:true,color:0x2e83a7},
 {id:'print-west',x:-17.4,z:1,w:.4,d:12,y:0,h:4.35,color:0xdbb489},
 {id:'print-east',x:-7.7,z:1,w:.4,d:12,y:0,h:4.35,color:0xdbb489},
 {id:'print-front-left',x:-15.8,z:7,w:3.5,d:.4,y:0,h:3.7,cut:true,color:0xe4c6a1},
 {id:'print-front-right',x:-9,z:7,w:2.7,d:.4,y:0,h:3.7,cut:true,color:0xe4c6a1},
 {id:'print-back',x:-12.5,z:-6,w:10,d:.4,y:0,h:4.35,color:0xdbb489},
 {id:'workshop-east',x:21.3,z:3,w:.4,d:18,y:0,h:5.1,color:0xc5997f},
 {id:'workshop-west-north',x:9,z:-.6,w:.4,d:10.8,y:0,h:4.15,color:0xc5997f},
 {id:'workshop-west-south',x:9,z:10.6,w:.4,d:2.8,y:0,h:5.1,color:0xc5997f},
 {id:'workshop-front-left',x:11,z:12,w:4.4,d:.4,y:0,h:3.8,cut:true,color:0xd0ab90},
 {id:'workshop-front-right',x:20,z:12,w:3,d:.4,y:0,h:3.8,cut:true,color:0xd0ab90},
 {id:'workshop-back',x:15,z:-6,w:12,d:.4,y:0,h:5.1,color:0xc5997f},
 {id:'market-stall',x:-20.5,z:-1,w:3.4,d:7,y:0,h:2.5,color:0xb9806c},
 {id:'market-north',x:-10,z:-17.5,w:15,d:4,y:0,h:4.7,color:0x99b4ae},
 {id:'quiet-garden',x:18,z:-16.5,w:9,d:5,y:0,h:2.7,color:0x8da59d}
];
// Previously solid prototype blocks are now enterable rooms inside the same footprint.
export const interiorBuildings=[];
for(const id of ['market-stall','market-north','quiet-garden']){
 const at=walls.findIndex(w=>w.id===id),b=walls[at],t=.18,door=id==='market-stall'?1.5:2.6,side=(b.w-door)/2;
 interiorBuildings.push({...b,name:id==='market-stall'?'Market kitchen':id==='market-north'?'North storehouse':'Community greenhouse'});
 walls.splice(at,1,
  {...b,id,x:b.x-(door+side)/2,z:b.z+b.d/2-t/2,w:side,d:t,cut:true},
  {...b,id:id+'-door-right',x:b.x+(door+side)/2,z:b.z+b.d/2-t/2,w:side,d:t,cut:true},
  {...b,id:id+'-back',z:b.z-b.d/2+t/2,d:t},
  {...b,id:id+'-left',x:b.x-b.w/2+t/2,w:t},
  {...b,id:id+'-right',x:b.x+b.w/2-t/2,w:t});
 floors.push({id:id+'-roof',x:b.x,z:b.z,w:b.w,d:b.d,y:b.h});
}
floors.push(...HIGHLINE_FLOORS);walls.push(...HIGHLINE_WALLS);
export const places=[
 {id:'depot',name:'DEPOT',x:-12,z:15,y:0},
 {id:'arcade',name:'MARKET ARCADE',x:-20,z:-9,y:0},
 {id:'print',name:'PRINT SHOP / PUBLIC STAIRS',x:-12.5,z:8,y:0},
 {id:'roof',name:'DRYING TERRACES',x:-11,z:-4,y:4.4},
 {id:'pump',name:'PUMP GALLERY',x:6,z:-12,y:0},
 {id:'court',name:'RECEIVING COURT',x:6,z:8,y:0},
 {id:'workshop',name:'LANTERN WORKSHOP',x:15,z:6,y:0},
 {id:'loft',name:'LOADING LOFT',x:15,z:0,y:4.4}
];
export const fixtures=[
 {id:'parcel',x:-12,z:15,y:0,label:'Collect workshop parcel'},
 {id:'delivery',x:14,z:6,y:0,label:'Deliver to receiving bench'},
 {id:'gate',x:3,z:18,y:0,label:'Open blue service door'},
 {id:'water',x:5.8,z:-13,y:0,label:'Operate canal sluice'},
 {id:'repair',x:6,z:-8,y:0,label:'Repair goods hoist'},
 {id:'hoist',x:6.8,z:.5,y:0,label:'Ride goods hoist'},
 {id:'quay-west-signal',x:-5,z:-13.5,y:0,label:'Quay pass button / keep riding'},
 {id:'quay-east-signal',x:5,z:-15,y:0,label:'Quay pass button / keep riding'},
 {id:'dock-south',x:-4.4,z:13,y:0,label:'Y: Board canal skiff'},
 {id:'dock-north',x:3,z:-14,y:0,label:'Y: Board canal skiff'}
];
export const docks=[{x:-.5,z:12,landX:-4.4,landZ:13},{x:-.5,z:-11.5,landX:3,landZ:-14}];
export function fresh(){return {v:1,chapter:CHAPTER,layout:LAYOUT,x:-12,y:0,z:17,yaw:0,vx:0,vz:0,vy:0,speed:0,distance:0,time:0,steps:0,ride:'foot',city:freshCity(),watch:freshWatch(),campaign:freshCampaign(),parcel:false,delivered:false,gate:false,hoist:false,claimed:false,credits:0,water:'high',transition:null,lift:null,hoistY:0,visited:['depot'],safe:[-12,0,17],porterYield:0,message:'Find your parcel at the depot bench. X interacts; A hops; Y mounts.',messageTime:9};}
const flags=['parcel','delivered','gate','hoist','claimed'];
export function complete(s){return s.delivered&&(s.gate||s.hoist);}
export function say(s,text){s.message=text;s.messageTime=7;}
export function serialize(s){return {v:1,chapter:CHAPTER,layout:LAYOUT,x:s.x,y:s.y,z:s.z,yaw:s.yaw,ride:s.ride,water:s.water,hoistY:s.hoistY,...Object.fromEntries(flags.map(k=>[k,s[k]])),credits:s.credits,visited:s.visited,safe:s.safe,city:parseCity(s.city),watch:parseWatch(s.watch),campaign:parseCampaign(s.campaign)};}
export function parse(raw){
 const p=typeof raw==='string'?JSON.parse(raw):raw;
 if(!p||p.v!==1||p.chapter!==CHAPTER||p.layout!==LAYOUT)throw Error('Unsupported chapter/layout. Original save retained; export it before replacing.');
 if(flags.some(k=>typeof p[k]!=='boolean')||!['high','low'].includes(p.water)||!['foot','bicycle','boat'].includes(p.ride)||['x','y','z','yaw'].some(k=>!Number.isFinite(p[k]))||Math.abs(p.x)>24||Math.abs(p.z)>21||p.y< -3||p.y>HIGHLINE_MAX_Y||!Number.isSafeInteger(p.credits)||p.credits<0||p.credits>600||p.delivered&&!p.parcel||p.claimed&&!complete(p)||p.credits!==(p.claimed?600:0))throw Error('Invalid chapter save. Original data retained.');
 const s={...fresh(),...p,city:parseCity(p.city),watch:parseWatch(p.watch),campaign:parseCampaign(p.campaign),visited:Array.isArray(p.visited)?p.visited.filter(v=>places.some(q=>q.id===v)):['depot']};
 if([!!s.watch.tracking,!!s.city.active,!!s.campaign.active].filter(Boolean).length>1)throw Error('Only one mission may be tracked. Original progress retained.');
 s.safe=Array.isArray(p.safe)&&p.safe.length===3&&p.safe.every(Number.isFinite)&&Math.abs(p.safe[0])<24&&Math.abs(p.safe[2])<21?p.safe:[-12,0,17];
 if(s.ride==='boat'&&s.water==='low')s.ride='foot';
 // A saved mid-hop/hoist position falls to a valid support; no stale transition survives.
 s.hoistY=Number.isFinite(p.hoistY)?clamp(p.hoistY,0,4.4):0;s.transition=null;s.lift=null;s.vx=s.vz=s.vy=0;resetMarket(s);return s;
}
export function save(s,store){
 let text;try{const payload=serialize(s);const trip=watchRuntime(s).travel;if(trip){Object.assign(payload,trip.from);payload.ride='foot';}const lunge=campaignRuntime(s).lunge;if(lunge){Object.assign(payload,lunge.from);payload.ride='foot';}if(campaignCanGlide(s)&&s.y>1.2&&Math.abs(s.vy)>.1){[payload.x,payload.y,payload.z]=s.safe;payload.ride='foot';}if(s.lift){[payload.x,payload.y,payload.z]=s.safe;payload.ride='foot';payload.hoistY=s.lift.from>2?4.4:0;}if(payload.y< -3||payload.y>HIGHLINE_MAX_Y){[payload.x,payload.y,payload.z]=s.safe;payload.ride='foot';}text=JSON.stringify(payload);parse(text);const old=store.getItem(SAVE_KEY);if(old){parse(old);store.setItem(SAVE_KEY+'.backup',old);if(store.getItem(SAVE_KEY+'.backup')!==old)throw Error('Backup verification failed');}
 store.setItem(SAVE_KEY+'.pending',text);if(store.getItem(SAVE_KEY+'.pending')!==text)throw Error('Staging verification failed');store.setItem(SAVE_KEY,text);if(store.getItem(SAVE_KEY)!==text)throw Error('Save verification failed');store.removeItem(SAVE_KEY+'.pending');return {ok:true};}catch(e){return {ok:false,error:String(e.message||e)};}
}
export function load(store){
 let original=null;try{original=store.getItem(SAVE_KEY);if(original)return {state:parse(original),blocked:false};
 const pending=store.getItem(SAVE_KEY+'.pending');if(pending)return {state:parse(pending),blocked:false,recovered:true};return {state:fresh(),blocked:false};
 }catch(e){return {state:fresh(),blocked:true,original,error:String(e.message||e)};}
}
export function actors(s){
 const u=(s.time%18)/18,walk=u<.5?u*2:2-u*2;
 return [{id:'dispatcher',name:'Mara / dispatcher',x:-14+walk*3,z:15,y:0,tip:'The blue door is latched from the receiving court. Watch for our red depot sign on your return.'},
 marketActor(s),
 {id:'caretaker',name:'Neri / workshop caretaker',x:16,z:5+walk*4,y:0,tip:'Leave the parcel at the receiving bench. Restore the blue door OR repair the goods hoist, then return to Mara.'}];
}
export function surfaces(s,x,z){return [...floors,{id:'hoist-platform',x:6.8,z:.5,w:2,d:2,y:s.hoistY||0}].filter(f=>(!f.low||s.water==='low')&&inside(x,z,f));}
export function support(s,x,z,y){const fs=surfaces(s,x,z).filter(f=>floorHeight(f,z)<=y+.31);return fs.sort((a,b)=>floorHeight(b,z)-floorHeight(a,z))[0];}
export function blocked(s,x,y,z,r=.3,ignoreActor=null){
 if(Math.abs(x)>23.6||Math.abs(z)>20.6)return true;
 for(const w of walls)if(!(w.gate&&s.gate)&&y+.1<w.y+w.h&&y+1.7>w.y&&inside(x,z,w,r))return true;
 if(s.ride==='bicycle'&&surfaces(s,x,z).some(f=>f.stairs&&floorHeight(f,z)<y+.5&&floorHeight(f,z)>y-.5))return true;
 if(s.ride!=='boat'&&s.water==='high'&&y<.5&&inside(x,z,canal,-.08))return true;
 if(s.ride==='boat'&&!inside(x,z,canal,-.5))return true;
 if(marketBlocks(s,x,y,z,r))return true;
 if(campaignBlocks(s,x,y,z,ignoreActor))return true;
 return false;
}
export function lineClear(s,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z,b.y-a.y),n=Math.max(1,Math.ceil(d/.12));for(let i=1;i<n;i++){const u=i/n,x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u,y=a.y+(b.y-a.y)*u;for(const w of walls)if(!(w.gate&&s.gate)&&y>w.y&&y<w.y+w.h&&inside(x,z,w))return false;}return true;}
export function nearby(s){
 const fs=fixtures.map(f=>f.id==='hoist'?{...f,y:s.y>2?4.4:0}:f);
 const found=fs.filter(f=>Math.hypot(s.x-f.x,s.y-f.y,s.z-f.z)<2.15&&(f.id==='gate'||lineClear(s,{x:s.x,y:s.y+1,z:s.z},{x:f.x,y:f.y+1,z:f.z})));
 return found.sort((a,b)=>Math.hypot(s.x-a.x,s.z-a.z)-Math.hypot(s.x-b.x,s.z-b.z))[0]||null;
}
const watchAPI={say,lineClear,blocked,support,floorHeight,surfaces};
const campaignAPI=watchAPI;
export function action(s,name,ray){
 if(watchRuntime(s).travel||campaignRuntime(s).lunge)return;
 if(campaignAction(s,name,campaignAPI,ray))return;
 if(watchAction(s,name,watchAPI,ray))return;
 if(name==='bell'){const m=marketState(s),visible=lineClear(s,{x:s.x,y:s.y+1,z:s.z},{x:0,y:1,z:m.z});say(s,requestPass(s,visible)?'Ivo: I heard you. Pulling north into the bay; cross when the sign clears.':'Bell rang. Signal within sight of Ivo at the north quay to request a pass.');return;}
 if(name==='hop'){if(s.ride==='foot'&&Math.abs(s.vy)<.01&&support(s,s.x,s.z,s.y))s.vy=4.3;return;}
 if(name==='ride'){
  if(s.transition||s.lift)return;
  if(s.ride==='boat'){const d=docks.find(d=>Math.hypot(s.x-d.x,s.z-d.z)<3);if(!d){say(s,'Bring the skiff alongside either public pier, then press Y to dock.');return;}s.x=d.landX;s.z=d.landZ;s.y=0;s.ride='foot';s.vx=s.vz=s.vy=0;say(s,'Skiff moored. Both public piers keep a boat available.');return;}
  const d=docks.find(d=>Math.hypot(s.x-d.landX,s.z-d.landZ)<2.8&&s.y<.5);
  if(d&&s.water==='high'){s.x=d.x;s.z=d.z;s.y=-.72;s.ride='boat';s.vx=s.vz=0;say(s,'Follow the water to the far pier. Y docks; X still interacts.');return;}
  if(s.ride==='bicycle'){s.ride='foot';say(s,'On foot. Public stairs and terraces are now accessible.');return;}
  if(s.y<-.2||s.y>.35||surfaces(s,s.x,s.z).some(f=>f.stairs)){say(s,'Mount your bicycle on the level street, not on stairs or in the channel.');return;}
  s.ride='bicycle';say(s,'Bicycle ready. RT accelerates; LT or B brakes. Dismount with Y for stairs.');return;
 }
 if(name==='throw'){s.paper={x:s.x,y:s.y+1.1,z:s.z,dx:-Math.sin(s.yaw),dz:-Math.cos(s.yaw),t:0};say(s,'Practice paper thrown. Workshop parcels need a handoff at the receiving bench.');return;}
 if(name!=='interact')return;
 const campaignResponse=campaignInteract(s,campaignAPI);if(campaignResponse){say(s,campaignResponse);return;}
 const response=cityInteract(s,lineClear);if(response){say(s,response);return;}
 const f=nearby(s);
 if(!f){const a=actors(s).find(a=>Math.hypot(s.x-a.x,s.y-a.y,s.z-a.z)<2.8);if(a)say(s,a.tip);else say(s,name==='throw'?'The workshop parcel needs a handoff at its bench, not a thrown paper.':'Move close to a person, bench or mechanism.');return;}
 // A reached signal post relays the request even when the cart is behind the bay corner.
 // nearby() has already enforced reach and visibility to this fixed control.
 if(f.id.startsWith('quay-')){say(s,requestPass(s)?'Ivo: Quay signal received. Pulling into the bay; cross when the sign clears.':'Move closer to the quay signal.');return;}
 if(f.id==='parcel'){
  if(complete(s)&&!s.claimed){s.claimed=true;s.credits=600;say(s,'Delivery loop restored. 600 chapter credits recorded once. The shortcuts remain yours.');}
  else if(s.claimed)say(s,'Mara: The ward is working again. Try another route; the blue door and hoist stay repaired.');
  else if(!s.parcel){s.parcel=true;say(s,'Parcel for the lantern workshop. Find a way through: market, rooftops or canal.');}
  else say(s,'Mara: Deliver the parcel, restore one connection, then come back here.');
 }else if(f.id==='delivery'){
  if(!s.parcel)say(s,'Neri: Your workshop parcel is still at the depot bench.');else if(!s.delivered){s.delivered=true;say(s,'Parcel received. Open the blue service door OR repair the hoist. No preferred route required.');}else say(s,'Delivery already recorded. Your return connection is the remaining task.');
 }else if(f.id==='gate'){
  if(s.gate)say(s,'The red depot sign is right here. This permanent connection now belongs to your route.');
  else if(s.x<3.5)say(s,'Latched from the court. Follow the arcade north, the print-shop stair west, or the canal pier south.');
  else{s.gate=true;say(s,'Blue door opened. There is the depot bench where you began. This shortcut is saved.');}
 }else if(f.id==='water'){
  if(s.transition){s.transition=null;say(s,'Water change cancelled; the previous safe level is retained.');}
  else if(s.ride==='boat'||inside(s.x,s.z,canal)||s.lift)say(s,'Clear the channel and moor the skiff before changing water levels.');
  else{s.transition={from:s.water,to:s.water==='high'?'low':'high',t:0};say(s,'Sluice moving. Watch the gauge and channel below. X again cancels safely.');}
 }else if(f.id==='repair'){s.hoist=true;say(s,'Goods hoist repaired. Its platform now connects pump gallery and loading loft.');}
 else if(f.id==='hoist'){
  if(!s.hoist)say(s,'Hoist jammed. The repair handwheel is beside the pump gallery.');
  else if(s.ride!=='foot')say(s,'Dismount before taking the hoist.');
  else{const from=s.y>2?4.4:0;s.lift={from,to:from?0:4.4,t:0,summon:Math.abs(s.hoistY-from)>.1?{from:s.hoistY,to:from,t:0}:null};if(!s.lift.summon){s.x=6.8;s.z=.5;}s.vx=s.vz=s.vy=0;say(s,s.lift.summon?'Hoist called. Wait on the landing while the platform arrives.':'Goods hoist moving beside the loft, through an open shaft.');}
 }else if(f.id.startsWith('dock'))action(s,'ride');
}
export function tick(s,input,dt){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.05);if(!dt)return;s.time+=dt;s.steps++;s.messageTime=Math.max(0,s.messageTime-dt);s.porterYield=Math.max(0,s.porterYield-dt);advanceMarket(s,dt);
 if(advanceCampaign(s,input,dt,campaignAPI))return;
 if(advanceWatch(s,input,dt,watchAPI))return;
 if(s.paper){s.paper.t+=dt;if(s.paper.t>1.1)s.paper=null;}
 if(s.transition){s.transition.t+=dt/2;if(s.transition.t>=1){if(inside(s.x,s.z,canal)||s.ride==='boat'){s.transition=null;say(s,'Sluice paused: clear the channel first. The safe water level is unchanged.');return;}s.water=s.transition.to;s.transition=null;say(s,s.water==='low'?'Channel drained. The maintenance steps and walking route are exposed.':'Channel filled. Public boats are available again.');}}
 if(s.lift){const l=s.lift;if(l.summon){const q=l.summon;q.t=Math.min(1,q.t+dt/1.5);s.hoistY=q.from+(q.to-q.from)*q.t;if(q.t>=1){l.summon=null;s.x=6.8;s.z=.5;s.y=l.from;}return;}l.t=Math.min(1,l.t+dt/2);s.y=l.from+(l.to-l.from)*(l.t*l.t*(3-2*l.t));s.hoistY=s.y;if(l.t>=1){s.lift=null;s.safe=[s.x,s.y,s.z];}return;}
 // Boost is hold-to-run, not cruise control. A falling edge actively brakes.
 if(s.boostHeld&&!input.boost)s.releaseBrake=.35;s.boostHeld=!!input.boost;
 if(s.releaseBrake>0){s.releaseBrake=Math.max(0,s.releaseBrake-dt);input={...input,brake:true};}
 let max=s.ride==='boat'?5:s.ride==='bicycle'?input.boost?9:5.6:input.boost?6.2:3.7;
 let dx=input.x||0,dz=input.z||0;const gliding=!!input.glide&&campaignCanGlide(s)&&s.ride==='foot'&&s.y>1;
 if(gliding){dx=-Math.sin(s.yaw);dz=-Math.cos(s.yaw);max=5.8;}let L=Math.max(1,Math.hypot(dx,dz));dx/=L;dz/=L;
 if(input.brake&&!gliding)dx=dz=0;const a=1-Math.exp(-dt*((input.brake&&!gliding)?18:9));s.vx+=(dx*max-s.vx)*a;s.vz+=(dz*max-s.vz)*a;if(!dx&&!dz&&Math.hypot(s.vx,s.vz)<.035)s.vx=s.vz=0;
 const old=[s.x,s.y,s.z],parts=Math.max(1,Math.ceil(Math.hypot(s.vx,s.vz)*dt/.15));
 for(let i=0;i<parts;i++){
  const x=s.x+s.vx*dt/parts,z=s.z+s.vz*dt/parts;
  if(!blocked(s,x,s.y,s.z)&&!watchBlocks(s,x,s.y,s.z))s.x=x;else s.vx=0;
  if(!blocked(s,s.x,s.y,z)&&!watchBlocks(s,s.x,s.y,z))s.z=z;else s.vz=0;
 }
 if(s.ride==='boat'){s.y=-.72;s.vy=0;}
 else{
  const f=support(s,s.x,s.z,s.y),ground=f?floorHeight(f,s.z):-20;
  if(s.vy<=0&&s.y-ground<.32&&s.y-ground>-.32){s.y=ground;s.vy=0;}
  else{if(gliding)s.vy=Math.max(s.vy,-1.15);else s.vy-=11*dt;s.y+=s.vy*dt;if(s.y<ground&&old[1]>=ground-.31){s.y=ground;s.vy=0;}}
  // Low clearance under platforms stops a hop; visual cutaways never remove it.
  for(const roof of surfaces(s,s.x,s.z)){const h=floorHeight(roof,s.z);if(!roof.stairs&&h>old[1]+1.7&&s.y+1.8>h&&s.vy>0){s.y=h-1.81;s.vy=0;}}
 }
 const distance=Math.hypot(s.x-old[0],s.z-old[2]);s.distance+=distance;s.speed=distance/dt;
 if(Math.hypot(dx,dz)>.1&&s.speed<.2&&Math.abs(s.x)<2.5&&s.z< -12&&s.z> -19)marketState(s).waitSeconds+=dt;
 if(distance>.001)s.yaw=Math.atan2(-s.vx,-s.vz);
 if(s.y< -6){[s.x,s.y,s.z]=s.safe;s.vx=s.vz=s.vy=0;s.ride='foot';say(s,'Recovered at your last safe landing. Parcel and repairs retained.');}
 if(s.vy===0&&s.y>=0&&s.ride==='foot'&&!inside(s.x,s.z,canal))s.safe=[s.x,s.y,s.z];
 for(const p of places)if(Math.hypot(s.x-p.x,s.y-p.y,s.z-p.z)<3&&!s.visited.includes(p.id))s.visited.push(p.id);
}
export function goal(s){return s.claimed?'The ward is yours. Revisit a route or return to the original neighborhood.':!s.parcel?'Collect the workshop parcel at the depot.':!s.delivered?'Deliver to the lantern workshop by any approach.':!complete(s)?'Restore a connection: blue service door OR goods hoist.':'Return to the depot bench and record the restored delivery loop.';}
