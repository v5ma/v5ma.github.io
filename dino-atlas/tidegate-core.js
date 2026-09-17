// Authored district rules. Coordinates are shared by collision, art and route tests.
export const TIDEGATE_BUILD = 'tidegate-20260917.2';
export const TIDEGATE_KEY = 'dino-atlas.tidegate.v1';
export const LAYOUT = 'tidegate-crossing-v1';
export const BOUNDS = {left:-66,right:66,back:-46,front:52};
export const POINTS = {
 home:{x:-38,z:36}, westDock:{x:-12,z:38}, eastDock:{x:12,z:38},
 overlook:{x:-35,z:-24}, northBridge:{x:0,z:-36}, feeder:{x:49,z:-18},
 sluice:{x:15,z:-8}, service:{x:43,z:7}, gearbox:{x:30,z:7},
 bridge:{x:18,z:24}, report:{x:-38,z:32}, roof:{x:32,z:7}, maintenance:{x:32,z:-2}, supply:{x:36,z:-4.5}
};
export const ROUTES = [
 {id:'observation',nodes:['home','overlook','northBridge','feeder','service','gearbox'],mode:'foot',cost:'Longer, but reveals herd timing and the station from above.'},
 {id:'water',nodes:['home','westDock','eastDock','bridge','service','gearbox'],mode:'boat',cost:'Faster crossing; dock and disembark, with less advance information.'},
 {id:'service',nodes:['home','overlook','northBridge','sluice','maintenance','gearbox'],mode:'foot',cost:'Narrow maintenance access avoids the herd yard; drain the lock to open a second foot return.'}
];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function emptyDistrict(){return {version:1,layout:LAYOUT,gearbox:false,bridge:false,drained:false,feeder:false,observed:false,complete:false,reportCount:0,checkpoint:'home',tool:0,ammo:[100,12],reserve:[400,48],position:null};}
export function sanitizeDistrict(raw){
 const s=emptyDistrict();if(!raw||raw.version!==1||raw.layout!==LAYOUT)return s;
 for(const k of ['gearbox','bridge','drained','feeder','observed','complete'])s[k]=raw[k]===true;
 // Loading cannot manufacture a completed bridge or report out of invalid flags.
 s.bridge=s.bridge&&s.gearbox;s.complete=s.complete&&s.bridge;s.reportCount=s.complete?1:0;
 s.checkpoint=raw.checkpoint==='station'?'station':'home';s.tool=raw.tool===1?1:0;
 for(const [k,max] of [['ammo',[100,12]],['reserve',[400,48]]])if(Array.isArray(raw[k]))s[k]=max.map((m,i)=>Number.isFinite(raw[k][i])?clamp(Math.floor(raw[k][i]),0,m):m);
 const p=raw.position;if(p&&['x','y','z'].every(k=>Number.isFinite(p[k]))&&p.x>=BOUNDS.left+2&&p.x<=BOUNDS.right-2&&p.z>=BOUNDS.back+2&&p.z<=BOUNDS.front-2&&p.y>=.5&&p.y<=14)s.position={x:p.x,y:p.y,z:p.z};
 return s;
}
export function readDistrict(storage){try{return sanitizeDistrict(JSON.parse(storage?.getItem(TIDEGATE_KEY)||'null'));}catch{return emptyDistrict();}}
export function saveDistrict(storage,s){try{if(!storage)return false;storage.setItem(TIDEGATE_KEY,JSON.stringify(sanitizeDistrict(s)));return true;}catch{return false;}}
export function channel(p,margin=0){return Math.abs(p.x)<9+margin&&p.z>-43-margin&&p.z<49+margin;}
export function crossing(p,s){return Math.abs(p.z+36)<3.2||s.bridge&&Math.abs(p.z-24)<3.8||s.drained&&Math.abs(p.z+8)<4.5;}
export function canWalk(p,s){return p.x>BOUNDS.left+1&&p.x<BOUNDS.right-1&&p.z>BOUNDS.back+1&&p.z<BOUNDS.front-1&&(!channel(p,.4)||crossing(p,s));}
export function canBoat(p,s){return Math.abs(p.x)<9.5&&p.z>-42&&p.z<47&&!(s.drained&&Math.abs(p.z+8)<5)&&!(s.bridge&&Math.abs(p.z-24)<4);}
export function herdClear(animals){return animals.every(a=>gap(a,{x:22,z:24})>8+(a.radius||1));}
export function applyDistrict(s,event,{animals=[],player=null,boat=null,mode='foot'}={}){
 const fail=message=>({changed:false,message});
 if(mode!=='foot'&&!['observe','resupply'].includes(event))return fail('Park safely and step out for hands-on ranger work.');
 if(event==='observe'){s.observed=true;return {changed:true,message:'The herd passes the bridge apron on its way to forage. The feeder beyond the station draws it toward shelter.'};}
 if(event==='feed'){s.feeder=!s.feeder;return {changed:true,message:s.feeder?'Shelter feeder stocked. Watch the herd move; the apron must actually be clear.':'Feeder closed. The normal forage route will resume.'};}
 if(event==='repair'){s.gearbox=true;s.checkpoint='station';return {changed:true,message:'Gearbox aligned. The bridge controls are outside, overlooking the crossing.'};}
 if(event==='sluice'){
  if(!s.drained&&boat&&Math.abs(boat.z+8)<7)return fail('Move the boat out of the central lock before draining. The lower harbor stays navigable.');
  if(s.drained&&player&&channel(player,1)&&Math.abs(player.z+8)<6)return fail('Leave the channel before restoring its water.');
  s.drained=!s.drained;return {changed:true,message:s.drained?'Lock drained: the marked maintenance crossing is now a walking route. The lower harbor remains open.':'Lock flooded again. The maintenance foot crossing closes; use the upper bridge or lower harbor.'};
 }
 if(event==='bridge'){
  if(s.bridge)return fail('The service bridge is permanently restored. Your shortcut is saved.');
  if(!s.gearbox)return fail('The gearbox is inside the pump house. Use the front door, service aisle, or narrow north maintenance door.');
  if(!herdClear(animals))return fail('Animals still occupy the apron. Observe their route or stock the shelter feeder.');
  if(boat&&Math.abs(boat.z-24)<7)return fail('Move the boat clear of the service bridge before lowering it.');
  s.bridge=true;return {changed:true,message:'Service bridge restored. The orange crane ahead is your starting outpost. This shortcut stays open.'};
 }
 if(event==='report'){
  if(!s.bridge)return fail('Restore the bridge and return to this same outpost. Routes and observations are yours to choose.');
  if(s.complete)return fail('Report already filed. The district and shortcuts remain available; no repeat reward is granted.');
  s.complete=true;s.reportCount=1;s.checkpoint='home';return {changed:true,message:'Crossing reopened. Your field report is saved once. Try another approach or revisit the working station.'};
 }
 return fail('No state change.');
}
export function nextTask(s){
 if(s.complete)return {title:'A place you know',text:'The supply bridge stays open. Explore the roof, reverse the sluice, or revisit the Classic Reserve.',target:POINTS.home};
 if(s.bridge)return {title:'Recognize the way home',text:'Cross the restored bridge toward the orange crane. File the report at the original outpost.',target:POINTS.report};
 if(s.gearbox)return {title:'Make the crossing safe',text:'Clear the herd from the bridge apron, then use the outside bridge controls. The feeder is one option, not a required trigger.',target:POINTS.bridge};
 return {title:'Reopen Tidegate Crossing',text:'Reach the pump house across the tidal race. Observe from the high route, take the boat, or explore the service approach.',target:POINTS.gearbox};
}
export function stepHerd(a,dt,time,s){
 dt=clamp(dt,0,.05);a.alert=Math.max(0,(a.alert||0)-dt);
 const phase=(time+a.phase)%40,goal=s.feeder||a.alert>0?'shelter':phase<19?'apron':'forage';
 const lane=54.5+(a.index%2)*1.7,row=Math.floor(a.index/2)*3.8;
 if(a.routeGoal!==goal){
  a.routeGoal=goal;a.routeIndex=0;
  const destination=goal==='shelter'?{x:47+(a.index%2)*4,z:-24+row}:goal==='apron'?{x:21+(a.index%2)*4,z:23+row}:{x:47+(a.index%2)*4,z:23+row};
  a.route=goal==='shelter'&&a.z> -17?[{x:lane,z:23+row},{x:lane,z:-24+row},destination]:goal!=='shelter'&&a.z<19?[{x:lane,z:-24+row},{x:lane,z:23+row},destination]:[destination];
 }
 let target=a.route[Math.min(a.routeIndex,a.route.length-1)],d=gap(a,target);
 if(d<.7&&a.routeIndex<a.route.length-1){a.routeIndex++;target=a.route[a.routeIndex];d=gap(a,target);}
 const dx=target.x-a.x,dz=target.z-a.z,speed=a.alert>0?3:1.7;
 a.mood=d<.7?'feeding':a.alert>0?'retreating':'roaming';a.speed=d<.7?0:speed;
 if(d>.7){const k=Math.min(speed*dt,d)/d;a.x+=dx*k;a.z+=dz*k;const aim=Math.atan2(dx,dz);a.angle+=Math.atan2(Math.sin(aim-a.angle),Math.cos(aim-a.angle))*Math.min(1,dt*3);}
 return a;
}
