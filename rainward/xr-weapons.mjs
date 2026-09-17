import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
/* Licensed meshes do not grant inventory or replace ballistic authority. */
export function createXRWeapons(){
 const root=new T.Group(),fallback=new T.Group();root.name='Rainward held weapon';root.add(fallback);
 const material=new T.MeshStandardMaterial({color:0x596362,roughness:.65}),body=new T.Mesh(new T.BoxGeometry(.075,.095,.28),material);body.position.set(0,.025,-.12);fallback.add(body);
 const grip=new T.Mesh(new T.BoxGeometry(.052,.11,.065),material);grip.position.set(0,-.06,-.05);grip.rotation.x=.2;fallback.add(grip);
 const barrel=new T.Mesh(new T.CylinderGeometry(.018,.018,.18,12),material);barrel.rotation.x=Math.PI/2;barrel.position.z=-.28;fallback.add(barrel);
 const loaded=new Map(),pending=new Set(),errors={};let disposed=false,equipped='pistol';
 function load(name){if(pending.has(name)||loaded.has(name)||errors[name])return;pending.add(name);
  const loader=new GLTFLoader();loader.load(new URL('./assets/freefield-weapons/'+name+'.glb',import.meta.url).href,gltf=>{
   pending.delete(name);if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return;}
   const model=gltf.scene;model.rotation.y=Math.PI;model.scale.setScalar(name==='pistol'?.8:.65);model.position.set(0,.025,-.06);model.visible=false;root.add(model);loaded.set(name,model);
  },undefined,e=>{pending.delete(name);errors[name]=String(e?.message||'Weapon asset failed; fallback remains');});
 }
 function update(player,{visible=true}={}){equipped=player.equipped||'pistol';const gun=['pistol','rifle'].includes(equipped);root.visible=visible&&gun&&player.waterMode!=='swim';if(root.visible)load(equipped);for(const [name,model]of loaded)model.visible=name===equipped;fallback.visible=!loaded.has(equipped);fallback.scale.z=equipped==='rifle'?1.8:1;root.rotation.x=player.reload>0?-.25:Math.min(.09,(player.shotCD||0)*.3);}
 return {root,update,stats:()=>({equipped,visible:root.visible,loaded:[...loaded.keys()],pending:pending.size,fallback:fallback.visible,errors:{...errors}}),dispose(){disposed=true;const gs=new Set(),ms=new Set(),ts=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());root.removeFromParent();}};
}
