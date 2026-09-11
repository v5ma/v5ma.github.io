/* Same-map dusk lighting. Reuses the already licensed local lantern mesh.
 * At most three non-shadow point lights; Battery uses emissive cues instead. */
import * as T from './vendor/three.module.js';
import {updateLightPool} from './light-pool.mjs';
import {heightAt} from './model.mjs';
import {clockInfo,lampMask,LAMPS,SERVICES} from './city-core.mjs';
import {label} from './art.mjs';
export function createCityArt({scene,root,w,ambient,sun,sky,clouds,streetArt,camera}){
  const group=new T.Group();group.name='Lantern Hours street circuit';scene.add(group);
  const poleGeo=new T.CylinderGeometry(.055,.085,2.75,6),poleMat=new T.MeshStandardMaterial({color:'#655441',roughness:.86});
  const ringGeo=new T.TorusGeometry(.52,.025,4,20),ringMat=new T.MeshBasicMaterial({color:'#bdb3eb',transparent:true,opacity:.65});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,30);gradient.addColorStop(0,'#fff2bd');gradient.addColorStop(.16,'#ffc980a0');gradient.addColorStop(1,'#ffc98000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const glowTexture=new T.CanvasTexture(canvas);glowTexture.colorSpace=T.SRGBColorSpace;
  const glowMat=new T.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending,color:'#ffcf91'});
  const posts=[];const glowSources=[];
  for(const p of LAMPS){
    const g=new T.Group();g.position.set(p.x,heightAt(p.x,p.z),p.z);group.add(g);
    const pole=new T.Mesh(poleGeo,poleMat);pole.position.y=1.35;g.add(pole);
    const glow=new T.Sprite(glowMat);glow.position.set(0,2.55,.12);glow.scale.set(1.4,1.4,1.4);g.add(glow);
    const ring=new T.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.18;g.add(ring);
    const tag=label(g,p.name+'\nNEARBY / I',0,3.25,0,2.1,.65,0,'#34464e');
    posts.push({p,g,glow,ring,tag,loaded:false});
  }
  // Glows share one texture/material; positions match existing licensed sconces.
  for(const h of w.houses){const pos=new T.Vector3(h.x-h.side*(h.w/2+.35),heightAt(h.x,h.z)+2.7,h.z+2.2),glow=new T.Sprite(glowMat);glow.position.copy(pos);glow.scale.set(.95,.95,.95);group.add(glow);glowSources.push({pos,glow,room:null});}
  for(const r of w.rooms){const pos=new T.Vector3(r.x+r.side*(r.hx-1),heightAt(r.x,r.z)+2.2,r.z-r.hz+1),glow=new T.Sprite(glowMat);glow.position.copy(pos);glow.scale.set(.8,.8,.8);group.add(glow);glowSources.push({pos,glow,room:r.id});}
  const points=Array.from({length:3},()=>{const light=new T.PointLight('#ffd099',0,12,1.6);light.castShadow=false;scene.add(light);return light;});
  const starPosition=[];for(let i=0;i<90;i++){const a=i*2.39996,z=.18+(i%23)/30,r=Math.sqrt(1-z*z);starPosition.push(Math.cos(a)*r*800,z*800,Math.sin(a)*r*800);}
  const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(starPosition,3));const stars=new T.Points(starGeo,new T.PointsMaterial({color:'#e4f1ef',size:1.8,transparent:true,depthWrite:false,fog:false,opacity:0}));scene.add(stars);
  const topDay=new T.Color('#218cc9'),topDusk=new T.Color('#53648e'),topNight=new T.Color('#142a46'),horizonDay=new T.Color('#dce9d5'),horizonDusk=new T.Color('#e7aa7e'),horizonNight=new T.Color('#57788b');
  const sunDay=new T.Color('#ffe2af'),sunDusk=new T.Color('#ffc28b'),sunNight=new T.Color('#9dbce2');
  const fogDay=new T.Color('#b8cebd'),fogNight=new T.Color('#476278');let pane=null,loaded=0,last={};
  function update(s,dt,room,quality){
    const time=clockInfo(s.city),day=time.daylight,night=1-day,below=!!s.life.inside||!!s.doors?.level,mask=lampMask(s.city);const dusk=time.phase==='Evening'||time.phase==='Dawn';
    sky.material.uniforms.top.value.copy(topNight).lerp(dusk?topDusk:topDay,day);
    sky.material.uniforms.bottom.value.copy(horizonNight).lerp(dusk?horizonDusk:horizonDay,day);
    ambient.intensity=below?1.0:.68+.17*day;ambient.color.set(below?'#e3cfa6':day>.7?'#bdd3de':'#a1b7d4');
    sun.intensity=below?.65:.28+2.82*day;sun.color.copy(sunNight).lerp(dusk?sunDusk:sunDay,day);
    const floor=heightAt(s.x,s.z)+(below?-5:0);sun.position.set(s.x-45,floor+35+40*day,s.z-50);sun.target.position.set(s.x,floor,s.z+20);
    if(scene.fog&&!below)scene.fog.color.copy(fogNight).lerp(fogDay,day);
    clouds.forEach(c=>{c.material.opacity=.3+.45*day;c.material.color.set(dusk?'#f3d4bc':'#ffffff');});
    stars.visible=!below;stars.position.copy(camera.position);stars.material.opacity=night*.8;
    group.visible=!below;
    if(!pane&&streetArt.inspect().ready)scene.traverse(o=>{if(o.isMesh&&o.material.name==='Recessed window backing')pane=o.material;});
    if(pane){pane.emissive.set('#e8ae64');pane.emissiveIntensity=night*.28;}
    const candidates=[];
    for(const [i,p] of posts.entries()){
      if(!p.loaded){const model=streetArt.cloneAsset('props/Lantern_Wall');if(model){model.scale.setScalar(.5);model.position.set(0,2.4,0);p.g.add(model);p.loaded=true;loaded++;}}
      const d=Math.hypot(s.x-p.p.x,s.z-p.p.z);p.g.visible=d<100;
      const on=s.city.circuit>0&&!!(mask&(1<<i));p.glow.visible=on;p.glow.scale.setScalar(.9+night*.65);
      p.ring.visible=s.city.circuit>0&&s.city.circuit<3&&d<18;p.tag.visible=p.ring.visible&&d<7;p.tag.quaternion.copy(camera.quaternion);
      if(on&&!below)candidates.push({pos:new T.Vector3(p.p.x,heightAt(p.p.x,p.p.z)+2.5,p.p.z),d,inside:false});
    }
    for(const g of glowSources){const d=Math.hypot(g.pos.x-s.x,g.pos.z-s.z);g.glow.visible=!below&&d<60&&(night>.07||g.room===room?.id);if(g.glow.visible&&(!g.room||g.room===room?.id))candidates.push({...g,d,inside:!!g.room});}
    // Interior sources do not get culled with the outdoor world during a cellar visit.
    if(room){const y=heightAt(room.x,room.z)+(below?-5:0)+2.2;candidates.unshift({pos:new T.Vector3(room.x, y,room.z-2),d:0,inside:true});}
    candidates.sort((a,b)=>a.d-b.d);const budget=quality==='high'?3:quality==='balanced'?1:0;
    const lit=updateLightPool(points,candidates,budget,night);
    last={phase:time.phase,time:time.text,daylight:day,pointLights:lit,pointLightBudget:budget,loadedLanterns:loaded,litCircuitLamps:[0,1,2].filter(i=>s.city.circuit>0&&(mask&(1<<i))).length,below};
  }
  return {update,inspect:()=>({...last})};
}
