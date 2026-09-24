/* Currentworks applied to Aether's existing world. One renderer, one host clock,
 * no gameplay/save/input owner. Vendor files are byte-identical upstream copies.
 * The sole material adaptation clips decorative water to the actual hazard disc
 * and preserves its charged cue. Waves are flattened by mesh transform only. */
import * as T from './vendor/three.module.js';
import Water from './vendor/currentworks/water.mjs';
import Trees from './vendor/currentworks/trees.mjs';
import Cloudlets from './vendor/currentworks/cloudlets.mjs';
import Toon from './vendor/currentworks/toon.mjs';
import {CURRENTWORKS_TREES,CURRENTWORKS_CLOUDS,CURRENTWORKS_CLOUD_SCALE,currentworksQuality} from './currentworks-layout.mjs';
export function createCurrentworks({scene,patches,foliageFallback}){
 const root=new T.Group();root.name='Aether Currentworks environment';root.visible=false;scene.add(root);
 const style=Toon.create(T,{bands:[.30,.53,.76,1]}),cloudMat=style.material({color:0xd3e1e4,vertexColors:true,fog:false});
 const clouds=Cloudlets.create(T,{clouds:CURRENTWORKS_CLOUDS,material:cloudMat,near:14,far:35});clouds.group.scale.setScalar(CURRENTWORKS_CLOUD_SCALE);root.add(clouds.group);
 const forest=Trees.create(T,{trees:CURRENTWORKS_TREES,hideInAR:false,windStrength:.22,near:22,far:52});root.add(forest.group);
 const waters=[];const viewer=new T.Vector3(),point=new T.Vector3();let enabled=true,ready=false,disposed=false,error=null,clock=0,immersive=false,draws=0;const drawn={water:0,trees:0,clouds:0};
 // Observe actual draws, not just loaded objects or a DOM flag. Per-object
 // hooks coexist with the portal's independent per-material hook.
 function recordDraw(o,kind){const before=o.onAfterRender;o.onAfterRender=function(...args){before?.apply(this,args);draws++;drawn[kind]++;};}
 for(const item of patches.values()){
  if(item.p.type!=='water')continue;
  const p=item.p,water=Water.create(T,{width:p.r*2,length:p.r*2,centerZ:0,level:0,depth:.9,shoreDepth:.06,preset:'lagoon',quality:'light',seed:301+waters.length});
  water.mesh.position.set(p.x,p.y+.04,p.z);water.mesh.scale.y=.2;water.mesh.name='Currentworks / '+p.id;
  const charge={value:0},material=water.material;
  material.uniforms.aetherWaterRadius={value:p.r};material.uniforms.aetherWaterCharge=charge;
  material.fragmentShader='uniform float aetherWaterRadius,aetherWaterCharge;\n'+material.fragmentShader.replace('void main(){','void main(){if(length(vLocal.xz)>aetherWaterRadius)discard;').replace('#include <tonemapping_fragment>','gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.13,.60,.88),aetherWaterCharge*.38);\n#include <tonemapping_fragment>');
  root.add(water.mesh);waters.push({water,item,charge,p});
 }
 for(const {water}of waters)recordDraw(water.mesh,'water');
 forest.group.traverse(o=>{if(o.isMesh)recordDraw(o,'trees');});
 clouds.group.traverse(o=>{if(o.isMesh)recordDraw(o,'clouds');});
 function restore(){root.visible=false;if(foliageFallback)foliageFallback.visible=true;for(const {item}of waters)item.mesh.visible=true;}
 async function prepare(renderer,camera){
  if(disposed||ready)return;
  try{
   // The library's bounded loading warmup is revalidated against Aether r177.
   // No animation loop exists yet when the application awaits this method.
   await forest.prepare(renderer,camera,scene);
   if(disposed)return;
   // Compile Aether's water and cloud material variants with its own lights.
   // Actual buffers are exercised by the ordinary title/game render.
   const old=root.visible;root.visible=true;
   // The sky/art loaders can replace and dispose unrelated host materials
   // while r177 compileAsync polls programs. Own only this group's material
   // set; the third argument still supplies the real city lights/environment.
   try{if(renderer.compileAsync)await renderer.compileAsync(root,camera,scene);else renderer.compile(root,camera,scene);}
   finally{root.visible=old;}
   if(!disposed){ready=true;root.visible=enabled;}
  }catch(e){error=String(e?.message||e);restore();}
 }
 function update(state,{mode='balanced',xr=false,reduced=false,eye=null}={}){
  if(disposed)return;
  clock=Number.isFinite(state?.time)?state.time:clock;immersive=!!xr;
  if(!ready||!enabled){restore();return;}
  root.visible=true;if(foliageFallback)foliageFallback.visible=false;
  const p=eye||state?.p||{x:0,y:0,z:0};viewer.set(p.x,p.y,p.z);
  const q=currentworksQuality(mode,xr),frame={time:clock,viewer:viewer.toArray(),quality:q.trees,quiet:!!reduced,xr:!!xr,ar:!!xr,visible:true};
  forest.update(frame);clouds.update({...frame,quality:q.clouds});
  for(const {water,item,charge,p}of waters){
   // Keep an inexpensive original surface at distance. Both variants preserve
   // the same disc/ring and never claim to change collision or hazard radius.
   const near=viewer.distanceToSquared(point.set(p.x,p.y,p.z))<95*95;
   item.mesh.visible=!near;water.update({time:clock,quality:q.water,quiet:!!reduced,xr:!!xr,visible:near,opacity:1});
   charge.value=state?.tactics?.hazards?.[p.id]>0?1:0;
  }
 }
 function effect(e){
  if(!ready||!enabled||disposed||!['shot','tactical-cast'].includes(e?.type)||!e.end)return;
  for(const {water,p}of waters){
   if(!water.stats.visible||Math.abs(e.end.y-(p.y+.04))>.24||Math.hypot(e.end.x-p.x,e.end.z-p.z)>p.r)continue;
   water.mesh.updateWorldMatrix(true,false);point.set(e.end.x,e.end.y,e.end.z);water.mesh.worldToLocal(point);water.splash(point.x,point.z,.32,.17);
  }
 }
 function dispose(){if(disposed)return;restore();disposed=true;for(const {water}of waters)water.dispose();forest.dispose();clouds.dispose();style.dispose();root.removeFromParent();}
 return {prepare,update,effect,dispose,setEnabled(v){enabled=!!v;if(!enabled)restore();},
  stats:()=>({version:'0.17.0',engine:T.REVISION,enabled,ready,disposed,error,time:clock,xr:immersive,draws,drawn:{...drawn},active:ready&&enabled&&!disposed,renderTargets:0,
   water:waters.map(({water,p,charge})=>({id:p.id,radius:p.r,charged:charge.value===1,...water.stats})),trees:forest.stats,clouds:clouds.stats,
   modules:{water:Water.VERSION,trees:Trees.VERSION,cloudlets:Cloudlets.VERSION,toon:Toon.VERSION},ownsGameplay:false,ownsInput:false,ownsStorage:false})};
}
