/* Independent skeleton/mixer per visible actor. Geometry remains shared.
 * No production model imports: this module consumes presentation snapshots. */
import * as T from './vendor/three.module.js';
import {fabricMaterial} from './aurora-shaders.mjs';
export function cloneRig(source){
 const copy=source.clone(true),pairs=new Map(),skeletons=new Map();
 function match(a,b){pairs.set(a,b);if(a.children.length!==b.children.length)throw Error('Rig clone topology mismatch');a.children.forEach((c,i)=>match(c,b.children[i]));}match(source,copy);
 for(const [a,b]of pairs){if(!a.isSkinnedMesh)continue;
  const bones=a.skeleton.bones.map(bone=>{const c=pairs.get(bone);if(!c)throw Error('Rig bone is outside clone root');return c;});
  if(!skeletons.has(a.skeleton))skeletons.set(a.skeleton,new T.Skeleton(bones,a.skeleton.boneInverses.map(m=>m.clone())));b.skeleton=skeletons.get(a.skeleton);b.bindMatrix.copy(a.bindMatrix);b.bindMatrixInverse.copy(a.bindMatrixInverse);b.bindMode=a.bindMode;
  // Animated extremities can exceed bind-pose bounds. Distance budgets handle culling.
  b.frustumCulled=false;
 }
 return copy;
}
export function makeActor(template,role='guard',variant='warden'){
 const body=cloneRig(template.scene),root=new T.Group();root.name='Aurora '+role;root.add(body);
 const owned=new Map(),accent=variant==='longshot'?'#9b91c9':variant==='breacher'?'#b18b5a':'#5e909a';
 body.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
  const convert=m=>{if(!owned.has(m)){const c=fabricMaterial(m,{accent});
   if(role==='guard'&&m.name==='Swat')c.color.set(accent);
   if(role==='courier'&&/^(Green|LightGreen)$/.test(m.name))c.color.set(m.name==='Green'?'#214958':'#478c8e');
   if(role==='courier'&&m.name==='White')c.color.set('#eee2c4');
   if(role==='worker'&&m.name==='Worker_Vest')c.color.set('#3c7e85');
   if(/Gold|Visor/.test(m.name)){c.metalness=.6;c.roughness=.24;}
   owned.set(m,c);}return owned.get(m);};
  o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
 });
 const mixer=new T.AnimationMixer(body),clips=new Map(template.animations.map(c=>[c.name,c])),actions=new Map();
 let current='',clock=0,deadAt=null,last=null,until=0,override='',disposed=false;
 // Measured model heights 1.79-1.83 m. A ~1.9 m target keeps head/torso aligned
 // with the unchanged simulation spheres. Heavies keep the same height, wider armor.
 const box=new T.Box3().setFromObject(body),height=box.max.y-box.min.y;
 if(!Number.isFinite(height)||height<.5||height>4)throw Error('Invalid imported actor height');
 const scale=(role==='courier'?1.8:1.92)/height;body.scale.set(scale,scale,scale);body.position.y=-box.min.y*scale;body.rotation.y=Math.PI;
 function play(name,once=false){if(!clips.has(name))name='Idle';if(current===name)return;
  let action=actions.get(name);if(!action){action=mixer.clipAction(clips.get(name));actions.set(name,action);}const old=actions.get(current);
  action.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.enabled=true;action.setEffectiveWeight(1);action.play();if(old){old.fadeOut(.16);action.fadeIn(.16);}current=name;
 }
 play(role==='guard'?'Idle_Gun_Pointing':'Idle');mixer.update(0);
 function effect(type){if(disposed||deadAt!==null)return;if(type==='hit'){override='HitRecieve';until=clock+.32;current='';}if(type==='shot'){override='Idle_Gun_Shoot';until=clock+.28;}if(type==='offer'){override='Wave';until=clock+.8;}}
 function update(actor,dt,{time=0,reduced=false,rich=true,animate=true,shadow=true}={}){
  if(disposed)return;clock+=Math.max(0,Math.min(dt,.15));
  const isDead=role==='guard'&&actor.hp<=0;
  if(isDead&&deadAt===null){deadAt=time;play('Death',true);}
  if(isDead){root.visible=time-(deadAt??time)<1.7;if(animate)mixer.update(dt);return;}
  const floor=role==='guard'?actor.y-1.05:actor.y;
  root.position.set(actor.x,floor,actor.z);root.rotation.y=-(actor.heading||0);root.scale.set(variant==='breacher'?1.22:1,1,variant==='breacher'?1.15:1);
  const move=last&&dt>0?Math.hypot(actor.x-last.x,actor.z-last.z)/dt:0;
  const walking=actor.walking||move>.12;
  if(override&&clock>=until)override='';
  const next=override||(role==='guard'?(actor.stun>0?'HitRecieve':walking?'Run_Shoot':actor.telegraph>.25?'Idle_Gun_Pointing':'Idle_Gun_Pointing'):(actor.offer?'Wave':walking?(move>3.4?'Run':'Walk'):'Idle'));
  play(next,false);
  if(animate&&!(reduced&&!walking&&role!=='guard'&&!override&&!actor.offer))mixer.update(Math.max(0,Math.min(.15,dt)));
  for(const m of owned.values())m.userData.auroraRim.value=rich?.028:0;
  body.traverse(o=>{if(o.isMesh)o.castShadow=shadow;});
  last={x:actor.x,z:actor.z};root.visible=true;
 }
 return{root,body,mixer,role,variant,update,effect,stats:()=>({role,variant,clip:current,clock,dead:deadAt!==null,visible:root.visible,actions:actions.size}),dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(body);const skeletons=new Set();body.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());owned.forEach(m=>m.dispose());root.removeFromParent();}};
}
