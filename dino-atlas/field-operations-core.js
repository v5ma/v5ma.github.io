// Original fictional ranger assignments. This module owns only its new save namespace.
export const FIELD_BUILD = 'ranger-field-ops-20260917.1';
export const FIELD_VERSION = 1;
export const UTILITY_ORDER = ['water', 'zapper', 'scanner', 'rescue'];
export const MOUNTS = Object.freeze({
  jeep: {name:'Jeep response rig', water:'Roof water monitor', zapper:'Roof pulse projector', scanner:'Survey mast', rescue:'Front recovery winch', origin:[0,1.65,2.1], range:38, scan:44, cable:15},
  buggy: {name:'Buggy field rig', water:'Precision water lance', zapper:'Induction probe', scanner:'Close survey array', rescue:'Light recovery winch', origin:[0,1.3,1.7], range:32, scan:36, cable:12},
  boat: {name:'Patrol boat rig', water:'Bow water monitor', zapper:'Insulated pulse projector', scanner:'Shore survey array', rescue:'Rescue basket winch', origin:[0,1.15,2.3], range:42, scan:48, cable:18},
  helicopter: {name:'Helicopter response rig', water:'Gimballed water pod', zapper:'Gimballed pulse pod', scanner:'Aerial survey gimbal', rescue:'Rescue hoist', origin:[1.55,.2,1.7], range:46, scan:64, cable:26}
});
const at=(id,kind,name,x,z,y=1.2)=>({id,kind,name,x,y,z});
const animal=(id,uid,name)=>({id,kind:'animal',uid,name});
const step=(verb,title,targets,options={})=>({verb,title,targets,seconds:['load','deliver','install','confirm','report'].includes(verb)?0:2,...options});
const report=(target)=>step('report','Park and file the field report',[target],{seconds:0});
const cHome=at('base-report','desk','Visitor Center field desk',0,51);
const tHome=at('home-report','desk','Orange crane field desk',-38,31);
const cRedwood=at('redwood-report','desk','Redwood field desk',-172,48);
const mission=(id,scene,name,brief,vehicles,stages)=>({id,scene,name,brief,vehicles,stages});
export const FIELD_MISSIONS = [
  mission('classic-cooling','classic','Gatehouse Cooling Run','The visitor-gate pumps are overheating. Use the roof monitor from clear ground, then return without spending all your reserve.',['jeep','buggy'],[
    step('scan','Scan the gatehouse cooling pump',[at('gate-pump','coolant','Gatehouse pump',10,38)]),
    step('water','Cool both pump housings',[at('gate-pump','coolant','Gatehouse pump',10,38),at('road-pump','coolant','Service-road pump',-11,35)],{hits:12}),report(cHome)]),
  mission('classic-circuit','classic','Redwood Induction Service','The field buggy can service the two low-power test relays without shutting down the whole outpost. Park close and use measured pulses.',['buggy'],[
    step('scan','Inspect the Redwood diagnostic relay',[at('redwood-relay','relay','Redwood diagnostic relay',-151,49)]),
    step('pulse','Reset the two isolated relays',[at('redwood-relay','relay','Redwood diagnostic relay',-151,49),at('trail-relay','relay','Trail diagnostic relay',-165,64)],{hits:2}),report(cRedwood)]),
  mission('classic-canopy','classic','Canopy Census','Use the helicopter scanner above the visitor valley. The same animals can be read from different clear angles; flying directly over roofs is not a substitute for line of sight.',['helicopter'],[
    step('scan','Survey the three valley residents',[animal('giant','legacy-0','Valley Diplodocus'),animal('armor','legacy-1','Valley Stegosaurus'),animal('horns','legacy-2','Valley Triceratops')],{seconds:2.5,minHeight:5}),report(cHome)]),
  mission('classic-wetland-rescue','classic','Wetland Researcher Recovery','A researcher is waiting at the dock. Assess them, bring the boat alongside, winch the rescue basket aboard, and return to the marked landing.',['boat'],[
    step('scan','Assess the stranded researcher',[at('wetland-crew','crew','Researcher Imani',-76,-156)]),
    step('rescue','Recover Imani with the basket winch',[at('wetland-crew','crew','Researcher Imani',-76,-156)],{seconds:3}),
    step('deliver','Disembark the researcher at the wetland landing',[at('wetland-safe','desk','Wetland safe landing',-86,-147,.8)],{radius:12}),report(at('wetland-report','desk','Wetland dock field desk',-73,-151))]),
  mission('classic-cargo','classic','Visitor Valley Supply Loop','Load a spare sensor pack, bring it to the survey crew, and install it on foot. A fast drive does not replace the final hands-on work.',['jeep','buggy','helicopter'],[
    step('load','Load the marked sensor pack',[at('sensor-pack','cargo','Sensor pack',8,56)],{radius:8}),
    step('install','Park near the valley service point and install the pack',[at('valley-service','relay','Valley service socket',17,32)],{radius:4}),report(cHome)]),
  mission('classic-stand-off','classic','Forest Stand-off','Scan the forest predator before intervening. A water burst or pulse may interrupt it; then create space and verify that it has settled.',['jeep','buggy'],[
    step('scan','Assess the forest resident',[animal('forest-resident','wild-forest','Forest Allosaurus')]),
    step('deter','Interrupt the approach with water or a pulse',[animal('forest-resident','wild-forest','Forest Allosaurus')],{hits:1}),
    step('settle','Back away and observe a settled resident',[animal('forest-resident','wild-forest','Forest Allosaurus')],{seconds:3}),report(cRedwood)]),
  mission('tidegate-cooling','tidegate','Outpost Cooling Circuit','Inspect the orange-crane cooling unit, cool the two exposed housings, and restock at home. The jeep and boat have different usable firing positions.',['jeep','boat','helicopter'],[
    step('scan','Inspect the outpost cooling unit',[at('crane-pump','coolant','Crane cooling unit',-27,20)]),
    step('water','Cool the crane and harbor housings',[at('crane-pump','coolant','Crane cooling unit',-27,20),at('harbor-pump','coolant','Harbor cooling unit',-14,32)],{hits:12}),report(tHome)]),
  mission('tidegate-roof-rescue','tidegate','Pump-house Roof Rescue','The roof engineer has a clear hoist area on the east terrace. Scan before lowering the line, hover steadily, and bring the engineer back to the orange crane.',['helicopter'],[
    step('scan','Assess the roof engineer',[at('roof-crew','crew','Engineer Tessa',46,14,9.4)],{minHeight:6}),
    step('rescue','Hoist Tessa from the east roof terrace',[at('roof-crew','crew','Engineer Tessa',46,14,9.4)],{seconds:3}),
    step('deliver','Land at the home helicopter bay',[at('home-air','desk','Home helicopter bay',-53,39,1)],{radius:8,maxHeight:3}),report(tHome)]),
  mission('tidegate-boat-rescue','tidegate','East Landing Evacuation','Reach the east landing by water, assess the waiting technician, recover the basket, and return west. The central sluice and main bridge need not be repaired.',['boat'],[
    step('scan','Assess the east-landing technician',[at('east-crew','crew','Technician Arun',12,39,1.5)]),
    step('rescue','Recover Arun alongside the east landing',[at('east-crew','crew','Technician Arun',12,39,1.5)],{seconds:3}),
    step('deliver','Return to the west landing',[at('west-safe','desk','West landing',-7,38,.8)],{radius:5}),report(tHome)]),
  mission('tidegate-corridor','tidegate','Quiet Apron Watch','Survey the herd, then verify a real opening in its corridor. Wait for the routine or use the existing feeder and ranger tools; no particular itinerary is compulsory.',['jeep','boat','helicopter'],[
    step('scan','Survey two crossing residents',[animal('herd-a','tidegate-herd-0','Crossing resident A'),animal('herd-b','tidegate-herd-1','Crossing resident B')]),
    step('clear','Verify a clear apron for four seconds',[at('apron-watch','watch','Bridge apron observation',18,24)],{seconds:4}),report(tHome)]),
  mission('tidegate-cargo','tidegate','Station Regulator Delivery','Load the regulator at home. Deliver by bridge, high road or air, park near the station, and install it through the service aisle.',['jeep','helicopter'],[
    step('load','Load the spare regulator',[at('regulator-pack','cargo','Spare regulator',-29,26)],{radius:8}),
    step('install','Install the regulator at the external service socket',[at('station-socket','relay','Station service socket',44,10)],{radius:4}),report(tHome)]),
  mission('tidegate-android','tidegate','Maintenance Android Recovery','The isolated maintenance android has a faulty actuator. Scan its service panel, apply two induction pulses from a parked vehicle, then confirm the restart on foot.',['jeep','helicopter'],[
    step('scan','Inspect the maintenance android',[at('service-android','android','Maintenance unit M-4',-25,10)]),
    step('pulse','Reset the android service panel',[at('service-android','android','Maintenance unit M-4',-25,10)],{hits:2}),
    step('confirm','Confirm the restart on foot',[at('service-android','android','Maintenance unit M-4',-25,10)],{radius:4}),report(tHome)])
];
export const catalog=scene=>FIELD_MISSIONS.filter(m=>m.scene===scene);
export const fieldKey=scene=>`dino-atlas.field-operations.${scene}.v1`;
export const freshField=()=>({version:FIELD_VERSION,active:null,records:{},selection:{},commendations:0});
const record=()=>({stage:0,done:[],units:{},cargo:null,complete:false});
export function sanitizeField(raw,scene){
  const s=freshField(),list=catalog(scene);if(!raw||raw.version!==FIELD_VERSION)return s;
  for(const m of list){const r=raw.records?.[m.id];if(!r)continue;const stage=Number.isInteger(r.stage)?Math.max(0,Math.min(m.stages.length,r.stage)):0;
    const p=record();p.stage=stage;p.complete=stage===m.stages.length&&r.complete===true;
    if(stage===m.stages.length&&!p.complete)p.stage=m.stages.length-1;
    const phase=m.stages[p.stage];if(phase){p.done=[...new Set(Array.isArray(r.done)?r.done:[])].filter(id=>phase.targets.some(t=>t.id===id));
      for(const t of phase.targets){const n=r.units?.[t.id];if(Number.isFinite(n))p.units[t.id]=Math.max(0,Math.min(phase.hits||phase.seconds||1,n));}}
    if(r.cargo&&typeof r.cargo.carrier==='string'&&['jeep','buggy','boat','helicopter'].includes(r.cargo.carrier)&&m.stages.slice(0,p.stage).some(st=>['load','rescue'].includes(st.verb)&&st.targets.some(t=>t.id===r.cargo.id))){p.cargo={id:r.cargo.id,carrier:r.cargo.carrier};const q=r.cargo.pose;if(q&&[q.x,q.y,q.z,q.heading].every(Number.isFinite)&&Math.abs(q.x)<(scene==='tidegate'?65:545)&&q.z>(scene==='tidegate'?-45:-545)&&q.z<(scene==='tidegate'?51:545)&&q.y>=.3&&q.y<=(scene==='tidegate'?30:85)){p.cargo.pose={x:q.x,y:q.y,z:q.z,heading:q.heading};p.cargo.occupied=r.cargo.occupied===true;}}
    // A malformed cargo checkpoint cannot skip straight to a successful delivery.
    if(phase&&['deliver','install'].includes(phase.verb)&&!p.cargo){p.stage=Math.max(0,p.stage-1);p.done=[];p.units={};}
    s.records[m.id]=p;
  }
  if(list.some(m=>m.id===raw.active)&&!s.records[raw.active]?.complete)s.active=raw.active;
  for(const key of Object.keys(MOUNTS))if(UTILITY_ORDER.includes(raw.selection?.[key]))s.selection[key]=raw.selection[key];
  s.commendations=list.filter(m=>s.records[m.id]?.complete).length;
  return s;
}
export function readField(storage,scene){try{return sanitizeField(JSON.parse(storage?.getItem(fieldKey(scene))||'null'),scene);}catch{return freshField();}}
export function saveField(storage,s,scene){try{if(!storage)return false;let raw;try{raw=JSON.parse(storage.getItem(fieldKey(scene))||'null');}catch{raw=null;}if(raw&&raw.version!==FIELD_VERSION)return false;storage.setItem(fieldKey(scene),JSON.stringify(sanitizeField(s,scene)));return true;}catch{return false;}}
export function beginField(s,scene,id){const m=catalog(scene).find(m=>m.id===id);if(!m||s.records[id]?.complete||Object.entries(s.records).some(([other,r])=>other!==id&&r.cargo))return false;s.records[id]??=record();s.active=id;return true;}
export function currentField(s,scene){const m=catalog(scene).find(m=>m.id===s.active),r=m&&s.records[m.id];return m&&r&&!r.complete?{mission:m,record:r,phase:m.stages[r.stage]}:null;}
export function advanceField(s,scene,event){
  const a=currentField(s,scene);if(!a||event.paused)return false;const {mission:m,record:r,phase:p}=a;
  if(event.verb!==p.verb||!p.targets.some(t=>t.id===event.target)||event.valid!==true)return false;
  if(!['report','install','confirm'].includes(p.verb)&&!m.vehicles.includes(event.mode))return false;
  if(['report','install','confirm'].includes(p.verb)&&event.mode!=='foot')return false;
  if(['deliver','install'].includes(p.verb)&&(!r.cargo||event.carrier!==r.cargo.carrier))return false;
  if(r.done.includes(event.target))return false;
  const need=p.hits||p.seconds||1,delta=p.hits?1:p.seconds?Math.min(.05,Math.max(0,Number(event.dt)||0)):1;
  r.units[event.target]=Math.min(need,(r.units[event.target]||0)+delta);
  if(r.units[event.target]+1e-7<need)return false;
  r.done.push(event.target);
  if(['rescue','load'].includes(p.verb))r.cargo={id:event.target,carrier:event.vehicle||event.mode};
  if(['deliver','install'].includes(p.verb))r.cargo=null;
  if(p.targets.every(t=>r.done.includes(t.id))){r.stage++;r.done=[];r.units={};if(r.stage===m.stages.length){r.complete=true;s.active=null;s.commendations=catalog(scene).filter(m=>s.records[m.id]?.complete).length;}}
  return true;
}
// Continuous scans/hoists require a stable uninterrupted aim; completed targets survive interruption.
export function interruptField(s,scene,except=null){const a=currentField(s,scene);if(!a||!['scan','rescue','clear','settle'].includes(a.phase.verb))return;for(const id of Object.keys(a.record.units))if(id!==except&&!a.record.done.includes(id))delete a.record.units[id];}
export function raySphere(origin,direction,point,radius=1){
  const dx=point.x-origin.x,dy=point.y-origin.y,dz=point.z-origin.z,t=dx*direction.x+dy*direction.y+dz*direction.z;if(t<0)return null;
  const d2=dx*dx+dy*dy+dz*dz-t*t;if(d2>radius*radius)return null;return Math.max(0,t-Math.sqrt(radius*radius-d2));
}
export function validWorkPose(p,target,{speed=0,maxSpeed=2.6,range=40,minHeight=-Infinity,maxHeight=Infinity,visible=false}={}){
  return !!p&&!!target&&[p.x,p.y,p.z,target.x,target.y,target.z,speed].every(Number.isFinite)&&Math.abs(speed)<=maxSpeed&&p.y>=minHeight&&p.y<=maxHeight&&Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)<=range&&visible===true;
}
