/* Local CC0 animated cast. Rendering only: no actor, health, inventory or save writes. */
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {cloneRig,prepareRig,disposeInstance,disposeRig} from './cast-rig.mjs';
import {skyglassBudget} from './skyglass-shaders.mjs';
export const CAST_FILES=Object.freeze({courier:'courier.glb',guard:'guard.glb',officer:'officer.glb'});
export function actorRole(actor){return actor.id==='tavi'?'courier':actor.id==='surveyor'||['marshal','longshot'].includes(actor.kind)?'officer':'guard';}
export function actorPose(actor,dead=false){if(dead)return 'Death';if(actor.stun>0)return 'HitRecieve';const friendly=actor.id==='tavi'||actor.id==='surveyor';if(actor.walking)return !friendly&&actor.awareness>0?'Run_Shoot':'Walk';if(friendly&&actor.offer)return 'Wave';return friendly?'Idle_Neutral':'Idle_Gun_Pointing';}
export function installCast({scene,load,autoLoad=true}){
 const root=new T.Group();root.name='Skyglass animated cast';scene.add(root);
 const rigs=new Map(),slots=[],visible=new Set(),errors=[],loader=new GLTFLoader();let enabled=true,disposed=false,mode='balanced',xr=false,frames=0;
 const loadModel=load||((role)=>loader.loadAsync(new URL('./art/characters/'+CAST_FILES[role],import.meta.url).href));
 const status={courier:'pending',guard:'pending',officer:'pending'};
 // Shared accessories remain separate from the downloaded model's geometry/materials.
 const box=new T.BoxGeometry(1,1,1),tube=new T.CylinderGeometry(1,1,1,8),gold=new T.MeshStandardMaterial({color:'#c2a264',roughness:.4,metalness:.65}),steel=new T.MeshStandardMaterial({color:'#233e49',roughness:.58,metalness:.45});
 const vector=new T.Vector3();
 scene.userData.castHas=id=>enabled&&visible.has(id);
 async function loadAll(){await Promise.all(Object.keys(CAST_FILES).map(async role=>{status[role]='loading';try{const rig=prepareRig(await loadModel(role));if(disposed){disposeRig(rig);return;}rigs.set(role,rig);status[role]='ready';}catch(error){status[role]='failed';errors.push(role+': '+String(error.message||error));}}));}
 function makeSlot(role){const rig=rigs.get(role),model=cloneRig(rig.source),wrapper=new T.Group();wrapper.name='Animated '+role;wrapper.add(model);root.add(wrapper);const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(rig.clips.map(c=>[c.name,mixer.clipAction(c)]));
  for(const name of ['Death','Gun_Shoot','HitRecieve']){actions[name].setLoop(T.LoopOnce,1);actions[name].clampWhenFinished=true;}
  actions.Idle_Gun_Pointing.reset().play();mixer.update(0);wrapper.updateMatrixWorld(true);
  // A gun extension follows the animated wrist, not the camera or gameplay ray.
  let extension=null;const hand=model.getObjectByName('WristR');
  if(role!=='courier'&&hand){extension=new T.Group();extension.name='Original longglass attachment';extension.position.set(-.14,1.39,.79);const barrel=new T.Mesh(tube,steel);barrel.rotation.x=Math.PI/2;barrel.scale.set(.035,.5,.035);barrel.position.z=.20;extension.add(barrel);const optic=new T.Mesh(tube,gold);optic.rotation.x=Math.PI/2;optic.scale.set(.067,.26,.067);optic.position.set(0,.12,-.1);extension.add(optic);model.add(extension);model.updateMatrixWorld(true);hand.attach(extension);}
  mixer.stopAllAction();const slot={role,model,wrapper,mixer,actions,action:null,id:null,lastHp:100,hitUntil:0,deadUntil:0,shotUntil:0,lastAttack:Infinity,lastX:0,lastZ:0,extension};slots.push(slot);return slot;
 }
 function select(slot,name,force=false){const next=slot.actions[name]||slot.actions.Idle_Neutral;if(slot.action===next&&!force)return;const old=slot.action;next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(old&&old!==next){old.fadeOut(.16);next.fadeIn(.16);}slot.action=next;slot.pose=name;}
 function free(slot){slot.mixer.stopAllAction();slot.id=null;slot.wrapper.visible=false;slot.action=null;slot.pose=null;slot.deadUntil=slot.hitUntil=slot.shotUntil=0;}
 function update(s,dt,{menu=false,reduced=false,mode:quality='balanced',xr:immersive=false}={}){
  mode=quality;xr=immersive;visible.clear();frames++;const budget=skyglassBudget(mode,xr),now=s.time;
  if(!enabled||menu){slots.forEach(free);return;}
  const candidates=[];
  for(const e of s.drones){if(!e.humanoid)continue;const old=slots.find(v=>v.id===e.id);if(e.hp<=0&&!(old&&old.lastHp>0||old?.deadUntil>now))continue;const d=Math.hypot(e.x-s.p.x,e.y-s.p.y,e.z-s.p.z);if(d<=budget.castRange)candidates.push({actor:e,d,feet:e.y-1.05});}
  const companion=s.skirmish?.companion;if(companion&&Math.hypot(companion.x-s.p.x,companion.y-s.p.y,companion.z-s.p.z)<budget.castRange){const old=slots.find(v=>v.id==='tavi'),moving=old&&Math.hypot(companion.x-old.lastX,companion.z-old.lastZ)>.004;candidates.push({actor:{...companion,id:'tavi',hp:100,walking:!!moving&&!companion.flying,offer:!!s.skirmish.offer},d:-2,feet:companion.y});}
  const escort=s.expedition?.escort;if(escort&&Math.hypot(escort.x-s.p.x,escort.y-s.p.y,escort.z-s.p.z)<budget.castRange)candidates.push({actor:{...escort,id:'surveyor',hp:100},d:-1,feet:escort.y});
  candidates.sort((a,b)=>a.d-b.d);const selected=candidates.filter(c=>rigs.has(actorRole(c.actor))).slice(0,budget.castLimit),ids=new Set(selected.map(c=>c.actor.id));
  for(const slot of slots)if(slot.id&&!ids.has(slot.id))free(slot);
  for(const {actor:a,feet}of selected){const role=actorRole(a);let slot=slots.find(v=>v.id===a.id);
   if(!slot){slot=slots.find(v=>!v.id&&v.role===role);if(!slot&&slots.length<12)slot=makeSlot(role);if(!slot){const replace=slots.find(v=>!v.id);if(replace){replace.mixer.uncacheRoot(replace.model);disposeInstance(replace.wrapper);slots.splice(slots.indexOf(replace),1);slot=makeSlot(role);}}
    if(!slot)continue;slot.id=a.id;slot.lastHp=a.hp;slot.lastAttack=a.attack??Infinity;slot.wrapper.name='Cast / '+a.id;select(slot,actorPose(a));
   }
   if(a.hp<=0&&slot.lastHp>0){slot.deadUntil=now+1.6;select(slot,'Death',true);}else if(a.hp>0&&a.hp<slot.lastHp){slot.hitUntil=now+.30;select(slot,'HitRecieve',true);}
   if(a.hp>0&&Number.isFinite(a.attack)&&a.attack>slot.lastAttack+.8){slot.shotUntil=now+.22;if(slot.hitUntil<=now)select(slot,'Gun_Shoot',true);}slot.lastAttack=a.attack??Infinity;
   let pose=a.hp<=0?'Death':slot.hitUntil>now?'HitRecieve':slot.shotUntil>now?'Gun_Shoot':actorPose(a);select(slot,pose);
   const rig=rigs.get(role),height=a.kind==='breacher'?2.14:role==='courier'?1.88:1.99,k=height/rig.height;slot.model.scale.setScalar(k);slot.model.position.set(-rig.centerX*k,-rig.feet*k,0);slot.wrapper.position.set(a.x,feet,a.z);slot.wrapper.rotation.y=Math.PI-(a.heading||0);slot.wrapper.visible=true;
   if(slot.extension)slot.extension.visible=a.kind==='longshot';const gun=slot.model.getObjectByName('Pistol');if(gun)gun.visible=a.id!=='surveyor';
   slot.mixer.update(Math.min(.08,Math.max(0,Number.isFinite(dt)?dt:0)));slot.wrapper.updateMatrixWorld(true);slot.lastHp=a.hp;slot.lastX=a.x;slot.lastZ=a.z;visible.add(a.id);
  }
 }
 const ready=autoLoad?loadAll():Promise.resolve();
 return {ready,loadAll,update,setEnabled(value){enabled=!!value;if(!enabled){visible.clear();slots.forEach(free);}},stats:()=>({enabled,status:{...status},errors:errors.slice(),active:visible.size,allocated:slots.length,limit:skyglassBudget(mode,xr).castLimit,mode,xr,frames,actors:slots.filter(v=>v.id&&v.wrapper.visible).map(v=>({id:v.id,model:v.role,pose:v.pose,animationTime:v.action?.time||0}))}),dispose(){disposed=true;visible.clear();delete scene.userData.castHas;for(const v of slots){v.mixer.uncacheRoot(v.model);disposeInstance(v.wrapper);}for(const rig of rigs.values())disposeRig(rig);box.dispose();tube.dispose();gold.dispose();steel.dispose();root.removeFromParent();}};
}
