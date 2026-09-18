/* Temporarily present the actual complete scene. Region updates still run in
 * original coordinates; all parents/order/visibility are restored in finally. */
import * as T from './vendor/three.module.js';
import {QUARTER_BOUNDS} from './quarter-data.mjs';
export function createWorldView(view,getState){
 const root=new T.Group();root.name='Live game presentation';let adopted=[],hidden=[],fades=[],cutaways=[],lastCutaways=[];const copies=new WeakMap(),ray=new T.Raycaster();
 const quarter=view.spatial;
 function avatar(){let result=null;view.scene.traverse(o=>{if(o.userData.guildControlled&&visible(o))result=o;});return result;}
 function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
 function anchor(){const s=getState(),a=avatar();return {x:s.x,y:a?a.getWorldPosition(new T.Vector3()).y:(s.quarter?.groundY||0)+(s.lift||0),z:s.z};}
 function acquire(mode){
  if(adopted.length)throw Error('Nested world presentation');
  lastCutaways=[];const a=avatar();if(mode==='first-person'&&a)hidden.push([a,a.visible]);quarter?.setPresentation(mode==='diorama'?'desktop':mode);
  if(mode==='diorama'&&a){const seen=new Set();a.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(seen.has(m))continue;seen.add(m);fades.push([m,m.opacity,m.transparent,m.depthWrite]);m.opacity=1;m.transparent=false;m.depthWrite=true;}});}
  view.scene.traverse(o=>{if(o.userData.xrBackdrop){hidden.push([o,o.visible]);o.visible=false;}if(mode==='first-person'&&o===a)o.visible=false;});
  adopted=[...view.scene.children];for(const o of adopted)root.add(o);return root;
 }
 function reveal(eyes,center,scale,clone=m=>m.clone(),up=new T.Vector3(0,1,0)){
  // A physical observer cannot follow the original collision-shortened camera
  // boom. Fade only intervening, non-instanced architectural pieces so the
  // character remains readable; never change collision or the scene outside XR.
  const obstruction=new Set();root.updateWorldMatrix(true,true);
  const person=o=>{for(let p=o;p&&p!==root;p=p.parent)if(p.guildRig||p.userData.guildControlled)return true;return false;};
  const candidates=[];root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!visible(o)||person(o))return;const materials=Array.isArray(o.material)?o.material:[o.material];if(!materials.some(m=>!m||m.isShaderMaterial||m.opacity<.3))candidates.push(o);});
  for(const eye of eyes)for(const height of [.35,1,1.65]){
   const target=center.clone().addScaledVector(up,height*scale),direction=target.sub(eye),distance=direction.length();if(distance<.01)continue;
   ray.set(eye,direction.normalize());ray.near=.005;ray.far=distance-.01;
   for(const h of ray.intersectObjects(candidates,false))if(obstruction.size<12)obstruction.add(h.object);
  }
  for(const o of obstruction){const original=o.material;const fade=m=>{let c=copies.get(m);if(!c){c=clone(m);c.transparent=true;c.depthWrite=false;copies.set(m,c);const dispose=()=>{c.dispose();copies.delete(m);m.removeEventListener('dispose',dispose);};m.addEventListener('dispose',dispose);}c.opacity=m.opacity*.10;return c;};o.material=Array.isArray(original)?original.map(fade):fade(original);cutaways.push([o,original]);lastCutaways.push(o.name||o.type);}
 }
 function release(){for(const [o,m]of cutaways)o.material=m;cutaways=[];for(const o of adopted)view.scene.add(o);adopted=[];quarter?.setPresentation('desktop');for(const [o,v]of hidden)o.visible=v;hidden=[];for(const [m,opacity,transparent,depthWrite]of fades){m.opacity=opacity;m.transparent=transparent;m.depthWrite=depthWrite;}fades=[];}
 return {root,reveal,occluders:()=>[...lastCutaways],bounds:QUARTER_BOUNDS,available:()=>true,anchor,acquire,release,background:()=>view.scene.background?.isColor?view.scene.background:new T.Color('#9bcceb'),blocked:(x,z,r)=>view.headBlocked?.(x,z,r)||false,scope:()=>getState().quarter?.active?'Waterwheel Quarter':getState().frontier?.zone==='badlands'?'Cinder Hollow / Stillwater':'Vinci / households / vehicles',setPresentation:v=>quarter?.setPresentation(v),setSkipRender:v=>quarter?.setSkipRender(v)};
}
