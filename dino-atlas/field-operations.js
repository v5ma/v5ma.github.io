import * as T from './vendor/three.module.js';
import R from './vendor/rapier.mjs';
import {canBoat,canWalk} from './tidegate-core.js';
import {box,part,bone,label} from './ranger-art.js';
import {makePerson} from './frontier-art.js';
import {FIELD_BUILD,MOUNTS,UTILITY_ORDER,catalog,readField,saveField,beginField,currentField,advanceField,interruptField,raySphere,validWorkPose} from './field-operations-core.js';
const vec=p=>new T.Vector3(p.x,p.y,p.z),$=id=>document.getElementById(id);
const toolNames={water:'Water monitor',zapper:'Pulse projector',scanner:'Survey scanner',rescue:'Recovery line'};
// The same mission and mounted-tool handlers serve Classic, Tidegate, Xbox and XR.
export class FieldOperations {
 constructor(ctx){
  this.ctx=ctx;this.s=readField(ctx.storage,ctx.sceneKey);this.list=catalog(ctx.sceneKey);
  interruptField(this.s,ctx.sceneKey);this.clock=0;this.used=false;this.lastHit=null;this.entityKey=null;this.entities=new Map();this.entityCache=new Map();this.rigs=new Map();this.cooldown=0;
  this.group=new T.Group();this.group.name='Field assignments and crew';ctx.root.add(this.group);
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
  this.beam=new T.Line(geometry,new T.LineBasicMaterial({color:0x9fffe1,transparent:true,opacity:.8}));this.beam.frustumCulled=false;this.beam.visible=false;this.group.add(this.beam);this.beamAge=1;
  for(const v of ctx.fleet.vehicles)this.attach(v);
  this.restoreCarriers();this.installUI();this.ensureEntities();
 }
 get active(){return currentField(this.s,this.ctx.sceneKey);}
 get selected(){const selected=this.s.selection[this.ctx.fleet.mode];return ['scanner','rescue'].includes(selected)?selected:this.ctx.tools.tool.id;}
 get extendedCycle(){const travel=this.ctx.input.travel,xr=travel?.ctx?.xr;return xr?.active?travel.activeLayout:this.ctx.input.device!=='gamepad'||travel?.settings.xboxLayout==='active'||['scanner','rescue'].includes(this.selected);}
 get movementSpeed(){const a=this.ctx.fleet.actor,v=a.body?.linvel?.();return v?Math.hypot(v.x,v.y,v.z):Math.abs(a.speed||0);}
 get profile(){return MOUNTS[this.ctx.fleet.mode]||null;}
 attach(v){
  const p=MOUNTS[v.type];if(!p||!v.model)return;
  const g=new T.Group();g.name=p.name;v.model.add(g);
  const height=v.type==='helicopter'?.1:v.type==='boat'?.9:v.type==='buggy'?1.4:2.0;
  box(g,0x31565a,0,height,-.4,1.1,.28,1.1);
  const turret=new T.Group();turret.position.set(...p.origin);g.add(turret);
  // Distinct paired barrels, tanks, scanner head and recovery spool are modeled on every vehicle.
  for(const [x,c] of [[-.2,0x58bbd4],[.2,0xa8b4eb]]){bone(turret,c,[x,0,-.45],[x,0,.45],.09);box(turret,0x253f43,x,0,.46,.17,.17,.09);}
  for(const x of [-.55,.55])part(g,new T.CylinderGeometry(.24,.24,.65,10),x<0?0x5198b4:0xadacc6,x,height+.32,-.8);
  bone(g,0x4e6c71,[0,height,0],[0,height+.85,0],.035);
  const dish=part(g,new T.OctahedronGeometry(.19),0x99efd0,0,height+.85,0);dish.name='survey-array';
  const spool=part(g,new T.CylinderGeometry(.22,.22,.45,10),0xe1b96a,0,v.type==='helicopter'?-.48:.2,v.type==='helicopter'?0:2.02);spool.rotation.z=Math.PI/2;
  const cargo=new T.Group();cargo.name='Secured recovery basket';box(cargo,0xd8a65e,0,0,0,.8,.65,.8);for(const x of [-.38,.38])bone(cargo,0x4b6264,[x,.3,0],[0,.9,0],.025);cargo.position.set(0,v.type==='helicopter'?-.8:height+.4,-1.05);cargo.visible=false;g.add(cargo);
  this.rigs.set(v.id,{root:g,turret,spool,dish,cargo,vehicle:v});
 }
 installUI(){
  const menu=$('menu-dialog'),d=document.createElement('dialog');d.id='field-contracts-dialog';
  d.innerHTML='<h2>Ranger field assignments</h2><p id="field-contracts-summary"></p><p>Choose an assignment, then use the existing terrain, vehicles and tools. Reports award one service commendation each, never duplicate credits.</p><div id="field-contract-list"></div><button id="field-suspend">Suspend assignment / keep progress</button><button id="field-contracts-close">Back to reserve</button>';
  document.body.append(d);const style=document.createElement('style');style.textContent='#field-contracts-dialog{max-width:760px;width:90vw;max-height:86vh;overflow:auto;background:#142e2b;color:#f1ebd8;border:2px solid #c6b176;border-radius:10px;padding:22px}#field-contract-list{display:grid;gap:8px}#field-contract-list button{text-align:left;padding:12px;white-space:normal}#field-kit{display:flex;gap:5px;flex-wrap:wrap;pointer-events:auto;margin-top:6px}#field-kit button{font:600 11px system-ui;padding:6px 8px}#field-utility-status{display:block;font:600 11px/1.4 system-ui;color:#d0f2e9;margin-top:5px;max-width:420px}';document.head.append(style);
  const button=document.createElement('button');button.id='menu-field-contracts';button.textContent='New field assignments / mounted utilities';button.onclick=()=>this.open();(menu.querySelector('.menu-grid')||menu).append(button);
  const host=document.querySelector('#hud .objective,#hud .mission')||$('hud'),kit=document.createElement('div');kit.id='field-kit';
  for(const [key,text] of [['water','Water'],['zapper','Pulse'],['scanner','Scan'],['rescue','Recovery'],['fieldContracts','Assignments']]){const b=document.createElement('button');b.id='field-'+key;b.textContent=text;b.onclick=()=>key==='fieldContracts'?this.open():this.select(key);kit.append(b);}
  host.append(kit);this.status=document.createElement('span');this.status.id='field-utility-status';host.append(this.status);
  $('field-suspend').onclick=()=>{interruptField(this.s,this.ctx.sceneKey);this.s.active=null;this.save();this.ensureEntities();this.ctx.close();this.ctx.notify('Assignment suspended. Evidence and secured cargo are retained; choose it again to resume.');};
  $('field-contracts-close').onclick=()=>this.ctx.close();d.addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});d.addEventListener('close',()=>this.ctx.input.clear());
  const guide=document.createElement('p');guide.textContent='Mounted field kit: Water / Pulse retain the existing ammunition. Scanner and recovery line need a stable aim and clear line of sight. RB / Q cycles vehicle tools; 1/2/3/4 or the field tiles select directly. Quest uses grip interaction, LT aim and RT use tool in Active mode. Scanner and recovery line do not injure crew. N opens assignments.';menu.append(guide);
 }
 open(){
  const root=$('field-contract-list');root.replaceChildren();const a=this.active;
  $('field-contracts-summary').textContent=`${this.list.filter(m=>this.s.records[m.id]?.complete).length} / ${this.list.length} reports filed here. ${a?'Active: '+a.mission.name:'No assignment selected.'}`;
  for(const m of this.list){const r=this.s.records[m.id],b=document.createElement('button');b.id='field-start-'+m.id;b.textContent=`${r?.complete?'FILED':r?.stage?'RESUME':'START'} / ${m.name}. ${m.brief} Vehicles: ${m.vehicles.join(', ')}.`;b.disabled=!!r?.complete;
   b.onclick=()=>{const cargo=Object.entries(this.s.records).find(([id,v])=>id!==m.id&&v.cargo);if(cargo){this.ctx.notify('Finish or resume the assignment with secured cargo before starting another recovery.');return;}
    if(beginField(this.s,this.ctx.sceneKey,m.id)){interruptField(this.s,this.ctx.sceneKey);this.save();this.ensureEntities();this.ctx.close();this.ctx.notify(m.name+': '+this.active.phase.title);}};root.append(b);}
  this.ctx.show('field-contracts-dialog');
 }
 select(id){
  if(!UTILITY_ORDER.includes(id))return false;
  if(!this.profile&&['scanner','rescue'].includes(id)){this.ctx.notify('This attachment is vehicle-mounted. Board an equipped vehicle first.');return true;}
  if(this.profile)this.s.selection[this.ctx.fleet.mode]=id;
  if(id==='water'||id==='zapper'){this.ctx.tools.state.tool=id==='water'?0:1;this.ctx.tools.reloadLeft=0;this.ctx.tools.reloadTool=null;}
  interruptField(this.s,this.ctx.sceneKey);this.save();this.ctx.notify((this.profile?.[id]||toolNames[id])+' selected.');return true;
 }
 action(key){
  if(key==='fieldContracts'){this.open();return true;}
  if(key==='scanner'||key==='rescue')return this.select(key);
  if(key==='water'||key==='zapper'){if(this.profile)this.s.selection[this.ctx.fleet.mode]=key;interruptField(this.s,this.ctx.sceneKey);return false;}
  if(this.profile&&(key==='nextTool'||key==='prevTool')&&this.extendedCycle)return this.select(UTILITY_ORDER[(UTILITY_ORDER.indexOf(this.selected)+(key==='nextTool'?1:3))%4]);
  if(key==='reload'&&['scanner','rescue'].includes(this.selected)&&this.profile){this.ctx.notify('This attachment has no ammunition. Hold RT steadily; water and pulse magazines still reload with X.');return true;}
  return false;
 }
 restoreCarriers(){
  // Tidegate intentionally does not persist parked vehicles in its older key.
  // Only new secured-cargo carriers have a validated new-key pose to restore.
  if(this.ctx.sceneKey!=='tidegate')return;
  for(const rec of Object.values(this.s.records)){const c=rec.cargo,v=this.ctx.fleet.vehicles.find(v=>v.id===c?.carrier),q=c?.pose;if(!v||!q)continue;
   const valid=v.type==='boat'?canBoat(q,this.ctx.fleet.state):v.type==='jeep'?canWalk(q,this.ctx.fleet.state):true;
   if(valid){v.drive.reset(q,q.heading);v.drive.body.setRotation({x:0,y:Math.sin(q.heading/2),z:0,w:Math.cos(q.heading/2)},true);if(c.occupied&&this.s.active&&this.s.records[this.s.active]===rec){this.ctx.fleet.person.setActive(false);this.ctx.fleet.active=v.id;}}
  }
 }
 save(){for(const rec of Object.values(this.s.records)){const c=rec.cargo,v=this.ctx.fleet.vehicles.find(v=>v.id===c?.carrier);if(v&&c){c.pose={...v.drive.position,heading:v.drive.heading};c.occupied=this.ctx.fleet.current?.id===v.id;}}if(!saveField(this.ctx.storage,this.s,this.ctx.sceneKey)&&this.clock>(this.warnAt||-10)+10){this.warnAt=this.clock;this.ctx.notify('Field report could not be saved. Existing reserve saves are unchanged.');}}
 resolve(t){
  if(t.kind!=='animal')return {...t};const a=this.ctx.animals.find(a=>a.uid===t.uid);if(!a)return null;
  return {...t,x:a.x,y:a.collider.translation().y,z:a.z,radius:Math.max(.7,a.radius),actor:a};
 }
 task(){
  const a=this.active;if(!a)return null;const {mission:m,record:r,phase:p}=a;const raw=p.targets.find(t=>!r.done.includes(t.id))||p.targets[0];let target=this.resolve(raw);
  const mustBoard=!['report','install','confirm'].includes(p.verb)&&!m.vehicles.includes(this.ctx.fleet.mode);
  if(mustBoard){const v=this.ctx.fleet.vehicles.filter(v=>m.vehicles.includes(v.type)).sort((x,y)=>vec(x.drive.position).distanceTo(vec(this.ctx.fleet.position))-vec(y.drive.position).distanceTo(vec(this.ctx.fleet.position)))[0];if(v)target={...v.drive.position};}
  return {name:m.name,detail:(mustBoard?'Board '+m.vehicles.join(' or ')+'. ':p.title+'. ')+this.hint(p),target,done:r.stage,total:m.stages.length,hint:this.hint(p)};
 }
 hint(p){return {scan:'Select Scan, hold LT to aim and RT steadily with a clear view. Stay below 2.6 m/s.',water:'Aim the water monitor at the marked housings. Use short bursts; X reloads.',pulse:'Use the pulse attachment on the isolated service panel, not crew.',deter:'A water or pulse hit can interrupt the resident. Leave it a clear escape route.',rescue:'Select Recovery. Stop or hover, aim at the rescue basket, and hold RT for three seconds.',load:'Park within reach and use grip / A to secure the marked pack.',deliver:'Stop at the safe landing with the same vehicle and use grip / A.',install:'Park the loaded vehicle nearby, step out, and use grip / A at the socket.',confirm:'Step out and use grip / A within reach of the service panel.',report:'Step out and use grip / A at the marked field desk.',clear:'Hold the scanner on the apron. Actual animal clearance is required; the feeder is optional.',settle:'Back away, then hold the scanner on the animal after its alert and deterrence have ended.'}[p.verb]||'';}
 allTargets(){const a=this.active,m=a?.mission,handled=new Set(m?.stages.slice(0,a.record.stage).filter(p=>['load','rescue'].includes(p.verb)).flatMap(p=>p.targets.map(t=>t.id))||[]);return m?[...new Map(m.stages.flatMap(p=>p.targets).map(t=>[t.id,t])).values()].filter(t=>!handled.has(t.id)):[];}
 ensureEntities(){
  if(this.entityKey===this.s.active)return;this.entityKey=this.s.active;
  for(const e of this.entities.values())e.model.visible=false;
  this.entities=this.entityCache.get(this.s.active)||new Map();if(this.entityCache.has(this.s.active))return;this.entityCache.set(this.s.active,this.entities);
  for(const t of this.allTargets()){
   if(['animal','watch','desk'].includes(t.kind))continue;const model=new T.Group();model.position.set(t.x,t.y-1.2,t.z);
   if(t.kind==='crew'){const person=makePerson();model.add(person);box(model,0xf2bb65,0,1.65,0,.48,.18,.48);box(model,0xc69257,0,.18,.8,1,.36,.8);}
   else if(t.kind==='android'){box(model,0x9baeb2,0,1.1,0,.65,.8,.4);box(model,0xe8c16b,0,1.75,0,.4,.35,.4);for(const x of [-.22,.22])bone(model,0x4b686c,[x,.8,0],[x,.1,0],.1);}
   else{box(model,t.kind==='coolant'?0xaa6947:0x4d7973,0,.65,0,1.15,1.3,1);box(model,0x253f43,0,1.38,0,.65,.18,.6);}
   const lamp=part(model,new T.SphereGeometry(.15,8,6),new T.MeshBasicMaterial({color:0xffbc58}),0,2.15,0);
   const sign=label(t.name,5.5,.75);sign.position.set(0,2.8,0);sign.userData.fieldLabel=true;model.add(sign);this.group.add(model);this.entities.set(t.id,{target:t,model,lamp,sign});
  }
 }
 mountRay(origin,direction){
  const v=this.ctx.fleet.current;if(!v)return {origin:vec(origin),direction:vec(direction).normalize()};
  const q=v.drive.body.rotation(),mount=new T.Vector3(...MOUNTS[v.type].origin).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w)).add(vec(v.drive.position));
  // Do not let a protruding muzzle bypass a wall intersecting the chassis-to-muzzle segment.
  const start=vec(v.drive.position).add(new T.Vector3(0,.3,0)),d=mount.clone().sub(start),n=d.length();d.normalize();
  const block=this.ctx.physics.world.castRay(new R.Ray(start,d),n,true,undefined,undefined,v.drive.collider,v.drive.body);if(block)mount.copy(start).addScaledVector(d,Math.max(0,block.timeOfImpact-.05));
  const aim=vec(direction).normalize();this.rigs.get(v.id)?.turret.quaternion.copy(new T.Quaternion(q.x,q.y,q.z,q.w).invert().multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),aim)));
  return {origin:mount,direction:aim};
 }
 aim(origin,direction,xr){
  const mount=this.mountRay(origin,direction);if(!xr?.active)return mount;
  if(!this.profile||xr.diorama)return xr.aimFrom(mount.origin,mount.direction);
  if(!xr.aimRay)return mount;
  const pointer=xr.aimRay,actor=this.ctx.fleet.actor,block=this.ctx.physics.world.castRay(new R.Ray(pointer.origin,pointer.direction),200,true,undefined,undefined,actor.collider,actor.body),hit=this.firstTarget(pointer,block?.timeOfImpact??200);
  const point=vec(pointer.origin).addScaledVector(vec(pointer.direction),hit?.distance??block?.timeOfImpact??this.profile.range);
  mount.direction.copy(point).sub(mount.origin).normalize();this.pointMount(mount.direction);return mount;
 }
 pointMount(aim){const v=this.ctx.fleet.current,q=v?.drive.body.rotation();if(q)this.rigs.get(v.id)?.turret.quaternion.copy(new T.Quaternion(q.x,q.y,q.z,q.w).invert().multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),vec(aim).normalize())));}
 makeRay(yaw,pitch,xr){const p=this.ctx.fleet.position,dir=new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)),r=this.aim({x:p.x,y:p.y+.35,z:p.z},dir,xr);this.pointMount(r.direction);return r;}
 firstTarget(ray,length){
  let best=null;for(const raw of this.allTargets()){
   if(raw.kind==='desk')continue;const t=this.resolve(raw);if(!t)continue;
   // Residents already have real collision shapes. A smaller spherical proxy
   // could reject a valid oblique hit on the resident itself as an obstruction.
   // The caller's nearest world hit still bounds this individual shape query.
   const d=t.actor?t.actor.collider.collider(0).castRay(new R.Ray(ray.origin,ray.direction),length+.001,true):raySphere(ray.origin,ray.direction,t,t.radius||1.05);
   if(Number.isFinite(d)&&d>=0&&d<=length+.04&&(!best||d<best.distance))best={target:t,distance:d};
  }return best;
 }
 visible(from,to){const d=vec(to).sub(vec(from)),n=d.length();if(n<.1)return true;d.normalize();const a=this.ctx.fleet.actor,hit=this.ctx.physics.world.castRay(new R.Ray(from,d),n,true,undefined,undefined,a.collider,a.body);return !hit||hit.timeOfImpact>=n-(to.radius||1.1);}
 progress(verb,target,dt=0,extra={}){
  const a=this.active;if(!a)return;const stage=a.record.stage;
  const changed=advanceField(this.s,this.ctx.sceneKey,{verb,target:target.id,mode:this.ctx.fleet.mode,vehicle:this.ctx.fleet.current?.id,valid:true,dt,...extra});
  if(changed){this.save();const next=this.active;if(!next){this.ctx.notify(a.mission.name+' filed. One service commendation recorded; no repeat payout.');}else if(next.record.stage!==stage){this.ctx.notify(next.phase.title+'. '+this.hint(next.phase));}else this.ctx.notify(target.name+' recorded.');}
 }
 toolHit(tool,origin,direction,length){
  const hit=this.firstTarget({origin:vec(origin),direction:vec(direction)},length);if(!hit)return null;
  const a=this.active,t=hit.target;if(!a)return hit;
  // Friendly crew intercept the beam, but are not valid water/pulse objective targets.
  if(t.kind==='crew'){if(this.clock>(this.crewNotice||-10)+3){this.crewNotice=this.clock;this.ctx.notify('Crew protection: use Scan or Recovery, not water or pulses.');}return hit;}
  const p=a.phase,verb=tool==='water'?'water':'pulse';
  if((p.verb===verb||p.verb==='deter')&&validWorkPose(this.ctx.fleet.position,t,{speed:this.movementSpeed,range:this.profile?.range||38,visible:true})){this.progress(p.verb,t);}
  // Do not suppress the original wildlife response for the actual animal collider.
  return t.kind==='animal'?null:hit;
 }
 fireSpecial(yaw,pitch,xr,dt=1/60){
  if(!this.profile||!['scanner','rescue'].includes(this.selected))return false;this.used=true;if(this.ctx.modal())return true;
  const tool=this.selected,ray=this.makeRay(yaw,pitch,xr),a=this.ctx.fleet.actor,range=tool==='scanner'?this.profile.scan:this.profile.cable;
  const physical=this.ctx.physics.world.castRay(new R.Ray(ray.origin,ray.direction),range,true,undefined,undefined,a.collider,a.body),length=physical?.timeOfImpact??range,hit=this.firstTarget(ray,length);
  const end=ray.origin.clone().addScaledVector(ray.direction,hit?.distance??length);const v=this.beam.geometry.attributes.position;v.setXYZ(0,...ray.origin.toArray());v.setXYZ(1,...end.toArray());v.needsUpdate=true;this.beam.material.color.setHex(tool==='scanner'?0x8cebd2:0xebc16f);this.beamAge=0;
  const active=this.active;this.lastHit=hit?.target.id||null;if(!active||!hit){interruptField(this.s,this.ctx.sceneKey);return true;}
  const p=active.phase,t=hit.target;
  const expected=tool==='rescue'?'rescue':['scan','clear','settle'].includes(p.verb)?p.verb:'scan';
  let valid=validWorkPose(this.ctx.fleet.position,t,{speed:this.movementSpeed,maxSpeed:tool==='rescue'?1.6:2.6,range,minHeight:p.minHeight??-Infinity,visible:true});
  if(p.verb==='clear')valid&&=this.ctx.animals.every(a=>Math.hypot(a.x-22,a.z-24)>8+(a.radius||1));
  if(p.verb==='settle')valid&&=t.actor&&(t.actor.alert||0)<=0&&(t.actor.deter||0)<=0&&!/warning|charging|pursuing|startled/.test(t.actor.mood||'')&&Math.hypot(t.x-this.ctx.fleet.position.x,t.z-this.ctx.fleet.position.z)>8+(t.actor.radius||1);
  if(valid&&p.verb===expected){interruptField(this.s,this.ctx.sceneKey,t.id);this.progress(p.verb,t,dt);}else interruptField(this.s,this.ctx.sceneKey);
  return true;
 }
 candidate(){
  const a=this.active;if(!a||!['report','load','deliver','install','confirm'].includes(a.phase.verb))return null;
  const p=a.phase,t=this.resolve(p.targets[0]),actor=this.ctx.fleet.actor,pos=this.ctx.fleet.position;
  const range=p.radius||3.5,valid=validWorkPose(pos,t,{speed:actor.speed,range,visible:this.visible({x:pos.x,y:pos.y+.3,z:pos.z},t),maxHeight:p.maxHeight??Infinity});if(!valid)return null;
  return {kind:'field',label:p.title,target:t};
 }
 interact(){
  const a=this.active,c=this.candidate();if(!a||!c||this.ctx.modal())return false;const phase=a.phase,p=this.ctx.fleet.position;
  if(['report','install','confirm'].includes(phase.verb)&&this.ctx.fleet.mode!=='foot'){this.ctx.notify('Park, step out, and do this work on foot.');return true;}
  if(['load','deliver'].includes(phase.verb)&&!a.mission.vehicles.includes(this.ctx.fleet.mode)){this.ctx.notify('Bring an assignment vehicle alongside before loading or unloading.');return true;}
  let carrier=this.ctx.fleet.current?.id;
  if(phase.verb==='install'){const v=this.ctx.fleet.vehicles.find(v=>v.id===a.record.cargo?.carrier);if(!v||vec(v.drive.position).distanceTo(vec(p))>12){this.ctx.notify('Park the vehicle carrying the pack within 12 m before installation.');return true;}carrier=v.id;}
  if(phase.verb==='report')this.ctx.tools.refill();this.progress(phase.verb,c.target,0,{carrier});return true;
 }
 tick(dt){
  this.clock+=dt;this.ensureEntities();if(!this.used||dt===0)interruptField(this.s,this.ctx.sceneKey);this.used=false;
  this.beamAge+=dt;this.beam.visible=this.beamAge<.1;this.beam.material.opacity=Math.max(0,1-this.beamAge/.1);
  const a=this.active;for(const [id,e] of this.entities){const loaded=a?.mission.stages.slice(0,a.record.stage).some(p=>['rescue','load'].includes(p.verb)&&p.targets.some(t=>t.id===id));e.model.visible=!loaded;
   const done=a&&a.mission.stages.slice(0,a.record.stage).some(p=>p.targets.some(t=>t.id===id));e.lamp.material.color.setHex(done?0x83dab0:0xffbc58);
   e.sign.rotation.y=Math.atan2(this.ctx.fleet.position.x-e.target.x,this.ctx.fleet.position.z-e.target.z);
  }
  for(const [id,r] of this.rigs){r.dish.rotation.y+=dt*.7;r.cargo.visible=Object.values(this.s.records).some(rec=>rec.cargo?.carrier===id);}
 }
 hud(){
  const a=this.active,p=this.profile;this.status.textContent=p?`${p[this.selected]} / ${a?(a.record.units[this.lastHit]||0).toFixed(1)+' progress / '+a.phase.title:'RB: next attachment / Scan and Recovery are mounted tools'}`:'Board a vehicle to use its scanner and recovery rig. N: field assignments.';
  for(const id of UTILITY_ORDER){const b=$('field-'+id);b.disabled=!p&&['scanner','rescue'].includes(id);b.setAttribute('aria-pressed',String(id===this.selected));}
  if(p&&['scanner','rescue'].includes(this.selected)){$('tool-name').textContent=p[this.selected];$('ammo').textContent='READY';$('reload-status').textContent='Hold RT steadily / clear line of sight';}
 }
 snapshot(){const a=this.active;return {build:FIELD_BUILD,scene:this.ctx.sceneKey,total:this.list.length,active:this.s.active,phase:a?.phase.verb||null,stage:a?.record.stage??null,units:{...a?.record.units},done:[...(a?.record.done||[])],cargo:a?.record.cargo?{...a.record.cargo}:null,selected:this.selected,mountCount:this.rigs.size,commendations:this.s.commendations,records:JSON.parse(JSON.stringify(this.s.records)),task:this.task(),hardwareVerified:false};}
}
